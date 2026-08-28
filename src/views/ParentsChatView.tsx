import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Phone,
  MessageSquare,
  Users,
  UserCheck,
  Lock,
  Globe,
  Mic,
  CheckCheck,
  User as UserIcon,
  Sparkles,
  BookOpen,
  Volume2,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  ChevronLeft,
  School,
  ShieldCheck,
  Plus,
  Filter,
  Bell,
  Info,
  Smile,
  Paperclip,
  Megaphone,
} from 'lucide-react';
import { Parent, Student, Teacher, SchoolSettings, User, ParentChatMessage } from '../types';
import { COLLECTIONS, subscribeCollection, saveItemToFirestore } from '../lib/firebase';

interface ParentsChatViewProps {
  parents: Parent[];
  students: Student[];
  teachers: Teacher[];
  settings: SchoolSettings;
  currentUser: User | null;
}

export const ParentsChatView: React.FC<ParentsChatViewProps> = ({
  parents,
  students,
  teachers,
  settings,
  currentUser,
}) => {
  const [messages, setMessages] = useState<ParentChatMessage[]>([]);
  
  // Top Level Mode: 'group' (Dhammaan) vs 'private' (Gaar-gaar)
  const [chatMode, setChatMode] = useState<'group' | 'private'>('group');

  // Active Group Channel (when chatMode === 'group')
  // Default channels: 'general_all' (Fagaaraha Guud), 'hifz_updates' (Ogeysiisyada Hifziga)
  const [activeGroupChannelId, setActiveGroupChannelId] = useState<string>('general_all');

  // Selected parent ID for Private Chat (when chatMode === 'private')
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // UI Toast & Image Attachment states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Parent Role Check / Test Mode Toggle
  const isParentRole = currentUser?.role === 'parent';
  const [forceParentMode, setForceParentMode] = useState<boolean>(isParentRole);

  // Effective Parent object
  const effectiveParent =
    parents.find((p) => p.phone === currentUser?.phone || p.fullName === currentUser?.name) ||
    parents[0];

  const activeParent = forceParentMode
    ? effectiveParent
    : parents.find((p) => p.id === selectedParentId) || parents[0];

  // Set default selected parent on load if private
  useEffect(() => {
    if (!selectedParentId && parents.length > 0) {
      setSelectedParentId(parents[0].id);
    }
  }, [parents]);

  // Subscribe to real-time parent_chats collection from Firestore
  useEffect(() => {
    const unsub = subscribeCollection<ParentChatMessage>(COLLECTIONS.PARENT_CHATS, (chatList) => {
      const sorted = [...chatList].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sorted);
    });
    return () => unsub();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMode, activeGroupChannelId, selectedParentId, messages.length]);

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

  // Find students associated with activeParent
  const activeStudents = students.filter(
    (s) =>
      s.parentPhone === activeParent?.phone ||
      s.parentName?.toLowerCase().trim() === activeParent?.fullName?.toLowerCase().trim() ||
      (activeParent?.childrenIds && activeParent.childrenIds.includes(s.id))
  );

  // Defined Group Channels
  const groupChannels = [
    {
      id: 'general_all',
      name: '📢 Fagaaraha Guud ee Machadka',
      subtitle: 'Ogeysiisyada Guud & Dhammaan Waalidiinta',
      badge: 'Dhammaan',
      icon: Megaphone,
      color: 'bg-emerald-600',
    },
    {
      id: 'hifz_updates',
      name: '📖 Ogeysiisyada Hifziga & Qur’aanka',
      subtitle: 'Dardaaranka & Tartannada Hifziga',
      badge: 'Hifz Group',
      icon: BookOpen,
      color: 'bg-indigo-600',
    },
    {
      id: 'class_a',
      name: '🏫 Group-ka Fasalka 1-A',
      subtitle: 'Fasalka Muqaddimada & Juz Amma',
      badge: 'Fasalka 1-A',
      icon: Users,
      color: 'bg-amber-600',
    },
    {
      id: 'class_b',
      name: '🏫 Group-ka Fasalka 2-B',
      subtitle: 'Fasalka Dhaxe ee Hifziga',
      badge: 'Fasalka 2-B',
      icon: Users,
      color: 'bg-blue-600',
    },
  ];

  // Current Active Messages Filter
  const currentDisplayedMessages = messages.filter((m) => {
    if (chatMode === 'group') {
      return m.chatScope === 'group' && (m.channelId === activeGroupChannelId || (!m.channelId && activeGroupChannelId === 'general_all'));
    } else {
      // Private mode
      if (m.chatScope === 'group') return false;
      return (
        m.parentId === activeParent?.id ||
        m.parentPhone === activeParent?.phone ||
        m.parentName === activeParent?.fullName
      );
    }
  });

  // Send Message Handler
  const handleSendMessage = async (customText?: string, mediaProps?: Partial<ParentChatMessage>) => {
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend.trim() && !mediaProps?.mediaType && !attachedImage) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('so-SO', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = `🕒 ${timeStr} · ${dateStr}`;

    const isSendingAsParent = forceParentMode || currentUser?.role === 'parent';

    const newMsg: ParentChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId: chatMode === 'group' ? activeGroupChannelId : (activeParent?.id || 'parent_general'),
      parentName: chatMode === 'group'
        ? groupChannels.find((g) => g.id === activeGroupChannelId)?.name || 'Group'
        : (activeParent?.fullName || 'Waalid'),
      parentPhone: chatMode === 'group' ? 'group' : (activeParent?.phone || ''),
      studentName: activeStudents[0]?.fullName || 'Ardayga',
      senderId: currentUser?.id || (isSendingAsParent ? (activeParent?.id || 'parent') : 'admin'),
      senderName: isSendingAsParent
        ? (activeParent?.fullName || 'Waalid')
        : (currentUser?.name || settings.schoolName || 'Maamulka Dugsiga'),
      senderRole: isSendingAsParent ? 'parent' : ((currentUser?.role as any) || 'admin'),
      chatScope: chatMode,
      channelId: chatMode === 'group' ? activeGroupChannelId : activeParent?.id,
      channelName: chatMode === 'group'
        ? groupChannels.find((g) => g.id === activeGroupChannelId)?.name
        : activeParent?.fullName,
      text: textToSend.trim(),
      mediaType: attachedImage ? 'image' : mediaProps?.mediaType || 'text',
      mediaUrl: attachedImage || mediaProps?.mediaUrl,
      audioDuration: mediaProps?.audioDuration,
      status: 'read',
      timestamp: formattedTime,
      isWhatsAppSynced: false, // Pure Native App Chat
    };

    try {
      await saveItemToFirestore(COLLECTIONS.PARENT_CHATS, newMsg);
      setInputText('');
      setAttachedImage(null);
      triggerToast('✅ Farriintu si toos ah ayay ugu kaydsantay Nidaamka Chat-ka Machadka!');
    } catch (err: any) {
      console.error('Error sending message:', err);
      triggerToast('❌ Cillad ayaa ka dhacday dirista farriinta.');
    }
  };

  const handleSendVoiceNote = () => {
    setIsRecording(false);
    const durationStr = `00:${recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}`;
    handleSendMessage(`🎙️ Farriin Cod ah (${durationStr})`, {
      mediaType: 'audio',
      audioDuration: durationStr,
    });
  };

  // Quick prompts
  const groupPrompts = [
    `📢 Ogeysiis: Berri waxaa jiri doona tartanka Qur’aanka ee Fasallada Hifziga.`,
    `📖 Dardaaran: Waalidiinta waxaa laga codsanayaa in ay u sii heseeyaan ardayda dersiga maanta.`,
    `✨ Hambalyo: Dhammaan ardaydii ku baasay Imtixaanka Juz Amma.`,
  ];

  const privatePrompts = [
    `Asc Waalid, fadlan iga soo xiriir xafiiska maamulka berri.`,
    `Asc Macallin, maxay tahay warbixinta dersiga Qur'aanka ee ardayga maanta?`,
    `Asc, fadlan iga sii inta lacag ee bishan iigu dhiman dugsiga.`,
  ];

  // Filtered Parents List for Private mode
  const filteredParents = parents.filter((p) => {
    const pName = p.fullName?.toLowerCase() || '';
    const phone = p.phone || '';
    const query = searchQuery.toLowerCase();
    return pName.includes(query) || phone.includes(query);
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner / Mode Switcher */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#075e54] text-white rounded-2xl shadow-md border border-emerald-400/30">
            <School className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                💬 Sheekada Machadka Tahdiibul-Adfaal (Native Institute Chat)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
                Realtime Database
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Nidaamka wada sheekaysiga tooska ah oo madax-bannaan (Group & Private 1-on-1 Chats).
            </p>
          </div>
        </div>

        {/* Toggle Mode Button (Admin View vs Parent View) */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setForceParentMode(false)}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
              !forceParentMode
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏫 Admin / Macallin
          </button>
          <button
            type="button"
            onClick={() => setForceParentMode(true)}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
              forceParentMode
                ? 'bg-emerald-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👨‍👩‍👧 Waalid (Parent)
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row h-[760px] relative">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-emerald-400 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* LEFT PANEL: CHAT TABS & LIST (GROUP vs PRIVATE) */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-slate-50/90 flex flex-col h-full shrink-0 ${
          forceParentMode ? 'hidden md:flex' : selectedParentId && chatMode === 'private' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header Switcher: GROUP (Dhamaan) vs PRIVATE (Gaar-gaar) */}
          <div className="p-3.5 bg-slate-900 text-white space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs font-black">
              <button
                type="button"
                onClick={() => setChatMode('group')}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  chatMode === 'group'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>🌐 Dhammaan (Groups)</span>
              </button>

              <button
                type="button"
                onClick={() => setChatMode('private')}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  chatMode === 'private'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>🔒 Gaar-gaar (Private)</span>
              </button>
            </div>

            {/* Search if Private mode */}
            {chatMode === 'private' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Raadi waalid ama telefoon..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60">
            {chatMode === 'group' ? (
              /* GROUP CHANNELS LIST */
              <div className="p-2 space-y-2">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Fagaarayaasha & Group-yada Machadka
                </div>
                {groupChannels.map((channel) => {
                  const IconComp = channel.icon;
                  const isSelected = activeGroupChannelId === channel.id;
                  const channelMsgs = messages.filter(
                    (m) => m.chatScope === 'group' && m.channelId === channel.id
                  );
                  const lastMsg = channelMsgs[channelMsgs.length - 1];

                  return (
                    <div
                      key={channel.id}
                      onClick={() => setActiveGroupChannelId(channel.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl ${channel.color} text-white flex items-center justify-center shrink-0 shadow-xs font-bold`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">{channel.name}</h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {channel.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {lastMsg ? lastMsg.text : channel.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* PRIVATE PARENTS LIST */
              filteredParents.map((parent) => {
                const pStudents = students.filter(
                  (s) =>
                    s.parentPhone === parent.phone ||
                    s.parentName?.toLowerCase().trim() === parent.fullName?.toLowerCase().trim() ||
                    (parent.childrenIds && parent.childrenIds.includes(s.id))
                );
                const isSelected = parent.id === selectedParentId;
                const pMsgs = messages.filter(
                  (m) => (m.chatScope !== 'group') && (m.parentId === parent.id || m.parentPhone === parent.phone)
                );
                const lastMsg = pMsgs[pMsgs.length - 1];

                return (
                  <div
                    key={parent.id}
                    onClick={() => setSelectedParentId(parent.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-2xs">
                          {parent.fullName?.charAt(0) || 'W'}
                        </div>
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">{parent.fullName}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lastMsg ? lastMsg.text : `📞 ${parent.phone}`}
                        </p>
                        {pStudents[0] && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[9px] font-bold">
                            Arday: {pStudents[0].fullName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT MAIN CHAT WINDOW */}
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
          {/* Main Chat Header */}
          <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between shadow-md shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {chatMode === 'private' && !forceParentMode && (
                <button
                  onClick={() => setSelectedParentId('')}
                  className="md:hidden p-1 text-white hover:bg-white/10 rounded-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center border border-emerald-400 shadow-xs">
                {chatMode === 'group' ? (
                  <Globe className="w-5 h-5 text-white" />
                ) : forceParentMode ? (
                  '🏫'
                ) : (
                  activeParent?.fullName?.charAt(0) || 'W'
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>
                    {chatMode === 'group'
                      ? groupChannels.find((g) => g.id === activeGroupChannelId)?.name
                      : forceParentMode
                      ? `Maamulka Machadka (${settings.schoolName})`
                      : activeParent?.fullName}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-bold border border-emerald-500/30">
                    {chatMode === 'group' ? '🌐 Group Channel' : '🔒 Direct Chat'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 font-mono">
                  {chatMode === 'group'
                    ? groupChannels.find((g) => g.id === activeGroupChannelId)?.subtitle
                    : forceParentMode
                    ? `Ardayga: ${activeStudents[0]?.fullName || 'Tahdiib Student'}`
                    : `📱 ${activeParent?.phone || ''}`}
                </p>
              </div>
            </div>

            {/* Direct Phone Call Button */}
            {chatMode === 'private' && (
              <a
                href={`tel:${activeParent?.phone}`}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all"
                title="Wac Toos (Direct Phone Call)"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Wac</span>
              </a>
            )}
          </div>

          {/* MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Native Banner */}
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-2.5 rounded-2xl text-center text-xs font-extrabold shadow-2xs max-w-md mx-auto flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Daaqadda Wada Sheekaysiga Rasmiga ah ee Machadka Tahdiibul-Adfaal</span>
            </div>

            {currentDisplayedMessages.length === 0 ? (
              <div className="p-12 text-center space-y-3 my-auto">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-800 text-sm">
                  {chatMode === 'group'
                    ? `Fagaaraha ${groupChannels.find((g) => g.id === activeGroupChannelId)?.name}`
                    : `Sheekada ${activeParent?.fullName}`}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Qor farriintaada ama isticmaal fariimaha degdegga ah ee hoose.
                </p>
              </div>
            ) : (
              currentDisplayedMessages.map((msg) => {
                const isMe = forceParentMode
                  ? msg.senderRole === 'parent'
                  : msg.senderRole === 'admin' || msg.senderRole === 'teacher' || msg.senderRole === 'finance';

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md md:max-w-lg p-3.5 rounded-2xl shadow-xs space-y-1.5 ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none border border-emerald-500'
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      {/* Sender label & Timestamp */}
                      <div className={`flex items-center justify-between gap-3 text-[10px] font-bold border-b pb-1 ${
                        isMe ? 'text-emerald-100 border-emerald-500' : 'text-slate-700 border-slate-200'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMe ? 'bg-amber-300' : 'bg-emerald-600'}`} />
                          <span>{msg.senderName}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            isMe ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {msg.senderRole === 'parent' ? '👨‍👩‍👧 Waalid' : msg.senderRole === 'teacher' ? '📚 Macallin' : '🛡️ Maamul'}
                          </span>
                        </span>

                        <span className={`font-mono text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-md border shrink-0 ${
                          isMe ? 'bg-emerald-800/80 text-emerald-100 border-emerald-500' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{msg.timestamp}</span>
                        </span>
                      </div>

                      {/* Image Attachment Rendering */}
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48">
                          <img src={msg.mediaUrl} alt="Attachment" className="w-full object-cover" />
                        </div>
                      )}

                      {/* Voice Note Rendering */}
                      {msg.mediaType === 'audio' ? (
                        <div className={`flex items-center gap-3 p-2 rounded-xl border ${
                          isMe ? 'bg-emerald-700 border-emerald-500 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                        }`}>
                          <button className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                            isMe ? 'bg-white text-emerald-800' : 'bg-slate-900 text-white'
                          }`}>
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="h-1 bg-slate-300 rounded-full w-full overflow-hidden">
                              <div className={`h-full w-3/4 ${isMe ? 'bg-amber-300' : 'bg-emerald-600'}`} />
                            </div>
                            <div className="text-[10px] font-mono opacity-80 flex justify-between">
                              <span>{msg.audioDuration || '00:07'}</span>
                              <span>Farriin Cod ah</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap">{msg.text}</p>
                      )}

                      <div className={`flex items-center justify-end gap-1.5 text-[10px] pt-1 border-t ${
                        isMe ? 'text-emerald-200 border-emerald-500/50' : 'text-slate-500 border-slate-100'
                      }`}>
                        <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* QUICK PROMPTS CHIPS */}
          <div className="bg-white p-2.5 border-t border-slate-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Farriimaha Degdegga ah (1-Click Presets):</span>
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
              {(chatMode === 'group' ? groupPrompts : privatePrompts).map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 border border-slate-300 hover:border-emerald-300 font-bold whitespace-nowrap cursor-pointer transition-all shadow-2xs shrink-0"
                >
                  ⚡ {promptText.substring(0, 38)}...
                </button>
              ))}
            </div>
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
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
                <button onClick={() => setIsRecording(false)} className="p-1 text-slate-600 hover:text-slate-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl transition-colors cursor-pointer shrink-0"
                  title="Duub Cod"
                >
                  <Mic className="w-5 h-5 text-emerald-700" />
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
                  className="flex-1 px-4 py-2 text-xs bg-white border border-slate-300 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() && !attachedImage}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-2xl transition-all cursor-pointer shadow-md shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
