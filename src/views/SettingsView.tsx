import React, { useState } from 'react';
import {
  SchoolSettings,
  User,
  UserRole,
  Student,
  Teacher,
  Parent,
  ClassRoom,
  HifzRecord,
  AttendanceRecord,
  TeacherAttendance,
  PaymentTransaction,
  ExamRecord,
  Subject,
} from '../types';
import { Storage } from '../lib/storage';
import { COLLECTIONS, saveItemToFirestore, deleteItemFromFirestore, backupAllDataToFirestore, getLastBackupInfo } from '../lib/firebase';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Trash2,
  X,
  UserPlus,
  Crown,
  Edit2,
  Key,
  Search,
  Copy,
  Check,
  Download,
  FileJson,
  Upload,
  Database,
  HardDrive,
  Calendar,
  BookOpen,
  Volume2,
  Plus,
  Award,
  History,
  AlertTriangle,
  Clock,
  CloudUpload,
  CloudOff,
  DollarSign,
  Smartphone,
  Send,
  Zap,
  Wrench,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { AuditLogView } from '../components/AuditLogView';
import { logAuditAction } from '../lib/auditLogger';
import { sendSmsViaBackend, validateApiKey } from '../lib/smsService';
import { DEFAULT_EXIT_SETTINGS, playHighPriorityAlertSound } from '../lib/studentExitEngine';

interface SettingsViewProps {
  currentUser?: User | null;
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
  onSaveSettings: (settings: SchoolSettings) => void;
  onSaveUsers?: (users: User[]) => void;
  onResetData: () => void;
  onClearAllData?: () => void;
  onLoadDemoData?: () => void;
  onOpenPermissionsModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  settings,
  users = [],
  students = [],
  teachers = [],
  parents = [],
  classes = [],
  hifzRecords = [],
  attendance = [],
  teacherAttendance = [],
  payments = [],
  exams = [],
  onSaveSettings,
  onSaveUsers,
  onResetData,
  onClearAllData,
  onLoadDemoData,
  onOpenPermissionsModal,
}) => {
  const [activeTab, setActiveTab] = useState<'school' | 'users' | 'privacy' | 'data' | 'subjects' | 'audit' | 'sms' | 'exitNotifs'>('users');
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [userList, setUserList] = useState<User[]>(users);

  // Hormuud SMS Configuration & Testing State
  const [showSmsApiKey, setShowSmsApiKey] = useState(false);
  const [showSmsTokenSecret, setShowSmsTokenSecret] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState('252615000000');
  const [testSmsMessage, setTestSmsMessage] = useState(
    'Asc Waalid, kani waa fariin tijaabo ah oo ka socota nidaamka Tahdiibul Adfaal. Dhagxaanta Hormuud Bulk SMS API waa ay shaqaynayaan!'
  );
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<{
    success: boolean;
    mode: string;
    notice: string;
    details?: string;
  } | null>(null);

  // 24-Hour Firestore Backup State & Handler
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessToast, setBackupSuccessToast] = useState<string | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subMaxScore, setSubMaxScore] = useState<number>(100);
  const [subPassScore, setSubPassScore] = useState<number>(50);
  const [subCategory, setSubCategory] = useState<string>('Diini');
  const [subDescription, setSubDescription] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [userSearch, setUserSearch] = useState('');
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Modals state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+252 61 ');
  const [newRole, setNewRole] = useState<UserRole>('admin');

  React.useEffect(() => {
    setUserList(users);
  }, [users]);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Auto-Save Effect for School Settings (Automatic saving on edit)
  React.useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(settings)) {
      const timer = setTimeout(() => {
        onSaveSettings(formData);
        setIsSaved(true);
        setSavedMessage('⚡ Dejimaha iskeed ayaa loo kaydiyay (Auto-Saved)!');
        setTimeout(() => setIsSaved(false), 2500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center max-w-md mx-auto my-12 space-y-3 shadow-md">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="font-extrabold text-slate-900 text-lg">Aagga Dejimaha System-ka</h3>
        <p className="text-xs text-slate-600">
          Ogaysiis: Dejimaha system-ka iyo beddelaynta furaha (Passwords) waxaa awood u leh oo kaliya Maamulaha Machadka (Admin).
        </p>
      </div>
    );
  }

  // Subject Management State & Handlers
  const defaultSubjectsList: Subject[] = [
    { id: 'sub-1', name: "Qur'aanka (Hifz)", code: "QUR-101", maxScore: 100, passScore: 50, category: "Diini", description: "Hifdinta iyo saxidda akhrinta Qur'aanka kariimka ah" },
    { id: 'sub-2', name: "Tajwiidka", code: "TAJ-102", maxScore: 100, passScore: 50, category: "Diini", description: "Axaaktaamka iyo qawaaniinta tajwiidka Qur'aanka" },
    { id: 'sub-3', name: "Tarbiya & Akhlaaq", code: "TAR-103", maxScore: 100, passScore: 50, category: "Diini", description: "Aadaabta iyo edbinta ubadka mucallimiinta" },
    { id: 'sub-4', name: "Luuqadda Carabiga", code: "ARB-104", maxScore: 100, passScore: 50, category: "Luuqad", description: "Qawaacidda, naxwaha iyo qoraalka Carabiga" },
  ];

  const currentSubjects: Subject[] = formData.subjects && formData.subjects.length > 0
    ? formData.subjects
    : defaultSubjectsList;

  // 24-Hour Firestore Backup State & Handler
  const backupInfo = getLastBackupInfo(formData);

  const handlePerformQuickBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await backupAllDataToFirestore({
        settings: formData,
        users: userList,
        students,
        teachers,
        parents,
        classes,
        hifzRecords,
        attendance,
        teacherAttendance,
        payments,
        exams,
      });

      const updatedSettings: SchoolSettings = {
        ...formData,
        lastBackupTimestamp: res.timestamp,
      };
      setFormData(updatedSettings);
      onSaveSettings(updatedSettings);

      setBackupSuccessToast('✅ Xogta maanta waxaa si guul leh loogu kaydiyay Cloud Firestore!');
      setTimeout(() => setBackupSuccessToast(null), 5000);
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday kaydinta Firestore: ' + (err?.message || err));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubName('');
    setSubCode(`MAA-0${currentSubjects.length + 1}`);
    setSubMaxScore(100);
    setSubPassScore(50);
    setSubCategory('Diini');
    setSubDescription('');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubName(sub.name);
    setSubCode(sub.code || '');
    setSubMaxScore(sub.maxScore || 100);
    setSubPassScore(sub.passScore || 50);
    setSubCategory(sub.category || 'Diini');
    setSubDescription(sub.description || '');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      alert('Fadlan geli magaca maadada!');
      return;
    }

    let updatedList: Subject[];
    if (editingSubject) {
      updatedList = currentSubjects.map((s) =>
        s.id === editingSubject.id
          ? {
              ...s,
              name: subName.trim(),
              code: subCode.trim(),
              maxScore: Number(subMaxScore) || 100,
              passScore: Number(subPassScore) || 50,
              category: subCategory,
              description: subDescription.trim(),
            }
          : s
      );
    } else {
      const newSub: Subject = {
        id: `sub-${Date.now()}`,
        name: subName.trim(),
        code: subCode.trim() || `MAA-${Math.floor(100 + Math.random() * 900)}`,
        maxScore: Number(subMaxScore) || 100,
        passScore: Number(subPassScore) || 50,
        category: subCategory,
        description: subDescription.trim(),
      };
      updatedList = [...currentSubjects, newSub];
    }

    const updatedSettings: SchoolSettings = {
      ...formData,
      subjects: updatedList,
    };

    setFormData(updatedSettings);
    onSaveSettings(updatedSettings);
    setIsSubjectModalOpen(false);
    setIsSaved(true);
    setSavedMessage(`✅ Maadada "${subName}" si sax ah ayaa loo keydiyay!`);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDeleteSubjectClick = (subId: string, nameToDelete: string) => {
    if (confirm(`Ma ziiddaa inaad tirtirto maadada "${nameToDelete}"?`)) {
      const updatedList = currentSubjects.filter((s) => s.id !== subId);
      const updatedSettings: SchoolSettings = {
        ...formData,
        subjects: updatedList,
      };
      setFormData(updatedSettings);
      onSaveSettings(updatedSettings);
      setIsSaved(true);
      setSavedMessage(`🗑️ Maadada "${nameToDelete}" waa la tirtiray.`);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  // Export Database as JSON File
  const handleExportDatabaseJSON = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const dateReadable = new Date().toLocaleDateString('so-SO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const backupData = {
      exportMetadata: {
        appName: settings.schoolName || 'Tahdiibul Adfaal MIS',
        exportedAt: new Date().toISOString(),
        exportedAtReadable: dateReadable,
        exportedBy: currentUser?.name || 'Admin',
        version: '1.0.0',
        summary: {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalParents: parents.length,
          totalClasses: classes.length,
          totalHifzRecords: hifzRecords.length,
          totalAttendanceRecords: attendance.length,
          totalTeacherAttendanceRecords: teacherAttendance.length,
          totalPayments: payments.length,
          totalExams: exams.length,
          totalUsers: userList.length,
        },
      },
      settings: formData,
      users: userList,
      students,
      teachers,
      parents,
      classes,
      hifzRecords,
      attendance,
      teacherAttendance,
      payments,
      exams,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tahdiib_Database_Backup_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSaved(true);
    setSavedMessage('📦 Database-ka oo idil waa la soo dagsaday! (JSON Export Success)');
    setTimeout(() => setIsSaved(false), 3500);
  };

  // Import / Restore Database from JSON file
  const handleImportDatabaseJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (!parsed.students && !parsed.settings && !parsed.users)) {
          alert('Faylka aad soo dooratay ma ahan backup sax ah oo laga soo saaray Tahdiibul Adfaal MIS.');
          return;
        }

        const confirmMsg = `Ma ziiddaa inaad dib u soo celiso kaydkan JSON (${parsed.exportMetadata?.appName || 'Database Backup'})?\n\nXogta ku jirta faylka:\n- Ardayda: ${parsed.students?.length || 0}\n- Macallimiinta: ${parsed.teachers?.length || 0}\n- Lacagaha: ${parsed.payments?.length || 0}\n\nTani waxay beddeli doontaa xogta ku jirta database-ka.`;

        if (confirm(confirmMsg)) {
          if (parsed.settings) {
            onSaveSettings(parsed.settings);
            Storage.saveSettings(parsed.settings);
          }
          if (parsed.users && onSaveUsers) {
            onSaveUsers(parsed.users);
            Storage.saveUsers(parsed.users);
          }
          if (parsed.students) Storage.saveStudents(parsed.students);
          if (parsed.teachers) Storage.saveTeachers(parsed.teachers);
          if (parsed.parents) Storage.saveParents(parsed.parents);
          if (parsed.classes) Storage.saveClasses(parsed.classes);
          if (parsed.hifzRecords) Storage.saveHifzRecords(parsed.hifzRecords);
          if (parsed.attendance) Storage.saveAttendanceRecords(parsed.attendance);
          if (parsed.teacherAttendance) Storage.saveTeacherAttendanceRecords(parsed.teacherAttendance);
          if (parsed.payments) Storage.savePayments(parsed.payments);
          if (parsed.exams) Storage.saveExams(parsed.exams);

          setIsSaved(true);
          setSavedMessage('✅ Backup-kii waa la soo celiyay! (Database Restored Successfully)');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (err) {
        alert('Cillad ayaa dhacday marka la akhrinayay faylka JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleCopyCredentials = (usr: User) => {
    const text = `📌 Tahdiibul Adfaal MIS - Aqoonsiga Gelitaanka (Login Credentials)\n━━━━━━━━━━━━━━━━━━━━━\n👤 Magaca: ${usr.name}\n🔰 Nooca (Role): ${usr.role.toUpperCase()}\n🔑 Username: ${usr.username}\n🔒 Password: ${usr.password || '123456'}\n━━━━━━━━━━━━━━━━━━━━━\nFadlan ku gal: https://ais-pre-4vr5apkz45bxqrvmk5wu4j-498313560058.europe-west1.run.app`;
    navigator.clipboard.writeText(text);
    setCopiedUserId(usr.id);
    setTimeout(() => setCopiedUserId(null), 3000);
  };

  const generateAutoUsernameForRole = (role: UserRole, name: string) => {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefixMap: Record<UserRole, string> = {
      admin: 'admin',
      teacher: 'tch',
      parent: 'walid',
      student: 'std',
      finance: 'fn',
    };
    const prefix = prefixMap[role] || 'usr';
    const randomDigits = Math.floor(100 + Math.random() * 900);
    return cleanName ? `${prefix}_${cleanName.slice(0, 8)}` : `${prefix}_${randomDigits}`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedMessage('Dejimaha Dugsiga waa lagu keydiyay nidaamka!');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const openAddAdminModal = (presetRole: UserRole = 'admin') => {
    setNewRole(presetRole);
    setNewName('');
    setNewUsername('');
    setNewPassword('123456');
    setNewPhone('+252 61 ');
    setNewEmail('');
    setIsAddUserOpen(true);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: newName || (newRole === 'admin' ? 'Admin Cusub' : newUsername),
      username: newUsername.trim(),
      password: newPassword.trim(),
      email: newEmail || `${newUsername.trim()}@tahdiib.edu`,
      phone: newPhone,
      role: newRole,
      status: 'Active',
    };

    // Save directly to Firestore for instant zero-delay persistence
    saveItemToFirestore(COLLECTIONS.USERS, newUser);

    const updated = [...userList, newUser];
    setUserList(updated);
    if (onSaveUsers) onSaveUsers(updated);

    // Reset form & modal
    setNewName('');
    setNewUsername('');
    setNewPassword('123456');
    setNewEmail('');
    setNewPhone('+252 61 ');
    setIsAddUserOpen(false);

    setSavedMessage(`⚡ Isticmaalaha / Admin-ka cusub (${newUser.username}) toos ayaa loogu kaydiyay database-ka!`);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const formattedUser: User = {
      ...editingUser,
      name: editingUser.name.trim(),
      username: editingUser.username.trim(),
      password: editingUser.password.trim(),
      phone: editingUser.phone ? editingUser.phone.trim() : '',
    };

    // Save directly to Firestore item doc for instant zero-delay persistence
    saveItemToFirestore(COLLECTIONS.USERS, formattedUser);

    const updated = userList.map((u) => (u.id === formattedUser.id ? formattedUser : u));
    setUserList(updated);
    if (onSaveUsers) onSaveUsers(updated);

    // Also sync matching Teacher or Parent record phone & name if applicable
    if (formattedUser.role === 'teacher' && teachers) {
      const matchTch = teachers.find(
        (t) => t.id === formattedUser.id || t.fullName.toLowerCase() === formattedUser.name.toLowerCase()
      );
      if (matchTch) {
        const updatedTch: Teacher = { ...matchTch, fullName: formattedUser.name, phone: formattedUser.phone };
        saveItemToFirestore(COLLECTIONS.TEACHERS, updatedTch);
      }
    } else if (formattedUser.role === 'parent' && parents) {
      const matchPrn = parents.find(
        (p) => p.id === formattedUser.id || p.fullName.toLowerCase() === formattedUser.name.toLowerCase()
      );
      if (matchPrn) {
        const updatedPrn: Parent = { ...matchPrn, fullName: formattedUser.name, phone: formattedUser.phone };
        saveItemToFirestore(COLLECTIONS.PARENTS, updatedPrn);
      }
    }

    setEditingUser(null);
    setSavedMessage(`⚡ Username-ka iyo Nambarka (${formattedUser.name}) toos ayaa loo keediyay!`);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const toggleUserStatus = (id: string) => {
    const updated = userList.map((u) => {
      if (u.id === id) {
        const nextStatus = (u.status === 'Blocked' ? 'Active' : 'Blocked') as 'Active' | 'Blocked';
        const updatedUser = { ...u, status: nextStatus };
        saveItemToFirestore(COLLECTIONS.USERS, updatedUser);
        return updatedUser;
      }
      return u;
    });
    setUserList(updated);
    if (onSaveUsers) onSaveUsers(updated);
  };

  const toggleUserPaymentsAccess = (id: string) => {
    const updated = userList.map((u) => {
      if (u.id === id) {
        const nextVal = !u.hidePaymentsAccess;
        const updatedUser = { ...u, hidePaymentsAccess: nextVal };
        saveItemToFirestore(COLLECTIONS.USERS, updatedUser);

        logAuditAction(
          currentUser,
          nextVal ? 'Lacagaha Waa La Ka Xiray Isticmaalaha' : 'Lacagaha Waa U La Furay Isticmaalaha',
          'settings',
          `Waxaa la ${nextVal ? 'xiray' : 'furay'} ogolaanshaha lacagaha ee isticmaalaha ${u.name} (${u.username}).`
        );
        return updatedUser;
      }
      return u;
    });
    setUserList(updated);
    if (onSaveUsers) onSaveUsers(updated);
  };

  const handleDeleteUser = (id: string) => {
    if (userList.length <= 1) {
      alert('Ma tirtiri kartid isticmaalaha kaliya ee ku jira nidaamka!');
      return;
    }
    if (confirm('Ma ziiddaa inaad tirtirto isticmaalahan?')) {
      deleteItemFromFirestore(COLLECTIONS.USERS, id);
      const updated = userList.filter((u) => u.id !== id);
      setUserList(updated);
      if (onSaveUsers) onSaveUsers(updated);
    }
  };

  const filteredUsers = userList.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Strict Role Check - Only Admin / Super Admin can access Settings
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border-2 border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900">🔒 Access Denied / Fasax Ma Hayside</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kaliya Maamulayaasha (Admin / Super Admin) ayaa awood u leh inay galaan ama maamulaan qaybtan Dejimaha (Settings).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 🛠️ ADMIN ONLY — DHISMAHA APP-KA (GOOGLE AI STUDIO) */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border-2 border-emerald-500/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner shrink-0">
              <Wrench className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>🛠️ Dhis / Wax ka beddel App-ka</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                <strong className="text-emerald-300">Google AI Studio:</strong> "Ka sii wad dhismaha iyo horumarinta App-ka Machadka Tahdiibul Adfaal."
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const aiStudioUrl = 'https://ai.studio/build/fb74b587-2ce0-4fa3-a155-51a241e9f545';
              try {
                const win = window.open(aiStudioUrl, '_blank', 'noopener,noreferrer');
                if (!win || win.closed || typeof win.closed === 'undefined') {
                  window.location.href = aiStudioUrl;
                }
              } catch (e) {
                window.location.href = aiStudioUrl;
              }
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>[ FUR AI STUDIO ]</span>
            <ExternalLink className="w-4 h-4 text-slate-950 ml-1" />
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0e7a48]" />
            <span>Dejimaha & Meesha Admin-ka Laga Daro</span>
          </h2>
          <p className="text-xs text-slate-500">
            Samee Admin cusub, u samee username iyo password maamulayaasha, macallimiinta, waalidiinta iyo ardayda.
          </p>
        </div>

        {/* Tab selector */}
        <div className="mobile-tab-scroll bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>👑 Admin & Passwords ({userList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('school')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'school'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏫 Dejimaha Dugsiga
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>🔒 Qarinta & Ogolaanshaha</span>
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>📚 Maadooyinka Dugsiga ({currentSubjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('exitNotifs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'exitNotifs'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>🚨 Ogeysiisyada Bixitaanka (3-da Waqti)</span>
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'sms'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>📱 Hormuud SMS API</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : backupInfo.isOverdue
                ? 'bg-amber-100 text-amber-900 border border-amber-400 font-extrabold animate-pulse'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span>💾 Kaydka {backupInfo.isOverdue ? '⚠️ (24h+ Overdue)' : '✅'}</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-300" />
            <span>📋 Audit Log (Taariikhda Falallada)</span>
          </button>
        </div>
      </div>

      {/* 24-HOUR FIRESTORE BACKUP OVERDUE WARNING NOTIFICATION */}
      {backupInfo.isOverdue && (
        <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-4 shadow-sm text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-800 rounded-xl border border-amber-400/60 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <span>⚠️ DIGNIIN KAYDIN: DIB U HESHESIIN/KAYD FIRESTORE MA DHICIN 24-KII SAAC EE U DAMBEEYAY</span>
                </h4>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  Backup Overdue (&gt; 24h)
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                Database-ka Cloud-ka ee Firestore lama heshiisiin ama dib looma kaydin 24-kii saac ee la soo dhaafay.{' '}
                <span className="font-bold text-slate-950">
                  Kaydkii ugu dambeeyay: {backupInfo.formattedLastBackup}
                  {backupInfo.hoursAgo !== null ? ` (${backupInfo.hoursAgo} saacadood ka hor)` : ''}
                </span>
                . Taabo badhanka midigta ku yaalla si aad xogta ugu kaydiso Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              disabled={isBackingUp}
              onClick={handlePerformQuickBackup}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span>{isBackingUp ? 'Kaydintu way socotaa...' : '⚡ KAYDI HADDA (BACKUP TO FIRESTORE)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Backup Success Toast */}
      {backupSuccessToast && (
        <div className="p-4 bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>{backupSuccessToast}</span>
          </div>
          <button onClick={() => setBackupSuccessToast(null)} className="text-emerald-200 hover:text-white font-bold text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {isSaved && (
        <div className="p-3 bg-[#0e7a48] text-amber-300 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* TAB 1: USER & ADMIN MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 p-5">
          {/* Top Banner with Quick Add Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950 p-4 rounded-xl text-white border border-amber-400/40">
            <div className="space-y-0.5">
              <h3 className="font-bold text-[#d4af37] text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Meesha Admin-ka & Username-ada Laga Daro</span>
              </h3>
              <p className="text-xs text-emerald-100">
                Geli Magaca Admin-ka, Username-ka iyo Password-ka uu ku geli doono nidaamka.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openAddAdminModal('admin')}
                className="px-4 py-2 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ KU DAR ADMIN CUSUB</span>
              </button>
              <button
                onClick={() => openAddAdminModal('teacher')}
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-600 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>+ Macallin/Waalid</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-700 shrink-0">Sifee Roles:</span>
              {[
                { id: 'all', label: 'Dhammaan' },
                { id: 'admin', label: '👑 Admin-ka' },
                { id: 'teacher', label: 'Macallimiin' },
                { id: 'parent', label: 'Waalidiin' },
                { id: 'student', label: 'Ardayda' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    roleFilter === rf.id
                      ? 'bg-[#0e7a48] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi username ama magac..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((usr, idx) => {
              const isVisible = visiblePasswords[usr.id];
              const isAdmin = usr.role === 'admin';
              return (
                <div
                  key={usr.id ? `${usr.id}-${idx}` : `usr-${usr.username || idx}`}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                    isAdmin
                      ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shadow-xs ${
                            isAdmin
                              ? 'bg-[#d4af37] text-slate-950 border border-amber-300'
                              : 'bg-[#0e7a48] text-white'
                          }`}
                        >
                          {isAdmin ? '👑' : usr.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs leading-tight">
                            {usr.name}
                          </div>
                          <span
                            className={`text-[10px] uppercase font-black px-1.5 py-0.2 rounded ${
                              isAdmin
                                ? 'bg-amber-200 text-amber-950 border border-amber-400'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            Role: {usr.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {usr.role !== 'admin' && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              usr.hidePaymentsAccess
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                            title={usr.hidePaymentsAccess ? 'Lacagaha waa ka xiran yihiin' : 'Lacagaha waa u furan yihiin'}
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>{usr.hidePaymentsAccess ? 'Xiran' : 'Furan'}</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            usr.status === 'Blocked'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-green-100 text-[#0e7a48]'
                          }`}
                        >
                          {usr.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Credentials Info Box */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Username:</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {usr.username}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Nambar Sireed (Password):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#0e7a48] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                            {isVisible ? usr.password || '123456' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(usr.id)}
                            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title="Tus / Qari Password-ka"
                          >
                            {isVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 text-slate-500">
                        <span>Tel: {usr.phone || 'N/A'}</span>
                        <span className="truncate max-w-[120px]">{usr.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-200 text-xs">
                    <button
                      onClick={() => handleCopyCredentials(usr)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        copiedUserId === usr.id
                          ? 'bg-green-600 text-white shadow-xs'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                      }`}
                      title="Nuqul ka bixiyo Username iyo Password-ka si aad ugu dhiibto/dirto WhatsApp"
                    >
                      {copiedUserId === usr.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Waa la copy-yeey!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-800" />
                          <span>📋 Nuqul (Copy)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      {usr.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserPaymentsAccess(usr.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            usr.hidePaymentsAccess
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={usr.hidePaymentsAccess ? 'Fura Ogolaanshaha Lacagaha' : 'Xir Ogolaanshaha Lacagaha (Qof-Qof)'}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{usr.hidePaymentsAccess ? 'Fura Lacagaha' : 'Xir Lacagaha'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setEditingUser(usr)}
                        className="px-2.5 py-1 bg-[#0e7a48]/10 text-[#0e7a48] hover:bg-[#0e7a48] hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Wax ka beddel Username ama Password-ka"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Beddel</span>
                      </button>

                      <button
                        onClick={() => toggleUserStatus(usr.id)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          usr.status === 'Blocked'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-amber-600 hover:bg-amber-50'
                        }`}
                        title={usr.status === 'Blocked' ? 'Fura Account-ka' : 'Xir Account-ka (Block)'}
                      >
                        {usr.status === 'Blocked' ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(usr.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Tirtir Isticmaalaha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL SETTINGS */}
      {activeTab === 'school' && (
        <form onSubmit={handleSchoolSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-green-50/60 rounded-xl border border-green-200">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37] bg-white shadow-md shrink-0 flex items-center justify-center">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-black text-[#0e7a48]">TA</span>
              )}
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h3 className="font-bold text-[#0e7a48] text-sm">Astaanta & Logo-ga Machadka</h3>
              <p className="text-xs text-slate-600">
                Muuqaalka astaanta dugsiga ee rasiidhada, kaararka aqoonsiga iyo warbixinada imtixaanka.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Magaca Machadka / Dugsiga *</label>
              <input
                type="text"
                required
                value={formData.schoolName || ''}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ciwaanka Yar (Subtitle)</label>
              <input
                type="text"
                value={formData.schoolSubtitle || ''}
                onChange={(e) => setFormData({ ...formData, schoolSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Magaca Maamulaha *</label>
              <input
                type="text"
                required
                value={formData.principalName || ''}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sannad Dugsyeedka (Academic Year)</label>
              <input
                type="text"
                value={formData.academicYear || ''}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefoonada Dugsiga *</label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mailka Dugsiga</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Degaanka / Anwaanka (Address)</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-slate-200">
              <h4 className="font-extrabold text-[#0e7a48] text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Dejimaha Dalacista Billelaha ah ee Waalidiinta (Monthly Auto-Billing - 29-ka Bisha)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mb-2">
                Nidaamku wuxuu si toos ah u dalacaa lacagta dugsiga bisha 29-keeda ($15/arday ama custom fee) dhamaan ardayda firfircoon (Active).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Maalinta Dalacista (Default: 29)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={formData.autoBillingDay ?? 29}
                onChange={(e) => setFormData({ ...formData, autoBillingDay: parseInt(e.target.value) || 29 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Xaalada Dalacista Tooska Ah (Auto-Billing Status)</label>
              <select
                value={formData.autoBillingEnabled !== false ? 'enabled' : 'disabled'}
                onChange={(e) => setFormData({ ...formData, autoBillingEnabled: e.target.value === 'enabled' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#0e7a48]"
              >
                <option value="enabled">✅ Toos u Shid (Auto-Charge on 29th)</option>
                <option value="disabled">🛑 Damiyay (Manual Billing Only)</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-[#0e7a48] text-xs uppercase tracking-wider mb-2">Qoraalka Soo Dhoweynta Boga Hore (Welcome Hero Banner)</h4>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Qoraalka Soo Dhoweynta (Title)</label>
              <input
                type="text"
                value={formData.welcomeGreeting || ''}
                placeholder="Ku Soo Dhowaw Tahdiibul Adfaal"
                onChange={(e) => setFormData({ ...formData, welcomeGreeting: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Qoraalka Hoose (Subtitle / Description)</label>
              <input
                type="text"
                value={formData.welcomeSubtext || ''}
                placeholder="System-ka oo idil waxaad ka maamuli kartaa Ardayda..."
                onChange={(e) => setFormData({ ...formData, welcomeSubtext: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('Ma ziiddaa inaad dib u soo celiso dhammaan xogta bilowga ah?')) {
                  onResetData();
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
              <span>Dib u soo celi Data-dii Hore (Reset)</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#d4af37]" />
              <span>Keydi Dejimaha Dugsiga</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB: DATA PRIVACY & ROLE PERMISSIONS */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-emerald-950 p-5 rounded-2xl text-white border border-amber-400/50 shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
                <h3 className="font-extrabold text-base text-[#d4af37]">
                  🔒 Qarinta & Ogolaanshaha Xogta (Admin Data Privacy & Role Permissions)
                </h3>
              </div>

              {onOpenPermissionsModal && (
                <button
                  type="button"
                  onClick={onOpenPermissionsModal}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-[#d4af37] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-amber-300"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>⚡ MAAMUL & FUR AWOODAHA (OPEN PERMISSIONS MODAL)</span>
                </button>
              )}
            </div>
            <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
              Kantarool buuxa oo Admin-ka kaliya u gaar ah: Qari xogaha xasaasiga ah sida Mushaharka Macallimiinta, Wadarta Lacagaha, Nambarrada Waalidiinta, ama ka qari qaybo ka mid ah Nav-ka (Tabs-ka) dadka kale oo dhan ama door gaar ah (Macallin, Waalid, Arday, Maaliyad).
            </p>
          </div>

          {/* Section 1: Sensitive Data Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <EyeOff className="w-4 h-4 text-[#0e7a48]" />
              <span>Qarinta Xogaha Xasaasiga ah (Sensitive Data Privacy Toggles)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle 1: Teacher Salary */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hideTeacherSalary}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hideTeacherSalary: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    💰 Qari Mushaharka Macallimiinta
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Marka aad shido, dadka aan Admin-ka ahayn (sida Macallimiinta ama Waalidiinta) ma arki karaan lacagta mushaharka macallimiinta.
                  </p>
                </div>
              </label>

              {/* Toggle 2: Financial Totals */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hideFinancialTotals}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hideFinancialTotals: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    📊 Qari Wadarta Lacagaha & Dakhliga Guud (Hide Financial Totals)
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Marka aad shido, wadarta lacagaha dugsiga ka soo gala ama kaarka Dashboard-ka dakhliga waxaa loo qarin doonaa dadka aan Admin-ka ahayn.
                  </p>
                </div>
              </label>

              {/* Toggle 2.5: Hide Financials For Sub-Admins & Staff (ADMIN PRIVACY CONTROL) */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-amber-300 bg-amber-50/60 hover:bg-amber-100/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hideFinancialsForSubAdmins}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hideFinancialsForSubAdmins: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-amber-400 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-950 block">
                      🔒 Ka Qari Lacagta & Dakhliga Adminada Kale / Shaqaalaha
                    </span>
                    <span className="px-2 py-0.2 bg-amber-200 text-amber-950 border border-amber-400 font-black text-[10px] rounded uppercase">
                      Super Admin Control
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug font-medium">
                    Marka aad shido habkan, Super Admin-ka kaliya ayaa arki kara qaddarka lacagta ($). Admin-ada kale, macallimiinta, iyo shaqaalaha waxa loo qarin doonaa lacagaha ($••••••).
                  </p>
                </div>
              </label>

              {/* Toggle 2.6: Hide Admin Dashboard From Non-Admins */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hideAdminDashboardFromUsers}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hideAdminDashboardFromUsers: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-emerald-400 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-950 block">
                      🛡️ Qari Admin Dashboard-ka Ka dib Isticmaalayaasha
                    </span>
                    <span className="px-2 py-0.2 bg-emerald-200 text-emerald-950 border border-emerald-400 font-black text-[10px] rounded uppercase">
                      Admin Protection
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug font-medium">
                    Marka aad shido habkan, Dashboard-ka Adminka (charts, backup controls, dakhliga) waxa laga qarin doonaa dhammaan isticmaalayaasha kale (Macallin, Waalid, Arday, Maaliyad).
                  </p>
                </div>
              </label>

              {/* Toggle 2.7: Hide Payments Tab Globally From All Non-Admins */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-rose-300 bg-rose-50/60 hover:bg-rose-100/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hidePaymentsGlobal}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hidePaymentsGlobal: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-rose-400 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-950 block">
                      🚫 Xir/Qari Bogga Lacagaha (Dhammaan Isticmaalayaasha Aan Admin Ahayn)
                    </span>
                    <span className="px-2 py-0.2 bg-rose-200 text-rose-950 border border-rose-400 font-black text-[10px] rounded uppercase">
                      Global Restrict (Dhammaan)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug font-medium">
                    Marka aad shido habkan, dhammaan isticmaalayaasha aan Admin ahayn (Maaliyad, Macallimiin, Waalidiin, Arday) waa ka xirnaan doonaa bogga Lacagaha (Payments) gebi ahaanba.
                  </p>
                </div>
              </label>

              {/* Toggle 3: Parent Phone Numbers */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hideParentPhoneNumbers}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hideParentPhoneNumbers: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    📞 Qari Nambarrada Waalidiinta
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Nambarrada taleefannada waalidiinta ayaa la qarin doonaa (`+252 61 *** **34`) si loo dhowro asturnaanta qoysaska.
                  </p>
                </div>
              </label>

              {/* Toggle 4: Exam Scores */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.hideExamsFromParents}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        hideExamsFromParents: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    📝 Qari Natiijooyinka Imtixaanka (Waalidiinta & Ardayda)
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Xir kaarka natiijooyinka imtixaanka ilaa Admin-ku si rasmi ah u shaaciyo ama ogolaado.
                  </p>
                </div>
              </label>

              {/* Toggle 5: Restrict Hifz Editing to Admin */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.privacyPermissions?.restrictTeacherEditHifz}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        restrictTeacherEditHifz: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    📖 Kaliya Admin-ka ayaa Baddali kara Hifdiga
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Macallimiintu way akhrisan karaan diiwaanka hifdiga ardayda, laakiin ma baddali karaan kumana dari karaan cashar cusub.
                  </p>
                </div>
              </label>

              {/* Toggle 6: Restrict or Allow Teacher Attendance Marking */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyPermissions?.allowTeacherTakeAttendance !== false && !formData.privacyPermissions?.restrictTeacherEditAttendance}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        allowTeacherTakeAttendance: isChecked,
                        restrictTeacherEditAttendance: !isChecked,
                        restrictClassAndTeacherEditingToAdmin: !isChecked,
                        restrictTeacherAttendanceToAdmin: !isChecked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-emerald-400 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-extrabold text-xs text-slate-900 block">
                    ✅ U Ogolaaw Macallimiinta Inay Xaadiriyaan Ardayda (Allow Teachers Attendance Marking)
                  </span>
                  <p className="text-[11px] text-slate-700 leading-snug font-medium">
                    Marka aad calaamadeyso (Checked), macallimiinta waa loo ogolyahay in ay xaadiriyaan oo keydiyaan xaadiriska ardayda fasalkooda. Marka aad ka saarto calaamada (Unchecked), xaadirinta waa la xirayaa oo Admin-ka kaliya ayaa xaadirin kara.
                  </p>
                </div>
              </label>

              {/* Toggle 7: Restrict Teacher to Assigned Classes & Students Only */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyPermissions?.restrictTeacherToAssignedClassOnly !== false}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        restrictTeacherToAssignedClassOnly: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    📖 Kaliya Fasalada Uu Dhigo Yuu Arkaa Macallinku
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Macallinku wuxuu arki karaa oo kaliya fasalka iyo ardayda loo xilsaaray, lagama oggola inuu arko fasallada ama ardayda macallimiinta kale.
                  </p>
                </div>
              </label>

              {/* Toggle 8: Restrict Parent to Own Children Only */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyPermissions?.restrictParentToOwnChildrenOnly !== false}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        restrictParentToOwnChildrenOnly: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    👪 Kaliya Ubadkiisa Yuu Arkaa Waalidku
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Waalidku wuxuu arki karaa oo kaliya xogta, natiijooyinka iyo xaadiriska ubadkiisa.
                  </p>
                </div>
              </label>

              {/* Toggle 9: Restrict Class & Teacher Assignment Editing to Admin Only */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyPermissions?.restrictClassAndTeacherEditingToAdmin !== false}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        restrictClassAndTeacherEditingToAdmin: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    🔒 Kaliya Admin-ka ayaa Baddali kara Fasallada & Macallimiinta
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ka xer isticmaalayaasha kale (macallimiinta, waalidiinta) in ay sameeyaan kala baddalka macallimiinta iyo fasallada, oo u daay Maamulaha (Admin).
                  </p>
                </div>
              </label>

              {/* Toggle 10: Restrict Teacher Attendance to Admin Only */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacyPermissions?.restrictTeacherAttendanceToAdmin !== false}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      privacyPermissions: {
                        ...formData.privacyPermissions,
                        restrictTeacherAttendanceToAdmin: e.target.checked,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-slate-300 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900 block">
                    🔒 Kaliya Admin-ka ayaa Xaadirin kara Macallimiinta
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Xaqsooridda iyo xaadirinta joogista iyo maqnaanshaha macallimiinta waxaa leh oo kaliya Maamulaha (Admin).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Role Tab Access Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0e7a48]" />
                <span>Qarinta Qaybaha Nav-ka Dugsiga (Navigation Tabs Permission Matrix)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Astaameey (Check/Uncheck) qaybaha aad rabto in loo muujiyo ama laga qariyo door kasta (Teacher, Parent, Student, Finance).
              </p>
            </div>

            {/* Matrix per role */}
            {[
              { roleKey: 'teacher', roleLabel: '👨‍🏫 Macallimiinta (Teachers)', color: 'bg-emerald-50 text-[#0e7a48]' },
              { roleKey: 'parent', roleLabel: '👪 Waalidiinta (Parents)', color: 'bg-amber-50 text-amber-800' },
              { roleKey: 'student', roleLabel: '🎓 Ardayda (Students)', color: 'bg-blue-50 text-blue-800' },
              { roleKey: 'finance', roleLabel: '💵 Maaliyadda (Finance)', color: 'bg-indigo-50 text-indigo-800' },
            ].map(({ roleKey, roleLabel, color }) => {
              const allTabs = [
                { id: 'students', label: 'Ardayda' },
                { id: 'teachers', label: 'Macallimiinta' },
                { id: 'parents', label: 'Waalidiinta' },
                { id: 'classes', label: 'Fasallada' },
                { id: 'hifz', label: "Xifdinta Qur'aanka" },
                { id: 'attendance', label: 'Xaadiriska' },
                { id: 'messaging', label: 'SMS & WhatsApp' },
                { id: 'payments', label: 'Lacagaha' },
                { id: 'exams', label: 'Imtixaannada' },
                { id: 'reports', label: 'Warbixinno' },
              ];

              const currentHidden = formData.privacyPermissions?.hiddenTabsByRole?.[roleKey as keyof typeof formData.privacyPermissions.hiddenTabsByRole] || [];

              const toggleRoleTab = (tabId: string) => {
                const isCurrentlyHidden = currentHidden.includes(tabId);
                const updatedHidden = isCurrentlyHidden
                  ? currentHidden.filter((t) => t !== tabId)
                  : [...currentHidden, tabId];

                setFormData({
                  ...formData,
                  privacyPermissions: {
                    ...formData.privacyPermissions,
                    hiddenTabsByRole: {
                      ...formData.privacyPermissions?.hiddenTabsByRole,
                      [roleKey]: updatedHidden,
                    },
                  },
                });
              };

              return (
                <div key={roleKey} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${color}`}>
                      {roleLabel}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {allTabs.length - currentHidden.length} / {allTabs.length} Qaybood Waa Furan Yihiin
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {allTabs.map((t) => {
                      const isHidden = currentHidden.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleRoleTab(t.id)}
                          className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isHidden
                              ? 'bg-rose-50 border-rose-200 text-rose-700 line-through opacity-70'
                              : 'bg-white border-emerald-300 text-[#0e7a48] shadow-2xs'
                          }`}
                        >
                          <span className="truncate">{t.label}</span>
                          {isHidden ? (
                            <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[#0e7a48] shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DATA BACKUP, EXPORT & MANAGEMENT */}
      {activeTab === 'data' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          {/* Firestore Cloud Backup Status Card */}
          <div
            className={`p-5 rounded-2xl border ${
              backupInfo.isOverdue
                ? 'bg-amber-50 border-amber-300'
                : 'bg-emerald-50 border-emerald-300'
            } space-y-3 transition-all`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    backupInfo.isOverdue
                      ? 'bg-amber-200/80 text-amber-900 border border-amber-400'
                      : 'bg-emerald-200/80 text-emerald-900 border border-emerald-400'
                  }`}
                >
                  {backupInfo.isOverdue ? (
                    <CloudOff className="w-6 h-6 text-amber-700" />
                  ) : (
                    <CloudUpload className="w-6 h-6 text-emerald-700" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {backupInfo.isOverdue
                        ? '⚠️ DIGNIIN: KAYDINTA CLOUD FIRESTORE WAA LAGA REEBAY 24H'
                        : '✅ CLOUD FIRESTORE BACKUP STATUS: WAA SUQAN YAHAY'}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 font-extrabold text-[10px] rounded-full border ${
                        backupInfo.isOverdue
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {backupInfo.isOverdue ? 'Overdue (>24h)' : 'Up to Date'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-snug">
                    Kaydkii ugu dambeeyay ee Cloud-ka Firestore:{' '}
                    <strong className="text-slate-950 font-black">{backupInfo.formattedLastBackup}</strong>
                    {backupInfo.hoursAgo !== null ? ` (${backupInfo.hoursAgo} saacadood ka hor)` : ''}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isBackingUp}
                onClick={handlePerformQuickBackup}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95 disabled:opacity-50 ${
                  backupInfo.isOverdue
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
                <span>{isBackingUp ? 'Kaydinta waa lagu jiraa...' : '⚡ KAYDI HADDA (BACKUP TO FIRESTORE)'}</span>
              </button>
            </div>
          </div>

          {/* Main Hero Card: Database Backup JSON Export */}
          <div className="p-6 bg-gradient-to-br from-emerald-950 via-[#0e7a48] to-slate-900 rounded-2xl text-white shadow-lg border border-amber-400/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                    <FileJson className="w-7 h-7 text-slate-950" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-300/30">
                      Maamulka Admin-ka ● System Backup
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Kala Soo Bax Kaydka Database-ka (Export JSON Backup)
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shrink-0">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-200">System Ready & Synchronized</span>
                </div>
              </div>

              <p className="text-xs text-emerald-100 leading-relaxed max-w-3xl">
                Awooddan waxay Admin-ka u oggolaanaysaa inuu kombiyuutarka ama mobaylka ku soo dagsado dhammaan xogta uu leeyahay machadku (Ardayda, Macallimiinta, Waalidiinta, Xaadiriska, Hifz-ka, Bixinta Lacagaha, Imtixaanaadka, iyo Dejimaha) qaab fayl JSON ah.
              </p>

              {/* Live Record Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2">
                <div className="bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50 text-center">
                  <div className="text-lg font-black text-amber-300">{students.length}</div>
                  <div className="text-[10px] text-emerald-200 font-bold">Arday</div>
                </div>
                <div className="bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50 text-center">
                  <div className="text-lg font-black text-amber-300">{teachers.length}</div>
                  <div className="text-[10px] text-emerald-200 font-bold">Macallin</div>
                </div>
                <div className="bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50 text-center">
                  <div className="text-lg font-black text-amber-300">{parents.length}</div>
                  <div className="text-[10px] text-emerald-200 font-bold">Waalid</div>
                </div>
                <div className="bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50 text-center">
                  <div className="text-lg font-black text-amber-300">{payments.length}</div>
                  <div className="text-[10px] text-emerald-200 font-bold">Resiidho</div>
                </div>
                <div className="bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50 text-center col-span-2 sm:col-span-1">
                  <div className="text-lg font-black text-amber-300">{attendance.length}</div>
                  <div className="text-[10px] text-emerald-200 font-bold">Xaadiris</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportDatabaseJSON}
                  className="px-6 py-3 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>📥 SOO DAGSO KAYDKA DATABASE-KA (EXPORT JSON)</span>
                </button>

                <label className="px-5 py-3 bg-slate-900 hover:bg-black text-amber-300 font-bold text-xs rounded-xl shadow-md border border-amber-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>📤 SOO CELI KAYD JSON AH (RESTORE / IMPORT)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabaseJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-600" />
              <span>Maamulka Xogta Tusaalaha Ah (Demo Data Management)</span>
            </h3>
            <p className="text-xs text-slate-600">
              U isticmaal ikhtiyaaraadkaan hoose inaad ku safayso ama ku soo celiso xogta tusaalaha ah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Delete all sample data */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  🗑️
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Tirtir Dhammaan Xogta Tusaalaha (Clear All Demo Data)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Badhankan wuxuu tirtirayaa dhammaan Ardayda, Macallimiinta, Waalidiinta, Fasallada, Lacagaha iyo Imtixaanaadka. Nidaamku wuxuu noqon doonaa mid 100% nadiif ah oo diyaar u ah xogtaada rasmiga ah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onClearAllData) onClearAllData();
                }}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑️ TIRTIR DHAMMAAN XOGTA (CLEAR ALL DATA)</span>
              </button>
            </div>

            {/* Card 2: Load sample data */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0e7a48] flex items-center justify-center font-bold">
                  📥
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Soo Celi Xog Tusaale Ah (Load Demo Data)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Haddii aad u baahato inaad dib u soo geliso xog tusaale ah oo aad ku tijaabiso ama ku eegto shaqada nidaamka, taabo badhankan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onLoadDemoData) onLoadDemoData();
                }}
                className="w-full py-3 px-4 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#d4af37]" />
                <span>📥 SOO GELI XOG TUSAALE AH (LOAD DEMO DATA)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUBJECTS MANAGEMENT (MAADOOYINKA DUGSIGA) */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950 p-4 rounded-xl text-white border border-amber-400/40">
            <div>
              <h3 className="font-bold text-[#d4af37] text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Maamulka Maadooyinka Dugsiga (Subjects & Curriculum)</span>
              </h3>
              <p className="text-xs text-emerald-100 mt-1">
                Admin-ka wuxuu halkan ku dari karaa maadooyin cusub, ku beddeli karaa kuwa jiro ama ku keydin karaa si sax ah.
              </p>
            </div>

            <button
              onClick={handleOpenAddSubject}
              className="px-4 py-2.5 bg-[#0e7a48] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Ku Dar Maado Cusub</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {currentSubjects.map((sub, idx) => (
              <div
                key={sub.id ? `${sub.id}-${idx}` : `sub-${idx}`}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {sub.code || 'MAA-101'}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{sub.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      {sub.category || 'Diini'}
                    </span>
                  </div>

                  {sub.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{sub.description}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Dhibicda Ugu Badan:</span>
                      <span className="font-black text-emerald-800 text-xs">{sub.maxScore || 100} Dhibic</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold">Dhibicda Gudubta:</span>
                      <span className="font-black text-amber-700 text-xs">{sub.passScore || 50} Dhibic</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditSubject(sub)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0e7a48] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Wax ka beddel (Edit)</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSubjectClick(sub.id, sub.name)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tirtir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Add/Edit Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#d4af37] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>{editingSubject ? 'Wax ka beddel Maadada (Edit Subject)' : 'Ku dar Maado Cusub (Add Subject)'}</span>
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Maadada *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Xisaab, Siyra, Fiiqhi, Axaadiith"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Koodhka (Code)</label>
                  <input
                    type="text"
                    placeholder="e.g. MAA-101"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qaybta (Category)</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Diini">Diini (Islamic)</option>
                    <option value="Luuqad">Luuqad (Language)</option>
                    <option value="Maadi">Maadi (General Science)</option>
                    <option value="Akhlaaq">Akhlaaq (Behavior)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dhibicda Ugu Badan (Max) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={1000}
                    value={subMaxScore}
                    onChange={(e) => setSubMaxScore(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dhibicda Gudubta (Pass) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={1000}
                    value={subPassScore}
                    onChange={(e) => setSubPassScore(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faahfaahin (Description)</label>
                <textarea
                  rows={2}
                  placeholder="Faahfaahin kooban oo saabsan maadadan..."
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  <span>Keydi Maadada (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <AuditLogView currentUser={currentUser} />
      )}

      {/* TAB 7: HORMUUD SMS API CREDENTIALS & TESTING */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-xl border border-amber-400/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#d4af37] to-amber-500 text-slate-950 rounded-2xl shadow-md shrink-0">
                  <Smartphone className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#d4af37] tracking-tight">
                    📱 Hormuud Bulk SMS API Credentials &amp; Configuration
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    Halkan ka maamul oo ka tijaabi dhagxaanta API-ga (API Key, Token Secret, Sender ID) Hormuud SMS si toos ah oo adoon beddelin faylalka .env.
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border shrink-0 ${
                formData.smsSettings?.isMockMode !== false
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
              }`}>
                {formData.smsSettings?.isMockMode !== false ? '🧪 Mock / Simulation Mode' : '🚀 Live Gateway Mode'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                <span className="text-slate-300 font-bold block text-[10px] uppercase">Service Status</span>
                <span className="font-extrabold text-white text-sm">
                  {formData.smsSettings?.enabled !== false ? '✅ Service Enabled (Active)' : '🛑 Service Disabled'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                <span className="text-slate-300 font-bold block text-[10px] uppercase">Sender ID</span>
                <span className="font-extrabold text-amber-300 font-mono text-sm">
                  {formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                <span className="text-slate-300 font-bold block text-[10px] uppercase">API Gateway</span>
                <span className="font-extrabold text-emerald-300 text-sm">
                  {formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS API'}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Key className="w-4 h-4 text-[#0e7a48]" />
              <span>Habaynta Dhagxaanta API-ga (Hormuud SMS API Credentials)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* API Gateway Provider */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Provider-ka (Gateway Name)</label>
                <input
                  type="text"
                  value={formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS'}
                  onChange={(e) => {
                    const updatedSms = {
                      ...formData.smsSettings,
                      enabled: formData.smsSettings?.enabled !== false,
                      apiKey: formData.smsSettings?.apiKey || '',
                      tokenSecret: formData.smsSettings?.tokenSecret || '',
                      senderId: formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS',
                      isMockMode: formData.smsSettings?.isMockMode !== false,
                      gatewayName: e.target.value,
                    };
                    setFormData({ ...formData, smsSettings: updatedSms });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold"
                />
              </div>

              {/* Sender ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sender ID (Magaca ka muuqanaya SMS-ka) *</label>
                <input
                  type="text"
                  placeholder="TAHDIIB-MIS"
                  value={formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS'}
                  onChange={(e) => {
                    const val = e.target.value;
                    localStorage.setItem('sms_sender_id', val);
                    const updatedSms = {
                      ...formData.smsSettings,
                      enabled: formData.smsSettings?.enabled !== false,
                      apiKey: formData.smsSettings?.apiKey || '',
                      tokenSecret: formData.smsSettings?.tokenSecret || '',
                      senderId: val,
                      isMockMode: formData.smsSettings?.isMockMode !== false,
                      gatewayName: formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS',
                    };
                    setFormData({ ...formData, smsSettings: updatedSms });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold"
                />
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">API Key *</label>
                  <button
                    type="button"
                    onClick={() => setShowSmsApiKey(!showSmsApiKey)}
                    className="text-[11px] text-[#0e7a48] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {showSmsApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSmsApiKey ? 'Qari' : 'Tus API Key'}</span>
                  </button>
                </div>
                <input
                  type={showSmsApiKey ? 'text' : 'password'}
                  placeholder="e.g. hrm_live_key_992011234..."
                  value={formData.smsSettings?.apiKey || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    localStorage.setItem('sms_api_key', val);
                    const updatedSms = {
                      ...formData.smsSettings,
                      enabled: formData.smsSettings?.enabled !== false,
                      apiKey: val,
                      tokenSecret: formData.smsSettings?.tokenSecret || '',
                      senderId: formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS',
                      isMockMode: formData.smsSettings?.isMockMode !== false,
                      gatewayName: formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS',
                    };
                    setFormData({ ...formData, smsSettings: updatedSms });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold text-emerald-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  API Key-ga rasmiga ah oo ka kooban 10+ xaraf oo aad ka soo qaadatay Hormuud Bulk SMS Dashboard.
                </p>
              </div>

              {/* Token Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Token Secret / API Secret</label>
                  <button
                    type="button"
                    onClick={() => setShowSmsTokenSecret(!showSmsTokenSecret)}
                    className="text-[11px] text-[#0e7a48] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {showSmsTokenSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSmsTokenSecret ? 'Qari' : 'Tus Token'}</span>
                  </button>
                </div>
                <input
                  type={showSmsTokenSecret ? 'text' : 'password'}
                  placeholder="e.g. secret_token_abc123..."
                  value={formData.smsSettings?.tokenSecret || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    localStorage.setItem('sms_token_secret', val);
                    const updatedSms = {
                      ...formData.smsSettings,
                      enabled: formData.smsSettings?.enabled !== false,
                      apiKey: formData.smsSettings?.apiKey || '',
                      tokenSecret: val,
                      senderId: formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS',
                      isMockMode: formData.smsSettings?.isMockMode !== false,
                      gatewayName: formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS',
                    };
                    setFormData({ ...formData, smsSettings: updatedSms });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold text-emerald-900"
                />
              </div>
            </div>

            {/* Mode & Service Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsSettings?.isMockMode !== false}
                  onChange={(e) => {
                    const isMock = e.target.checked;
                    const updatedSms = {
                      ...formData.smsSettings,
                      enabled: formData.smsSettings?.enabled !== false,
                      apiKey: formData.smsSettings?.apiKey || '',
                      tokenSecret: formData.smsSettings?.tokenSecret || '',
                      senderId: formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS',
                      isMockMode: isMock,
                      gatewayName: formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS',
                    };
                    setFormData({ ...formData, smsSettings: updatedSms });
                  }}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-amber-300 mt-0.5"
                />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-amber-950 block">
                    🧪 Mock Mode / Tijaabo Bilaash ah (Simulated Dispatch)
                  </span>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Marka aad shido Mock Mode, fariimaha SMS-ka laguma dalacayo lacagta Hormuud, laakiin nidaamku wuxuu idin tusayaa simulation buuxa oo lagu tijaabinayo habka fariintu u baxyso.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsSettings?.enabled !== false}
                  onChange={(e) => {
                    const isEnabled = e.target.checked;
                    const updatedSms = {
                      ...formData.smsSettings,
                      enabled: isEnabled,
                      apiKey: formData.smsSettings?.apiKey || '',
                      tokenSecret: formData.smsSettings?.tokenSecret || '',
                      senderId: formData.smsSettings?.senderId || formData.schoolName || 'TAHDIIB-MIS',
                      isMockMode: formData.smsSettings?.isMockMode !== false,
                      gatewayName: formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS',
                    };
                    setFormData({ ...formData, smsSettings: updatedSms });
                  }}
                  className="w-5 h-5 rounded text-[#0e7a48] focus:ring-[#0e7a48] border-emerald-300 mt-0.5"
                />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-emerald-950 block">
                    ⚡ Shid / Dami SMS Service-ka Guud
                  </span>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Ogolow ama jooji dirista SMS-ka dhammaan nidaamka (ogeysiisyada bixinta lacagaha, xaadirinta ardayda, iyo xusuusinta waalidiinta).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Interactive Test SMS Console Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>🧪 Qaybta Tijaabada Direct-ka ah (Test SMS API Dispatch)</span>
            </h4>

            <p className="text-xs text-slate-600">
              Geli nambar telefoon oo Somali ah (e.g. 25261XXXXXXX) si aad toos ugu tijaabiso dirista SMS-ka iyo shaqada API Key-ga.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefoonka Tijaabada *</label>
                <input
                  type="text"
                  placeholder="252615000000"
                  value={testSmsPhone}
                  onChange={(e) => setTestSmsPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Fariinta Tijaabada (Test Message)</label>
                <input
                  type="text"
                  value={testSmsMessage}
                  onChange={(e) => setTestSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!testSmsPhone.trim()) {
                    alert('Fadlan geli nambarka telefoonka tijaabada!');
                    return;
                  }

                  const apiKeyVal = formData.smsSettings?.apiKey || localStorage.getItem('sms_api_key') || '';
                  const tokenSecretVal = formData.smsSettings?.tokenSecret || localStorage.getItem('sms_token_secret') || '';
                  const senderIdVal = formData.smsSettings?.senderId || localStorage.getItem('sms_sender_id') || formData.schoolName || 'TAHDIIB-MIS';
                  const isMock = formData.smsSettings?.isMockMode ?? true;

                  setIsTestingSms(true);
                  setTestSmsResult(null);

                  try {
                    const res = await sendSmsViaBackend({
                      recipients: testSmsPhone.trim(),
                      recipientName: 'Waalid Tijaabo',
                      recipientPhone: testSmsPhone.trim(),
                      message: testSmsMessage.trim() || 'Fariin tijaabo ah ka socota Hormuud SMS API settings.',
                      senderId: senderIdVal,
                      gateway: formData.smsSettings?.gatewayName || 'Hormuud Bulk SMS',
                      messageType: 'General',
                      apiKey: apiKeyVal,
                      tokenSecret: tokenSecretVal,
                      isMockMode: isMock,
                    });

                    setTestSmsResult({
                      success: res.log.status !== 'failed',
                      mode: res.log.status === 'simulated' ? 'Mock / Test Simulation Mode' : 'Live Hormuud SMS Gateway API',
                      notice: res.log.notice || (res.log.status === 'simulated' ? 'SMS-ku wuxuu ku baxay Test Simulation.' : 'SMS-ku si guul ah ayaa ugu dhacay Hormuud SMS Gateway!'),
                      details: `Log ID: ${res.log.id} | Phone: ${res.log.recipientPhone} | Gateway: ${res.log.gateway} | Sender: ${res.log.senderId}`,
                    });
                  } catch (err: any) {
                    setTestSmsResult({
                      success: false,
                      mode: 'API Error',
                      notice: `Cillad ayaa ka dhacday tijaabada SMS-ka: ${err?.message || err}`,
                    });
                  } finally {
                    setIsTestingSms(false);
                  }
                }}
                disabled={isTestingSms}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isTestingSms ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Tijaabada SMS-ka waa ay socotaa...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>🧪 DIR SMS TIJAABO AH (TEST SMS DISPATCH)</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500">
                Natiijada tijaabada waxaa sidoo kale lagu duubayaa <strong>Audit Logs</strong> &amp; <strong>SMS Logs</strong>.
              </span>
            </div>

            {/* Test Result Display Box */}
            {testSmsResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${
                  testSmsResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {testSmsResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{testSmsResult.notice}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-white border border-slate-200">
                    Mode: {testSmsResult.mode}
                  </span>
                </div>
                {testSmsResult.details && (
                  <p className="font-mono text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
                    {testSmsResult.details}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: STUDENT EXIT NOTIFICATIONS & 3 SHIFTS MANAGEMENT */}
      {activeTab === 'exitNotifs' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-amber-400/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-300 tracking-tight">
                    🚨 Nidaamka Ogeysiiska Waalidiinta (Marka Ardaygu Machadka Ka Baxayo)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Halkan ka maamul 3-da waqti ee ogeysiiska (Shifts), Push Notifications, Hormuud SMS &amp; Sound Alerts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playHighPriorityAlertSound();
                  alert('🔊 Tijaabada codka digniinta sare (High Priority Sound Alert) waa la shiday!');
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Tijaabi Codka Digniinta</span>
              </button>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-slate-300 text-[10px] uppercase font-bold block">Master Exit Alert</span>
                <span className="font-extrabold text-sm text-amber-300">
                  {formData.studentExitSettings?.enabled !== false ? '✅ On (Active)' : '🛑 Off'}
                </span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-slate-300 text-[10px] uppercase font-bold block">Push Notifications</span>
                <span className="font-extrabold text-sm text-emerald-300">
                  {formData.studentExitSettings?.enablePush !== false ? '✅ In-App & Browser' : '🛑 Off'}
                </span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-slate-300 text-[10px] uppercase font-bold block">Hormuud SMS Dispatch</span>
                <span className="font-extrabold text-sm text-amber-300">
                  {formData.studentExitSettings?.enableSms !== false ? '✅ SMS Enabled' : '🛑 SMS Disabled'}
                </span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <span className="text-slate-300 text-[10px] uppercase font-bold block">Active Shifts</span>
                <span className="font-extrabold text-sm text-white">
                  3-da Waqti ({formData.studentExitSettings?.shifts?.filter((s) => s.isActive).length || 3}/3)
                </span>
              </div>
            </div>
          </div>

          {/* Core Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h4 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>1. Dejimaha Guud (Master Settings)</span>
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...formData,
                    studentExitSettings: {
                      ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                      enabled: !(formData.studentExitSettings?.enabled !== false),
                    },
                  };
                  setFormData(updated);
                  onSaveSettings(updated);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                  formData.studentExitSettings?.enabled !== false
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {formData.studentExitSettings?.enabled !== false ? '✅ Active' : '🛑 Disabled'}
              </button>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.studentExitSettings?.enablePush !== false}
                  onChange={(e) => {
                    const updated = {
                      ...formData,
                      studentExitSettings: {
                        ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                        enablePush: e.target.checked,
                      },
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-4 h-4 text-[#0e7a48] rounded border-slate-300 focus:ring-[#0e7a48]"
                />
                <div>
                  <span className="font-black text-slate-900 block">Push Notifications (Browser & Mobile App)</span>
                  <span className="text-[#0e7a48] text-[11px] block">Dir ogeysiis toos ah oo ku dhaca browser-ka ama app-ka waalidka</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.studentExitSettings?.enableSms !== false}
                  onChange={(e) => {
                    const updated = {
                      ...formData,
                      studentExitSettings: {
                        ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                        enableSms: e.target.checked,
                      },
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-4 h-4 text-[#0e7a48] rounded border-slate-300 focus:ring-[#0e7a48]"
                />
                <div>
                  <span className="font-black text-slate-900 block">Hormuud SMS Dispatch (Fariin Qoraal Ah)</span>
                  <span className="text-[#0e7a48] text-[11px] block">Si toos ah fariin SMS ah ugu dir telefoonka waalidka</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.studentExitSettings?.enableSoundAlert !== false}
                  onChange={(e) => {
                    const updated = {
                      ...formData,
                      studentExitSettings: {
                        ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                        enableSoundAlert: e.target.checked,
                      },
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-4 h-4 text-[#0e7a48] rounded border-slate-300 focus:ring-[#0e7a48]"
                />
                <div>
                  <span className="font-black text-slate-900 block">Digniin Cod Leh (High Priority Sound Alert)</span>
                  <span className="text-[#0e7a48] text-[11px] block">Gali cod digniin sare ah marka ogeysiisku ku dhaco waalidka</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.studentExitSettings?.enableVibration !== false}
                  onChange={(e) => {
                    const updated = {
                      ...formData,
                      studentExitSettings: {
                        ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                        enableVibration: e.target.checked,
                      },
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-4 h-4 text-[#0e7a48] rounded border-slate-300 focus:ring-[#0e7a48]"
                />
                <div>
                  <span className="font-black text-slate-900 block">Vibration Pattern (Ruxid Mobile-ka)</span>
                  <span className="text-[#0e7a48] text-[11px] block">Rux telefoonka waalidka si uu markiiba u ogaado bixitaanka</span>
                </div>
              </label>
            </div>
          </div>

          {/* 3 Shifts Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-slate-900 text-sm">2. Maamulka 3-da Waqti ee Bixitaanka (3 Notification Shifts)</h4>
                <p className="text-xs text-slate-500">Dejee saacadaha bilowga iyo dhamaadka ee Shift kasta.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(formData.studentExitSettings?.shifts || DEFAULT_EXIT_SETTINGS.shifts).map((shift, idx) => (
                <div key={shift.id ? `${shift.id}-${idx}` : `shift-${idx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-xs text-slate-900">{shift.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      shift.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                    }`}>
                      {shift.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Bilow (Start)</label>
                      <input
                        type="time"
                        value={shift.startTime || ''}
                        onChange={(e) => {
                          const shifts = [...(formData.studentExitSettings?.shifts || DEFAULT_EXIT_SETTINGS.shifts)];
                          shifts[idx] = { ...shifts[idx], startTime: e.target.value };
                          const updated = {
                            ...formData,
                            studentExitSettings: {
                              ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                              shifts,
                            },
                          };
                          setFormData(updated);
                          onSaveSettings(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Dhamaad (End)</label>
                      <input
                        type="time"
                        value={shift.endTime || ''}
                        onChange={(e) => {
                          const shifts = [...(formData.studentExitSettings?.shifts || DEFAULT_EXIT_SETTINGS.shifts)];
                          shifts[idx] = { ...shifts[idx], endTime: e.target.value };
                          const updated = {
                            ...formData,
                            studentExitSettings: {
                              ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                              shifts,
                            },
                          };
                          setFormData(updated);
                          onSaveSettings(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                    <label className="flex items-center justify-between text-[11px] font-bold text-slate-700 cursor-pointer">
                      <span>Shaqeynaysa (Shift Active)</span>
                      <input
                        type="checkbox"
                        checked={shift.isActive}
                        onChange={(e) => {
                          const shifts = [...(formData.studentExitSettings?.shifts || DEFAULT_EXIT_SETTINGS.shifts)];
                          shifts[idx] = { ...shifts[idx], isActive: e.target.checked };
                          const updated = {
                            ...formData,
                            studentExitSettings: {
                              ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                              shifts,
                            },
                          };
                          setFormData(updated);
                          onSaveSettings(updated);
                        }}
                        className="w-4 h-4 text-[#0e7a48] rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between text-[11px] font-bold text-slate-700 cursor-pointer">
                      <span>Send Push Notification</span>
                      <input
                        type="checkbox"
                        checked={shift.sendPush}
                        onChange={(e) => {
                          const shifts = [...(formData.studentExitSettings?.shifts || DEFAULT_EXIT_SETTINGS.shifts)];
                          shifts[idx] = { ...shifts[idx], sendPush: e.target.checked };
                          const updated = {
                            ...formData,
                            studentExitSettings: {
                              ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                              shifts,
                            },
                          };
                          setFormData(updated);
                          onSaveSettings(updated);
                        }}
                        className="w-4 h-4 text-[#0e7a48] rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between text-[11px] font-bold text-slate-700 cursor-pointer">
                      <span>Send Hormuud SMS</span>
                      <input
                        type="checkbox"
                        checked={shift.sendSms}
                        onChange={(e) => {
                          const shifts = [...(formData.studentExitSettings?.shifts || DEFAULT_EXIT_SETTINGS.shifts)];
                          shifts[idx] = { ...shifts[idx], sendSms: e.target.checked };
                          const updated = {
                            ...formData,
                            studentExitSettings: {
                              ...(formData.studentExitSettings || DEFAULT_EXIT_SETTINGS),
                              shifts,
                            },
                          };
                          setFormData(updated);
                          onSaveSettings(updated);
                        }}
                        className="w-4 h-4 text-[#0e7a48] rounded"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#d4af37] flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Ku Dar Admin / Isticmaale Cusub</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Buuxa *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agaasime Cumar Cabdi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Username *</label>
                    <button
                      type="button"
                      onClick={() => setNewUsername(generateAutoUsernameForRole(newRole, newName))}
                      className="text-[10px] text-[#0e7a48] hover:underline font-bold cursor-pointer"
                    >
                      💡 Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="admin_cumar"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Password *</label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-[10px] text-[#0e7a48] hover:underline font-bold cursor-pointer"
                    >
                      🎲 Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold text-[#0e7a48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nooca (Role) *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold text-amber-950"
                  >
                    <option value="admin">👑 Admin (Maamule)</option>
                    <option value="teacher">📖 Teacher (Macallin)</option>
                    <option value="parent">👨‍👩‍👧 Parent (Waalid)</option>
                    <option value="student">🎓 Student (Arday)</option>
                    <option value="finance">💵 Finance (Maaliyad)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefoonka</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email-ka</label>
                <input
                  type="email"
                  placeholder="user@tahdiib.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-[#d4af37]" />
                  <span>Abuur Admin / User Cusub</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#d4af37] flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Beddel Username & Nambar Sireed (Edit Credentials)</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca</label>
                <input
                  type="text"
                  required
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Username Cusub *</label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          username: generateAutoUsernameForRole(editingUser.role, editingUser.name),
                        })
                      }
                      className="text-[10px] text-[#0e7a48] hover:underline font-bold cursor-pointer"
                    >
                      💡 Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingUser.username || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Nambar Sireed (Password) *</label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          password: generateRandomPassword(),
                        })
                      }
                      className="text-[10px] text-[#0e7a48] hover:underline font-bold cursor-pointer"
                    >
                      🎲 Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold text-[#0e7a48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role-ka</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="teacher">📖 Teacher</option>
                    <option value="parent">👨‍👩‍👧 Parent</option>
                    <option value="student">🎓 Student</option>
                    <option value="finance">💵 Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefoonka</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold rounded-lg cursor-pointer"
                >
                  Keydi Isbeddelka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
