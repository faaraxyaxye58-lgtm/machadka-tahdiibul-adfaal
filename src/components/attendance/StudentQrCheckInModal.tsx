import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Student,
  AttendanceRecord,
  ClassRoom,
  AttendanceSession,
  User,
  TrackStatus,
} from '../../types';
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Printer,
  Sparkles,
  UserCheck,
  Search,
  History,
  RefreshCw,
  Sun,
  BookOpen,
  Check,
  ShieldCheck,
  Maximize2,
  Smartphone,
  Info
} from 'lucide-react';

interface StudentQrCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: ClassRoom[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  currentUser?: User | null;
}

interface ScanLogItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  timestamp: string;
  metric: 'subax' | 'cashar' | 'dareeris' | 'attendance';
  photoUrl?: string;
  status: 'success' | 'duplicate' | 'error';
  message: string;
}

export const StudentQrCheckInModal: React.FC<StudentQrCheckInModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  attendanceRecords,
  selectedDate,
  onSaveAttendance,
  currentUser,
}) => {
  // ACTIVE MODAL TAB
  const [activeTab, setActiveTab] = useState<'scanner' | 'idCards' | 'classQr' | 'history'>('scanner');

  // SCANNER SETTINGS
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'all');
  const [selectedMetric, setSelectedMetric] = useState<'subax' | 'cashar' | 'dareeris' | 'attendance'>('subax');
  const [checkInActionType, setCheckInActionType] = useState<'In' | 'Out' | 'PresentOnly'>('In');
  const [manualInputId, setManualInputId] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // CAMERA SCANNER STATE
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // SCAN RESULT NOTIFICATION STATE
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scanStatusMsg, setScanStatusMsg] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanLogItem[]>([]);

  // SEARCH FOR ID CARDS
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [selectedCardClass, setSelectedCardClass] = useState<string>('all');

  // PRINT MODE FOR CARDS
  const [isPrintingCards, setIsPrintingCards] = useState(false);

  // Initialize or Cleanup Camera Scanner
  useEffect(() => {
    if (!isOpen || activeTab !== 'scanner' || !isCameraActive) {
      stopCameraScanner();
      return;
    }

    let isSubscribed = true;

    const startCameraScanner = async () => {
      try {
        setCameraError(null);
        // Ensure old instance stopped
        await stopCameraScanner();

        const qrRegionId = 'qr-reader-container';
        const element = document.getElementById(qrRegionId);
        if (!element) return;

        const html5QrcodeScanner = new Html5Qrcode(qrRegionId);
        html5QrcodeRef.current = html5QrcodeScanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrcodeScanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isSubscribed) {
              handleQrCodeScanned(decodedText);
            }
          },
          () => {
            // Scanner frame ignore
          }
        );
      } catch (err: any) {
        console.warn('QR Camera Start Error:', err);
        if (isSubscribed) {
          setCameraError(err?.message || 'Koorada kaamiirada waa la waayay ama permission-ka ayaa loo baahan yahay.');
          setIsCameraActive(false);
        }
      }
    };

    startCameraScanner();

    return () => {
      isSubscribed = false;
      stopCameraScanner();
    };
  }, [isOpen, activeTab, isCameraActive]);

  const stopCameraScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      html5QrcodeRef.current = null;
    }
  };

  if (!isOpen) return null;

  // Sound Feedback Generator
  const playAudioFeedback = (type: 'success' | 'duplicate') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.1); // F4
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  // Helper for Speech Confirmation
  const speakStudentArrival = (studentName: string) => {
    if (!soundEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const first = studentName.split(' ')[0] || studentName;
        const utterance = new SpeechSynthesisUtterance(`Khadir ${first}`);
        utterance.lang = 'so-SO';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Speech synth ignore
      }
    }
  };

  // STUDENT SELECTOR FOR CLASSROOM QR SCANNING
  const [selectedStudentForScan, setSelectedStudentForScan] = useState<string>('');

  // Auto detect student if logged in user is student/parent
  useEffect(() => {
    if (currentUser && students.length > 0 && !selectedStudentForScan) {
      const match = students.find(
        (s) => s.studentId === currentUser.studentId || s.fullName.toLowerCase() === currentUser.name?.toLowerCase()
      );
      if (match) {
        setSelectedStudentForScan(match.id);
      }
    }
  }, [currentUser, students, selectedStudentForScan]);

  // MAIN QR SCAN HANDLER
  const handleQrCodeScanned = (qrCodeString: string) => {
    const rawCode = qrCodeString.trim();
    if (!rawCode) return;

    // Check if Scanned QR Code is a Classroom QR Code (Station / Classroom Poster)
    if (rawCode.includes('TAHDIIB-CLASSROOM:') || rawCode.includes('TAHDIIB-STATION:')) {
      const parts = rawCode.split(':');
      const targetClassId = parts[1];
      const targetClass = classes.find((c) => c.id === targetClassId || c.name === targetClassId);

      // Resolve student to check in
      let studentToRecord: Student | undefined;

      if (selectedStudentForScan) {
        studentToRecord = students.find((s) => s.id === selectedStudentForScan);
      } else if (currentUser) {
        studentToRecord = students.find(
          (s) => s.studentId === currentUser.studentId || s.fullName.toLowerCase() === currentUser.name?.toLowerCase()
        );
      }

      // If class-filtered student list exists for that class, pick first if only one student or if matched
      if (!studentToRecord && targetClassId) {
        const classStudents = students.filter((s) => s.classId === targetClassId);
        if (classStudents.length === 1) {
          studentToRecord = classStudents[0];
        }
      }

      if (!studentToRecord) {
        playAudioFeedback('duplicate');
        setScanStatusMsg({
          type: 'warn',
          text: `🏫 QR Code-ka Fasalka (${targetClass?.name || 'Classroom'}) waa la scan-greystay! Fadlan dooro ama qor magaca ardayga xaadiraya.`,
        });
        return;
      }

      executeStudentCheckIn(studentToRecord, targetClassId);
      return;
    }

    // Parse potential custom format e.g. "TAHDIIB-STUDENT:STU-2026-001" or raw "STU-2026-001" or student database ID
    let searchedId = rawCode;
    if (rawCode.includes('TAHDIIB-STUDENT:')) {
      searchedId = rawCode.split('TAHDIIB-STUDENT:')[1] || rawCode;
    }

    // Match student by studentId (e.g. TA-2026-001) or database id or name
    const matchedStudent = students.find(
      (s) =>
        s.studentId.toLowerCase() === searchedId.toLowerCase() ||
        s.id === searchedId ||
        (rawCode.length > 3 && s.fullName.toLowerCase() === searchedId.toLowerCase())
    );

    if (!matchedStudent) {
      playAudioFeedback('duplicate');
      setScanStatusMsg({
        type: 'error',
        text: `⚠️ QR Code-ka "${rawCode}" ma habboona ama arday ka tirsan machadka ma aha!`,
      });
      return;
    }

    executeStudentCheckIn(matchedStudent, selectedClassId !== 'all' ? selectedClassId : undefined);
  };

  // EXECUTE ATTENDANCE RECORDING FOR STUDENT WITH CLASSROOM MATCH & DUPLICATE PREVENTION
  const executeStudentCheckIn = (student: Student, expectedClassId?: string) => {
    // 1. CLASSROOM MATCH VALIDATION CHECK
    if (expectedClassId && student.classId !== expectedClassId) {
      const studentClass = classes.find((c) => c.id === student.classId);
      const targetClass = classes.find((c) => c.id === expectedClassId);
      
      playAudioFeedback('duplicate');
      setScanStatusMsg({
        type: 'error',
        text: `❌ FASALKA WAA KU DUWAN YAHAY: Ardayga ${student.fullName} wuxuu ka tirsan yahay (${studentClass?.name || student.className || 'Fasal kale'}), mana xaadiro karo fasalka (${targetClass?.name || expectedClassId}).`,
      });

      const errorLogItem: ScanLogItem = {
        id: `log-${Date.now()}-${student.id}`,
        studentId: student.studentId,
        studentName: student.fullName,
        className: student.className,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        metric: selectedMetric,
        photoUrl: student.photoUrl,
        status: 'error',
        message: `Fasalka waa ku duwan yahay (${targetClass?.name || expectedClassId})`,
      };

      setScanHistory((prev) => [errorLogItem, ...prev]);
      return; // BLOCK ATTENDANCE RECORDING!
    }

    const timeNow = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const metricStatusKey = `${selectedMetric}Status` as keyof AttendanceRecord;
    const metricTimeInKey = `${selectedMetric}TimeIn` as keyof AttendanceRecord;
    const metricTimeOutKey = `${selectedMetric}TimeOut` as keyof AttendanceRecord;

    // 2. PREVENT DUPLICATE CHECK-INS FOR THE SAME STUDENT ON THE SAME DATE
    const existingRecIndex = attendanceRecords.findIndex(
      (r) => r.studentId === student.id && r.date === selectedDate
    );

    if (existingRecIndex >= 0) {
      const existingRec = attendanceRecords[existingRecIndex];
      const currentMetricStatus = existingRec[metricStatusKey] as TrackStatus;

      // Check if already marked Sax/Present or timestamp recorded for current action
      const isAlreadyCheckedIn = 
        (checkInActionType === 'In' || checkInActionType === 'PresentOnly') 
          ? (currentMetricStatus === 'Sax' && !!existingRec[metricTimeInKey]) || (existingRec.attendanceStatus === 'Sax' && selectedMetric === 'attendance')
          : (checkInActionType === 'Out' && !!existingRec[metricTimeOutKey]);

      if (isAlreadyCheckedIn) {
        playAudioFeedback('duplicate');
        const prevTime = (existingRec as any)[metricTimeInKey] || (existingRec as any)[metricTimeOutKey] || 'hore';
        setScanStatusMsg({
          type: 'warn',
          text: `⚠️ DIIWAAN LABANLAABAN (DUPLICATE): Ardayga ${student.fullName} HORE AYAA LOO XAADIRIYAY maanta (${selectedDate}) saacaddii (${prevTime}).`,
        });

        // Add log entry for duplicate check-in attempt without modifying database state
        const duplicateLogItem: ScanLogItem = {
          id: `log-${Date.now()}-${student.id}`,
          studentId: student.studentId,
          studentName: student.fullName,
          className: student.className,
          timestamp: timeNow,
          metric: selectedMetric,
          photoUrl: student.photoUrl,
          status: 'duplicate',
          message: `Labanlaab: Hore ayaa loo xaadiriyay maanta (${prevTime})`,
        };

        setScanHistory((prev) => [duplicateLogItem, ...prev]);
        setLastScannedStudent(student);

        setTimeout(() => {
          setScanStatusMsg(null);
        }, 4000);

        return; // BLOCK DUPLICATE RECORDING!
      }
    }

    let updatedRecords: AttendanceRecord[] = [...attendanceRecords];

    if (existingRecIndex >= 0) {
      const existingRec = updatedRecords[existingRecIndex];
      const newRec: AttendanceRecord = {
        ...existingRec,
        studentName: student.fullName,
        classId: student.classId,
        [metricStatusKey]: 'Sax',
        attendanceStatus: 'Sax', // Mark general attendance Present
      };

      if (checkInActionType === 'In' || checkInActionType === 'PresentOnly') {
        (newRec as any)[metricTimeInKey] = timeNow;
      } else if (checkInActionType === 'Out') {
        (newRec as any)[metricTimeOutKey] = timeNow;
      }

      updatedRecords[existingRecIndex] = newRec;
    } else {
      // Create fresh AttendanceRecord for today
      const newRec: AttendanceRecord = {
        id: `att-${student.id}-${selectedDate}`,
        studentId: student.id,
        studentName: student.fullName,
        classId: student.classId,
        date: selectedDate,
        status: 'Present',
        subaxStatus: selectedMetric === 'subax' ? 'Sax' : 'Lama Diiwaangelin',
        casharStatus: selectedMetric === 'cashar' ? 'Sax' : 'Lama Diiwaangelin',
        dareerisStatus: selectedMetric === 'dareeris' ? 'Sax' : 'Lama Diiwaangelin',
        attendanceStatus: 'Sax',
        ...(selectedMetric === 'subax' && checkInActionType === 'In' ? { subaxTimeIn: timeNow } : {}),
        ...(selectedMetric === 'cashar' && checkInActionType === 'In' ? { casharTimeIn: timeNow } : {}),
        ...(selectedMetric === 'dareeris' && checkInActionType === 'In' ? { dareerisTimeIn: timeNow } : {}),
      };

      updatedRecords.push(newRec);
    }

    // Save state instantly
    onSaveAttendance(updatedRecords);

    // Audio & Visual Feedback
    playAudioFeedback('success');
    speakStudentArrival(student.fullName);
    setScanStatusMsg({
      type: 'success',
      text: `✅ WAA LA DIIWAANGELIYAY: ${student.fullName} (${student.className}) saacada ${timeNow}!`,
    });

    setLastScannedStudent(student);

    // Append to Scan History log
    const newLogItem: ScanLogItem = {
      id: `log-${Date.now()}-${student.id}`,
      studentId: student.studentId,
      studentName: student.fullName,
      className: student.className,
      timestamp: timeNow,
      metric: selectedMetric,
      photoUrl: student.photoUrl,
      status: 'success',
      message: 'Waa la xaadiriyay',
    };

    setScanHistory((prev) => [newLogItem, ...prev]);

    // Clear status popup message after 3.5 seconds
    setTimeout(() => {
      setScanStatusMsg(null);
    }, 3500);
  };

  // Manual Input Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputId.trim()) return;
    handleQrCodeScanned(manualInputId.trim());
    setManualInputId('');
  };

  // Filtered Students for ID Cards tab
  const filteredStudentsForCards = students.filter((s) => {
    const matchesClass = selectedCardClass === 'all' || s.classId === selectedCardClass;
    const matchesSearch =
      s.fullName.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(cardSearchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handlePrintCards = () => {
    window.print();
  };

  return (
    <div className="fixed inset-[#00000080] z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-emerald-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Nidaamka Diiwaangelinta QR Code Check-In
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Realtime
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Xaadirinta degdega ah ee ardayda maanta: <strong className="text-white">{selectedDate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={soundEnabled ? 'Codku wuu shaqaynayaa' : 'Codka waa la damiyay'}
            >
              <Volume2 className={`w-4 h-4 ${soundEnabled ? 'text-emerald-300' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{soundEnabled ? 'Codka ON' : 'Codka OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-rose-500/80 hover:text-white transition-all border border-white/10"
              title="Xir pardaheeda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📷 Kamirada Diiwaangelinta (Scanner)</span>
          </button>

          <button
            onClick={() => setActiveTab('idCards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'idCards'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>🎴 Karta Ardayda & QR Cards</span>
          </button>

          <button
            onClick={() => setActiveTab('classQr')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'classQr'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>🏫 Station QR Code (Fasalka)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ml-auto ${
              activeTab === 'history'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📋 Diiwaanka Maanta ({scanHistory.length})</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: CAMERA SCANNER MODE */}
          {/* ========================================================================= */}
          {activeTab === 'scanner' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SCANNER CAMERA & CONTROL COLUMN */}
              <div className="lg:col-span-7 space-y-4">
                {/* CONFIGURATION BAR */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Select Class */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Fasalka Diiwaangelinta:</label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">🌟 Dhammaan Fasallada</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Metric Session */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Waqtiga/Casharka:</label>
                      <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="subax">🌅 Subax Hore</option>
                        <option value="cashar">📖 Cashar Dhexe</option>
                        <option value="dareeris">🌇 Dareeris / Galabti</option>
                        <option value="attendance">✅ Xaadiris Guud</option>
                      </select>
                    </div>

                    {/* Action Type */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nooca Diiwaanka:</label>
                      <select
                        value={checkInActionType}
                        onChange={(e) => setCheckInActionType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="In">➡️ Gelay (Time In)</option>
                        <option value="Out">⬅️ Ka Baxay (Time Out)</option>
                        <option value="PresentOnly">✓ Xaadir (Sax)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* CAMERA SCANNER DISPLAY BOX */}
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                  {isCameraActive ? (
                    <div className="w-full flex flex-col items-center justify-center space-y-3">
                      <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl bg-black">
                        <div id="qr-reader-container" className="w-full h-full" />
                        {/* QR Overlay Target Box */}
                        <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl" />
                        </div>
                      </div>

                      <button
                        onClick={() => setIsCameraActive(false)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md"
                      >
                        <X className="w-4 h-4" />
                        <span>Jooji Kamirada (Stop Camera)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-8">
                      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                        <Camera className="w-10 h-10 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">Shid Kamirada QR Code Check-In</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Waalidiinta ama ardaydu waxay tusin karaan Karta QR Code-ka si toos ah ayaana loogu xaadirinayaa.
                        </p>
                      </div>

                      {cameraError && (
                        <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl max-w-sm mx-auto flex items-center gap-2 text-left">
                          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                          <span>{cameraError}</span>
                        </div>
                      )}

                      <button
                        onClick={() => setIsCameraActive(true)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-xl shadow-emerald-950 flex items-center gap-2 mx-auto active:scale-95"
                      >
                        <Camera className="w-5 h-5" />
                        <span>FURA KAMIRADA (START CAMERA)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* MANUAL ID ENTRY FALLBACK */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-700" />
                    <span>Qor ama Scan ka dhig ID Card (Manual Entry Fallback)</span>
                  </div>

                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Geli Student ID (e.g. TA-2026-001 ama Magaca)..."
                      value={manualInputId}
                      onChange={(e) => setManualInputId(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Xaadiro</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* SCAN CONFIRMATION & STATS COLUMN */}
              <div className="lg:col-span-5 space-y-4">
                {/* SCAN FEEDBACK ALERT BANNER */}
                {scanStatusMsg && (
                  <div
                    className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 shadow-lg animate-in fade-in zoom-in duration-200 ${
                      scanStatusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : scanStatusMsg.type === 'warn'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {scanStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-extrabold text-sm">{scanStatusMsg.text}</div>
                    </div>
                  </div>
                )}

                {/* LAST SCANNED STUDENT CARD */}
                {lastScannedStudent ? (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-700 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Ardaygii Ugu Dambeeyay Ee Scan-ka
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30 font-bold">
                        ✓ Xaadir
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {lastScannedStudent.photoUrl ? (
                        <img
                          src={lastScannedStudent.photoUrl}
                          alt={lastScannedStudent.fullName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-emerald-200 font-black text-xl flex items-center justify-center border-2 border-emerald-400 shadow-md">
                          {lastScannedStudent.fullName.charAt(0)}
                        </div>
                      )}

                      <div>
                        <h4 className="font-black text-base text-white">{lastScannedStudent.fullName}</h4>
                        <div className="text-xs text-slate-300">ID: <strong className="text-emerald-300">{lastScannedStudent.studentId}</strong></div>
                        <div className="text-xs text-slate-400">{lastScannedStudent.className}</div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-3 text-xs grid grid-cols-2 gap-2 border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waqtiga/Session:</span>
                        <strong className="text-slate-200">{selectedMetric.toUpperCase()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Saacada Scan-ka:</span>
                        <strong className="text-emerald-400">
                          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-2">
                    <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">Wali arday lama scan gareyn session-kan</div>
                    <p className="text-[11px] text-slate-500">
                      Marka ardaygu kaamerada hoso dhigo QR code-ka, xogtiisu halkan ayay ku muuqan doontaa.
                    </p>
                  </div>
                )}

                {/* RECENT MINI SCAN LIST */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-emerald-700" />
                      Ardaydii Ugu Dambaysay Ee Scan-ka ({scanHistory.length})
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {scanHistory.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-4">
                        Diiwaanku wuu baskan yahay.
                      </div>
                    ) : (
                      scanHistory.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              ✓
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{log.studentName}</div>
                              <div className="text-[10px] text-slate-500">ID: {log.studentId} • {log.className}</div>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {log.timestamp}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PRINT / DISPLAY STUDENT QR CARDS */}
          {/* ========================================================================= */}
          {activeTab === 'idCards' && (
            <div className="space-y-4">
              {/* CARDS FILTER & PRINT ACTION BAR */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Raadi Arday ama ID..."
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>

                  {/* Filter Class */}
                  <select
                    value={selectedCardClass}
                    onChange={(e) => setSelectedCardClass(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="all">🌟 Dhammaan Fasallada</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handlePrintCards}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT QR CARDS ({filteredStudentsForCards.length})</span>
                </button>
              </div>

              {/* STUDENT CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
                {filteredStudentsForCards.map((st) => {
                  const qrPayload = `TAHDIIB-STUDENT:${st.studentId}`;
                  return (
                    <div
                      key={st.id}
                      className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all relative overflow-hidden flex flex-col items-center text-center space-y-3 print:border print:shadow-none"
                    >
                      <div className="w-full bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-between">
                        <span>TAHDIIBUL ADFAAL MIS</span>
                        <span className="text-emerald-300 font-mono">{st.studentId}</span>
                      </div>

                      <div className="flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-inner">
                        <QRCodeSVG
                          value={qrPayload}
                          size={130}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-slate-900">{st.fullName}</h4>
                        <div className="text-xs font-bold text-emerald-700">{st.className}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Waalid: {st.parentName} ({st.parentPhone})
                        </div>
                      </div>

                      <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>ID: {st.studentId}</span>
                        <span>QR Code Check-In Card</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CLASSROOM STATION DISPLAY & POSTER GENERATOR QR */}
          {/* ========================================================================= */}
          {activeTab === 'classQr' && (
            <div className="space-y-6">
              {/* FILTER & PRINT BAR */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-black text-slate-700 whitespace-nowrap">🏫 Dooraso Fasalka:</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 flex-1 sm:w-64"
                  >
                    <option value="all">🌟 Dhammaan Fasallada (All Classrooms)</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT CLASSROOM POSTERS 🖨️</span>
                </button>
              </div>

              {/* SINGLE CLASSROOM OR ALL CLASSROOMS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
                {(selectedClassId === 'all' ? classes : classes.filter((c) => c.id === selectedClassId)).map((cls) => {
                  const classroomQrPayload = `TAHDIIB-CLASSROOM:${cls.id}`;
                  return (
                    <div
                      key={cls.id}
                      className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xl text-center space-y-4 relative overflow-hidden flex flex-col items-center print:border print:shadow-none"
                    >
                      <div className="w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center justify-between shadow-sm">
                        <span>TAHDIIBUL ADFAAL</span>
                        <span className="text-emerald-300 font-mono">CLASSROOM STATION</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900">{cls.name}</h4>
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                          QR Check-In Code • Date: {selectedDate}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-3xl border-2 border-emerald-500/30 shadow-inner flex items-center justify-center">
                        <QRCodeSVG
                          value={classroomQrPayload}
                          size={180}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full text-center">
                        <div className="text-[10px] font-bold text-slate-500 font-mono">
                          ID: {cls.id}
                        </div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          📷 Scan QR Code-kan si aad isu xaadiriso maanta
                        </div>
                      </div>

                      <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Machadka Tahdiibul Adfaal</span>
                        <span>Automatic Attendance System</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* INSTRUCTION CARD */}
              <div className="bg-slate-900 text-slate-200 p-5 rounded-3xl border border-slate-800 text-xs space-y-2 max-w-2xl mx-auto">
                <div className="font-black text-white text-sm flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-400" />
                  Sida loo isticmaalo QR Code-ka Fasalka (Classroom Station):
                </div>
                <p className="text-slate-300">
                  1. Dabac (Print) poster-ka QR Code-ka fasalka ama ku muuji TV-ga / Smart Board-ka fasalka.
                </p>
                <p className="text-slate-300">
                  2. Ardayda marka ay fasalka soo galaan waxay furayaan kaamiirada app-ka (QR Scanner) si ay u scan-greeyaan poster-ka.
                </p>
                <p className="text-slate-300">
                  3. Nidaamku wuxuu si toos ah u diiwaangelinayaa xaadiriska ardayga ee taariikhda maanta ({selectedDate}) iyo saacada dhabta ah.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SCAN HISTORY */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-700" />
                  Diiwaanka QR Check-Ins Ee Maanta ({scanHistory.length})
                </h3>
              </div>

              {scanHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <QrCode className="w-12 h-12 mx-auto opacity-30" />
                  <div>Wali wax QR scans ah ma aysan dhacin maanta.</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {scanHistory.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                          ✓
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{item.studentName}</div>
                          <div className="text-[11px] text-slate-500">
                            ID: {item.studentId} • {item.className}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-700">{item.timestamp}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{item.metric}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Nidaamka QR-ka ee Machadka Tahdiibul Adfaal</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all"
          >
            Xir (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
