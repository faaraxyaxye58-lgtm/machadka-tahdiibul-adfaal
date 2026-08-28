import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  MessageSquare,
  History,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  User,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  FileText,
  CheckSquare,
  DollarSign,
  BookOpen,
  PhoneCall,
  Smartphone,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';

import {
  Student,
  ClassRoom,
  SchoolSettings,
  User as AppUser,
} from '../types';

import {
  SmsLogRecord,
  sendSMS,
  subscribeSmsLogs,
  normalizeSomaliaPhoneNumber,
  fetchSmsBalance,
  sendDirectSimSms,
  openNativeSmsApp,
  openDirectWhatsApp,
} from '../lib/smsService';

interface SmsManagementViewProps {
  students: Student[];
  parents: any[];
  teachers: any[];
  classes: ClassRoom[];
  settings?: SchoolSettings;
  currentUser?: AppUser | null;
  onSaveSettings?: (newSettings: Partial<SchoolSettings>) => void;
  onOpenHormuudApplicationModal?: () => void;
}

export const SmsManagementView: React.FC<SmsManagementViewProps> = ({
  students,
  parents,
  teachers,
  classes,
  settings,
  currentUser,
  onSaveSettings,
  onOpenHormuudApplicationModal,
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'bulk' | 'history' | 'settings'>('send');

  // Logs & Balance state
  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [balanceData, setBalanceData] = useState<{
    balance: number | string | null;
    mode: 'live' | 'simulated' | 'not_configured';
    notice: string;
  }>({
    balance: null,
    mode: 'not_configured',
    notice: 'SMS service-ka weli lama xiriirin.',
  });

  // Form State for Dir SMS (Single SMS)
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [directPhone, setDirectPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [messageType, setMessageType] = useState<'General' | 'Absent' | 'Fee' | 'Hifz' | 'Notice'>('General');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessNotice, setSendSuccessNotice] = useState<string | null>(null);
  const [sendErrorNotice, setSendErrorNotice] = useState<string | null>(null);

  // Form State for Bulk SMS
  const [bulkAudience, setBulkAudience] = useState<'all_parents' | 'class_parents' | 'selected_parents' | 'teachers'>('all_parents');
  const [bulkClassId, setBulkClassId] = useState<string>('');
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [bulkMessageText, setBulkMessageText] = useState<string>('');
  const [bulkMessageType, setBulkMessageType] = useState<'General' | 'Absent' | 'Fee' | 'Notice'>('General');
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [bulkDispatchMode, setBulkDispatchMode] = useState<'api' | 'direct_sim'>('api');
  const [directSimSentMap, setDirectSimSentMap] = useState<Record<string, boolean>>({});

  // History Filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');

  // Settings State
  const [smsApiUrl, setSmsApiUrl] = useState<string>(
    settings?.smsSettings?.apiUrl || 'https://api.hormuud.com/v1/sms/send'
  );
  const [smsApiKey, setSmsApiKey] = useState<string>(settings?.smsSettings?.apiKey || '');
  const [smsUsername, setSmsUsername] = useState<string>(settings?.smsSettings?.username || '');
  const [smsPassword, setSmsPassword] = useState<string>(settings?.smsSettings?.password || '');
  const [smsTokenSecret, setSmsTokenSecret] = useState<string>(settings?.smsSettings?.tokenSecret || '');
  const [smsSenderId, setSmsSenderId] = useState<string>(settings?.smsSettings?.senderId || 'TAHDIIB-MIS');
  const [isMockMode, setIsMockMode] = useState<boolean>(settings?.smsSettings?.isMockMode ?? false);
  const [saveSettingsNotice, setSaveSettingsNotice] = useState<string | null>(null);

  // Subscribe to SMS logs in Firestore
  useEffect(() => {
    const unsubscribe = subscribeSmsLogs((logs) => {
      setSmsLogs(logs);
      setLoadingLogs(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch SMS Balance
  const refreshBalance = async () => {
    const res = await fetchSmsBalance({
      apiUrl: smsApiUrl,
      apiKey: smsApiKey,
    });
    setBalanceData({
      balance: res.balance,
      mode: res.mode,
      notice: res.notice,
    });
  };

  useEffect(() => {
    refreshBalance();
  }, [settings]);

  // Handle Parent Selection in Single SMS
  const handleSelectParent = (pId: string) => {
    setSelectedParentId(pId);
    if (!pId) {
      setDirectPhone('');
      setRecipientName('');
      setSelectedStudentId('');
      return;
    }

    const p = parents.find((item) => item.id === pId);
    if (p) {
      setRecipientName(p.name || p.fullName || 'Waalid');
      setDirectPhone(p.phone || p.phoneNumber || '');
      
      // Find associated student
      const matchedChild = students.find((st) => st.parentId === p.id || st.parentPhone === p.phone);
      if (matchedChild) {
        setSelectedStudentId(matchedChild.id);
      } else {
        setSelectedStudentId('');
      }
    }
  };

  // Phone Normalization Check for single phone
  const phoneNormResult = useMemo(() => {
    return normalizeSomaliaPhoneNumber(directPhone);
  }, [directPhone]);

  // Single SMS Character Count & Segments
  const charLength = messageText.length;
  const smsSegments = Math.ceil(charLength / 160) || 1;

  // Single SMS Presets
  const applyPresetTemplate = (type: 'Absent' | 'Fee' | 'Hifz' | 'Notice') => {
    setMessageType(type);
    let studentNameStr = '[MAGACA ARDAYGA]';
    if (selectedStudentId) {
      const st = students.find((s) => s.id === selectedStudentId);
      if (st) studentNameStr = st.fullName;
    }

    if (type === 'Absent') {
      setMessageText(
        `Waalid/Masuul, waxaa lagu wargelinayaa in ardayga ${studentNameStr} uu maanta ka maqnaa Machadka Tahdiibul Adfaal. Fadlan kala xiriir dugsiga.`
      );
    } else if (type === 'Fee') {
      const currentMonth = new Date().toLocaleString('so-SO', { month: 'long', year: 'numeric' });
      setMessageText(
        `Waalid/Masuul, waxaa lagu xusuusinayaa bixinta lacagta waxbarashada ee bisha (${currentMonth}) ee ardayga ${studentNameStr}. Fadlan la xiriir Machadka Tahdiibul Adfaal.`
      );
    } else if (type === 'Hifz') {
      setMessageText(
        `Waalid/Masuul, waxaa lagu wargelinayaa in ardayga ${studentNameStr} uu maanta si fiican u tasmiiciyay Casharkii Hifziga. Hambalyo!`
      );
    } else if (type === 'Notice') {
      setMessageText(
        `Waalid/Masuul, waxaa lagu ogeysiinayaa in berri ay fasax tahay waxbarashada Machadka Tahdiibul Adfaal. Waad mahadsan tihiin.`
      );
    }
  };

  // Dispatch Single SMS
  const handleSendSingleSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccessNotice(null);
    setSendErrorNotice(null);

    if (!phoneNormResult.isValid) {
      setSendErrorNotice(phoneNormResult.error || 'Lambarka telefoonka waa khaldan yahay (+252...).');
      return;
    }

    if (!messageText.trim()) {
      setSendErrorNotice('Fadlan qor fariinta SMS-ka ka hor inta aadan dirin.');
      return;
    }

    setIsSending(true);

    try {
      const result = await sendSMS({
        recipients: phoneNormResult.formattedPhone,
        parentId: selectedParentId,
        studentId: selectedStudentId,
        recipientName: recipientName || 'Waalid',
        recipientPhone: phoneNormResult.formattedPhone,
        studentName: students.find((s) => s.id === selectedStudentId)?.fullName || '',
        message: messageText.trim(),
        senderId: smsSenderId || 'TAHDIIB-MIS',
        senderUserId: currentUser?.id || 'admin',
        messageType,
        apiUrl: smsApiUrl,
        apiKey: smsApiKey,
        username: smsUsername,
        password: smsPassword,
        tokenSecret: smsTokenSecret,
        isMockMode,
      });

      if (result.success) {
        setSendSuccessNotice(
          result.notice || `SMS-ka si guul leh ayaa loogu diray ${phoneNormResult.formattedPhone}.`
        );
        setMessageText('');
        refreshBalance();
      } else {
        setSendErrorNotice(result.error || 'SMS-ka lama dirin. Fadlan hubi SMS API credentials-ka ama internet-ka.');
      }
    } catch (err: any) {
      setSendErrorNotice(err.message || 'Cillad ayaa ka dhacday dirista SMS-ka.');
    } finally {
      setIsSending(false);
    }
  };

  // Dispatch Single SMS via Direct Native SIM (API-Free)
  const handleSendSingleDirectSim = async () => {
    setSendSuccessNotice(null);
    setSendErrorNotice(null);

    if (!phoneNormResult.isValid) {
      setSendErrorNotice(phoneNormResult.error || 'Lambarka telefoonka waa khaldan yahay (+252...).');
      return;
    }

    if (!messageText.trim()) {
      setSendErrorNotice('Fadlan qor fariinta SMS-ka ka hor inta aadan dirin.');
      return;
    }

    try {
      const res = await sendDirectSimSms({
        recipients: phoneNormResult.formattedPhone,
        parentId: selectedParentId,
        studentId: selectedStudentId,
        recipientName: recipientName || 'Waalid',
        recipientPhone: phoneNormResult.formattedPhone,
        studentName: students.find((s) => s.id === selectedStudentId)?.fullName || '',
        message: messageText.trim(),
        senderId: smsSenderId || 'TAHDIIB-MIS',
        senderUserId: currentUser?.id || 'admin',
        messageType,
      });

      setSendSuccessNotice('SMS-ka waxaa lagu furay App-ka Telefoonkaaga (Native SIM Dispatch). Diiwaanka waa la kaydiyay.');
      setMessageText('');
    } catch (err: any) {
      setSendErrorNotice(err.message || 'Cillad ayaa ka dhacday dirista Direct SIM-ka.');
    }
  };

  // Dispatch Single WhatsApp Message
  const handleSendSingleWhatsApp = () => {
    setSendSuccessNotice(null);
    setSendErrorNotice(null);

    if (!phoneNormResult.isValid) {
      setSendErrorNotice('Lambarka telefoonka waa khaldan yahay.');
      return;
    }
    if (!messageText.trim()) {
      setSendErrorNotice('Fadlan qor fariinta ka hor inta aadan WhatsApp-ka u dirin.');
      return;
    }

    const ok = openDirectWhatsApp(phoneNormResult.formattedPhone, messageText.trim());
    if (ok) {
      setSendSuccessNotice('WhatsApp-ka waxaa lagu furay tab ama app cusub.');
    } else {
      setSendErrorNotice('Lama furi karo WhatsApp-ka.');
    }
  };

  // Single Item Direct SIM Dispatch for Bulk Queue
  const handleDirectSimBulkItemSend = async (item: { name: string; phone: string; parentId?: string; studentName?: string }) => {
    openNativeSmsApp(item.phone, bulkMessageText);
    setDirectSimSentMap((prev) => ({ ...prev, [item.phone]: true }));

    // Log to Firestore
    await sendDirectSimSms({
      recipients: item.phone,
      parentId: item.parentId,
      recipientName: item.name,
      recipientPhone: item.phone,
      studentName: item.studentName || '',
      message: bulkMessageText,
      senderId: smsSenderId || 'TAHDIIB-MIS',
      senderUserId: currentUser?.id || 'admin',
      messageType: bulkMessageType,
    });
  };

  // Bulk SMS Recipient List Calculation (with deduplication)
  const bulkRecipientsList = useMemo(() => {
    let list: { name: string; phone: string; studentName?: string; parentId?: string }[] = [];

    if (bulkAudience === 'all_parents') {
      parents.forEach((p) => {
        const phone = p.phone || p.phoneNumber;
        if (phone) {
          const norm = normalizeSomaliaPhoneNumber(phone);
          if (norm.isValid) {
            list.push({
              name: p.name || p.fullName || 'Waalid',
              phone: norm.formattedPhone,
              parentId: p.id,
            });
          }
        }
      });
    } else if (bulkAudience === 'class_parents') {
      if (bulkClassId) {
        const classStudents = students.filter((s) => s.classId === bulkClassId);
        classStudents.forEach((st) => {
          const p = parents.find((pr) => pr.id === st.parentId || pr.phone === st.parentPhone);
          const phone = st.parentPhone || (p && (p.phone || p.phoneNumber));
          if (phone) {
            const norm = normalizeSomaliaPhoneNumber(phone);
            if (norm.isValid) {
              list.push({
                name: p ? (p.name || p.fullName) : (st.parentName || 'Waalid'),
                phone: norm.formattedPhone,
                studentName: st.fullName,
                parentId: st.parentId,
              });
            }
          }
        });
      }
    } else if (bulkAudience === 'selected_parents') {
      selectedParentIds.forEach((pId) => {
        const p = parents.find((pr) => pr.id === pId);
        if (p) {
          const phone = p.phone || p.phoneNumber;
          if (phone) {
            const norm = normalizeSomaliaPhoneNumber(phone);
            if (norm.isValid) {
              list.push({
                name: p.name || p.fullName || 'Waalid',
                phone: norm.formattedPhone,
                parentId: p.id,
              });
            }
          }
        }
      });
    } else if (bulkAudience === 'teachers') {
      teachers.forEach((t) => {
        const phone = t.phone || t.phoneNumber;
        if (phone) {
          const norm = normalizeSomaliaPhoneNumber(phone);
          if (norm.isValid) {
            list.push({
              name: t.name || t.fullName || 'Macallin',
              phone: norm.formattedPhone,
            });
          }
        }
      });
    }

    // Deduplicate by phone number to prevent double sending
    const uniqueMap = new Map<string, { name: string; phone: string; studentName?: string; parentId?: string }>();
    list.forEach((item) => {
      if (!uniqueMap.has(item.phone)) {
        uniqueMap.set(item.phone, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [bulkAudience, bulkClassId, selectedParentIds, parents, students, teachers]);

  // Execute Bulk Dispatch
  const handleExecuteBulkSend = async () => {
    setShowBulkConfirmModal(false);
    if (bulkRecipientsList.length === 0) return;

    setIsBulkSending(true);
    setBulkProgress({ current: 0, total: bulkRecipientsList.length });

    const phoneNumbers = bulkRecipientsList.map((item) => item.phone);

    try {
      const result = await sendSMS({
        recipients: phoneNumbers,
        message: bulkMessageText.trim(),
        senderId: smsSenderId || 'TAHDIIB-MIS',
        senderUserId: currentUser?.id || 'admin',
        messageType: bulkMessageType,
        apiUrl: smsApiUrl,
        apiKey: smsApiKey,
        username: smsUsername,
        password: smsPassword,
        tokenSecret: smsTokenSecret,
        isMockMode,
      });

      if (result.success) {
        setSendSuccessNotice(
          `Bulk SMS si guul leh ayaa loo diray ${phoneNumbers.length} qof.`
        );
        setBulkMessageText('');
        refreshBalance();
        setActiveTab('history');
      } else {
        setSendErrorNotice(result.error || 'Cillad ayaa ka dhacday dirista Bulk SMS.');
      }
    } catch (err: any) {
      setSendErrorNotice(err.message || 'Cillad ayaa ka dhacday dirista Bulk SMS.');
    } finally {
      setIsBulkSending(false);
    }
  };

  // Filtered History Logs
  const filteredHistoryLogs = useMemo(() => {
    return smsLogs.filter((log) => {
      const matchesSearch =
        !historySearch ||
        log.recipients.toLowerCase().includes(historySearch.toLowerCase()) ||
        (log.recipientName && log.recipientName.toLowerCase().includes(historySearch.toLowerCase())) ||
        (log.studentName && log.studentName.toLowerCase().includes(historySearch.toLowerCase())) ||
        log.message.toLowerCase().includes(historySearch.toLowerCase());

      const matchesStatus =
        historyStatusFilter === 'all' ||
        log.status === historyStatusFilter;

      const matchesType =
        historyTypeFilter === 'all' ||
        log.messageType === historyTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [smsLogs, historySearch, historyStatusFilter, historyTypeFilter]);

  // History Metrics Calculations
  const metrics = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('so-SO');
    const sentToday = smsLogs.filter((l) => l.timestamp && l.timestamp.includes(todayStr)).length;
    const totalSent = smsLogs.filter((l) => l.status === 'sent' || l.status === 'delivered').length;
    const totalSimulated = smsLogs.filter((l) => l.status === 'simulated').length;
    const totalFailed = smsLogs.filter((l) => l.status === 'failed').length;

    return {
      total: smsLogs.length,
      sentToday,
      totalSent,
      totalSimulated,
      totalFailed,
    };
  }, [smsLogs]);

  // Save SMS Settings
  const handleSaveSmsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSettingsNotice(null);

    const newSmsSettings = {
      enabled: true,
      apiUrl: smsApiUrl.trim(),
      apiKey: smsApiKey.trim(),
      username: smsUsername.trim(),
      password: smsPassword.trim(),
      tokenSecret: smsTokenSecret.trim(),
      senderId: smsSenderId.trim() || 'TAHDIIB-MIS',
      isMockMode: isMockMode,
      smsBalance: typeof balanceData.balance === 'number' ? balanceData.balance : 100,
    };

    if (onSaveSettings) {
      onSaveSettings({
        smsSettings: newSmsSettings,
      });
    }

    setSaveSettingsNotice('Dejimaha Hormuud SMS API-ga si guul leh ayaa loo kaydiyay.');
    refreshBalance();
    setTimeout(() => setSaveSettingsNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold tracking-wide border border-emerald-500/30">
                📩 Hormuud / Deentire SMS Official Gateway
              </span>
              {isMockMode ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30 flex items-center gap-1">
                  🧪 Test / Mock Mode
                </span>
              ) : smsApiKey && smsApiKey.length >= 8 ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                  ⚡ Live Mode Active
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-semibold border border-rose-500/30 flex items-center gap-1">
                  ⚠️ Service Not Configured
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Nidaamka SMS Management ee Machadka
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Dir SMS dhab ah (+252) oo si toos ah ugu dhaca telefoonka waalidiinta, macallimiinta iyo maamulka. Isku xirka rasmiga ah ee Hormuud API & Diiwaanka Realtime.
            </p>
          </div>

          {/* SMS Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl flex flex-col sm:flex-row items-center gap-4 min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                SMS Balance (Haraga)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {balanceData.balance !== null ? balanceData.balance : (isMockMode ? '100' : '0')}
                </span>
                <span className="text-xs font-bold text-emerald-200 uppercase">
                  SMS Credits
                </span>
              </div>
              <button
                onClick={refreshBalance}
                className="text-[11px] text-emerald-300 hover:text-white underline flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Cusboonaysii Balance-ka
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Status Notices */}
      {isMockMode && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold block text-sm">🧪 TEST MODE — SMS dhab ah lama dirin.</strong>
            Nidaamku wuxuu ku jiraa qaabka tijaabada (Simulated Mode). Fariimaha aad darto lama kaarka SMS-ka Hormuud-kaaga lagama jarayo lacag, laakiin waxaa lagu diiwaan gelinaa Firestore `sms_logs` si loo tijaabiyo.
          </div>
        </div>
      )}

      {(!smsApiKey || smsApiKey.length < 8) && !isMockMode && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-rose-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold block text-sm">⚠️ SMS service-ka weli lama xiriirin.</strong>
              Fadlan geli SMS API credentials-ka Hormuud / Deentire ama shaqaysii Test Mode si aad SMS ugu dirto waalidiinta.
            </div>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
          >
            Geli API Credentials
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">SMS Maanta</p>
            <p className="text-xl font-black text-slate-900">{metrics.sentToday}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">La Diray (Live)</p>
            <p className="text-xl font-black text-emerald-600">{metrics.totalSent}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Test / Simulated</p>
            <p className="text-xl font-black text-amber-600">{metrics.totalSimulated}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Fashilmay</p>
            <p className="text-xl font-black text-rose-600">{metrics.totalFailed}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('send')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
            activeTab === 'send'
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Dir SMS (Single SMS)</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
            activeTab === 'bulk'
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Bulk SMS (Ogeysiis Wada-jir ah)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>SMS History ({smsLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>SMS Settings & API</span>
        </button>
      </div>

      {/* TAB 1: DIR SMS (SINGLE SMS) */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <span>Dir SMS Cusub</span>
                </h2>
                <p className="text-xs text-slate-500">
                  U dir fariin SMS ah waalid ama noombor gaar ah (+252).
                </p>
              </div>
            </div>

            {sendSuccessNotice && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 text-xs">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold block text-sm">Guul!</strong>
                  {sendSuccessNotice}
                </div>
              </div>
            )}

            {sendErrorNotice && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <strong className="font-bold block text-sm">Cillad!</strong>
                  {sendErrorNotice}
                </div>
              </div>
            )}

            <form onSubmit={handleSendSingleSms} className="space-y-5">
              {/* Parent Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Dooro Waalidka (Database-ka)
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => handleSelectParent(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                >
                  <option value="">-- Dooro waalid (ama ku qor lambarka hoose) --</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.fullName || 'Waalid'} ({p.phone || p.phoneNumber || 'Lambar ma jiro'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone & Recipient Name Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Magaca Waalidka / Qaabilaaga
                  </label>
                  <input
                    type="text"
                    placeholder="Tusaale: Maxamed Cali"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Lambarka Telefoonka (+252) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+25261XXXXXXX ama 061XXXXXXX"
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-bold outline-none transition-all ${
                      phoneNormResult.isValid
                        ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20 text-emerald-900'
                        : directPhone
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 text-slate-800'
                    }`}
                  />
                  {directPhone && (
                    <p className="mt-1 text-[11px] font-semibold">
                      {phoneNormResult.isValid ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> QAABKA RASMIGA AH: {phoneNormResult.formattedPhone}
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Lambarku ma aha +252 Soomaaliya
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Template Preset Buttons */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Doorashada Qoraal Diyaar ah (Templates)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Absent')}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> SMS Xaadiris (Maqnaansho)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Fee')}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> SMS Lacag-bixin (Xusuusin)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Hifz')}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> SMS Hifzi & Tasmiic
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Notice')}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ogeysiis Guud / Fasax
                  </button>
                </div>
              </div>

              {/* Message Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    4. Qoraalka SMS-ka <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-slate-500">
                    Character Count: <strong className="text-slate-900">{charLength}</strong> chars ({smsSegments} SMS segment)
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Qor fariinta SMS-ka halkan..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all leading-relaxed resize-y"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMessageText('');
                    setDirectPhone('');
                    setRecipientName('');
                    setSelectedParentId('');
                  }}
                  className="px-4 py-3 rounded-2xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Safree (Clear)
                </button>

                {/* Direct SIM Option (API-Free) */}
                <button
                  type="button"
                  disabled={!messageText.trim() || !phoneNormResult.isValid}
                  onClick={handleSendSingleDirectSim}
                  className="px-5 py-3 rounded-2xl font-bold text-xs text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  title="Wuxuu si toos ah fariinta uga furayaa SIM Card-ka/App-ka Telefoonkaaga (100% API-Free)"
                >
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>📱 DIR SMS TOOS AH (SIM CARD)</span>
                </button>

                {/* WhatsApp Option (API-Free) */}
                <button
                  type="button"
                  disabled={!messageText.trim() || !phoneNormResult.isValid}
                  onClick={handleSendSingleWhatsApp}
                  className="px-5 py-3 rounded-2xl font-bold text-xs text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  title="Fariinta si toos ah ugu dir WhatsApp-ka Waalidka"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>💬 WHATSAPP TOOS AH</span>
                </button>

                {/* Server API Option */}
                <button
                  type="submit"
                  disabled={isSending || !messageText.trim() || !phoneNormResult.isValid}
                  className="px-6 py-3 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Waa la dirayaa...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>DIR SMS (SERVER API)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Guidance Box */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 border border-indigo-800/50 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span>📱 SMS Toos Ah — API La'aan (100% Free)</span>
              </div>
              <p className="text-xs text-indigo-100/90 leading-relaxed">
                Haddii aadan lahayn API Key ama kaarka SMS-ka Hormuud, waxaad fariimaha si toos ah uga diri kartaa <strong>SIM Card-ka Telefoonkaaga</strong> ama <strong>WhatsApp</strong>!
              </p>
              <ul className="text-xs text-indigo-200/90 space-y-2 list-disc list-inside">
                <li><strong>📱 Direct SIM:</strong> Wuxuu furayaa app-ka SMS-ka ee telefoonkaaga (Android/iPhone) ama Windows/Mac.</li>
                <li><strong>💬 WhatsApp Toos Ah:</strong> Wuxuu furayaa WhatsApp Web ama App-ka.</li>
                <li><strong>📜 Diiwaangelin:</strong> Fariin kasta oo la diro waxaa lagu diiwaan geliyaa database-ka Realtime-ka.</li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Qaabka Lambarrada Soomaaliya</span>
              </h3>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-800 border border-slate-200">
                  +252 61 500 1122 <span className="text-emerald-600 font-bold">(Rasmiga ah)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-800 border border-slate-200">
                  061 500 1122 <span className="text-emerald-600 font-bold">(Local format)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BULK SMS (OGEYSIIS WADA-JIR AH) */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Bulk SMS — Ogeysiis Wada-jir ah</span>
              </h2>
              <p className="text-xs text-slate-500">
                U dir SMS hal mara dhammaan waalidiinta, fasal gaar ah ama macallimiinta.
              </p>
            </div>

            <div className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Loo dirayaa: {bulkRecipientsList.length} qof (Unique numbers)</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Audience Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Dooro Kooxda Loo Dirayo (Target Audience)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkAudience('all_parents')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    bulkAudience === 'all_parents'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">👥 Dhammaan Waalidiinta</p>
                  <p className="text-[11px] text-slate-500 mt-1">Waalid kasta oo DB-ka ku jira</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkAudience('class_parents')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    bulkAudience === 'class_parents'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">🏫 Fasal Gaar ah</p>
                  <p className="text-[11px] text-slate-500 mt-1">Waalidiinta fasal cayiman</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkAudience('selected_parents')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    bulkAudience === 'selected_parents'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">👨‍👩‍👧 Waalidiin La Doortay</p>
                  <p className="text-[11px] text-slate-500 mt-1">Gees-ka-gees u dooro</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkAudience('teachers')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    bulkAudience === 'teachers'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">👨‍🏫 Macallimiinta</p>
                  <p className="text-[11px] text-slate-500 mt-1">Dhammaan macallimiinta</p>
                </button>
              </div>
            </div>

            {/* Sub-selector for Class */}
            {bulkAudience === 'class_parents' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dooro Fasalka
                </label>
                <select
                  value={bulkClassId}
                  onChange={(e) => setBulkClassId(e.target.value)}
                  className="w-full sm:w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">-- Dooro fasalka --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({students.filter((s) => s.classId === c.id).length} Arday)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector for Selected Parents */}
            {bulkAudience === 'selected_parents' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Dooro Waalidiinta ({selectedParentIds.length} la doortay)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedParentIds.length === parents.length) {
                        setSelectedParentIds([]);
                      } else {
                        setSelectedParentIds(parents.map((p) => p.id));
                      }
                    }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    {selectedParentIds.length === parents.length ? 'Balaadhi Dhammaan' : 'Dooro Dhammaan'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
                  {parents.map((p) => {
                    const isChecked = selectedParentIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedParentIds(selectedParentIds.filter((id) => id !== p.id));
                            } else {
                              setSelectedParentIds([...selectedParentIds, p.id]);
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="font-semibold">{p.name || p.fullName}</span>
                        <span className="text-[11px] text-slate-400">({p.phone || p.phoneNumber})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bulk Message Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  2. Qoraalka Ogeysiiska Bulk SMS <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-slate-500">
                  Character Count: {bulkMessageText.length} chars
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="Qor fariinta guud ee aad u dirayso dhammaan waalidiinta..."
                value={bulkMessageText}
                onChange={(e) => setBulkMessageText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Dispatch Method Selector (API vs Direct SIM) */}
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-200/80 space-y-3">
              <label className="block text-xs font-bold text-indigo-950 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>3. Dooro Habka Dirista Bulk SMS (Dispatch Method)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkDispatchMode('api')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    bulkDispatchMode === 'api'
                      ? 'border-emerald-500 bg-white text-emerald-950 ring-2 ring-emerald-200 font-bold'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>🚀 Server API Dispatch (Auto Bulk)</span>
                  </div>
                  <p className="text-[11px] font-normal text-slate-500 mt-1">
                    Wuxuu si toos ah server-ka uga dirayaa oo dhan isaga oo isticmaalaya Hormuud SMS API.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkDispatchMode('direct_sim')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    bulkDispatchMode === 'direct_sim'
                      ? 'border-indigo-500 bg-white text-indigo-950 ring-2 ring-indigo-200 font-bold'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>📱 Direct SIM Queue (API-Free / 100% Free)</span>
                  </div>
                  <p className="text-[11px] font-normal text-slate-500 mt-1">
                    Mid-mid kaga dir SIM Card-ka ama WhatsApp-ka telefoonkaaga adigoo aan wax API ah isticmaalin!
                  </p>
                </button>
              </div>
            </div>

            {/* Direct SIM Interactive Dispatch Queue */}
            {bulkDispatchMode === 'direct_sim' && (
              <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">
                      📱 Safka Dirista Direct SIM ({Object.keys(directSimSentMap).length} / {bulkRecipientsList.length} La Diray)
                    </h3>
                  </div>
                  <span className="text-xs text-indigo-300 font-mono">100% Free - SIM Dispatch</span>
                </div>

                {!bulkMessageText.trim() ? (
                  <p className="text-xs text-amber-300 italic p-3 bg-amber-950/40 rounded-xl border border-amber-800/40">
                    ⚠️ Fadlan marka hore qor fariinta ogeysiiska qaybta sare si aad safka u bilowdo.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {bulkRecipientsList.map((item, idx) => {
                      const isDone = Boolean(directSimSentMap[item.phone]);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isDone
                              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                              : 'bg-slate-800/80 border-slate-700 text-slate-100'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">{idx + 1}. {item.name}</span>
                              {item.studentName && (
                                <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md">
                                  Ardayga: {item.studentName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-indigo-300 mt-0.5">{item.phone}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isDone ? (
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> LA DIRAY
                              </span>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleDirectSimBulkItemSend(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Dir SMS (SIM)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openDirectWhatsApp(item.phone, bulkMessageText)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button & Confirmation Modal Trigger for Server API */}
            {bulkDispatchMode === 'api' && (
              <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={!bulkMessageText.trim() || bulkRecipientsList.length === 0}
                  onClick={() => setShowBulkConfirmModal(true)}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>DIR BULK SMS ({bulkRecipientsList.length} RECIPIENTS - SERVER API)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK CONFIRMATION MODAL */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Xaqiijinta Dirista Bulk SMS</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ma hubtaa inaad SMS u dirayso <strong className="text-slate-900 font-bold">{bulkRecipientsList.length} qof</strong>?
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto space-y-1">
              {bulkRecipientsList.slice(0, 8).map((item, idx) => (
                <div key={idx} className="text-[11px] text-slate-700 flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-mono text-slate-500">{item.phone}</span>
                </div>
              ))}
              {bulkRecipientsList.length > 8 && (
                <p className="text-[10px] text-slate-400 text-center pt-1 font-bold">
                  ...iyo {bulkRecipientsList.length - 8} qof oo kale
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                JOOJI (Cancel)
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkSend}
                disabled={isBulkSending}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                {isBulkSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Waa la dirayaa...</span>
                  </>
                ) : (
                  <span>HAA, DIR SMS</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMS HISTORY & LOGS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Diiwaanka SMS-ka (SMS History Logs)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Laga soo qabtay Firestore Realtime Database `sms_logs` collection.
              </p>
            </div>
            <button
              onClick={() => setLoadingLogs(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Cusboonaysii</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Radian magaca, telefoonka ama fariinta..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="all">Dhammaan Status-yada</option>
              <option value="sent">La Diray (Sent)</option>
              <option value="delivered">La Gaarsiiyey (Delivered)</option>
              <option value="simulated">Test / Simulated</option>
              <option value="failed">Fashilmay (Failed)</option>
            </select>

            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="all">Dhammaan Noocyada</option>
              <option value="Absent">Xaadiris (Absent)</option>
              <option value="Fee">Lacag-bixin (Fee)</option>
              <option value="Hifz">Hifzi</option>
              <option value="Notice">Ogeysiis</option>
              <option value="General">Guud</option>
            </select>
          </div>

          {/* Table / List */}
          {loadingLogs ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Soo daabuluqa Diiwaanka SMS-ka...
            </div>
          ) : filteredHistoryLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p>Wax SMS log ah ma lagu helin raadintaada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">Waalidka / Recipient</th>
                    <th className="p-3">Telefoonka</th>
                    <th className="p-3">Fariinta</th>
                    <th className="p-3">Nooca</th>
                    <th className="p-3">Taariikhda</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {log.recipientName || 'Waalid'}
                        {log.studentName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Ardayga: {log.studentName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-700">
                        {log.recipients || log.recipientPhone}
                      </td>
                      <td className="p-3 text-slate-800 max-w-xs truncate leading-relaxed" title={log.message}>
                        {log.message}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {log.messageType || 'General'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="p-3">
                        {log.status === 'sent' || log.status === 'delivered' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> La Diray
                          </span>
                        ) : log.status === 'simulated' ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" /> Simulated
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> Fashilmay
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SMS SETTINGS & API CONFIG */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Dejimaha Hormuud / Deentire SMS API</span>
              </h2>
              <p className="text-xs text-slate-500">
                U qaabee Hormuud Gateway credentials-ka si toos ah backend-ka ama ka codso API cusub Hormuud Telecom.
              </p>
            </div>

            {onOpenHormuudApplicationModal && (
              <button
                type="button"
                onClick={onOpenHormuudApplicationModal}
                className="px-5 py-2.5 bg-[#0e7a48] hover:bg-[#095733] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-200 flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>CODSIGA & DUKUMIINTIYADA HORMUUD</span>
              </button>
            )}
          </div>

          {/* OFFICIAL HORMUUD APPLICATION PROMOTIONAL CARD */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white rounded-2xl border border-emerald-500/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  HORMUUD TELECOM ENTERPRISE
                </span>
                <span className="text-emerald-400 text-xs font-mono font-bold">API & Sender ID Verification</span>
              </div>
              <h3 className="font-black text-sm text-white">
                Weli API Credentials kuma lahid Hormuud Telecom?
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Isticmaal portal-ka rasmiga ah ee Machadka Tahdiibul Adfaal si aad u diyaariso Warqadda Codsiga (Letterhead), aadna ugu gudbiso Shatiga Wasaaradda, Kaarka Maamulaha, iyo Shahaadada Aqoonsiga Nidaamka!
              </p>
            </div>

            {onOpenHormuudApplicationModal && (
              <button
                type="button"
                onClick={onOpenHormuudApplicationModal}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>BILOW CODSIGA HADA</span>
              </button>
            )}
          </div>

          {saveSettingsNotice && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{saveSettingsNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveSmsSettings} className="space-y-5 max-w-2xl">
            {/* Mode Toggle */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="block text-xs font-bold text-slate-900">
                  🧪 Test / Mock SMS Mode
                </strong>
                <span className="text-[11px] text-slate-500">
                  Marka la shido, SMS-ku dhab ahaan lama dirayo balance-kana ma go'ayo.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMockMode}
                  onChange={(e) => setIsMockMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* API URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HORMUUD_SMS_API_URL
              </label>
              <input
                type="text"
                value={smsApiUrl}
                onChange={(e) => setSmsApiUrl(e.target.value)}
                placeholder="https://api.hormuud.com/v1/sms/send"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* API KEY */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HORMUUD_SMS_API_KEY
              </label>
              <input
                type="password"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder="Geli Hormuud API Key-gaaga rasmiga ah"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  HORMUUD_SMS_USERNAME
                </label>
                <input
                  type="text"
                  value={smsUsername}
                  onChange={(e) => setSmsUsername(e.target.value)}
                  placeholder="Username-ka Hormuud API"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  HORMUUD_SMS_PASSWORD
                </label>
                <input
                  type="password"
                  value={smsPassword}
                  onChange={(e) => setSmsPassword(e.target.value)}
                  placeholder="Password-ka Hormuud API"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Sender ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HORMUUD_SENDER_ID (Magaca Dukaanka / Machadka)
              </label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                placeholder="TAHDIIB-MIS"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>KAYDI DEJIMAHA SMS-KA</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
