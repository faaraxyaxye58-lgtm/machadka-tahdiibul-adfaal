import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  BookOpen,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Smartphone,
  ShieldCheck,
  Check,
  Send
} from 'lucide-react';
import {
  Student,
  ClassGroup,
  AttendanceRecord,
  HifzRecord,
  User,
  StudyTimeShift,
  SchoolSettings,
  TeacherDevice
} from '../types';
import { calculateShiftStatus, formatRemainingTime, getSomaliDayName } from '../utils/timeEngine';
import { computeLessonProgression, getNextInstructionalDate, LessonStatus } from '../utils/lessonEngine';
import { triggerStudentExitNotification } from '../lib/studentExitEngine';
import { logAuditAction } from '../lib/auditLogger';

interface ClassModeViewProps {
  currentUser: User;
  settings: SchoolSettings;
  students: Student[];
  classGroups: ClassGroup[];
  attendanceRecords: AttendanceRecord[];
  hifzRecords: HifzRecord[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  onSaveHifz: (record: HifzRecord) => void;
  onEndClassSession: () => void;
}

export const ClassModeView: React.FC<ClassModeViewProps> = ({
  currentUser,
  settings,
  students,
  classGroups,
  attendanceRecords,
  hifzRecords,
  onSaveAttendance,
  onSaveHifz,
  onEndClassSession,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Active shift determination
  const shifts = settings.timeShifts || [];
  const workingDays = settings.workingDays || [];
  const holidays = settings.holidays || [];

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine current active shift
  const activeShiftData = useMemo(() => {
    for (const shift of shifts) {
      if (shift.enabled) {
        const res = calculateShiftStatus(shift, workingDays, holidays, now);
        if (res.status === 'ACTIVE') {
          return { shift, remainingSeconds: res.remainingSeconds };
        }
      }
    }
    // Fallback: use first shift
    const defaultShift = shifts[0] || {
      id: 'shift-1',
      name: 'Waqtiga 1 (Subax Hore)',
      startTime: '07:00',
      endTime: '09:00',
      enabled: true,
    };
    const res = calculateShiftStatus(defaultShift, workingDays, holidays, now);
    return { shift: defaultShift, remainingSeconds: res.remainingSeconds };
  }, [shifts, workingDays, holidays, now]);

  const activeShift = activeShiftData.shift;
  const remainingSeconds = activeShiftData.remainingSeconds;

  // Filter students assigned to current teacher or group
  const teacherStudents = useMemo(() => {
    let list = students.filter((s) => s.status === 'Active');

    if (currentUser.role === 'teacher') {
      list = list.filter(
        (s) =>
          s.className.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          s.groupId === currentUser.id ||
          s.groupName?.toLowerCase().includes(currentUser.name.toLowerCase())
      );
      if (list.length === 0) list = students.filter((s) => s.status === 'Active');
    }

    if (selectedGroup !== 'ALL') {
      list = list.filter((s) => s.groupId === selectedGroup || s.groupName === selectedGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.parentPhone.includes(q)
      );
    }

    return list;
  }, [students, currentUser, selectedGroup, searchQuery]);

  // Today's date ISO
  const todayDateStr = useMemo(() => now.toISOString().split('T')[0], [now]);

  // Track state per student for single-tap matrix
  const [studentStates, setStudentStates] = useState<
    Record<
      string,
      {
        attendance: 'Present' | 'Absent' | 'Excused' | 'Late';
        cashar: 'Sax' | 'Maya';
        subax: 'Sax' | 'Maya';
        murajaaco: 'Sax' | 'Maya';
        dareeris: 'Sax' | 'Maya';
        completedLines: number;
        targetLines: number;
        hasExited?: boolean;
        exitTime?: string;
        note: string;
      }
    >
  >({});

  const [exitToast, setExitToast] = useState<string | null>(null);

  // Handle Student Exit Action with Push Notification & SMS Pipeline
  const handleConfirmStudentExit = async (student: Student) => {
    const exitTimeStr = new Date().toLocaleTimeString('so-SO', { hour: '2-digit', minute: '2-digit' });

    setStudentStates((prev) => ({
      ...prev,
      [student.id]: {
        ...(prev[student.id] || {
          attendance: 'Present',
          cashar: 'Sax',
          subax: 'Sax',
          murajaaco: 'Sax',
          dareeris: 'Sax',
          completedLines: 30,
          targetLines: 30,
          note: '',
        }),
        hasExited: true,
        exitTime: exitTimeStr,
      },
    }));

    // Trigger Student Exit Engine
    const res = await triggerStudentExitNotification({
      student,
      exitDate: todayDateStr,
      exitTime: exitTimeStr,
      teacherName: currentUser?.name || 'Macallinka',
      settings,
    });

    setExitToast(res.notice);
    setTimeout(() => setExitToast(null), 5000);
  };

  // Initialize student state from existing records or defaults
  useEffect(() => {
    const newStates: typeof studentStates = {};

    teacherStudents.forEach((st) => {
      const existingAtt = attendanceRecords.find(
        (a) => a.studentId === st.id && a.date === todayDateStr
      );

      newStates[st.id] = {
        attendance: (existingAtt?.status as any) || 'Present',
        cashar: (existingAtt?.casharStatus as any) || 'Sax',
        subax: (existingAtt?.subaxStatus as any) || 'Sax',
        murajaaco: 'Sax',
        dareeris: (existingAtt?.dareerisStatus as any) || 'Sax',
        completedLines: st.dailyLinesTarget || 30,
        targetLines: st.dailyLinesTarget || 30,
        note: existingAtt?.note || '',
      };
    });

    setStudentStates(newStates);
  }, [teacherStudents, attendanceRecords, todayDateStr]);

  // Toggle handlers for 1-tap matrix
  const toggleAttendance = (studentId: string, status: 'Present' | 'Absent' | 'Excused' | 'Late') => {
    setStudentStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        attendance: status,
      },
    }));
  };

  const toggleMetric = (studentId: string, field: 'cashar' | 'subax' | 'murajaaco' | 'dareeris') => {
    setStudentStates((prev) => {
      const currentVal = prev[studentId]?.[field] || 'Sax';
      const newVal = currentVal === 'Sax' ? 'Maya' : 'Sax';
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: newVal,
        },
      };
    });
  };

  const updateLines = (studentId: string, delta: number) => {
    setStudentStates((prev) => {
      const cur = prev[studentId]?.completedLines || 30;
      const target = prev[studentId]?.targetLines || 30;
      const nextVal = Math.max(0, Math.min(target, cur + delta));
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          completedLines: nextVal,
        },
      };
    });
  };

  // Bulk Save Handler
  const handleSaveAll = () => {
    let savedCount = 0;

    teacherStudents.forEach((st) => {
      const stState = studentStates[st.id];
      if (!stState) return;

      const attRecord: AttendanceRecord = {
        id: `att_${st.id}_${todayDateStr}_${activeShift.id}`,
        studentId: st.id,
        studentName: st.fullName,
        classId: st.classId || 'class-1',
        className: st.className,
        groupId: st.groupId,
        groupName: st.groupName,
        date: todayDateStr,
        status: stState.attendance,
        casharStatus: stState.cashar,
        subaxStatus: stState.subax,
        dareerisStatus: stState.dareeris,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        loggedBy: currentUser.name,
        updatedAt: new Date().toISOString(),
        note: stState.note,
      };

      onSaveAttendance(attRecord);
      savedCount++;
    });

    // Audit log
    logAuditAction(
      currentUser,
      'Class Mode Save All',
      'attendance',
      `Macallin ${currentUser.name} wuxuu kaydiyay xaadiriska & casharrada ${savedCount} arday ah (${activeShift.name}).`
    );

    setSaveToast(`✅ Waad ku guulaysatay! Xogta ${savedCount} arday ah waa la kaydiyay.`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Exit Toast Banner */}
      {exitToast && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-3 animate-fade-in text-xs font-black">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{exitToast}</span>
          </div>
          <button
            onClick={() => setExitToast(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: Real-Time Timer & Active Shift Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider">
                  🔴 CLASS MODE ACTIVE
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {getSomaliDayName(now)} • {todayDateStr}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                {activeShift.name} ({activeShift.startTime} - {activeShift.endTime})
              </h2>
            </div>
          </div>

          {/* Real-time Countdown Timer */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Waqtiga Ka Dhiman Fasalka
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
                {formatRemainingTime(remainingSeconds)}
              </span>
            </div>
            <div className="w-2 h-8 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Teacher Info & Class Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Macallin: <strong>{currentUser.name}</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-white">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Ardayda Fasalka: <strong>{teacherStudents.length} Arday</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOffline ? (
              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg font-bold flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Mode (Auto-Sync)</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online (Synced)</span>
              </span>
            )}

            <button
              onClick={onEndClassSession}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              End Class Session
            </button>
          </div>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs font-bold animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            onClick={() => setSaveToast(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Raadi magaca ama ID-ga ardayga..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-xs font-medium"
          />
        </div>

        <button
          onClick={handleSaveAll}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>KAYDI DHAMMAAN (SAVE CLASS DATA)</span>
        </button>
      </div>

      {/* 1-Tap Matrix Student List (Portrait & Compact Mobile Optimized) */}
      <div className="space-y-3">
        {teacherStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Ma jiro arday laga helay guruubkan</h3>
            <p className="text-xs text-slate-500">
              Hubi inaad u xilsaartay macallinka ama dooro guruub ka mid ah kuwa kor ku qoran.
            </p>
          </div>
        ) : (
          teacherStudents.map((st, idx) => {
            const stState = studentStates[st.id] || {
              attendance: 'Present',
              cashar: 'Sax',
              subax: 'Sax',
              murajaaco: 'Sax',
              dareeris: 'Sax',
              completedLines: st.dailyLinesTarget || 30,
              targetLines: st.dailyLinesTarget || 30,
              note: '',
            };

            const isPresent = stState.attendance === 'Present';
            const curLessonNum = st.currentAyah || 25;
            const curLessonName = st.currentSurah || `Casharka ${curLessonNum}-aad`;
            const evalStatus: LessonStatus = isPresent ? (stState.cashar === 'Sax' ? 'Completed' : 'Failed/Repeat') : 'Pending';
            const lessonProgression = computeLessonProgression(curLessonNum, curLessonName, evalStatus, todayDateStr);

            return (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border transition-all shadow-xs space-y-3 ${
                  isPresent ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                {/* Header: Student Name & ID + Attendance Toggle */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 font-black text-[11px] text-slate-700 flex items-center justify-center shrink-0 border border-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-tight flex items-center gap-2">
                        <span>{st.fullName}</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Juz {st.currentJuz}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ID: <strong className="text-slate-800">{st.studentId}</strong> • Waalid: {st.parentPhone}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Single-Tap Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => toggleAttendance(st.id, 'Present')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        stState.attendance === 'Present'
                          ? 'bg-[#0e7a48] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>✓ Xaadir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAttendance(st.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        stState.attendance === 'Absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>× Maqan</span>
                    </button>
                  </div>
                </div>

                {/* 1-Tap Matrix metrics: Cashar, Subax, Murajaaco, Dareeris */}
                {isPresent && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                    {/* Metric 1: Cashar */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block uppercase">Cashar</span>
                        <span className="text-xs font-black text-slate-800">
                          {stState.cashar === 'Sax' ? '✓ Wuu Gutay' : '× Ma Gutin'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMetric(st.id, 'cashar')}
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                          stState.cashar === 'Sax'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {stState.cashar === 'Sax' ? '✓' : '×'}
                      </button>
                    </div>

                    {/* Metric 2: Subac */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block uppercase">Subac</span>
                        <span className="text-xs font-black text-slate-800">
                          {stState.subax === 'Sax' ? '✓ Wuu Galay' : '× Ma Galin'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMetric(st.id, 'subax')}
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                          stState.subax === 'Sax'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {stState.subax === 'Sax' ? '✓' : '×'}
                      </button>
                    </div>

                    {/* Metric 3: Murajaaco */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block uppercase">Murajaaco</span>
                        <span className="text-xs font-black text-slate-800">
                          {stState.murajaaco === 'Sax' ? '✓ Wuu Sameeyay' : '× Ma Samayn'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMetric(st.id, 'murajaaco')}
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                          stState.murajaaco === 'Sax'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {stState.murajaaco === 'Sax' ? '✓' : '×'}
                      </button>
                    </div>

                    {/* Metric 4: Dareeris */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block uppercase">Dareeris</span>
                        <span className="text-xs font-black text-slate-800">
                          {stState.dareeris === 'Sax' ? '✓ Wuu Gutay' : '× Ma Gutin'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMetric(st.id, 'dareeris')}
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                          stState.dareeris === 'Sax'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {stState.dareeris === 'Sax' ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Automatic Lesson Progression Preview Banner */}
                {isPresent && (
                  <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs ${
                    evalStatus === 'Completed'
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : evalStatus === 'Failed/Repeat'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 shrink-0 text-[#0e7a48]" />
                      <span>Maanta: <strong>{curLessonName}</strong> ({evalStatus === 'Completed' ? '✓ Wuu ka baxay' : '× Kama bixin'})</span>
                    </div>
                    <div className="sm:text-right font-black">
                      <span>➔ Maalinta waxbarashada xigta ({getSomaliDayName(new Date(lessonProgression.nextLessonDate))} {lessonProgression.nextLessonDate}): </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-900 inline-block mt-1 sm:mt-0">
                        {lessonProgression.nextLessonName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Target Lines (Sadaraa) Engine */}
                {isPresent && (
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Target-ka Sadarrada Maanta (Daily Lines)
                      </span>
                      <span className="text-xs font-black text-emerald-950 block">
                        {stState.completedLines} / {stState.targetLines} Sadar
                        {stState.completedLines < stState.targetLines && (
                          <span className="text-rose-600 font-bold ml-2">
                            ({stState.targetLines - stState.completedLines} sadar ayaa ka dhiman)
                          </span>
                        )}
                        {stState.completedLines === stState.targetLines && (
                          <span className="text-emerald-700 font-bold ml-2">✓ Target-kii wuu dhameeyay!</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateLines(st.id, -5)}
                        className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 font-black text-xs rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer"
                        title="-5 sadar"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLines(st.id, 5)}
                        className="w-8 h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-lg shadow-xs flex items-center justify-center cursor-pointer"
                        title="+5 sadar"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                )}

                {/* Student Class Exit Confirmation Action & Status */}
                {isPresent && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {stState.hasExited ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs rounded-xl shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-[#0e7a48]" />
                          <span>Wuu Baxay ({stState.exitTime}) — Waalidka waxaa loo diray Notification + SMS</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          Weli fasalka wuu joogaa
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmStudentExit(st)}
                      disabled={stState.hasExited}
                      className={`px-3.5 py-2 font-black text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                        stState.hasExited
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-400'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>{stState.hasExited ? '✓ Ogeysiisku Wuu Baxay' : '✓ Ardaygu Wuu Baxay (Ogeysii Waalidka)'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
