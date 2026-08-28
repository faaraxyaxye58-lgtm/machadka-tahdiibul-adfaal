import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  Award,
  BarChart3,
  Calendar,
  Sparkles,
  Users,
  Mic,
  Plus,
  Play,
  Volume2,
  Clock,
  ShieldCheck,
  Send,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Lock,
  UserCheck,
  Key,
  UserPlus,
  Power,
  Trash2,
} from 'lucide-react';

import {
  User,
  Student,
  RemoteRegistration,
  RemoteClass,
  RemoteLesson,
  QuranProgress,
  QuranAudioSubmission,
  RemoteHomework,
  RemoteHomeworkSubmission,
  RemoteExam,
  RemoteExamAttempt,
  RemoteAttendanceRecord,
  RemoteScheduleItem,
  OnlineAccountStatus,
} from '../types';

import { Storage } from '../lib/storage';
import { saveItemToFirestore, COLLECTIONS } from '../lib/firebase';
import { RemoteRegistrationModal } from '../components/remote/RemoteRegistrationModal';
import { AdminCreateAccountModal } from '../components/remote/AdminCreateAccountModal';
import { AdminAccountManagementModal } from '../components/remote/AdminAccountManagementModal';
import { OnlineLearningLoginPortal } from '../components/remote/OnlineLearningLoginPortal';
import { hashPassword } from '../lib/hashUtils';

interface RemoteLearningViewProps {
  currentUser: User | null;
  settings: any;
  students: Student[];
  teachers: any[];
  parents: any[];
  onUpdateStudents?: (updated: Student[]) => void;
  onUpdateUsers?: (updated: User[]) => void;
}

export const RemoteLearningView: React.FC<RemoteLearningViewProps> = ({
  currentUser,
  settings,
  students,
  teachers,
  parents,
  onUpdateStudents,
  onUpdateUsers,
}) => {
  const userRole = currentUser?.role || 'admin';
  const isAdmin = userRole === 'admin';

  // State for active user session if logged in through portal locally
  const [activeOnlineUser, setActiveOnlineUser] = useState<User | null>(currentUser);

  // Active Role Perspective
  const [activeRolePerspective, setActiveRolePerspective] = useState<'student' | 'teacher' | 'parent' | 'admin'>(
    isAdmin ? 'admin' : (userRole as any)
  );

  // Active Sub-Tab for Admin or Student
  const [adminTab, setAdminTab] = useState<'pending' | 'active' | 'suspended' | 'rejected' | 'search' | 'content'>('pending');

  const [activeSubTab, setActiveSubTab] = useState<
    'home' | 'quran' | 'lessons' | 'homework' | 'exams' | 'progress' | 'schedule' | 'attendance' | 'ai_assistant' | 'teacher_gradings'
  >('home');

  // Datasets State
  const [registrations, setRegistrations] = useState<RemoteRegistration[]>(() => Storage.getRemoteRegistrations());
  const [remoteClasses, setRemoteClasses] = useState<RemoteClass[]>(() => Storage.getRemoteClasses());
  const [lessons, setLessons] = useState<RemoteLesson[]>(() => Storage.getRemoteLessons());
  const [quranProgs, setQuranProgs] = useState<QuranProgress[]>(() => Storage.getQuranProgress());
  const [audioSubs, setAudioSubs] = useState<QuranAudioSubmission[]>(() => Storage.getQuranAudioSubmissions());
  const [homeworkList, setHomeworkList] = useState<RemoteHomework[]>(() => Storage.getRemoteHomework());
  const [hwSubmissions, setHwSubmissions] = useState<RemoteHomeworkSubmission[]>(() => Storage.getRemoteHomeworkSubmissions());
  const [examsList, setExamsList] = useState<RemoteExam[]>(() => Storage.getRemoteExams());
  const [remoteAttendance, setRemoteAttendance] = useState<RemoteAttendanceRecord[]>(() => Storage.getRemoteAttendanceRecords());
  const [schedules, setSchedules] = useState<RemoteScheduleItem[]>(() => Storage.getRemoteSchedules());

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [approvingReg, setApprovingReg] = useState<RemoteRegistration | null>(null);
  const [managingReg, setManagingReg] = useState<RemoteRegistration | null>(null);
  const [activeLessonModal, setActiveLessonModal] = useState<RemoteLesson | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  // Rejection Reason Modal
  const [rejectingReg, setRejectingReg] = useState<RemoteRegistration | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Teacher Audio Grading
  const [gradingAudioSub, setGradingAudioSub] = useState<QuranAudioSubmission | null>(null);
  const [gradeStars, setGradeStars] = useState(5);
  const [teacherComment, setTeacherComment] = useState('');

  // Audio Recorder State for Quran Recitation
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const [reciteSurah, setReciteSurah] = useState('Surat Al-Kahf');
  const [reciteAyahs, setReciteAyahs] = useState('1 - 10');

  // AI Assistant Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: "Assalaamu 'alaykum! Waxaan ahay Kaaliyaha AI ee Waxbarashada Fog ee Machadka Tahdiibul-Adfaal. Waxaad igusoo weydiin kartaa su'aalo ku saabsan Tajwiidka, Luuqadda Carabiga, iyo Sharaxaadda Casharrada.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sync state from storage
  const reloadData = () => {
    setRegistrations(Storage.getRemoteRegistrations());
    setRemoteClasses(Storage.getRemoteClasses());
    setLessons(Storage.getRemoteLessons());
    setQuranProgs(Storage.getQuranProgress());
    setAudioSubs(Storage.getQuranAudioSubmissions());
    setHomeworkList(Storage.getRemoteHomework());
    setHwSubmissions(Storage.getRemoteHomeworkSubmissions());
    setExamsList(Storage.getRemoteExams());
    setRemoteAttendance(Storage.getRemoteAttendanceRecords());
    setSchedules(Storage.getRemoteSchedules());
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setActiveOnlineUser(currentUser);
    }
  }, [currentUser]);

  // Registrations grouped by status
  const pendingRequests = registrations.filter((r) => r.status === 'Pending');
  const activeStudents = registrations.filter((r) => r.status === 'Active');
  const suspendedAccounts = registrations.filter((r) => r.status === 'Suspended');
  const rejectedRequests = registrations.filter((r) => r.status === 'Rejected');

  // Filtered registrations for Search Tab
  const searchFilteredRegs = registrations.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.studentId && r.studentId.toLowerCase().includes(q)) ||
      r.cityCountry.toLowerCase().includes(q) ||
      r.gradeLevel.toLowerCase().includes(q)
    );
  });

  // Current active student profile
  const currentRemoteStudent = students.find((s) => s.learningMode === 'remote' || s.id === activeOnlineUser?.studentId) || students[0];

  // Rejection handler
  const handleConfirmReject = () => {
    if (!rejectingReg) return;
    const updatedRegs = registrations.map((r) =>
      r.id === rejectingReg.id
        ? {
            ...r,
            status: 'Rejected' as const,
            rejectionReason: rejectionReasonInput || 'Sabab aan la cayimin',
            reviewedBy: currentUser?.name || 'Admin',
            reviewedAt: new Date().toISOString(),
          }
        : r
    );
    setRegistrations(updatedRegs);
    Storage.saveRemoteRegistrations(updatedRegs);
    saveItemToFirestore(COLLECTIONS.REMOTE_REGISTRATIONS, {
      ...rejectingReg,
      status: 'Rejected',
      rejectionReason: rejectionReasonInput || 'Sabab aan la cayimin',
      reviewedBy: currentUser?.name || 'Admin',
      reviewedAt: new Date().toISOString(),
    });

    setRejectingReg(null);
    setRejectionReasonInput('');
    alert('❌ Codsiga diiwaangelinta waa la diaday.');
  };

  // User Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || !activeOnlineUser) return;

    try {
      const hashed = await hashPassword(newPasswordInput.trim());
      const users = Storage.getUsers();
      const updatedUsers = users.map((u) => (u.id === activeOnlineUser.id ? { ...u, password: hashed } : u));
      Storage.saveUsers(updatedUsers);

      const regs = Storage.getRemoteRegistrations();
      const updatedRegs = regs.map((r) =>
        r.createdUserId === activeOnlineUser.id || r.username === activeOnlineUser.username
          ? { ...r, passwordHash: hashed, passwordPlainForAdmin: newPasswordInput.trim() }
          : r
      );
      Storage.saveRemoteRegistrations(updatedRegs);

      setChangePasswordSuccess('✅ Password-kaaga si guul leh ayaa loo badalay!');
      setNewPasswordInput('');
      setTimeout(() => {
        setIsChangePasswordModalOpen(false);
        setChangePasswordSuccess(null);
      }, 1200);
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday beddelaada password-ka.');
    }
  };

  // Audio Recorder Logic
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => setRecordedAudioBase64(reader.result as string);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } catch (err) {
      alert('Fadlan ogolaaw Makarafoonka si aad u duubto codka.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleSendQuranAudio = () => {
    if (!recordedAudioBase64 && !recordedAudioUrl) {
      alert('Fadlan horta duub codkaaga inta aadan dirin.');
      return;
    }

    const newSubmission: QuranAudioSubmission = {
      id: `qaud-${Date.now()}`,
      studentId: currentRemoteStudent?.id || activeOnlineUser?.id || 'std-rem-001',
      studentName: currentRemoteStudent?.fullName || activeOnlineUser?.name || 'Arday Online',
      teacherId: 'tch-1',
      teacherName: 'Macallin Yuusuf Axmed',
      surah: reciteSurah,
      ayahs: reciteAyahs,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      audioBase64OrUrl: recordedAudioBase64 || recordedAudioUrl || '',
      audioDuration: `${Math.floor(recordingSeconds / 60)}:${recordingSeconds % 60 < 10 ? '0' : ''}${recordingSeconds % 60}`,
      status: 'Pending',
    };

    const updated = [newSubmission, ...audioSubs];
    setAudioSubs(updated);
    Storage.saveQuranAudioSubmissions(updated);
    saveItemToFirestore(COLLECTIONS.QURAN_AUDIO, newSubmission);

    setRecordedAudioUrl(null);
    setRecordedAudioBase64(null);
    setRecordingSeconds(0);
    alert("✅ Akhriskaaga codka ah waa loo diray Macallinka. Fadlan sug inta uu dib uga eegayo!");
  };

  // AI Assistant Send Logic
  const handleSendAiPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;

    const userText = aiPrompt.trim();
    setAiPrompt('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAiMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeNow }]);
    setIsAiLoading(true);

    try {
      const resp = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          context: `Remote student learning Quran/Tajweed for class ${currentRemoteStudent?.className || 'Group A'}`,
        }),
      });

      const data = await resp.json();
      const replyText = data.reply || data.error || 'Waa la helay fariintaada, fadlan dib u soo weydii mar kale.';

      setAiMessages((prev) => [...prev, { sender: 'ai', text: replyText, time: timeNow }]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Cillad ayaa ka dhacday AI Assistant-ka. Fadlan mar kale isku day.', time: timeNow },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // =========================================================================
  // CONDITIONAL VIEW 1: ADMIN DASHBOARD VIEW
  // =========================================================================
  if (isAdmin) {
    return (
      <div className="space-y-6 pb-20">
        {/* Admin Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ADMIN CONTROL CENTER • WAXBARASHADA ONLINE-KA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                🎓 MAAMULKA WAXBARASHADA FOG (ONLINE LEARNING SYSTEM)
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium leading-relaxed">
                Maamul codsiyada soo dhaca, sameey Username & Password cusub, badal xogta ardayda Active-ka ah, ama haksi akoonnada.
              </p>
            </div>

            <button
              onClick={() => setIsRegModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>📝 ISDIIWAANGELI CODSI CUSUB</span>
            </button>
          </div>

          {/* Key Admin Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
            <div
              onClick={() => setAdminTab('pending')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                pendingRequests.length > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-black uppercase">Pending Requests</div>
              <div className="text-2xl font-black mt-0.5">{pendingRequests.length}</div>
              {pendingRequests.length > 0 && <div className="text-[10px] font-bold mt-0.5">⚠️ U baahan Ansixin!</div>}
            </div>

            <div
              onClick={() => setAdminTab('active')}
              className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-2xl transition-all cursor-pointer"
            >
              <div className="text-[10px] font-black uppercase">Active Students</div>
              <div className="text-2xl font-black mt-0.5">{activeStudents.length}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">✅ Wax ku baranaya Online</div>
            </div>

            <div
              onClick={() => setAdminTab('suspended')}
              className="p-3.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-2xl transition-all cursor-pointer"
            >
              <div className="text-[10px] font-black uppercase">Suspended Accounts</div>
              <div className="text-2xl font-black mt-0.5">{suspendedAccounts.length}</div>
              <div className="text-[10px] text-rose-400 mt-0.5">🔒 Akoonno la xiray</div>
            </div>

            <div
              onClick={() => setAdminTab('rejected')}
              className="p-3.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-2xl transition-all cursor-pointer"
            >
              <div className="text-[10px] font-black uppercase">Rejected Requests</div>
              <div className="text-2xl font-black mt-0.5">{rejectedRequests.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">❌ Codsiyadii la diaday</div>
            </div>
          </div>
        </div>

        {/* Admin Section Tabs Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setAdminTab('pending')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              adminTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>📋 Codsiyada Cusub (Pending: {pendingRequests.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('active')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              adminTab === 'active'
                ? 'bg-[#0e7a48] text-white font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>✅ Akoonnada Active-ka ah ({activeStudents.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('suspended')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              adminTab === 'suspended'
                ? 'bg-rose-700 text-white font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>🔒 Hakadka (Suspended: {suspendedAccounts.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('rejected')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              adminTab === 'rejected'
                ? 'bg-slate-800 text-white font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>❌ Diidmada ({rejectedRequests.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('search')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              adminTab === 'search'
                ? 'bg-teal-700 text-white font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>🔍 Raadi Arday</span>
          </button>

          <button
            onClick={() => setAdminTab('content')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              adminTab === 'content'
                ? 'bg-purple-800 text-white font-black shadow-md'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Casharrada & Qur'aanka (Content)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ADMIN TAB 1: PENDING REQUESTS */}
        {/* ========================================================================= */}
        {adminTab === 'pending' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>Codsiyada Sugaya Ansixinta (Pending Approval)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kuwani waa codsiyadii ugu dambeeyay ee laga soo diray foomka diiwaangelinta Online-ka.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  {pendingRequests.length} Codsi Diman
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <div className="text-base font-bold text-slate-800">Ma jiraan codsiyo cusub oo pending ah.</div>
                  <p className="text-xs text-slate-500">Dhamaan codsiyadii diiwaangelinta waa la habeyay!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingRequests.map((reg) => (
                    <div
                      key={reg.id}
                      className="bg-slate-50 rounded-2xl p-5 border-2 border-amber-200/80 hover:border-amber-400 transition-all shadow-sm space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                            PENDING
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(reg.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[10px] font-bold uppercase">Magaca Ardayga:</div>
                          <div className="text-sm font-black text-slate-900">{reg.fullName}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px]">📞 Phone:</span>
                            <span className="font-mono font-bold text-slate-800">{reg.phone}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px]">📍 Magaalada:</span>
                            <span className="font-bold text-slate-800">{reg.cityCountry}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px]">👨‍👩‍👧 Waalidka:</span>
                            <span className="font-bold text-slate-800">{reg.parentName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block text-[10px]">📚 Class:</span>
                            <span className="font-bold text-emerald-800">{reg.gradeLevel}</span>
                          </div>
                        </div>

                        {reg.otherInfo && (
                          <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 text-[11px] font-medium italic">
                            💬 Notes: "{reg.otherInfo}"
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRejectingReg(reg)}
                          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>REJECT</span>
                        </button>
                        <button
                          onClick={() => setApprovingReg(reg)}
                          className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>APPROVE & CREATE ACCOUNT</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN TAB 2: ACTIVE STUDENTS */}
        {/* ========================================================================= */}
        {adminTab === 'active' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-700" />
                    <span>Akoonnada Active-ka ah ee Waxbarashada Online-ka</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dhamaan ardayda ama waalidiinta leh akoon Active ah oo si toos ah u geli kara casharrada.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                  {activeStudents.length} Akoon Active Ah
                </span>
              </div>

              {activeStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                  Weli ma jiraan akoonno active ah.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <th className="p-3">Magaca Ardayga</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Student ID</th>
                        <th className="p-3">Class / Heerka</th>
                        <th className="p-3">Telefoonka</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action (Maamul)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeStudents.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{reg.fullName}</td>
                          <td className="p-3 font-mono font-bold text-emerald-800">{reg.username || '—'}</td>
                          <td className="p-3 font-mono text-slate-700 font-bold">{reg.studentId || '—'}</td>
                          <td className="p-3 text-slate-700 font-semibold">{reg.assignedClassName || reg.gradeLevel}</td>
                          <td className="p-3 font-mono text-slate-600">{reg.phone}</td>
                          <td className="p-3 capitalize font-bold text-slate-700">{reg.role || 'student'}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              ACTIVE
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setManagingReg(reg)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold shadow-sm cursor-pointer"
                            >
                              ⚙️ MAAMUL AKOONKA
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN TAB 3: SUSPENDED ACCOUNTS */}
        {/* ========================================================================= */}
        {adminTab === 'suspended' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-700" />
                    <span>Akoonnada Hakadka ku jira (Suspended Accounts)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Akoonnada login-kooda la xiray. Waxaad dib u dhaqaajin kartaa markasta.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                  {suspendedAccounts.length} Suspended
                </span>
              </div>

              {suspendedAccounts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-bold">
                  Ma jiraan akoonno hakad ku jira.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suspendedAccounts.map((reg) => (
                    <div key={reg.id} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-black text-slate-900 text-sm">{reg.fullName}</div>
                        <div className="text-xs text-slate-600">
                          Username: <span className="font-mono font-bold text-rose-900">{reg.username}</span> • Phone: {reg.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => setManagingReg(reg)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer shrink-0"
                      >
                        <Power className="w-3.5 h-3.5 inline mr-1" />
                        <span>REACTIVATE / EDIT</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN TAB 4: REJECTED REQUESTS */}
        {/* ========================================================================= */}
        {adminTab === 'rejected' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-700" />
                <span>Codsiyadii la Diaday (Rejected Requests)</span>
              </h3>

              {rejectedRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-500 font-bold">
                  Ma jiraan codsiyo la diaday.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rejectedRequests.map((reg) => (
                    <div key={reg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{reg.fullName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                          REJECTED
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">📞 {reg.phone} • 📍 {reg.cityCountry}</div>
                      {reg.rejectionReason && (
                        <div className="text-xs text-rose-700 italic font-medium bg-rose-50 p-2 rounded-xl">
                          💬 Sababta: "{reg.rejectionReason}"
                        </div>
                      )}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setApprovingReg(reg)}
                          className="px-3 py-1.5 bg-[#0e7a48] text-white rounded-xl text-xs font-bold hover:bg-[#0b633a] cursor-pointer"
                        >
                          Ansixi Hadda (Approve)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN TAB 5: SEARCH STUDENTS */}
        {/* ========================================================================= */}
        {adminTab === 'search' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ku raadi Magaca, Telefoonka, Username-ka, Student ID-ga, ama Magaalada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Magaca Buuxa</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Telefoonka</th>
                      <th className="p-3">Magaalada</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Tallaabada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {searchFilteredRegs.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{reg.fullName}</td>
                        <td className="p-3 font-mono text-emerald-800">{reg.username || '—'}</td>
                        <td className="p-3 font-mono text-slate-600">{reg.phone}</td>
                        <td className="p-3 text-slate-600">{reg.cityCountry}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              reg.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : reg.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : reg.status === 'Suspended'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {reg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => (reg.status === 'Pending' ? setApprovingReg(reg) : setManagingReg(reg))}
                            className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            ⚙️ Manage
                          </button>
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
        {/* ADMIN TAB 6: ONLINE LEARNING CONTENT MANAGEMENT */}
        {/* ========================================================================= */}
        {adminTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-700" />
                <span>Casharrada & Akhriska Codka (Course & Voice Recitations)</span>
              </h3>
              <p className="text-xs text-slate-600 mb-6">
                Halkan waxaad ka maamuli kartaa casharrada la soo dhigo ama aad ku qiimeyn kartaa akhriska codka ah ee ardayda.
              </p>

              {/* Recitation Audio Submissions List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">🎤 Akhriska Codka ee Ardayda:</h4>
                {audioSubs.map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-black text-slate-900 text-sm">{sub.studentName}</div>
                      <div className="text-slate-600 font-medium">📖 {sub.surah} (Aayadaha {sub.ayahs})</div>
                      <div className="text-slate-400 text-[10px]">Date: {sub.date} • {sub.time}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.audioBase64OrUrl && <audio controls src={sub.audioBase64OrUrl} className="h-8 w-44" />}
                      <button
                        onClick={() => {
                          setGradingAudioSub(sub);
                          setGradeStars(sub.rating || 5);
                          setTeacherComment(sub.teacherComment || '');
                        }}
                        className="px-4 py-2 bg-[#0e7a48] text-white font-bold rounded-xl text-xs hover:bg-[#0b633a] shadow-xs cursor-pointer"
                      >
                        ⭐ Qiimee Codka
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: REGISTRATION MODAL */}
        <RemoteRegistrationModal
          isOpen={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          onSuccess={() => reloadData()}
        />

        {/* MODAL 2: ADMIN APPROVE & CREATE ACCOUNT MODAL */}
        <AdminCreateAccountModal
          isOpen={!!approvingReg}
          registration={approvingReg}
          onClose={() => setApprovingReg(null)}
          onSuccess={(updatedReg, newUser) => {
            reloadData();
            if (onUpdateUsers) onUpdateUsers(Storage.getUsers());
            if (onUpdateStudents) onUpdateStudents(Storage.getStudents());
            alert(`✅ Akoon-ka ${updatedReg.fullName} si guul leh ayaa loo abuuray! Status = Active.`);
          }}
          students={students}
        />

        {/* MODAL 3: ADMIN ACCOUNT MANAGEMENT MODAL */}
        <AdminAccountManagementModal
          isOpen={!!managingReg}
          registration={managingReg}
          onClose={() => setManagingReg(null)}
          onUpdate={() => {
            reloadData();
            if (onUpdateUsers) onUpdateUsers(Storage.getUsers());
            if (onUpdateStudents) onUpdateStudents(Storage.getStudents());
          }}
        />

        {/* MODAL 4: ADMIN REJECT REASON MODAL */}
        {rejectingReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <h3 className="text-base font-black text-rose-700">❌ Sababta loo diaday codsiga</h3>
              <div className="text-xs text-slate-600">
                Ardayga: <strong>{rejectingReg.fullName}</strong>
              </div>
              <textarea
                rows={3}
                placeholder="Qor sababta loo diaday codsiga..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingReg(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Kanasal
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-5 py-2 bg-rose-600 text-white font-black rounded-xl text-xs hover:bg-rose-700 cursor-pointer"
                >
                  Xaqiiji Diidmada
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CONDITIONAL VIEW 2: NON-LOGGED IN OR NON-ACTIVE USER PORTAL GATE
  // =========================================================================
  const isActiveUserLoggedIn =
    activeOnlineUser &&
    (activeOnlineUser.role === 'admin' ||
      registrations.some((r) => r.createdUserId === activeOnlineUser.id && r.status === 'Active') ||
      activeOnlineUser.status === 'Active');

  if (!isActiveUserLoggedIn) {
    return (
      <div className="space-y-6 pb-20">
        <OnlineLearningLoginPortal
          onLoginSuccess={(user) => {
            setActiveOnlineUser(user);
            reloadData();
          }}
          onOpenRegisterModal={() => setIsRegModalOpen(true)}
        />

        {/* REGISTRATION MODAL */}
        <RemoteRegistrationModal
          isOpen={isRegModalOpen}
          onClose={() => setIsRegModalOpen(false)}
          onSuccess={() => reloadData()}
        />
      </div>
    );
  }

  // =========================================================================
  // CONDITIONAL VIEW 3: ACTIVE LOGGED-IN STUDENT / PARENT CONTENT DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-6 pb-20">
      {/* Student Top Banner */}
      <div className="bg-gradient-to-r from-[#0e7a48] via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-black border border-emerald-300/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AKOON ACTIVE AH • {activeOnlineUser?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">🎓 WAXBARASHADA FOG (ONLINE LEARNING)</h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed font-medium">
              Kusoo dhowaw aaggaaga waxbarashada! Halkan waxaad ka helaysaa casharrada, Qur'aanka, akhriska codka ah, shaqo-guriyaasha, iyo imtixaannada direct.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4 text-emerald-300" />
              <span>🔑 BADAL PASSWORD-KA</span>
            </button>

            <button
              onClick={() => setActiveOnlineUser(null)}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-bold transition-all border border-rose-400/30 cursor-pointer"
            >
              Kutaxid (Logout)
            </button>
          </div>
        </div>
      </div>

      {/* Student Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveSubTab('home')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'home' ? 'bg-[#0e7a48] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>🏠 Boga Hore</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quran')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'quran' ? 'bg-[#0e7a48] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>📖 Qur'aanka & Codka</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lessons')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'lessons' ? 'bg-[#0e7a48] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>🎥 Casharrada (Media)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('homework')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'homework' ? 'bg-[#0e7a48] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📝 Shaqo-guri</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exams')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'exams' ? 'bg-[#0e7a48] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>📝 Imtixaannada</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai_assistant')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeSubTab === 'ai_assistant' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🤖 AI Assistant</span>
        </button>
      </div>

      {/* SUB-TAB 1: HOME */}
      {activeSubTab === 'home' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl border border-emerald-200 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-100 pb-3">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase">
                📖 CASHARKA MAANTA
              </span>
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>08:30 AM EAT • Fasalka Fog</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-lg font-black text-slate-900">
                  Surat Al-Kahf (Aayadaha 1 - 10) & Axaaktaamka Idghaamka Tajwiidka
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Sharaxaad kooban oo ku saabsan Idghaamka Bighunnah iyo Bilaa Ghunnah, akhriska saxda ah ee 10-ka aayadood ee Surat Al-Kahf.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveLessonModal(lessons[0])}
                    className="px-4 py-2 bg-[#0e7a48] text-white rounded-xl text-xs font-bold hover:bg-[#0b633a] shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>▶️ Daawo Casharka (Video)</span>
                  </button>

                  <button
                    onClick={() => setActiveLessonModal(lessons[0])}
                    className="px-4 py-2 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                    <span>🔊 Dhageyso Casharka</span>
                  </button>
                </div>
              </div>

              {/* Quick Audio Reciter */}
              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-black text-[#0e7a48] flex items-center gap-1.5 mb-1">
                    <Mic className="w-4 h-4" />
                    <span>🎤 Duub Akhriskaaga Codka Ah</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ku duub codkaaga akhriska Qur'aanka si Macallinku kuugu qiimeeyo.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab('quran')}
                  className="w-full py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-600 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bilow Duubista Codka</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QURAN & AUDIO */}
      {activeSubTab === 'quran' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Mic className="w-5 h-5 text-emerald-700" />
                <span>📖 Qur'aanka & Akhriska Codka ah (Voice Recitation Submission)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Duub codkaaga akhriska Qur'aanka Kariimka ah uuna Macallinku si toos ah uga qiimeeyo.
              </p>
            </div>

            {/* Recorder Controls */}
            <div className="p-6 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-3 text-left text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1">Surah (Surad):</label>
                  <input
                    type="text"
                    value={reciteSurah}
                    onChange={(e) => setReciteSurah(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Ayahs (Aayado):</label>
                  <input
                    type="text"
                    value={reciteAyahs}
                    onChange={(e) => setReciteAyahs(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Record Button */}
              <div className="py-4">
                {isRecording ? (
                  <button
                    onClick={stopAudioRecording}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-black text-xs shadow-xl animate-pulse flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Mic className="w-5 h-5" />
                    <span>JOOJI DUUBISTA ({recordingSeconds}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={startAudioRecording}
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-black text-xs shadow-xl flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Mic className="w-5 h-5" />
                    <span>BILOW DUUBISTA CODKA 🎙️</span>
                  </button>
                )}
              </div>

              {recordedAudioUrl && (
                <div className="space-y-3 pt-2">
                  <audio controls src={recordedAudioUrl} className="mx-auto w-full max-w-xs" />
                  <button
                    onClick={handleSendQuranAudio}
                    className="px-6 py-2.5 bg-[#0e7a48] text-white rounded-xl text-xs font-black shadow-md hover:bg-[#0b633a] cursor-pointer"
                  >
                    🚀 DIR AKHRISKA CODKA (SEND)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: AI ASSISTANT */}
      {activeSubTab === 'ai_assistant' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>🤖 AI Assistant Kaaliyaha Waxbarashada</span>
          </h3>

          <div className="space-y-3 h-80 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-md ${
                    msg.sender === 'user'
                      ? 'bg-[#0e7a48] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-xs font-medium'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendAiPrompt} className="flex gap-2">
            <input
              type="text"
              placeholder="Weydii AI su'aal ku saabsan Tajwiidka ama Casharrada..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isAiLoading || !aiPrompt.trim()}
              className="px-6 py-3 bg-[#0e7a48] text-white rounded-2xl font-black text-xs hover:bg-[#0b633a] shadow-md cursor-pointer disabled:opacity-50"
            >
              Dir 🚀
            </button>
          </form>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-700" />
              <span>🔑 BADAL PASSWORD-KAAGA</span>
            </h3>

            {changePasswordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold">
                {changePasswordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Geli Password Cusub *</label>
                <input
                  type="password"
                  required
                  placeholder="Geli password cusub..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] text-white font-black rounded-xl hover:bg-[#0b633a] cursor-pointer"
                >
                  Kaydi Password-ka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACTIVE LESSON VIEW */}
      {activeLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveLessonModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">{activeLessonModal.title}</h3>
            <div className="text-xs text-slate-500 font-medium">
              Maaddada: {activeLessonModal.subjectName} • Macallinka: {activeLessonModal.teacherName}
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs leading-relaxed font-semibold text-emerald-950">
              📖 Qoraalka Casharka:
              <br />
              {activeLessonModal.readingContent || activeLessonModal.description}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveLessonModal(null)}
                className="px-5 py-2 bg-[#0e7a48] text-white font-bold rounded-xl text-xs hover:bg-[#0b633a]"
              >
                Gartay, Xir Daaqadda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
