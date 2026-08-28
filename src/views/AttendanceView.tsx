import React, { useState, useMemo } from 'react';
import {
  AttendanceRecord,
  Student,
  ClassRoom,
  ClassGroup,
  AttendanceStatus,
  TrackStatus,
  Teacher,
  TeacherAttendance,
  User,
  SchoolSettings,
  AttendanceSession,
  AttendanceEditHistoryItem,
} from '../types';
import {
  CheckSquare,
  Calendar,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  History,
  Sun,
  Sunrise,
  FileText,
  Check,
  X,
  Users,
  Layers,
  Heart,
  Edit3,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  XCircle as XCircleIcon,
  LogIn,
  LogOut,
  Sparkles,
  UserCheck,
  Clock3,
  QrCode,
} from 'lucide-react';
import { StudentQrCheckInModal } from '../components/attendance/StudentQrCheckInModal';

interface AttendanceViewProps {
  currentUser?: User | null;
  attendance: AttendanceRecord[];
  students: Student[];
  teachers?: Teacher[];
  teacherAttendance?: TeacherAttendance[];
  classes: ClassRoom[];
  classGroups?: ClassGroup[];
  settings?: SchoolSettings;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onSaveTeacherAttendance?: (records: TeacherAttendance[]) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentUser,
  attendance,
  students,
  teachers = [],
  teacherAttendance = [],
  classes,
  classGroups = [],
  settings,
  onSaveAttendance,
  onSaveTeacherAttendance,
}) => {
  const isParent = currentUser?.role === 'parent';
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';

  // ACTIVE TAB
  const [activeTab, setActiveTab] = useState<
    'matrix' | 'parent' | 'history' | 'reports'
  >(isParent ? 'parent' : 'matrix');

  // PERMISSION LOGIC
  const canEditStudentAttendance = useMemo(() => {
    if (isAdmin) return true;
    if (isTeacher) {
      const isAllowed = settings?.privacyPermissions?.allowTeacherTakeAttendance !== false;
      const restrictEdit = settings?.privacyPermissions?.restrictTeacherEditAttendance === true;
      if (isAllowed && !restrictEdit) return true;
      return false;
    }
    return false;
  }, [isAdmin, isTeacher, settings]);

  // DATE SELECTOR FOR DAILY MATRIX
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // CLASS & GROUP FILTERS
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // SESSION SELECTOR
  const [selectedSession, setSelectedSession] = useState<AttendanceSession>('Subax Hore');

  // LOCAL MATRIX DRAFT STATE
  // Maps studentId -> Partial<AttendanceRecord>
  const [matrixDraft, setMatrixDraft] = useState<Record<string, Partial<AttendanceRecord>>>({});
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // EDIT / AUDIT CORRECTION MODAL STATE
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editSubaxStatus, setEditSubaxStatus] = useState<TrackStatus>('Lama Diiwaangelin');
  const [editSubaxTimeIn, setEditSubaxTimeIn] = useState('');
  const [editSubaxTimeOut, setEditSubaxTimeOut] = useState('');
  const [editCasharStatus, setEditCasharStatus] = useState<TrackStatus>('Lama Diiwaangelin');
  const [editCasharTimeIn, setEditCasharTimeIn] = useState('');
  const [editCasharTimeOut, setEditCasharTimeOut] = useState('');
  const [editDareerisStatus, setEditDareerisStatus] = useState<TrackStatus>('Lama Diiwaangelin');
  const [editDareerisTimeIn, setEditDareerisTimeIn] = useState('');
  const [editDareerisTimeOut, setEditDareerisTimeOut] = useState('');
  const [editAttendanceStatus, setEditAttendanceStatus] = useState<TrackStatus>('Lama Diiwaangelin');
  const [editNote, setEditNote] = useState('');

  // QR CODE CHECK-IN MODAL STATE
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // PARENT DASHBOARD CHILDREN LIST
  const parentChildren = useMemo(() => {
    if (!isParent) return [];
    return students.filter(
      (s) =>
        (currentUser?.phone && s.parentPhone.includes(currentUser.phone)) ||
        (currentUser?.name && s.parentName.toLowerCase().includes(currentUser.name.toLowerCase()))
    );
  }, [isParent, students, currentUser]);

  const [selectedChildId, setSelectedChildId] = useState<string>(
    parentChildren[0]?.id || students[0]?.id || ''
  );

  // HISTORY FILTERS
  const [historySearch, setHistorySearch] = useState('');

  // Helper: Get Groups for currently selected class
  const classGroupsForSelected = useMemo(() => {
    return classGroups.filter((g) => g.classId === selectedClassId);
  }, [classGroups, selectedClassId]);

  // Students in selected class & group
  const studentsInSelectedScope = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = s.classId === selectedClassId;
      const matchesGroup =
        selectedGroupId === 'all'
          ? true
          : selectedGroupId === 'ungrouped'
          ? !s.groupId
          : s.groupId === selectedGroupId;
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesGroup && matchesSearch;
    });
  }, [students, selectedClassId, selectedGroupId, searchQuery]);

  // Get current real time string (e.g. "07:15 AM")
  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper: Get existing saved attendance record for student on selected date
  const getRecordForStudent = (studentId: string): AttendanceRecord | undefined => {
    return attendance.find(
      (r) => r.studentId === studentId && r.date === selectedDate
    );
  };

  // Helper: Get active state for student (merging saved record + draft)
  // DEFAULT IS 'Lama Diiwaangelin' IF NO RECORD EXISTS
  const getStudentCurrentMetrics = (studentId: string) => {
    const saved = getRecordForStudent(studentId);
    const draft = matrixDraft[studentId] || {};

    return {
      subaxStatus: (draft.subaxStatus ?? saved?.subaxStatus ?? 'Lama Diiwaangelin') as TrackStatus,
      subaxTimeIn: draft.subaxTimeIn ?? saved?.subaxTimeIn ?? '',
      subaxTimeOut: draft.subaxTimeOut ?? saved?.subaxTimeOut ?? '',

      casharStatus: (draft.casharStatus ?? saved?.casharStatus ?? 'Lama Diiwaangelin') as TrackStatus,
      casharTimeIn: draft.casharTimeIn ?? saved?.casharTimeIn ?? '',
      casharTimeOut: draft.casharTimeOut ?? saved?.casharTimeOut ?? '',

      dareerisStatus: (draft.dareerisStatus ?? saved?.dareerisStatus ?? 'Lama Diiwaangelin') as TrackStatus,
      dareerisTimeIn: draft.dareerisTimeIn ?? saved?.dareerisTimeIn ?? '',
      dareerisTimeOut: draft.dareerisTimeOut ?? saved?.dareerisTimeOut ?? '',

      attendanceStatus: (draft.attendanceStatus ?? saved?.attendanceStatus ?? 'Lama Diiwaangelin') as TrackStatus,
    };
  };

  // Direct Button Click Handler for Sax or Maya
  const handleSetMetricStatus = (
    student: Student,
    metric: 'subax' | 'cashar' | 'dareeris' | 'attendance',
    newStatus: TrackStatus
  ) => {
    if (!canEditStudentAttendance) return;

    const current = getStudentCurrentMetrics(student.id);
    const statusKey = `${metric}Status` as keyof typeof current;
    const currentStatus = current[statusKey] as TrackStatus;

    // Toggle back to 'Lama Diiwaangelin' if tapping the same active status
    const targetStatus: TrackStatus = currentStatus === newStatus ? 'Lama Diiwaangelin' : newStatus;

    setMatrixDraft((prev) => {
      const studentDraft = { ...(prev[student.id] || {}) };
      studentDraft[statusKey] = targetStatus;

      // If set to 'Maya' or 'Lama Diiwaangelin', clear timestamps for this metric
      if (targetStatus === 'Maya' || targetStatus === 'Lama Diiwaangelin') {
        if (metric === 'subax') {
          studentDraft.subaxTimeIn = '';
          studentDraft.subaxTimeOut = '';
        } else if (metric === 'cashar') {
          studentDraft.casharTimeIn = '';
          studentDraft.casharTimeOut = '';
        } else if (metric === 'dareeris') {
          studentDraft.dareerisTimeIn = '';
          studentDraft.dareerisTimeOut = '';
        }
      }

      return {
        ...prev,
        [student.id]: studentDraft,
      };
    });
  };

  // Gelay / Ka Baxay Timestamp Capture
  const handleTimestampAction = (
    student: Student,
    metric: 'subax' | 'cashar' | 'dareeris',
    type: 'In' | 'Out'
  ) => {
    if (!canEditStudentAttendance) return;
    const current = getStudentCurrentMetrics(student.id);
    const statusKey = `${metric}Status` as keyof typeof current;

    // Must be 'Sax' to record timestamp
    if (current[statusKey] !== 'Sax') return;

    const timeKey = `${metric}Time${type}` as keyof AttendanceRecord;
    const nowTime = getCurrentTimeString();

    setMatrixDraft((prev) => ({
      ...prev,
      [student.id]: {
        ...prev[student.id],
        [timeKey]: nowTime,
      },
    }));
  };

  // Clear specific timestamp
  const handleClearTimestamp = (
    student: Student,
    metric: 'subax' | 'cashar' | 'dareeris',
    type: 'In' | 'Out'
  ) => {
    if (!canEditStudentAttendance) return;
    const timeKey = `${metric}Time${type}` as keyof AttendanceRecord;

    setMatrixDraft((prev) => ({
      ...prev,
      [student.id]: {
        ...prev[student.id],
        [timeKey]: '',
      },
    }));
  };

  // KULLI SAX (✓ SAX) - Sets all to Sax WITHOUT creating fake timestamps
  const handleMarkAllScope = (targetStatus: TrackStatus) => {
    if (!canEditStudentAttendance) return;
    const newDraft = { ...matrixDraft };

    studentsInSelectedScope.forEach((std) => {
      const existingDraft = newDraft[std.id] || {};
      newDraft[std.id] = {
        ...existingDraft,
        subaxStatus: targetStatus,
        casharStatus: targetStatus,
        dareerisStatus: targetStatus,
        attendanceStatus: targetStatus,
        // DO NOT AUTO-GENERATE FAKE TIMESTAMPS! Timestamps remain unchanged or empty until tapped.
        ...(targetStatus === 'Maya' || targetStatus === 'Lama Diiwaangelin'
          ? {
              subaxTimeIn: '',
              subaxTimeOut: '',
              casharTimeIn: '',
              casharTimeOut: '',
              dareerisTimeIn: '',
              dareerisTimeOut: '',
            }
          : {}),
      };
    });

    setMatrixDraft(newDraft);
  };

  // Save All Drafts to App State / Database
  const handleSaveMatrix = () => {
    const recordsToSave: AttendanceRecord[] = [];
    const activeCls = classes.find((c) => c.id === selectedClassId);

    studentsInSelectedScope.forEach((std) => {
      const metrics = getStudentCurrentMetrics(std.id);
      const existing = getRecordForStudent(std.id);
      const stdGroup = classGroups.find((g) => g.id === std.groupId);

      // Compute general legacy attendance status
      const overallStatus: AttendanceStatus =
        metrics.attendanceStatus === 'Sax' ? 'Present' : 'Absent';

      const rec: AttendanceRecord = {
        id: existing ? existing.id : `att-${std.id}-${selectedDate}`,
        studentId: std.id,
        studentName: std.fullName,
        classId: selectedClassId,
        className: activeCls?.name || std.className,
        groupId: std.groupId,
        groupName: stdGroup?.name || std.groupName,
        date: selectedDate,
        session: selectedSession,
        status: overallStatus,

        subaxStatus: metrics.subaxStatus,
        subaxTimeIn: metrics.subaxTimeIn,
        subaxTimeOut: metrics.subaxTimeOut,

        casharStatus: metrics.casharStatus,
        casharTimeIn: metrics.casharTimeIn,
        casharTimeOut: metrics.casharTimeOut,

        dareerisStatus: metrics.dareerisStatus,
        dareerisTimeIn: metrics.dareerisTimeIn,
        dareerisTimeOut: metrics.dareerisTimeOut,

        attendanceStatus: metrics.attendanceStatus,

        teacherId: currentUser?.id,
        teacherName: currentUser?.name || activeCls?.teacherName,
        loggedBy: currentUser?.name || 'Macallin',
        updatedAt: new Date().toISOString(),
      };

      recordsToSave.push(rec);
    });

    // Merge with existing attendance records
    const otherRecords = attendance.filter(
      (a) =>
        !recordsToSave.some(
          (r) => r.studentId === a.studentId && r.date === a.date
        )
    );

    onSaveAttendance([...recordsToSave, ...otherRecords]);
    setMatrixDraft({});
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  // Open Audit Correction Modal
  const openEditModalForRecord = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditSubaxStatus(rec.subaxStatus || 'Lama Diiwaangelin');
    setEditSubaxTimeIn(rec.subaxTimeIn || '');
    setEditSubaxTimeOut(rec.subaxTimeOut || '');
    setEditCasharStatus(rec.casharStatus || 'Lama Diiwaangelin');
    setEditCasharTimeIn(rec.casharTimeIn || '');
    setEditCasharTimeOut(rec.casharTimeOut || '');
    setEditDareerisStatus(rec.dareerisStatus || 'Lama Diiwaangelin');
    setEditDareerisTimeIn(rec.dareerisTimeIn || '');
    setEditDareerisTimeOut(rec.dareerisTimeOut || '');
    setEditAttendanceStatus(rec.attendanceStatus || (rec.status === 'Present' ? 'Sax' : 'Maya'));
    setEditNote(rec.note || '');
  };

  // Submit Audit Correction
  const handleSaveAuditCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const auditHistoryItem: AttendanceEditHistoryItem = {
      editedBy: currentUser?.name || 'Admin',
      editedAt: new Date().toISOString(),
      field: 'Sixidda Xogta (Audit Correction)',
      oldValue: {
        subaxStatus: editingRecord.subaxStatus,
        casharStatus: editingRecord.casharStatus,
        dareerisStatus: editingRecord.dareerisStatus,
        attendanceStatus: editingRecord.attendanceStatus,
      },
      newValue: {
        subaxStatus: editSubaxStatus,
        casharStatus: editCasharStatus,
        dareerisStatus: editDareerisStatus,
        attendanceStatus: editAttendanceStatus,
      },
    };

    const updatedRecord: AttendanceRecord = {
      ...editingRecord,
      subaxStatus: editSubaxStatus,
      subaxTimeIn: editSubaxTimeIn,
      subaxTimeOut: editSubaxTimeOut,
      casharStatus: editCasharStatus,
      casharTimeIn: editCasharTimeIn,
      casharTimeOut: editCasharTimeOut,
      dareerisStatus: editDareerisStatus,
      dareerisTimeIn: editDareerisTimeIn,
      dareerisTimeOut: editDareerisTimeOut,
      attendanceStatus: editAttendanceStatus,
      status: editAttendanceStatus === 'Sax' ? 'Present' : 'Absent',
      note: editNote,
      editedBy: currentUser?.name || 'Admin',
      editHistory: [...(editingRecord.editHistory || []), auditHistoryItem],
      updatedAt: new Date().toISOString(),
    };

    const nextAttendance = attendance.map((a) =>
      a.id === updatedRecord.id ? updatedRecord : a
    );

    onSaveAttendance(nextAttendance);
    setEditingRecord(null);
  };

  // CALCULATE STATS FOR REPORTS
  const reportStats = useMemo(() => {
    let totalSubaxSax = 0;
    let totalSubaxMaya = 0;
    let totalCasharSax = 0;
    let totalCasharMaya = 0;
    let totalDareerisSax = 0;
    let totalDareerisMaya = 0;
    let totalAttendanceSax = 0;
    let totalAttendanceMaya = 0;

    attendance.forEach((r) => {
      if (r.subaxStatus === 'Sax') totalSubaxSax++;
      if (r.subaxStatus === 'Maya') totalSubaxMaya++;

      if (r.casharStatus === 'Sax') totalCasharSax++;
      if (r.casharStatus === 'Maya') totalCasharMaya++;

      if (r.dareerisStatus === 'Sax') totalDareerisSax++;
      if (r.dareerisStatus === 'Maya') totalDareerisMaya++;

      if (r.attendanceStatus === 'Sax' || r.status === 'Present') totalAttendanceSax++;
      if (r.attendanceStatus === 'Maya' || r.status === 'Absent') totalAttendanceMaya++;
    });

    const totalRecords = attendance.length || 1;
    const overallPercentage = Math.round((totalAttendanceSax / totalRecords) * 100);

    return {
      totalSubaxSax,
      totalSubaxMaya,
      totalCasharSax,
      totalCasharMaya,
      totalDareerisSax,
      totalDareerisMaya,
      totalAttendanceSax,
      totalAttendanceMaya,
      overallPercentage,
    };
  }, [attendance]);

  // MONTHLY CHART DATA
  const monthlyChartData = useMemo(() => {
    const monthMap: Record<string, { month: string; sax: number; maya: number }> = {};

    attendance.forEach((r) => {
      if (!r.date) return;
      const monthKey = r.date.substring(0, 7);
      if (!monthMap[monthKey]) {
        const monthName = new Date(r.date).toLocaleDateString('so-SO', {
          month: 'short',
          year: 'numeric',
        });
        monthMap[monthKey] = { month: monthName, sax: 0, maya: 0 };
      }

      if (r.attendanceStatus === 'Sax' || r.status === 'Present') {
        monthMap[monthKey].sax += 1;
      } else if (r.attendanceStatus === 'Maya' || r.status === 'Absent') {
        monthMap[monthKey].maya += 1;
      }
    });

    return Object.values(monthMap);
  }, [attendance]);

  // PARENT DASHBOARD CHILD DATA
  const selectedChild = students.find((s) => s.id === selectedChildId);
  const childTodayRecord = attendance.find(
    (r) => r.studentId === selectedChildId && r.date === selectedDate
  );
  const childPastRecords = attendance.filter((r) => r.studentId === selectedChildId);

  return (
    <div className="space-y-6">
      {/* HEADER WITH APP BAR & NAVIGATION TABS */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
              MACHADKA TAHDIIBUL ADFAAL
            </span>
            <span className="text-xs text-slate-400 font-medium">Single-Tap ✓ / × Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            <span>Nidaamka Xaadiriska, Subaca & Casharrada</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hal-taabasho Subac, Cashar, Dareeris, Xaadiris, Gelay & Ka Baxay waqtiyada dhabta ah.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white shadow-md shadow-emerald-600/20 hover:brightness-110 transition flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
          >
            <QrCode className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>📷 QR Code Check-In</span>
          </button>

          {!isParent && (
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>✓/× Safaaxadda Guruubka</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('parent')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'parent'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4 fill-amber-300 text-amber-950" />
            <span>Portal-ka Waalidka</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Taariikhda & Sixidda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>Warbixinnada</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE-TAP ✓ / × MATRIX (ATTENDANCE & LEARNING ENGINE) */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* CONTROLS BAR: DATE, CLASS, GROUP, SEARCH */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* DATE PICKER */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Taariikhda:</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* CLASS SELECTOR */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fasalka:</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedGroupId('all');
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shift})
                    </option>
                  ))}
                </select>
              </div>

              {/* GROUP SELECTOR */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guruubka:</span>
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">-- Dhammaan Guruubyada --</option>
                  {classGroupsForSelected.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.teacherName || 'Macallin'})
                    </option>
                  ))}
                  <option value="ungrouped">Guruub La'aan</option>
                </select>
              </div>

              {/* SEARCH STUDENT */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Raadi Arday:</span>
                </label>
                <input
                  type="text"
                  placeholder="Magaca ama ID-ga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* BATCH ACTION & SAVE BAR */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAllScope('Sax')}
                  disabled={!canEditStudentAttendance}
                  className="px-3 py-1.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  title="Dhammaan ardayda u calaamadee ✓ Sax (Bilaash ma abuuro Gelay/Ka Baxay)"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>KULLI SAX (✓ SAX)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllScope('Maya')}
                  disabled={!canEditStudentAttendance}
                  className="px-3 py-1.5 bg-rose-100 text-rose-900 hover:bg-rose-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4 text-rose-700" />
                  <span>KULLI MAYA (× MAYA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllScope('Lama Diiwaangelin')}
                  disabled={!canEditStudentAttendance}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  <Clock3 className="w-4 h-4 text-slate-500" />
                  <span>RESET (LAMA DIIWAANGELIN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm hover:brightness-110 active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-emerald-300" />
                  <span>📷 QR CHECK-IN</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {isSavedRecently && (
                  <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                    <CheckCircle className="w-4 h-4" />
                    <span>Xogta waa la kaydiyay!</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  disabled={!canEditStudentAttendance}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-200 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>KAYDI XAADIRISKA & HAWLAHA</span>
                </button>
              </div>
            </div>
          </div>

          {/* SINGLE-TAP ✓ / × MATRIX CARDS / TABLE */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md overflow-hidden w-full flex flex-col pb-24 sm:pb-28">
            {/* TABLE SUMMARY / HELPER BAR */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-slate-900 font-extrabold text-xs sm:text-sm">Safaaxadda Xaadiriska ({studentsInSelectedScope.length} Arday)</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[9px] sm:text-[10px] uppercase">5-ta Qaybood Hal Shaashad</span>
              </div>
            </div>

            {/* RESPONSIVE VERTICAL SCROLL TABLE CONTAINER (NO OVERFLOW-X / NO HORIZONTAL SCROLL) */}
            <div className="w-full overflow-x-hidden overflow-y-auto max-h-[calc(100vh-250px)] min-h-[380px] scrollbar-thin scrollbar-thumb-slate-300">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-slate-900 text-white uppercase font-black text-[10px] sm:text-xs tracking-wider sticky top-0 z-30 shadow-xs">
                  <tr>
                    {/* 1. ARDAYGA (20% WIDTH) */}
                    <th className="w-[20%] px-1 sm:px-2.5 py-2.5 bg-slate-900 text-white border-r border-slate-800 text-center sm:text-left align-middle">
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-0.5">
                        <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="font-black text-[9px] sm:text-xs text-emerald-300">ARDAYGA</span>
                      </div>
                    </th>

                    {/* 2. ☀️ 1. SUBAC (20% WIDTH) */}
                    <th className="w-[20%] px-1 sm:px-2 py-2.5 text-center bg-slate-900 text-white border-r border-slate-800 align-middle">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5">
                        <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-amber-300 font-black text-[9px] sm:text-xs">1. SUBAC</span>
                      </div>
                    </th>

                    {/* 3. 📖 2. CASHAR (20% WIDTH) */}
                    <th className="w-[20%] px-1 sm:px-2 py-2.5 text-center bg-slate-900 text-white border-r border-slate-800 align-middle">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5">
                        <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300 font-black text-[9px] sm:text-xs">2. CASHAR</span>
                      </div>
                    </th>

                    {/* 4. 🕰️ 3. DAREEN (20% WIDTH) */}
                    <th className="w-[20%] px-1 sm:px-2 py-2.5 text-center bg-slate-900 text-white border-r border-slate-800 align-middle">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5">
                        <Sunrise className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-cyan-300 font-black text-[9px] sm:text-xs">3. DAREEN</span>
                      </div>
                    </th>

                    {/* 5. ✓ 4. XAADIRIS (20% WIDTH) */}
                    <th className="w-[20%] px-1 sm:px-2 py-2.5 text-center bg-slate-900 text-white align-middle">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300 font-black text-[9px] sm:text-xs">4. XAADIRIS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {studentsInSelectedScope.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 font-extrabold text-sm">
                        Pora ma jiro arday ku jira fasalkan ama guruubkan.
                      </td>
                    </tr>
                  ) : (
                    studentsInSelectedScope.map((std) => {
                      const metrics = getStudentCurrentMetrics(std.id);

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/90 transition group">
                          {/* 1. ARDAYGA COLUMN (20% WIDTH) */}
                          <td className="w-[20%] p-1 sm:p-2 border-r border-slate-200/90 align-middle bg-white group-hover:bg-slate-50/90">
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-0.5">
                              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded bg-emerald-100 text-emerald-900 font-black text-[9px] sm:text-xs flex items-center justify-center shrink-0 border border-emerald-300">
                                {std.fullName.charAt(0)}
                              </div>
                              <div className="min-w-0 w-full overflow-hidden">
                                <div className="font-extrabold text-[9px] sm:text-xs text-slate-900 leading-tight whitespace-normal break-words text-center sm:text-left" title={std.fullName}>
                                  {std.fullName}
                                </div>
                                <div className="text-[7.5px] sm:text-[10px] text-slate-400 font-mono font-bold block text-center sm:text-left mt-0.5">
                                  ID:{std.studentId}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. SUBAC COLUMN (20% WIDTH) */}
                          <td className="w-[20%] p-1 sm:p-2 text-center border-r border-slate-100 align-middle">
                            <div className="flex flex-col items-center gap-1 w-full">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'subax', 'Sax')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.subaxStatus === 'Sax'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Sax</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'subax', 'Maya')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.subaxStatus === 'Maya'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <X className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Maya</span>
                                </button>
                              </div>

                              {metrics.subaxStatus === 'Lama Diiwaangelin' ? (
                                <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium italic block text-center py-0.5">
                                  Lama diiwaangelin
                                </span>
                              ) : metrics.subaxStatus === 'Sax' ? (
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 w-full mt-0.5">
                                  <div className="relative flex items-center w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleTimestampAction(std, 'subax', 'In')}
                                      disabled={!canEditStudentAttendance}
                                      className={`w-full min-h-[32px] sm:min-h-[36px] px-0.5 py-0.5 font-extrabold text-[8px] sm:text-[10px] rounded-md border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap touch-manipulation ${
                                        metrics.subaxTimeIn
                                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <LogIn className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                      <span className="truncate">{metrics.subaxTimeIn ? `G:${metrics.subaxTimeIn}` : 'Gelay+'}</span>
                                    </button>
                                    {metrics.subaxTimeIn && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearTimestamp(std, 'subax', 'In')}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] hover:bg-rose-600 transition"
                                        title="Nadiifi waqtiga"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>

                                  <div className="relative flex items-center w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleTimestampAction(std, 'subax', 'Out')}
                                      disabled={!canEditStudentAttendance}
                                      className={`w-full min-h-[32px] sm:min-h-[36px] px-0.5 py-0.5 font-extrabold text-[8px] sm:text-[10px] rounded-md border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap touch-manipulation ${
                                        metrics.subaxTimeOut
                                          ? 'bg-slate-900 text-white border-slate-950 font-black'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <LogOut className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                      <span className="truncate">{metrics.subaxTimeOut ? `K:${metrics.subaxTimeOut}` : 'KaBax+'}</span>
                                    </button>
                                    {metrics.subaxTimeOut && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearTimestamp(std, 'subax', 'Out')}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] hover:bg-rose-600 transition"
                                        title="Nadiifi waqtiga"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[8.5px] sm:text-[10px] font-black text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 block text-center w-full mt-0.5">
                                  Muu Bixin
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. CASHAR COLUMN (20% WIDTH) */}
                          <td className="w-[20%] p-1 sm:p-2 text-center border-r border-slate-100 align-middle">
                            <div className="flex flex-col items-center gap-1 w-full">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'cashar', 'Sax')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.casharStatus === 'Sax'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Sax</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'cashar', 'Maya')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.casharStatus === 'Maya'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <X className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Maya</span>
                                </button>
                              </div>

                              {metrics.casharStatus === 'Lama Diiwaangelin' ? (
                                <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium italic block text-center py-0.5">
                                  Lama diiwaangelin
                                </span>
                              ) : metrics.casharStatus === 'Sax' ? (
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 w-full mt-0.5">
                                  <div className="relative flex items-center w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleTimestampAction(std, 'cashar', 'In')}
                                      disabled={!canEditStudentAttendance}
                                      className={`w-full min-h-[32px] sm:min-h-[36px] px-0.5 py-0.5 font-extrabold text-[8px] sm:text-[10px] rounded-md border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap touch-manipulation ${
                                        metrics.casharTimeIn
                                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <LogIn className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                      <span className="truncate">{metrics.casharTimeIn ? `G:${metrics.casharTimeIn}` : 'Gelay+'}</span>
                                    </button>
                                    {metrics.casharTimeIn && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearTimestamp(std, 'cashar', 'In')}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] hover:bg-rose-600 transition"
                                        title="Nadiifi waqtiga"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>

                                  <div className="relative flex items-center w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleTimestampAction(std, 'cashar', 'Out')}
                                      disabled={!canEditStudentAttendance}
                                      className={`w-full min-h-[32px] sm:min-h-[36px] px-0.5 py-0.5 font-extrabold text-[8px] sm:text-[10px] rounded-md border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap touch-manipulation ${
                                        metrics.casharTimeOut
                                          ? 'bg-slate-900 text-white border-slate-950 font-black'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <LogOut className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                      <span className="truncate">{metrics.casharTimeOut ? `K:${metrics.casharTimeOut}` : 'KaBax+'}</span>
                                    </button>
                                    {metrics.casharTimeOut && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearTimestamp(std, 'cashar', 'Out')}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] hover:bg-rose-600 transition"
                                        title="Nadiifi waqtiga"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[8.5px] sm:text-[10px] font-black text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 block text-center w-full mt-0.5">
                                  Muu Bixin
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 4. DAREEN COLUMN (20% WIDTH) */}
                          <td className="w-[20%] p-1 sm:p-2 text-center border-r border-slate-100 align-middle">
                            <div className="flex flex-col items-center gap-1 w-full">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'dareeris', 'Sax')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.dareerisStatus === 'Sax'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Sax</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'dareeris', 'Maya')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.dareerisStatus === 'Maya'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <X className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Maya</span>
                                </button>
                              </div>

                              {metrics.dareerisStatus === 'Lama Diiwaangelin' ? (
                                <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium italic block text-center py-0.5">
                                  Lama diiwaangelin
                                </span>
                              ) : metrics.dareerisStatus === 'Sax' ? (
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 w-full mt-0.5">
                                  <div className="relative flex items-center w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleTimestampAction(std, 'dareeris', 'In')}
                                      disabled={!canEditStudentAttendance}
                                      className={`w-full min-h-[32px] sm:min-h-[36px] px-0.5 py-0.5 font-extrabold text-[8px] sm:text-[10px] rounded-md border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap touch-manipulation ${
                                        metrics.dareerisTimeIn
                                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <LogIn className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                      <span className="truncate">{metrics.dareerisTimeIn ? `G:${metrics.dareerisTimeIn}` : 'Gelay+'}</span>
                                    </button>
                                    {metrics.dareerisTimeIn && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearTimestamp(std, 'dareeris', 'In')}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] hover:bg-rose-600 transition"
                                        title="Nadiifi waqtiga"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>

                                  <div className="relative flex items-center w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleTimestampAction(std, 'dareeris', 'Out')}
                                      disabled={!canEditStudentAttendance}
                                      className={`w-full min-h-[32px] sm:min-h-[36px] px-0.5 py-0.5 font-extrabold text-[8px] sm:text-[10px] rounded-md border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap touch-manipulation ${
                                        metrics.dareerisTimeOut
                                          ? 'bg-slate-900 text-white border-slate-950 font-black'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <LogOut className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                      <span className="truncate">{metrics.dareerisTimeOut ? `K:${metrics.dareerisTimeOut}` : 'KaBax+'}</span>
                                    </button>
                                    {metrics.dareerisTimeOut && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearTimestamp(std, 'dareeris', 'Out')}
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] hover:bg-rose-600 transition"
                                        title="Nadiifi waqtiga"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[8.5px] sm:text-[10px] font-black text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 block text-center w-full mt-0.5">
                                  Muu Bixin
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. XAADIRIS COLUMN (20% WIDTH) */}
                          <td className="w-[20%] p-1 sm:p-2 text-center align-middle">
                            <div className="flex flex-col items-center gap-1 w-full">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'attendance', 'Sax')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.attendanceStatus === 'Sax'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Joogay</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSetMetricStatus(std, 'attendance', 'Maya')}
                                  disabled={!canEditStudentAttendance}
                                  className={`w-full sm:flex-1 min-h-[36px] sm:min-h-[42px] px-1 py-1 rounded-lg font-black text-[10px] sm:text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 border border-transparent touch-manipulation ${
                                    metrics.attendanceStatus === 'Maya'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-1 ring-rose-500/30'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80 font-bold'
                                  }`}
                                >
                                  <X className="w-3 h-3 stroke-[3] shrink-0" />
                                  <span className="text-[9px] sm:text-xs">Maqan</span>
                                </button>
                              </div>

                              {metrics.attendanceStatus === 'Lama Diiwaangelin' ? (
                                <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium italic block text-center py-0.5">
                                  Lama diiwaangelin
                                </span>
                              ) : metrics.attendanceStatus === 'Sax' ? (
                                <span className="text-[8.5px] sm:text-[10px] font-black text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 block text-center w-full mt-0.5">
                                  ✓ Wuu Joogay
                                </span>
                              ) : (
                                <span className="text-[8.5px] sm:text-[10px] font-black text-rose-800 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 block text-center w-full mt-0.5">
                                  ✕ Wuu Maqnaa
                                </span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PARENT DASHBOARD (PORTAL-KA WAALIDKA) */}
      {/* ========================================================================= */}
      {activeTab === 'parent' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* PARENT BANNER & CHILD SELECTOR */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                  PORTAL-KA WAALIDKA
                </span>
                <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Warbixinta Ubadkaaga</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Laxiriir toos ah oo ku saabsan Subaca, Casharka, Dareeriska, Xaadiriska iyo Waqtiyada Gelay/Ka Baxay.
                </p>
              </div>

              {/* CHILD SELECTOR DROPDOWN */}
              <div className="w-full sm:w-64">
                <label className="text-[11px] font-bold text-amber-300 block mb-1">
                  Dooro Ardayga / Ilmaha:
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-800 text-white border border-amber-500/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SELECTED CHILD SUMMARY */}
            {selectedChild && (
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Magaca Ardayga</p>
                  <p className="font-black text-sm text-white">{selectedChild.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">ID-ga Ardayga</p>
                  <p className="font-mono font-bold text-amber-300">{selectedChild.studentId}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Fasalka & Guruubka</p>
                  <p className="font-bold text-white">
                    {selectedChild.className}{' '}
                    {selectedChild.groupName ? `• ${selectedChild.groupName}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Juz-ka Hadda</p>
                  <p className="font-black text-emerald-400">Juz {selectedChild.currentJuz || 1}</p>
                </div>
              </div>
            )}
          </div>

          {/* TODAY'S DETAILED CARDS FOR SELECTED CHILD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. SUBAX CARD */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-600 uppercase flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Subaca Maanta</span>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    childTodayRecord?.subaxStatus === 'Sax'
                      ? 'bg-emerald-100 text-emerald-900'
                      : childTodayRecord?.subaxStatus === 'Maya'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {childTodayRecord?.subaxStatus === 'Sax'
                    ? '✓ Sax (Wuu Bixiyay)'
                    : childTodayRecord?.subaxStatus === 'Maya'
                    ? '× Maya (Muu Bixin)'
                    : 'Lama diiwaangelin'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <p className="flex justify-between">
                  <span>Waqtiga Gelay:</span>
                  <strong className="text-slate-800">{childTodayRecord?.subaxTimeIn || '---'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Waqtiga Ka Baxay:</span>
                  <strong className="text-slate-800">{childTodayRecord?.subaxTimeOut || '---'}</strong>
                </p>
              </div>
            </div>

            {/* 2. CASHAR CARD */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-600 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Casharka Maanta</span>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    childTodayRecord?.casharStatus === 'Sax'
                      ? 'bg-emerald-100 text-emerald-900'
                      : childTodayRecord?.casharStatus === 'Maya'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {childTodayRecord?.casharStatus === 'Sax'
                    ? '✓ Sax (Wuu Bixiyay)'
                    : childTodayRecord?.casharStatus === 'Maya'
                    ? '× Maya (Muu Bixin)'
                    : 'Lama diiwaangelin'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <p className="flex justify-between">
                  <span>Waqtiga Gelay:</span>
                  <strong className="text-slate-800">{childTodayRecord?.casharTimeIn || '---'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Waqtiga Ka Baxay:</span>
                  <strong className="text-slate-800">{childTodayRecord?.casharTimeOut || '---'}</strong>
                </p>
              </div>
            </div>

            {/* 3. DAREERIS CARD */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-600 uppercase flex items-center gap-1.5">
                  <Sunrise className="w-4 h-4 text-cyan-500" />
                  <span>Dareeriska Maanta</span>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    childTodayRecord?.dareerisStatus === 'Sax'
                      ? 'bg-emerald-100 text-emerald-900'
                      : childTodayRecord?.dareerisStatus === 'Maya'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {childTodayRecord?.dareerisStatus === 'Sax'
                    ? '✓ Sax (Wuu Bixiyay)'
                    : childTodayRecord?.dareerisStatus === 'Maya'
                    ? '× Maya (Muu Bixin)'
                    : 'Lama diiwaangelin'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <p className="flex justify-between">
                  <span>Waqtiga Gelay:</span>
                  <strong className="text-slate-800">{childTodayRecord?.dareerisTimeIn || '---'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Waqtiga Ka Baxay:</span>
                  <strong className="text-slate-800">{childTodayRecord?.dareerisTimeOut || '---'}</strong>
                </p>
              </div>
            </div>

            {/* 4. XAADIRIS CARD */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-600 uppercase flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Xaadiriska Maanta</span>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    childTodayRecord?.attendanceStatus === 'Sax' || childTodayRecord?.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-900'
                      : childTodayRecord?.attendanceStatus === 'Maya' || childTodayRecord?.status === 'Absent'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {childTodayRecord?.attendanceStatus === 'Sax' || childTodayRecord?.status === 'Present'
                    ? '✓ Joogay'
                    : childTodayRecord?.attendanceStatus === 'Maya' || childTodayRecord?.status === 'Absent'
                    ? '× Maqan'
                    : 'Lama diiwaangelin'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                <p>Taariikhda: <strong className="text-slate-800">{selectedDate}</strong></p>
              </div>
            </div>
          </div>

          {/* HISTORICAL RECORDS FOR CHILD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Taariikhda Xaadiriska & Bixinta Casharrada (Dhammaan Maalmaha)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Taariikhda</th>
                    <th className="p-3">Subac</th>
                    <th className="p-3">Cashar</th>
                    <th className="p-3">Dareeris</th>
                    <th className="p-3">Xaadiris</th>
                    <th className="p-3">Macallinka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {childPastRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Pora ma jiro xog hore oo la kaydiyay ardaygan.
                      </td>
                    </tr>
                  ) : (
                    childPastRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{r.date}</td>
                        <td className="p-3 font-bold">
                          {r.subaxStatus === 'Sax' ? (
                            <span className="text-emerald-600">✓ Sax {r.subaxTimeIn ? `(${r.subaxTimeIn})` : ''}</span>
                          ) : r.subaxStatus === 'Maya' ? (
                            <span className="text-rose-600">× Maya</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3 font-bold">
                          {r.casharStatus === 'Sax' ? (
                            <span className="text-emerald-600">✓ Sax {r.casharTimeIn ? `(${r.casharTimeIn})` : ''}</span>
                          ) : r.casharStatus === 'Maya' ? (
                            <span className="text-rose-600">× Maya</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3 font-bold">
                          {r.dareerisStatus === 'Sax' ? (
                            <span className="text-emerald-600">✓ Sax {r.dareerisTimeIn ? `(${r.dareerisTimeIn})` : ''}</span>
                          ) : r.dareerisStatus === 'Maya' ? (
                            <span className="text-rose-600">× Maya</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3 font-bold">
                          {r.attendanceStatus === 'Sax' || r.status === 'Present' ? (
                            <span className="text-emerald-600">✓ Joogay</span>
                          ) : r.attendanceStatus === 'Maya' || r.status === 'Absent' ? (
                            <span className="text-rose-600">× Maqan</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{r.loggedBy || r.teacherName || 'Macallin'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATTENDANCE HISTORY & DATA CORRECTION (SIXIDDA XOGTA) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>Taariikhda Xaadiriska & Sixidda Xogta</span>
              </h3>
              <p className="text-xs text-slate-500">
                Fiiri xogta hore, raadi arday gaar ah, oo beddel ama sax xog khaldantay (Audit Logged).
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Raadi magac ama taariikh..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[768px]">
                <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Taariikhda</th>
                    <th className="p-3.5">Ardayga</th>
                    <th className="p-3.5">Fasalka & Guruubka</th>
                    <th className="p-3.5 text-center">Subac</th>
                    <th className="p-3.5 text-center">Cashar</th>
                    <th className="p-3.5 text-center">Dareeris</th>
                    <th className="p-3.5 text-center">Xaadiris</th>
                    <th className="p-3.5 text-right">Awoodda Admin-ka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance
                    .filter((r) => {
                      const matchesSearch =
                        r.studentName.toLowerCase().includes(historySearch.toLowerCase()) ||
                        r.date.includes(historySearch);
                      return matchesSearch;
                    })
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-slate-800">{r.date}</td>
                        <td className="p-3.5 font-extrabold text-slate-900">{r.studentName}</td>
                        <td className="p-3.5 text-slate-600">
                          {r.className} {r.groupName ? `(${r.groupName})` : ''}
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          {r.subaxStatus === 'Sax' ? (
                            <span className="text-emerald-600">
                              ✓ Sax {r.subaxTimeIn ? `(${r.subaxTimeIn})` : ''}
                            </span>
                          ) : r.subaxStatus === 'Maya' ? (
                            <span className="text-rose-600">× Maya</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          {r.casharStatus === 'Sax' ? (
                            <span className="text-emerald-600">
                              ✓ Sax {r.casharTimeIn ? `(${r.casharTimeIn})` : ''}
                            </span>
                          ) : r.casharStatus === 'Maya' ? (
                            <span className="text-rose-600">× Maya</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          {r.dareerisStatus === 'Sax' ? (
                            <span className="text-emerald-600">
                              ✓ Sax {r.dareerisTimeIn ? `(${r.dareerisTimeIn})` : ''}
                            </span>
                          ) : r.dareerisStatus === 'Maya' ? (
                            <span className="text-rose-600">× Maya</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          {r.attendanceStatus === 'Sax' || r.status === 'Present' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                              ✓ Joogay
                            </span>
                          ) : r.attendanceStatus === 'Maya' || r.status === 'Absent' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                              × Maqan
                            </span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openEditModalForRecord(r)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 inline-flex cursor-pointer transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sax Xogta</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REPORTS & STATISTICS (WARBIXINNADA & TIROKOOBKA) */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase">Boqolkiiba Xaadiriska Guud</p>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-600">
                  {reportStats.overallPercentage}%
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-400">Ardayda joogtay fasallada iyo subaca</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase">Subaca (✓ vs ×)</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-emerald-600">✓ {reportStats.totalSubaxSax}</span>
                <span className="text-2xl font-black text-rose-500">× {reportStats.totalSubaxMaya}</span>
              </div>
              <p className="text-[11px] text-slate-400">Total Subax Bixiyay vs Muu Bixin</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase">Casharka (✓ vs ×)</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-emerald-600">✓ {reportStats.totalCasharSax}</span>
                <span className="text-2xl font-black text-rose-500">× {reportStats.totalCasharMaya}</span>
              </div>
              <p className="text-[11px] text-slate-400">Total Cashar Bixiyay vs Muu Bixin</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase">Dareeriska (✓ vs ×)</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-emerald-600">✓ {reportStats.totalDareerisSax}</span>
                <span className="text-2xl font-black text-rose-500">× {reportStats.totalDareerisMaya}</span>
              </div>
              <p className="text-[11px] text-slate-400">Total Dareeris Bixiyay vs Muu Bixin</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Garaafka Horumarka Xaadiriska ee Bilaha (Monthly Progress Chart)</span>
            </h3>

            <div className="h-72 w-full pt-2">
              {monthlyChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Pora ma jiro xog ku filan garaafka bisha.
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between pt-4 pb-2">
                  <div className="flex items-end justify-between gap-3 h-52 px-4">
                    {monthlyChartData.map((item, idx) => {
                      const maxVal = Math.max(...monthlyChartData.map((d) => Math.max(d.sax, d.maya)), 1);
                      const saxPct = Math.round((item.sax / maxVal) * 100);
                      const mayaPct = Math.round((item.maya / maxVal) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Floating tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-xl z-20 pointer-events-none whitespace-nowrap">
                            <p className="font-bold text-amber-300">{item.month}</p>
                            <p className="text-emerald-400">✓ Joogay: {item.sax}</p>
                            <p className="text-rose-400">× Maqan: {item.maya}</p>
                          </div>
                          {/* Bar Pair */}
                          <div className="w-full flex items-end justify-center gap-1.5 h-full pb-2 border-b border-slate-200">
                            <div
                              style={{ height: `${Math.max(saxPct, 6)}%` }}
                              className="w-1/2 max-w-[28px] bg-emerald-500 hover:bg-emerald-600 transition-all rounded-t-lg shadow-xs flex items-center justify-center text-[9px] font-black text-white"
                            >
                              {item.sax > 0 ? item.sax : ''}
                            </div>
                            <div
                              style={{ height: `${Math.max(mayaPct, 6)}%` }}
                              className="w-1/2 max-w-[28px] bg-rose-500 hover:bg-rose-600 transition-all rounded-t-lg shadow-xs flex items-center justify-center text-[9px] font-black text-white"
                            >
                              {item.maya > 0 ? item.maya : ''}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 truncate mt-1">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-700">
                      <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                      <span>✓ Joogay (Sax)</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-rose-700">
                      <span className="w-3 h-3 rounded-md bg-rose-500"></span>
                      <span>× Maqan (Maya)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT / AUDIT CORRECTION MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>Sixidda Xogta (Data Correction)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAuditCorrection} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 border border-slate-200">
                <p>
                  <strong>Ardayga:</strong> {editingRecord.studentName}
                </p>
                <p>
                  <strong>Taariikhda:</strong> {editingRecord.date}
                </p>
              </div>

              {/* SUBAX EDIT */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-xs font-bold text-slate-700">Subac:</label>
                <select
                  value={editSubaxStatus}
                  onChange={(e) => setEditSubaxStatus(e.target.value as TrackStatus)}
                  className="px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl"
                >
                  <option value="Lama Diiwaangelin">Lama Diiwaangelin</option>
                  <option value="Sax">✓ Sax</option>
                  <option value="Maya">× Maya</option>
                </select>
                <input
                  type="text"
                  placeholder="In (07:00 AM)"
                  value={editSubaxTimeIn}
                  onChange={(e) => setEditSubaxTimeIn(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* CASHAR EDIT */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-xs font-bold text-slate-700">Cashar:</label>
                <select
                  value={editCasharStatus}
                  onChange={(e) => setEditCasharStatus(e.target.value as TrackStatus)}
                  className="px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl"
                >
                  <option value="Lama Diiwaangelin">Lama Diiwaangelin</option>
                  <option value="Sax">✓ Sax</option>
                  <option value="Maya">× Maya</option>
                </select>
                <input
                  type="text"
                  placeholder="In (08:15 AM)"
                  value={editCasharTimeIn}
                  onChange={(e) => setEditCasharTimeIn(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* DAREERIS EDIT */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-xs font-bold text-slate-700">Dareeris:</label>
                <select
                  value={editDareerisStatus}
                  onChange={(e) => setEditDareerisStatus(e.target.value as TrackStatus)}
                  className="px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl"
                >
                  <option value="Lama Diiwaangelin">Lama Diiwaangelin</option>
                  <option value="Sax">✓ Sax</option>
                  <option value="Maya">× Maya</option>
                </select>
                <input
                  type="text"
                  placeholder="In (09:30 AM)"
                  value={editDareerisTimeIn}
                  onChange={(e) => setEditDareerisTimeIn(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* GENERAL ATTENDANCE EDIT */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <label className="text-xs font-bold text-slate-700">Xaadiris Guud:</label>
                <select
                  value={editAttendanceStatus}
                  onChange={(e) => setEditAttendanceStatus(e.target.value as TrackStatus)}
                  className="col-span-2 px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl"
                >
                  <option value="Lama Diiwaangelin">Lama Diiwaangelin</option>
                  <option value="Sax">✓ Joogay (Sax)</option>
                  <option value="Maya">× Maqan (Maya)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sababta Beddelka (Note):</label>
                <input
                  type="text"
                  placeholder="Sababta loo saxayo..."
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  KAYDI SIXIDDA XOGTA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE CHECK-IN MODAL */}
      <StudentQrCheckInModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        students={students}
        classes={classes}
        attendanceRecords={attendance}
        selectedDate={selectedDate}
        onSaveAttendance={onSaveAttendance}
        currentUser={currentUser}
      />
    </div>
  );
};
