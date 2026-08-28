import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  Firestore,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Student,
  Teacher,
  Parent,
  ClassRoom,
  ClassGroup,
  HifzRecord,
  AttendanceRecord,
  TeacherAttendance,
  PaymentTransaction,
  ExamRecord,
  SchoolSettings,
  User,
  BroadcastNotification,
  AuditLogEntry,
  CurriculumUnit,
  TeacherEvaluation,
} from '../types';
import { Storage } from './storage';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const customDatabaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// Suppress verbose SDK connection warning noise in browser
try {
  setLogLevel('error');
} catch (e) {
  // Ignore if setLogLevel is restricted
}

// Initialize or get Firestore safely with long-polling fallback for container environments
function getOrInitializeDb(): Firestore {
  try {
    if (customDatabaseId) {
      return initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, customDatabaseId);
    }
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (err) {
    if (customDatabaseId) {
      return getFirestore(app, customDatabaseId);
    }
    return getFirestore(app);
  }
}

export const db = getOrInitializeDb();

// Validate connection to Firestore gracefully on app startup
async function testConnection() {
  try {
    // Non-blocking cached doc check instead of forced server fetch
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Silently handle offline or connection unavailable states
  }
}
testConnection();

// Document / Collection references
export const COLLECTIONS = {
  SETTINGS: 'settings',
  USERS: 'users',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  PARENTS: 'parents',
  CLASSES: 'classes',
  GROUPS: 'classGroups',
  HIFZ: 'hifzRecords',
  ATTENDANCE: 'attendanceRecords',
  TEACHER_ATTENDANCE: 'teacherAttendanceRecords',
  PAYMENTS: 'paymentTransactions',
  EXAMS: 'examRecords',
  CURRICULUM: 'curriculumUnits',
  SMS_LOGS: 'sms_logs',
  WHATSAPP_LOGS: 'whatsapp_logs',
  AUDIT_LOGS: 'audit_logs',
  PUSH_NOTIFICATIONS: 'push_notifications',
  TEACHER_EVALUATIONS: 'teacherEvaluations',
  PARENT_CHATS: 'parent_chats',
  LESSON_HISTORY: 'lesson_history',
  REMOTE_REGISTRATIONS: 'remoteRegistrations',
  REMOTE_CLASSES: 'remoteClasses',
  REMOTE_LESSONS: 'remoteLessons',
  QURAN_PROGRESS: 'quranProgress',
  QURAN_AUDIO: 'quranAudioSubmissions',
  REMOTE_HOMEWORK: 'remoteHomework',
  REMOTE_HOMEWORK_SUBMISSIONS: 'remoteHomeworkSubmissions',
  REMOTE_EXAMS: 'remoteExams',
  REMOTE_ATTENDANCE: 'remoteAttendance',
  CLOUD_FILES: 'cloud_files',
  LESSONS: 'lessons',
  LESSON_QA: 'lesson_qa',
};

// --- Firestore Realtime Subscriptions ---

export function subscribeSettings(callback: (settings: SchoolSettings) => void) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SchoolSettings);
      }
    },
    (err) => {
      console.warn('Error or connection issue subscribing to settings:', err?.message || err);
    }
  );
}

export function subscribeCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as T);
      });
      callback(list);
    },
    (err) => {
      console.warn(`Error or connection issue subscribing to ${collectionName}:`, err?.message || err);
    }
  );
}

// Helper to sanitize data for Firestore (replaces undefined with null/deletes keys to prevent setDoc invalid data error)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// --- Firestore Write Helpers ---

export async function saveSettingsToFirestore(settings: SchoolSettings) {
  try {
    const cleanData = sanitizeForFirestore(settings);
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), cleanData, { merge: true });
  } catch (err) {
    console.error('Error saving settings to Firestore:', err);
  }
}

export async function saveItemToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    const cleanData = sanitizeForFirestore(item);
    await setDoc(doc(db, collectionName, item.id), cleanData, { merge: true });
  } catch (err) {
    console.error(`Error saving item to ${collectionName}:`, err);
  }
}

export async function deleteItemFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.error(`Error deleting item from ${collectionName}:`, err);
  }
}

export async function saveBatchItemsToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const cleanData = sanitizeForFirestore(item);
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, cleanData, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error(`Error saving batch items to ${collectionName}:`, err);
  }
}

// --- Initial Data Seed / Sync Helper ---
// If Firestore collections are empty, populate them with initial data
export async function seedInitialDataIfEmpty(initialData: {
  settings: SchoolSettings;
  users: User[];
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  classes: ClassRoom[];
  hifzRecords: HifzRecord[];
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendance[];
  payments: PaymentTransaction[];
  exams: ExamRecord[];
  teacherEvaluations?: TeacherEvaluation[];
}) {
  try {
    const isSeeded = localStorage.getItem('tahdiib_seeded_v1');
    if (isSeeded === 'true') return;

    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    if (usersSnap.empty) {
      console.log('Seeding initial data into cloud database...');
      await saveSettingsToFirestore(initialData.settings);
      await saveBatchItemsToFirestore(COLLECTIONS.USERS, initialData.users);
      await saveBatchItemsToFirestore(COLLECTIONS.STUDENTS, initialData.students);
      await saveBatchItemsToFirestore(COLLECTIONS.TEACHERS, initialData.teachers);
      await saveBatchItemsToFirestore(COLLECTIONS.PARENTS, initialData.parents);
      await saveBatchItemsToFirestore(COLLECTIONS.CLASSES, initialData.classes);
      await saveBatchItemsToFirestore(COLLECTIONS.HIFZ, initialData.hifzRecords);
      await saveBatchItemsToFirestore(COLLECTIONS.ATTENDANCE, initialData.attendance);
      await saveBatchItemsToFirestore(COLLECTIONS.TEACHER_ATTENDANCE, initialData.teacherAttendance);
      await saveBatchItemsToFirestore(COLLECTIONS.PAYMENTS, initialData.payments);
      await saveBatchItemsToFirestore(COLLECTIONS.EXAMS, initialData.exams);
      if (initialData.teacherEvaluations?.length) {
        await saveBatchItemsToFirestore(COLLECTIONS.TEACHER_EVALUATIONS, initialData.teacherEvaluations);
      }
      console.log('Cloud database seeding completed successfully!');
    }
    localStorage.setItem('tahdiib_seeded_v1', 'true');
  } catch (err) {
    console.error('Error seeding initial data to Firestore:', err);
  }
}

// --- Firestore Full Backup & 24h Check Helper ---

export async function backupAllDataToFirestore(allData: {
  settings: SchoolSettings;
  users?: User[];
  students?: Student[];
  teachers?: Teacher[];
  parents?: Parent[];
  classes?: ClassRoom[];
  hifzRecords?: HifzRecord[];
  attendance?: AttendanceRecord[];
  teacherAttendance?: TeacherAttendance[];
  payments?: PaymentTransaction[];
  exams?: ExamRecord[];
}): Promise<{ success: boolean; timestamp: string }> {
  const timestamp = new Date().toISOString();
  const updatedSettings: SchoolSettings = {
    ...allData.settings,
    lastBackupTimestamp: timestamp,
  };

  try {
    await saveSettingsToFirestore(updatedSettings);
    if (allData.users?.length) await saveBatchItemsToFirestore(COLLECTIONS.USERS, allData.users);
    if (allData.students?.length) await saveBatchItemsToFirestore(COLLECTIONS.STUDENTS, allData.students);
    if (allData.teachers?.length) await saveBatchItemsToFirestore(COLLECTIONS.TEACHERS, allData.teachers);
    if (allData.parents?.length) await saveBatchItemsToFirestore(COLLECTIONS.PARENTS, allData.parents);
    if (allData.classes?.length) await saveBatchItemsToFirestore(COLLECTIONS.CLASSES, allData.classes);
    if (allData.hifzRecords?.length) await saveBatchItemsToFirestore(COLLECTIONS.HIFZ, allData.hifzRecords);
    if (allData.attendance?.length) await saveBatchItemsToFirestore(COLLECTIONS.ATTENDANCE, allData.attendance);
    if (allData.teacherAttendance?.length) await saveBatchItemsToFirestore(COLLECTIONS.TEACHER_ATTENDANCE, allData.teacherAttendance);
    if (allData.payments?.length) await saveBatchItemsToFirestore(COLLECTIONS.PAYMENTS, allData.payments);
    if (allData.exams?.length) await saveBatchItemsToFirestore(COLLECTIONS.EXAMS, allData.exams);

    localStorage.setItem('tahdiib_last_firestore_backup', timestamp);
    return { success: true, timestamp };
  } catch (err) {
    console.error('Error backing up all data to Firestore:', err);
    throw err;
  }
}

export function getLastBackupInfo(settings?: SchoolSettings): {
  lastBackupDate: Date | null;
  hoursAgo: number | null;
  isOverdue: boolean;
  formattedLastBackup: string;
} {
  const storedStr = settings?.lastBackupTimestamp || localStorage.getItem('tahdiib_last_firestore_backup');
  if (!storedStr) {
    return {
      lastBackupDate: null,
      hoursAgo: null,
      isOverdue: true,
      formattedLastBackup: 'Weli kayd ma dhicin (No backup yet)',
    };
  }

  const backupDate = new Date(storedStr);
  if (isNaN(backupDate.getTime())) {
    return {
      lastBackupDate: null,
      hoursAgo: null,
      isOverdue: true,
      formattedLastBackup: 'Weli kayd ma dhicin (Invalid date)',
    };
  }

  const diffMs = Date.now() - backupDate.getTime();
  const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60));
  const isOverdue = diffMs >= 24 * 60 * 60 * 1000; // 24 hours overdue

  const formattedLastBackup = backupDate.toLocaleString('so-SO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return {
    lastBackupDate: backupDate,
    hoursAgo,
    isOverdue,
    formattedLastBackup,
  };
}

export async function logAuditActivity(
  user: string,
  userRole: string,
  action: string,
  category: AuditLogEntry['category'],
  details: string
): Promise<void> {
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user,
    userRole,
    action,
    category,
    details,
  };
  try {
    const existing = Storage.getAuditLogs();
    Storage.saveAuditLogs([entry, ...existing]);
    await saveItemToFirestore(COLLECTIONS.AUDIT_LOGS, entry);
  } catch (err) {
    console.error('Error logging audit activity:', err);
  }
}

// --- Real-time Push Notifications Helpers ---

export function subscribePushNotifications(callback: (notifications: BroadcastNotification[]) => void) {
  const colRef = collection(db, COLLECTIONS.PUSH_NOTIFICATIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: BroadcastNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as BroadcastNotification);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('Notice subscribing to push notifications:', err?.message || err);
    }
  );
}

export async function sendPushNotificationToFirestore(notification: BroadcastNotification): Promise<void> {
  try {
    await saveItemToFirestore(COLLECTIONS.PUSH_NOTIFICATIONS, notification);
  } catch (err) {
    console.error('Error sending push notification to Firestore:', err);
    throw err;
  }
}

export async function dismissPushNotificationInFirestore(notificationId: string, userId: string, currentReadBy: string[] = []): Promise<void> {
  try {
    if (currentReadBy.includes(userId)) return;
    const updatedReadBy = [...currentReadBy, userId];
    await setDoc(
      doc(db, COLLECTIONS.PUSH_NOTIFICATIONS, notificationId),
      { readByUsers: updatedReadBy },
      { merge: true }
    );
  } catch (err) {
    console.error('Error dismissing push notification in Firestore:', err);
  }
}
