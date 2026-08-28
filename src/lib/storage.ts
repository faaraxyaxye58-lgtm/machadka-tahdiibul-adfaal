import { broadcastSystemUpdate } from './autoSyncEngine';
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
  AuditLogEntry,
  CurriculumUnit,
  TeacherEvaluation,
  RemoteRegistration,
  RemoteClass,
  RemoteLesson,
  QuranProgress,
  QuranAudioSubmission,
  RemoteHomework,
  RemoteHomeworkSubmission,
  RemoteExam,
  RemoteAttendanceRecord,
  RemoteScheduleItem,
} from '../types';
import {
  initialSchoolSettings,
  initialUsers,
  initialClasses,
  initialStudents,
  initialTeachers,
  initialParents,
  initialHifzRecords,
  initialAttendanceRecords,
  initialPayments,
  initialExams,
  initialAuditLogs,
  initialCurriculumUnits,
  initialTeacherEvaluations,
  initialRemoteRegistrations,
  initialRemoteClasses,
  initialRemoteLessons,
  initialQuranProgress,
  initialQuranAudioSubmissions,
  initialRemoteHomework,
  initialRemoteHomeworkSubmissions,
  initialRemoteExams,
  initialRemoteAttendance,
  initialRemoteSchedules,
  initialCloudFiles,
  demoClasses,
  demoStudents,
  demoTeachers,
  demoParents,
  demoHifzRecords,
  demoAttendanceRecords,
  demoPayments,
  demoExams,
} from '../data/mockData';
import { CloudFileItem } from '../types';

const KEYS = {
  SETTINGS: 'tahdiib_settings_v1',
  USERS: 'tahdiib_users_v1',
  CURRENT_USER: 'tahdiib_current_user_v1',
  CLASSES: 'tahdiib_classes_v1',
  GROUPS: 'tahdiib_groups_v1',
  STUDENTS: 'tahdiib_students_v1',
  TEACHERS: 'tahdiib_teachers_v1',
  PARENTS: 'tahdiib_parents_v1',
  HIFZ: 'tahdiib_hifz_v1',
  ATTENDANCE: 'tahdiib_attendance_v1',
  TEACHER_ATTENDANCE: 'tahdiib_teacher_attendance_v1',
  PAYMENTS: 'tahdiib_payments_v1',
  EXAMS: 'tahdiib_exams_v1',
  AUDIT_LOGS: 'tahdiib_audit_logs_v1',
  CURRICULUM: 'tahdiib_curriculum_v1',
  TEACHER_EVALUATIONS: 'tahdiib_teacher_evaluations_v1',
  REMOTE_REGISTRATIONS: 'tahdiib_remote_registrations_v1',
  REMOTE_CLASSES: 'tahdiib_remote_classes_v1',
  REMOTE_LESSONS: 'tahdiib_remote_lessons_v1',
  QURAN_PROGRESS: 'tahdiib_quran_progress_v1',
  QURAN_AUDIO: 'tahdiib_quran_audio_v1',
  REMOTE_HOMEWORK: 'tahdiib_remote_homework_v1',
  REMOTE_HOMEWORK_SUBMISSIONS: 'tahdiib_remote_homework_sub_v1',
  REMOTE_EXAMS: 'tahdiib_remote_exams_v1',
  REMOTE_ATTENDANCE: 'tahdiib_remote_attendance_v1',
  REMOTE_SCHEDULES: 'tahdiib_remote_schedules_v1',
  CLOUD_FILES: 'tahdiib_cloud_files_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    broadcastSystemUpdate(key, value);
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const Storage = {
  getSettings: (): SchoolSettings => getItem(KEYS.SETTINGS, initialSchoolSettings),
  saveSettings: (settings: SchoolSettings) => setItem(KEYS.SETTINGS, settings),

  getUsers: (): User[] => getItem(KEYS.USERS, initialUsers),
  saveUsers: (users: User[]) => setItem(KEYS.USERS, users),

  getCurrentUser: (): User | null => getItem(KEYS.CURRENT_USER, null),
  saveCurrentUser: (user: User | null) => setItem(KEYS.CURRENT_USER, user),

  getClasses: (): ClassRoom[] => getItem(KEYS.CLASSES, initialClasses),
  saveClasses: (classes: ClassRoom[]) => setItem(KEYS.CLASSES, classes),

  getClassGroups: (): ClassGroup[] => getItem(KEYS.GROUPS, []),
  saveClassGroups: (groups: ClassGroup[]) => setItem(KEYS.GROUPS, groups),

  getStudents: (): Student[] => getItem(KEYS.STUDENTS, initialStudents),
  saveStudents: (students: Student[]) => setItem(KEYS.STUDENTS, students),

  getTeachers: (): Teacher[] => getItem(KEYS.TEACHERS, initialTeachers),
  saveTeachers: (teachers: Teacher[]) => setItem(KEYS.TEACHERS, teachers),

  getParents: (): Parent[] => getItem(KEYS.PARENTS, initialParents),
  saveParents: (parents: Parent[]) => setItem(KEYS.PARENTS, parents),

  getHifzRecords: (): HifzRecord[] => getItem(KEYS.HIFZ, initialHifzRecords),
  saveHifzRecords: (records: HifzRecord[]) => setItem(KEYS.HIFZ, records),

  getAttendanceRecords: (): AttendanceRecord[] => getItem(KEYS.ATTENDANCE, initialAttendanceRecords),
  saveAttendanceRecords: (records: AttendanceRecord[]) => setItem(KEYS.ATTENDANCE, records),

  getTeacherAttendanceRecords: (): TeacherAttendance[] => getItem(KEYS.TEACHER_ATTENDANCE, []),
  saveTeacherAttendanceRecords: (records: TeacherAttendance[]) => setItem(KEYS.TEACHER_ATTENDANCE, records),

  getPayments: (): PaymentTransaction[] => getItem(KEYS.PAYMENTS, initialPayments),
  savePayments: (payments: PaymentTransaction[]) => setItem(KEYS.PAYMENTS, payments),

  getExams: (): ExamRecord[] => getItem(KEYS.EXAMS, initialExams),
  saveExams: (exams: ExamRecord[]) => setItem(KEYS.EXAMS, exams),

  getAuditLogs: (): AuditLogEntry[] => getItem(KEYS.AUDIT_LOGS, initialAuditLogs),
  saveAuditLogs: (logs: AuditLogEntry[]) => setItem(KEYS.AUDIT_LOGS, logs),

  getCurriculumUnits: (): CurriculumUnit[] => getItem(KEYS.CURRICULUM, initialCurriculumUnits),
  saveCurriculumUnits: (units: CurriculumUnit[]) => setItem(KEYS.CURRICULUM, units),

  getTeacherEvaluations: (): TeacherEvaluation[] => getItem(KEYS.TEACHER_EVALUATIONS, initialTeacherEvaluations),
  saveTeacherEvaluations: (evals: TeacherEvaluation[]) => setItem(KEYS.TEACHER_EVALUATIONS, evals),

  getRemoteRegistrations: (): RemoteRegistration[] => getItem(KEYS.REMOTE_REGISTRATIONS, initialRemoteRegistrations),
  saveRemoteRegistrations: (regs: RemoteRegistration[]) => setItem(KEYS.REMOTE_REGISTRATIONS, regs),

  getRemoteClasses: (): RemoteClass[] => getItem(KEYS.REMOTE_CLASSES, initialRemoteClasses),
  saveRemoteClasses: (classes: RemoteClass[]) => setItem(KEYS.REMOTE_CLASSES, classes),

  getRemoteLessons: (): RemoteLesson[] => getItem(KEYS.REMOTE_LESSONS, initialRemoteLessons),
  saveRemoteLessons: (lessons: RemoteLesson[]) => setItem(KEYS.REMOTE_LESSONS, lessons),

  getQuranProgress: (): QuranProgress[] => getItem(KEYS.QURAN_PROGRESS, initialQuranProgress),
  saveQuranProgress: (progs: QuranProgress[]) => setItem(KEYS.QURAN_PROGRESS, progs),

  getQuranAudioSubmissions: (): QuranAudioSubmission[] => getItem(KEYS.QURAN_AUDIO, initialQuranAudioSubmissions),
  saveQuranAudioSubmissions: (subs: QuranAudioSubmission[]) => setItem(KEYS.QURAN_AUDIO, subs),

  getRemoteHomework: (): RemoteHomework[] => getItem(KEYS.REMOTE_HOMEWORK, initialRemoteHomework),
  saveRemoteHomework: (hw: RemoteHomework[]) => setItem(KEYS.REMOTE_HOMEWORK, hw),

  getRemoteHomeworkSubmissions: (): RemoteHomeworkSubmission[] => getItem(KEYS.REMOTE_HOMEWORK_SUBMISSIONS, initialRemoteHomeworkSubmissions),
  saveRemoteHomeworkSubmissions: (subs: RemoteHomeworkSubmission[]) => setItem(KEYS.REMOTE_HOMEWORK_SUBMISSIONS, subs),

  getRemoteExams: (): RemoteExam[] => getItem(KEYS.REMOTE_EXAMS, initialRemoteExams),
  saveRemoteExams: (exams: RemoteExam[]) => setItem(KEYS.REMOTE_EXAMS, exams),

  getRemoteAttendanceRecords: (): RemoteAttendanceRecord[] => getItem(KEYS.REMOTE_ATTENDANCE, initialRemoteAttendance),
  saveRemoteAttendanceRecords: (records: RemoteAttendanceRecord[]) => setItem(KEYS.REMOTE_ATTENDANCE, records),

  getRemoteSchedules: (): RemoteScheduleItem[] => getItem(KEYS.REMOTE_SCHEDULES, initialRemoteSchedules),
  saveRemoteSchedules: (schedules: RemoteScheduleItem[]) => setItem(KEYS.REMOTE_SCHEDULES, schedules),

  getCloudFiles: (): CloudFileItem[] => getItem(KEYS.CLOUD_FILES, initialCloudFiles),
  saveCloudFiles: (files: CloudFileItem[]) => setItem(KEYS.CLOUD_FILES, files),

  getRecordedLessons: (): any[] => getItem('tahdiib_recorded_lessons_v1', []),
  saveRecordedLessons: (lessons: any[]) => setItem('tahdiib_recorded_lessons_v1', lessons),

  getRecordedLessonQa: (): any[] => getItem('tahdiib_recorded_lesson_qa_v1', []),
  saveRecordedLessonQa: (qa: any[]) => setItem('tahdiib_recorded_lesson_qa_v1', qa),

  clearAllData: () => {
    setItem(KEYS.CLASSES, []);
    setItem(KEYS.STUDENTS, []);
    setItem(KEYS.TEACHERS, []);
    setItem(KEYS.PARENTS, []);
    setItem(KEYS.HIFZ, []);
    setItem(KEYS.ATTENDANCE, []);
    setItem(KEYS.TEACHER_ATTENDANCE, []);
    setItem(KEYS.PAYMENTS, []);
    setItem(KEYS.EXAMS, []);
  },

  loadSampleDemoData: () => {
    setItem(KEYS.CLASSES, demoClasses);
    setItem(KEYS.STUDENTS, demoStudents);
    setItem(KEYS.TEACHERS, demoTeachers);
    setItem(KEYS.PARENTS, demoParents);
    setItem(KEYS.HIFZ, demoHifzRecords);
    setItem(KEYS.ATTENDANCE, demoAttendanceRecords);
    setItem(KEYS.TEACHER_ATTENDANCE, []);
    setItem(KEYS.PAYMENTS, demoPayments);
    setItem(KEYS.EXAMS, demoExams);
  },

  resetAllData: () => {
    setItem(KEYS.SETTINGS, initialSchoolSettings);
    setItem(KEYS.USERS, initialUsers);
    setItem(KEYS.CURRENT_USER, initialUsers[0]);
    setItem(KEYS.CLASSES, initialClasses);
    setItem(KEYS.STUDENTS, initialStudents);
    setItem(KEYS.TEACHERS, initialTeachers);
    setItem(KEYS.PARENTS, initialParents);
    setItem(KEYS.HIFZ, initialHifzRecords);
    setItem(KEYS.ATTENDANCE, initialAttendanceRecords);
    setItem(KEYS.TEACHER_ATTENDANCE, []);
    setItem(KEYS.PAYMENTS, initialPayments);
    setItem(KEYS.EXAMS, initialExams);
  },
};
