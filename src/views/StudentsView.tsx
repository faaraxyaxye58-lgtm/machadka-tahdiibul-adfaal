import React, { useState, useMemo, memo } from 'react';
import { Student, ClassRoom, ShiftType, Gender, SchoolSettings, User } from '../types';
import { getParentChildren } from '../utils/parentMatcher';
import { QURAN_SURAHS } from '../data/quranSurahsData';
import {
  Search,
  Plus,
  GraduationCap,
  Phone,
  User as UserIcon,
  BookOpen,
  Calendar,
  DollarSign,
  Printer,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  HeartHandshake,
  CheckCircle,
  Book,
  ChevronDown,
  Sparkles,
  Layers,
  Camera,
  Upload,
  RotateCw,
  Check,
  Smartphone,
  QrCode,
} from 'lucide-react';

import { formatMoney, isFinancialDataHidden } from '../utils/moneyUtils';
import { PrintDigitalIDCardModal } from '../components/PrintDigitalIDCardModal';

const BOOK_LEVEL_OPTIONS = [
  'Fasalka 1-aad',
  'Fasalka 2-aad',
  'Fasalka 3-aad',
  'Fasalka 4-aad',
  'Fasalka 5-aad',
  'Fasalka 6-aad',
  'Fasalka 7-aad',
  'Fasalka 8-aad',
  'Fasalka 9-aad',
  'Ma Dhigto / Bilaa Buug',
];

interface StudentsViewProps {
  currentUser?: User | null;
  students: Student[];
  classes: ClassRoom[];
  settings: SchoolSettings;
  onAddStudent: (student: Omit<Student, 'id' | 'studentId'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  isOpenAddModal: boolean;
  setIsOpenAddModal: (open: boolean) => void;
  isMoneyHidden?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = memo(({
  currentUser,
  students,
  classes,
  settings,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  isOpenAddModal,
  setIsOpenAddModal,
  isMoneyHidden = false,
}) => {
  const shouldHideMoney = isFinancialDataHidden(currentUser, settings, isMoneyHidden);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);

  // Add/Edit Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [age, setAge] = useState<number>(10);
  const [dob, setDob] = useState('2016-05-12');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+252 61 ');
  const [parentRelation, setParentRelation] = useState<'Aabe' | 'Hooyo' | 'Masuul'>('Aabe');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [shift, setShift] = useState<ShiftType>('Subax');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentJuz, setCurrentJuz] = useState<number>(1);
  const [currentSurah, setCurrentSurah] = useState('Surah Al-Fatiha');
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [dailyLinesTarget, setDailyLinesTarget] = useState<number>(30);
  const [bookLevel, setBookLevel] = useState<string>('Fasalka 1-aad');
  const [photoUrl, setPhotoUrl] = useState('');
  const [feeMonthly, setFeeMonthly] = useState<number>(15);
  const [feePaid, setFeePaid] = useState<number>(15);
  const [feeRemaining, setFeeRemaining] = useState<number>(0);

  // Modal / Dropdown States for 114 Surahs and Book Level
  const [isSurahModalOpen, setIsSurahModalOpen] = useState(false);
  const [surahSearchTerm, setSurahSearchTerm] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Device Camera Capture State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'form' | 'profile'>('form');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCameraStream = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCameraStream();
    setCameraError(null);
    setIsCameraStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Moobaylkaaga ama Browser-kaagu ma taageero kaamirada tooska ah.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.message || 'Fadlan sii ogolaanshaha kaamirada (Camera Permission) ee browser-ka si aad sawirka u qabato.'
      );
    } finally {
      setIsCameraStarting(false);
    }
  };

  const openCameraModal = (target: 'form' | 'profile' = 'form') => {
    setCameraTarget(target);
    setIsCameraModalOpen(true);
    setTimeout(() => {
      startCameraStream('user');
    }, 150);
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCameraStream(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;
    const size = Math.min(width, height);

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const sx = (width - size) / 2;
      const sy = (height - size) / 2;

      if (cameraFacing === 'user') {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

      if (cameraTarget === 'form') {
        setPhotoUrl(dataUrl);
      } else if (cameraTarget === 'profile' && selectedStudent) {
        const updated = { ...selectedStudent, photoUrl: dataUrl };
        onUpdateStudent(updated);
        setSelectedStudent(updated);
      }

      closeCameraModal();
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'form' | 'profile' = 'form'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Sawirku waa inuu ka yaryahay 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        if (target === 'form') {
          setPhotoUrl(result);
        } else if (target === 'profile' && selectedStudent) {
          const updated = { ...selectedStudent, photoUrl: result };
          onUpdateStudent(updated);
          setSelectedStudent(updated);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFullName('');
    setGender('Male');
    setAge(10);
    setDob('2016-05-12');
    setParentName('');
    setParentPhone('+252 61 ');
    setParentRelation('Aabe');
    setClassId(classes[0]?.id || '');
    setShift('Subax');
    setEnrollmentDate(new Date().toISOString().split('T')[0]);
    setCurrentJuz(1);
    setCurrentSurah('Surah Al-Fatiha');
    setCurrentAyah(1);
    setDailyLinesTarget(30);
    setBookLevel('Fasalka 1-aad');
    setPhotoUrl('');
    setFeeMonthly(15);
    setFeePaid(15);
    setFeeRemaining(0);
    setIsSurahModalOpen(false);
    setSurahSearchTerm('');
    setIsBookModalOpen(false);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setGender(student.gender);
    setAge(student.age);
    setDob(student.dob || '2016-05-12');
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setParentRelation(student.parentRelation || 'Aabe');
    setClassId(student.classId);
    setShift(student.shift);
    setEnrollmentDate(student.enrollmentDate);
    setCurrentJuz(student.currentJuz || 1);
    setCurrentSurah(student.currentSurah || 'Surah Al-Fatiha');
    setCurrentAyah(student.currentAyah || 1);
    setDailyLinesTarget(student.dailyLinesTarget || 30);
    setBookLevel(student.bookLevel || 'Fasalka 1-aad');
    setPhotoUrl(student.photoUrl || '');
    setFeeMonthly(student.feeMonthly);
    setFeePaid(student.feePaid ?? (student.feeStatus === 'Paid' ? student.feeMonthly : 0));
    setFeeRemaining(student.feeRemaining ?? (student.feeStatus === 'Paid' ? 0 : student.feeMonthly));
  };

  const isAdmin = currentUser?.role === 'admin';
  const myChildren = useMemo(() => getParentChildren(currentUser, students), [currentUser, students]);
  const myChildIds = useMemo(() => myChildren.map((c) => c.id), [myChildren]);

  // Admin-only Lesson Progression Handlers
  const handleAdvanceBookLevel = (student: Student) => {
    if (!isAdmin) {
      alert('Kaliya Admin-ka ayaa casharka ama fasalka ardayga beddeli kara.');
      return;
    }
    const currentLvl = student.bookLevel || 'Fasalka 1-aad';
    const currIndex = BOOK_LEVEL_OPTIONS.indexOf(currentLvl);

    if (currIndex !== -1 && currIndex < BOOK_LEVEL_OPTIONS.length - 2) {
      const nextLevel = BOOK_LEVEL_OPTIONS[currIndex + 1];
      const updatedStudent: Student = {
        ...student,
        bookLevel: nextLevel,
      };
      onUpdateStudent(updatedStudent);
      if (selectedStudent?.id === student.id) {
        setSelectedStudent(updatedStudent);
      }
      alert(`🎉 CUSBOONAYSIIN / FASALKA XIGA!\n\nArdayga ${student.fullName} waxaa loo gudbiyay: ${nextLevel}`);
    } else {
      alert(`ℹ️ Ardayga ${student.fullName} wuxuu marayaa fasalka ugu sareeya ee buugga (${currentLvl}).`);
    }
  };

  const handleAdvanceSurah = (student: Student) => {
    if (!isAdmin) {
      alert('Kaliya Admin-ka ayaa casharka ama suuradda ardayga beddeli kara.');
      return;
    }

    let currentIndex = QURAN_SURAHS.findIndex(
      (s) =>
        `Surah ${s.nameEnglish}` === student.currentSurah ||
        `Surah ${s.number}: ${s.nameEnglish}` === student.currentSurah ||
        (student.currentSurah && student.currentSurah.toLowerCase().includes(s.nameEnglish.toLowerCase()))
    );

    if (currentIndex === -1) currentIndex = 0;

    if (currentIndex < QURAN_SURAHS.length - 1) {
      const nextSurah = QURAN_SURAHS[currentIndex + 1];
      const nextSurahName = `Surah ${nextSurah.nameEnglish}`;
      const updatedStudent: Student = {
        ...student,
        currentSurah: nextSurahName,
        currentJuz: nextSurah.juz,
      };
      onUpdateStudent(updatedStudent);
      if (selectedStudent?.id === student.id) {
        setSelectedStudent(updatedStudent);
      }
      alert(
        `📖 SURADDA XIGTA EE QUR'AANKA!\n\nArdayga ${student.fullName} waxaa loo gudbiyay:\n- ${nextSurahName} (${nextSurah.nameArabic})\n- Juz ${nextSurah.juz}`
      );
    } else {
      alert(`👏 MASHALLAH!\n\nArdayga ${student.fullName} wuxuu dhameeyay dhammaan 114-ka Suuradood ee Qur'aanka Kariimka!`);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Role based restrictions
      if (currentUser?.role === 'parent') {
        const restrictParent = settings.privacyPermissions?.restrictParentToOwnChildrenOnly !== false;
        if (restrictParent && !myChildIds.includes(s.id)) return false;
      } else if (currentUser?.role === 'teacher') {
        const restrictTeacher = settings.privacyPermissions?.restrictTeacherToAssignedClassOnly !== false;
        if (restrictTeacher) {
          const myTeacherClasses = classes.filter(
            (c) =>
              c.teacherId === currentUser.id ||
              c.teacherName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
              currentUser.name.toLowerCase().includes(c.teacherName.toLowerCase())
          );
          if (myTeacherClasses.length > 0) {
            const isStudentInMyClass = myTeacherClasses.some(
              (tc) => s.classId === tc.id || s.className.toLowerCase().includes(tc.name.toLowerCase())
            );
            if (!isStudentInMyClass) return false;
          }
        }
      } else if (currentUser?.role === 'student') {
        const isMe =
          s.fullName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          s.studentId.toLowerCase() === currentUser.username.toLowerCase();
        if (!isMe) return false;
      }

      const matchesSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parentName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = filterClass === 'all' || s.classId === filterClass;
      const matchesShift = filterShift === 'all' || s.shift === filterShift;

      return matchesSearch && matchesClass && matchesShift;
    });
  }, [students, currentUser, myChildIds, searchTerm, filterClass, filterShift, classes, settings]);

  // Filter 114 Surahs for modal/dropdown search
  const filteredSurahsList = useMemo(() => {
    if (!surahSearchTerm.trim()) return QURAN_SURAHS;
    const q = surahSearchTerm.toLowerCase().trim();
    return QURAN_SURAHS.filter(
      (s) =>
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameSomali.toLowerCase().includes(q) ||
        s.nameArabic.includes(q) ||
        s.number.toString() === q
    );
  }, [surahSearchTerm]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selClass = classes.find((c) => c.id === classId);
    const rem = Math.max(0, feeMonthly - feePaid);
    const feeStatus = rem === 0 ? 'Paid' : rem < feeMonthly ? 'Pending' : 'Overdue';

    onAddStudent({
      fullName,
      gender,
      age,
      dob,
      parentName,
      parentPhone,
      parentRelation,
      classId,
      className: selClass ? selClass.name : 'Fasal A',
      shift,
      enrollmentDate,
      status: 'Active',
      currentJuz,
      currentSurah,
      currentAyah,
      dailyLinesTarget,
      bookLevel,
      photoUrl,
      feeMonthly,
      feePaid,
      feeRemaining: rem,
      feeStatus,
    });

    resetForm();
    setIsOpenAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const selClass = classes.find((c) => c.id === classId);
    const rem = Math.max(0, feeMonthly - feePaid);
    const feeStatus = rem === 0 ? 'Paid' : rem < feeMonthly ? 'Pending' : 'Overdue';

    onUpdateStudent({
      ...editingStudent,
      fullName,
      gender,
      age,
      dob,
      parentName,
      parentPhone,
      parentRelation,
      classId,
      className: selClass ? selClass.name : editingStudent.className,
      shift,
      enrollmentDate,
      currentJuz,
      currentSurah,
      currentAyah,
      dailyLinesTarget,
      bookLevel,
      photoUrl,
      feeMonthly,
      feePaid,
      feeRemaining: rem,
      feeStatus,
    });

    setEditingStudent(null);
    resetForm();
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#0e7a48]" />
            <span>Maamulka Ardayda Machadka (Student Management)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Diiwaanka guud ee ardayda, fasallada, xifdiga iyo xiriirka waalidiinta ({students.length} Arday)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setIsOpenAddModal(true);
            }}
            className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#d4af37]" />
            <span>+ Ku Dar Arday Cusub</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi magac, ID ama telka waalidka..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
          />
        </div>

        {/* Filter Class */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
        >
          <option value="all">Dhammaan Fasallada</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Filter Shift */}
        <select
          value={filterShift}
          onChange={(e) => setFilterShift(e.target.value)}
          className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
        >
          <option value="all">Dhammaan Waqtiyada (Shifts)</option>
          <option value="Subax">Subax</option>
          <option value="Galab">Galab</option>
          <option value="Habeen">Habeen</option>
        </select>
      </div>

      {/* Students List - Mobile Cards (sm:hidden) & Desktop Table (hidden sm:block) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile View - Cards */}
        <div className="block sm:hidden p-3 space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Lama helin arday ku habboon raadintaada.
            </div>
          ) : (
            filteredStudents.map((std) => {
              const paid = std.feePaid ?? (std.feeStatus === 'Paid' ? std.feeMonthly : 0);
              const remaining = std.feeRemaining ?? (std.feeStatus === 'Paid' ? 0 : std.feeMonthly);

              return (
                <div
                  key={std.id}
                  onClick={() => setSelectedStudent(std)}
                  className="p-3.5 bg-slate-50 hover:bg-green-50/40 border border-slate-200 rounded-xl space-y-2.5 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0e7a48]/10 border border-[#0e7a48]/30 flex items-center justify-center font-bold text-[#0e7a48] shrink-0 overflow-hidden">
                        {std.photoUrl ? (
                          <img src={std.photoUrl} alt={std.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{std.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{std.fullName}</div>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          ID: {std.studentId} ● {std.gender === 'Male' ? 'Wiil' : 'Gabdho'} ({std.age} Jir)
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#d4af37]/20 text-[#8a7123] border border-[#d4af37]/40 shrink-0">
                      {std.className}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Qur'aanka & Buugga</span>
                      <span className="font-bold text-[#8a7123]">Juz {std.currentJuz} / 30</span>
                      <span className="text-[10px] text-slate-700 block font-semibold truncate">{std.currentSurah}</span>
                      <span className="text-[10px] text-[#0e7a48] block font-bold mt-0.5">📖 {std.bookLevel || 'Fasalka 1-aad'}</span>
                      {isAdmin && (
                        <div className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAdvanceBookLevel(std)}
                            className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-[#0e7a48] rounded text-[9px] font-bold cursor-pointer"
                            title="Admin: U Gudbi Fasalka Xiga ee Buugga"
                          >
                            Buugga ⏩
                          </button>
                          <button
                            onClick={() => handleAdvanceSurah(std)}
                            className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[9px] font-bold cursor-pointer"
                            title="Admin: U Gudbi Suuradda Xigta"
                          >
                            Surah ⏩
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Waalidka ({std.parentRelation || 'Waalid'})</span>
                      <span className="font-bold text-slate-800 block truncate">{std.parentName}</span>
                      <span className="text-[10px] text-[#0e7a48] font-mono font-bold block">{std.parentPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        remaining === 0
                          ? 'bg-green-100 text-[#0e7a48]'
                          : remaining < std.feeMonthly
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {formatMoney(paid, shouldHideMoney, settings.currency)} Bixiyay / {formatMoney(remaining, shouldHideMoney, settings.currency)} Baqiga
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setIdCardStudent(std)}
                        className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Soo saar Digital ID Card (QR Code)"
                      >
                        <QrCode className="w-3 h-3 text-slate-950" />
                        <span>ID Card</span>
                      </button>
                      <button
                        onClick={() => setSelectedStudent(std)}
                        className="px-2.5 py-1 bg-[#0e7a48] text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Profile
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(std)}
                            className="p-1 text-[#0e7a48] hover:bg-green-100 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(std.id)}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded cursor-pointer"
                            title="Tirtir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="bg-[#0e7a48] text-white font-bold border-b border-green-800">
                <th className="p-3 min-w-[180px]">Sawir & Magaca Ardayga</th>
                <th className="p-3">Fasalka & Shift</th>
                <th className="p-3">Qur'aanka & Buugga</th>
                <th className="p-3">Waalidka & Telka</th>
                <th className="p-3 min-w-[150px]">Lacagta (Bixiyay / Baqiga)</th>
                {isAdmin && <th className="p-3 text-center min-w-[120px]">Tallaabooyinka (Actions)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-500">
                    Lama helin arday ku habboon raadintaada.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const paid = std.feePaid ?? (std.feeStatus === 'Paid' ? std.feeMonthly : 0);
                  const remaining = std.feeRemaining ?? (std.feeStatus === 'Paid' ? 0 : std.feeMonthly);

                  return (
                    <tr
                      key={std.id}
                      onClick={() => setSelectedStudent(std)}
                      className="hover:bg-green-50/40 transition-colors group cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0e7a48]/10 border border-[#0e7a48]/30 flex items-center justify-center font-bold text-[#0e7a48] shrink-0 overflow-hidden">
                            {std.photoUrl ? (
                              <img src={std.photoUrl} alt={std.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{std.fullName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{std.fullName}</div>
                            <span className="font-mono text-[10px] text-slate-500">
                              ID: {std.studentId} ● {std.gender === 'Male' ? 'Wiil' : 'Gabdho'} ({std.age} Jir)
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{std.className}</div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-bold">
                          {std.shift}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#8a7123] border border-[#d4af37]/40">
                            Juz {std.currentJuz} / 30
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#0e7a48] border border-emerald-200">
                            📖 {std.bookLevel || 'Fasalka 1-aad'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 gap-1">
                          <span className="text-[10px] font-semibold text-slate-700 block truncate max-w-[130px]">{std.currentSurah}</span>
                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleAdvanceBookLevel(std)}
                                className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-[#0e7a48] rounded text-[9px] font-bold cursor-pointer"
                                title="Admin: U Gudbi Fasalka Xiga ee Buugga"
                              >
                                Buugga ⏩
                              </button>
                              <button
                                onClick={() => handleAdvanceSurah(std)}
                                className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[9px] font-bold cursor-pointer"
                                title="Admin: U Gudbi Suuradda Xigta"
                              >
                                Surah ⏩
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">
                          {std.parentName} <span className="text-[10px] text-slate-500">({std.parentRelation || 'Waalid'})</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#0e7a48] flex items-center gap-1 font-bold">
                          <Phone className="w-3 h-3 text-[#d4af37]" />
                          <span>{std.parentPhone}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              remaining === 0
                                ? 'bg-green-100 text-[#0e7a48]'
                                : remaining < std.feeMonthly
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {formatMoney(paid, shouldHideMoney, settings.currency)} Bixiyay / {formatMoney(remaining, shouldHideMoney, settings.currency)} Baqiga
                          </span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setIdCardStudent(std)}
                              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Soo saar Digital ID Card (QR Code)"
                            >
                              <QrCode className="w-3.5 h-3.5 text-slate-950" />
                              <span>ID Card</span>
                            </button>
                            <button
                              onClick={() => setSelectedStudent(std)}
                              className="px-2 py-1 bg-[#0e7a48] hover:bg-[#0b633a] text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                              title="Eeg Profile"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => openEditModal(std)}
                              className="p-1 text-[#0e7a48] hover:bg-green-50 rounded cursor-pointer"
                              title="Wax ka beddel (Edit)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteStudent(std.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                              title="Tirtir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isOpenAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between px-5 py-4 bg-[#0e7a48] text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#d4af37]" />
                <span>{editingStudent ? 'Wax ka beddel Xogta Ardayga' : 'Diiwaan-gelinta Arday Cusub'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenAddModal(false);
                  setEditingStudent(null);
                }}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingStudent ? handleEditSubmit : handleCreateSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* SECTION 1: XOGTA ARDAYGA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0e7a48] uppercase tracking-wider border-b pb-1">
                  1. Xogta Ardayga (Student Info)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Magaca oo Buuxa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Axmed Maxamed Cali"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0e7a48]" />
                        <span>Sawirka Ardayga (Student Photo / Device Camera)</span>
                      </span>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-[10px] text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Tirtir Sawirka</span>
                        </button>
                      )}
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {/* Avatar Preview */}
                      <div className="w-16 h-16 rounded-2xl bg-[#0e7a48]/10 border-2 border-[#0e7a48]/30 flex items-center justify-center text-[#0e7a48] font-bold text-xl overflow-hidden shrink-0 shadow-xs relative">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-8 h-8 text-[#0e7a48]/50" />
                        )}
                      </div>

                      {/* Photo Capture Controls */}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCameraModal('form')}
                            className="px-3 py-1.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>📸 Qabo Sawir (Kaamira)</span>
                          </button>

                          <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>📁 Soo Geli (Galeri)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'form')}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <input
                          type="text"
                          placeholder="E.g. https://example.com/photo.jpg ama toos uga qabo kaamirada..."
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jinsiga *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    >
                      <option value="Male">Wiil (Male)</option>
                      <option value="Female">Gabdho (Female)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Da'da (Age)</label>
                    <input
                      type="number"
                      min={4}
                      max={25}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Taariikhda Dhalashada</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Fasalka *</span>
                      {!isAdmin && settings.privacyPermissions?.restrictClassAndTeacherEditingToAdmin !== false && (
                        <span className="text-[10px] text-rose-600 font-bold">🔒 Admin Only</span>
                      )}
                    </label>
                    <select
                      value={classId}
                      disabled={!isAdmin && settings.privacyPermissions?.restrictClassAndTeacherEditingToAdmin !== false}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] disabled:opacity-75 disabled:bg-slate-100"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift-ka</label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value as ShiftType)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    >
                      <option value="Subax">Subax</option>
                      <option value="Galab">Galab</option>
                      <option value="Habeen">Habeen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Taariikhda Bilaabashada</label>
                    <input
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CASHARRADA BUUGGA & QUR'AANKA */}
              <div className="space-y-3 pt-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                  <h4 className="text-xs font-bold text-[#0e7a48] uppercase tracking-wider flex items-center gap-1.5">
                    <Book className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>2. Casharrada Buugga & Qur'aanka</span>
                  </h4>
                  {isAdmin ? (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Admin Only</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      🔒 Kaliya Admin-ka ayaa badali kara
                    </span>
                  )}
                </div>

                {!isAdmin && (
                  <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-900 font-semibold">
                    ⚠️ Qaybta casharrada waxaa wax ka beddeli kara oo kaliya Maamulaha (Admin).
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* BUUGGA مفتاح القراءة القرءانية */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Buugga مفتاح القراءة القرءانية *
                      </label>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsBookModalOpen(true)}
                          className="text-[10px] font-bold text-[#0e7a48] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3 h-3 text-[#d4af37]" />
                          <span>[ Modal / Dropdown ]</span>
                        </button>
                      )}
                    </div>

                    <select
                      disabled={!isAdmin}
                      value={bookLevel}
                      onChange={(e) => setBookLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white font-semibold text-slate-900 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] shadow-xs disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {BOOK_LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* JUZ-KA QUR'AANKA */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Juz-ka Qur'aanka (1 - 30)
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={currentJuz}
                      onChange={(e) => setCurrentJuz(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white font-semibold text-slate-900 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] shadow-xs disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => (
                        <option key={juzNum} value={juzNum}>
                          Juz {juzNum} / 30
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* QUR'AANKA KARIIMKA - 114 SURAHS */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Suuradda Qur'aanka Kariimka (114 Suuradood) *
                    </label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsSurahModalOpen(true)}
                        className="text-[10px] font-bold text-[#0e7a48] bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3 h-3 text-[#d4af37]" />
                        <span>🔍 Raadi Suurad (114 Surah)</span>
                      </button>
                    )}
                  </div>

                  <select
                    disabled={!isAdmin}
                    value={currentSurah}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setCurrentSurah(selectedVal);
                      const matched = QURAN_SURAHS.find(s => `Surah ${s.nameEnglish}` === selectedVal || `Surah ${s.number}: ${s.nameEnglish}` === selectedVal);
                      if (matched) setCurrentJuz(matched.juz);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white font-semibold text-slate-900 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] shadow-xs disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {QURAN_SURAHS.map((surah) => (
                      <option key={surah.number} value={`Surah ${surah.nameEnglish}`}>
                        {surah.number}. Surah {surah.nameEnglish} ({surah.nameArabic}) - Juz {surah.juz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Advance Buttons inside Form Modal */}
                {isAdmin && editingStudent && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-200">
                    <span className="text-[10px] font-bold text-slate-600">Gudbinta Degdegga ah:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currIndex = BOOK_LEVEL_OPTIONS.indexOf(bookLevel);
                          if (currIndex !== -1 && currIndex < BOOK_LEVEL_OPTIONS.length - 2) {
                            setBookLevel(BOOK_LEVEL_OPTIONS[currIndex + 1]);
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>Fasalka Xiga ⏩</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          let currIndex = QURAN_SURAHS.findIndex(
                            (s) =>
                              `Surah ${s.nameEnglish}` === currentSurah ||
                              `Surah ${s.number}: ${s.nameEnglish}` === currentSurah ||
                              (currentSurah && currentSurah.toLowerCase().includes(s.nameEnglish.toLowerCase()))
                          );
                          if (currIndex === -1) currIndex = 0;
                          if (currIndex < QURAN_SURAHS.length - 1) {
                            const nextS = QURAN_SURAHS[currIndex + 1];
                            setCurrentSurah(`Surah ${nextS.nameEnglish}`);
                            setCurrentJuz(nextS.juz);
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[10px] font-bold cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>Suuradda Xigta ⏩</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: XOGTA WAALIDKA */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#0e7a48] uppercase tracking-wider border-b pb-1">
                  3. Xogta Waalidka (Parent Details)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Magaca Waalidka *</label>
                    <input
                      type="text"
                      required
                      placeholder="Maxamed Cali"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telefoonka Waalidka *</label>
                    <input
                      type="text"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Xiriirka (Relationship)</label>
                    <select
                      value={parentRelation}
                      onChange={(e) => setParentRelation(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    >
                      <option value="Aabe">Aabe (Father)</option>
                      <option value="Hooyo">Hooyo (Mother)</option>
                      <option value="Masuul">Masuul (Guardian)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: XOGTA LACAGTA */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#0e7a48] uppercase tracking-wider border-b pb-1">
                  4. Xogta Lacagta Bishii (Fees)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lacagta Bishii ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={feeMonthly}
                      onChange={(e) => setFeeMonthly(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lacagta La Bixiyay ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={feePaid}
                      onChange={(e) => setFeePaid(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lacagta Harsan ($)</label>
                    <input
                      type="number"
                      readOnly
                      value={Math.max(0, feeMonthly - feePaid)}
                      className="w-full px-3 py-2 text-xs bg-slate-100 font-bold border border-slate-200 rounded-lg text-rose-700"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white text-xs font-extrabold rounded-lg shadow-md cursor-pointer tracking-wider"
                >
                  [ KAYDI ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col my-auto">
            <div className="p-5 bg-[#0e7a48] text-white relative shrink-0">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl bg-[#d4af37] text-green-950 font-black text-2xl flex items-center justify-center border-2 border-amber-300 shadow-md overflow-hidden shrink-0">
                    {selectedStudent.photoUrl ? (
                      <img src={selectedStudent.photoUrl} alt={selectedStudent.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedStudent.fullName.charAt(0)}</span>
                    )}
                  </div>
                  {currentUser?.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => openCameraModal('profile')}
                      className="absolute -bottom-1 -right-1 p-1 bg-[#0e7a48] text-amber-300 hover:text-white rounded-lg shadow-md border border-amber-300 transition-transform active:scale-95 cursor-pointer"
                      title="Qabo Sawirka Kaamirada (Camera)"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{selectedStudent.fullName}</h3>
                    {currentUser?.role === 'Admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openCameraModal('profile')}
                          className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] rounded-md shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>📸 Kaamira</span>
                        </button>
                        <label className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md border border-emerald-600 flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3 text-amber-300" />
                          <span>📁 Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'profile')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-green-100">
                    ID: {selectedStudent.studentId} ● {selectedStudent.age} Jir ({selectedStudent.gender === 'Male' ? 'Wiil' : 'Gabdho'})
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#d4af37] text-green-950">
                    {selectedStudent.className} ({selectedStudent.shift})
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Qur'aanka:</span>
                  <span className="font-bold text-[#8a7123] text-sm">
                    Juz {selectedStudent.currentJuz} / 30
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Surah-da Hada:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.currentSurah}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Buugga مفتاح القراءة:</span>
                  <span className="font-bold text-[#0e7a48]">{selectedStudent.bookLevel || 'Fasalka 1-aad'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Waalidka ({selectedStudent.parentRelation || 'Waalid'}):</span>
                  <span className="font-bold text-slate-800">{selectedStudent.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Telka Waalidka:</span>
                  <span className="font-bold text-[#0e7a48]">{selectedStudent.parentPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Dhalashada (DOB):</span>
                  <span className="font-bold text-slate-700">{selectedStudent.dob || '2016-05-12'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Bilaabashada:</span>
                  <span className="font-bold text-slate-700">{selectedStudent.enrollmentDate}</span>
                </div>
              </div>

              {/* ADMIN ONLY: LESSON PROGRESSION CONTROLS */}
              {isAdmin ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-800 text-white space-y-3 border border-amber-400/40 shadow-sm">
                  <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2">
                    <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Maamulka Casharrada & Gudbinta (Admin Controls)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                      Admin
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-100">
                    Marka uu ardaygu gudbo casharka ama suuradda, halkan ayaad toos uga gudbin kartaa:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdvanceBookLevel(selectedStudent)}
                      className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-between transition-transform active:scale-95 cursor-pointer"
                    >
                      <div className="text-left">
                        <span className="block text-[10px] opacity-80 uppercase tracking-wider font-bold">Buugga مفتاح القراءة</span>
                        <span>⏩ U Gudbi Fasalka Xiga</span>
                      </div>
                      <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        {selectedStudent.bookLevel || 'Fasalka 1-aad'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdvanceSurah(selectedStudent)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-between border border-emerald-400/50 transition-transform active:scale-95 cursor-pointer"
                    >
                      <div className="text-left">
                        <span className="block text-[10px] text-emerald-200 uppercase tracking-wider font-bold">Qur'aanka Kariimka</span>
                        <span>⏩ U Gudbi Suuradda Xigta</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded font-mono font-bold text-amber-300">
                        Juz {selectedStudent.currentJuz}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                  <Book className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kaliya Admin-ka ayaa xaq u leh in uu beddelo ama uu ardayga u gudbiyo casharka ama suuradda xigta.</span>
                </div>
              )}

              {/* Digital ID Card Generator Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white space-y-3 border-2 border-amber-400/80 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
                      Digital ID Card With QR Code
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700">
                    Official Badge
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  U soo saar ardayga Kadhka Aqoonsiga Rasmiga ah (Digital ID Card) oo wata QR Code xaqiijinaya xogta.
                </p>
                <button
                  type="button"
                  onClick={() => setIdCardStudent(selectedStudent)}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-slate-950" />
                  <span>🎴 Soo Saar Digital ID Card (QR Code)</span>
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIdCardStudent(selectedStudent)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-950" />
                <span>🎴 Digital ID Card</span>
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg cursor-pointer text-xs"
              >
                Xir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ModalBottomSheet: Book Level Selector (Fasalka 1-aad - 9-aad) */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-bold text-sm">Dooro Fasalka (مفتاح القراءة القرءانية)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 text-slate-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-1">
              <p className="text-xs text-slate-500 mb-3">
                Dooro fasalka/casharka uu ardaygu ka marayo buugga مفتاح القراءة القرءانية:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BOOK_LEVEL_OPTIONS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setBookLevel(lvl);
                      setIsBookModalOpen(false);
                    }}
                    className={`p-3 text-xs text-left font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      bookLevel === lvl
                        ? 'bg-[#0e7a48] text-white border-[#0e7a48] shadow-md'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <span>{lvl}</span>
                    {bookLevel === lvl && <CheckCircle className="w-4 h-4 text-[#d4af37]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Xir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ModalBottomSheet: Searchable 114 Quran Surahs Selector */}
      {isSurahModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 h-[88vh] sm:h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Raadi Suuradda Qur'aanka Kariimka</span>
                </h3>
                <p className="text-[10px] text-emerald-100">114 Suuradood - Raadi magaca ama lambarka</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSurahModalOpen(false)}
                className="p-1 text-slate-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-100 border-b border-slate-200 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Raadi magaca suuradda (e.g. Yasin, Baqara, 36, Al-Kahf)..."
                  value={surahSearchTerm}
                  onChange={(e) => setSurahSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0e7a48]"
                />
                {surahSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setSurahSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
              {filteredSurahsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Lama helin suurad u dhiganta "{surahSearchTerm}".
                </div>
              ) : (
                filteredSurahsList.map((surah) => {
                  const surahFullName = `Surah ${surah.nameEnglish}`;
                  const isSelected = currentSurah === surahFullName || currentSurah === `Surah ${surah.number}: ${surah.nameEnglish}`;

                  return (
                    <button
                      key={surah.number}
                      type="button"
                      onClick={() => {
                        setCurrentSurah(surahFullName);
                        setCurrentJuz(surah.juz);
                        setIsSurahModalOpen(false);
                      }}
                      className={`w-full p-2.5 text-xs rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0e7a48] text-white border-[#0e7a48] shadow-sm'
                          : 'bg-white hover:bg-emerald-50 text-slate-900 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#d4af37] text-green-950'
                              : 'bg-emerald-100/80 text-[#0e7a48]'
                          }`}
                        >
                          {surah.number}
                        </span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Surah {surah.nameEnglish}</span>
                            <span className="text-[10px] opacity-75">({surah.nameSomali})</span>
                          </div>
                          <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                            Juz {surah.juz} ● {surah.versesCount} Aayadood ● {surah.revelationType}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-arabic text-sm font-bold ${isSelected ? 'text-[#d4af37]' : 'text-[#0e7a48]'}`}>
                          {surah.nameArabic}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#d4af37]">La doortay ✓</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right shrink-0">
              <button
                type="button"
                onClick={() => setIsSurahModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                Xir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Device Camera Live Capture Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0e7a48] text-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-800 rounded-lg text-amber-300">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">
                    Qabo Sawirka Ardayga (Kaamirada Tooska Ah)
                  </h3>
                  <p className="text-[10px] text-emerald-100">
                    Live camera image capture
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1 rounded-lg hover:bg-green-800 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Camera Video Feed Container */}
              <div className="relative aspect-square w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-inner flex items-center justify-center">
                {cameraError ? (
                  <div className="p-4 text-center space-y-2 text-rose-300">
                    <p className="text-xs font-bold text-white bg-rose-900/80 p-3 rounded-xl border border-rose-700">
                      ⚠️ {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => startCameraStream(cameraFacing)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Dobloom / Isku day mar kale
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />

                    {/* Viewfinder Overlay Frame */}
                    <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-full m-8 pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-400/40">
                        Wejiga Ardayga Soohdimaha Geli
                      </span>
                    </div>

                    {isCameraStarting && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-white text-xs font-bold gap-2">
                        <RotateCw className="w-5 h-5 animate-spin text-amber-400" />
                        <span>Kaamiradu waa furmaysaa...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Camera Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Beddel Kaamirada (Front / Back)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#0e7a48]" />
                  <span>Beddel Kaamirada</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Kanasal
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={Boolean(cameraError) || isCameraStarting}
                    className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-[#d4af37]" />
                    <span>Qabo Sawirka (Capture)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Student ID Card Modal */}
      {idCardStudent && (
        <PrintDigitalIDCardModal
          student={idCardStudent}
          settings={settings}
          onClose={() => setIdCardStudent(null)}
        />
      )}
    </div>
  );
});
