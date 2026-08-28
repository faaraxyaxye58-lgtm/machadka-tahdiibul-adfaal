import React, { useState, useEffect } from 'react';
import { Storage } from './lib/storage';
import { subscribeSystemAutoSync } from './lib/autoSyncEngine';
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
  PushNotificationItem,
  CurriculumUnit,
  TeacherEvaluation,
  Customer,
  ProductItem,
  SupplierCompany,
  BookItem,
  AmaanoRecord,
  PatientRecord,
  ExpenseRecord,
} from './types';

import {
  COLLECTIONS,
  subscribeSettings,
  subscribeCollection,
  subscribePushNotifications,
  saveSettingsToFirestore,
  saveItemToFirestore,
  deleteItemFromFirestore,
  saveBatchItemsToFirestore,
  seedInitialDataIfEmpty,
} from './lib/firebase';

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
  initialTeacherEvaluations,
  initialCustomers,
  initialProducts,
  initialCompanies,
  initialBooks,
  initialAmaanoRecords,
  initialPatients,
  demoClasses,
  demoStudents,
  demoTeachers,
  demoParents,
  demoHifzRecords,
  demoAttendanceRecords,
  demoPayments,
  demoExams,
} from './data/mockData';

import { logAuditAction } from './lib/auditLogger';
import { computeLessonProgression, getSomaliDayName, LessonHistoryRecord, LessonStatus } from './utils/lessonEngine';
import { canUserAccessPayments } from './lib/permissionUtils';
import { Lock, Sparkles } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { LoginModal } from './components/LoginModal';
import { getParentChildren } from './utils/parentMatcher';
import { getTeacherStudents, getTeacherClasses, getVisibleTeachers } from './utils/teacherMatcher';
import { execute29thMonthlyBilling, getCurrentSomaliMonthYear } from './utils/billingUtils';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { PrintReportCardModal } from './components/PrintReportCardModal';
import { ChangeProfileModal } from './components/ChangeProfileModal';
import { ShareModal } from './components/ShareModal';
import { AppUpdateModal, APP_VERSION } from './components/AppUpdateModal';
import { ForceUpdateOverlay } from './components/ForceUpdateOverlay';
import { AppUpdateManagementView } from './views/AppUpdateManagementView';
import { ScheduledAlertsAdminView } from './views/ScheduledAlertsAdminView';
import {
  INSTALLED_APP_BUILD,
  PublishedAppVersionConfig,
  DEFAULT_PUBLISHED_VERSION_CONFIG,
  subscribeAppVersionConfig,
  evaluateUpdateStatus,
  pingUserActiveVersion,
  performAutomaticBuildSync,
} from './lib/appVersionEngine';
import { UserPermissionsModal } from './components/UserPermissionsModal';
import { LogoutConfirmationModal } from './components/LogoutConfirmationModal';
import { PortraitLockOverlay } from './components/PortraitLockOverlay';
import { PushNotificationOverlay } from './components/PushNotificationOverlay';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SystemLicenseModal } from './components/SystemLicenseModal';
import { ApiKeyManagerModal } from './components/ApiKeyManagerModal';
import { HormuudApiApplicationModal } from './components/HormuudApiApplicationModal';
import { AdminVoiceBroadcastModal } from './components/AdminVoiceBroadcastModal';

import { DashboardView } from './views/DashboardView';
import { ClassModeView } from './views/ClassModeView';
import { TeacherDeviceControlView } from './views/TeacherDeviceControlView';
import { ParentDeviceControlView } from './views/ParentDeviceControlView';
import { StudentDeviceLockOverlay } from './components/StudentDeviceLockOverlay';
import { StudentDeviceControlState, DEFAULT_APP_RULES } from './lib/deviceControlEngine';
import { StudentsView } from './views/StudentsView';
import { TeachersView } from './views/TeachersView';
import { ParentsView } from './views/ParentsView';
import { ClassesView } from './views/ClassesView';
import { QuranHifzView } from './views/QuranHifzView';
import { QuranMushafReader } from './components/QuranMushafReader';
import { MuallimQiraahBook } from './components/MuallimQiraahBook';
import { CurriculumView } from './views/CurriculumView';
import { AttendanceView } from './views/AttendanceView';
import { MessagingView } from './views/MessagingView';
import { ParentsChatView } from './views/ParentsChatView';
import { SmsManagementView } from './views/SmsManagementView';
import { PaymentsView } from './views/PaymentsView';
import { ExamsView } from './views/ExamsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { ApkDownloadView } from './views/ApkDownloadView';
import { CustomersView } from './views/CustomersView';
import { ProductsView } from './views/ProductsView';
import { CompaniesView } from './views/CompaniesView';
import { BooksAmaanoView } from './views/BooksAmaanoView';
import { PatientsView } from './views/PatientsView';
import { RemoteLearningView } from './views/RemoteLearningView';
import { CloudStorageView } from './views/CloudStorageView';
import { LessonRecordingView } from './views/LessonRecordingView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => Storage.getCurrentUser());
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Domain Data
  const [settings, setSettings] = useState<SchoolSettings>(() => Storage.getSettings());
  const [users, setUsers] = useState<User[]>(() => Storage.getUsers());
  const [students, setStudents] = useState<Student[]>(() => Storage.getStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => Storage.getTeachers());
  const [parents, setParents] = useState<Parent[]>(() => Storage.getParents());
  const [classes, setClasses] = useState<ClassRoom[]>(() => Storage.getClasses());
  const [classGroups, setClassGroups] = useState<ClassGroup[]>(() => Storage.getClassGroups());
  const [hifzRecords, setHifzRecords] = useState<HifzRecord[]>(() => Storage.getHifzRecords());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => Storage.getAttendanceRecords());
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>(() => Storage.getTeacherAttendanceRecords());
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => Storage.getPayments());
  const [exams, setExams] = useState<ExamRecord[]>(() => Storage.getExams());
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnit[]>(() => Storage.getCurriculumUnits());
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>(() => Storage.getTeacherEvaluations());
  const [pushNotifications, setPushNotifications] = useState<PushNotificationItem[]>([]);

  // ERP Domain States
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('tahdiib_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('tahdiib_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [companies, setCompanies] = useState<SupplierCompany[]>(() => {
    const saved = localStorage.getItem('tahdiib_companies');
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  const [books, setBooks] = useState<BookItem[]>(() => {
    const saved = localStorage.getItem('tahdiib_books');
    return saved ? JSON.parse(saved) : initialBooks;
  });

  const [amaanoRecords, setAmaanoRecords] = useState<AmaanoRecord[]>(() => {
    const saved = localStorage.getItem('tahdiib_amaano');
    return saved ? JSON.parse(saved) : initialAmaanoRecords;
  });

  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    const saved = localStorage.getItem('tahdiib_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const handleSaveCustomers = (updated: Customer[]) => {
    setCustomers(updated);
    localStorage.setItem('tahdiib_customers', JSON.stringify(updated));
  };

  const handleSaveProducts = (updated: ProductItem[]) => {
    setProducts(updated);
    localStorage.setItem('tahdiib_products', JSON.stringify(updated));
  };

  const handleSaveCompanies = (updated: SupplierCompany[]) => {
    setCompanies(updated);
    localStorage.setItem('tahdiib_companies', JSON.stringify(updated));
  };

  const handleSaveBooks = (updated: BookItem[]) => {
    setBooks(updated);
    localStorage.setItem('tahdiib_books', JSON.stringify(updated));
  };

  const handleSaveAmaanoRecords = (updated: AmaanoRecord[]) => {
    setAmaanoRecords(updated);
    localStorage.setItem('tahdiib_amaano', JSON.stringify(updated));
  };

  const handleSavePatients = (updated: PatientRecord[]) => {
    setPatients(updated);
    localStorage.setItem('tahdiib_patients', JSON.stringify(updated));
  };

  // Modal & Mobile menu triggers
  const [isOpenAddStudentModal, setIsOpenAddStudentModal] = useState(false);
  const [isOpenHifzModal, setIsOpenHifzModal] = useState(false);
  const [isOpenPaymentModal, setIsOpenPaymentModal] = useState(false);
  const [isOpenChangeProfileModal, setIsOpenChangeProfileModal] = useState(false);
  const [isOpenPermissionsModal, setIsOpenPermissionsModal] = useState(false);
  const [isOpenShareModal, setIsOpenShareModal] = useState(false);
  const [isOpenSearchModal, setIsOpenSearchModal] = useState(false);
  const [isOpenLicenseModal, setIsOpenLicenseModal] = useState(false);
  const [isOpenApiKeyModal, setIsOpenApiKeyModal] = useState(false);
  const [isOpenHormuudApplicationModal, setIsOpenHormuudApplicationModal] = useState(false);
  const [isOpenAdminVoiceModal, setIsOpenAdminVoiceModal] = useState(false);
  const [isOpenLogoutModal, setIsOpenLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpenSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // Published Remote App Version Config & Realtime Sync
  const [versionConfig, setVersionConfig] = useState<PublishedAppVersionConfig>(
    DEFAULT_PUBLISHED_VERSION_CONFIG
  );

  // Auto-update success banner state (shown once after auto reload)
  const [autoUpdatedBannerVersion, setAutoUpdatedBannerVersion] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('tahdiib_auto_updated_version_banner');
      if (v) {
        localStorage.removeItem('tahdiib_auto_updated_version_banner');
        return v;
      }
    }
    return null;
  });

  // Check version and trigger automatic build sync if needed
  const checkAndRunAutoSync = (cfg: PublishedAppVersionConfig) => {
    if (!cfg) return;
    const syncedCodeStr = localStorage.getItem('tahdiib_synced_build_code');
    const syncedCode = syncedCodeStr ? parseInt(syncedCodeStr, 10) : 0;

    // Trigger automatic force sync if latest remote version > installed or synced build
    if (cfg.latestVersionCode > INSTALLED_APP_BUILD.versionCode || syncedCode < cfg.latestVersionCode) {
      if (syncedCode < cfg.latestVersionCode) {
        performAutomaticBuildSync(cfg.latestVersionCode, cfg.latestVersionName);
      }
    }
  };

  useEffect(() => {
    const unsub = subscribeAppVersionConfig((config) => {
      setVersionConfig(config);
      checkAndRunAutoSync(config);

      const readBuild = localStorage.getItem('tahdiib_read_app_build');
      if (config.latestVersionCode > INSTALLED_APP_BUILD.versionCode) {
        if (readBuild !== String(config.latestVersionCode)) {
          setIsOpenAppUpdateModal(true);
        }
      }
    });
    return () => unsub();
  }, []);

  // Listen for user returning to app (Focus, Tab switch, Background return)
  useEffect(() => {
    const handleRecheckVersion = () => {
      if (versionConfig) {
        checkAndRunAutoSync(versionConfig);
      }
    };

    window.addEventListener('focus', handleRecheckVersion);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRecheckVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleRecheckVersion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [versionConfig]);

  useEffect(() => {
    if (currentUser) {
      pingUserActiveVersion(currentUser);
    }
  }, [currentUser]);

  const updateStatus = evaluateUpdateStatus(INSTALLED_APP_BUILD.versionCode, versionConfig);
  const isForceUpdateRequired = updateStatus === 'FORCE_UPDATE_REQUIRED';

  const [isOpenAppUpdateModal, setIsOpenAppUpdateModal] = useState<boolean>(() => {
    const readBuild = localStorage.getItem('tahdiib_read_app_build');
    return readBuild !== String(INSTALLED_APP_BUILD.versionCode);
  });

  const handleMarkUpdateAsRead = () => {
    localStorage.setItem('tahdiib_read_app_build', String(versionConfig.latestVersionCode));
  };

  // Global Money Privacy state
  const [isMoneyHidden, setIsMoneyHidden] = useState<boolean>(
    () => localStorage.getItem('tahdiib_hide_money') === 'true'
  );

  const handleToggleHideMoney = () => {
    setIsMoneyHidden((prev) => {
      const nextVal = !prev;
      localStorage.setItem('tahdiib_hide_money', String(nextVal));
      return nextVal;
    });
  };

  // Print Modals
  const [receiptToPrint, setReceiptToPrint] = useState<PaymentTransaction | null>(null);
  const [reportCardToPrint, setReportCardToPrint] = useState<ExamRecord | null>(null);

  // Device Control SubTab for Admin/Parent view switching
  const [deviceControlSubTab, setDeviceControlSubTab] = useState<'parent' | 'teacher'>('parent');

  // Global Student Device Control State
  const [studentDeviceState, setStudentDeviceState] = useState<StudentDeviceControlState>(() => {
    const saved = localStorage.getItem('tahdiib_device_ctrl_global');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      id: 'dev_global',
      studentId: 'std_demo',
      studentName: 'Cumar Cabdi Maxamed',
      parentId: 'prn_demo',
      parentPhone: '+252615000000',
      deviceModel: 'Samsung Galaxy A15 (SM-A155F)',
      isLocked: false,
      lockReason: '',
      lastLockTime: 'Shalay 06:00 PM',
      lastUnlockTime: 'Saaqaddan Hore 08:00 AM',
      lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Online',
      batteryLevel: 88,
      isCharging: false,
      studyModeActive: false,
      scheduledLockEnabled: true,
      scheduleLockTime: '18:00',
      scheduleUnlockTime: '20:00',
      appControlRules: DEFAULT_APP_RULES,
      parentPinHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      diagnostics: {
        deviceAdmin: 'PASS',
        deviceOwner: 'FAIL',
        accessibilityService: 'FAIL',
        notificationPermission: 'PASS',
        backgroundService: 'PASS',
        batteryOptimization: 'PASS',
        lockCapability: 'PASS',
        appControlCapability: 'FAIL',
        deviceConnection: 'PASS',
        details: {},
      },
    };
  });

  // Scheduled Lock background worker timer check (runs every 10s)
  useEffect(() => {
    const timer = setInterval(() => {
      const saved = localStorage.getItem('tahdiib_device_ctrl_global') || localStorage.getItem('tahdiib_device_ctrl_std_demo');
      if (saved) {
        try {
          const parsed: StudentDeviceControlState = JSON.parse(saved);
          if (parsed.scheduledLockEnabled && parsed.scheduleLockTime && parsed.scheduleUnlockTime) {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (timeStr >= parsed.scheduleLockTime && timeStr < parsed.scheduleUnlockTime) {
              if (!parsed.isLocked) {
                parsed.isLocked = true;
                parsed.lockReason = `Scheduled Lock (Jadwalka ${parsed.scheduleLockTime})`;
                parsed.status = 'Locked';
                setStudentDeviceState(parsed);
                localStorage.setItem('tahdiib_device_ctrl_global', JSON.stringify(parsed));
              }
            } else if (timeStr >= parsed.scheduleUnlockTime) {
              if (parsed.isLocked && parsed.lockReason.includes('Scheduled')) {
                parsed.isLocked = false;
                parsed.lockReason = '';
                parsed.status = 'Online';
                setStudentDeviceState(parsed);
                localStorage.setItem('tahdiib_device_ctrl_global', JSON.stringify(parsed));
              }
            }
          }
        } catch (e) {}
      }
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // 1. Seed initial data to Firestore if cloud database is empty
  useEffect(() => {
    // Attempt screen orientation lock to portrait for mobile / web app
    try {
      if (window.screen && window.screen.orientation && 'lock' in window.screen.orientation) {
        (window.screen.orientation as any).lock('portrait').catch(() => {
          // Ignore if user interaction or full-screen required
        });
      }
    } catch (e) {
      // Safe fallback
    }

    seedInitialDataIfEmpty({
      settings: initialSchoolSettings,
      users: initialUsers,
      students: initialStudents,
      teachers: initialTeachers,
      parents: initialParents,
      classes: initialClasses,
      hifzRecords: initialHifzRecords,
      attendance: initialAttendanceRecords,
      teacherAttendance: [],
      payments: initialPayments,
      exams: initialExams,
      teacherEvaluations: initialTeacherEvaluations,
    });
  }, []);

  // 2. Real-time subscriptions to Firestore cloud database
  useEffect(() => {
    const unsubSettings = subscribeSettings((newSettings) => {
      setSettings(newSettings);
      Storage.saveSettings(newSettings);
    });

    const unsubUsers = subscribeCollection<User>(COLLECTIONS.USERS, (newList) => {
      setUsers(newList);
      Storage.saveUsers(newList);
    });

    const unsubStudents = subscribeCollection<Student>(COLLECTIONS.STUDENTS, (newList) => {
      setStudents(newList);
      Storage.saveStudents(newList);
    });

    const unsubTeachers = subscribeCollection<Teacher>(COLLECTIONS.TEACHERS, (newList) => {
      setTeachers(newList);
      Storage.saveTeachers(newList);
    });

    const unsubParents = subscribeCollection<Parent>(COLLECTIONS.PARENTS, (newList) => {
      setParents(newList);
      Storage.saveParents(newList);
    });

    const unsubClasses = subscribeCollection<ClassRoom>(COLLECTIONS.CLASSES, (newList) => {
      setClasses(newList);
      Storage.saveClasses(newList);
    });

    const unsubGroups = subscribeCollection<ClassGroup>(COLLECTIONS.GROUPS, (newList) => {
      setClassGroups(newList);
      Storage.saveClassGroups(newList);
    });

    const unsubHifz = subscribeCollection<HifzRecord>(COLLECTIONS.HIFZ, (newList) => {
      setHifzRecords(newList);
      Storage.saveHifzRecords(newList);
    });

    const unsubAttendance = subscribeCollection<AttendanceRecord>(COLLECTIONS.ATTENDANCE, (newList) => {
      setAttendance(newList);
      Storage.saveAttendanceRecords(newList);
    });

    const unsubTeacherAttendance = subscribeCollection<TeacherAttendance>(
      COLLECTIONS.TEACHER_ATTENDANCE,
      (newList) => {
        setTeacherAttendance(newList);
        Storage.saveTeacherAttendanceRecords(newList);
      }
    );

    const unsubPayments = subscribeCollection<PaymentTransaction>(COLLECTIONS.PAYMENTS, (newList) => {
      setPayments(newList);
      Storage.savePayments(newList);
    });

    const unsubExams = subscribeCollection<ExamRecord>(COLLECTIONS.EXAMS, (newList) => {
      setExams(newList);
      Storage.saveExams(newList);
    });

    const unsubCurriculum = subscribeCollection<CurriculumUnit>(COLLECTIONS.CURRICULUM, (newList) => {
      setCurriculumUnits(newList);
      Storage.saveCurriculumUnits(newList);
    });

    const unsubEvaluations = subscribeCollection<TeacherEvaluation>(
      COLLECTIONS.TEACHER_EVALUATIONS,
      (newList) => {
        setEvaluations(newList);
        Storage.saveTeacherEvaluations(newList);
      }
    );

    const unsubPush = subscribePushNotifications((newList) => {
      setPushNotifications(newList);
    });

    const unsubAutoSync = subscribeSystemAutoSync(() => {
      // Re-hydrate local storage state automatically across tabs/windows
      setSettings(Storage.getSettings());
      setUsers(Storage.getUsers());
      setStudents(Storage.getStudents());
      setTeachers(Storage.getTeachers());
      setParents(Storage.getParents());
      setClasses(Storage.getClasses());
      setClassGroups(Storage.getClassGroups());
      setHifzRecords(Storage.getHifzRecords());
      setAttendance(Storage.getAttendanceRecords());
      setTeacherAttendance(Storage.getTeacherAttendanceRecords());
      setPayments(Storage.getPayments());
      setExams(Storage.getExams());
      setCurriculumUnits(Storage.getCurriculumUnits());
      setEvaluations(Storage.getTeacherEvaluations());
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubStudents();
      unsubTeachers();
      unsubParents();
      unsubClasses();
      unsubHifz();
      unsubAttendance();
      unsubTeacherAttendance();
      unsubPayments();
      unsubExams();
      unsubCurriculum();
      unsubEvaluations();
      unsubPush();
      unsubAutoSync();
    };
  }, []);

  // 3. Live sync currentUser with Admin updates in Firestore & enforce Session Invalidation
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const match = users.find(
        (u) =>
          u.id === currentUser.id ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
      );

      // If user account is not found in list (e.g. removed):
      // Keep Admin logged in unconditionally
      if (!match) {
        if (currentUser.role === 'admin') {
          return;
        }
        const notice = 'Admin-ka ayaa tir-tiray akoonkaaga. Fadlan la xiriir maamulka.';
        setSessionNotice(notice);
        alert(`🔒 RE-LOGIN QASAB AH:\n\n${notice}`);
        setCurrentUser(null);
        Storage.saveCurrentUser(null as any);
        return;
      }

      // If account blocked/inactive (for non-admin users only):
      if ((match.status === 'Blocked' || match.status === 'Inactive') && currentUser.role !== 'admin') {
        const notice = 'Aqoonsigaaga waxaa xiray ama joojiyay Admin-ka. Fadlan la xiriir Maamulka.';
        setSessionNotice(notice);
        alert(`🔒 RE-LOGIN QASAB AH:\n\n${notice}`);
        setCurrentUser(null);
        Storage.saveCurrentUser(null as any);
        return;
      }

      // Sync any session changes (Username, Password, Name, Phone, Role) seamlessly without logging out
      if (
        match.username !== currentUser.username ||
        match.password !== currentUser.password ||
        match.role !== currentUser.role ||
        match.name !== currentUser.name ||
        match.phone !== currentUser.phone
      ) {
        setCurrentUser(match);
        Storage.saveCurrentUser(match);
      }
    }
  }, [users]);

  // Guard tab routing based on user role
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    if (role === 'parent' && ['teachers', 'parents', 'payments', 'reports', 'settings', 'messaging'].includes(activeTab)) {
      setActiveTab('dashboard');
    } else if (role === 'teacher' && ['teachers', 'parents', 'payments', 'reports', 'settings', 'messaging'].includes(activeTab)) {
      setActiveTab('dashboard');
    } else if (role === 'student' && !['dashboard', 'quran', 'hifz', 'attendance', 'exams', 'apk'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, activeTab]);

  // Login/Logout & User handlers
  const handleTrigger29thBilling = (forceRun = false) => {
    const { updatedStudents, updatedParents, updatedSettings, newPayments, result } = execute29thMonthlyBilling(
      students,
      parents,
      settings,
      payments,
      { forceRun }
    );

    if (result.alreadyBilledForThisMonth && !forceRun) {
      setSessionNotice(`ℹ️ Bisha (${result.monthYear}) mar hore ayaa la dalacay oo la mariyay 29-ka Bisha.`);
      return;
    }

    setStudents(updatedStudents);
    Storage.saveStudents(updatedStudents);
    saveBatchItemsToFirestore(COLLECTIONS.STUDENTS, updatedStudents);

    setParents(updatedParents);
    Storage.saveParents(updatedParents);
    saveBatchItemsToFirestore(COLLECTIONS.PARENTS, updatedParents);

    setSettings(updatedSettings);
    Storage.saveSettings(updatedSettings);
    saveSettingsToFirestore(updatedSettings);

    setPayments(newPayments);
    Storage.savePayments(newPayments);
    saveBatchItemsToFirestore(COLLECTIONS.PAYMENTS, newPayments);

    setSessionNotice(
      `🎉 SI GUUL AH AYAA LOO DALACAY! Bisha (${result.monthYear}): Waxaa kugu dalacantay $${result.totalBilledAmount} oo loo qaybiyay ${result.billedCount} arday maanta oo ay tahay 29-ka Bisha!`
    );
  };

  // Auto Check for 29th Monthly Billing on App Load / State ready
  useEffect(() => {
    if (students.length === 0) return;
    if (settings.autoBillingEnabled === false) return;

    const now = new Date();
    const targetDay = settings.autoBillingDay || 29;
    const currentMonthYear = getCurrentSomaliMonthYear(now);

    if (now.getDate() >= targetDay && settings.lastBilledMonth !== currentMonthYear) {
      handleTrigger29thBilling(false);
    }
  }, [students.length, settings.lastBilledMonth, settings.autoBillingEnabled, settings.autoBillingDay]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    Storage.saveCurrentUser(user);
    setSessionNotice(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    Storage.saveCurrentUser(null);
  };

  const handleUpdateUser = (updatedUser: User) => {
    // 1. Save directly to Firestore cloud database
    saveItemToFirestore(COLLECTIONS.USERS, updatedUser);

    // 2. Synchronously update local users state and localStorage to prevent stale comparison logouts
    setUsers((prevUsers) => {
      const updatedList = prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      Storage.saveUsers(updatedList);
      return updatedList;
    });

    // 3. Update current logged-in user state & persistent storage
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      Storage.saveCurrentUser(updatedUser);
    }
  };

  const handleSaveSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
    saveSettingsToFirestore(newSettings);
  };

  const handleSaveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    Storage.saveUsers(newUsers);
    saveBatchItemsToFirestore(COLLECTIONS.USERS, newUsers);

    // Keep currentUser state in sync if edited within user management
    if (currentUser) {
      const match = newUsers.find((u) => u.id === currentUser.id);
      if (match) {
        setCurrentUser(match);
        Storage.saveCurrentUser(match);
      }
    }
  };

  // Helper to sync parent and user records for a student
  const syncParentAndUserForStudent = (
    student: Student,
    currentParents: Parent[],
    currentUsers: User[]
  ): { updatedParents: Parent[]; updatedUsers: User[] } => {
    let nextParents = [...currentParents];
    let nextUsers = [...currentUsers];

    const cleanStudentPhone = (student.parentPhone || '').replace(/\D/g, '');
    const studentParentName = (student.parentName || '').trim().toLowerCase();

    if (!cleanStudentPhone && !studentParentName) {
      return { updatedParents: nextParents, updatedUsers: nextUsers };
    }

    let parentIndex = nextParents.findIndex((p) => {
      const cleanPPhone = (p.phone || '').replace(/\D/g, '');
      const cleanPName = (p.fullName || '').trim().toLowerCase();
      if (cleanStudentPhone && cleanPPhone && cleanStudentPhone === cleanPPhone) return true;
      if (studentParentName && cleanPName && studentParentName === cleanPName) return true;
      return false;
    });

    if (parentIndex !== -1) {
      const existing = nextParents[parentIndex];
      const hasChildId = existing.childrenIds.includes(student.id);
      const updatedChildren = hasChildId ? existing.childrenIds : [...existing.childrenIds, student.id];

      nextParents[parentIndex] = {
        ...existing,
        fullName: existing.fullName || student.parentName,
        phone: existing.phone || student.parentPhone,
        childrenIds: updatedChildren,
      };
    } else {
      const newParent: Parent = {
        id: `prn-${Date.now()}`,
        fullName: student.parentName || 'Waalidka Ardayga',
        phone: student.parentPhone || '+252 61 ',
        address: 'Muqdisho',
        childrenIds: [student.id],
        totalPendingFees: student.feeRemaining ?? (student.feeStatus === 'Paid' ? 0 : student.feeMonthly),
      };
      nextParents.unshift(newParent);
    }

    const phoneDigits = cleanStudentPhone.slice(-7) || `${Date.now()}`.slice(-6);
    const parentUserIndex = nextUsers.findIndex(
      (u) =>
        u.role === 'parent' &&
        ((cleanStudentPhone && u.phone && u.phone.replace(/\D/g, '') === cleanStudentPhone) ||
          (student.parentName && u.name.trim().toLowerCase() === studentParentName))
    );

    if (parentUserIndex !== -1) {
      const existingUser = nextUsers[parentUserIndex];
      nextUsers[parentUserIndex] = {
        ...existingUser,
        name: student.parentName || existingUser.name,
        phone: student.parentPhone || existingUser.phone,
      };
    } else {
      const newParentUser: User = {
        id: `usr-prn-${Date.now()}`,
        name: student.parentName || 'Waalidka Ardayga',
        username: cleanStudentPhone ? `walid_${phoneDigits}` : `walid_${Date.now().toString().slice(-4)}`,
        password: '123',
        email: `walid_${phoneDigits}@tahdiib.edu`,
        role: 'parent',
        phone: student.parentPhone,
        status: 'Active',
      };
      nextUsers.push(newParentUser);
    }

    return { updatedParents: nextParents, updatedUsers: nextUsers };
  };

  // Add Handlers
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'studentId'>) => {
    const nextIdNum = students.length + 1;
    const studentId = `TA-2026-${String(nextIdNum).padStart(3, '0')}`;
    const newStudent: Student = {
      ...newStudentData,
      id: `std-${Date.now()}`,
      studentId,
    };

    const updatedStudents = [newStudent, ...students];
    setStudents(updatedStudents);
    Storage.saveStudents(updatedStudents);
    saveItemToFirestore(COLLECTIONS.STUDENTS, newStudent);

    // Sync parent and user account
    const { updatedParents, updatedUsers } = syncParentAndUserForStudent(newStudent, parents, users);
    setParents(updatedParents);
    Storage.saveParents(updatedParents);
    saveBatchItemsToFirestore(COLLECTIONS.PARENTS, updatedParents);

    setUsers(updatedUsers);
    Storage.saveUsers(updatedUsers);
    saveBatchItemsToFirestore(COLLECTIONS.USERS, updatedUsers);

    logAuditAction(
      currentUser,
      'Arday Cusub La Qoray',
      'students',
      `Waxaa arday cusub oo la yiraahdo "${newStudent.fullName}" (${newStudent.studentId}) loo qoray fasalka.`
    );
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updatedStudents);
    Storage.saveStudents(updatedStudents);
    saveItemToFirestore(COLLECTIONS.STUDENTS, updatedStudent);

    // Sync parent and user account
    const { updatedParents, updatedUsers } = syncParentAndUserForStudent(updatedStudent, parents, users);
    setParents(updatedParents);
    Storage.saveParents(updatedParents);
    saveBatchItemsToFirestore(COLLECTIONS.PARENTS, updatedParents);

    setUsers(updatedUsers);
    Storage.saveUsers(updatedUsers);
    saveBatchItemsToFirestore(COLLECTIONS.USERS, updatedUsers);

    logAuditAction(
      currentUser,
      'Xogta Ardayga La Beddelay',
      'students',
      `Waxaa la beddelay xogta ardayga "${updatedStudent.fullName}" (${updatedStudent.studentId}).`
    );
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    if (confirm('Ma ziiddaa inaad tirtirto ardaygan?')) {
      deleteItemFromFirestore(COLLECTIONS.STUDENTS, id);
      setStudents((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        Storage.saveStudents(updated);
        return updated;
      });

      logAuditAction(
        currentUser,
        'Arday La Tirtiray',
        'students',
        `Waxaa la tirtiray xogta ardayga "${target?.fullName || id}".`
      );
    }
  };

  const handleAddTeacher = (
    newTchData: Omit<Teacher, 'id' | 'teacherId'>,
    credentials?: { username: string; password: string }
  ) => {
    const nextIdNum = teachers.length + 1;
    const teacherId = `TCH-${String(nextIdNum).padStart(3, '0')}`;
    const newTeacher: Teacher = {
      ...newTchData,
      id: `tch-${Date.now()}`,
      teacherId,
    };
    const updatedTeachers = [newTeacher, ...teachers];
    setTeachers(updatedTeachers);
    Storage.saveTeachers(updatedTeachers);
    saveItemToFirestore(COLLECTIONS.TEACHERS, newTeacher);

    if (credentials?.username) {
      const newUser: User = {
        id: `usr-tch-${Date.now()}`,
        name: newTeacher.fullName,
        username: credentials.username.toLowerCase().trim(),
        password: credentials.password || '123456',
        role: 'teacher',
        email: newTeacher.email,
        phone: newTeacher.phone,
        status: 'Active',
      };
      const updatedUsers = [newUser, ...users];
      setUsers(updatedUsers);
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, newUser);
    }
  };

  const handleUpdateTeacher = (
    updatedTeacher: Teacher,
    credentials?: { username: string; password: string }
  ) => {
    const updatedTeachers = teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t));
    setTeachers(updatedTeachers);
    Storage.saveTeachers(updatedTeachers);
    saveItemToFirestore(COLLECTIONS.TEACHERS, updatedTeacher);

    // Look up matching teacher user by ID, email, phone, or name
    const existingUser = users.find(
      (u) =>
        u.id === updatedTeacher.id ||
        (u.email && updatedTeacher.email && u.email.toLowerCase() === updatedTeacher.email.toLowerCase()) ||
        (u.phone && updatedTeacher.phone && u.phone.replace(/\D/g, '') === updatedTeacher.phone.replace(/\D/g, '')) ||
        u.name.trim().toLowerCase() === updatedTeacher.fullName.trim().toLowerCase()
    );

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        name: updatedTeacher.fullName,
        username: credentials?.username ? credentials.username.toLowerCase().trim() : existingUser.username,
        password: credentials?.password ? credentials.password.trim() : existingUser.password,
        phone: updatedTeacher.phone,
        email: updatedTeacher.email || existingUser.email,
      };
      const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      setUsers(updatedUsers);
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, updatedUser);

      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        Storage.saveCurrentUser(updatedUser);
      }
    } else if (credentials?.username) {
      const newUser: User = {
        id: `usr-tch-${Date.now()}`,
        name: updatedTeacher.fullName,
        username: credentials.username.toLowerCase().trim(),
        password: credentials.password || '123456',
        role: 'teacher',
        email: updatedTeacher.email || `${updatedTeacher.fullName.toLowerCase().replace(/\s+/g, '')}@tahdiib.edu`,
        phone: updatedTeacher.phone,
        status: 'Active',
      };
      const updatedUsers = [newUser, ...users];
      setUsers(updatedUsers);
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, newUser);
    }
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto macallinkan?')) {
      deleteItemFromFirestore(COLLECTIONS.TEACHERS, id);
      setTeachers((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        Storage.saveTeachers(updated);
        return updated;
      });
    }
  };

  const handleSaveTeacherEvaluation = (evalData: TeacherEvaluation) => {
    const isEdit = evaluations.some((e) => e.id === evalData.id);
    let updated: TeacherEvaluation[];
    if (isEdit) {
      updated = evaluations.map((e) => (e.id === evalData.id ? evalData : e));
    } else {
      updated = [evalData, ...evaluations];
    }
    setEvaluations(updated);
    Storage.saveTeacherEvaluations(updated);
    saveItemToFirestore(COLLECTIONS.TEACHER_EVALUATIONS, evalData);
    logAuditAction(
      currentUser,
      isEdit ? 'UPDATE_TEACHER_EVALUATION' : 'CREATE_TEACHER_EVALUATION',
      'teachers',
      `Qiimaynta macallin ${evalData.teacherName} (Dhibcaha: ${evalData.overallRating}/5)`
    );
  };

  const handleDeleteTeacherEvaluation = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto qiimayntan?')) {
      const target = evaluations.find((e) => e.id === id);
      deleteItemFromFirestore(COLLECTIONS.TEACHER_EVALUATIONS, id);
      const updated = evaluations.filter((e) => e.id !== id);
      setEvaluations(updated);
      Storage.saveTeacherEvaluations(updated);
      if (target) {
        logAuditAction(
          currentUser,
          'DELETE_TEACHER_EVALUATION',
          'teachers',
          `Waxaa la tirtiray qiimayntii macallin ${target.teacherName}`
        );
      }
    }
  };

  const handleAddParent = (
    newPrnData: Omit<Parent, 'id'>,
    credentials?: { username: string; password: string }
  ) => {
    const newParent: Parent = {
      ...newPrnData,
      id: `prn-${Date.now()}`,
    };
    const updatedParents = [newParent, ...parents];
    setParents(updatedParents);
    Storage.saveParents(updatedParents);
    saveItemToFirestore(COLLECTIONS.PARENTS, newParent);

    if (credentials?.username) {
      const newUser: User = {
        id: `usr-prn-${Date.now()}`,
        name: newParent.fullName,
        username: credentials.username.toLowerCase().trim(),
        password: credentials.password || '123456',
        role: 'parent',
        email: `${newParent.fullName.toLowerCase().replace(/\s+/g, '')}@tahdiib.edu`,
        phone: newParent.phone,
        status: 'Active',
      };
      const updatedUsers = [newUser, ...users];
      setUsers(updatedUsers);
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, newUser);
    }
  };

  const handleUpdateParent = (
    updatedParent: Parent,
    credentials?: { username: string; password: string }
  ) => {
    const updatedParents = parents.map((p) => (p.id === updatedParent.id ? updatedParent : p));
    setParents(updatedParents);
    Storage.saveParents(updatedParents);
    saveItemToFirestore(COLLECTIONS.PARENTS, updatedParent);

    // Look up matching parent user by ID, phone, or name
    const existingUser = users.find(
      (u) =>
        u.id === updatedParent.id ||
        (u.phone && updatedParent.phone && u.phone.replace(/\D/g, '') === updatedParent.phone.replace(/\D/g, '')) ||
        u.name.trim().toLowerCase() === updatedParent.fullName.trim().toLowerCase()
    );

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        name: updatedParent.fullName,
        username: credentials?.username ? credentials.username.toLowerCase().trim() : existingUser.username,
        password: credentials?.password ? credentials.password.trim() : existingUser.password,
        phone: updatedParent.phone,
      };
      const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      setUsers(updatedUsers);
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, updatedUser);

      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        Storage.saveCurrentUser(updatedUser);
      }
    } else if (credentials?.username) {
      const newUser: User = {
        id: `usr-prn-${Date.now()}`,
        name: updatedParent.fullName,
        username: credentials.username.toLowerCase().trim(),
        password: credentials.password || '123456',
        role: 'parent',
        email: `${updatedParent.fullName.toLowerCase().replace(/\s+/g, '')}@tahdiib.edu`,
        phone: updatedParent.phone,
        status: 'Active',
      };
      const updatedUsers = [newUser, ...users];
      setUsers(updatedUsers);
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, newUser);
    }
  };

  const handleDeleteParent = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto waalidkan?')) {
      deleteItemFromFirestore(COLLECTIONS.PARENTS, id);
      setParents((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        Storage.saveParents(updated);
        return updated;
      });
    }
  };

  const handleAddClass = (newClsData: Omit<ClassRoom, 'id'>) => {
    const newCls: ClassRoom = {
      ...newClsData,
      id: `cls-${Date.now()}`,
    };
    const updatedClasses = [...classes, newCls];
    setClasses(updatedClasses);
    Storage.saveClasses(updatedClasses);
    saveItemToFirestore(COLLECTIONS.CLASSES, newCls);
  };

  const handleUpdateClass = (updatedClass: ClassRoom) => {
    const updatedClasses = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClasses(updatedClasses);
    Storage.saveClasses(updatedClasses);
    saveItemToFirestore(COLLECTIONS.CLASSES, updatedClass);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto fasalkan?')) {
      deleteItemFromFirestore(COLLECTIONS.CLASSES, id);
      setClasses((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        Storage.saveClasses(updated);
        return updated;
      });
    }
  };

  const handleAddHifzRecord = (newHifzData: Omit<HifzRecord, 'id'>) => {
    const newHifz: HifzRecord = {
      ...newHifzData,
      id: `hfz-${Date.now()}`,
    };
    const updatedHifz = [newHifz, ...hifzRecords];
    setHifzRecords(updatedHifz);
    Storage.saveHifzRecords(updatedHifz);
    saveItemToFirestore(COLLECTIONS.HIFZ, newHifz);

    const studentToUpdate = students.find((s) => s.id === newHifzData.studentId);
    if (studentToUpdate) {
      const updatedStudent: Student = {
        ...studentToUpdate,
        currentJuz: Math.max(studentToUpdate.currentJuz, newHifzData.sabqiJuz),
        currentSurah: newHifzData.subaxSurah,
      };
      const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      setStudents(updatedStudents);
      Storage.saveStudents(updatedStudents);
      saveItemToFirestore(COLLECTIONS.STUDENTS, updatedStudent);
    }
  };

  const handleUpdateHifzRecord = (updatedRecord: HifzRecord) => {
    const updatedHifz = hifzRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    setHifzRecords(updatedHifz);
    Storage.saveHifzRecords(updatedHifz);
    saveItemToFirestore(COLLECTIONS.HIFZ, updatedRecord);
  };

  const handleDeleteHifzRecord = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto casharkan xifdiga ah?')) {
      deleteItemFromFirestore(COLLECTIONS.HIFZ, id);
      setHifzRecords((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        Storage.saveHifzRecords(updated);
        return updated;
      });
    }
  };

  const handleSaveAttendance = (inputAttendance: AttendanceRecord | AttendanceRecord[]) => {
    const recordsArray = Array.isArray(inputAttendance) ? inputAttendance : [inputAttendance];

    // Merge into current attendance records
    setAttendance((prev) => {
      let updated = [...prev];
      recordsArray.forEach((rec) => {
        const idx = updated.findIndex((r) => r.id === rec.id || (r.studentId === rec.studentId && r.date === rec.date));
        if (idx >= 0) {
          updated[idx] = rec;
        } else {
          updated.push(rec);
        }
      });
      Storage.saveAttendanceRecords(updated);
      return updated;
    });

    saveBatchItemsToFirestore(COLLECTIONS.ATTENDANCE, recordsArray);

    // Process Automatic Lesson Progression Engine
    let updatedStudentsList = [...students];
    let newLessonHistoryRecords: LessonHistoryRecord[] = [];

    recordsArray.forEach((rec) => {
      const stIdx = updatedStudentsList.findIndex((s) => s.id === rec.studentId);
      if (stIdx >= 0) {
        const st = updatedStudentsList[stIdx];
        const curLessonNum = st.currentAyah || 25;
        const curLessonName = st.currentSurah || `Casharka ${curLessonNum}-aad`;

        let evalStatus: LessonStatus = 'Pending';
        if (rec.status === 'Present' || rec.status === 'Late') {
          if (rec.casharStatus === 'Sax') {
            evalStatus = 'Completed';
          } else if (rec.casharStatus === 'Maya') {
            evalStatus = 'Failed/Repeat';
          }
        }

        const progression = computeLessonProgression(curLessonNum, curLessonName, evalStatus, rec.date);

        // Update student state for next study day
        const updatedStudent: Student = {
          ...st,
          currentAyah: progression.nextLessonNumber,
          currentSurah: progression.nextLessonName,
        };

        updatedStudentsList[stIdx] = updatedStudent;
        saveItemToFirestore(COLLECTIONS.STUDENTS, updatedStudent);

        // Create Lesson History Record
        const historyRecord: LessonHistoryRecord = {
          id: `lh_${rec.studentId}_${rec.date}`,
          studentId: rec.studentId,
          studentName: rec.studentName,
          date: rec.date,
          dayName: getSomaliDayName(new Date(rec.date)),
          lessonNumber: curLessonNum,
          lessonName: curLessonName,
          status: evalStatus,
          nextLessonDate: progression.nextLessonDate,
          nextLessonNumber: progression.nextLessonNumber,
          nextLessonName: progression.nextLessonName,
          teacherId: rec.teacherId,
          teacherName: rec.teacherName,
          notes: progression.progressionNote,
          updatedAt: new Date().toISOString(),
        };

        newLessonHistoryRecords.push(historyRecord);
      }
    });

    if (updatedStudentsList.length > 0) {
      setStudents(updatedStudentsList);
      Storage.saveStudents(updatedStudentsList);
    }

    if (newLessonHistoryRecords.length > 0) {
      saveBatchItemsToFirestore(COLLECTIONS.LESSON_HISTORY, newLessonHistoryRecords);
    }

    logAuditAction(
      currentUser,
      'Xaadiriska & Casharrada La Keydiyay',
      'attendance',
      `Waxaa la cusboonaysiiyay xaadiriska & qorsaha casharrada otomaatigga ah ee (${recordsArray.length} arday).`
    );
  };

  const handleSaveTeacherAttendance = (newRecords: TeacherAttendance[]) => {
    setTeacherAttendance(newRecords);
    Storage.saveTeacherAttendanceRecords(newRecords);
    saveBatchItemsToFirestore(COLLECTIONS.TEACHER_ATTENDANCE, newRecords);

    logAuditAction(
      currentUser,
      'Xaadiriska Macallimiinta La Keydiyay',
      'attendance',
      `Waxaa la keydiyay xaadiriska macallimiinta (${newRecords.length} diiwaan).`
    );
  };

  const handleAddPayment = (newPayData: Omit<PaymentTransaction, 'id' | 'invoiceNumber'>) => {
    const invoiceNum = `INV-2026-${String(payments.length + 1).padStart(4, '0')}`;
    const newPay: PaymentTransaction = {
      ...newPayData,
      id: `pay-${Date.now()}`,
      invoiceNumber: invoiceNum,
    };
    const updatedPayments = [newPay, ...payments];
    setPayments(updatedPayments);
    Storage.savePayments(updatedPayments);
    saveItemToFirestore(COLLECTIONS.PAYMENTS, newPay);

    const studentToUpdate = students.find((s) => s.id === newPayData.studentId);
    if (studentToUpdate) {
      const newTotalPaid = (studentToUpdate.feePaid || 0) + newPayData.amountPaid;
      const newRemaining = Math.max(0, (studentToUpdate.feeMonthly || 0) - newTotalPaid);
      const newStatus: 'Paid' | 'Pending' | 'Overdue' =
        newRemaining <= 0 ? 'Paid' : newTotalPaid > 0 ? 'Pending' : 'Overdue';

      const updatedStudent: Student = {
        ...studentToUpdate,
        feePaid: newTotalPaid,
        feeRemaining: newRemaining,
        feeStatus: newStatus,
      };
      const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      setStudents(updatedStudents);
      Storage.saveStudents(updatedStudents);
      saveItemToFirestore(COLLECTIONS.STUDENTS, updatedStudent);
    }

    setReceiptToPrint(newPay);

    logAuditAction(
      currentUser,
      'Lacag Bixin La Diiwaangeliyay',
      'payments',
      `Waxaa la bixiyay lacag $${newPay.amountPaid} ah oo uu bixiyay ardayda ${newPay.studentName} (${newPay.invoiceNumber}).`
    );
  };

  const handleUpdatePayment = (updatedPay: PaymentTransaction) => {
    const updatedPayments = payments.map((p) => (p.id === updatedPay.id ? updatedPay : p));
    setPayments(updatedPayments);
    Storage.savePayments(updatedPayments);
    saveItemToFirestore(COLLECTIONS.PAYMENTS, updatedPay);

    // Recalculate student cumulative fees
    const studentToUpdate = students.find((s) => s.id === updatedPay.studentId);
    if (studentToUpdate) {
      const studentPayments = updatedPayments.filter((p) => p.studentId === updatedPay.studentId);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const remaining = Math.max(0, (studentToUpdate.feeMonthly || 0) - totalPaid);
      const newStatus: 'Paid' | 'Pending' | 'Overdue' =
        remaining <= 0 ? 'Paid' : totalPaid > 0 ? 'Pending' : 'Overdue';

      const updatedStudent: Student = {
        ...studentToUpdate,
        feePaid: totalPaid,
        feeRemaining: remaining,
        feeStatus: newStatus,
      };
      const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      setStudents(updatedStudents);
      Storage.saveStudents(updatedStudents);
      saveItemToFirestore(COLLECTIONS.STUDENTS, updatedStudent);
    }
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto bixintan lacagta ah?')) {
      const targetPay = payments.find((p) => p.id === id);
      deleteItemFromFirestore(COLLECTIONS.PAYMENTS, id);
      const updatedPayments = payments.filter((p) => p.id !== id);
      setPayments(updatedPayments);
      Storage.savePayments(updatedPayments);

      if (targetPay) {
        const studentToUpdate = students.find((s) => s.id === targetPay.studentId);
        if (studentToUpdate) {
          const studentPayments = updatedPayments.filter((p) => p.studentId === targetPay.studentId);
          const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
          const remaining = Math.max(0, (studentToUpdate.feeMonthly || 0) - totalPaid);
          const newStatus: 'Paid' | 'Pending' | 'Overdue' =
            remaining <= 0 ? 'Paid' : totalPaid > 0 ? 'Pending' : 'Overdue';

          const updatedStudent: Student = {
            ...studentToUpdate,
            feePaid: totalPaid,
            feeRemaining: remaining,
            feeStatus: newStatus,
          };
          const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
          setStudents(updatedStudents);
          Storage.saveStudents(updatedStudents);
          saveItemToFirestore(COLLECTIONS.STUDENTS, updatedStudent);
        }
      }
    }
  };

  const handleAddExam = (newExamData: Omit<ExamRecord, 'id' | 'totalScore' | 'averagePercentage'>) => {
    const totalScore =
      newExamData.quranScore +
      newExamData.tajweedScore +
      newExamData.tarbiyaScore +
      newExamData.carabigaScore;
    const averagePercentage = Number((totalScore / 4).toFixed(2));

    const newExam: ExamRecord = {
      ...newExamData,
      id: `exm-${Date.now()}`,
      totalScore,
      averagePercentage,
    };

    const updatedExams = [newExam, ...exams];
    setExams(updatedExams);
    Storage.saveExams(updatedExams);
    saveItemToFirestore(COLLECTIONS.EXAMS, newExam);
    setReportCardToPrint(newExam);
  };

  const handleUpdateExam = (updatedExam: ExamRecord) => {
    const totalScore =
      updatedExam.quranScore +
      updatedExam.tajweedScore +
      updatedExam.tarbiyaScore +
      updatedExam.carabigaScore;
    const averagePercentage = Number((totalScore / 4).toFixed(2));

    const finalExam = { ...updatedExam, totalScore, averagePercentage };
    const updatedExams = exams.map((e) => (e.id === finalExam.id ? finalExam : e));
    setExams(updatedExams);
    Storage.saveExams(updatedExams);
    saveItemToFirestore(COLLECTIONS.EXAMS, finalExam);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto imtixaankan?')) {
      deleteItemFromFirestore(COLLECTIONS.EXAMS, id);
      setExams((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        Storage.saveExams(updated);
        return updated;
      });
    }
  };

  const handleSaveCurriculumUnit = (unit: CurriculumUnit) => {
    saveItemToFirestore(COLLECTIONS.CURRICULUM, unit);
    setCurriculumUnits((prev) => {
      const exists = prev.some((u) => u.id === unit.id);
      const updated = exists ? prev.map((u) => (u.id === unit.id ? unit : u)) : [unit, ...prev];
      Storage.saveCurriculumUnits(updated);
      return updated;
    });
    logAuditAction(
      currentUser,
      `Curriculum Unit ${unit.unitTitle} Saved`,
      'curriculum',
      `Cutubka manhajka "${unit.unitTitle}" ee maadada ${unit.subjectName} ayaa la keydiyay.`
    );
  };

  const handleDeleteCurriculumUnit = (id: string) => {
    if (confirm('Ma ziiddaa inaad tirtirto cutubkan manhajka?')) {
      deleteItemFromFirestore(COLLECTIONS.CURRICULUM, id);
      setCurriculumUnits((prev) => {
        const updated = prev.filter((u) => u.id !== id);
        Storage.saveCurriculumUnits(updated);
        return updated;
      });
      logAuditAction(
        currentUser,
        'Curriculum Unit Deleted',
        'curriculum',
        `Cutubka manhajka ID: ${id} ayaa la tirtiray.`
      );
    }
  };

  const handleClearAllData = () => {
    if (
      confirm(
        'Ma ziiddaa inaad tirtirto dhammaan xogta (Ardayda, Macallimiinta, Lacagaha, Imtixaanaadka)? Sidaas darteed nidaamku wuxuu noqon doonaa mid nadiif ah.'
      )
    ) {
      students.forEach((s) => deleteItemFromFirestore(COLLECTIONS.STUDENTS, s.id));
      teachers.forEach((t) => deleteItemFromFirestore(COLLECTIONS.TEACHERS, t.id));
      parents.forEach((p) => deleteItemFromFirestore(COLLECTIONS.PARENTS, p.id));
      classes.forEach((c) => deleteItemFromFirestore(COLLECTIONS.CLASSES, c.id));
      hifzRecords.forEach((h) => deleteItemFromFirestore(COLLECTIONS.HIFZ, h.id));
      attendance.forEach((a) => deleteItemFromFirestore(COLLECTIONS.ATTENDANCE, a.id));
      teacherAttendance.forEach((ta) => deleteItemFromFirestore(COLLECTIONS.TEACHER_ATTENDANCE, ta.id));
      payments.forEach((p) => deleteItemFromFirestore(COLLECTIONS.PAYMENTS, p.id));
      exams.forEach((e) => deleteItemFromFirestore(COLLECTIONS.EXAMS, e.id));

      setStudents([]);
      setTeachers([]);
      setParents([]);
      setClasses([]);
      setHifzRecords([]);
      setAttendance([]);
      setTeacherAttendance([]);
      setPayments([]);
      setExams([]);

      Storage.clearAllData();
      localStorage.setItem('tahdiib_seeded_v1', 'true');

      logAuditAction(
        currentUser,
        'System Clear Data',
        'system',
        'Admin-ku wuxuu si buuxda u tirtiray dhammaan xogta ardayda, macallimiinta, lacagaha iyo imtixaanaadka.'
      );

      alert('Dhammaan xogta waa la tirtiray! Nidaamku hadda wuxuu diyaar u yahay xogtaada rasmiga ah.');
    }
  };

  const handleLoadDemoData = () => {
    if (confirm('Ma ziiddaa inaad soo geliso xog tusaale ah (Demo Data) oo cusub?')) {
      saveBatchItemsToFirestore(COLLECTIONS.CLASSES, demoClasses);
      saveBatchItemsToFirestore(COLLECTIONS.STUDENTS, demoStudents);
      saveBatchItemsToFirestore(COLLECTIONS.TEACHERS, demoTeachers);
      saveBatchItemsToFirestore(COLLECTIONS.PARENTS, demoParents);
      saveBatchItemsToFirestore(COLLECTIONS.HIFZ, demoHifzRecords);
      saveBatchItemsToFirestore(COLLECTIONS.ATTENDANCE, demoAttendanceRecords);
      saveBatchItemsToFirestore(COLLECTIONS.PAYMENTS, demoPayments);
      saveBatchItemsToFirestore(COLLECTIONS.EXAMS, demoExams);

      Storage.loadSampleDemoData();

      logAuditAction(
        currentUser,
        'System Load Demo Data',
        'system',
        'Admin-ku wuxuu dib u soo celiyay xogta tusaalaha ah (Demo Data).'
      );

      alert('Xogtii tusaalaha ahayd waa la soo celiyay!');
    }
  };

  const handleResetData = () => {
    if (confirm('Ma ziiddaa inaad dib u bilowdo nidaamka?')) {
      saveSettingsToFirestore(initialSchoolSettings);
      saveBatchItemsToFirestore(COLLECTIONS.USERS, initialUsers);
      saveBatchItemsToFirestore(COLLECTIONS.CLASSES, initialClasses);
      saveBatchItemsToFirestore(COLLECTIONS.STUDENTS, initialStudents);
      saveBatchItemsToFirestore(COLLECTIONS.TEACHERS, initialTeachers);
      saveBatchItemsToFirestore(COLLECTIONS.PARENTS, initialParents);
      saveBatchItemsToFirestore(COLLECTIONS.HIFZ, initialHifzRecords);
      saveBatchItemsToFirestore(COLLECTIONS.ATTENDANCE, initialAttendanceRecords);
      saveBatchItemsToFirestore(COLLECTIONS.PAYMENTS, initialPayments);
      saveBatchItemsToFirestore(COLLECTIONS.EXAMS, initialExams);

      Storage.resetAllData();

      logAuditAction(
        currentUser,
        'System Reset All Data',
        'system',
        'Admin-ku wuxuu si buuxda u reset gareeyay dhammaan nidaamka xogta iyo dejimaha.'
      );

      alert('Nidaamka waa la nadiifiyay si guul leh!');
    }
  };

  const unpaidCount = students.filter((s) => s.feeStatus !== 'Paid').length;

  // Dynamically filter data for logged in parent user
  const parentChildren = getParentChildren(currentUser, students, parents);
  const parentChildIds = parentChildren.map((s) => s.id);

  // Dynamically filter data for logged in teacher user
  const teacherStudents = getTeacherStudents(currentUser, students, classes, teachers, users);
  const teacherStudentIds = teacherStudents.map((s) => s.id);
  const teacherClassesList = getTeacherClasses(currentUser, classes, teachers, users);
  const visibleTeachersList = getVisibleTeachers(currentUser, teachers, users);

  const isTeacherRestricted =
    currentUser?.role === 'teacher' && settings.privacyPermissions?.restrictTeacherToAssignedClassOnly !== false;

  // Dynamically filter data for logged in student user
  const studentUserRecord =
    currentUser?.role === 'student'
      ? students.filter((s) =>
          s.id === currentUser.id ||
          s.studentId.toLowerCase() === currentUser.username.toLowerCase() ||
          s.fullName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
          (currentUser.phone && s.parentPhone && currentUser.phone.replace(/\D/g, '').slice(-7) === s.parentPhone.replace(/\D/g, '').slice(-7))
        )
      : [];
  const studentSelfIds = studentUserRecord.map((s) => s.id);

  const displayStudents =
    currentUser?.role === 'parent'
      ? parentChildren
      : currentUser?.role === 'student'
      ? studentUserRecord
      : isTeacherRestricted
      ? teacherStudents
      : students;

  const displayTeachers =
    currentUser?.role === 'teacher'
      ? visibleTeachersList
      : teachers;

  const displayClasses =
    isTeacherRestricted
      ? teacherClassesList
      : classes;

  const displayAttendance =
    currentUser?.role === 'parent'
      ? attendance.filter((a) => parentChildIds.includes(a.studentId))
      : currentUser?.role === 'student'
      ? attendance.filter((a) => studentSelfIds.includes(a.studentId))
      : isTeacherRestricted
      ? attendance.filter((a) => teacherStudentIds.includes(a.studentId))
      : attendance;

  const displayHifzRecords =
    currentUser?.role === 'parent'
      ? hifzRecords.filter((h) => parentChildIds.includes(h.studentId))
      : currentUser?.role === 'student'
      ? hifzRecords.filter((h) => studentSelfIds.includes(h.studentId))
      : isTeacherRestricted
      ? hifzRecords.filter((h) => teacherStudentIds.includes(h.studentId))
      : hifzRecords;

  const displayPayments =
    currentUser?.role === 'parent'
      ? payments.filter((p) => parentChildIds.includes(p.studentId))
      : currentUser?.role === 'student'
      ? payments.filter((p) => studentSelfIds.includes(p.studentId))
      : isTeacherRestricted
      ? payments.filter((p) => teacherStudentIds.includes(p.studentId))
      : payments;

  const displayExams =
    currentUser?.role === 'parent'
      ? exams.filter((e) => parentChildIds.includes(e.studentId))
      : currentUser?.role === 'student'
      ? exams.filter((e) => studentSelfIds.includes(e.studentId))
      : isTeacherRestricted
      ? exams.filter((e) => teacherStudentIds.includes(e.studentId))
      : exams;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col antialiased selection:bg-emerald-800 selection:text-amber-300 max-w-full overflow-x-hidden">
      {/* Login Modal overlay if not logged in */}
      {!currentUser && (
        <LoginModal
          settings={settings}
          users={users}
          students={students}
          teachers={teachers}
          onLogin={handleLogin}
          onUpdateUser={handleUpdateUser}
          onOpenShareModal={() => setIsOpenShareModal(true)}
          sessionNotice={sessionNotice}
          onClearSessionNotice={() => setSessionNotice(null)}
        />
      )}

      {/* Main Layout */}
      {currentUser && (
        <>
          <Navbar
            currentUser={currentUser}
            settings={settings}
            onLogout={() => setIsOpenLogoutModal(true)}
            onSwitchRole={() => setIsOpenLogoutModal(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenApkModal={() => setActiveTab('apk')}
            onOpenShareModal={() => setIsOpenShareModal(true)}
            onOpenChangeProfile={() => setIsOpenChangeProfileModal(true)}
            onOpenAppUpdateModal={() => setIsOpenAppUpdateModal(true)}
            onOpenPermissionsModal={() => setIsOpenPermissionsModal(true)}
            onNavigateToSettings={() => setActiveTab('settings')}
            onOpenSearchModal={() => setIsOpenSearchModal(true)}
            onOpenLicenseModal={() => setIsOpenLicenseModal(true)}
            onOpenApiKeyModal={() => setIsOpenApiKeyModal(true)}
            onOpenAdminVoiceModal={() => setIsOpenAdminVoiceModal(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
            isMoneyHidden={isMoneyHidden}
            onToggleHideMoney={handleToggleHideMoney}
            notifications={pushNotifications}
            parentChildren={displayStudents}
          />

          <div className="flex-1 flex flex-col md:flex-row">
            <Sidebar
              currentUser={currentUser}
              settings={settings}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }}
              counts={{
                students: students.length,
                teachers: teachers.length,
                classes: classes.length,
                unpaidFees: unpaidCount,
              }}
              isMobileOpen={isMobileMenuOpen}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
              onSwitchRole={() => setIsOpenLogoutModal(true)}
              onLogout={() => setIsOpenLogoutModal(true)}
              onOpenLicenseModal={() => setIsOpenLicenseModal(true)}
              onOpenApiKeyModal={() => setIsOpenApiKeyModal(true)}
            />

            <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-36 md:pb-8 safe-pb overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
              {autoUpdatedBannerVersion && (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white border border-emerald-500/40 shadow-lg flex items-center justify-between flex-wrap gap-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                        <span>✨ Sida Otomaatiga Ah Ayay App-ka Ugu Cusbooneysiiyay Version V{autoUpdatedBannerVersion}!</span>
                      </h4>
                      <p className="text-[11px] text-emerald-200 mt-0.5">
                        Code-ka cusub waa la soo raray. Dhamaan xogtaada ardayda, maaliyadda, xaadiriska iyo casharrada 100% waa dhawran yihiin.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoUpdatedBannerVersion(null)}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    Waad Mahadsan Tahay
                  </button>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  currentUser={currentUser}
                  students={displayStudents}
                  teachers={displayTeachers}
                  parents={parents}
                  classes={displayClasses}
                  hifzRecords={displayHifzRecords}
                  payments={displayPayments}
                  attendance={displayAttendance}
                  settings={settings}
                  setActiveTab={setActiveTab}
                  onOpenStudentModal={() => setIsOpenAddStudentModal(true)}
                  onOpenHifzModal={() => setIsOpenHifzModal(true)}
                  onOpenPaymentModal={() => setIsOpenPaymentModal(true)}
                  onOpenChangeProfile={() => setIsOpenChangeProfileModal(true)}
                  onOpenAdminVoiceModal={() => setIsOpenAdminVoiceModal(true)}
                  onSaveSettings={handleSaveSettings}
                  onPrintReceipt={(pay) => setReceiptToPrint(pay)}
                  isMoneyHidden={isMoneyHidden}
                  onToggleHideMoney={handleToggleHideMoney}
                />
              )}

              {activeTab === 'students' && (
                <StudentsView
                  currentUser={currentUser}
                  students={displayStudents}
                  classes={displayClasses}
                  settings={settings}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  isOpenAddModal={isOpenAddStudentModal}
                  setIsOpenAddModal={setIsOpenAddStudentModal}
                  isMoneyHidden={isMoneyHidden}
                />
              )}

              {activeTab === 'teachers' && (
                <TeachersView
                  currentUser={currentUser}
                  users={users}
                  teachers={displayTeachers}
                  classes={displayClasses}
                  students={displayStudents}
                  settings={settings}
                  evaluations={evaluations}
                  onAddTeacher={handleAddTeacher}
                  onUpdateTeacher={handleUpdateTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                  onSaveEvaluation={handleSaveTeacherEvaluation}
                  onDeleteEvaluation={handleDeleteTeacherEvaluation}
                  isMoneyHidden={isMoneyHidden}
                />
              )}

              {activeTab === 'parents' && (
                <ParentsView
                  currentUser={currentUser}
                  users={users}
                  parents={parents}
                  students={displayStudents}
                  settings={settings}
                  onAddParent={handleAddParent}
                  onUpdateParent={handleUpdateParent}
                  onDeleteParent={handleDeleteParent}
                />
              )}

              {activeTab === 'classes' && (
                <ClassesView
                  currentUser={currentUser}
                  classes={displayClasses}
                  teachers={displayTeachers}
                  students={displayStudents}
                  settings={settings}
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                  onUpdateStudent={handleUpdateStudent}
                />
              )}

              {activeTab === 'classmode' && (
                <ClassModeView
                  currentUser={currentUser}
                  settings={settings}
                  students={displayStudents}
                  classGroups={classGroups}
                  attendanceRecords={displayAttendance}
                  hifzRecords={displayHifzRecords}
                  onSaveAttendance={handleSaveAttendance}
                  onSaveHifz={handleAddHifzRecord}
                  onEndClassSession={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'devices' && (
                <div className="space-y-4">
                  {currentUser?.role === 'admin' && (
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
                      <button
                        onClick={() => setDeviceControlSubTab('parent')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          deviceControlSubTab === 'parent'
                            ? 'bg-slate-900 text-amber-400 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        📱 Parent & Student Device Control
                      </button>
                      <button
                        onClick={() => setDeviceControlSubTab('teacher')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          deviceControlSubTab === 'teacher'
                            ? 'bg-slate-900 text-amber-400 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🏫 Teacher Device Control & Kiosk
                      </button>
                    </div>
                  )}

                  {currentUser?.role === 'parent' || (currentUser?.role === 'admin' && deviceControlSubTab === 'parent') ? (
                    <ParentDeviceControlView
                      currentUser={currentUser}
                      students={displayStudents}
                      parents={parents}
                      settings={settings}
                      onSaveSettings={handleSaveSettings}
                    />
                  ) : (
                    <TeacherDeviceControlView
                      currentUser={currentUser}
                      settings={settings}
                      onSaveSettings={handleSaveSettings}
                    />
                  )}
                </div>
              )}

              {activeTab === 'hifz' && (
                <QuranHifzView
                  currentUser={currentUser}
                  hifzRecords={displayHifzRecords}
                  students={displayStudents}
                  settings={settings}
                  onAddHifzRecord={handleAddHifzRecord}
                  onUpdateHifzRecord={handleUpdateHifzRecord}
                  onDeleteHifzRecord={handleDeleteHifzRecord}
                  onUpdateStudent={handleUpdateStudent}
                  isOpenModal={isOpenHifzModal}
                  setIsOpenModal={setIsOpenHifzModal}
                />
              )}

              {activeTab === 'quran' && <QuranMushafReader />}

              {activeTab === 'muallim' && <MuallimQiraahBook />}

              {activeTab === 'curriculum' && (
                <CurriculumView
                  units={curriculumUnits}
                  classes={displayClasses}
                  teachers={displayTeachers}
                  settings={settings}
                  currentUser={currentUser}
                  onSaveUnit={handleSaveCurriculumUnit}
                  onDeleteUnit={handleDeleteCurriculumUnit}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceView
                  currentUser={currentUser}
                  attendance={displayAttendance}
                  students={displayStudents}
                  teachers={displayTeachers}
                  teacherAttendance={teacherAttendance}
                  classes={displayClasses}
                  classGroups={classGroups}
                  settings={settings}
                  onSaveAttendance={handleSaveAttendance}
                  onSaveTeacherAttendance={handleSaveTeacherAttendance}
                />
              )}

              {activeTab === 'messaging' && (
                <MessagingView
                  students={displayStudents}
                  parents={parents}
                  attendance={displayAttendance}
                  classes={displayClasses}
                  settings={settings}
                  teachers={displayTeachers}
                  currentUser={currentUser}
                  onSaveSettings={handleSaveSettings}
                />
              )}

              {activeTab === 'parents_chat' && (
                <ParentsChatView
                  parents={parents}
                  students={displayStudents}
                  teachers={displayTeachers}
                  settings={settings}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'sms_management' && (
                <SmsManagementView
                  students={displayStudents}
                  parents={parents}
                  teachers={displayTeachers}
                  classes={displayClasses}
                  settings={settings}
                  currentUser={currentUser}
                  onSaveSettings={handleSaveSettings}
                  onOpenHormuudApplicationModal={() => setIsOpenHormuudApplicationModal(true)}
                />
              )}

              {activeTab === 'payments' && (
                !canUserAccessPayments(currentUser, settings) ? (
                  <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border-2 border-rose-200 shadow-xl text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">🔒 Helitaanka Lacagaha Waa Xiran Yahay</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Admin-ka dugsiga ayaa kaa xiray ogolaanshaha eegista ama maamulida bogga Lacagaha (Payments). Fadlan kala xiriir Maamulaha guud si uu kuugu furo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <PaymentsView
                    currentUser={currentUser}
                    payments={displayPayments}
                    students={displayStudents}
                    settings={settings}
                    onAddPayment={handleAddPayment}
                    onUpdatePayment={handleUpdatePayment}
                    onDeletePayment={handleDeletePayment}
                    onPrintReceipt={(pay) => setReceiptToPrint(pay)}
                    isOpenModal={isOpenPaymentModal}
                    setIsOpenModal={setIsOpenPaymentModal}
                    isMoneyHidden={isMoneyHidden}
                    onTrigger29thBilling={handleTrigger29thBilling}
                  />
                )
              )}

              {activeTab === 'exams' && (
                <ExamsView
                  currentUser={currentUser}
                  exams={displayExams}
                  students={displayStudents}
                  classes={classes}
                  settings={settings}
                  onAddExam={handleAddExam}
                  onUpdateExam={handleUpdateExam}
                  onDeleteExam={handleDeleteExam}
                  onPrintReportCard={(ex) => setReportCardToPrint(ex)}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  currentUser={currentUser}
                  settings={settings}
                  customers={customers}
                  onSaveCustomers={handleSaveCustomers}
                />
              )}

              {activeTab === 'products' && (
                <ProductsView
                  currentUser={currentUser}
                  settings={settings}
                  products={products}
                  onSaveProducts={handleSaveProducts}
                />
              )}

              {activeTab === 'companies' && (
                <CompaniesView
                  currentUser={currentUser}
                  settings={settings}
                  companies={companies}
                  onSaveCompanies={handleSaveCompanies}
                />
              )}

              {activeTab === 'books_amaano' && (
                <BooksAmaanoView
                  currentUser={currentUser}
                  settings={settings}
                  books={books}
                  amaanoRecords={amaanoRecords}
                  onSaveBooks={handleSaveBooks}
                  onSaveAmaanoRecords={handleSaveAmaanoRecords}
                />
              )}

              {activeTab === 'patients' && (
                <PatientsView
                  currentUser={currentUser}
                  settings={settings}
                  patients={patients}
                  onSavePatients={handleSavePatients}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  currentUser={currentUser}
                  students={students}
                  teachers={teachers}
                  hifzRecords={hifzRecords}
                  payments={payments}
                  attendance={attendance}
                  settings={settings}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  currentUser={currentUser}
                  settings={settings}
                  users={users}
                  students={students}
                  teachers={teachers}
                  parents={parents}
                  classes={classes}
                  hifzRecords={hifzRecords}
                  attendance={attendance}
                  teacherAttendance={teacherAttendance}
                  payments={payments}
                  exams={exams}
                  onSaveSettings={handleSaveSettings}
                  onSaveUsers={handleSaveUsers}
                  onResetData={handleResetData}
                  onClearAllData={handleClearAllData}
                  onLoadDemoData={handleLoadDemoData}
                  onOpenPermissionsModal={() => setIsOpenPermissionsModal(true)}
                />
              )}

              {activeTab === 'app_updates' && (
                <AppUpdateManagementView
                  currentUser={currentUser}
                  settings={settings}
                  versionConfig={versionConfig}
                  onRefreshVersionConfig={() => {}}
                  allDataToBackup={{
                    settings,
                    users,
                    students,
                    teachers,
                    parents,
                    classes,
                    hifzRecords,
                    attendance,
                    payments,
                    exams,
                  }}
                />
              )}

              {activeTab === 'scheduled_alerts' && (
                <ScheduledAlertsAdminView
                  currentUser={currentUser}
                  parents={parents}
                  settings={settings}
                />
              )}

              {activeTab === 'remote_learning' && (
                <RemoteLearningView
                  currentUser={currentUser}
                  settings={settings}
                  students={displayStudents}
                  teachers={displayTeachers}
                  parents={parents}
                  onUpdateStudents={(updated) => {
                    setStudents(updated);
                    Storage.saveStudents(updated);
                  }}
                  onUpdateUsers={(updated) => {
                    setUsers(updated);
                    Storage.saveUsers(updated);
                  }}
                />
              )}

              {activeTab === 'cloud_storage' && (
                <CloudStorageView
                  currentUser={currentUser}
                  classes={displayClasses}
                  students={displayStudents}
                  teachers={displayTeachers}
                />
              )}

              {activeTab === 'lesson_recording' && (
                <LessonRecordingView
                  currentUser={currentUser}
                  classes={displayClasses}
                />
              )}

              {activeTab === 'apk' && <ApkDownloadView settings={settings} />}
            </main>
          </div>

          <BottomNav
            currentUser={currentUser}
            settings={settings}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenMenu={() => setIsMobileMenuOpen(true)}
          />
        </>
      )}

      {/* Force Update Overlay (Blocks app when build version is below minimum supported) */}
      {isForceUpdateRequired && (
        <ForceUpdateOverlay versionConfig={versionConfig} />
      )}

      {/* Printable & Profile Modals */}
      <ShareModal isOpen={isOpenShareModal} onClose={() => setIsOpenShareModal(false)} />

      {currentUser && (
        <>
          <ChangeProfileModal
            currentUser={currentUser}
            isOpen={isOpenChangeProfileModal}
            onClose={() => setIsOpenChangeProfileModal(false)}
            onUpdateUser={handleUpdateUser}
          />
          <UserPermissionsModal
            isOpen={isOpenPermissionsModal}
            onClose={() => setIsOpenPermissionsModal(false)}
            currentUser={currentUser}
            users={users}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onUpdateUser={handleUpdateUser}
          />
        </>
      )}

      {receiptToPrint && (
        <PrintReceiptModal
          payment={receiptToPrint}
          settings={settings}
          onClose={() => setReceiptToPrint(null)}
        />
      )}

      {reportCardToPrint && (
        <PrintReportCardModal
          exam={reportCardToPrint}
          student={students.find((s) => s.id === reportCardToPrint.studentId)}
          settings={settings}
          onClose={() => setReportCardToPrint(null)}
        />
      )}

      <AppUpdateModal
        isOpen={isOpenAppUpdateModal}
        onClose={() => setIsOpenAppUpdateModal(false)}
        onMarkAsRead={handleMarkUpdateAsRead}
        versionConfig={versionConfig}
      />

      {isOpenSearchModal && (
        <GlobalSearchModal
          students={displayStudents}
          teachers={displayTeachers}
          parents={parents}
          classes={displayClasses}
          payments={displayPayments}
          onClose={() => setIsOpenSearchModal(false)}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setIsOpenSearchModal(false);
          }}
        />
      )}

      {currentUser && (
        <>
          <SystemLicenseModal
            isOpen={isOpenLicenseModal}
            onClose={() => setIsOpenLicenseModal(false)}
            settings={settings}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
          />
          <ApiKeyManagerModal
            isOpen={isOpenApiKeyModal}
            onClose={() => setIsOpenApiKeyModal(false)}
            settings={settings}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
            onOpenHormuudApplicationModal={() => setIsOpenHormuudApplicationModal(true)}
          />
          <HormuudApiApplicationModal
            isOpen={isOpenHormuudApplicationModal}
            onClose={() => setIsOpenHormuudApplicationModal(false)}
            settings={settings}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
          />
          <AdminVoiceBroadcastModal
            isOpen={isOpenAdminVoiceModal}
            onClose={() => setIsOpenAdminVoiceModal(false)}
            currentUser={currentUser}
          />
        </>
      )}

      {/* Strict Mobile Portrait Lock Overlay for Android (Samsung A15, A-series, S-series, Xiaomi, etc.) */}
      <PortraitLockOverlay />

      {/* Global Push Notification Live Overlay for Urgent Broadcasts */}
      <PushNotificationOverlay currentUser={currentUser} notifications={pushNotifications} />

      {/* Student Device Lockdown Overlay */}
      <StudentDeviceLockOverlay
        deviceState={studentDeviceState}
        onUnlockWithPin={() => {
          const updated = {
            ...studentDeviceState,
            isLocked: false,
            lockReason: '',
            status: 'Online' as const,
            lastUnlockTime: new Date().toLocaleString(),
          };
          setStudentDeviceState(updated);
          localStorage.setItem('tahdiib_device_ctrl_global', JSON.stringify(updated));
        }}
      />

      <LogoutConfirmationModal
        isOpen={isOpenLogoutModal}
        onClose={() => setIsOpenLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
