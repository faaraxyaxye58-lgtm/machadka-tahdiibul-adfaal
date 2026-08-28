import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  Save,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Volume2,
  MessageSquare,
  Search,
  Filter,
  WifiOff,
  CloudCheck,
  Send,
  BookOpen,
  User,
  Clock,
  Calendar,
  Share2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, ClassRoom, RecordedLesson, RecordedLessonQaMessage } from '../types';
import { db, COLLECTIONS, saveItemToFirestore, deleteItemFromFirestore, subscribeCollection } from '../lib/firebase';
import { Storage } from '../lib/storage';

interface LessonRecordingViewProps {
  currentUser?: UserType | null;
  classes?: ClassRoom[];
}

export const LessonRecordingView: React.FC<LessonRecordingViewProps> = ({
  currentUser,
  classes = [],
}) => {
  // Tabs for Teacher vs Student/Parent view
  const [activeTab, setActiveTab] = useState<'record' | 'archive'>('record');

  // Form State
  const [lessonTitle, setLessonTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedClassName, setSelectedClassName] = useState(classes[0]?.name || 'Fasalka 1-aad');
  const [subject, setSubject] = useState("Qur'aanka Kariimka ah");

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // in seconds
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Transcribe State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeStatusText, setTranscribeStatusText] = useState('');
  const [transcribeNotice, setTranscribeNotice] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Output Transcript State
  const [transcript, setTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [confidenceWarnings, setConfidenceWarnings] = useState<string[]>([]);
  const [customTermsDetected, setCustomTermsDetected] = useState<string[]>([]);

  // Lessons Collection & Search State
  const [lessons, setLessons] = useState<RecordedLesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [selectedLessonForQa, setSelectedLessonForQa] = useState<RecordedLesson | null>(null);

  // Ask AI Modal & QA State
  const [qaMessages, setQaMessages] = useState<RecordedLessonQaMessage[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Offline Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync class name when selector changes
  useEffect(() => {
    const match = classes.find((c) => c.id === selectedClassId);
    if (match) setSelectedClassName(match.name);
  }, [selectedClassId, classes]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to Lessons collection from Firestore
  useEffect(() => {
    const unsubscribe = subscribeCollection<RecordedLesson>(COLLECTIONS.LESSONS, (data) => {
      if (data && data.length > 0) {
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLessons(data);
        Storage.saveRecordedLessons(data);
      } else {
        const local = Storage.getRecordedLessons();
        setLessons(local);
      }
    });

    return () => unsubscribe();
  }, []);

  // Format Recording Timer MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Recording Handler
  const startRecording = async () => {
    try {
      setTranscribeNotice(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert blob to Base64 for persistent cloud/local storage & API delivery
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks on microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone Access Error:', err);
      setTranscribeNotice({
        type: 'error',
        text: 'Cillad: Ma suurtagalin in la helo Microphone-ka. Fadlan oggolaw ruqsadda (microphone permission).',
      });
    }
  };

  // Stop Recording Handler
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Transcribe Recording with Gemini Transcribe API
  const handleTranscribeWithGemini = async () => {
    if (!audioBase64) {
      setTranscribeNotice({
        type: 'warning',
        text: 'Fadlan marka hore duub audio-ga casharka ka hor inta aanad u beddelin qoraal.',
      });
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(15);
    setTranscribeStatusText('Codka casharka waxaa loo diyaarinayaa Gemini AI...');
    setTranscribeNotice(null);

    const progressInterval = setInterval(() => {
      setTranscribeProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 400);

    try {
      setTranscribeStatusText('Gemini Transcribe API ayaa rogeysa codka (Somali AI Transcribe)...');

      const response = await fetch('/api/lessons/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/webm',
          lessonTitle: lessonTitle || 'Casharka ' + selectedClassName,
          subjectName: subject,
        }),
      });

      clearInterval(progressInterval);
      setTranscribeProgress(100);

      const data = await response.json();

      if (data.success) {
        setTranscript(data.transcript);
        setConfidenceWarnings(data.confidenceWarnings || []);
        setCustomTermsDetected(data.customTermsDetected || []);

        setTranscribeNotice({
          type: 'success',
          text: '✅ Diiwaangalinta & Transcription-ku waa koodii oo guul leh! Qoraalkii waa la rogey oo waa la habeeyay.',
        });
      } else {
        throw new Error(data.error || 'Transcription-ku ma suurtagalin.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setTranscribeProgress(0);
      console.error('Transcribe Error:', err);
      setTranscribeNotice({
        type: 'error',
        text: `Cillad transcription-ka: ${err.message || 'Server-ku ma ka jawaabin'}.`,
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Save Recorded Lesson to Database
  const handleSaveLesson = async () => {
    if (!lessonTitle.trim()) {
      setTranscribeNotice({
        type: 'warning',
        text: 'Fadlan ka soo buuxi Magaca Casharka.',
      });
      return;
    }

    if (!transcript.trim()) {
      setTranscribeNotice({
        type: 'warning',
        text: 'Fadlan U Beddel Qoraal (Transcribe) ka hor inta aanad kaydin casharka.',
      });
      return;
    }

    const newLessonId = `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const newLesson: RecordedLesson = {
      id: newLessonId,
      title: lessonTitle.trim(),
      className: selectedClassName,
      classId: selectedClassId,
      subject,
      teacherId: currentUser?.teacherId || currentUser?.id || 'macallin-1',
      teacherName: currentUser?.name || 'Macallinka Machadka',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('so-SO', { hour: '2-digit', minute: '2-digit' }),
      audioUrl: audioUrl || undefined,
      audioBase64: audioBase64 || undefined,
      audioDuration: formatTimer(recordingTime),
      transcript: transcript.trim(),
      confidenceWarnings,
      customTermsUsed: customTermsDetected,
      createdAt: now.toISOString(),
      status: isOnline ? 'saved' : 'pending_sync',
      isOfflineCached: !isOnline,
    };

    try {
      if (isOnline) {
        await saveItemToFirestore(COLLECTIONS.LESSONS, newLesson);
      }

      const updatedLocal = [newLesson, ...lessons];
      setLessons(updatedLocal);
      Storage.saveRecordedLessons(updatedLocal);

      if (!isOnline) {
        setPendingSyncCount((prev) => prev + 1);
      }

      setTranscribeNotice({
        type: 'success',
        text: isOnline
          ? '🎉 Casharkii si guul leh ayaa loogu kaydiyay Cloud-ka Machadka iyo kaydka ardayda!'
          : '📡 Casharkii waa la kaydiyay (Offline Cache). Wuxuu si toos ah Cloud-ka u aadi doonaa marka internet-ku soo laabto.',
      });

      // Reset form
      setLessonTitle('');
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioBase64(null);
      setTranscript('');
      setRecordingTime(0);
      setConfidenceWarnings([]);
      setCustomTermsDetected([]);
    } catch (err: any) {
      console.error('Save Lesson Error:', err);
      setTranscribeNotice({
        type: 'error',
        text: 'Cillad ayaa ka dhacday kaydinta casharka. Fadlan dib u tijaabi.',
      });
    }
  };

  // Delete Lesson Handler
  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('Ma ziirtaa inaad tirtirto casharkan la duubay?')) return;

    try {
      await deleteItemFromFirestore(COLLECTIONS.LESSONS, id);
      const filtered = lessons.filter((l) => l.id !== id);
      setLessons(filtered);
      Storage.saveRecordedLessons(filtered);
    } catch (err) {
      console.error('Delete Lesson Error:', err);
    }
  };

  // Ask AI Question Handler
  const handleAskAi = async () => {
    if (!qaInput.trim() || !selectedLessonForQa) return;

    const userQuestion = qaInput.trim();
    setQaInput('');
    setIsAskingAi(true);

    const userMessage: RecordedLessonQaMessage = {
      id: `qa-${Date.now()}`,
      lessonId: selectedLessonForQa.id,
      senderId: currentUser?.id || 'usr-1',
      senderName: currentUser?.name || 'Arday/Waalid',
      senderRole: currentUser?.role || 'student',
      question: userQuestion,
      answer: 'Gemini AI ayaa su\'aasha ka jawaabeysa...',
      timestamp: new Date().toISOString(),
    };

    setQaMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/lessons/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userQuestion,
          transcript: selectedLessonForQa.transcript,
          lessonTitle: selectedLessonForQa.title,
          teacherName: selectedLessonForQa.teacherName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQaMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, answer: data.answer } : msg
          )
        );
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setQaMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? { ...msg, answer: `Cillad: ${err.message || 'Ma jawaabin AI'}` }
            : msg
        )
      );
    } finally {
      setIsAskingAi(false);
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.transcript.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = filterClass === 'all' || l.classId === filterClass || l.className === filterClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Gemini Transcribe API v3.5
              </span>
              {!isOnline && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold border border-amber-400/30 flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                  Offline Mode Active
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              🎙️ Duubista & Transcription-ka Casharrada
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl">
              Nidaamka rasmiga ah ee Macallimiinta Machadka Tahdiibul Adfaal oo codka casharka u beddela qoraal Af-Soomaali ah iyadoo la adeegsanayo Gemini AI Transcribe.
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/40">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'record'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>🎙️ Duubista Casharka</span>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'archive'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 Casharrada La Duubay ({lessons.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offline Status Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Internet-ku wuu go'an yahay (Offline Mode)</p>
              <p className="text-xs text-amber-700">
                Waa duubi kartaa casharka oo waad kaydsan kartaa local-ka. Marka internet-ku soo laabto ayaa loo sync-gareyn doonaa Cloud-ka.
              </p>
            </div>
          </div>
          {pendingSyncCount > 0 && (
            <span className="bg-amber-200 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingSyncCount} Cashar Pending Sync
            </span>
          )}
        </div>
      )}

      {/* MAIN TAB CONTENT */}
      {activeTab === 'record' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: Recording Controls & Form (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Mic className="w-5 h-5 text-emerald-600" />
                <span>Dhiwaanka Casharka Billaabi</span>
              </h2>

              {/* Form Input: Lesson Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Magaca Casharka / Ciwaanka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Axaaktaamta Nuun Saakinah & Izhaar"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Form Input: Class & Subject Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fasalka
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Maaddada
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  >
                    <option value="Qur'aanka Kariimka ah">Qur'aanka Kariimka ah</option>
                    <option value="Tajwiidka & Makhrajka">Tajwiidka & Makhrajka</option>
                    <option value="معلم القراءة القرءانية">معلم القراءة القرءانية</option>
                    <option value="Tarbiya & Akhlaaq">Tarbiya & Akhlaaq</option>
                    <option value="Af-Carabi">Af-Carabi</option>
                    <option value="Siyra & Taariikh">Siyra & Taariikh</option>
                  </select>
                </div>
              </div>

              {/* Live Audio Recording Visual Box */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white text-center space-y-4 relative overflow-hidden shadow-inner">
                {isRecording && (
                  <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />
                )}

                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    {isRecording
                      ? '🔴 Duubistu way socotaa...'
                      : audioUrl
                      ? '🟢 Duubistii waa la joojiyay'
                      : '⚪ Diyaar u ah duubista'}
                  </span>
                </div>

                {/* Live Timer Display */}
                <div className="text-4xl font-mono font-bold tracking-wider text-emerald-400">
                  {formatTimer(recordingTime)}
                </div>

                {/* Primary Recording Control Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Bilow Duubista</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 active:scale-95 animate-bounce"
                    >
                      <Square className="w-4 h-4" />
                      <span>Jooji Duubista</span>
                    </button>
                  )}

                  {audioUrl && !isRecording && (
                    <button
                      onClick={startRecording}
                      title="Sidoo kale dib u duub"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* HTML5 Audio Player for Playback */}
                {audioUrl && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dib u Dhageyso Audio-ga la duubay:</span>
                    </p>
                    <audio
                      ref={audioPlayerRef}
                      src={audioUrl}
                      controls
                      className="w-full h-9 rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
              </div>

              {/* Action Button: Transcribe with Gemini AI */}
              <button
                onClick={handleTranscribeWithGemini}
                disabled={!audioBase64 || isTranscribing}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  !audioBase64 || isTranscribing
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white active:scale-98'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
                <span>
                  {isTranscribing
                    ? 'Gemini Transcribe API ayaa rogeysa...'
                    : '🤖 U Beddel Qoraal (Gemini Transcribe)'}
                </span>
              </button>

              {/* Progress Indicator when Sending to AI */}
              {isTranscribing && (
                <div className="space-y-2 bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                  <div className="flex justify-between text-xs font-semibold text-amber-800">
                    <span>{transcribeStatusText}</span>
                    <span>{transcribeProgress}%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${transcribeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Notice Alert Box */}
              {transcribeNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                    transcribeNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : transcribeNotice.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {transcribeNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{transcribeNotice.text}</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Formatted Transcript & Custom Vocabulary Badges (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    📝 Qoraalka Casharka (Gemini Somali Transcript)
                  </h2>
                </div>

                {transcript && (
                  <button
                    onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingTranscript ? 'Saa xus' : 'Wax ka beddel'}</span>
                  </button>
                )}
              </div>

              {/* Detected Vocabulary Terms Badges */}
              {customTermsDetected.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Eexda & Ereyaanada Islaamiga ah ee AI-du ogaatay (Vocabulary):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {customTermsDetected.map((term, idx) => (
                      <span
                        key={idx}
                        className="bg-white text-emerald-800 border border-emerald-300 text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-2xs"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Confidence Warning Box */}
              {confidenceWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Calaamadeynta Shakiga (Low Confidence Parts):
                  </span>
                  <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
                    {confidenceWarnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transcript Display or Editor Area */}
              <div>
                {isEditingTranscript ? (
                  <textarea
                    rows={12}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Qoraalka casharka halkan ku hagaaji..."
                    className="w-full p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-sans leading-relaxed text-slate-800"
                  />
                ) : (
                  <div className="min-h-[280px] max-h-[420px] overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {transcript ? (
                      transcript
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 space-y-2">
                        <FileText className="w-10 h-10 stroke-1 text-slate-300" />
                        <p className="text-xs font-medium">
                          Fadlan duub casharka ka dibna taabo "U Beddel Qoraal" si halkan loogu muujiyo text-ka Af-Soomaaliga ah.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Lesson Button */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Status: {transcript ? '🟢 Ready to save' : '⚪ Awaiting transcript'}
                </span>

                <button
                  onClick={handleSaveLesson}
                  disabled={!transcript.trim()}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                    !transcript.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Kaydi Casharka</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ARCHIVE TAB: Student & Parent View (Casharrada La Duubay) */
        <div className="space-y-6">
          {/* Search & Class Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi cashar, macallin ama maaddada..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Dhamaan Fasallada</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lessons Cards List */}
          {filteredLessons.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
              <BookOpen className="w-12 h-12 stroke-1 text-slate-300 mx-auto" />
              <p className="text-base font-semibold text-slate-700">Weli laguma shubin casharro la duubay.</p>
              <p className="text-xs text-slate-400">
                Aas-aasa marka hore duubista cashar cusub si loogu kaydiyo diiwaanka.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Class & Date */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {lesson.className}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {lesson.date}
                      </span>
                    </div>

                    {/* Lesson Title & Subject */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        Maaddada: {lesson.subject}
                      </p>
                    </div>

                    {/* Teacher & Duration Info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {lesson.teacherName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {lesson.audioDuration}
                      </span>
                    </div>

                    {/* Audio Player */}
                    {lesson.audioBase64 || lesson.audioUrl ? (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <audio
                          src={lesson.audioBase64 || lesson.audioUrl}
                          controls
                          className="w-full h-8 opacity-90"
                        />
                      </div>
                    ) : null}

                    {/* Transcript Excerpt */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 font-sans line-clamp-3 leading-relaxed">
                      {lesson.transcript}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="bg-slate-50/80 p-3 px-5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedLessonForQa(lesson)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>🤖 Weydii AI</span>
                    </button>

                    {(currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                        title="Tirtir casharkan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASK AI MODAL FOR STUDENTS & PARENTS */}
      <AnimatePresence>
        {selectedLessonForQa && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-emerald-800 text-white p-4 px-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>🤖 Weydii AI oo ku saabsan Casharkan</span>
                  </h3>
                  <p className="text-xs text-emerald-100/80">
                    "{selectedLessonForQa.title}" — {selectedLessonForQa.teacherName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLessonForQa(null)}
                  className="text-emerald-200 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Lesson Transcript Viewer */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 max-h-36 overflow-y-auto text-xs text-slate-700 leading-relaxed font-sans">
                <span className="font-bold text-emerald-900 block mb-1">
                  📄 Qoraalka Casharka (Lesson Transcript):
                </span>
                {selectedLessonForQa.transcript}
              </div>

              {/* Q&A Conversation History */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-[220px]">
                {qaMessages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-xs space-y-1">
                    <Info className="w-6 h-6 stroke-1 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">Wax su'aal ah oo aad qabto weydii AI.</p>
                    <p>Jawaabtu waxay si toos ah uga iman doontaa oo keliya qoraalka casharkan.</p>
                  </div>
                ) : (
                  qaMessages.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {/* User Question */}
                      <div className="flex justify-end">
                        <div className="bg-emerald-600 text-white text-xs p-3 rounded-2xl rounded-tr-none max-w-[80%] font-medium">
                          {msg.question}
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-800 text-xs p-3 rounded-2xl rounded-tl-none max-w-[85%] space-y-1 border border-slate-200">
                          <span className="font-bold text-emerald-800 flex items-center gap-1 text-[11px]">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Tahdiib AI Assistant:
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Q&A Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Weidiisay su'aal ku saabsan casharkan..."
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  disabled={isAskingAi}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAskAi}
                  disabled={!qaInput.trim() || isAskingAi}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dir</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonRecordingView;
