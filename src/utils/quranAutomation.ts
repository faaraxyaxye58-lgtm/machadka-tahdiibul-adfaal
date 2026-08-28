import { QURAN_SURAHS, SurahMeta } from '../data/quranSurahsData';
import { Student, HifzRecord, BroadcastNotification, ParentChatMessage } from '../types';
import { COLLECTIONS, saveItemToFirestore } from '../lib/firebase';

export interface QuranLessonState {
  surahNumber: number;
  surahName: string;
  surahArabic: string;
  fromAyah: number;
  toAyah: number;
  lines: number;
  juz: number;
  isSurahFinished: boolean;
  totalSurahVerses: number;
}

/**
  * Find Surah metadata matching name, number, or Somali translation
  */
export function getSurahByAnyName(surahName: string): SurahMeta {
  if (!surahName) return QURAN_SURAHS[1]; // Default to Al-Baqarah (Index 1)

  const clean = surahName.toLowerCase().replace(/^surah\s*/i, '').trim();
  
  const found = QURAN_SURAHS.find(
    (s) =>
      s.nameEnglish.toLowerCase() === clean ||
      s.nameArabic === clean ||
      s.nameSomali.toLowerCase().includes(clean) ||
      `surah ${s.nameEnglish.toLowerCase()}` === surahName.toLowerCase() ||
      s.number === parseInt(clean, 10)
  );

  return found || QURAN_SURAHS[1]; // Default to Al-Baqarah
}

/**
  * Calculates the ending Ayah based on target lines and Surah density
  */
export function calculateAyahRangeForLines(
  surah: SurahMeta,
  startAyah: number,
  targetLines: number
): { toAyah: number; actualLines: number; surahFinished: boolean } {
  const safeStart = Math.min(Math.max(1, startAyah || 1), surah.versesCount);
  
  // Calculate average lines per verse based on Surah length
  let linesPerVerse = 1.5;
  if (surah.number >= 1 && surah.number <= 9) {
    linesPerVerse = 2.4; // Baqarah, Ali Imran, etc.
  } else if (surah.number >= 10 && surah.number <= 49) {
    linesPerVerse = 1.3;
  } else if (surah.number >= 50 && surah.number <= 77) {
    linesPerVerse = 1.0;
  } else {
    linesPerVerse = 0.6; // Short Surahs (Juz Amma)
  }

  const lines = targetLines > 0 ? targetLines : 30; // Default 30 sadar
  const estimatedVerses = Math.max(1, Math.round(lines / linesPerVerse));
  let toAyah = safeStart + estimatedVerses - 1;
  let surahFinished = false;

  if (toAyah >= surah.versesCount) {
    toAyah = surah.versesCount;
    surahFinished = true;
  }

  return {
    toAyah,
    actualLines: lines,
    surahFinished,
  };
}

/**
  * Generates current lesson state and calculates next position upon approval
  */
export function getStudentQuranLesson(student: Student): {
  currentLesson: QuranLessonState;
  nextPosition: {
    surahName: string;
    currentAyah: number;
    currentJuz: number;
  };
} {
  const surahObj = getSurahByAnyName(student.currentSurah || 'Surah Al-Baqarah');
  const startAyah = student.currentAyah && student.currentAyah > 0 ? student.currentAyah : 1;
  const linesQuota = student.dailyLinesTarget && student.dailyLinesTarget > 0 ? student.dailyLinesTarget : 30;

  const { toAyah, surahFinished } = calculateAyahRangeForLines(surahObj, startAyah, linesQuota);

  const currentLesson: QuranLessonState = {
    surahNumber: surahObj.number,
    surahName: `Surah ${surahObj.nameEnglish}`,
    surahArabic: surahObj.nameArabic,
    fromAyah: startAyah,
    toAyah,
    lines: linesQuota,
    juz: surahObj.juz,
    isSurahFinished: surahFinished,
    totalSurahVerses: surahObj.versesCount,
  };

  let nextSurahName = `Surah ${surahObj.nameEnglish}`;
  let nextAyah = toAyah + 1;
  let nextJuz = surahObj.juz;

  if (surahFinished || nextAyah > surahObj.versesCount) {
    const nextIndex = surahObj.number; // e.g., if number is 2 (Al-Baqarah), index 2 is Ali Imran (number 3)
    if (nextIndex < QURAN_SURAHS.length) {
      const nextSurahObj = QURAN_SURAHS[nextIndex];
      nextSurahName = `Surah ${nextSurahObj.nameEnglish}`;
      nextAyah = 1;
      nextJuz = nextSurahObj.juz;
    } else {
      // Completed all 114 Surahs!
      nextAyah = surahObj.versesCount;
    }
  }

  return {
    currentLesson,
    nextPosition: {
      surahName: nextSurahName,
      currentAyah: nextAyah,
      currentJuz: nextJuz,
    },
  };
}

/**
  * Processes automatic one-tap evaluation for a student:
  * - 'approve' (✓ Ansixi): Logs record + Auto-advances student position
  * - 'reject' (✗ Qalad): Logs record as revision + Keeps student position unchanged
  */
export function processAutomaticHifzCheck(
  student: Student,
  action: 'approve' | 'reject',
  note?: string
): {
  updatedStudent: Student;
  newRecord: Omit<HifzRecord, 'id'>;
  message: string;
} {
  const { currentLesson, nextPosition } = getStudentQuranLesson(student);
  const todayDate = new Date().toISOString().split('T')[0];

  if (action === 'approve') {
    const updatedStudent: Student = {
      ...student,
      currentSurah: nextPosition.surahName,
      currentAyah: nextPosition.currentAyah,
      currentJuz: nextPosition.currentJuz,
    };

    const newRecord: Omit<HifzRecord, 'id'> = {
      studentId: student.id,
      studentName: student.fullName,
      date: todayDate,
      subaxSurah: currentLesson.surahName,
      subaxAyahFrom: currentLesson.fromAyah,
      subaxAyahTo: currentLesson.toAyah,
      sabqiJuz: Math.max(1, currentLesson.juz - 1),
      manzilJuz: Math.max(1, currentLesson.juz - 3),
      grade: 'Mumtaaz',
      teacherNote: note || `✓ Ansixiyay: ${currentLesson.lines} Sadar (${currentLesson.surahName} Aayadda ${currentLesson.fromAyah}-${currentLesson.toAyah})`,
    };

    let msg = `✓ LA ANSIXIYAY: ${student.fullName}\n- Casharkii Hadda: ${currentLesson.surahName} (${currentLesson.fromAyah}-${currentLesson.toAyah})\n- Si Otomaatig ah waxaa loogu gudbiyay: ${nextPosition.surahName} (Aayadda ${nextPosition.currentAyah})`;
    if (currentLesson.isSurahFinished) {
      msg = `🎉 SURADDA WAA LA DHAMEEYAY!\nArdayga ${student.fullName} wuxuu dhameeyay ${currentLesson.surahName}.\nSi otomaatig ah loogu gudbiyay Suradda xigta: ${nextPosition.surahName}`;
    }

    return {
      updatedStudent,
      newRecord,
      message: msg,
    };
  } else {
    // Reject / Qalad: Do NOT move student position
    const updatedStudent: Student = { ...student };

    const newRecord: Omit<HifzRecord, 'id'> = {
      studentId: student.id,
      studentName: student.fullName,
      date: todayDate,
      subaxSurah: currentLesson.surahName,
      subaxAyahFrom: currentLesson.fromAyah,
      subaxAyahTo: currentLesson.toAyah,
      sabqiJuz: Math.max(1, currentLesson.juz - 1),
      manzilJuz: Math.max(1, currentLesson.juz - 3),
      grade: 'Daciif',
      teacherNote: note || `✗ Qalad: Ku celis casharkii (${currentLesson.lines} Sadar, Aayadda ${currentLesson.fromAyah}-${currentLesson.toAyah})`,
    };

    const msg = `✗ QALAD / KU CELIS: ${student.fullName}\n- Casharku wuxuu ku sii nagaaday: ${currentLesson.surahName} (Aayadda ${currentLesson.fromAyah}-${currentLesson.toAyah})`;

    return {
      updatedStudent,
      newRecord,
      message: msg,
    };
  }
}

/**
 * Checks if a student has completed their weekly Hifz plan
 * (e.g. 5 successful approvals in the current week, or completing a Surah milestone)
 */
export function isWeeklyPlanCompleted(
  student: Student,
  hifzRecords: HifzRecord[],
  newRecord?: Omit<HifzRecord, 'id'> | HifzRecord
): { isCompleted: boolean; count: number; reason: string } {
  if (!student) return { isCompleted: false, count: 0, reason: '' };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter records for this student in the last 7 days
  const studentWeeklyRecords = hifzRecords.filter((r) => {
    const isStudent = r.studentId === student.id || r.studentName.toLowerCase().includes(student.fullName.toLowerCase());
    if (!isStudent) return false;
    const rDate = new Date(r.date);
    return !isNaN(rDate.getTime()) && rDate >= sevenDaysAgo && r.grade !== 'Daciif';
  });

  let approvedCount = studentWeeklyRecords.length;
  if (newRecord && newRecord.grade !== 'Daciif') {
    approvedCount += 1;
  }

  // Check if current lesson completed a surah
  const { currentLesson } = getStudentQuranLesson(student);
  if (currentLesson.isSurahFinished) {
    return {
      isCompleted: true,
      count: approvedCount,
      reason: `🎉 Dhameeyay ${currentLesson.surahName}`,
    };
  }

  if (approvedCount >= 5) {
    return {
      isCompleted: true,
      count: approvedCount,
      reason: `✅ Dhameeyay 5 Cashar oo usbuucan saaraa (${approvedCount} Cashar)`,
    };
  }

  return {
    isCompleted: false,
    count: approvedCount,
    reason: `${approvedCount}/5 Cashar oo usbuucan la dhameeyay`,
  };
}

/**
 * Sends an automatic 'Hambalyo' (Congratulations) notification directly to the Parent Dashboard
 */
export async function sendParentHambalyoNotification(
  student: Student,
  recordInfo?: { surah: string; lines?: number; fromAyah?: number; toAyah?: number },
  customMsg?: string
): Promise<{ pushNotif: BroadcastNotification; chatMsg: ParentChatMessage }> {
  const timestamp = new Date().toISOString();
  const surahText = recordInfo?.surah || student.currentSurah || "Qur'aanka Kariimka";
  const linesText = recordInfo?.lines ? `${recordInfo.lines} Sadar` : `${student.dailyLinesTarget || 30} Sadar`;

  const title = `🎉 HAMBALYO WAALIDKA! Qorshaha Usbuuca Waa La Dhammaystay`;
  const defaultBody = `🎉 Hambalyo Waalidxinimo! Ardayga/Ardayadda ${student.fullName} (ID: ${student.studentId}) wuxuu/waxay si guul leh u dhammaystay qorshaha xifdinta Qur'aanka ee usbuuca saaran (${surahText} - ${linesText}). Illaahay ubadka ha u barakeeyo, Aamiin!`;
  const message = customMsg || defaultBody;

  // 1. Create Push Notification for Parent Dashboard Overlay & Top Banner
  const pushNotif: BroadcastNotification = {
    id: `notif-hambalyo-${student.id}-${Date.now()}`,
    title,
    message,
    senderName: `Macallinka Qur'aanka`,
    senderRole: 'teacher',
    targetAudience: 'parents',
    priority: 'urgent',
    createdAt: timestamp,
    active: true,
    readByUsers: [],
  };

  // 2. Create Parent Chat Message in 'hifz_updates' Channel & Private Parent Chat
  const chatMsg: ParentChatMessage = {
    id: `chat-hambalyo-${student.id}-${Date.now()}`,
    parentId: student.parentPhone || student.parentName || student.id,
    parentName: student.parentName || 'Waalidka Ardayga',
    parentPhone: student.parentPhone || '',
    studentName: student.fullName,
    senderId: 'teacher-system',
    senderName: `Macallinka Qur'aanka`,
    senderRole: 'teacher',
    text: message,
    chatScope: 'group',
    channelId: 'hifz_updates',
    channelName: "📖 Ogeysiisyada Xifdinta Qur'aanka",
    mediaType: 'template',
    templateCategory: 'Hifz',
    status: 'sent',
    timestamp,
  };

  try {
    await saveItemToFirestore(COLLECTIONS.PUSH_NOTIFICATIONS, pushNotif);
    await saveItemToFirestore(COLLECTIONS.PARENT_CHATS, chatMsg);
  } catch (err) {
    console.warn('Firestore fallback notice when sending Hambalyo notification:', err);
  }

  // Backup to localStorage for immediate reactive render across views
  try {
    const existingPush = JSON.parse(localStorage.getItem('tahdiib_push_notifications') || '[]');
    localStorage.setItem('tahdiib_push_notifications', JSON.stringify([pushNotif, ...existingPush]));

    const existingChats = JSON.parse(localStorage.getItem('tahdiib_parent_chats') || '[]');
    localStorage.setItem('tahdiib_parent_chats', JSON.stringify([chatMsg, ...existingChats]));
  } catch (e) {
    // localStorage backup safe fallback
  }

  return { pushNotif, chatMsg };
}

