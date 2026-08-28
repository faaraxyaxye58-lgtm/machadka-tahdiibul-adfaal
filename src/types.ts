export type UserRole = 'admin' | 'teacher' | 'parent' | 'finance' | 'student';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  status?: 'Active' | 'Blocked';
  hidePaymentsAccess?: boolean; // Controls whether this individual user can see payments/lacagaha tab and totals
  learningMode?: 'onsite' | 'remote';
  studentId?: string;
  parentId?: string;
  teacherId?: string;
}

export type Gender = 'Male' | 'Female';
export type ShiftType = 'Subax' | 'Galab' | 'Habeen'; // Morning, Afternoon, Evening
export type StudentStatus = 'Active' | 'Graduated' | 'OnLeave' | 'Inactive';

export interface Student {
  id: string;
  studentId: string; // e.g., TA-2026-001
  fullName: string;
  gender: Gender;
  age: number;
  dob?: string;
  parentName: string;
  parentPhone: string;
  parentId?: string;
  parentRelation?: 'Aabe' | 'Hooyo' | 'Masuul';
  classId: string;
  className: string;
  groupId?: string; // e.g. "grp-1"
  groupName?: string; // e.g. "Guruub A"
  shift: ShiftType;
  enrollmentDate: string;
  status: StudentStatus;
  currentJuz: number; // 1 - 30
  currentSurah: string;
  currentAyah?: number; // Current Ayah position for auto Hifz engine
  dailyLinesTarget?: number; // Daily line quota (e.g., 30 sadar)
  bookLevel?: string; // e.g., "Fasalka 1-aad" ... "Fasalka 9-aad" for مفتاح القراءة القرءانية
  photoUrl?: string;
  feeMonthly: number; // in USD
  feePaid?: number;
  feeRemaining?: number;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
  learningMode?: 'onsite' | 'remote'; // Onsite or Remote learning
  cityCountry?: string;
  quranLevel?: string;
  tajweedLevel?: string;
}

export interface ClassGroup {
  id: string;
  classId: string;
  className?: string;
  name: string; // e.g. "Guruub A", "Guruub B", "Guruub C"
  teacherId?: string;
  teacherName?: string;
  description?: string;
  createdAt?: string;
}

export interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  gender: Gender;
  phone: string;
  email: string;
  photoUrl?: string;
  subjectSpecialty: string; // e.g. Hifzi Qur'aan, Tajwiid, Qaaciydada
  assignedClasses: string[];
  salary: number;
  hireDate: string;
  status: 'Active' | 'OnLeave';
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Excused' | 'Late';
export type TrackStatus = 'Sax' | 'Maya' | 'Lama Diiwaangelin';
export type AttendanceSession = 'Subax Hore' | 'Quraacda' | 'Galabti';

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  session?: AttendanceSession;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  note?: string;
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  occupation?: string;
  childrenIds: string[];
  totalPendingFees: number;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. Fasal A - Subax, Fasal Hifz Kaamil
  teacherId: string;
  teacherName: string;
  shift: ShiftType;
  capacity: number;
  totalStudents: number;
  roomNumber: string;
}

export type HifzGrade = 'Mumtaaz' | 'Jayid Jiddan' | 'Jayid' | 'Daciif';

export interface HifzRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  subaxSurah: string; // New lesson (Sabaq)
  subaxAyahFrom: number;
  subaxAyahTo: number;
  sabqiJuz: number; // Recent revision
  manzilJuz: number; // Old revision
  grade: HifzGrade;
  teacherNote?: string;
}

export interface AttendanceEditHistoryItem {
  editedBy: string;
  editedAt: string;
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className?: string;
  groupId?: string;
  groupName?: string;
  date: string;
  session?: AttendanceSession;
  status: AttendanceStatus; // Legacy Present/Absent or computed
  note?: string;

  // Single-tap ✓ (Sax) / × (Maya) Metrics & Check-In / Check-Out Timestamps
  subaxStatus?: TrackStatus; // 'Sax' | 'Maya'
  subaxTimeIn?: string; // e.g., "07:00 AM"
  subaxTimeOut?: string; // e.g., "08:00 AM"

  casharStatus?: TrackStatus; // 'Sax' | 'Maya'
  casharTimeIn?: string; // e.g., "08:15 AM"
  casharTimeOut?: string; // e.g., "09:30 AM"

  dareerisStatus?: TrackStatus; // 'Sax' | 'Maya'
  dareerisTimeIn?: string; // e.g., "09:45 AM"
  dareerisTimeOut?: string; // e.g., "10:30 AM"

  attendanceStatus?: TrackStatus; // 'Sax' | 'Maya'

  teacherId?: string;
  teacherName?: string;
  loggedBy?: string;
  updatedAt?: string;
  editedBy?: string;
  editHistory?: AttendanceEditHistoryItem[];
}

export type PaymentMethod = 'EVC Plus' | 'Zaad' | 'eDahab' | 'Sahal' | 'Kaash';

export interface PaymentTransaction {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0801
  studentId: string;
  studentName: string;
  parentName: string;
  monthYear: string; // e.g. Ogoosto 2026
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  date: string;
  status: 'Paid' | 'Partial' | 'Pending';
  processedBy: string;
}

export interface Subject {
  id: string;
  name: string; // e.g., Qur'aanka, Tajwiidka, Tarbiyada, Af-Carabi, Xisaab, Siyra
  code?: string; // e.g., SUB-01
  maxScore: number; // e.g., 100
  passScore?: number; // e.g., 50
  category?: string; // e.g., Diini, Luuqad, Maadi
  description?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  user: string; // User full name or username/email
  userRole?: string; // e.g., admin, teacher, finance, etc.
  action: string; // Action headline
  category: 'students' | 'teachers' | 'attendance' | 'payments' | 'classes' | 'system' | 'settings' | 'exams' | 'hifz' | 'curriculum';
  details: string; // Human readable description
  ipAddress?: string;
}

export type LessonStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface CurriculumTopic {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface CurriculumUnit {
  id: string;
  unitNumber: number;
  unitTitle: string; // e.g., "Cutubka 1-aad: Axaaktaamta Nuun As-Saakinah iyo Tanwiinka"
  subjectName: string; // e.g., "Tajwiidka", "Qaaciydada", "Tarbiya", "Af-Carabi", "Xisaab"
  className: string; // e.g., "Fasal A - Subax", "Fasalka 1-aad"
  teacherId?: string;
  teacherName?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  status: LessonStatus;
  topics: CurriculumTopic[];
  description?: string;
  teacherNotes?: string;
  lastUpdated?: string;
}

export interface ExamRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  term: string; // e.g. Imtixaanka Bisha, Imtixaanka Nuskhe, Imtixaanka Sannadka
  quranScore: number; // out of 100
  tajweedScore: number; // out of 100
  tarbiyaScore: number; // out of 100
  carabigaScore: number; // out of 100
  totalScore: number;
  averagePercentage: number;
  rankInClass?: number;
  remarks: string;
  subjectScores?: { [subjectIdOrName: string]: number };
}

export interface PrivacyPermissions {
  hideTeacherSalary?: boolean;
  hideFinancialTotals?: boolean;
  hideFinancialsForSubAdmins?: boolean;
  hidePaymentsGlobal?: boolean; // Hide payments/lacagaha from all non-admin users globally
  hideParentPhoneNumbers?: boolean;
  hideExamsFromParents?: boolean;
  restrictTeacherEditHifz?: boolean;
  restrictTeacherEditAttendance?: boolean;
  allowTeacherTakeAttendance?: boolean;
  restrictTeacherToAssignedClassOnly?: boolean;
  restrictParentToOwnChildrenOnly?: boolean;
  restrictClassAndTeacherEditingToAdmin?: boolean;
  restrictTeacherAttendanceToAdmin?: boolean;
  hideAdminDashboardFromUsers?: boolean;
  hiddenTabsByRole?: {
    teacher?: string[];
    parent?: string[];
    student?: string[];
    finance?: string[];
  };
}

export interface WhatsAppSettings {
  enabled: boolean;
  autoAbsentAlert: boolean;
  autoPaymentAlert: boolean;
  gatewayUrl?: string;
  instanceId?: string;
  apiKey?: string;
  mockMode?: boolean;
}

export interface ParentChatMessage {
  id: string;
  parentId: string; // ID of the parent or conversation
  parentName: string;
  parentPhone: string;
  studentName?: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'teacher' | 'parent' | 'finance';
  text: string;
  chatScope?: 'group' | 'private'; // 'group' for general/class channels, 'private' for 1-on-1
  channelId?: string; // e.g. 'general_all', 'class_1a', or parentId
  channelName?: string; // e.g. '📢 Fagaaraha Guud ee Machadka', '📖 Group-ka Fasalka 1-A'
  mediaType?: 'text' | 'image' | 'audio' | 'document' | 'template';
  mediaUrl?: string;
  audioDuration?: string;
  templateCategory?: 'Absent' | 'Payment' | 'Exam' | 'Hifz' | 'General';
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  isWhatsAppSynced?: boolean;
}

export interface HormuudSmsSettings {
  enabled: boolean;
  apiUrl?: string;
  apiKey: string;
  username?: string;
  password?: string;
  tokenSecret: string;
  senderId: string;
  isMockMode: boolean;
  gatewayName?: string;
  smsBalance?: number;
}

export interface SystemCertificateLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface HormuudApiApplicationRecord {
  id: string;
  submissionDate: string;
  institutionName: string;
  directorName: string;
  contactPhone: string;
  contactEmail: string;
  requestedSenderId: string;
  servicesRequested: string[];
  documentsSubmitted: {
    officialLetterAttached: boolean;
    educationalLicenseAttached: boolean;
    directorIdAttached: boolean;
    systemCertificateAttached: boolean;
  };
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'SENDER_ID_APPROVED' | 'ACTIVE';
  notes?: string;
}

export interface SystemCertificateSettings {
  certificateNumber: string; // e.g., TAHDIIB-SYS-2026-990288
  systemProductKey: string; // e.g., TAHDIIB-ENT-2026-88F9-940A-SOM
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'REVOKED' | 'UPDATED';
  issueDate: string; // e.g., 01/01/2026
  validityType: string; // e.g., LIFETIME
  ownerName: string; // e.g., Cabdiraxmaan Cali
  ownerTitle: string; // e.g., Maamulaha / Mulkiilaha Nidaamka
  institutionName: string; // e.g., Machadka Tahdiibul Adfaal
  digitalSignature?: string;
  lastUpdatedDate?: string;
  verificationLogs?: SystemCertificateLog[];
}

export type ApiPermission =
  | 'read_students'
  | 'write_students'
  | 'read_attendance'
  | 'write_attendance'
  | 'read_payments'
  | 'send_sms'
  | 'read_reports'
  | 'full_access';

export interface ApiKeyItem {
  id: string;
  name: string; // e.g., "Mobile App Key", "Parent Portal API", "Third-party Integration"
  keyPrefix: string; // e.g., "th_live_9a8f"
  secretKey: string; // Full key e.g. "th_live_sec_8f9a2b3c4d5e6f7a"
  permissions: ApiPermission[];
  status: 'Active' | 'Revoked';
  createdAt: string;
  lastUsedAt?: string;
  expiryDate?: string;
  webhookUrl?: string;
}

export interface StudyTimeShift {
  id: string; // 'shift-1' | 'shift-2' | 'shift-3'
  name: string; // e.g. "Waqtiga 1 (Subax Hore)"
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "09:00"
  enabled: boolean;
  description?: string;
}

export interface HolidayRecord {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'Ciid' | 'Fasax Gaar ah' | 'Maalin aan waxbarasho jirin';
  notes?: string;
}

export interface TeacherDevice {
  id: string;
  deviceName: string;
  teacherId: string;
  teacherName: string;
  isAuthorized: boolean;
  status: 'Online' | 'Offline';
  classModeActive: boolean;
  currentClassId?: string;
  currentClassName?: string;
  lastActiveTime: string;
  appVersion: string;
  ipAddress?: string;
  restrictionLevel: 'ManagedKiosk' | 'PersonalWarning' | 'Unlocked' | 'EmergencyUnlocked';
  unlockUntil?: string; // ISO timestamp
}

export interface EmergencyUnlockLog {
  id: string;
  timestamp: string;
  adminName: string;
  teacherName: string;
  deviceName: string;
  durationMinutes: number | 'End of Class';
  reason: string;
}

export interface ShiftNotificationConfig {
  shiftId: string; // 'shift-1' | 'shift-2' | 'shift-3'
  shiftName: string; // e.g. "Shift 1 - Subax Hore"
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "11:30"
  enabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

export interface StudentExitNotificationSettings {
  enabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  soundAlertEnabled: boolean;
  vibrationEnabled: boolean;
  highPriorityChannel: boolean;
  shifts: ShiftNotificationConfig[];
}

export interface PushNotificationItem {
  id: string;
  studentId: string;
  studentName: string;
  parentId?: string;
  parentPhone?: string;
  title: string;
  message: string;
  type: 'StudentExit' | 'Absent' | 'Fee' | 'General' | 'Notice';
  exitDate: string; // YYYY-MM-DD
  exitTime: string; // e.g., "11:30 AM"
  shiftName?: string; // e.g. "Shift 1 - Subax Hore"
  eventId: string; // Unique deduplication ID e.g. "exit_std123_2026-08-21"
  status: 'sent' | 'delivered' | 'failed' | 'queued';
  isRead: boolean;
  priority: 'high' | 'normal';
  timestamp: string; // ISO String
  deliveryAttempt?: number;
  errorMessage?: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolSubtitle: string;
  logoUrl: string;
  principalName: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  academicYear: string;
  welcomeGreeting?: string;
  welcomeSubtext?: string;
  privacyPermissions?: PrivacyPermissions;
  whatsappSettings?: WhatsAppSettings;
  smsSettings?: HormuudSmsSettings;
  studentExitSettings?: StudentExitNotificationSettings;
  systemCertificate?: SystemCertificateSettings;
  apiKeys?: ApiKeyItem[];
  autoBillingDay?: number;
  autoBillingEnabled?: boolean;
  lastBilledMonth?: string;
  lastBilledDate?: string;
  lastBackupTimestamp?: string;
  subjects?: Subject[];
  timeShifts?: StudyTimeShift[];
  workingDays?: string[]; // e.g. ['Sabti', 'Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis']
  holidays?: HolidayRecord[];
  teacherDevices?: TeacherDevice[];
  emergencyUnlockLogs?: EmergencyUnlockLog[];
}

export type NotificationTargetAudience = 'all' | 'teachers' | 'parents' | 'students';
export type NotificationPriority = 'normal' | 'urgent' | 'emergency';

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderRole?: string;
  targetAudience: NotificationTargetAudience;
  priority: NotificationPriority;
  createdAt: string;
  active: boolean;
  readByUsers?: string[];
}

export interface TeacherEvaluation {
  id: string;
  teacherId: string;
  teacherName: string;
  evaluatorName: string;
  evaluationDate: string;
  academicTerm: string;
  teachingScore: number; // 1-5
  quranPunctualityScore: number; // 1-5
  disciplineScore: number; // 1-5
  studentEngagementScore: number; // 1-5
  overallRating: number; // 1-5
  strengths: string;
  areasForImprovement: string;
  adminComments: string;
  recommendation: 'Excellent' | 'Promote' | 'Retain' | 'Needs Training' | 'Warning';
  createdAt: string;
}

// Customers & Transactions (Dhexe, Raage, Cash)
export type CustomerType = 'Dhexe Customer' | 'Raage Customer' | 'Cash Customer';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: CustomerType;
  address?: string;
  balance: number;
  createdAt: string;
  notes?: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: 'Sale' | 'Payment' | 'Credit' | 'Debit';
  amount: number;
  description: string;
  processedBy?: string;
}

// Products & Inventory (Badeecada)
export interface ProductItem {
  id: string;
  code: string;
  name: string;
  companyName: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  salesCount: number;
  lastUpdated: string;
}

export interface ProductTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'Sale' | 'Purchase' | 'Adjustment';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
  customerOrCompany?: string;
  notes?: string;
}

// Shirkado (Suppliers & Vendors)
export interface SupplierCompany {
  id: string;
  companyName: string;
  contactPerson?: string;
  phone: string;
  address: string;
  productsSupplied: string[];
  balance: number;
  createdAt: string;
}

export interface CompanyTransaction {
  id: string;
  companyId: string;
  companyName: string;
  date: string;
  type: 'Purchase' | 'Payment';
  amount: number;
  details: string;
  receiptNo?: string;
}

// Books & Amaano
export interface BookItem {
  id: string;
  title: string;
  author?: string;
  category?: string;
  quantity: number;
  borrowedCount: number;
  availableCount: number;
  location?: string;
}

export interface AmaanoRecord {
  id: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerRole: 'Student' | 'Teacher' | 'Parent' | 'Staff' | 'External';
  bookId?: string;
  bookTitle: string;
  borrowDate: string;
  returnDateExpected: string;
  returnDateActual?: string;
  status: 'Borrowed' | 'Returned' | 'Overdue';
  notes?: string;
}

// Patients Management
export interface PatientRecord {
  id: string;
  patientId: string;
  fullName: string;
  phone: string;
  gender: Gender;
  age: number;
  registrationDate: string;
  notes?: string;
  medicalHistory?: {
    id: string;
    date: string;
    diagnosis: string;
    treatment: string;
    doctorOrNurse?: string;
  }[];
}

// Finance & Expenses (Qarashaad)
export interface ExpenseRecord {
  id: string;
  expenseNumber: string;
  title: string;
  category: 'Salaries' | 'Utilities' | 'Rent' | 'Maintenance' | 'Books' | 'Events' | 'Supplies' | 'Other';
  amount: number;
  date: string;
  paidTo?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  approvedBy?: string;
}

// =========================================================================
// WAXBARASHADA FOG (REMOTE LEARNING) MODULE TYPES
// =========================================================================

export type OnlineAccountStatus = 'Pending' | 'Approved' | 'Active' | 'Rejected' | 'Suspended';
export type RemoteRegistrationStatus = OnlineAccountStatus;

export interface RemoteRegistration {
  id: string;
  fullName: string;
  parentName: string;
  phone: string;
  gradeLevel: string; // Class / Heerka
  cityCountry: string; // Magaalada
  otherInfo?: string; // Macluumaad kale / Preferred Username/Notes
  age?: number;
  dob?: string;
  email?: string;
  quranLevel?: string;
  currentSurah?: string;
  currentPage?: number;
  tajweedLevel?: string;
  parentPhone?: string;
  parentRelation?: 'Aabe' | 'Hooyo' | 'Masuul';
  isParentRegisteringChild?: boolean;

  // Status & Workflow
  status: OnlineAccountStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;

  // Admin Account Creation Credentials & Specs
  username?: string;
  passwordHash?: string;
  passwordPlainForAdmin?: string;
  studentId?: string; // e.g. TA-REM-1001
  assignedClassId?: string;
  assignedClassName?: string;
  assignedTeacherId?: string;
  role?: 'student' | 'parent';
  mustChangePassword?: boolean;
  createdUserId?: string;
  createdStudentId?: string;
}

export interface RemoteClass {
  id: string;
  name: string;
  gradeLevel: string;
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  scheduleDays: string[]; // e.g., ['Sabti', 'Isniin', 'Talaado']
  scheduleTime: string; // e.g., "08:00 AM - 10:00 AM EAT"
}

export type RemoteMediaType = 'video' | 'audio' | 'pdf' | 'image' | 'text';

export interface RemoteLesson {
  id: string;
  title: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "09:00 AM"
  durationMinutes: number;
  mediaType: RemoteMediaType;
  mediaUrl?: string;
  storageRef?: string;
  fileSize?: string;
  description: string;
  readingContent?: string;
  createdAt: string;
}

export interface QuranProgress {
  id: string;
  studentId: string;
  studentName: string;
  currentSurah: string;
  currentAyahFrom: number;
  currentAyahTo: number;
  currentPage: number;
  newHifzSurah: string;
  murajaahSurah: string;
  tajweedLesson: string;
  lastUpdated: string;
}

export interface QuranAudioSubmission {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  teacherName?: string;
  surah: string;
  ayahs: string;
  date: string;
  time: string;
  audioBase64OrUrl: string;
  audioDuration?: string;
  rating?: number; // 1 to 5 stars
  teacherComment?: string;
  status: 'Pending' | 'Reviewed' | 'NeedsRevision';
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface RemoteHomework {
  id: string;
  title: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  instructions: string;
  deadline: string;
  fileUrl?: string;
  mediaType?: RemoteMediaType;
  createdAt: string;
}

export interface RemoteHomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  submissionText?: string;
  fileUrl?: string;
  audioBase64OrUrl?: string;
  status: 'Submitted' | 'Reviewed';
  gradeScore?: number; // out of 100
  teacherFeedback?: string;
  reviewedAt?: string;
}

export interface RemoteExamQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'text' | 'audio';
  options?: string[];
  correctAnswer?: string; // for auto MCQ evaluation
  marks: number;
}

export interface RemoteExam {
  id: string;
  title: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  durationMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:00 AM"
  deadline: string;
  totalMarks: number;
  questions: RemoteExamQuestion[];
  createdAt: string;
}

export interface RemoteExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  status: 'Submitted' | 'Graded';
  answers: Record<string, string>; // questionId -> answer
  teacherFeedback?: string;
  attemptedAt: string;
}

export type RemoteAttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Left Early';

export interface RemoteAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  lessonId: string;
  lessonTitle: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime?: string;
  status: RemoteAttendanceStatus;
  loggedAt: string;
}

export interface RemoteScheduleItem {
  id: string;
  timeSlot: 'Subax' | 'Duhur' | 'Fiid';
  timeRange: string; // e.g. "08:00 AM - 10:00 AM EAT"
  subject: string;
  teacherName: string;
  dayName: string; // e.g., 'Sabti', 'Isniin'
}

// =========================================================================
// FREE CLOUD STORAGE TYPES & INTERFACES
// =========================================================================

export type CloudFileCategory = 'pdf' | 'document' | 'image' | 'report' | 'other';

export interface CloudFileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number; // in bytes
  category: CloudFileCategory;
  fileUrl: string; // Secure download/stream reference URL
  storageKey: string;
  isPrivate: boolean;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: UserRole;
  classId?: string;
  className?: string;
  studentId?: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  description?: string;
  createdAt: string; // ISO string
  updatedAt?: string;
}

export interface CloudStorageStats {
  usedBytes: number;
  totalBytes: number; // 10 GB = 10,737,418,240 bytes
  availableBytes: number;
  totalFilesCount: number;
  pdfCount: number;
  documentCount: number;
  imageCount: number;
  reportCount: number;
  otherCount: number;
  usagePercentage: number;
  statusAlert: 'normal' | 'warning' | 'critical' | 'disabled';
}

// =========================================================================
// TEACHER LESSON RECORDING & GEMINI TRANSCRIBE TYPES
// =========================================================================

export interface RecordedLesson {
  id: string;
  title: string; // Magaca Casharka
  className: string; // Fasalka
  classId?: string;
  subject: string; // e.g. Qur'aan, Tajwiid, Qaaciydada, Tarbiya, Af-Carabi
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "09:30 AM"
  audioUrl?: string; // Audio Blob or Data URL
  audioBase64?: string; // Base64 audio stream for persistent playback
  audioDuration: string; // e.g., "05:12"
  transcript: string; // Clean Somali text transcribed by Gemini
  confidenceWarnings?: string[]; // Low-confidence parts flagged for teacher review
  customTermsUsed?: string[]; // Detected domain terms (Tajwiid, Quranic Surahs, etc.)
  createdAt: string; // ISO Timestamp
  status: 'draft' | 'saved' | 'pending_sync'; // Offline / sync state
  isOfflineCached?: boolean;
}

export interface RecordedLessonQaMessage {
  id: string;
  lessonId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  question: string;
  answer: string;
  timestamp: string;
}


