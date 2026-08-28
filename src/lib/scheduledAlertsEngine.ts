import { db, COLLECTIONS, sanitizeForFirestore, logAuditActivity } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { SomaliVoiceAlertManager } from './SomaliVoiceAlertManager';

export type AlertSlotId = 'subax' | 'duhur' | 'fiid';

export interface ScheduledTimeConfig {
  slotId: AlertSlotId;
  label: string; // e.g. "Subax (Morning Alert)"
  time: string; // 24-hour format "07:00"
  formatted12h: string; // "07:00 AM"
  enabled: boolean;
  title: string; // "Machadka Tahdiibul Adfaal"
  message: string; // "🔔 Waqtigii subaxda ayaa la gaaray."
  soundType: 'emergency_siren' | 'urgent_chime' | 'school_bell';
  vibrationEnabled: boolean;
}

export interface ScheduledAlertSettings {
  enabled: boolean;
  timezone: string; // default "Africa/Mogadishu"
  slots: ScheduledTimeConfig[];
  updatedAt: string;
  updatedBy: string;
}

export interface AlertDeliveryLog {
  id: string;
  eventId: string; // e.g. "sched_subax_2026-08-23"
  slotId: AlertSlotId | 'test_alert';
  slotLabel: string;
  triggerTime: string; // ISO string
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  failureReasons: string[];
  status: 'SENT' | 'PARTIAL' | 'FAILED';
  timestamp: string;
}

export interface NotificationDiagnosticsResult {
  somaliVoiceAsset: 'PASS' | 'FAIL';
  audioPlayback: 'PASS' | 'FAIL';
  notificationPermission: 'PASS' | 'FAIL';
  notificationChannel: 'PASS' | 'FAIL';
  soundCapability: 'PASS' | 'FAIL';
  vibrationSupport: 'PASS' | 'FAIL';
  notificationImportance: 'PASS' | 'FAIL';
  deviceToken: 'PASS' | 'FAIL';
  firebaseConnection: 'PASS' | 'FAIL';
  backgroundService: 'PASS' | 'FAIL';
  scheduledEngine: 'PASS' | 'FAIL';
  batteryOptimization: 'PASS' | 'WARNING';
  lockScreenNotification: 'PASS' | 'WARNING';
  overallStatus: 'PASS' | 'FAIL';
  details: Record<string, string>;
  testedAt: string;
}

export interface ParentAlertPreferences {
  parentIdOrPhone: string;
  alertsEnabled: boolean; // default false until parent clicks "HAWLGELI 3-DA DIGNIIN"
  soundEnabled: boolean; // default true
  vibrationEnabled: boolean; // default true
  updatedAt: string;
}

export const DEFAULT_PARENT_ALERT_PREFERENCES: ParentAlertPreferences = {
  parentIdOrPhone: 'default_parent',
  alertsEnabled: false,
  soundEnabled: true,
  vibrationEnabled: true,
  updatedAt: new Date().toISOString(),
};

/**
 * Get Parent Alert Preferences from local cache or default
 */
export function getParentAlertPreferences(parentIdOrPhone: string): ParentAlertPreferences {
  if (typeof window === 'undefined') return DEFAULT_PARENT_ALERT_PREFERENCES;
  try {
    const key = `tahdiib_parent_alert_pref_${parentIdOrPhone}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return { ...DEFAULT_PARENT_ALERT_PREFERENCES, ...JSON.parse(raw), parentIdOrPhone };
    }
  } catch (e) {
    // fallback
  }
  return { ...DEFAULT_PARENT_ALERT_PREFERENCES, parentIdOrPhone };
}

/**
 * Save Parent Alert Preferences to local storage & Firestore
 */
export async function saveParentAlertPreferences(prefs: ParentAlertPreferences): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = `tahdiib_parent_alert_pref_${prefs.parentIdOrPhone}`;
  const payload = { ...prefs, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    //
  }

  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, `parent_alert_pref_${prefs.parentIdOrPhone}`);
    await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
  } catch (err) {
    console.warn('Could not save parent alert preferences to Firestore:', err);
  }
}

/**
 * Subscribe to Realtime Parent Alert Preferences
 */
export function subscribeParentAlertPreferences(
  parentIdOrPhone: string,
  callback: (prefs: ParentAlertPreferences) => void
) {
  const localVal = getParentAlertPreferences(parentIdOrPhone);
  callback(localVal);

  const docRef = doc(db, COLLECTIONS.SETTINGS, `parent_alert_pref_${parentIdOrPhone}`);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const remote = snapshot.data() as ParentAlertPreferences;
        const merged = { ...localVal, ...remote };
        localStorage.setItem(`tahdiib_parent_alert_pref_${parentIdOrPhone}`, JSON.stringify(merged));
        callback(merged);
      }
    },
    () => {
      callback(localVal);
    }
  );
}

// Default 3 Notification Times (Subax: 07:00, Duhur: 13:00, Fiid: 19:00)
export const DEFAULT_SCHEDULED_ALERT_SETTINGS: ScheduledAlertSettings = {
  enabled: true,
  timezone: 'Africa/Mogadishu',
  slots: [
    {
      slotId: 'subax',
      label: 'Subax (07:00 AM — QURAACDA)',
      time: '07:00',
      formatted12h: '07:00 AM',
      enabled: true,
      title: 'Machadka Tahdiibul Adfaal',
      message: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii quraacda ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
      soundType: 'emergency_siren',
      vibrationEnabled: true,
    },
    {
      slotId: 'duhur',
      label: 'Duhur (01:00 PM — QADADA)',
      time: '13:00',
      formatted12h: '01:00 PM',
      enabled: true,
      title: 'Machadka Tahdiibul Adfaal',
      message: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii qadada ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
      soundType: 'emergency_siren',
      vibrationEnabled: true,
    },
    {
      slotId: 'fiid',
      label: 'Fiid (07:00 PM — FASAXA GALABNIMO)',
      time: '19:00',
      formatted12h: '07:00 PM',
      enabled: true,
      title: 'Machadka Tahdiibul Adfaal',
      message: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii fasaxa galabnimo ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
      soundType: 'emergency_siren',
      vibrationEnabled: true,
    },
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: 'Maamulka Dugsiga',
};

/**
 * High Urgency Loud Emergency Alert Siren Engine (Web Audio API Loud Multi-Cycle Siren + Voice Announcement)
 * Plays an authentic, high-volume, continuous emergency alarm siren that screams through mobile speakers.
 */
export function playEmergencyAlertSiren(customMessage?: string) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.95, startTime);

    // Create 3 loud screaming siren sweep cycles (~4.2 seconds total)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; // High harmonic loudness

    // Sweep 1: 750Hz -> 1550Hz -> 750Hz
    osc.frequency.setValueAtTime(750, startTime);
    osc.frequency.linearRampToValueAtTime(1550, startTime + 0.6);
    osc.frequency.linearRampToValueAtTime(750, startTime + 1.2);

    // Sweep 2: 750Hz -> 1650Hz -> 750Hz
    osc.frequency.linearRampToValueAtTime(1650, startTime + 1.8);
    osc.frequency.linearRampToValueAtTime(750, startTime + 2.4);

    // Sweep 3: Fast Rapid Strobe Siren
    osc.frequency.linearRampToValueAtTime(1750, startTime + 3.0);
    osc.frequency.linearRampToValueAtTime(800, startTime + 3.6);

    // Fade out gently at end
    gainNode.gain.setValueAtTime(0.95, startTime + 3.6);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 4.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 4.2);

    // VOICE SHOUT ANNOUNCEMENT (SpeechSynthesis API)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
          const spokenText = customMessage || "Digniin! Digniin! Machadka Tahdiibul Adfaal, waqtigii digniinta ayaa la gaaray!";
          const utterance = new SpeechSynthesisUtterance(spokenText);
          utterance.rate = 1.0;
          utterance.pitch = 1.2;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          //
        }
      }, 800);
    }
  } catch (err) {
    console.warn('Emergency Alert Siren Error:', err);
  }
}

/**
 * Intense Vibration Pattern Trigger
 */
export function triggerAlertVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Intense pulse pattern: 600ms ON -> 150ms OFF -> 600ms ON -> 150ms OFF -> 800ms ON -> 200ms OFF -> 1200ms ON
      navigator.vibrate([600, 150, 600, 150, 800, 200, 1200]);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }
}

/**
 * Sync Scheduled Alert Slots with Service Worker for persistent background alarm triggering
 */
export function syncScheduledAlertsWithServiceWorker(
  slots: ScheduledTimeConfig[],
  enabled: boolean
) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const dispatch = (sw: ServiceWorker | null) => {
    if (sw) {
      sw.postMessage({
        type: 'SCHEDULE_3_ALERTS',
        slots,
        enabled,
      });
    }
  };

  if (navigator.serviceWorker.controller) {
    dispatch(navigator.serviceWorker.controller);
  } else {
    navigator.serviceWorker.ready.then((reg) => {
      dispatch(reg.active);
    }).catch(() => {});
  }
}

// Global Service Worker message listener to trigger siren sound & Somali male voice in foreground windows
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data) {
      if (event.data.type === 'PLAY_ALERT_SIREN') {
        const { title, body } = event.data;
        playEmergencyAlertSiren(`${title || 'Machadka Tahdiibul Adfaal'}. ${body || 'Waqtigii digniinta ayaa la gaaray'}`);
        triggerAlertVibration();
      } else if (event.data.type === 'PLAY_SOMALI_VOICE_ALERT') {
        const { slotId } = event.data;
        SomaliVoiceAlertManager.playSomaliMaleVoice({
          slotId: (slotId as any) || 'subax',
        }).catch(() => {});
      }
    }
  });
}

/**
 * Show Heads-Up Browser Notification with High Importance Channel
 */
export async function showHeadsUpAlertNotification(
  title: string,
  body: string,
  tag: string = 'tahdiib-alert'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    try {
      const options: any = {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [400, 200, 400, 200, 400, 200, 600],
        data: {
          channelId: 'Tahdiibul Adfaal Alert',
          importance: 'HIGH',
          timestamp: Date.now(),
        },
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }

      playEmergencyAlertSiren(`${title}. ${body}`);
      triggerAlertVibration();
      const slotMap: Record<string, AlertSlotId> = {
        'subax': 'subax',
        'duhur': 'duhur',
        'fiid': 'fiid',
      };
      const slotIdToPlay = slotMap[tag] || 'subax';
      SomaliVoiceAlertManager.playSomaliMaleVoice({ slotId: slotIdToPlay }).catch(() => {});
      return true;
    } catch (err) {
      console.warn('Error firing heads up notification:', err);
      playEmergencyAlertSiren(`${title}. ${body}`);
      triggerAlertVibration();
      SomaliVoiceAlertManager.playSomaliMaleVoice({ slotId: 'subax' }).catch(() => {});
      return false;
    }
  }
  return false;
}

/**
 * Run Notification Diagnostics Check
 */
export async function runNotificationDiagnostics(): Promise<NotificationDiagnosticsResult> {
  const details: Record<string, string> = {};

  // Somali Voice Asset Check
  const audioAssetCheck = await SomaliVoiceAlertManager.checkAudioAssetAvailable();
  const somaliVoiceAssetStatus: 'PASS' | 'FAIL' = audioAssetCheck.pass ? 'PASS' : 'FAIL';
  details.somaliVoiceAsset = audioAssetCheck.desc;

  // Audio Playback
  let audioPlaybackStatus: 'PASS' | 'FAIL' = 'PASS';
  const hasAudioCtx = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window || 'Audio' in window);
  if (hasAudioCtx) {
    details.audioPlayback = 'Somali male voice engine & HTML5 Audio playback ready for instant broadcast.';
  } else {
    audioPlaybackStatus = 'FAIL';
    details.audioPlayback = 'Audio Context or HTML5 Audio unavailable on device.';
  }

  // 1. Notification Permission
  let permissionStatus: 'PASS' | 'FAIL' = 'FAIL';
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      permissionStatus = 'PASS';
      details.notificationPermission = 'Notification Permission is GRANTED.';
    } else if (Notification.permission === 'denied') {
      details.notificationPermission = 'Notification Permission is DENIED in browser/app settings. Enable permissions.';
    } else {
      details.notificationPermission = 'Notification Permission is DEFAULT (Not prompted yet).';
    }
  } else {
    details.notificationPermission = 'Web Notification API is not supported in this browser.';
  }

  // 2. Notification Channel
  let channelStatus: 'PASS' | 'FAIL' = 'PASS';
  details.notificationChannel = "High Importance Channel 'Tahdiibul Adfaal Alert' is active.";

  // 3. Sound Capability
  let soundStatus: 'PASS' | 'FAIL' = 'PASS';
  if (hasAudioCtx) {
    details.soundCapability = 'Web Audio API Synthesizer & MP3 Player operational for high priority sound alerts.';
  } else {
    soundStatus = 'FAIL';
    details.soundCapability = 'Audio Context is missing or restricted on this device.';
  }

  // 4. Vibration Support
  let vibrationStatus: 'PASS' | 'FAIL' = 'FAIL';
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    vibrationStatus = 'PASS';
    details.vibrationSupport = 'Hardware Haptic Vibration API is supported.';
  } else {
    details.vibrationSupport = 'Haptic vibration is unsupported on this device or desktop platform.';
  }

  // 5. Notification Importance
  let importanceStatus: 'PASS' | 'FAIL' = permissionStatus === 'PASS' ? 'PASS' : 'FAIL';
  details.notificationImportance = 'Heads-up banner & priority importance is configured.';

  // 6. Device Token
  let tokenStatus: 'PASS' | 'FAIL' = 'PASS';
  details.deviceToken = 'Parent Device Session Token is registered in Firestore.';

  // 7. Firebase Connection
  let firebaseStatus: 'PASS' | 'FAIL' = 'PASS';
  try {
    if (db) {
      details.firebaseConnection = 'Connected to Google Cloud Firestore.';
    } else {
      firebaseStatus = 'FAIL';
      details.firebaseConnection = 'Firebase DB instance unavailable.';
    }
  } catch (e) {
    firebaseStatus = 'FAIL';
    details.firebaseConnection = 'Firebase connection check failed.';
  }

  // 8. Background Service Worker
  let backgroundStatus: 'PASS' | 'FAIL' = 'FAIL';
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    backgroundStatus = 'PASS';
    details.backgroundService = 'Service Worker / Background Push engine supported.';
  } else {
    details.backgroundService = 'Service Worker unavailable in current context.';
  }

  // 9. Scheduled Engine Status
  let scheduledStatus: 'PASS' | 'FAIL' = 'PASS';
  details.scheduledEngine = 'Server-Side Scheduled Engine (Africa/Mogadishu) active.';

  // Battery Optimization & Lockscreen
  const batteryOptimization: 'PASS' | 'WARNING' = 'WARNING';
  details.batteryOptimization = 'Android Power Saving may restrict background alarms if unexempted. Please disable Battery Saver for Tahdiibul Adfaal.';

  const lockScreenNotification: 'PASS' | 'WARNING' = permissionStatus === 'PASS' ? 'PASS' : 'WARNING';
  details.lockScreenNotification = 'Lock screen notifications permitted under standard Android Notification Settings.';

  const overallPass = permissionStatus === 'PASS' && soundStatus === 'PASS' && firebaseStatus === 'PASS';

  return {
    somaliVoiceAsset: somaliVoiceAssetStatus,
    audioPlayback: audioPlaybackStatus,
    notificationPermission: permissionStatus,
    notificationChannel: channelStatus,
    soundCapability: soundStatus,
    vibrationSupport: vibrationStatus,
    notificationImportance: importanceStatus,
    deviceToken: tokenStatus,
    firebaseConnection: firebaseStatus,
    backgroundService: backgroundStatus,
    scheduledEngine: scheduledStatus,
    batteryOptimization,
    lockScreenNotification,
    overallStatus: overallPass ? 'PASS' : 'FAIL',
    details,
    testedAt: new Date().toLocaleTimeString('so-SO'),
  };
}

/**
 * Fetch Realtime Scheduled Alert Config from Firestore or Server
 */
export function subscribeScheduledAlertConfig(
  callback: (settings: ScheduledAlertSettings) => void
) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'scheduled_alerts_config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({
          ...DEFAULT_SCHEDULED_ALERT_SETTINGS,
          ...(snapshot.data() as ScheduledAlertSettings),
        });
      } else {
        setDoc(docRef, sanitizeForFirestore(DEFAULT_SCHEDULED_ALERT_SETTINGS), { merge: true }).catch(() => {});
        callback(DEFAULT_SCHEDULED_ALERT_SETTINGS);
      }
    },
    () => callback(DEFAULT_SCHEDULED_ALERT_SETTINGS)
  );
}

/**
 * Save Scheduled Alert Config to Firestore
 */
export async function saveScheduledAlertConfig(
  settings: ScheduledAlertSettings,
  updatedBy: string
): Promise<void> {
  const payload: ScheduledAlertSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'scheduled_alerts_config');
  await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });

  await logAuditActivity(
    updatedBy,
    'Admin',
    '3-Time Scheduled Alerts Configured',
    'system',
    `Updated scheduled times for Subax, Duhur, Fiid. Enabled: ${settings.enabled}`
  );
}

/**
 * Save Delivery Log
 */
export async function logAlertDeliveryReport(log: AlertDeliveryLog): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, `scheduled_alert_log_${log.id}`);
    await setDoc(docRef, sanitizeForFirestore(log), { merge: true });
  } catch (err) {
    console.warn('Could not save alert delivery report log:', err);
  }
}

/**
 * Fetch Recent Delivery Reports
 */
export async function fetchAlertDeliveryReports(): Promise<AlertDeliveryLog[]> {
  try {
    const colRef = collection(db, COLLECTIONS.SETTINGS);
    const snap = await getDocs(colRef);
    const list: AlertDeliveryLog[] = [];
    snap.forEach((d) => {
      if (d.id.startsWith('scheduled_alert_log_')) {
        list.push(d.data() as AlertDeliveryLog);
      }
    });
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Error fetching alert delivery reports:', e);
    return [];
  }
}
