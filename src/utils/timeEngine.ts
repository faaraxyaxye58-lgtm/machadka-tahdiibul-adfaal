import { StudyTimeShift, HolidayRecord } from '../types';

export type ShiftStatus = 'HOLIDAY' | 'DISABLED' | 'UPCOMING' | 'ACTIVE' | 'FINISHED';

export const SOMALI_DAYS = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco', 'Sabti'];

/**
 * Get current date/time safely
 */
export function getCurrentDateTime(): Date {
  return new Date();
}

/**
 * Get Somali day name for a given Date
 */
export function getSomaliDayName(date: Date = new Date()): string {
  return SOMALI_DAYS[date.getDay()];
}

/**
 * Check if today is a working day based on school settings
 */
export function isWorkingDay(workingDays: string[] = [], date: Date = new Date()): boolean {
  if (!workingDays || workingDays.length === 0) return true;
  const dayName = getSomaliDayName(date);
  return workingDays.includes(dayName);
}

/**
 * Check if a date falls inside any defined holiday
 */
export function getActiveHoliday(holidays: HolidayRecord[] = [], date: Date = new Date()): HolidayRecord | null {
  if (!holidays || holidays.length === 0) return null;
  const dateStr = date.toISOString().split('T')[0];

  for (const h of holidays) {
    if (dateStr >= h.startDate && dateStr <= h.endDate) {
      return h;
    }
  }
  return null;
}

/**
 * Convert "HH:MM" 24h string into total minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((num) => parseInt(num, 10) || 0);
  return h * 60 + m;
}

/**
 * Calculate precise status of a shift relative to current time
 */
export function calculateShiftStatus(
  shift: StudyTimeShift,
  workingDays: string[] = [],
  holidays: HolidayRecord[] = [],
  now: Date = new Date()
): { status: ShiftStatus; remainingSeconds: number; holidayTitle?: string } {
  if (!shift || !shift.enabled) {
    return { status: 'DISABLED', remainingSeconds: 0 };
  }

  // Check holiday first
  const activeHoliday = getActiveHoliday(holidays, now);
  if (activeHoliday) {
    return { status: 'HOLIDAY', remainingSeconds: 0, holidayTitle: activeHoliday.title };
  }

  // Check working day
  if (!isWorkingDay(workingDays, now)) {
    return { status: 'HOLIDAY', remainingSeconds: 0, holidayTitle: `Fasax Sabti/Jimco (${getSomaliDayName(now)})` };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSecondsInDay = currentMinutes * 60 + now.getSeconds();

  const startMinutes = timeStringToMinutes(shift.startTime);
  const endMinutes = timeStringToMinutes(shift.endTime);

  const startSeconds = startMinutes * 60;
  const endSeconds = endMinutes * 60;

  if (currentSecondsInDay < startSeconds) {
    return { status: 'UPCOMING', remainingSeconds: startSeconds - currentSecondsInDay };
  } else if (currentSecondsInDay >= startSeconds && currentSecondsInDay < endSeconds) {
    return { status: 'ACTIVE', remainingSeconds: endSeconds - currentSecondsInDay };
  } else {
    return { status: 'FINISHED', remainingSeconds: 0 };
  }
}

/**
 * Check if any enabled shifts overlap in time
 */
export function checkShiftOverlaps(shifts: StudyTimeShift[] = []): string[] {
  const warnings: string[] = [];
  const enabledShifts = shifts.filter((s) => s.enabled);

  for (let i = 0; i < enabledShifts.length; i++) {
    for (let j = i + 1; j < enabledShifts.length; j++) {
      const s1 = enabledShifts[i];
      const s2 = enabledShifts[j];

      const start1 = timeStringToMinutes(s1.startTime);
      const end1 = timeStringToMinutes(s1.endTime);
      const start2 = timeStringToMinutes(s2.startTime);
      const end2 = timeStringToMinutes(s2.endTime);

      if (Math.max(start1, start2) < Math.min(end1, end2)) {
        warnings.push(`⚠️ "${s1.name}" (${s1.startTime}-${s1.endTime}) waxay is dul saaran yihiin "${s2.name}" (${s2.startTime}-${s2.endTime}).`);
      }
    }
  }

  return warnings;
}

/**
 * Format remaining seconds into HH:MM:SS string
 */
export function formatRemainingTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
