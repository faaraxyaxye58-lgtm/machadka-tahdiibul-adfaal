import React, { useMemo, memo } from 'react';
import { getParentChildren } from '../utils/parentMatcher';
import { isWeeklyPlanCompleted } from '../utils/quranAutomation';
import {
  Student,
  Teacher,
  Parent,
  ClassRoom,
  HifzRecord,
  PaymentTransaction,
  AttendanceRecord,
  SchoolSettings,
  User,
} from '../types';
import { NavTab } from '../components/Sidebar';
import { canUserAccessPayments } from '../lib/permissionUtils';
import { Storage } from '../lib/storage';
import {
  GraduationCap,
  Users,
  HeartHandshake,
  BookOpenCheck,
  BookMarked,
  DollarSign,
  CheckSquare,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Pencil,
  X,
  Save,
  MessageSquare,
  Send,
  ArrowRight,
  UserX,
  Clock,
  CreditCard,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  Cloud,
  AlertTriangle,
  Download,
  Megaphone,
  Copy,
  ShieldCheck,
  CalendarCheck,
  Briefcase,
  Award,
  Printer,
  Search,
  BarChart3,
  Wrench,
  ExternalLink,
} from 'lucide-react';

import { formatMoney, isFinancialDataHidden } from '../utils/moneyUtils';
import { backupAllDataToFirestore, getLastBackupInfo } from '../lib/firebase';
import { PrintQuranCertificateModal } from '../components/PrintQuranCertificateModal';
import { ParentAlertControlPanel } from '../components/ParentAlertControlPanel';
import { SomaliVoiceAlertDiagnostics } from '../components/SomaliVoiceAlertDiagnostics';

interface DashboardViewProps {
  currentUser?: User | null;
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  classes: ClassRoom[];
  hifzRecords: HifzRecord[];
  payments: PaymentTransaction[];
  attendance: AttendanceRecord[];
  settings: SchoolSettings;
  setActiveTab: (tab: NavTab) => void;
  onOpenStudentModal: () => void;
  onOpenHifzModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenChangeProfile?: () => void;
  onOpenAdminVoiceModal?: () => void;
  onSaveSettings?: (settings: SchoolSettings) => void;
  onPrintReceipt?: (payment: PaymentTransaction) => void;
  isMoneyHidden?: boolean;
  onToggleHideMoney?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = memo(({
  currentUser,
  students,
  teachers,
  parents,
  classes,
  hifzRecords,
  payments,
  attendance,
  settings,
  setActiveTab,
  onOpenStudentModal,
  onOpenHifzModal,
  onOpenPaymentModal,
  onOpenChangeProfile,
  onOpenAdminVoiceModal,
  onSaveSettings,
  onPrintReceipt,
  isMoneyHidden = false,
  onToggleHideMoney,
}) => {
  const shouldHideMoney = isFinancialDataHidden(currentUser, settings, isMoneyHidden);
  const [isEditingBanner, setIsEditingBanner] = React.useState(false);
  const [editGreeting, setEditGreeting] = React.useState(settings.welcomeGreeting || "Ku Soo Dhowaw " + settings.schoolName);
  const [editSubtext, setEditSubtext] = React.useState(settings.welcomeSubtext || "System-ka oo idil waxaad ka maamuli kartaa Ardayda, Xifdinta Qur'aanka, Macallimiinta, Xaadiriska iyo Bixinta Lacagaha si dhakhso ah.");
  const [editAcademicYear, setEditAcademicYear] = React.useState(settings.academicYear || "2026 - 2027");

  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [backupSuccessToast, setBackupSuccessToast] = React.useState<string | null>(null);

  const backupInfo = React.useMemo(() => getLastBackupInfo(settings), [settings]);

  const handleManualBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try {
      const res = await backupAllDataToFirestore({
        settings,
        students,
        teachers,
        parents,
        classes,
        hifzRecords,
        attendance,
        payments,
      });

      if (onSaveSettings) {
        onSaveSettings({
          ...settings,
          lastBackupTimestamp: res.timestamp,
        });
      }

      setBackupSuccessToast('✅ Xogta maanta waxaa si guul leh loogu kaydiyay Cloud Firestore!');
      setTimeout(() => setBackupSuccessToast(null), 5000);
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday kaydinta Firestore: ' + (err?.message || err));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadLocalJsonBackup = () => {
    try {
      const fullBackupData = {
        settings,
        students,
        teachers,
        parents,
        classes,
        hifzRecords,
        attendance,
        payments,
        exportDate: new Date().toISOString(),
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(fullBackupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${settings.schoolName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupSuccessToast('📥 Xogta offline backup-ka ah (.json) waa la soo dejiyeey!');
      setTimeout(() => setBackupSuccessToast(null), 5000);
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday soo dejinta JSON: ' + (err?.message || err));
    }
  };

  // Admin Batch Fee Reminder modal states
  const [isFeeReminderModalOpen, setIsFeeReminderModalOpen] = React.useState(false);
  const [copiedBatchText, setCopiedBatchText] = React.useState(false);

  React.useEffect(() => {
    setEditGreeting(settings.welcomeGreeting || "Ku Soo Dhowaw " + settings.schoolName);
    setEditSubtext(settings.welcomeSubtext || "System-ka oo idil waxaad ka maamuli kartaa Ardayda, Xifdinta Qur'aanka, Macallimiinta, Xaadiriska iyo Bixinta Lacagaha si dhakhso ah.");
    setEditAcademicYear(settings.academicYear || "2026 - 2027");
  }, [settings]);

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveSettings) {
      onSaveSettings({
        ...settings,
        welcomeGreeting: editGreeting.trim(),
        welcomeSubtext: editSubtext.trim(),
        academicYear: editAcademicYear.trim(),
      });
    }
    setIsEditingBanner(false);
  };

  // Shared Memoized Computations (MUST be before any role-based conditional returns for Rules of Hooks)
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'Active'), [students]);
  const totalPaidCount = useMemo(() => students.filter((s) => s.feeStatus === 'Paid').length, [students]);
  const unpaidStudentsList = useMemo(() => students.filter((s) => s.feeStatus !== 'Paid'), [students]);
  const totalUnpaidCount = unpaidStudentsList.length;
  const khatimStudentsCount = useMemo(() => students.filter((s) => s.currentJuz === 30).length, [students]);

  const totalMonthlyIncome = useMemo(() => payments.reduce((acc, p) => acc + p.amountPaid, 0), [payments]);
  const totalExpectedRevenue = useMemo(() => activeStudents.reduce((acc, s) => acc + (s.feeMonthly || 0), 0), [activeStudents]);
  const totalPendingFees = useMemo(() => unpaidStudentsList.reduce((acc, s) => acc + (s.feeMonthly || 0), 0), [unpaidStudentsList]);

  // Today's attendance specific stats
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAttendanceRecords = useMemo(() => attendance.filter((a) => a.date === todayDateStr), [attendance, todayDateStr]);

  const presentTodayCount = useMemo(() => {
    return todayAttendanceRecords.length > 0
      ? todayAttendanceRecords.filter((a) => a.status === 'Present').length
      : attendance.filter((a) => a.status === 'Present').length;
  }, [todayAttendanceRecords, attendance]);

  const absentTodayCount = useMemo(() => {
    return todayAttendanceRecords.length > 0
      ? todayAttendanceRecords.filter((a) => a.status === 'Absent').length
      : attendance.filter((a) => a.status === 'Absent').length;
  }, [todayAttendanceRecords, attendance]);

  const totalTodayRecords = todayAttendanceRecords.length > 0 ? todayAttendanceRecords.length : attendance.length;

  const attendanceRate = useMemo(() => {
    return totalTodayRecords > 0
      ? Math.round((presentTodayCount / totalTodayRecords) * 100)
      : 95;
  }, [totalTodayRecords, presentTodayCount]);

  // Xaadiriska Toddobaadkii ee Recharts (Weekly Attendance & Absence Bar Chart)
  const weeklyAttendanceData = React.useMemo(() => {
    const days: { dateStr: string; maalinta: string; 'Ardayda Xaadiray (Jooga)': number; 'Ardayda Maqan (Absent)': number }[] = [];
    const somaliDays = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco', 'Sabti'];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = somaliDays[d.getDay()];
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const label = `${dayName} (${dayNum}/${monthNum})`;

      const dayRecords = attendance.filter((a) => a.date === dateStr);
      let jooga = 0;
      let maqan = 0;

      if (dayRecords.length > 0) {
        jooga = dayRecords.filter((a) => a.status === 'Present').length;
        maqan = dayRecords.filter((a) => a.status === 'Absent' || a.status === 'Late' || a.status === 'Permission' || a.status === 'Excused').length;
      } else {
        const baseTotal = activeStudents.length > 0 ? activeStudents.length : 45;
        const indexOffset = (i * 2 + 1) % 4;
        jooga = Math.max(0, baseTotal - (2 + indexOffset));
        maqan = baseTotal - jooga;
      }

      days.push({
        dateStr,
        maalinta: label,
        'Ardayda Xaadiray (Jooga)': jooga,
        'Ardayda Maqan (Absent)': maqan,
      });
    }

    return days;
  }, [attendance, activeStudents]);

  // Xaadiriska Bilaha ee Recharts (Monthly Attendance Trend Line Chart)
  const monthlyTrendData = React.useMemo(() => {
    const somaliMonths = [
      { key: '03', name: 'Marso', defaultRate: 92 },
      { key: '04', name: 'Abriil', defaultRate: 88 },
      { key: '05', name: 'May', defaultRate: 94 },
      { key: '06', name: 'Yuunyo', defaultRate: 91 },
      { key: '07', name: 'Luulyo', defaultRate: 96 },
      { key: '08', name: 'Ogoosto', defaultRate: 95 },
    ];

    const monthStats: Record<string, { present: number; total: number }> = {};
    attendance.forEach((rec) => {
      if (rec.date) {
        const mKey = rec.date.substring(5, 7);
        if (!monthStats[mKey]) monthStats[mKey] = { present: 0, total: 0 };
        monthStats[mKey].total += 1;
        if (rec.status === 'Present') monthStats[mKey].present += 1;
      }
    });

    return somaliMonths.map((m) => {
      const stats = monthStats[m.key];
      let rate = m.defaultRate;
      if (stats && stats.total > 0) {
        rate = Math.round((stats.present / stats.total) * 100);
      }
      return {
        bisha: m.name,
        'Boqolkiiba Xaadiriska': rate,
      };
    });
  }, [attendance]);

  // Financial trend data for Recharts Line Chart
  const monthlyFinancialData = useMemo(() => {
    const somaliMonths = [
      { key: '03', name: 'Marso', defaultIncome: 1250, defaultRate: 85 },
      { key: '04', name: 'Abriil', defaultIncome: 1400, defaultRate: 88 },
      { key: '05', name: 'May', defaultIncome: 1550, defaultRate: 91 },
      { key: '06', name: 'Yuunyo', defaultIncome: 1620, defaultRate: 93 },
      { key: '07', name: 'Luulyo', defaultIncome: 1780, defaultRate: 95 },
      { key: '08', name: 'Ogoosto', defaultIncome: totalMonthlyIncome > 0 ? totalMonthlyIncome : 1850, defaultRate: 96 },
    ];

    const monthIncomeMap: Record<string, number> = {};
    payments.forEach((p) => {
      if (p.date) {
        const mKey = p.date.substring(5, 7);
        monthIncomeMap[mKey] = (monthIncomeMap[mKey] || 0) + (p.amountPaid || 0);
      }
    });

    const expectedTotal = activeStudents.reduce((acc, s) => acc + (s.feeMonthly || 15), 0) || 2000;

    return somaliMonths.map((m) => {
      const realIncome = monthIncomeMap[m.key];
      const income = realIncome !== undefined && realIncome > 0 ? realIncome : m.defaultIncome;
      const collectionRate = Math.min(100, Math.round((income / expectedTotal) * 100)) || m.defaultRate;

      return {
        bisha: m.name,
        'Dakhliga Soo Xarooday': income,
        'Boqolkiiba Bixinta': collectionRate,
      };
    });
  }, [payments, activeStudents, totalMonthlyIncome]);

  // Graduation Candidates & Certificate Status Computation
  const [selectedCertificateStudent, setSelectedCertificateStudent] = React.useState<Student | null>(null);
  const [graduationSearchTerm, setGraduationSearchTerm] = React.useState('');
  const [graduationFilterTab, setGraduationFilterTab] = React.useState<'all' | 'ready' | 'pending'>('all');

  const graduatingCandidates = useMemo(() => {
    return students.filter((s) => {
      const isGraduatedStatus = s.status === 'Graduated';
      const isFullQuran = s.currentJuz === 30;
      const isGraduatingClass =
        (s.className && s.className.toLowerCase().includes('hifz kaamil')) ||
        (s.className && s.className.toLowerCase().includes('qalin')) ||
        (s.className && s.className.toLowerCase().includes('fasal 4')) ||
        (s.className && s.className.toLowerCase().includes('fasalka 4')) ||
        (s.className && s.className.toLowerCase().includes('kaamil'));
      const isHighJuz = (s.currentJuz || 0) >= 25;

      return isGraduatedStatus || isFullQuran || isGraduatingClass || isHighJuz;
    });
  }, [students]);

  const certificatesReadyCount = useMemo(() => {
    return graduatingCandidates.filter((s) => s.currentJuz === 30 || s.status === 'Graduated').length;
  }, [graduatingCandidates]);

  const certificatesPendingCount = useMemo(() => {
    return graduatingCandidates.filter((s) => (s.currentJuz || 0) >= 25 && s.currentJuz < 30 && s.status !== 'Graduated').length;
  }, [graduatingCandidates]);

  const honorsCertificatesCount = useMemo(() => {
    return graduatingCandidates.filter((s) => s.currentJuz === 30 || s.status === 'Graduated').length;
  }, [graduatingCandidates]);

  const filteredGraduationCandidates = useMemo(() => {
    return graduatingCandidates.filter((candidate) => {
      const matchesSearch =
        candidate.fullName.toLowerCase().includes(graduationSearchTerm.toLowerCase()) ||
        candidate.studentId.toLowerCase().includes(graduationSearchTerm.toLowerCase()) ||
        candidate.className.toLowerCase().includes(graduationSearchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const isReady = candidate.currentJuz === 30 || candidate.status === 'Graduated';
      if (graduationFilterTab === 'ready') return isReady;
      if (graduationFilterTab === 'pending') return !isReady;
      return true;
    });
  }, [graduatingCandidates, graduationSearchTerm, graduationFilterTab]);

  // PARENT PORTAL DASHBOARD
  if (currentUser?.role === 'parent') {
    const myChildren = getParentChildren(currentUser, students, parents);
    const childrenToDisplay = myChildren.length > 0 ? myChildren : students.slice(0, 2);

    // Check which children have completed their weekly Hifz plan
    const completedChildren = childrenToDisplay.filter(
      (child) => isWeeklyPlanCompleted(child, hifzRecords).isCompleted
    );

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-[#0e7a48] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-green-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-green-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
              👨‍👦‍👧 Boga Waalidka • Parent Portal
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              Soo Dhawoow, {currentUser.name}
            </h2>
            <p className="text-xs text-emerald-100">Halkan ka eeg horumarka Qur'aanka, xaadiriska iyo lacagaha ubadkaaga.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenChangeProfile && (
              <button
                onClick={onOpenChangeProfile}
                className="px-3.5 py-2.5 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Beddel User & Pass</span>
              </button>
            )}
            <button
              onClick={() => {
                const msg = encodeURIComponent(`Asc Maamulka Machadka (${settings.schoolName}), waxaan ahay waalidka (${currentUser.name}). Waxaan rabaa inaan idin kala xiriiro ardaydayda.`);
                window.open(`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
              }}
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebc57] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <span>💬 La xiriir Dugsiga</span>
            </button>
          </div>
        </div>

        {/* CELEBRATORY HAMBALYO NOTIFICATION BANNER FOR PARENT */}
        {completedChildren.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-lg border-2 border-amber-300 relative overflow-hidden space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                  🎉
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 font-black text-[10px] uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    <span>Ogeysiis Hambalyo • Hifz Milestone</span>
                  </div>
                  <h3 className="text-lg font-black text-white">
                    🎉 HAMBALYO WAALIDKA! QORSHAHA USBUUCA WAA LA DHAMMAYSTAY!
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs text-amber-50 leading-relaxed font-medium">
              {completedChildren.map((c) => {
                const status = isWeeklyPlanCompleted(c, hifzRecords);
                return (
                  <div key={c.id} className="bg-slate-950/30 p-3 rounded-xl border border-amber-200/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-white text-sm block">
                        {c.fullName} ({c.className})
                      </span>
                      <span className="text-emerald-200 block text-xs">
                        📖 {c.currentSurah || 'Al-Baqarah'} • {status.reason}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] self-start sm:self-center shadow-xs">
                      ✅ Qorshaha Usbuuca Waa La Dhameeyay
                    </span>
                  </div>
                );
              })}
              <p className="italic text-[11px] text-amber-100/90 pt-1">
                Illaahay ubadka ha u barakeeyo, waxaana leenahay hambalyo waalidxinimo oo mug leh! 🤲
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {childrenToDisplay.map((child) => {
            const childAttendance = attendance.filter((a) => a.studentId === child.id);
            const presentDays = childAttendance.filter((a) => a.status === 'Present').length;
            const attPercent = childAttendance.length ? Math.round((presentDays / childAttendance.length) * 100) : 98;
            const weeklyStatus = isWeeklyPlanCompleted(child, hifzRecords);

            return (
              <div key={child.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0e7a48] text-white font-black text-lg flex items-center justify-center shadow-xs">
                      {child.gender === 'Female' ? '👧' : '👦'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{child.fullName}</h3>
                      <div className="text-xs text-slate-500 font-medium">ID: {child.studentId} • {child.className}</div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${child.feeStatus === 'Paid' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'}`}>
                    {child.feeStatus === 'Paid' ? '✅ Fee Paid' : '⚠️ Fee Unpaid ($' + child.feeMonthly + ')'}
                  </span>
                </div>

                {/* Per-Child Hambalyo Milestone Badge */}
                {weeklyStatus.isCompleted && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-3 rounded-xl border border-amber-300 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-black text-xs text-amber-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>🎉 HAMBALYO WAALIDKA!</span>
                      </span>
                      <span className="text-[11px] text-slate-700 font-bold block">
                        Qorshaha xifdiga ee usbuucan waa la dhameeyay ({weeklyStatus.reason})
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg shrink-0">
                      ✅ Completed
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Juz-ka Hadda</span>
                    <span className="font-extrabold text-[#0e7a48] text-sm">Juz {child.currentJuz}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Suraada Hadda</span>
                    <span className="font-extrabold text-slate-800 text-xs truncate block">{child.currentSurah || 'Al-Baqarah'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Xaadiriska</span>
                    <span className="font-extrabold text-blue-700 text-sm">{attPercent}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button onClick={() => setActiveTab('hifz')} className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0e7a48] font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer">
                    📖 Hifziga
                  </button>
                  <button onClick={() => setActiveTab('exams')} className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 flex items-center justify-center gap-1 cursor-pointer">
                    📜 Imtixaanka
                  </button>
                  <button
                    onClick={() => {
                      const childPayment = payments.find(
                        (p) => p.studentId === child.id || p.studentName.toLowerCase().includes(child.fullName.toLowerCase())
                      );
                      if (childPayment && onPrintReceipt) {
                        onPrintReceipt(childPayment);
                      } else {
                        alert(`Wali ma jiro rasiidh lacag bixin ah oo laga duubay ardayga ${child.fullName}.`);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    💳 Rasiidhada
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // STUDENT PORTAL DASHBOARD
  if (currentUser?.role === 'student') {
    const myStudent = students.find(
      (s) =>
        s.fullName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        s.studentId.toLowerCase() === currentUser.username.toLowerCase()
    ) || students[0];

    const childAttendance = attendance.filter((a) => a.studentId === myStudent?.id);
    const presentDays = childAttendance.filter((a) => a.status === 'Present').length;
    const attPercent = childAttendance.length ? Math.round((presentDays / childAttendance.length) * 100) : 98;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-[#0e7a48] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-green-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-green-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
              🎓 Boga Ardayga • Student Portal
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              Soo Dhawoow, {myStudent ? myStudent.fullName : currentUser.name}
            </h2>
            <p className="text-xs text-emerald-100">Ku soo dhawoow aaggaaga shakhsiga ah ee barashada Qur'aanka Kariimka.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenChangeProfile && (
              <button
                onClick={onOpenChangeProfile}
                className="px-3.5 py-2.5 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Beddel User & Pass</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('quran')}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer border border-emerald-600"
            >
              <span>📖 Akhri Mus'haf-ka</span>
            </button>
          </div>
        </div>

        {myStudent && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-xs text-slate-500 font-bold block">Juz-ka Hadda Aad Dhigato</span>
              <span className="text-3xl font-black text-[#0e7a48]">Juz {myStudent.currentJuz}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-xs text-slate-500 font-bold block">Suraada Hadda</span>
              <span className="text-xl font-black text-slate-900">{myStudent.currentSurah || 'Al-Baqarah'}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
              <span className="text-xs text-slate-500 font-bold block">Boqolkiiba Xaadiriska</span>
              <span className="text-3xl font-black text-blue-700">{attPercent}%</span>
            </div>
          </div>
        )}

        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">📜 Eeg Kaarka Natiijada Imtixaanka</h4>
            <p className="text-xs text-amber-800">Soo dagsad ama eeg kaarkaaga natiijada imtixaankii ugu dambeeyay.</p>
          </div>
          <button onClick={() => setActiveTab('exams')} className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
            Eeg Kaarka
          </button>
        </div>
      </div>
    );
  }

  // TEACHER PORTAL DASHBOARD
  if (currentUser?.role === 'teacher') {
    const myClasses = classes.filter(
      (c) => c.teacherName.toLowerCase().includes(currentUser.name.toLowerCase())
    );
    const classesToDisplay = myClasses.length > 0 ? myClasses : classes;

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-[#0e7a48] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-green-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-green-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
              📖 Boga Macallinka • Teacher Portal
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              Soo Dhawoow, {currentUser.name}
            </h2>
            <p className="text-xs text-emerald-100">Maamul xaadiriska, casharrada xifdiga iyo farriimaha waalidiinta fasalladaada.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenChangeProfile && (
              <button
                onClick={onOpenChangeProfile}
                className="px-3 py-2 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Beddel User & Pass</span>
              </button>
            )}
            <button onClick={() => setActiveTab('attendance')} className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-600 shadow-xs cursor-pointer">
              📝 Xaadiriska
            </button>
            <button onClick={() => setActiveTab('hifz')} className="px-3.5 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl border border-emerald-600 cursor-pointer">
              📖 Duub Hifziga
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Fasalladayda</span>
            <span className="text-2xl font-black text-slate-900">{classesToDisplay.length} Fasal</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Dhammaan Ardayda Dugsiga</span>
            <span className="text-2xl font-black text-[#0e7a48]">{students.length} Arday</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Ardayda Khatimtay</span>
            <span className="text-2xl font-black text-amber-600">{students.filter((s) => s.currentJuz === 30).length} Arday</span>
          </div>
        </div>
      </div>
    );
  }

  // FINANCE PORTAL DASHBOARD
  if (currentUser?.role === 'finance' && canUserAccessPayments(currentUser, settings)) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-[#0e7a48] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-green-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-green-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
              💼 Boga Maaliyadda • Finance Portal
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              Soo Dhawoow, {currentUser.name}
            </h2>
            <p className="text-xs text-emerald-100">Maamul bixinta lacagaha, rasiidhada, iyo warbixinta maaliyadda ardayda.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenChangeProfile && (
              <button
                onClick={onOpenChangeProfile}
                className="px-3.5 py-2.5 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Beddel User & Pass</span>
              </button>
            )}
            <button
              onClick={onOpenPaymentModal}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer border border-emerald-600"
            >
              <span>💳 Bixinta Lacag Cusub</span>
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Dakhliga Bisha</span>
            <span className="text-2xl font-black text-[#0e7a48]">
              {shouldHideMoney ? '••••••' : formatMoney(totalMonthlyIncome)}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Lacagaha Dhiman</span>
            <span className="text-2xl font-black text-rose-600">
              {shouldHideMoney ? '••••••' : formatMoney(totalPendingFees)}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Ardayda Bixisay</span>
            <span className="text-2xl font-black text-emerald-700">{totalPaidCount} Arday</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Ardayda aan Bixin</span>
            <span className="text-2xl font-black text-amber-600">{totalUnpaidCount} Arday</span>
          </div>
        </div>

        {/* Quick Navigate to Payments View */}
        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-950 text-sm">💵 Maamul Bogga Lacagaha & Rasiidhada</h4>
            <p className="text-xs text-emerald-800">Eeg dhammaan hanti-dhowrka lacagaha, daabac rasiidhada oo maamul lacagaha dhiman.</p>
          </div>
          <button onClick={() => setActiveTab('payments')} className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
            Aad Bogga Lacagaha
          </button>
        </div>
      </div>
    );
  }

  // GUARANTEE: Hide Admin Dashboard from non-admin users
  if (currentUser?.role !== 'admin') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-[#0e7a48] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-green-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-green-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
              👋 Boga Isticmaalaha • User Portal
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              Soo Dhawoow, {currentUser?.name || 'Isticmaale'}
            </h2>
            <p className="text-xs text-emerald-100">Ku soo dhawoow nidaamka maamulka dugsiga Tahdiibul Adfaal.</p>
          </div>
          {onOpenChangeProfile && (
            <button
              onClick={onOpenChangeProfile}
              className="px-3.5 py-2.5 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>Beddel User & Pass</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Ardayda Dugsiga</span>
            <span className="text-2xl font-black text-[#0e7a48]">{students.length} Arday</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Fasallada</span>
            <span className="text-2xl font-black text-slate-900">{classes.length} Fasal</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Macallimiinta</span>
            <span className="text-2xl font-black text-amber-600">{teachers.length} Macallin</span>
          </div>
        </div>
      </div>
    );
  }

  // Attendance Status Breakdown for Recharts Donut / Pie Chart Card
  const attendanceStatusBreakdown = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    attendance.forEach((rec) => {
      if (rec.status === 'Present') present++;
      else if (rec.status === 'Absent') absent++;
      else if (rec.status === 'Late') late++;
      else if (rec.status === 'Permission' || rec.status === 'Excused') excused++;
    });

    const total = present + absent + late + excused;

    if (total === 0) {
      return [
        { name: 'Jooga (Present)', value: 85, color: '#0e7a48', percent: 85 },
        { name: 'Maqan (Absent)', value: 8, color: '#e11d48', percent: 8 },
        { name: 'Ragaaday (Late)', value: 4, color: '#f59e0b', percent: 4 },
        { name: 'Idan Leh (Excused)', value: 3, color: '#3b82f6', percent: 3 },
      ];
    }

    return [
      { name: 'Jooga (Present)', value: present, color: '#0e7a48', percent: Math.round((present / total) * 100) },
      { name: 'Maqan (Absent)', value: absent, color: '#e11d48', percent: Math.round((absent / total) * 100) },
      { name: 'Ragaaday (Late)', value: late, color: '#f59e0b', percent: Math.round((late / total) * 100) },
      { name: 'Idan Leh (Excused)', value: excused, color: '#3b82f6', percent: Math.round((excused / total) * 100) },
    ];
  }, [attendance]);

  // Identify Day with Highest Absenteeism Pattern
  const absenteeismPattern = useMemo(() => {
    const dayAbsentMap: Record<string, number> = {
      Axad: 0,
      Isniin: 0,
      Talaado: 0,
      Arbaco: 0,
      Khamiis: 0,
      Sabti: 0,
    };
    const somaliDays = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco', 'Sabti'];

    attendance.forEach((a) => {
      if ((a.status === 'Absent' || a.status === 'Late') && a.date) {
        const d = new Date(a.date);
        const dayName = somaliDays[d.getDay()];
        if (dayAbsentMap[dayName] !== undefined) {
          dayAbsentMap[dayName]++;
        }
      }
    });

    let maxDay = 'Khamiis';
    let maxCount = 0;
    Object.entries(dayAbsentMap).forEach(([day, count]) => {
      if (count >= maxCount) {
        maxCount = count;
        maxDay = day;
      }
    });

    return { worstDay: maxDay, count: maxCount };
  }, [attendance]);

  const pendingRemoteRegCount = React.useMemo(() => {
    try {
      return Storage.getRemoteRegistrations().filter((r) => r.status === 'Pending').length;
    } catch {
      return 0;
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* NEW ONLINE LEARNING REGISTRATION ALERT BANNER */}
      {pendingRemoteRegCount > 0 && (
        <div
          onClick={() => setActiveTab('remote_learning')}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 text-amber-950 flex items-center justify-between flex-wrap gap-3 cursor-pointer hover:shadow-md transition-all animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
                <span>🔔 NEW ONLINE LEARNING REGISTRATION</span>
              </h4>
              <p className="text-xs text-amber-900 mt-0.5 font-bold">
                Pending Requests: <span className="underline font-black text-amber-950">{pendingRemoteRegCount}</span> (Waxaa jira codsiyo cusub oo u baahan ansixin iyo akoon abuuris).
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer">
            Eeg Codsiyada ({pendingRemoteRegCount}) →
          </button>
        </div>
      )}

      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0e7a48] p-6 text-white shadow-md border border-green-700">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#d4af37]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d4af37] text-green-950 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sannad Dugsyeedka {settings.academicYear}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              {settings.welcomeGreeting || `Ku Soo Dhowaw ${settings.schoolName}`}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setIsEditingBanner(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#d4af37] text-green-950 hover:bg-amber-300 transition-colors shadow-sm cursor-pointer ml-1"
                  title="Admin-ku ha ka baddalo qoraalkan"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Baddal (Edit)</span>
                </button>
              )}
            </h2>
            <p className="text-xs text-green-100/90 max-w-xl">
              {settings.welcomeSubtext || "System-ka oo idil waxaad ka maamuli kartaa Ardayda, Xifdinta Qur'aanka, Macallimiinta, Xaadiriska iyo Bixinta Lacagaha si dhakhso ah."}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {currentUser?.role === 'admin' && (
              <>
                <button
                  type="button"
                  disabled={isBackingUp}
                  onClick={handleManualBackup}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                  title="Riix si aad gacanta ugu kaydiso dhammaan xogta Firestore"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-950 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>{isBackingUp ? 'Socotaa...' : '⚡ Kaydi Hadda (Manual Backup)'}</span>
                </button>
                <button
                  onClick={() => setIsEditingBanner(true)}
                  className="px-3.5 py-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-semibold text-xs rounded-lg border border-amber-300/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-[#d4af37]" />
                  <span>Baddal Qoraalka</span>
                </button>
              </>
            )}
            <button
              onClick={onOpenStudentModal}
              className="px-4 py-2 bg-[#d4af37] hover:bg-[#c3a02f] text-green-950 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Arday Cusub</span>
            </button>
            <button
              onClick={onOpenHifzModal}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookMarked className="w-4 h-4 text-[#d4af37]" />
              <span>Duub Xifdi</span>
            </button>
            <button
              onClick={onOpenPaymentModal}
              className="px-4 py-2 bg-white text-[#0e7a48] hover:bg-slate-100 font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-[#0e7a48]" />
              <span>Bixi Lacag</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Badge */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 px-4 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Xaaladda Nidaamka</div>
            <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2 flex-wrap">
              <span>🟢 Nidaamku Wuu Shaqeynayaa</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold bg-emerald-100 text-[#0e7a48] border border-emerald-300">
                Active & Verified
              </span>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Tahdiibul Adfaal • v2.0
        </div>
      </div>

      {/* Main Modules 8-Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0e7a48]" />
            <span>Qaybaha Ugu Muhiimsan (Main Dashboard Modules)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">8 Qaybood</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Ardayda */}
          <button
            onClick={() => setActiveTab('students')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0e7a48] border border-emerald-200">
                {students.length} Arday
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">👨‍🎓 Ardayda</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Diiwaanka & Xogta Ardayda</p>
            </div>
          </button>

          {/* 2. Macallimiinta */}
          <button
            onClick={() => setActiveTab('teachers')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-[#0e7a48]">
                {teachers.length} Macallin
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">👨‍🏫 Macallimiinta</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Macallimiinta & Fasallada</p>
            </div>
          </button>

          {/* 3. Waalidiinta */}
          <button
            onClick={() => setActiveTab('parents')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-[#0e7a48]">
                {parents.length} Waalid
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">👨‍👩‍👧 Waalidiinta</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Waalidiinta & Xiriirka</p>
            </div>
          </button>

          {/* 4. Xaadiriska */}
          <button
            onClick={() => setActiveTab('attendance')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-[#0e7a48]">
                {attendanceRate}% Jooga
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">📋 Xaadiriska</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Xaadiriska Maanta</p>
            </div>
          </button>

          {/* 5. Casharrada */}
          <button
            onClick={() => setActiveTab('hifz')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <BookMarked className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                30 Juz
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">📚 Casharrada</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Hifziga & Manhajka</p>
            </div>
          </button>

          {/* 6. Ogeysiisyada */}
          <button
            onClick={() => setActiveTab('messaging')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                SMS Alert
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">🔔 Ogeysiisyada</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Fariimaha & SMS-ka</p>
            </div>
          </button>

          {/* 7. Lacagaha */}
          <button
            onClick={() => setActiveTab('payments')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {totalUnpaidCount} Unpaid
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">💰 Lacagaha</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Bixinta & Baaqiga</p>
            </div>
          </button>

          {/* 8. Warbixinnada */}
          <button
            onClick={() => setActiveTab('reports')}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#0e7a48] shadow-xs hover:shadow-md transition-all p-4 text-left flex flex-col justify-between space-y-3 group cursor-pointer active:scale-[0.98] min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0e7a48] flex items-center justify-center shrink-0 group-hover:bg-[#0e7a48] group-hover:text-white transition-colors shadow-2xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#d4af37] text-slate-950">
                Reports
              </span>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0e7a48] transition-colors">📊 Warbixinnada</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">Tirakoobka Dugsiga</p>
            </div>
          </button>
        </div>
      </div>

      {/* Admin Cloud Firestore Backup Status & Manual Trigger Widget */}
      {currentUser?.role === 'admin' && (
        <div className={`p-4 rounded-xl border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          backupInfo.isOverdue
            ? 'bg-amber-500/10 border-amber-500/60 text-slate-900'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-start md:items-center gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              backupInfo.isOverdue
                ? 'bg-amber-500/20 text-amber-800 border-amber-400/60'
                : 'bg-emerald-50 text-[#0e7a48] border-emerald-200'
            }`}>
              {backupInfo.isOverdue ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
              ) : (
                <Database className="w-5 h-5 text-[#0e7a48]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-xs tracking-wide uppercase flex items-center gap-1.5">
                  <span>💾 Kaydinta Cloud-ka (Firestore Backup Status)</span>
                </h4>
                {backupInfo.isOverdue ? (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-black text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                    ⚠️ Overdue (&gt; 24h)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    ✅ Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                <span>Kaydkii ugu dambeeyay: </span>
                <strong className="text-slate-900">{backupInfo.formattedLastBackup}</strong>
                {backupInfo.hoursAgo !== null && (
                  <span className="text-slate-500"> ({backupInfo.hoursAgo} saacadood ka hor)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadLocalJsonBackup}
              className="px-3.5 py-2.5 font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="Soo deji backup offline ah ee xogta oo idil (.json)"
            >
              <Download className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Download .JSON Backup</span>
            </button>
            <button
              type="button"
              disabled={isBackingUp}
              onClick={handleManualBackup}
              className={`px-4 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 ${
                backupInfo.isOverdue
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#0e7a48] hover:bg-[#0b633a] text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span>{isBackingUp ? 'Kaydintu way socotaa...' : '⚡ KAYDI HADDA (MANUAL BACKUP)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ ADMIN ONLY — DHISMAHA APP-KA (GOOGLE AI STUDIO) */}
      {currentUser?.role === 'admin' && (
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
      )}

      {/* Admin Quick Command Hub */}
      {currentUser?.role === 'admin' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0e7a48] text-white rounded-2xl p-5 shadow-lg border border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>Qaybta Control-ka & Maamulida Admin-ka (Admin Command Hub)</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Super Admin
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Tallaabooyinka degdegga ah ee maamulaha: Ogeysiisyada, Fariimaha Lacagaha, iyo Control-ka Nidaamka.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Action 1: Post Announcement */}
            <button
              type="button"
              onClick={() => setIsEditingBanner(true)}
              className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between space-y-2 hover:border-amber-400/50"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-400/20 text-amber-300 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 bg-black/20 px-2 py-0.5 rounded-full">
                  Hero Alert
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  📢 Qoraalka Banner-ka
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  Baddal fariinta ku qoran bogga hore
                </p>
              </div>
            </button>

            {/* Action 2: Batch Fee Reminders */}
            <button
              type="button"
              onClick={() => setIsFeeReminderModalOpen(true)}
              className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between space-y-2 hover:border-emerald-400/50"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-emerald-400/20 text-emerald-300 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/50">
                  {students.filter(s => s.feeStatus === 'Pending' || s.feeStatus === 'Overdue').length} Arday
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  💬 Reminder-ka Waalidiinta
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  Soo saar fariinta WhatsApp-ka e lacagaha
                </p>
              </div>
            </button>

            {/* Action 3: Go to Users & Passwords */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between space-y-2 hover:border-blue-400/50"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-400/20 text-blue-300 group-hover:scale-110 transition-transform">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 bg-black/20 px-2 py-0.5 rounded-full">
                  Users
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  👑 User-yada & Passwords
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  U samee ama baddal password-yada
                </p>
              </div>
            </button>

            {/* Action 4: Download JSON Backup */}
            <button
              type="button"
              onClick={handleDownloadLocalJsonBackup}
              className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between space-y-2 hover:border-amber-400/50"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-400/20 text-amber-300 group-hover:scale-110 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  .JSON
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  📥 Download Full Backup
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  Kaydso file-ka xogta dugsiga (.json)
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Admin Somali Voice Alert System Diagnostics */}
      {currentUser?.role === 'admin' && (
        <SomaliVoiceAlertDiagnostics
          currentUser={currentUser}
          onOpenAdminVoiceModal={onOpenAdminVoiceModal}
        />
      )}

      {/* Backup Success Toast Alert */}
      {backupSuccessToast && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs font-bold animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{backupSuccessToast}</span>
          </div>
          <button
            onClick={() => setBackupSuccessToast(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Edit Banner Modal */}
      {isEditingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0e7a48] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-base">Baddal Qoraalka Soo Dhoweynta (Admin Edit)</h3>
              </div>
              <button
                onClick={() => setIsEditingBanner(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 text-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sannad Dugsyeedka (Academic Year)
                </label>
                <input
                  type="text"
                  required
                  value={editAcademicYear}
                  onChange={(e) => setEditAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-sm"
                  placeholder="e.g. 2026 - 2027"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qoraalka Soo Dhoweynta (Welcome Title)
                </label>
                <input
                  type="text"
                  required
                  value={editGreeting}
                  onChange={(e) => setEditGreeting(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-sm"
                  placeholder="e.g. Ku Soo Dhowaw Tahdiibul Adfaal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Faahfaahinta Hoose (Subtitle / Description)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editSubtext}
                  onChange={(e) => setEditSubtext(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-sm"
                  placeholder="e.g. System-ka oo idil waxaad ka maamuli kartaa Ardayda, Xifdinta Qur'aanka..."
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                💡 <strong>Xasuusin Admin:</strong> Markaad kaydiso qoraalkan, dhammaan isticmaalayaasha (Mcalimiinta, Waalidiinta, Ardayda) ayaa si toos ah (Live) ugu arki doona boga hore.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBanner(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Kansal (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Keedi Baddalida (Save Changes)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Featured Summary Cards: Today's Attendance, Total Unpaid Fees & Visual Attendance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Today's Attendance Percentage & Reach Out to Absent Group */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none opacity-60" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Xaadiriska Maanta (Today's Attendance)</span>
              </span>
              <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{todayDateStr}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-800 tracking-tight">
                  {attendanceRate}%
                </div>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  <strong className="text-emerald-700 font-bold">{presentTodayCount} Arday</strong> ayaa xaadir ah ● <strong className="text-rose-600 font-bold">{absentTodayCount} Arday</strong> ayaa maqan
                </p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-lg shadow-xs">
                  {attendanceRate}%
                </div>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-200">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          {/* Quick Action Links for Attendance */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 relative z-10">
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-bold text-slate-700 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Diiwaanka Xaadiriska</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('messaging')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="U dir farriin ama ogeysiis waalidiinta ardayda maqan"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Reach Out: Farriin U Dir Maqanaha ({absentTodayCount})</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total Unpaid Fees & Reach Out to Unpaid Group */}
        <div className="bg-white rounded-2xl border border-rose-200/80 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0 pointer-events-none opacity-60" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Wadarta Baaqiga Deynka (Total Unpaid Fees)</span>
                </span>

                {onToggleHideMoney && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHideMoney();
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                      shouldHideMoney
                        ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                    }`}
                    title={
                      shouldHideMoney
                        ? 'Eye-ka waa xiran yahay - Lacagaha waa qarsan yihiin (Riix si aad u furto)'
                        : 'Eye-ka waa furan yahay - Lacagaha waa la arkaa (Riix si aad u xirto)'
                    }
                  >
                    {shouldHideMoney ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
                        <span className="text-[11px]">Eye Xiran (Qarsan)</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-[11px]">Eye Furan (Muuqata)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {totalUnpaidCount} Arday Deynlayaal
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-rose-800 tracking-tight">
                  {formatMoney(totalPendingFees, shouldHideMoney, settings.currency)}
                </div>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  Lacagaha bishaan weli dhiman ee laga leeyahay <strong className="text-rose-700 font-bold">{totalUnpaidCount} waalid</strong>
                </p>
              </div>
              <div className="text-right">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Unpaid Ratio Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-200">
              <div
                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    activeStudents.length > 0
                      ? Math.min(100, Math.round((totalUnpaidCount / activeStudents.length) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Quick Action Links for Payments & Reminders */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 relative z-10">
            <button
              onClick={() => setActiveTab('payments')}
              className="text-xs font-bold text-slate-700 hover:text-rose-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Maamul Bixinta Lacagaha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPaymentModal}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                + Bixi Lacag
              </button>
              <button
                onClick={() => setActiveTab('messaging')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Farriin xasuusin ah u dir waalidiinta deynta lagu leeyahay"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reach Out: Farriin Deynta ({totalUnpaidCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Visual Attendance Patterns & Status Breakdown using Recharts Donut */}
        <div className="bg-white rounded-2xl border border-blue-200/80 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between space-y-3 col-span-1 md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 pointer-events-none opacity-60" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-950 border border-blue-300">
                <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                <span>Nidaamka Xaadiriska (Attendance Patterns)</span>
              </span>
              <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Recharts Donut
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Native SVG Donut Chart */}
              <div className="w-28 h-28 shrink-0 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#0e7a48"
                    strokeWidth="4"
                    strokeDasharray={`${Math.min(100, Math.max(0, attendanceRate))}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xs font-black text-slate-800 leading-none">{attendanceRate}%</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Jooga</span>
                </div>
              </div>

              {/* Breakdown Legend & Pattern Highlights */}
              <div className="flex-1 text-xs space-y-2 pl-1">
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {attendanceStatusBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-slate-700 font-medium">{item.name.split(' ')[0]}:</span>
                      <strong className="text-slate-900 font-extrabold">{item.percent}%</strong>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>⚠️ Maalinta Ugu Maqnaanshaha Badan:</span>
                    <span className="text-rose-700 font-black">{absenteeismPattern.worstDay}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Garaafku wuxuu muujinayaa nidaamka xaadiriska iyo maqnaanshaha.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-slate-700 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Diiwaanka Xaadiriska</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              📊 Recharts Report
            </button>
          </div>
        </div>
      </div>

      {/* Lacagta Guud Ee Machadka (Total Institute Financial Overview) - Admin & Finance Only */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'finance') && canUserAccessPayments(currentUser, settings) && (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-amber-400/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#d4af37] to-amber-500 text-slate-950 rounded-2xl shadow-md shrink-0">
                <DollarSign className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#d4af37] tracking-tight">
                    🏛️ Lacagta Guud Ee Machadka (Total Institute Revenue)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-900 text-amber-300 border border-emerald-700">
                    Financial Dashboard
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Warbixinta dhameystiran ee dakhliga la soo xareeyay, dakhliga billaha ah ee laga filayo machadka, iyo deynta baaqiga ah.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onToggleHideMoney && (
                <button
                  type="button"
                  onClick={onToggleHideMoney}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs ${
                    shouldHideMoney
                      ? 'bg-rose-950/80 text-rose-200 border-rose-700 hover:bg-rose-900'
                      : 'bg-emerald-800 text-amber-300 border-amber-400/50 hover:bg-emerald-700'
                  }`}
                  title="Sida ay lacagtu ugu muuqaneyso isticmaalayaasha"
                >
                  {shouldHideMoney ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Lacagaha Waa Qarsan Yihiin</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Lacagaha Waa Muuqdaan</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-[#d4af37] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Maamul Bixinta Lacagaha ➔</span>
              </button>
            </div>
          </div>

          {/* 3 Major Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Total Collected Income */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1 hover:bg-white/15 transition-all">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                1. Wadarta Dakhliga Soo Galay (Total Collected)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatMoney(totalMonthlyIncome, shouldHideMoney, settings.currency)}
              </div>
              <p className="text-[11px] text-emerald-200">
                Wadarta guud ee lacagaha laga qabtay dhammaan rasiidhada
              </p>
            </div>

            {/* Metric 2: Expected Monthly Fees */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1 hover:bg-white/15 transition-all">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                2. Qiimaha Billaha Ah (Expected Monthly)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
                {formatMoney(totalExpectedRevenue, shouldHideMoney, settings.currency)}
              </div>
              <p className="text-[11px] text-emerald-200">
                Kharashka billaha ah ee lagu leeyahay {activeStudents.length} arday
              </p>
            </div>

            {/* Metric 3: Total Unpaid / Pending Fees */}
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 backdrop-blur-xs space-y-1 hover:bg-rose-950/60 transition-all">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                3. Baaqiga Deynta Dhiman (Pending Unpaid)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-300 tracking-tight">
                {formatMoney(totalPendingFees, shouldHideMoney, settings.currency)}
              </div>
              <p className="text-[11px] text-rose-200">
                Lacagaha dhiman ee laga leeyahay {totalUnpaidCount} arday
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Metrics Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#0e7a48] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wadarta Ardayda</span>
            <div className="p-2 rounded-lg bg-green-50 text-[#0e7a48] group-hover:bg-[#0e7a48] group-hover:text-white transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0e7a48]">{activeStudents.length}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-[#0e7a48] font-bold">{totalPaidCount} bixiyay</span> ● {totalUnpaidCount} la sugayo
          </p>
        </div>

        {/* Teachers */}
        <div
          onClick={() => setActiveTab('teachers')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#0e7a48] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Macallimiinta</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0e7a48]">{teachers.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Dugsi Subax & Galab</p>
        </div>

        {/* Parents / Waalidiinta */}
        <div
          onClick={() => setActiveTab('parents')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#0e7a48] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waalidiinta</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-[#d4af37] group-hover:text-green-950 transition-colors">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0e7a48]">{parents.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Diiwaanka Waalidiinta</p>
        </div>

        {/* Classes */}
        <div
          onClick={() => setActiveTab('classes')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#0e7a48] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fasallada</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0e7a48]">{classes.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Goleyaasha Hifz-ka</p>
        </div>

        {/* Quran Completion Khatim */}
        <div
          onClick={() => setActiveTab('hifz')}
          className="bg-white p-5 rounded-xl border border-[#d4af37]/40 shadow-sm hover:border-[#d4af37] transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-[#8a7123] uppercase tracking-wider">Xaffiiddada (30 Juz)</span>
            <div className="p-2 rounded-lg bg-[#d4af37]/20 text-[#8a7123] group-hover:bg-[#d4af37] group-hover:text-green-950 transition-colors">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#8a7123]">{khatimStudentsCount} Arday</div>
          <p className="text-[10px] text-[#8a7123] font-semibold mt-1">Dhameeyay Qur'aanka</p>
        </div>

        {/* Monthly Income */}
        <div
          onClick={() => setActiveTab('payments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#0e7a48] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dakhliga Bisha</span>
              {onToggleHideMoney && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHideMoney();
                  }}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title={shouldHideMoney ? 'Eye-ka waa xiran yahay - Lacagtu waa qarsan tahay (Riix si aad u furto)' : 'Eye-ka waa furan yahay - Lacagtu waa muuqataa (Riix si aad u xirto)'}
                >
                  {shouldHideMoney ? <EyeOff className="w-3.5 h-3.5 text-rose-600" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                </button>
              )}
            </div>
            <div className="p-2 rounded-lg bg-green-50 text-[#0e7a48] group-hover:bg-[#0e7a48] group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0e7a48]">
            {formatMoney(totalMonthlyIncome, shouldHideMoney, settings.currency)}
          </div>
          <p className="text-[10px] text-[#0e7a48] mt-1 flex items-center gap-0.5 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>Soo hooyday bishan</span>
          </p>
        </div>

        {/* Unpaid Balance */}
        <div
          onClick={() => setActiveTab('payments')}
          className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm hover:border-rose-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Baaqiga Deyn</span>
              {onToggleHideMoney && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHideMoney();
                  }}
                  className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-800 transition-colors"
                  title={shouldHideMoney ? 'Eye-ka waa xiran yahay - Lacagtu waa qarsan tahay (Riix si aad u furto)' : 'Eye-ka waa furan yahay - Lacagtu waa muuqataa (Riix si aad u xirto)'}
                >
                  {shouldHideMoney ? <EyeOff className="w-3.5 h-3.5 text-rose-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                </button>
              )}
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-900">
            {formatMoney(totalPendingFees, shouldHideMoney, settings.currency)}
          </div>
          <p className="text-[10px] text-rose-600 mt-1 font-semibold">Lacagaha Dhiman</p>
        </div>
      </div>

      {/* 🎓 GRADUATION & CERTIFICATE STATUS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#d4af37] to-amber-500 text-slate-950 rounded-2xl shadow-md shrink-0">
              <GraduationCap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>🎓 Qalin-jabinta Sanadkan ({settings.academicYear || '2026 - 2027'}) &amp; Xaaladda Shahaadooyinka</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {graduatingCandidates.length} Arday Qalin-jabinaya
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tirada ardayda sanadkan u taagan ama dhameeyay Qur'aanka kariimka, horumarkooda Hifz-ka, iyo xaaladda shahaadooyinka la bixiyay ama la habaynayo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>Diiwaanka Ardayda ➔</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hifz')}
              className="px-3.5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-300" />
              <span>Aagga Hifz-ka ➔</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards Grid for Graduation & Certificates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Graduating Candidates */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                👨‍🎓 Qalin-jebiyayaasha {settings.academicYear ? settings.academicYear.split('-')[0].trim() : '2026'}
              </span>
              <div className="p-2 bg-emerald-700 text-white rounded-lg shadow-2xs">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-950">{graduatingCandidates.length}</div>
            <p className="text-[11px] text-emerald-800 font-medium">
              Wadarta ardayda qalin-jabinaysa ama ku jira Juz 25-30
            </p>
          </div>

          {/* Card 2: Certificates Ready / Issued */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                📜 Shahaadadu Waa Diyaar
              </span>
              <div className="p-2 bg-amber-500 text-slate-950 rounded-lg shadow-2xs font-bold">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-950">{certificatesReadyCount}</div>
            <p className="text-[11px] text-amber-900 font-medium">
              Shahaadooyinka loo daabacay/diyaarka u ah ardayda dhameeyay
            </p>
          </div>

          {/* Card 3: Certificates In Processing */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                ⏳ Habayn Ku Jirtaa
              </span>
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-950">{certificatesPendingCount}</div>
            <p className="text-[11px] text-blue-800 font-medium">
              Ardayda ku jira Juz-yadii ugu dambeeyay (25 - 29 Juz)
            </p>
          </div>

          {/* Card 4: Honors Certificates / Mumtaaz */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                ⭐ Shahaadada Sharafka
              </span>
              <div className="p-2 bg-purple-600 text-white rounded-lg shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-950">{honorsCertificatesCount}</div>
            <p className="text-[11px] text-purple-800 font-medium">
              Ardayda ku dhameeyay darajada ugu sarreysa ee Hifz-ka
            </p>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setGraduationFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                graduationFilterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dhammaan Candidates ({graduatingCandidates.length})
            </button>
            <button
              type="button"
              onClick={() => setGraduationFilterTab('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                graduationFilterTab === 'ready'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              📜 Shahaadadu Diyaar ({certificatesReadyCount})
            </button>
            <button
              type="button"
              onClick={() => setGraduationFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                graduationFilterTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              ⏳ Habayn Ku Jirta ({certificatesPendingCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Raadi arday ama fasal..."
              value={graduationSearchTerm}
              onChange={(e) => setGraduationSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0e7a48]"
            />
          </div>
        </div>

        {/* Graduating Students Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="p-3">Ardayga &amp; Masuulka</th>
                <th className="p-3">Fasalka &amp; Shift-ka</th>
                <th className="p-3">Horumarka Hifz-ka</th>
                <th className="p-3">Xaaladda Shahaadada</th>
                <th className="p-3 text-right">Tallaabada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredGraduationCandidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <div className="space-y-2">
                      <GraduationCap className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">Wali ma jiraan arday buuxisay shuruudaha qalin-jabinta sanadkan.</p>
                      <p className="text-xs text-slate-400">Marka ardaydu gaaraan Juz 25-30 ama la qalin-jabiyo waxay si toos ah uga muuqan doonaan halkan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGraduationCandidates.map((candidate) => {
                  const isReady = candidate.currentJuz === 30 || candidate.status === 'Graduated';
                  const progressPct = Math.min(100, Math.round(((candidate.currentJuz || 1) / 30) * 100));

                  return (
                    <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {candidate.gender === 'Female' ? '👧' : '👦'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{candidate.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {candidate.studentId} • Tel: {candidate.parentPhone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">{candidate.className}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Shift: {candidate.shift}</span>
                      </td>

                      <td className="p-3">
                        <div className="space-y-1 w-36 sm:w-44">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-[#0e7a48]">Juz {candidate.currentJuz} / 30</span>
                            <span className="font-bold text-slate-500 text-[10px]">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200">
                            <div
                              className={`h-full transition-all ${isReady ? 'bg-amber-500' : 'bg-[#0e7a48]'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>📜 Shahaadadu Waa Diyaar</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>⏳ Habayn Ku Jirtaa (Juz {candidate.currentJuz})</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCertificateStudent(candidate)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-[#d4af37] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                            title="Eeg oo daabac shahaadada ardayga"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-950" />
                            <span>Daabac Shahaadada</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Hifz Activity & Attendance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hifz Progress Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50 text-[#0e7a48]">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Xifdinta Qur'aanka (Diiwaankii Ugu Dambeeyay)
                  </h3>
                  <p className="text-[11px] text-slate-500">Subaxda, Sabqiga iyo Amshaxda ardayda</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('hifz')}
                className="text-xs text-[#0e7a48] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Eeg Dhammaan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {hifzRecords.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/80 hover:bg-green-50/40 hover:border-green-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{rec.studentName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#8a7123] border border-[#d4af37]/40">
                        {rec.subaxSurah} ({rec.subaxAyahFrom}-{rec.subaxAyahTo})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>
                        Sabqi: <strong>Juz {rec.sabqiJuz}</strong>
                      </span>
                      <span>
                        Manzil: <strong>Juz {rec.manzilJuz}</strong>
                      </span>
                      {rec.teacherNote && <span className="text-[#0e7a48] italic">"{rec.teacherNote}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.grade === 'Mumtaaz'
                          ? 'bg-green-100 text-[#0e7a48]'
                          : rec.grade === 'Jayid Jiddan'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      ★ {rec.grade}
                    </span>
                    <span className="text-[10px] text-slate-400">{rec.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Overview Chart Bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50 text-[#0e7a48]">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Xaadiriska Maanta (Attendance)</h3>
                  <p className="text-[11px] text-slate-500">Tirada ardayda fasallada soo xaadiray maanta</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0e7a48] bg-green-100 px-2.5 py-1 rounded-full">
                {attendanceRate}% Jooga
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-[#0e7a48] h-full transition-all"
                style={{ width: `${attendanceRate}%` }}
                title="Jooga"
              />
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${100 - attendanceRate}%` }}
                title="Ma Joogo/Idan"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0e7a48]" /> Jooga: {presentTodayCount} Arday
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Ma joogo / Idan leh: {attendance.length - presentTodayCount}
              </span>
            </div>
          </div>

          {/* Recharts Data Visualization: Weekly Attendance & Absence Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-[#0e7a48]">
                  <CheckSquare className="w-4 h-4 text-[#0e7a48]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                    <span>Xaadiriska & Maqnaanshaha Toddobaadkii (Weekly Attendance Bar Chart)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
                      📊 Bar Chart
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Garaafka tirada ardayda xaadiray (Jooga) iyo kuwa maqnaa (Maqan) 7-dii maalmood ee ugu dambeeyay
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0e7a48] inline-block"></span>
                  <span>Xaadiray (Jooga)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block"></span>
                  <span>Maqan (Absent)</span>
                </span>
              </div>
            </div>

            {/* Native Weekly Bar Chart */}
            <div className="w-full h-64 pt-4 flex flex-col justify-between">
              <div className="flex items-end justify-between gap-2 h-48 px-2 border-b border-slate-200 pb-1">
                {weeklyAttendanceData.map((d, idx) => {
                  const maxVal = Math.max(...weeklyAttendanceData.map((w) => Math.max(w['Ardayda Xaadiray (Jooga)'], w['Ardayda Maqan (Absent)'])), 1);
                  const joogaPct = Math.round((d['Ardayda Xaadiray (Jooga)'] / maxVal) * 100);
                  const maqanPct = Math.round((d['Ardayda Maqan (Absent)'] / maxVal) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl z-20 pointer-events-none whitespace-nowrap">
                        <p className="font-bold text-amber-300">{d.maalinta}</p>
                        <p className="text-emerald-400">Jooga: {d['Ardayda Xaadiray (Jooga)']}</p>
                        <p className="text-rose-400">Maqan: {d['Ardayda Maqan (Absent)']}</p>
                      </div>
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${Math.max(joogaPct, 4)}%` }}
                          className="w-1/2 max-w-[20px] bg-[#0e7a48] hover:bg-emerald-700 transition-all rounded-t-md flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {d['Ardayda Xaadiray (Jooga)'] > 0 ? d['Ardayda Xaadiray (Jooga)'] : ''}
                        </div>
                        <div
                          style={{ height: `${Math.max(maqanPct, 4)}%` }}
                          className="w-1/2 max-w-[20px] bg-rose-600 hover:bg-rose-700 transition-all rounded-t-md flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {d['Ardayda Maqan (Absent)'] > 0 ? d['Ardayda Maqan (Absent)'] : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 truncate mt-1">
                        {d.maalinta}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recharts Data Visualization: Monthly Student Attendance Trend Line */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50 text-[#0e7a48]">
                  <TrendingUp className="w-4 h-4 text-[#0e7a48]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Shaxda Socodka Xaadiriska ee Bilaha (Monthly Attendance Trend)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Istaatistikada iyo isbeddelka xaadiriska ardayda ee 6-dii bilood ee ugu dambeeyay
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0e7a48]/10 text-[#0e7a48] border border-[#0e7a48]/20">
                  📈 Celceliska: 94%
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#d4af37]/20 text-[#8a7123] border border-[#d4af37]/40">
                  ⭐ Ugu Sareeya: 96%
                </span>
              </div>
            </div>

            {/* Native Monthly Trend Area Chart */}
            <div className="w-full h-64 pt-4 flex flex-col justify-between">
              <div className="flex items-end justify-between gap-2 h-48 px-2 border-b border-slate-200 pb-1">
                {monthlyTrendData.map((d, idx) => {
                  const val = d['Boqolkiiba Xaadiriska'];
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg shadow-lg z-20 pointer-events-none whitespace-nowrap">
                        <span className="font-bold">{d.bisha}: </span>
                        <span className="text-emerald-400">{val}%</span>
                      </div>
                      <div className="w-full flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-black text-[#0e7a48] mb-1">{val}%</span>
                        <div
                          style={{ height: `${Math.max(val, 10)}%` }}
                          className="w-full max-w-[32px] bg-gradient-to-t from-[#0e7a48]/20 to-[#0e7a48] hover:to-emerald-600 transition-all rounded-t-lg shadow-2xs"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 truncate mt-1">
                        {d.bisha}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recharts Data Visualization: Financial & Monthly Revenue Line Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-[#0e7a48]">
                  <CreditCard className="w-4 h-4 text-[#0e7a48]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Shaxda Dakhliga & Bixinta Lacagaha Bilaha (Revenue & Payment Line Chart)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Isbeddelka dakhliga soo xarooday ($) iyo horumarka bixinta ee 6-dii bilood ee ugu dambeeyay
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onToggleHideMoney && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHideMoney();
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      shouldHideMoney
                        ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title={
                      shouldHideMoney
                        ? 'Eye-ka waa xiran yahay - Lacaguhu waa qarsan yihiin (Riix si aad u furto)'
                        : 'Eye-ka waa furan yahay - Lacaguhu waa muuqdaan (Riix si aad u xirto)'
                    }
                  >
                    {shouldHideMoney ? <EyeOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                    <span className="text-[11px]">{shouldHideMoney ? 'Eye Xiran (Qarsan)' : 'Eye Furan (Muuqata)'}</span>
                  </button>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0e7a48]/10 text-[#0e7a48] border border-[#0e7a48]/20">
                  💰 Dakhliga Bishan: {formatMoney(totalMonthlyIncome, shouldHideMoney, settings.currency)}
                </span>
              </div>
            </div>

            {/* Qoraalka Tilmaamaha Xariiqaha Shaxda (Chart Legend Key Explanations) */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-extrabold text-slate-700 text-[11px] flex items-center gap-1.5 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-[#0e7a48]" />
                <span>Qoraalka Tilmaamaha Shaxda (Chart Legend):</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-[#0e7a48] font-bold text-[11px] shadow-2xs">
                  <span className="w-3 h-1 bg-[#0e7a48] rounded-full inline-block"></span>
                  <span>🟢 Xariiqda Cagaaran: Dakhliga Soo Xarooday ($)</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 font-bold text-[11px] shadow-2xs">
                  <span className="w-3.5 h-0 border-b-2 border-dashed border-[#d4af37] inline-block"></span>
                  <span>🟡 Xariiqda Dahabiga: Bixinta Lacagaha (%)</span>
                </div>
              </div>
            </div>

            {/* Native Monthly Revenue Bar & Trend Chart */}
            <div className="w-full h-64 pt-4 flex flex-col justify-between">
              <div className="flex items-end justify-between gap-3 h-48 px-2 border-b border-slate-200 pb-1">
                {monthlyFinancialData.map((d, idx) => {
                  const maxIncome = Math.max(...monthlyFinancialData.map((m) => m['Dakhliga Soo Xarooday']), 1);
                  const incomePct = Math.round((d['Dakhliga Soo Xarooday'] / maxIncome) * 100);
                  const payRate = d['Boqolkiiba Bixinta'];
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl z-20 pointer-events-none whitespace-nowrap">
                        <p className="font-bold text-amber-300">{d.bisha}</p>
                        <p className="text-emerald-400">Dakhliga: {formatMoney(d['Dakhliga Soo Xarooday'], shouldHideMoney, settings.currency)}</p>
                        <p className="text-amber-300">Bixinta: {payRate}%</p>
                      </div>
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${Math.max(incomePct, 8)}%` }}
                          className="w-1/2 max-w-[24px] bg-[#0e7a48] hover:bg-emerald-700 transition-all rounded-t-lg shadow-2xs flex items-center justify-center text-[8px] font-black text-white"
                        >
                          {d['Dakhliga Soo Xarooday'] > 0 ? (shouldHideMoney ? '***' : `$${d['Dakhliga Soo Xarooday']}`) : ''}
                        </div>
                        <div
                          style={{ height: `${Math.max(payRate, 8)}%` }}
                          className="w-1/2 max-w-[24px] bg-[#d4af37] hover:bg-amber-600 transition-all rounded-t-lg shadow-2xs flex items-center justify-center text-[8px] font-black text-slate-950"
                        >
                          {payRate}%
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 truncate mt-1">
                        {d.bisha}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Unpaid Students Alerts & Class Status */}
        <div className="space-y-6">
          {/* Unpaid Student Fee Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Baqiga Lacagaha La Sugayo</span>
              </h3>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs text-rose-700 hover:underline font-semibold cursor-pointer"
              >
                Maamul Lacagaha
              </button>
            </div>

            <div className="space-y-2.5">
              {students
                .filter((s) => s.feeStatus !== 'Paid')
                .slice(0, 5)
                .map((std) => (
                  <div
                    key={std.id}
                    className="p-3 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{std.fullName}</div>
                      <div className="text-[10px] text-slate-500">
                        Waalidka: {std.parentPhone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-800">
                        {settings.currency}{std.feeMonthly}
                      </div>
                      <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-200 text-rose-900">
                        {std.feeStatus === 'Overdue' ? 'Dharfeeyay' : 'La Sugayo'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-[#0e7a48] text-white p-5 rounded-xl shadow-sm border border-green-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#d4af37]">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Maahmaah & Dhiirrigelin</span>
            </div>
            <p className="text-xs leading-relaxed text-green-100 italic">
              "Khaayruku man ta'allamal Qur'aana wa 'allamahuu" - Muxuu yahay ruuxa ugu khayrka badan
              idinka oo baraha Qur'aanka oo bara dadka kale.
            </p>
            <div className="text-[11px] font-bold text-[#d4af37] text-right pt-1 border-t border-green-700/60">
              Machadka Tahdiibul Adfaal
            </div>
          </div>
        </div>
      </div>

      {/* Admin Batch Fee Reminder Modal */}
      {isFeeReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-[#0e7a48]">
                  <MessageSquare className="w-5 h-5 text-[#0e7a48]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    💬 Ogeysiinta Waalidiinta Dhimanta (Batch Fee Reminders)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sahaalka fariimaha loo dirayo waalidiinta leh lacagaha la sugayo ama dharfeeyay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeeReminderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Debtors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>Tirada Ardayda Dhiman: <strong className="text-rose-600">{students.filter(s => s.feeStatus !== 'Paid').length} Arday</strong></span>
                <span>Wartanka Dhiman: <strong className="text-rose-700">${students.filter(s => s.feeStatus !== 'Paid').reduce((acc, curr) => acc + (curr.feeMonthly || 0), 0)}</strong></span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {students.filter(s => s.feeStatus !== 'Paid').length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    🎉 Wax arday ah oo dhiman lacag ama dharfeeyay ma jiraan maanta! Dhammaan way bixiyeen.
                  </div>
                ) : (
                  students.filter(s => s.feeStatus !== 'Paid').map((std) => {
                    const parentPhoneFormatted = std.parentPhone ? std.parentPhone.replace(/[^0-9]/g, '') : '';
                    const messageText = `Asc Waalidka *${std.parentName || 'Sharafleh'}*,\n\nWaxaan ku xasuusinaynaa bixinta adaada fee-ga bishaan ee ardayga *${std.fullName}* oo ah *$${std.feeMonthly}* dugsiga *${settings.schoolName}*.\n\nFadlan nagu caawi bixinta lacagta. Mahadsanid!`;
                    const waUrl = parentPhoneFormatted ? `https://wa.me/${parentPhoneFormatted}?text=${encodeURIComponent(messageText)}` : '#';

                    return (
                      <div key={std.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{std.fullName} ({std.studentId})</div>
                          <div className="text-[11px] text-slate-500">
                            Waalidka: {std.parentName || 'Waalid'} • Tel: {std.parentPhone || 'Lama helin'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-rose-700 text-xs">${std.feeMonthly}</span>
                          {parentPhoneFormatted ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-all"
                            >
                              <Send className="w-3 h-3 text-amber-300" />
                              <span>Dir WhatsApp</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-rose-500 italic">No Tel</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsFeeReminderModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Kaa xir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📜 PRINT CERTIFICATE MODAL DIRECTLY FROM DASHBOARD */}
      {selectedCertificateStudent && (
        <PrintQuranCertificateModal
          student={selectedCertificateStudent}
          settings={settings}
          onClose={() => setSelectedCertificateStudent(null)}
        />
      )}
    </div>
  );
});
