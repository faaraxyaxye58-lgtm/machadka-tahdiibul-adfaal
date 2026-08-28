import React, { useState, useMemo } from 'react';
import {
  Student,
  Teacher,
  HifzRecord,
  PaymentTransaction,
  AttendanceRecord,
  SchoolSettings,
  User,
} from '../types';
import {
  BarChart3,
  Download,
  Printer,
  BookMarked,
  DollarSign,
  Users,
  CheckCircle,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowRight,
  Search,
  Calendar,
  UserX,
  AlertTriangle,
  Send,
  Smartphone,
  Filter,
  CheckCircle2,
  Clock,
  TrendingDown,
  Mail,
  FileDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { PrintParentTeacherMeetingModal } from '../components/PrintParentTeacherMeetingModal';

interface ReportsViewProps {
  currentUser?: User | null;
  students: Student[];
  teachers: Teacher[];
  hifzRecords: HifzRecord[];
  payments: PaymentTransaction[];
  attendance: AttendanceRecord[];
  settings: SchoolSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  students,
  teachers,
  hifzRecords,
  payments,
  attendance,
  settings,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [teacherNotes, setTeacherNotes] = useState<string>('Ardaygu wuxuu muujiyay dadaal sare xifdiska Qur\'aanka. Waxaan waalidka ka codsanaynaa in ay guriga kaga cawiyaan marooraanka (sabqiga) si xifdiskiisu u noqdo mid sugan.');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPTModalOpen, setIsPTModalOpen] = useState<boolean>(false);

  // Attendance Summary Section State
  const [attendancePeriod, setAttendancePeriod] = useState<'last30' | 'currentMonth' | 'all'>('last30');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState<string>('all');
  const [absenceSearch, setAbsenceSearch] = useState<string>('');
  const [minAbsenceFilter, setMinAbsenceFilter] = useState<number>(0);
  const [selectedAbsentStudentModal, setSelectedAbsentStudentModal] = useState<Student | null>(null);
  const [smsNoticeToast, setSmsNoticeToast] = useState<string | null>(null);

  // Available unique classes list
  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className).filter(Boolean)));
  }, [students]);

  // Date range calculation for attendance filtering
  const filteredAttendanceRecords = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return attendance.filter((rec) => {
      if (!rec.date) return true;
      const recDate = new Date(rec.date);

      if (attendancePeriod === 'last30') {
        if (!isNaN(recDate.getTime())) {
          return recDate >= thirtyDaysAgo && recDate <= now;
        }
        return true;
      } else if (attendancePeriod === 'currentMonth') {
        return rec.date.startsWith(currentMonthPrefix);
      }
      return true;
    });
  }, [attendance, attendancePeriod]);

  // Student Absence Summary Data
  const studentAbsenceSummaries = useMemo(() => {
    return students.map((std) => {
      const studentRecords = filteredAttendanceRecords.filter(
        (r) => r.studentId === std.id || (r.studentName && r.studentName.toLowerCase() === std.fullName.toLowerCase())
      );

      const totalDays = studentRecords.length;
      const presentDays = studentRecords.filter((r) => r.status === 'Present').length;
      const absentDays = studentRecords.filter((r) => r.status === 'Absent').length;
      const lateDays = studentRecords.filter((r) => r.status === 'Late').length;
      const excusedDays = studentRecords.filter((r) => r.status === 'Excused').length;
      const absentRecords = studentRecords.filter((r) => r.status === 'Absent');

      const absenceRate = totalDays > 0 ? Math.round((absentDays / totalDays) * 100) : 0;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : (totalDays === 0 ? 100 : 0);

      return {
        student: std,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        absentRecords,
        absenceRate,
        attendanceRate,
      };
    });
  }, [students, filteredAttendanceRecords]);

  // Filtered summaries for the interactive table
  const filteredAbsenceSummaries = useMemo(() => {
    return studentAbsenceSummaries
      .filter((item) => {
        const std = item.student;
        const matchesSearch =
          std.fullName.toLowerCase().includes(absenceSearch.toLowerCase()) ||
          std.studentId.toLowerCase().includes(absenceSearch.toLowerCase()) ||
          (std.parentPhone && std.parentPhone.toLowerCase().includes(absenceSearch.toLowerCase()));

        const matchesClass =
          attendanceClassFilter === 'all' ||
          std.classId === attendanceClassFilter ||
          std.className === attendanceClassFilter;

        const matchesMinAbsence = item.absentDays >= minAbsenceFilter;

        return matchesSearch && matchesClass && matchesMinAbsence;
      })
      .sort((a, b) => b.absentDays - a.absentDays); // Highest absences first
  }, [studentAbsenceSummaries, absenceSearch, attendanceClassFilter, minAbsenceFilter]);

  // Aggregated KPIs for Attendance Summary
  const totalPeriodAbsences = useMemo(() => {
    return studentAbsenceSummaries.reduce((sum, item) => sum + item.absentDays, 0);
  }, [studentAbsenceSummaries]);

  const highAbsenceStudentsCount = useMemo(() => {
    return studentAbsenceSummaries.filter((item) => item.absentDays >= 3).length;
  }, [studentAbsenceSummaries]);

  const perfectAttendanceCount = useMemo(() => {
    return studentAbsenceSummaries.filter((item) => item.absentDays === 0).length;
  }, [studentAbsenceSummaries]);

  const avgAbsencePerStudent = useMemo(() => {
    if (students.length === 0) return '0';
    return (totalPeriodAbsences / students.length).toFixed(1);
  }, [totalPeriodAbsences, students]);

  // CSV Export for Attendance Summary
  const handleExportAttendanceCSV = () => {
    const headers = [
      'Student ID',
      'Full Name',
      'Class',
      'Parent Name',
      'Parent Phone',
      'Total Days Recorded',
      'Present Days',
      'Absent Days',
      'Late Days',
      'Excused Days',
      'Absence Rate %',
      'Status'
    ];

    const rows = filteredAbsenceSummaries.map((item) => [
      item.student.studentId,
      `"${item.student.fullName}"`,
      `"${item.student.className}"`,
      `"${item.student.parentName}"`,
      `"${item.student.parentPhone}"`,
      item.totalDays,
      item.presentDays,
      item.absentDays,
      item.lateDays,
      item.excusedDays,
      `${item.absenceRate}%`,
      item.absentDays >= 3 ? 'Aad u Maqnaa (Warning)' : item.absentDays > 0 ? 'Dhexdhexaad' : '100% Xaadir Ka Ahaa'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Warbixinta_Maqnaanshaha_Ardayda_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'finance') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center max-w-md mx-auto my-12 space-y-3 shadow-md">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="font-extrabold text-slate-900 text-lg">Aagga Warbixinnada Dugsiga</h3>
        <p className="text-xs text-slate-600">
          Ogaysiis: Warbixinada dhaqaalaha iyo xogaha guud waxaa geli kara oo kaliya Maamulaha (Admin) ama Maaliyadaha.
        </p>
      </div>
    );
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const totalRevenue = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalUnpaid = students
    .filter((s) => s.feeStatus !== 'Paid')
    .reduce((acc, s) => acc + s.feeMonthly, 0);

  const khatimCount = students.filter((s) => s.currentJuz === 30).length;
  const juz15To29Count = students.filter((s) => s.currentJuz >= 15 && s.currentJuz < 30).length;
  const juz1To14Count = students.filter((s) => s.currentJuz < 15).length;

  const filteredStudentsForSelect = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportJSON = () => {
    const fullData = {
      settings,
      students,
      teachers,
      hifzRecords,
      payments,
      attendance,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tahdiibul_Adfaal_MIS_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Student specific statistics calculation for Parent-Teacher preview
  const studentAtt = attendance.filter((a) => a.studentId === selectedStudent?.id || a.studentName === selectedStudent?.fullName);
  const totalAttDays = studentAtt.length;
  const presentDays = studentAtt.filter((a) => a.status === 'Present').length;
  const attPercent = totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 95;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <span>Warbixinnada & Analytics Machadka</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tuleellada waxbarashada, xifdinta, dhaqaalaha iyo xogta oo la soo kalasooci karo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Soo Download-garay Data (JSON)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Daabac Warbixinta</span>
          </button>
        </div>
      </div>

      {/* Featured Card: Parent-Teacher Meeting PDF Generator */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border-2 border-amber-400/80 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl font-black shadow-md">
              <Users className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase tracking-wider">
                  PDF Generator
                </span>
                <span className="text-xs text-emerald-400 font-bold">Shirka Waalidiinta & Macallimiinta</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Warbixinta Shirka Waalidka (Parent-Teacher Meeting PDF Report)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPTModalOpen(true)}
            disabled={!selectedStudent}
            className="px-5 py-3 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black text-xs sm:text-sm rounded-xl shadow-lg border-2 border-amber-300/80 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Daabac / Dejiso PDF Warbixinta Waalidka</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Student Selector & Search */}
          <div className="md:col-span-5 space-y-3">
            <label className="block text-xs font-extrabold text-amber-300 uppercase tracking-wider">
              1. Dooro Ardayga Shirkiisa:
            </label>

            {/* Filter Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Raadi Arday, ID ama Fasal..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Student Select List */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {filteredStudentsForSelect.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white font-medium">
                  {s.fullName} ({s.studentId}) - {s.className} [Juz {s.currentJuz}]
                </option>
              ))}
            </select>

            {/* Quick Metrics Badges for Selected Student */}
            {selectedStudent && (
              <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Xifdiga</span>
                  <strong className="text-amber-300 text-xs font-black block">Juz {selectedStudent.currentJuz}</strong>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Xaadiriska</span>
                  <strong className="text-emerald-400 text-xs font-black block">{attPercent}%</strong>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Adaada Fee</span>
                  <strong className={selectedStudent.feeStatus === 'Paid' ? 'text-emerald-400 text-[10px] font-black' : 'text-rose-400 text-[10px] font-black'}>
                    {selectedStudent.feeStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Teacher Notes & Recommendations */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                2. Talooyinka Macallinka & Maamulka (Teacher Notes):
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Lagu daabacay PDF-ka</span>
            </div>

            <textarea
              rows={3}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Qor talooyinka macallinku siinayo waalidka guryaha..."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 font-medium resize-none"
            />

            {/* Quick Template Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 self-center">Standard Template-yo:</span>
              <button
                type="button"
                onClick={() => setTeacherNotes('Ardaygu wuxuu muujiyay dadaal sare xifdiska Qur\'aanka. Waxaan waalidka ka codsanaynaa in ay guriga kaga cawiyaan marooraanka (sabqiga) si xifdiskiisu u noqdo mid sugan.')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-extrabold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                ✨ Xifdi Wanaagsan
              </button>
              <button
                type="button"
                onClick={() => setTeacherNotes('Ardaygu wuxuu u baahan yahay in guriga lagu kormeero xaadiriska iyo dib-u-raaca duruusta si uu u gaaro heerka fasalka.')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-extrabold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                📚 Kormeer Guriga
              </button>
              <button
                type="button"
                onClick={() => setTeacherNotes('Natiijadu waa Mumtaaz (A+). Wuxuu kaga jiraa safka hore fasalkiisa dhanka akhlaaqda iyo xifdiska.')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-extrabold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                🏆 Mumtaaz A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hifz Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-amber-600" />
              <span>Warbixinta Xifdiga</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              30 Juz Progress
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 font-bold text-emerald-950">
              <span>Ardayda Khatimay (30 Juz):</span>
              <span className="text-amber-600 text-sm">{khatimCount} Arday</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 font-medium text-slate-800">
              <span>Ardayda Dhameeyay (15-29 Juz):</span>
              <span>{juz15To29Count} Arday</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 font-medium text-slate-800">
              <span>Ardayda Bilaabay (1-14 Juz):</span>
              <span>{juz1To14Count} Arday</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Warbixinta Maaliyadda</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              Dakhliga Bisha
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 font-bold text-emerald-950">
              <span>Wadarta Soo Hooyatay:</span>
              <span className="text-emerald-800 text-sm">{settings.currency}{totalRevenue}.00</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-rose-50 font-bold text-rose-950">
              <span>Deyn La Sugayo (Unpaid):</span>
              <span className="text-rose-700 text-sm">{settings.currency}{totalUnpaid}.00</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 font-medium text-slate-800">
              <span>Adayda Bixisay:</span>
              <span>
                {students.filter((s) => s.feeStatus === 'Paid').length} / {students.length} Arday
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>Warbixinta Xaadiriska</span>
            </h3>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
              Maanta
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 font-bold text-blue-950">
              <span>Celceliska Xaadiriska:</span>
              <span className="text-blue-800 text-sm">95%</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 font-medium text-slate-800">
              <span>Wadarta Macallimiinta:</span>
              <span>{teachers.length} Macallin</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 font-medium text-slate-800">
              <span>Goleyaalka Fasallada:</span>
              <span>4 Fasal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 ATTENDANCE SUMMARY SECTION (WARBIXINTA MAQNAANSHAHA ARDAYDA) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shrink-0">
              <UserX className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  📋 Warbixinta Maqnaanshaha Bishii Lasoo Dhaafay (Attendance Summary)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                  {filteredAbsenceSummaries.length} Arday
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Warbixin kooban oo Maamulaha (Admin) u soo saarta inta jeer ee uu arday kasta ka maqnaaday dugsiga bishii lasoo dhaafay ama muddo kasta oo la doorto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportAttendanceCSV}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Daabac</span>
            </button>
          </div>
        </div>

        {/* Toast alert notice */}
        {smsNoticeToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{smsNoticeToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSmsNoticeToast(null)}
              className="text-emerald-800 hover:text-emerald-950 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 KPI Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Period Absences */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Wadarta Maqnaanshaha
              </span>
              <div className="p-2 bg-rose-600 text-white rounded-lg shadow-2xs">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-950">{totalPeriodAbsences} <span className="text-xs font-bold text-rose-700">Maalmood</span></div>
            <p className="text-[11px] text-rose-800 font-medium">
              Wadarta maqnaanshaha la diiwaangeliyay bishan/muddada
            </p>
          </div>

          {/* Card 2: High Absence Risk Students (3+ days) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                ⚠️ Halis Maqnaansho (≥ 3)
              </span>
              <div className="p-2 bg-amber-500 text-slate-950 rounded-lg shadow-2xs font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-950">{highAbsenceStudentsCount} <span className="text-xs font-bold text-amber-800">Arday</span></div>
            <p className="text-[11px] text-amber-900 font-medium">
              Ardayda ka maqnaatay dugsiga 3 maalmood ama ka badan
            </p>
          </div>

          {/* Card 3: Perfect Attendance (0 absences) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                ⭐ 100% Xaadir Ka Ahaa
              </span>
              <div className="p-2 bg-emerald-700 text-white rounded-lg shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-950">{perfectAttendanceCount} <span className="text-xs font-bold text-emerald-800">Arday</span></div>
            <p className="text-[11px] text-emerald-800 font-medium">
              Ardayda aan hal maalinna ka maqnaan dugsiga
            </p>
          </div>

          {/* Card 4: Average Absence Per Student */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Celceliska Ardaygii
              </span>
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-950">{avgAbsencePerStudent} <span className="text-xs font-bold text-blue-800">Maalmood</span></div>
            <p className="text-[11px] text-blue-800 font-medium">
              Celceliska maalmaha uu arday kasta ka maqnaaday dugsiga
            </p>
          </div>
        </div>

        {/* Interactive Filter Toolbar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Period Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Muddada Warbixinta:</span>
              </label>
              <select
                value={attendancePeriod}
                onChange={(e) => setAttendancePeriod(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#0e7a48]"
              >
                <option value="last30">🗓️ Bishii Lasoo Dhaafay (30 Maalmood)</option>
                <option value="currentMonth">📅 Bishan Dooxa Ah</option>
                <option value="all">♾️ Dhammaan Diiwaannada</option>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Kala Siftayn Fasal:</span>
              </label>
              <select
                value={attendanceClassFilter}
                onChange={(e) => setAttendanceClassFilter(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#0e7a48]"
              >
                <option value="all">🏫 Dhammaan Fasallada</option>
                {availableClasses.map((clsName) => (
                  <option key={clsName} value={clsName}>
                    {clsName}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Absence Threshold Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Heerka Maqnaanshaha:</span>
              </label>
              <select
                value={minAbsenceFilter}
                onChange={(e) => setMinAbsenceFilter(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#0e7a48]"
              >
                <option value={0}>👥 Dhammaan Ardayda (0+ Maqnaansho)</option>
                <option value={1}>🟡 Ka Maqnaa 1+ Maalin</option>
                <option value={3}>🔴 Halis: Ka Maqnaa 3+ Maalmood</option>
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Raadi Arday/Tel:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Magac, ID ama Telefoon..."
                  value={absenceSearch}
                  onChange={(e) => setAbsenceSearch(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Student Absence Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="p-3">Ardayga &amp; ID-ga</th>
                <th className="p-3">Fasalka</th>
                <th className="p-3 text-center">Tirada Maalmood</th>
                <th className="p-3 text-center">Joogay</th>
                <th className="p-3 text-center">Maqnaa (Absent)</th>
                <th className="p-3 text-center">Daahay/Fasax</th>
                <th className="p-3">Boqolkiiba Maqnaanshaha</th>
                <th className="p-3">Taariikhaha Maqnaanshaha</th>
                <th className="p-3 text-right">Ogeysiin Waalid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAbsenceSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                      <p className="font-bold text-slate-700">Wax maqnaansho ah ma jiraan ama ma jiraan arday buuxisa shuruudahan.</p>
                      <p className="text-xs text-slate-400">Dhammaan ardaydu waxay leeyihiin xaadiris wanaagsan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAbsenceSummaries.map((item) => {
                  const std = item.student;
                  const isHighRisk = item.absentDays >= 3;
                  const isModerateRisk = item.absentDays > 0 && item.absentDays < 3;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                            isHighRisk ? 'bg-rose-600' : isModerateRisk ? 'bg-amber-500' : 'bg-emerald-700'
                          }`}>
                            {std.gender === 'Female' ? '👧' : '👦'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{std.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {std.studentId} • Tel: {std.parentPhone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">{std.className}</span>
                        <span className="text-[10px] text-slate-500">Shift: {std.shift}</span>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-700">
                        {item.totalDays > 0 ? item.totalDays : '-'}
                      </td>

                      <td className="p-3 text-center font-extrabold text-emerald-700 bg-emerald-50/50">
                        {item.presentDays}
                      </td>

                      <td className="p-3 text-center">
                        {isHighRisk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{item.absentDays} Maalmood</span>
                          </span>
                        ) : isModerateRisk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span>{item.absentDays} Maalin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span>0 (Mumtaaz)</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center text-slate-600 font-medium">
                        {item.lateDays + item.excusedDays > 0 ? `${item.lateDays}L / ${item.excusedDays}F` : '0'}
                      </td>

                      <td className="p-3">
                        <div className="space-y-1 w-28 sm:w-36">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-600">Maqnaansho</span>
                            <span className={`font-extrabold ${isHighRisk ? 'text-rose-600' : 'text-slate-700'}`}>
                              {item.absenceRate}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200">
                            <div
                              className={`h-full transition-all ${isHighRisk ? 'bg-rose-600' : isModerateRisk ? 'bg-amber-500' : 'bg-emerald-600'}`}
                              style={{ width: `${item.absenceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {item.absentRecords.length === 0 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                            Bilaa Maqnaansho
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.absentRecords.slice(0, 3).map((r, idx) => (
                              <span key={idx} className="text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded">
                                {r.date}
                              </span>
                            ))}
                            {item.absentRecords.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                +{item.absentRecords.length - 3} kale
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAbsentStudentModal(std)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                            title="Eeg taariikhaha maqnaanshaha si buuxda"
                          >
                            Faahfaahin
                          </button>

                          {std.parentPhone && item.absentDays > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = std.parentPhone.replace(/[^0-9]/g, '');
                                const msg = `Asc Waalid ${std.parentName}, waxaan ku ogeysiinaynaa in ardayga ${std.fullName} uu bishii lasoo dhaafay ka maqnaaday dugsiga ${item.absentDays} maalmood. Fadlan kala soo xiriir dugsiga ${settings.schoolName}. Mahadsanid.`;
                                const waUrl = `https://wa.me/${cleanPhone.startsWith('252') ? cleanPhone : '252' + cleanPhone}?text=${encodeURIComponent(msg)}`;
                                window.open(waUrl, '_blank');
                                setSmsNoticeToast(`Fariin ogeysiin maqnaansho ah ayaa loo kiciyay waalidka: ${std.parentName} (${std.parentPhone})`);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                              title="Toos fariin ugu dir Waalidka WhatsApp/SMS"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                              <span>Ogeysii</span>
                            </button>
                          )}
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

      {/* 🔍 DETAILED ABSENCE MODAL FOR SELECTED STUDENT */}
      {selectedAbsentStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-800 rounded-2xl font-black">
                  <UserX className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Taariikhda Maqnaanshaha: {selectedAbsentStudentModal.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedAbsentStudentModal.studentId} • Fasal: {selectedAbsentStudentModal.className}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAbsentStudentModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parent info card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Masuulka/Waalidka:</span>
                <strong className="text-slate-900 font-bold">{selectedAbsentStudentModal.parentName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase">Telefoonka:</span>
                <strong className="text-emerald-800 font-bold font-mono">{selectedAbsentStudentModal.parentPhone}</strong>
              </div>
            </div>

            {/* Attendance history for this student */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Diiwaankii Maqnaanshaha Bishii Lasoo Dhaafay:</span>
              </h4>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredAttendanceRecords
                  .filter((r) => r.studentId === selectedAbsentStudentModal.id || (r.studentName && r.studentName.toLowerCase() === selectedAbsentStudentModal.fullName.toLowerCase()))
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        rec.status === 'Absent'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-950 font-bold'
                          : rec.status === 'Present'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700">{rec.date}</span>
                        {rec.session && (
                          <span className="px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] border border-slate-200">
                            {rec.session}
                          </span>
                        )}
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        rec.status === 'Absent'
                          ? 'bg-rose-600 text-white'
                          : rec.status === 'Present'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setSelectedAbsentStudentModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
              >
                Xir
              </button>

              <button
                type="button"
                onClick={() => {
                  const cleanPhone = selectedAbsentStudentModal.parentPhone.replace(/[^0-9]/g, '');
                  const absentCount = filteredAttendanceRecords.filter(
                    (r) => (r.studentId === selectedAbsentStudentModal.id || r.studentName === selectedAbsentStudentModal.fullName) && r.status === 'Absent'
                  ).length;
                  const msg = `Asc Waalid ${selectedAbsentStudentModal.parentName}, waxaan ku ogeysiinaynaa in ardayga ${selectedAbsentStudentModal.fullName} uu bishii lasoo dhaafay ka maqnaaday dugsiga ${absentCount} maalmood. Fadlan kala soo xiriir dugsiga ${settings.schoolName}. Mahadsanid.`;
                  const waUrl = `https://wa.me/${cleanPhone.startsWith('252') ? cleanPhone : '252' + cleanPhone}?text=${encodeURIComponent(msg)}`;
                  window.open(waUrl, '_blank');
                }}
                className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span>U Dir Fariin Waalidka</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Teacher Meeting Modal */}
      {isPTModalOpen && selectedStudent && (
        <PrintParentTeacherMeetingModal
          student={selectedStudent}
          settings={settings}
          hifzRecords={hifzRecords}
          attendanceRecords={attendance}
          paymentRecords={payments}
          teacherNotes={teacherNotes}
          onClose={() => setIsPTModalOpen(false)}
        />
      )}
    </div>
  );
};
