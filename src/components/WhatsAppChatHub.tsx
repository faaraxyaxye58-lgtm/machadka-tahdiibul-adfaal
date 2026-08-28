import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Phone,
  MessageSquare,
  Smartphone,
  Paperclip,
  Mic,
  MicOff,
  CheckCheck,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  DollarSign,
  BookOpen,
  Award,
  Calendar,
  Volume2,
  X,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { Parent, Student, SchoolSettings, User, ParentChatMessage } from '../types';
import { db, COLLECTIONS, sanitizeForFirestore, subscribeCollection, saveItemToFirestore } from '../lib/firebase';
import { sendWhatsAppViaBackend } from '../lib/whatsappService';

interface WhatsAppChatHubProps {
  parents: Parent[];
  students: Student[];
  settings: SchoolSettings;
  currentUser: User | null;
  initialSelectedParentId?: string;
  onBackMobile?: () => void;
}

export const WhatsAppChatHub: React.FC<WhatsAppChatHubProps> = ({
  parents,
  students,
  settings,
  currentUser,
  initialSelectedParentId,
  onBackMobile,
}) => {
  const [messages, setMessages] = useState<ParentChatMessage[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>(
    initialSelectedParentId || parents[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'absent' | 'unpaid' | 'recent'>('all');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Subscribe to real-time parent_chats collection
  useEffect(() => {
    const unsub = subscribeCollection<ParentChatMessage>(COLLECTIONS.PARENT_CHATS, (chatList) => {
      // Sort oldest to newest for chat layout
      const sorted = [...chatList].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sorted);
    });
    return () => unsub();
  }, []);

  // Set initial selected parent if prop changes
  useEffect(() => {
    if (initialSelectedParentId) {
      setSelectedParentId(initialSelectedParentId);
    }
  }, [initialSelectedParentId]);

  // Auto-scroll chat to bottom on new message or parent switch
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedParentId, messages.length]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to clean phone numbers
  const cleanPhone = (phone: string): string => {
    let digits = phone.replace(/[^0-9]/g, '');
    if (
      digits.startsWith('061') ||
      digits.startsWith('063') ||
      digits.startsWith('062') ||
      digits.startsWith('068') ||
      digits.startsWith('065')
    ) {
      digits = '252' + digits.substring(1);
    } else if (digits.startsWith('61') || digits.startsWith('63') || digits.startsWith('62')) {
      digits = '252' + digits;
    }
    return digits;
  };

  const selectedParent = parents.find((p) => p.id === selectedParentId) || parents[0];

  // Match children for selected parent
  const parentStudents = students.filter(
    (s) =>
      s.parentPhone === selectedParent?.phone ||
      s.parentName?.toLowerCase().trim() === selectedParent?.fullName?.toLowerCase().trim() ||
      (selectedParent?.childrenIds && selectedParent.childrenIds.includes(s.id))
  );

  // Filter Parents List
  const filteredParents = parents.filter((p) => {
    const parentName = p.fullName || '';
    const phone = p.phone || '';
    const pStudents = students.filter(
      (s) => s.parentPhone === p.phone || s.parentName === p.fullName
    );
    const studentNames = pStudents.map((s) => s.fullName).join(' ');

    const matchesSearch =
      parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      studentNames.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'absent') {
      return pStudents.some((s) => s.status === 'Active');
    }
    if (activeFilter === 'unpaid') {
      return (p.totalPendingFees || 0) > 0 || pStudents.some((s) => s.feeStatus === 'Pending' || s.feeStatus === 'Overdue');
    }
    return true;
  });

  // Get messages for selected parent
  const currentChatMessages = messages.filter(
    (m) =>
      m.parentId === selectedParent?.id ||
      m.parentPhone === selectedParent?.phone ||
      m.parentName === selectedParent?.fullName
  );

  // Send Message Handler
  const handleSendMessage = async (customTxt?: string, mediaProps?: Partial<ParentChatMessage>) => {
    const textToSend = customTxt !== undefined ? customTxt : inputText;
    if (!textToSend.trim() && !mediaProps?.mediaType) return;
    if (!selectedParent) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('so-SO', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = `🕒 ${timeStr} · ${dateStr}`;

    const newMsg: ParentChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId: selectedParent.id,
      parentName: selectedParent.fullName,
      parentPhone: selectedParent.phone,
      studentName: parentStudents[0]?.fullName || 'Ardayga',
      senderId: currentUser?.id || 'admin',
      senderName: currentUser?.name || settings.schoolName || 'Maamulka Dugsiga',
      senderRole: (currentUser?.role as any) || 'admin',
      text: textToSend.trim(),
      status: 'read',
      timestamp: formattedTime,
      isWhatsAppSynced: true,
      ...mediaProps,
    };

    // Save to Firestore parent_chats collection
    try {
      await saveItemToFirestore(COLLECTIONS.PARENT_CHATS, newMsg);
      setInputText('');
      setSelectedTemplate(null);
      triggerToast('✅ Farriinta waxaa loo kaydiyay Firestore loona diray Waalidka!');

      // Send WhatsApp via Backend trigger as well
      sendWhatsAppViaBackend({
        recipientPhone: selectedParent.phone,
        recipientName: selectedParent.fullName,
        studentName: parentStudents[0]?.fullName || '',
        message: textToSend,
        event: 'Custom',
        gatewayUrl: settings.whatsappSettings?.gatewayUrl,
        instanceId: settings.whatsappSettings?.instanceId,
        apiKey: settings.whatsappSettings?.apiKey,
        isMockMode: settings.whatsappSettings?.mockMode !== false,
      });
    } catch (err: any) {
      console.error('Error sending chat message:', err);
      triggerToast('❌ Cillad ayaa ka dhacday dirista farriinta.');
    }
  };

  // Handle Voice Note Audio Dispatch
  const handleSendVoiceNote = () => {
    setIsRecording(false);
    const durationStr = `00:${recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}`;
    handleSendMessage(`🎙️ Farriin Cod ah (${durationStr})`, {
      mediaType: 'audio',
      audioDuration: durationStr,
    });
  };

  // Pre-defined Templates
  const templates = [
    {
      id: 'absent',
      icon: AlertTriangle,
      color: 'bg-rose-100 text-rose-800 border-rose-300',
      title: 'Maqnaansho',
      category: 'Absent' as const,
      text: `Asc Waalidka sharafta leh (${selectedParent?.fullName || 'Waalid'}), waxaa lagu ogeysiinayaa in ardaygaaga (${parentStudents[0]?.fullName || 'Ardayga'}) uu ka maqnaa dugsiga ${settings.schoolName} maanta. Fadlan nagala soo xiriir nambarka ${settings.phone}. Mahadsanid.`,
    },
    {
      id: 'fee',
      icon: DollarSign,
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      title: 'Bixinta Fee-da',
      category: 'Payment' as const,
      text: `Asc Waalidka sharafta leh (${selectedParent?.fullName || 'Waalid'}), waxaan ku xusuusinaynaa bixinta lacagta dugsiga ee ardayga (${parentStudents[0]?.fullName || 'Ardayga'}) oo ah $${parentStudents[0]?.feeMonthly || 15}. Ku soo bixi EVC/Zaad. Dugsiga ${settings.schoolName}.`,
    },
    {
      id: 'hifz',
      icon: BookOpen,
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      title: 'Warbixin Qur’aan',
      category: 'Hifz' as const,
      text: `Asc Waalidka sharafta leh (${selectedParent?.fullName || 'Waalid'}), waxaa laguugu bishaareynayaa in ardaygaaga (${parentStudents[0]?.fullName || 'Ardayga'}) uu maanta si wanaagsan u dhiibay dersiga Juz ${parentStudents[0]?.currentJuz || 1}. Hambalyo! ${settings.schoolName}.`,
    },
    {
      id: 'exam',
      icon: Award,
      color: 'bg-blue-100 text-blue-900 border-blue-300',
      title: 'Natiijo Imtixaan',
      category: 'Exam' as const,
      text: `Asc Waalidka sharafta leh (${selectedParent?.fullName || 'Waalid'}), waxaa laguu sheegayaa in natiijada imtixaanka ardayga (${parentStudents[0]?.fullName || 'Ardayga'}) ay tahay mid aad u wanaagsan. Mahadsanid dadaalkaaga. ${settings.schoolName}.`,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row h-[780px] relative">
      {/* Toast Overlay */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: PARENT CONTACTS LIST */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-slate-50/80 flex flex-col h-full shrink-0 ${selectedParentId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header Search & Title */}
        <div className="p-4 bg-slate-900 text-white space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md">
                <MessageSquare className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Sheekaysiga Waalidiinta</h3>
                <p className="text-[10px] text-emerald-300 font-mono">WhatsApp Community Hub</p>
              </div>
            </div>
            {onBackMobile && (
              <button onClick={onBackMobile} className="md:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Raadi waalid, arday, ama talefoon..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#25D366]"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-[#25D366] text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Dhammaan ({parents.length})
            </button>
            <button
              onClick={() => setActiveFilter('absent')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'absent'
                  ? 'bg-rose-500 text-white font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🚨 Arday Maqan
            </button>
            <button
              onClick={() => setActiveFilter('unpaid')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'unpaid'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              💰 Dain Leeh
            </button>
          </div>
        </div>

        {/* Contacts List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60">
          {filteredParents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <UserIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Ma jiraan waalidiin laga helay raadintaada.</p>
            </div>
          ) : (
            filteredParents.map((parent) => {
              const pStudents = students.filter(
                (s) =>
                  s.parentPhone === parent.phone ||
                  s.parentName?.toLowerCase().trim() === parent.fullName?.toLowerCase().trim() ||
                  (parent.childrenIds && parent.childrenIds.includes(s.id))
              );
              const isSelected = parent.id === selectedParentId;

              // Find last message for this parent
              const pMsgs = messages.filter(
                (m) => m.parentId === parent.id || m.parentPhone === parent.phone
              );
              const lastMsg = pMsgs[pMsgs.length - 1];

              return (
                <div
                  key={parent.id}
                  onClick={() => setSelectedParentId(parent.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-l-4 border-[#25D366]'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center border-2 border-white shadow-xs">
                        {parent.fullName?.charAt(0) || 'W'}
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{parent.fullName}</h4>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {lastMsg.timestamp.split(',')[1] || lastMsg.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[10px] font-semibold">
                          Arday: {pStudents[0]?.fullName || 'Tahdiib Student'}
                        </span>
                        {pStudents[0]?.className && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            ({pStudents[0].className})
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate font-sans">
                        {lastMsg ? lastMsg.text : `📞 ${parent.phone}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className={`flex-1 flex flex-col h-full bg-[#efeae2] ${!selectedParentId ? 'hidden md:flex' : 'flex'}`}>
        {selectedParent ? (
          <>
            {/* CHAT HEADER */}
            <div className="bg-[#075e54] text-white p-3.5 px-4 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedParentId('')}
                  className="md:hidden p-1 text-white hover:bg-white/10 rounded-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center border border-emerald-400">
                  {selectedParent.fullName?.charAt(0) || 'W'}
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{selectedParent.fullName}</span>
                    <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-200 text-[10px] font-normal rounded-full border border-emerald-400/30">
                      Waalid
                    </span>
                  </h3>
                  <div className="text-[11px] text-emerald-200 flex items-center gap-2 font-mono">
                    <span>📱 {selectedParent.phone}</span>
                    <span>•</span>
                    <span className="text-emerald-300 font-bold">
                      Ardayga: {parentStudents.map((s) => s.fullName).join(', ') || 'Arday'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-2">
                {/* Call Button */}
                <a
                  href={`tel:${selectedParent.phone}`}
                  className="p-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all"
                  title="Wac Toos (Direct Phone Call)"
                >
                  <Phone className="w-4 h-4 text-emerald-200" />
                  <span className="hidden sm:inline">Wac</span>
                </a>

                {/* Native Device SMS Link */}
                <a
                  href={`sms:${selectedParent.phone}?body=${encodeURIComponent(
                    `Asc Waalid ${selectedParent.fullName}, ku saabsan dugsiga ${settings.schoolName}...`
                  )}`}
                  className="p-2 bg-indigo-700 hover:bg-indigo-600 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all"
                  title="Native SMS App"
                >
                  <Smartphone className="w-4 h-4 text-indigo-200" />
                  <span className="hidden sm:inline">Device SMS</span>
                </a>

                {/* Direct WhatsApp Official Link */}
                <a
                  href={`https://wa.me/${cleanPhone(selectedParent.phone)}?text=${encodeURIComponent(
                    `Asc Waalid ${selectedParent.fullName}, kani waa maamulka dugsiga ${settings.schoolName}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-[#25D366] hover:bg-[#1ebc57] rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                  title="Fur WhatsApp-ka Rasmiga Ah"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">Official WA</span>
                </a>
              </div>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Security Banner */}
              <div className="bg-amber-100/90 border border-amber-300 text-amber-900 p-2.5 rounded-xl text-center text-xs font-semibold shadow-2xs max-w-lg mx-auto">
                🔒 Farriimaha nidaamkan waxay toos ugu kaydsamaan Firestore loona sii marayaa WhatsApp API Gateway daahfurka waalidiinta.
              </div>

              {currentChatMessages.length === 0 ? (
                <div className="p-8 text-center space-y-3 my-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#075e54] mx-auto flex items-center justify-center font-bold">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Sheekaysi cusub oo lala yeelanayo {selectedParent.fullName}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Ku doorho mid ka mid ah template-yada hoose ama qor farriintaada si aad u gaarsiiso waalidka.
                  </p>
                </div>
              ) : (
                currentChatMessages.map((msg) => {
                  const isSchoolSender = msg.senderRole === 'admin' || msg.senderRole === 'teacher' || msg.senderRole === 'finance';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSchoolSender ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md md:max-w-lg p-3.5 rounded-2xl shadow-xs space-y-1.5 ${
                          isSchoolSender
                            ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-emerald-200'
                            : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        {/* Sender Label */}
                        <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-emerald-800 border-b border-emerald-200/50 pb-1">
                          <span>{msg.senderName}</span>
                          <span className="font-mono text-slate-500">{msg.timestamp}</span>
                        </div>

                        {/* Media rendering if audio */}
                        {msg.mediaType === 'audio' ? (
                          <div className="flex items-center gap-3 bg-emerald-100/80 p-2 rounded-xl border border-emerald-300">
                            <button className="w-8 h-8 rounded-full bg-[#075e54] text-white flex items-center justify-center cursor-pointer">
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <div className="flex-1 space-y-1">
                              <div className="h-1 bg-emerald-300 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-[#075e54] w-2/3" />
                              </div>
                              <div className="text-[10px] font-mono text-slate-600 flex justify-between">
                                <span>{msg.audioDuration || '00:08'}</span>
                                <span>Farriin Cod ah</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        )}

                        {/* Status Checkmark */}
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                          <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* QUICK PRE-SET TEMPLATES SELECTOR */}
            <div className="bg-white p-2.5 border-t border-slate-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Templates-ka Fariimaha Degdegga Ah (1-Click Presets):</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {templates.map((tpl) => {
                  const IconComp = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setInputText(tpl.text);
                        setSelectedTemplate(tpl.id);
                      }}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        selectedTemplate === tpl.id
                          ? 'bg-[#075e54] text-white border-[#075e54]'
                          : `${tpl.color} hover:brightness-95`
                      }`}
                    >
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tpl.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CHAT INPUT FORM */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
              {/* Record Voice Note Button */}
              {isRecording ? (
                <div className="flex items-center gap-2 bg-rose-100 border border-rose-300 text-rose-900 px-3 py-1.5 rounded-2xl flex-1 animate-pulse text-xs font-bold">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                  <span>Waa la duubayaa codka... ({recordingSeconds}s)</span>
                  <button
                    onClick={handleSendVoiceNote}
                    className="ml-auto px-3 py-1 bg-rose-600 text-white rounded-xl text-xs cursor-pointer font-bold"
                  >
                    Send Voice
                  </button>
                  <button
                    onClick={() => setIsRecording(false)}
                    className="p-1 text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRecording(true)}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl transition-colors cursor-pointer"
                    title="Duub Farriin Cod ah"
                  >
                    <Mic className="w-5 h-5 text-[#075e54]" />
                  </button>

                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Qor farriintaada halkan..."
                    className="flex-1 px-4 py-2 text-xs bg-white border border-slate-300 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-[#075e54] resize-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-[#25D366] hover:bg-[#1ebc57] disabled:bg-slate-300 text-white rounded-2xl transition-all cursor-pointer shadow-md shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="m-auto p-12 text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-[#075e54] mx-auto opacity-50" />
            <h3 className="font-bold text-slate-700 text-sm">Fadlan ka doorho waalid liiska bidixda si aad ugu bilowdo sheekaysiga.</h3>
          </div>
        )}
      </div>
    </div>
  );
};
