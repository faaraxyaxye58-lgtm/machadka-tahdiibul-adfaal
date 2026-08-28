import { db, COLLECTIONS, saveItemToFirestore, sanitizeForFirestore } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Student,
  SchoolSettings,
  StudentExitNotificationSettings,
  PushNotificationItem,
  ShiftNotificationConfig,
} from '../types';
import { sendSMS, normalizeSomaliaPhoneNumber } from './smsService';

// Default 3 Notification Shifts
export const DEFAULT_EXIT_SETTINGS: StudentExitNotificationSettings = {
  enabled: true,
  pushEnabled: true,
  smsEnabled: true,
  soundAlertEnabled: true,
  vibrationEnabled: true,
  highPriorityChannel: true,
  shifts: [
    {
      shiftId: 'shift-1',
      shiftName: 'Shift 1 - Subax Hore',
      startTime: '07:00',
      endTime: '11:30',
      enabled: true,
      smsEnabled: true,
      pushEnabled: true,
    },
    {
      shiftId: 'shift-2',
      shiftName: 'Shift 2 - Duhur',
      startTime: '11:30',
      endTime: '15:30',
      enabled: true,
      smsEnabled: true,
      pushEnabled: true,
    },
    {
      shiftId: 'shift-3',
      shiftName: 'Shift 3 - Casar / Habeen',
      startTime: '15:30',
      endTime: '19:30',
      enabled: true,
      smsEnabled: true,
      pushEnabled: true,
    },
  ],
};

// Memory Cache for Deduplication
const processedEventIds = new Set<string>();

/**
 * Play High Priority Alert Tone (Web Audio API Synthesizer)
 */
export function playHighPriorityAlertSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, durationMs: number, delayMs: number) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + durationMs / 1000);
        } catch (e) {
          // Ignore audio errors
        }
      }, delayMs);
    };

    // Urgent Dual-Beep Alert Sound
    playTone(880, 250, 0);   // A5
    playTone(1174.66, 350, 280); // D6
  } catch (err) {
    console.warn('Audio Context Alert Playback Error:', err);
  }
}

/**
 * Request Web Notification Permission with Explanation
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Web Notifications are not supported in this browser.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Checks which active notification shift applies for the given time
 */
export function getMatchingShift(
  timeStr: string,
  shifts: ShiftNotificationConfig[]
): ShiftNotificationConfig | null {
  if (!shifts || shifts.length === 0) return null;

  // Convert "11:30" or "11:30 AM" to minutes
  const parseMinutes = (t: string): number => {
    if (!t) return 0;
    const clean = t.trim().toLowerCase();
    let hours = 0;
    let mins = 0;
    if (clean.includes('am') || clean.includes('pm')) {
      const parts = clean.replace(/am|pm/, '').trim().split(':');
      hours = parseInt(parts[0], 10) || 0;
      mins = parseInt(parts[1], 10) || 0;
      if (clean.includes('pm') && hours < 12) hours += 12;
      if (clean.includes('am') && hours === 12) hours = 0;
    } else {
      const parts = clean.split(':');
      hours = parseInt(parts[0], 10) || 0;
      mins = parseInt(parts[1], 10) || 0;
    }
    return hours * 60 + mins;
  };

  const targetMins = parseMinutes(timeStr);

  for (const shift of shifts) {
    if (!shift.enabled) continue;
    const startMins = parseMinutes(shift.startTime);
    const endMins = parseMinutes(shift.endTime);

    if (targetMins >= startMins && targetMins <= endMins) {
      return shift;
    }
  }

  // Fallback to first enabled shift if outside ranges
  return shifts.find((s) => s.enabled) || null;
}

/**
 * Triggers complete Student Exit Notification pipeline
 */
export async function triggerStudentExitNotification(options: {
  student: Student;
  exitDate: string; // YYYY-MM-DD
  exitTime: string; // e.g., "11:30 AM"
  teacherName?: string;
  settings?: SchoolSettings;
}): Promise<{
  success: boolean;
  eventId: string;
  pushSent: boolean;
  smsSent: boolean;
  notice: string;
  isDuplicate: boolean;
}> {
  const { student, exitDate, exitTime, teacherName = 'Macallinka', settings } = options;

  // 1. DEDUPLICATION CHECK
  // Unique Event ID format: exit_<studentId>_<exitDate>
  const eventId = `exit_${student.id}_${exitDate}`;

  if (processedEventIds.has(eventId)) {
    console.warn(`[StudentExitEngine]: Duplicate exit notification blocked for eventId: ${eventId}`);
    return {
      success: true,
      eventId,
      pushSent: false,
      smsSent: false,
      notice: 'Deduplicated: Ogeysiiska bixitaanka ardayga maanta mar hore ayaa loo diray waalidka.',
      isDuplicate: true,
    };
  }

  // Check Firestore for eventId deduplication if persistent
  try {
    const existingDocRef = doc(db, COLLECTIONS.PUSH_NOTIFICATIONS, eventId);
    const existingSnap = await getDoc(existingDocRef);
    if (existingSnap.exists()) {
      processedEventIds.add(eventId);
      console.warn(`[StudentExitEngine]: Event already recorded in Firestore: ${eventId}`);
      return {
        success: true,
        eventId,
        pushSent: true,
        smsSent: true,
        notice: 'Deduplicated: Ogeysiiska mar hore ayaa loo diray waalidka.',
        isDuplicate: true,
      };
    }
  } catch (e) {
    // Continue if offline
  }

  processedEventIds.add(eventId);

  const exitConfig = settings?.studentExitSettings || DEFAULT_EXIT_SETTINGS;
  if (!exitConfig.enabled) {
    return {
      success: false,
      eventId,
      pushSent: false,
      smsSent: false,
      notice: 'Ogeysiiska bixitaanka ardayda wuu damshaysan yahay Settings-ka.',
      isDuplicate: false,
    };
  }

  const activeShift = getMatchingShift(exitTime, exitConfig.shifts);
  const schoolName = settings?.schoolName || 'Machadka Tahdiibul Adfaal';

  // Format Official Message
  const formattedMsg = `${schoolName}: ${student.fullName} wuxuu maanta machadka ka baxay saacadda ${exitTime}.`;

  let pushSent = false;
  let smsSent = false;

  // 2. CREATE PUSH NOTIFICATION ITEM
  const notifItem: PushNotificationItem = {
    id: eventId,
    studentId: student.id,
    studentName: student.fullName,
    parentId: student.parentId || '',
    parentPhone: student.parentPhone || '',
    title: '🚨 Digniin Bixitaanka Ardayga',
    message: formattedMsg,
    type: 'StudentExit',
    exitDate,
    exitTime,
    shiftName: activeShift?.shiftName || 'Shift-ka Maanta',
    eventId,
    status: 'sent',
    isRead: false,
    priority: 'high',
    timestamp: new Date().toISOString(),
  };

  // 3. PERSIST TO FIRESTORE & LOCALSTORAGE
  try {
    const cleanNotif = sanitizeForFirestore(notifItem);
    await setDoc(doc(db, COLLECTIONS.PUSH_NOTIFICATIONS, notifItem.id), cleanNotif, { merge: true });

    // Save to local storage for instant offline parent access
    const existingLocalStr = localStorage.getItem('tahdiib_push_notifications');
    const existingLocal: PushNotificationItem[] = existingLocalStr ? JSON.parse(existingLocalStr) : [];
    const updatedLocal = [notifItem, ...existingLocal.filter((n) => n.id !== notifItem.id)];
    localStorage.setItem('tahdiib_push_notifications', JSON.stringify(updatedLocal));
    pushSent = true;
  } catch (fsErr) {
    console.error('Error saving Push Notification to Firestore:', fsErr);
    // Queue offline
    queueOfflineNotification(notifItem);
  }

  // 4. BROWSER PUSH NOTIFICATION & SOUND / VIBRATION
  if (exitConfig.pushEnabled && (activeShift ? activeShift.pushEnabled : true)) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(`${schoolName} — Bixitaan`, {
          body: formattedMsg,
          icon: '/icon.png',
          tag: eventId, // Deduplication tag
          renotify: true,
          requireInteraction: true,
          vibrate: exitConfig.vibrationEnabled ? [200, 100, 200, 100, 200] : undefined,
        } as any);

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }

      if (exitConfig.soundAlertEnabled) {
        playHighPriorityAlertSound();
      }
    } catch (e) {
      console.warn('Browser Notification trigger warning:', e);
    }
  }

  // 5. TRIGGER REAL SMS TO PARENT
  if (
    exitConfig.smsEnabled &&
    (activeShift ? activeShift.smsEnabled : true) &&
    student.parentPhone
  ) {
    const norm = normalizeSomaliaPhoneNumber(student.parentPhone);
    if (norm.isValid) {
      try {
        const smsRes = await sendSMS({
          recipients: norm.formattedPhone,
          parentId: student.parentId || '',
          studentId: student.id,
          recipientName: student.parentName || 'Waalid',
          recipientPhone: norm.formattedPhone,
          studentName: student.fullName,
          message: formattedMsg,
          senderId: settings?.smsSettings?.senderId || 'TAHDIIB-MIS',
          messageType: 'Notice',
          apiKey: settings?.smsSettings?.apiKey || '',
          apiUrl: settings?.smsSettings?.apiUrl,
          username: settings?.smsSettings?.username,
          password: settings?.smsSettings?.password,
          tokenSecret: settings?.smsSettings?.tokenSecret,
          isMockMode: settings?.smsSettings?.isMockMode ?? false,
        });

        if (smsRes.success) {
          smsSent = true;
        }
      } catch (smsErr) {
        console.error('Error triggering exit SMS:', smsErr);
      }
    }
  }

  return {
    success: true,
    eventId,
    pushSent,
    smsSent,
    notice: `Ogeysiiska bixitaanka ${student.fullName} waa loo diray waalidka (${smsSent ? 'SMS + ' : ''}Push Notification).`,
    isDuplicate: false,
  };
}

/**
 * Queue notification offline
 */
function queueOfflineNotification(notif: PushNotificationItem) {
  try {
    const qStr = localStorage.getItem('tahdiib_pending_exit_events');
    const q: PushNotificationItem[] = qStr ? JSON.parse(qStr) : [];
    if (!q.some((i) => i.id === notif.id)) {
      q.push(notif);
      localStorage.setItem('tahdiib_pending_exit_events', JSON.stringify(q));
    }
  } catch (e) {
    console.error('Error queuing offline exit event:', e);
  }
}

/**
 * Register Online Reconnection Listener to sync queued notifications
 */
export function setupOfflineExitQueueSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('[StudentExitEngine]: Network reconnected. Syncing queued exit notifications...');
    try {
      const qStr = localStorage.getItem('tahdiib_pending_exit_events');
      if (!qStr) return;
      const queue: PushNotificationItem[] = JSON.parse(qStr);
      if (queue.length === 0) return;

      const remaining: PushNotificationItem[] = [];
      for (const item of queue) {
        try {
          const cleanItem = sanitizeForFirestore(item);
          await setDoc(doc(db, COLLECTIONS.PUSH_NOTIFICATIONS, item.id), cleanItem, { merge: true });
        } catch (e) {
          remaining.push(item);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem('tahdiib_pending_exit_events');
      } else {
        localStorage.setItem('tahdiib_pending_exit_events', JSON.stringify(remaining));
      }
    } catch (err) {
      console.error('Error syncing offline exit queue:', err);
    }
  });
}
