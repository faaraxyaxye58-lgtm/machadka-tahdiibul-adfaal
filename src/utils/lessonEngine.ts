/**
 * Lesson Engine for Machadka Tahdiibul Adfaal
 * Handles automatic lesson progression, next instructional day calculations,
 * weekend skipping (Khamiis & Jimce), and historical record tracking.
 */

export type LessonStatus = 'Completed' | 'Failed/Repeat' | 'Pending' | 'Holiday';

export interface LessonHistoryRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Arbaco", "Khamiis", "Sabti"
  lessonNumber: number; // e.g. 25
  lessonName: string; // e.g. "Casharka 25-aad"
  status: LessonStatus;
  nextLessonDate: string; // Next study day YYYY-MM-DD
  nextLessonNumber: number;
  nextLessonName: string;
  teacherId?: string;
  teacherName?: string;
  notes?: string;
  updatedAt: string;
}

/**
 * Returns Somali Day Name for a given Date
 */
export function getSomaliDayName(date: Date): string {
  const dayIndex = date.getDay(); // 0 = Axad, 1 = Isniin, ..., 6 = Sabti
  const days = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimce', 'Sabti'];
  return days[dayIndex];
}

/**
 * Checks if a given Date is a valid study day (Sabti - Arbaco).
 * Khamiis (Thursday) and Jimce (Friday) are off days.
 */
export function isInstructionalDay(dateStrOrObj: Date | string): boolean {
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  const dayIndex = date.getDay();
  // 4 = Khamiis, 5 = Jimce
  return dayIndex !== 4 && dayIndex !== 5;
}

/**
 * Calculates the exact next instructional date (skipping Khamiis & Jimce)
 */
export function getNextInstructionalDate(fromDateStrOrObj: Date | string): string {
  const date = typeof fromDateStrOrObj === 'string' ? new Date(fromDateStrOrObj) : new Date(fromDateStrOrObj.getTime());
  
  // Advance day by day until we hit a valid study day (Sabti, Axad, Isniin, Talaado, Arbaco)
  do {
    date.setDate(date.getDate() + 1);
  } while (!isInstructionalDay(date));

  return date.toISOString().split('T')[0];
}

/**
 * Computes next lesson details based on current evaluation (✓ Completed vs × Failed/Repeat)
 */
export function computeLessonProgression(
  currentLessonNumber: number,
  currentLessonName: string,
  status: LessonStatus,
  currentDateStr: string
): {
  nextLessonNumber: number;
  nextLessonName: string;
  nextLessonDate: string;
  progressionNote: string;
} {
  const nextLessonDate = getNextInstructionalDate(currentDateStr);
  const nextDateSomaliDay = getSomaliDayName(new Date(nextLessonDate));

  if (status === 'Completed') {
    const nextLessonNumber = currentLessonNumber + 1;
    const nextLessonName = `Casharka ${nextLessonNumber}-aad`;
    return {
      nextLessonNumber,
      nextLessonName,
      nextLessonDate,
      progressionNote: `✓ Casharkii wuu ka baxay. Sidaas darteed ${nextDateSomaliDay} (${nextLessonDate}) wuxuu u gudbayaa ${nextLessonName}.`,
    };
  }

  if (status === 'Failed/Repeat') {
    return {
      nextLessonNumber: currentLessonNumber,
      nextLessonName: currentLessonName,
      nextLessonDate,
      progressionNote: `× Casharka kama bixin. Sidaas darteed ${nextDateSomaliDay} (${nextLessonDate}) wuxuu dib u qaadanayaa ${currentLessonName}.`,
    };
  }

  if (status === 'Holiday') {
    return {
      nextLessonNumber: currentLessonNumber,
      nextLessonName: currentLessonName,
      nextLessonDate,
      progressionNote: `Fasax. Sidaas darteed ${nextDateSomaliDay} (${nextLessonDate}) wuxuu sii wadi doonaa ${currentLessonName}.`,
    };
  }

  // Pending / Default
  return {
    nextLessonNumber: currentLessonNumber,
    nextLessonName: currentLessonName,
    nextLessonDate,
    progressionNote: `Suge. Casharka loo qorsheeyay waa ${currentLessonName}.`,
  };
}
