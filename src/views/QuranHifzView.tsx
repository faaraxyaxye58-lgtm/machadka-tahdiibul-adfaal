import React, { useState } from 'react';
import { HifzRecord, Student, HifzGrade, User, SchoolSettings } from '../types';
import {
  BookMarked,
  Plus,
  Search,
  Award,
  CheckCircle2,
  BookOpen,
  Calendar,
  X,
  Edit2,
  Trash2,
  Printer,
  Sparkles,
  Check,
  Settings2,
  Zap,
  XCircle,
} from 'lucide-react';
import { QuranMushafReader } from '../components/QuranMushafReader';
import { MuallimQiraahBook } from '../components/MuallimQiraahBook';
import { PrintQuranCertificateModal } from '../components/PrintQuranCertificateModal';
import { QURAN_SURAHS } from '../data/quranSurahsData';
import {
  getStudentQuranLesson,
  processAutomaticHifzCheck,
  getSurahByAnyName,
  isWeeklyPlanCompleted,
  sendParentHambalyoNotification,
} from '../utils/quranAutomation';

interface QuranHifzViewProps {
  currentUser?: User | null;
  hifzRecords: HifzRecord[];
  students: Student[];
  settings?: SchoolSettings;
  onAddHifzRecord: (rec: Omit<HifzRecord, 'id'>) => void;
  onUpdateHifzRecord?: (rec: HifzRecord) => void;
  onDeleteHifzRecord?: (id: string) => void;
  onUpdateStudent?: (student: Student) => void;
  isOpenModal: boolean;
  setIsOpenModal: (open: boolean) => void;
}

export const QuranHifzView: React.FC<QuranHifzViewProps> = ({
  currentUser,
  hifzRecords,
  students,
  settings,
  onAddHifzRecord,
  onUpdateHifzRecord,
  onDeleteHifzRecord,
  onUpdateStudent,
  isOpenModal,
  setIsOpenModal,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  const isStrictAdmin = currentUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [activeHifzTab, setActiveHifzTab] = useState<'auto' | 'records' | 'mushaf' | 'muallim'>('auto');
  
  // Feedback toast banner state
  const [lastActionLog, setLastActionLog] = useState<{
    type: 'approve' | 'reject';
    message: string;
  } | null>(null);

  // Initial student Hifz setup modal state
  const [setupStudent, setSetupStudent] = useState<Student | null>(null);
  const [setupSurahName, setSetupSurahName] = useState('Surah Al-Baqarah');
  const [setupAyah, setSetupAyah] = useState(1);
  const [setupDailyLines, setSetupDailyLines] = useState(30);

  // Manual record edit modal
  const [editingRecord, setEditingRecord] = useState<HifzRecord | null>(null);
  const [selectedCertificateStudent, setSelectedCertificateStudent] = useState<{
    student: Student;
    record?: HifzRecord;
  } | null>(null);

  // Form states for manual record
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [subaxSurah, setSubaxSurah] = useState('Surah Yasin');
  const [subaxAyahFrom, setSubaxAyahFrom] = useState(1);
  const [subaxAyahTo, setSubaxAyahTo] = useState(30);
  const [sabqiJuz, setSabqiJuz] = useState(22);
  const [manzilJuz, setManzilJuz] = useState(15);
  const [grade, setGrade] = useState<HifzGrade>('Mumtaaz');
  const [teacherNote, setTeacherNote] = useState('');

  // Handle automatic one-tap check
  const handleAutoCheck = async (student: Student, action: 'approve' | 'reject') => {
    const { updatedStudent, newRecord, message } = processAutomaticHifzCheck(student, action);

    // Save history record
    onAddHifzRecord(newRecord);

    // Update student position
    if (onUpdateStudent) {
      onUpdateStudent(updatedStudent);
    }

    let finalMessage = message;

    if (action === 'approve') {
      const weeklyStatus = isWeeklyPlanCompleted(student, hifzRecords, newRecord);
      if (weeklyStatus.isCompleted) {
        // Send automatic 'Hambalyo' notification to Parent Dashboard
        await sendParentHambalyoNotification(updatedStudent, {
          surah: newRecord.subaxSurah,
          lines: student.dailyLinesTarget || 30,
          fromAyah: newRecord.subaxAyahFrom,
          toAyah: newRecord.subaxAyahTo,
        });

        finalMessage += `\n\n🎉 HAMBALYO! Ardaygu wuxuu si guul leh u dhammaystay qorshaha xifdiga usbuuca (${weeklyStatus.reason})! Ogeysiis Hambalyo ah ayaa si toos ah loo gaarsiiyay Parent Dashboard-ka!`;
      }
    }

    // Show feedback banner
    setLastActionLog({
      type: action,
      message: finalMessage,
    });

    // Auto dismiss feedback banner after 6s
    setTimeout(() => {
      setLastActionLog(null);
    }, 6000);
  };

  // Explicitly send Hambalyo (Congratulations) notification to parent
  const handleSendManualHambalyo = async (student: Student) => {
    const { currentLesson } = getStudentQuranLesson(student);
    await sendParentHambalyoNotification(student, {
      surah: currentLesson.surahName,
      lines: currentLesson.lines,
      fromAyah: currentLesson.fromAyah,
      toAyah: currentLesson.toAyah,
    });

    setLastActionLog({
      type: 'approve',
      message: `🎉 HAMBALYO WAA LOO DIRAY WAALIDKA!\nOgeysiis 'Hambalyo' ah oo ku saabsan xifdiga ardayga (${student.fullName}) ayaa si toos ah loo gaarsiiyay Parent Dashboard-ka!`,
    });

    setTimeout(() => {
      setLastActionLog(null);
    }, 6000);
  };

  // Open initial setup modal
  const openSetupModal = (student: Student) => {
    setSetupStudent(student);
    setSetupSurahName(student.currentSurah || 'Surah Al-Baqarah');
    setSetupAyah(student.currentAyah || 1);
    setSetupDailyLines(student.dailyLinesTarget || 30);
  };

  // Save student setup
  const handleSaveStudentSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupStudent || !onUpdateStudent) return;

    const surahMeta = getSurahByAnyName(setupSurahName);
    const updated: Student = {
      ...setupStudent,
      currentSurah: `Surah ${surahMeta.nameEnglish}`,
      currentAyah: Math.max(1, setupAyah),
      dailyLinesTarget: Math.max(1, setupDailyLines),
      currentJuz: surahMeta.juz,
    };

    onUpdateStudent(updated);
    setSetupStudent(null);
    setLastActionLog({
      type: 'approve',
      message: `⚙️ Qorshaha xifdiga ardayga ${updated.fullName} waa la cusboonaysiiyay!\n- Suuradda: ${updated.currentSurah}\n- Aayadda Billaawga: ${updated.currentAyah}\n- Sadarrada Maalintii: ${updated.dailyLinesTarget} Sadar`,
    });
  };

  // Unique classes for filter
  const uniqueClasses = Array.from(new Set(students.map((s) => s.className))).filter(Boolean);

  // Filter students for auto matrix
  const filteredStudentsForAuto = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.currentSurah && s.currentSurah.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchClass = filterClass === 'all' || s.className === filterClass;
    return matchSearch && matchClass;
  });

  const openEditModal = (rec: HifzRecord) => {
    setEditingRecord(rec);
    setSelectedStudentId(rec.studentId);
    setSubaxSurah(rec.subaxSurah);
    setSubaxAyahFrom(rec.subaxAyahFrom);
    setSubaxAyahTo(rec.subaxAyahTo);
    setSabqiJuz(rec.sabqiJuz);
    setManzilJuz(rec.manzilJuz);
    setGrade(rec.grade);
    setTeacherNote(rec.teacherNote || '');
  };

  const filteredRecords = hifzRecords.filter((r) => {
    if (currentUser?.role === 'student') {
      const isMe =
        r.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        r.studentId.toLowerCase() === currentUser.username.toLowerCase();
      if (!isMe) return false;
    } else if (currentUser?.role === 'parent') {
      const myChildren = students.filter(
        (s) =>
          s.parentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          (currentUser.phone && s.parentPhone.includes(currentUser.phone))
      );
      const childNames = myChildren.map((c) => c.fullName.toLowerCase());
      const isMyChild = childNames.some((nm) => r.studentName.toLowerCase().includes(nm));
      if (!isMyChild && myChildren.length > 0) return false;
    }

    return (
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subaxSurah.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selStudent = students.find((s) => s.id === selectedStudentId);
    const stName = selStudent ? selStudent.fullName : 'Arday';

    if (editingRecord) {
      if (onUpdateHifzRecord) {
        onUpdateHifzRecord({
          ...editingRecord,
          studentId: selectedStudentId,
          studentName: stName,
          subaxSurah,
          subaxAyahFrom,
          subaxAyahTo,
          sabqiJuz,
          manzilJuz,
          grade,
          teacherNote,
        });
      }
      setEditingRecord(null);
    } else {
      onAddHifzRecord({
        studentId: selectedStudentId,
        studentName: stName,
        date: new Date().toISOString().split('T')[0],
        subaxSurah,
        subaxAyahFrom,
        subaxAyahTo,
        sabqiJuz,
        manzilJuz,
        grade,
        teacherNote,
      });
      setIsOpenModal(false);
    }

    setTeacherNote('');
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 p-5 rounded-2xl text-white shadow-lg border border-amber-400/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Nidaamka Otomaatiga Ah (Automatic Hifz Engine)</span>
          </div>
          <h2 className="text-xl font-black text-amber-200">
            📖 Xifdinta Qur'aanka Kariimka
          </h2>
          <p className="text-xs text-emerald-100 max-w-2xl">
            Macallinku kaliya wuxuu taabanayaa <strong>✓ Ansixi</strong> ama <strong>✗ Qalad</strong>. System-ku isaga ayaa otomaatig u xisaabinaya 30-ka sadar, u gudbinta suuradda xigta, iyo kaydinta history-ga.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setTeacherNote('');
            setIsOpenModal(true);
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Gacanta ku Diiwaangeli</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="mobile-tab-scroll pb-2 border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setActiveHifzTab('auto')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeHifzTab === 'auto'
              ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>⚡ 1-Tap Otomaatig</span>
        </button>

        <button
          onClick={() => setActiveHifzTab('records')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeHifzTab === 'records'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookMarked className="w-4 h-4 text-amber-400" />
          <span>Diiwaanka History-ga</span>
        </button>

        <button
          onClick={() => setActiveHifzTab('mushaf')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeHifzTab === 'mushaf'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Mus'haf Readers (114 Surah)</span>
        </button>

        <button
          onClick={() => setActiveHifzTab('muallim')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeHifzTab === 'muallim'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>📚 Buugga Qaaciydada</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {lastActionLog && (
        <div
          className={`p-4 rounded-2xl border shadow-md flex items-start justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            lastActionLog.type === 'approve'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {lastActionLog.type === 'approve' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="whitespace-pre-line font-bold leading-relaxed">{lastActionLog.message}</div>
          </div>
          <button
            onClick={() => setLastActionLog(null)}
            className="text-white/70 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AUTOMATED TAB (1-TAP AUTO ENGINE) */}
      {activeHifzTab === 'auto' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Raadi arday, ID ama Surah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
              >
                <option value="all">Dhammaan Fasallada</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ardayda Hadda: <strong>{filteredStudentsForAuto.length}</strong></span>
            </div>
          </div>

          {/* AUTOMATED STUDENTS MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStudentsForAuto.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 font-bold text-xs space-y-2">
                <BookMarked className="w-8 h-8 mx-auto text-slate-300" />
                <p>Lama helin arday ku habboon raadintaada.</p>
              </div>
            ) : (
              filteredStudentsForAuto.map((std) => {
                const { currentLesson } = getStudentQuranLesson(std);

                return (
                  <div
                    key={std.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3.5 flex flex-col justify-between"
                  >
                    {/* Student Info & Current Lesson Target */}
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0">
                            {std.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate" title={std.fullName}>
                              {std.fullName}
                            </h4>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                              <span>ID: {std.studentId}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">{std.className}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openSetupModal(std)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Beddel Suuradda, Aayadda ama Sadarrada Maalintii"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Lesson Prepared Box */}
                      <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-black text-emerald-900 tracking-wider">
                          <span>CASHARKA MAANTA (AUTOMATIC)</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-950 font-bold">
                            {currentLesson.lines} Sadar
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">
                              {currentLesson.surahName} ({currentLesson.surahArabic})
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 block mt-0.5">
                              Aayadda {currentLesson.fromAyah} ilaa {currentLesson.toAyah}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300 block">
                              Juz {currentLesson.juz}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Teacher 1-Tap Action Buttons */}
                    <div className="pt-1 border-t border-slate-100 space-y-2">
                      <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">
                        Taabo Hal-mar ah (One-Tap Action)
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* APPROVE (✓ Ansixi) */}
                        <button
                          type="button"
                          onClick={() => handleAutoCheck(std, 'approve')}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-emerald-500"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>✓ Ansixi</span>
                        </button>

                        {/* REJECT (✗ Qalad) */}
                        <button
                          type="button"
                          onClick={() => handleAutoCheck(std, 'reject')}
                          className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-rose-500"
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                          <span>✗ Qalad</span>
                        </button>
                      </div>

                      {/* Explicit Hambalyo Notification to Parent */}
                      <button
                        type="button"
                        onClick={() => handleSendManualHambalyo(std)}
                        className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] rounded-lg border border-amber-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="U dir ogeysiis 'Hambalyo' ah Parent Dashboard-ka waalidka"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>🎉 Dir Hambalyo Waalidka</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SETUP INITIAL STUDENT HIFZ MODAL */}
      {setupStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 bg-emerald-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                <span>Qorshaynta Xifdiga: {setupStudent.fullName}</span>
              </h3>
              <button
                onClick={() => setSetupStudent(null)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSetup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Suuradda uu Hadda Joogo *
                </label>
                <select
                  value={setupSurahName}
                  onChange={(e) => setSetupSurahName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {QURAN_SURAHS.map((s) => (
                    <option key={s.number} value={`Surah ${s.nameEnglish}`}>
                      Surah {s.number}: {s.nameEnglish} ({s.nameArabic}) - Juz {s.juz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Aayadda Billaawga *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={setupAyah}
                    onChange={(e) => setSetupAyah(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sadaraha Maalintii (Quota) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="30"
                    value={setupDailyLines}
                    onChange={(e) => setSetupDailyLines(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Tusaale: 30 Sadar = ~2 Page</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Sida Otomaatiggu U Shaqeyn doono:</strong> System-ku wuxuu maalin kasta {setupStudent.fullName.split(' ')[0]} u diyaarinayaa <strong>{setupDailyLines} Sadar</strong> oo bilaabanaya aayadda sare. Tusaale marka macallinku taabto <strong>✓ Ansixi</strong>, si otomaatig ah ayaa loogu gudbin doonaa sadarrada xiga!
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSetupStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Keydi Qorshaha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeHifzTab === 'mushaf' ? (
        <QuranMushafReader />
      ) : activeHifzTab === 'muallim' ? (
        <MuallimQiraahBook />
      ) : activeHifzTab === 'records' ? (
        <>
          {/* Student Progress Cards Row */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Horumarka Juz-yada Ardayda Hada (30 Juz Grid)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {students.slice(0, 4).map((s) => {
                const juzPercentage = Math.round((s.currentJuz / 30) * 100);
                return (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{s.fullName}</span>
                      <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                        Juz {s.currentJuz}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{s.currentSurah}</div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${juzPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[9px] text-emerald-700 font-semibold">
                        {juzPercentage}% Dhameeyay
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCertificateStudent({ student: s })}
                          className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-black rounded flex items-center gap-1 cursor-pointer shadow-2xs transition-transform active:scale-95"
                          title="Daabac Shahaadada Xifdiska Qur'aanka"
                        >
                          <Award className="w-2.5 h-2.5 text-slate-950" />
                          <span>Shahaado 🎓</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter / Search */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi magaca ardayga ama Surah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Hifz History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800">
                    <th className="p-3">Taariikhda & Ardayga</th>
                    <th className="p-3">Subaxda Cusub (Sabaq)</th>
                    <th className="p-3">Sabqi (Dhow)</th>
                    <th className="p-3">Manzil / Amshax</th>
                    <th className="p-3">Darajada (Grade)</th>
                    <th className="p-3">Faallada Macallinka</th>
                    <th className="p-3 text-right">Ficillo (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.studentName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{r.date}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          {r.subaxSurah}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Aayadaha: {r.subaxAyahFrom} ilaa {r.subaxAyahTo}
                        </div>
                      </td>

                      <td className="p-3 font-bold text-slate-800">Juz {r.sabqiJuz}</td>
                      <td className="p-3 font-bold text-slate-800">Juz {r.manzilJuz}</td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            r.grade === 'Mumtaaz'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.grade === 'Jayid Jiddan'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          ★ {r.grade}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 italic">
                        {r.teacherNote ? `"${r.teacherNote}"` : '-'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              const matchedStudent = students.find(s => s.id === r.studentId) || {
                                id: r.studentId,
                                studentId: r.studentId,
                                fullName: r.studentName,
                                className: 'Qur\'an Class',
                                gender: 'Male' as const,
                                parentName: 'Waalid',
                                parentPhone: '',
                                feeStatus: 'Paid' as const,
                                currentSurah: r.subaxSurah,
                                currentJuz: r.sabqiJuz,
                                feeMonthly: 0,
                                enrolledDate: r.date,
                              };
                              setSelectedCertificateStudent({ student: matchedStudent, record: r });
                            }}
                            className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300/60 rounded cursor-pointer transition-colors"
                            title="Daabac Shahaadada Xifdiska Qur'aanka"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Wax ka beddel Casharka"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteHifzRecord && (
                            <button
                              onClick={() => onDeleteHifzRecord(r.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Tirtir Casharka"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Add / Edit Hifz Record Modal */}
      {(isOpenModal || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-400" />
                <span>{editingRecord ? 'Wax ka beddel Casharka Xifdiga (Edit)' : 'Duub Diiwaanka Xifdiga Maanta'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenModal(false);
                  setEditingRecord(null);
                }}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dooro Ardayga *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Surah Subaxda *</label>
                  <input
                    type="text"
                    required
                    placeholder="Surah Yasin"
                    value={subaxSurah}
                    onChange={(e) => setSubaxSurah(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aayada Ka</label>
                  <input
                    type="number"
                    min={1}
                    value={subaxAyahFrom}
                    onChange={(e) => setSubaxAyahFrom(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aayada Ilaa</label>
                  <input
                    type="number"
                    min={1}
                    value={subaxAyahTo}
                    onChange={(e) => setSubaxAyahTo(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sabqi (Juz #)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={sabqiJuz}
                    onChange={(e) => setSabqiJuz(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Manzil / Amshax (Juz #)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={manzilJuz}
                    onChange={(e) => setManzilJuz(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Darajada (Grade)</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as HifzGrade)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Mumtaaz">Mumtaaz (Excellent)</option>
                  <option value="Jayid Jiddan">Jayid Jiddan (Very Good)</option>
                  <option value="Jayid">Jayid (Good)</option>
                  <option value="Daciif">Daciif (Needs Revision)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aroos ama Faallada Macallinka
                </label>
                <input
                  type="text"
                  placeholder="Aad u fiican, Tajwiidka sii adkee..."
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Keydi Isbeddelka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Certificate Modal */}
      {selectedCertificateStudent && (
        <PrintQuranCertificateModal
          student={selectedCertificateStudent.student}
          hifzRecord={selectedCertificateStudent.record}
          settings={settings || {
            schoolName: "Tahdiib Al-Adfaal",
            schoolSubtitle: "Markazka Quraanka & Barbaarinta Ubadka",
            address: "Mogadishu, Somalia",
            academicYear: "2026 - 2027",
            currencySymbol: "$",
          }}
          onClose={() => setSelectedCertificateStudent(null)}
        />
      )}
    </div>
  );
};
