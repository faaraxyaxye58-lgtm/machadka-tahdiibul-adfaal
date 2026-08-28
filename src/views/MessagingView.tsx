import React, { useState, useEffect } from 'react';
import {
  Student,
  Parent,
  Teacher,
  AttendanceRecord,
  ClassRoom,
  SchoolSettings,
  WhatsAppSettings,
  BroadcastNotification,
  NotificationTargetAudience,
  NotificationPriority,
  User,
} from '../types';
import {
  Send,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Settings,
  Sparkles,
  Zap,
  FlaskConical,
  Key,
  ShieldCheck,
  RotateCw,
  Info,
  Check,
  Globe,
  BellRing,
  DollarSign,
  UserX,
  Radio,
  Siren,
  Volume2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  Users,
} from 'lucide-react';
import {
  sendSmsViaBackend,
  subscribeSmsLogs,
  validateApiKey,
  SmsLogRecord,
} from '../lib/smsService';
import {
  sendWhatsAppViaBackend,
  subscribeWhatsAppLogs,
  WhatsAppLogRecord,
  formatPhoneForWhatsApp,
} from '../lib/whatsappService';
import {
  subscribePushNotifications,
  sendPushNotificationToFirestore,
  deleteItemFromFirestore,
  saveItemToFirestore,
  COLLECTIONS,
} from '../lib/firebase';
import { WhatsAppChatHub } from '../components/WhatsAppChatHub';
import { ParentsChatView } from './ParentsChatView';

interface MessagingViewProps {
  students: Student[];
  parents: Parent[];
  attendance: AttendanceRecord[];
  classes: ClassRoom[];
  settings: SchoolSettings;
  teachers?: Teacher[];
  currentUser?: User | null;
  onSaveSettings?: (updatedSettings: SchoolSettings) => void;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  students,
  parents,
  attendance,
  classes,
  settings,
  teachers = [],
  currentUser = null,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'chat_hub' | 'absent' | 'broadcast' | 'push_broadcast' | 'history' | 'api' | 'whatsapp'>('chat_hub');

  // Push Notification State
  const [pushNotificationsList, setPushNotificationsList] = useState<BroadcastNotification[]>([]);
  const [pushTitle, setPushTitle] = useState<string>('🚨 DUGSIGU WAA FASAX MAANTA');
  const [pushMessage, setCustomPushMessage] = useState<string>(
    'Asc dhammaan waalidiinta iyo macallimiinta, waxaa idin ogeysiineynaa in Dugsigu fasax yahay maanta sababo la xidhiidha cimilada/roobka. Mahadsanidiin.'
  );
  const [pushTarget, setPushTarget] = useState<NotificationTargetAudience>('all');
  const [pushPriority, setPushPriority] = useState<NotificationPriority>('urgent');
  const [isSendingPush, setIsSendingPush] = useState<boolean>(false);

  // Filter Date for Attendance
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Broadcast Message State
  const [targetType, setTargetType] = useState<'single' | 'class' | 'all' | 'unpaid'>('single');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedClassBroadcast, setSelectedClassBroadcast] = useState<string>(classes[0]?.id || '');
  const [messageCategory, setMessageCategory] = useState<'Absent' | 'Fee' | 'Hifz' | 'General'>('Absent');
  const [customMessage, setCustomMessage] = useState<string>('');

  // API Gateway Settings State
  const [apiGateway, setApiGateway] = useState<string>('hormuud');
  const [apiKey, setApiKey] = useState<string>('');
  const [tokenSecret, setTokenSecret] = useState<string>('');
  const [senderId, setSenderId] = useState<string>(settings.schoolName || 'TAHDIIB-MIS');

  // MOCK / TEST MODE STATE (Default enabled for safe dry runs)
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiSuccessToast, setApiSuccessToast] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // WhatsApp Gateway & Automated Notification State
  const waConfig = settings.whatsappSettings || {
    enabled: true,
    autoAbsentAlert: true,
    autoPaymentAlert: true,
    gatewayUrl: 'https://api.ultramsg.com/instance10293/messages/chat',
    instanceId: 'instance10293',
    apiKey: 'wa_token_sample_892348',
    mockMode: true,
  };

  const [waEnabled, setWaEnabled] = useState<boolean>(waConfig.enabled ?? true);
  const [waAutoAbsent, setWaAutoAbsent] = useState<boolean>(waConfig.autoAbsentAlert ?? true);
  const [waAutoPayment, setWaAutoPayment] = useState<boolean>(waConfig.autoPaymentAlert ?? true);
  const [waGatewayUrl, setWaGatewayUrl] = useState<string>(waConfig.gatewayUrl || 'https://api.ultramsg.com/instance10293/messages/chat');
  const [waInstanceId, setWaInstanceId] = useState<string>(waConfig.instanceId || 'instance10293');
  const [waApiKey, setWaApiKey] = useState<string>(waConfig.apiKey || '');
  const [waMockMode, setWaMockMode] = useState<boolean>(waConfig.mockMode ?? true);

  // WhatsApp Direct Test Message State
  const [waTestPhone, setWaTestPhone] = useState<string>(students[0]?.parentPhone || '252615000000');
  const [waTestMessage, setWaTestMessage] = useState<string>('Asc Waalid, kani waa tijaabo WhatsApp API ah oo ka socota dugsiga.');

  // Firestore Realtime SMS Logs & WhatsApp Logs
  const [firestoreLogs, setFirestoreLogs] = useState<SmsLogRecord[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLogRecord[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subscribe to real-time Firestore `sms_logs`, `whatsapp_logs`, and `push_notifications`
  useEffect(() => {
    const unsubSms = subscribeSmsLogs((logsList) => {
      setFirestoreLogs(logsList);
    });
    const unsubWa = subscribeWhatsAppLogs((waLogsList) => {
      setWhatsappLogs(waLogsList);
    });
    const unsubPush = subscribePushNotifications((pushList) => {
      setPushNotificationsList(pushList);
    });
    return () => {
      unsubSms();
      unsubWa();
      unsubPush();
    };
  }, []);

  // Helper function to clean phone number
  const formatPhone = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (
      cleaned.startsWith('061') ||
      cleaned.startsWith('063') ||
      cleaned.startsWith('062') ||
      cleaned.startsWith('068') ||
      cleaned.startsWith('065') ||
      cleaned.startsWith('077')
    ) {
      cleaned = '252' + cleaned.substring(1);
    } else if (cleaned.startsWith('61') || cleaned.startsWith('63') || cleaned.startsWith('62')) {
      cleaned = '252' + cleaned;
    }
    return cleaned;
  };

  // Get absent students for selected date and class
  const absentRecords = attendance.filter((a) => {
    const isDate = a.date === selectedDate;
    const isAbsent = a.status === 'Absent';
    const isClass = selectedClassId === 'all' || a.classId === selectedClassId;
    return isDate && isAbsent && isClass;
  });

  const getStudentInfo = (studentId: string) => {
    return students.find((s) => s.id === studentId || s.studentId === studentId);
  };

  // Pre-built Message Generators
  const generateMessageText = (
    category: 'Absent' | 'Fee' | 'Hifz' | 'General',
    student?: Student
  ): string => {
    const stName = student ? student.fullName : '[Magaca Ardayga]';
    const parent = student ? student.parentName : '[Magaca Waalidka]';
    const fee = student ? student.feeMonthly || 15 : 15;

    switch (category) {
      case 'Absent':
        return `Asc Waalidka sharafta leh (${parent}), waxaa lagaa ogeysiinayaa in ardaygaaga (${stName}) uu ka maqnaa dugsiga Qur'aanka ee ${settings.schoolName} maanta oo taariikhdu tahay ${selectedDate}. Fadlan dib ugala xiriir maamulka dugsiga ama macallinka nambarka ${settings.phone}. Waad mahadsan tahay.`;
      case 'Fee':
        return `Asc Waalidka sharafta leh (${parent}), waxaa lagu ogeysiinayaa in ay la gaaray waqtigii bixinta lacagta dugsiga ee ardayga (${stName}) oo ah $${fee}. Fadlan ku soo bixi EVC/Zaad si habsami u socodka waxbarashadu u sii socoto. Dugsiga ${settings.schoolName}.`;
      case 'Hifz':
        return `Asc Waalidka sharafta leh (${parent}), waxaa laguugu bishaareynayaa in ardaygaaga (${stName}) uu maanta marayo Juz ${student?.currentJuz || 1} (${student?.currentSurah || 'Surah'}). Waxaan idiin rajaynaynaa dadaal iyo horumar joogto ah. Dugsiga ${settings.schoolName}.`;
      case 'General':
        return `Asc Dhammaan Waalidiinta Sharafta leh ee dugsiga ${settings.schoolName}. Waxaa la idin ogeysiinayaa in dugsigu leeyahay kalfadhi gaar ah...`;
      default:
        return '';
    }
  };

  // Validation handler for API Key Form
  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If user wants to save in LIVE MODE (Mock Mode OFF), validate API Key strictly
    if (!isMockMode) {
      const check = validateApiKey(apiKey);
      if (!check.isValid) {
        setValidationError(
          check.error ||
            'API Key-gu waa inuu ka koobnaadaa ugu yaraan 10 xaraf oo sax ah si aad u adegsato Live Mode.'
        );
        return;
      }
    }

    setApiSuccessToast(
      isMockMode
        ? '🧪 Dejinta MOCK / TEST MODE waa lagu keydiyay nidaamka. SMS-yada la diro oo dhan waxaa loo jilcin doonaa sida simulated.'
        : '⚡ Dejinta HORMUUD SMS GATEWAY (LIVE MODE) waa lagu keydiyay nidaamka si guul leh!'
    );
    setTimeout(() => setApiSuccessToast(null), 4500);
  };

  const handleSaveWhatsAppSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedWaSettings: WhatsAppSettings = {
      enabled: waEnabled,
      autoAbsentAlert: waAutoAbsent,
      autoPaymentAlert: waAutoPayment,
      gatewayUrl: waGatewayUrl,
      instanceId: waInstanceId,
      apiKey: waApiKey,
      mockMode: waMockMode,
    };

    if (onSaveSettings) {
      onSaveSettings({
        ...settings,
        whatsappSettings: updatedWaSettings,
      });
    }

    triggerToast('✅ Dejinta WhatsApp API & Automated Notifications waa la keydiyay!');
  };

  const handleTestWhatsAppDispatch = async () => {
    if (!waTestPhone || !waTestMessage) {
      alert('Fadlan ka soo buuxi nambarka waalidka iyo fariinta.');
      return;
    }
    setIsSending(true);
    try {
      const res = await sendWhatsAppViaBackend({
        recipientPhone: waTestPhone,
        message: waTestMessage,
        event: 'Custom',
        gatewayUrl: waGatewayUrl,
        instanceId: waInstanceId,
        apiKey: waApiKey,
        isMockMode: waMockMode,
      });

      if (res.success) {
        triggerToast(
          res.mode === 'simulated'
            ? '🧪 [WhatsApp Mock Mode]: Fariinta tijaabada ah waa la jilciyay loona kaydiyay logs-ka!'
            : '⚡ [WhatsApp Live API]: Fariinta tijaabada ah waxaa loo diray WhatsApp-ka!'
        );
      }
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday dirista WhatsApp: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Dispatch SMS via Backend API Function (Supports both Live & Mock Mode)
  const handleDispatchSmsViaApi = async (
    phone: string,
    text: string,
    studentName?: string,
    recipientName?: string
  ) => {
    setIsSending(true);
    try {
      const res = await sendSmsViaBackend({
        recipients: phone,
        recipientName,
        recipientPhone: phone,
        studentName,
        message: text,
        senderId,
        gateway: apiGateway === 'hormuud' ? 'Hormuud Bulk SMS API' : 'SMS Gateway',
        messageType: messageCategory,
        apiKey,
        tokenSecret,
        isMockMode,
      });

      if (res.success) {
        if (res.mode === 'simulated') {
          triggerToast(`🧪 [MOCK MODE]: Farriintu si guul ah ayaa loo jilciyay (Simulated) loona kaydiyay Firestore sms_logs!`);
        } else {
          triggerToast(`⚡ [LIVE MODE]: Farriinta SMS-ka ah waxaa loo diray Hormuud Gateway (${phone})!`);
        }
      }
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday dirista SMS-ka: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Handle WhatsApp Dispatch
  const handleSendWhatsApp = (phone: string, text: string, studentName?: string, recipientName?: string) => {
    const formatted = formatPhone(phone);
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${formatted}?text=${encodedText}`;
    window.open(waUrl, '_blank');

    // Also log simulation in Firestore
    sendSmsViaBackend({
      recipients: phone,
      recipientName,
      recipientPhone: phone,
      studentName,
      message: text,
      senderId: 'WhatsApp',
      gateway: 'WhatsApp Web Direct',
      messageType: messageCategory,
      isMockMode: true,
    });

    triggerToast(`Fariinta WhatsApp-ka waxaa loo furay nambarka ${phone}!`);
  };

  // Handle Bulk Dispatch
  const handleBulkDispatch = async () => {
    if (absentRecords.length === 0) {
      alert('Ma jiraan arday maqan oo la diiwaangeliyay taariikhdan!');
      return;
    }

    const modeText = isMockMode ? '🧪 MOCK / TEST MODE (Jilic Libre)' : '⚡ LIVE HORMUUD SMS GATEWAY';
    if (
      confirm(
        `Ma ziiddaa inaad u darto fariinta maqnaanshaha dhammaan ${absentRecords.length} waalid adoo adeegsanaya ${modeText}?`
      )
    ) {
      setIsSending(true);
      let count = 0;
      for (const rec of absentRecords) {
        const st = getStudentInfo(rec.studentId);
        if (st && st.parentPhone) {
          const msg = generateMessageText('Absent', st);
          await sendSmsViaBackend({
            recipients: st.parentPhone,
            recipientName: st.parentName,
            recipientPhone: st.parentPhone,
            studentName: st.fullName,
            message: msg,
            senderId,
            gateway: 'Hormuud Bulk SMS',
            messageType: 'Absent',
            apiKey,
            tokenSecret,
            isMockMode,
          });
          count++;
        }
      }
      setIsSending(false);
      triggerToast(
        `🚀 Dhibic! Farriimihii maqnaanshaha oo ah ${count} ayaa loo hawlgaliyay waalidiinta (${isMockMode ? 'Simulated' : 'Sent Live'})!`
      );
    }
  };

  // Push Notification Dispatch Handlers
  const handleSendPushBroadcast = async () => {
    if (!pushTitle.trim() || !pushMessage.trim()) {
      alert('Fadhlan qeer Ciwaanka iyo Qoraalka Fariinta Degdegga ah!');
      return;
    }
    setIsSendingPush(true);
    try {
      const newNotif: BroadcastNotification = {
        id: 'push-' + Date.now(),
        title: pushTitle.trim(),
        message: pushMessage.trim(),
        senderName: settings.schoolName || 'Maamulka Dugsiga',
        senderRole: 'admin',
        targetAudience: pushTarget,
        priority: pushPriority,
        createdAt: new Date().toISOString(),
        active: true,
        readByUsers: [],
      };

      await sendPushNotificationToFirestore(newNotif);
      triggerToast('🚀 Fariinta Degdegga ah (Push Notification) waxaa toos loogu baahiyay shaashadaha macallimiinta iyo waalidiinta!');
    } catch (err: any) {
      alert('Cillad ayaa ka dhacday baahinta Push Notification: ' + (err?.message || err));
    } finally {
      setIsSendingPush(false);
    }
  };

  const handleTogglePushActive = async (notif: BroadcastNotification) => {
    try {
      const updated = { ...notif, active: !notif.active };
      await saveItemToFirestore(COLLECTIONS.PUSH_NOTIFICATIONS, updated);
      triggerToast(updated.active ? '✅ Push Notification waa loo xiray (Enabled) shaashadaha!' : '⏸️ Push Notification waa la joojiyay (Disabled)!');
    } catch (err: any) {
      alert('Cillad: ' + err.message);
    }
  };

  const handleDeletePushNotification = async (id: string) => {
    if (!confirm('Ma ziiddaa inaad tirtirto fariintan degdegga ah?')) return;
    try {
      await deleteItemFromFirestore(COLLECTIONS.PUSH_NOTIFICATIONS, id);
      triggerToast('🗑️ Fariintii degdegga ahayd waa la tirtiray!');
    } catch (err: any) {
      alert('Cillad: ' + err.message);
    }
  };

  // Quick Monitoring summary metrics
  const todayISO = new Date().toISOString().split('T')[0];
  const todayLocaleStr = new Date().toLocaleDateString();
  const todaySomaliStr = new Date().toLocaleDateString('so-SO', { dateStyle: 'medium' });

  const todaySmsLogs = firestoreLogs.filter((log) => {
    if (!log.timestamp) return false;
    return (
      log.timestamp.includes(todayISO) ||
      log.timestamp.includes(todayLocaleStr) ||
      log.timestamp.includes(todaySomaliStr) ||
      log.timestamp.includes(selectedDate)
    );
  });

  const todaySmsCount = todaySmsLogs.length;
  const recent5Logs = firestoreLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 border-2 border-amber-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Global Mode Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold tracking-wide border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                📩 Hormuud Bulk SMS & Gateway Engine
              </span>
              {isMockMode || !apiKey || apiKey === '.' || apiKey.length < 10 ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  MOCK / TEST MODE (Tijaabo Libre Ah)
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  LIVE MODE (Hormuud Active)
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Nidaamka SMS Gateway & Farriimaha</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Diiwaangeli, tijaabi, oo u dir fariimaha maqnaanshaha, fee-da, iyo ogeysiisyada waalidiinta adoo adeegsanaya Hormuud Bulk SMS API ama Mock Dry Run mode.
            </p>
          </div>
        </div>

        {/* Tab Selectors Segmented Nav */}
        <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-inner text-xs font-medium">
          <button
            onClick={() => setActiveTab('chat_hub')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'chat_hub'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/50 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            <span>💬 Chat-ka Machadka</span>
          </button>

          <button
            onClick={() => setActiveTab('absent')}
            className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'absent'
                ? 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-950/50 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>Ardayda Maqan</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
              {absentRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/50 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-300" />
            <span>Dir Farriin Cusub</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/50 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            <span>Taariikhda Logs</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
              {firestoreLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'api'
                ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-950/50 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-300" />
            <span>Dejinta Gateway API</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/50 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>📲 WhatsApp API</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {whatsappLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('push_broadcast')}
            className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'push_broadcast'
                ? 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-950/50 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Siren className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>🚨 Push Notifications</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
              {pushNotificationsList.length}
            </span>
          </button>
        </div>
      </div>

      {/* QUICK MONITORING SUMMARY SECTION */}
      <div className="bg-slate-900/95 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-100 tracking-wide uppercase flex items-center gap-2">
                <span>Koobitaanka Xogta SMS</span>
                <span className="text-[10px] text-amber-400 font-normal lowercase tracking-normal bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  (Quick Monitoring Summary)
                </span>
              </h3>
              <p className="text-xs text-slate-400">Tusaalaha realtime-ka ah ee farriimaha SMS-ka la diray.</p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-slate-950 text-emerald-400 px-3.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto flex items-center gap-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firestore: <strong>sms_logs</strong></span>
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-all duration-200 shadow-md space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">SMS-yada Maanta</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight">{todaySmsCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Farriimo Maanta La Diray</div>
          </div>

          <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-all duration-200 shadow-md space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Wadarta Logs</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-100 tracking-tight">{firestoreLogs.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Lagu Kaydiyay Firestore</div>
          </div>

          <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-all duration-200 shadow-md space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Simulated (Mock)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              {firestoreLogs.filter((l) => l.status === 'simulated').length}
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium">Tijaabo Libre Ah</div>
          </div>

          <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-all duration-200 shadow-md space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Live Sent</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {firestoreLogs.filter((l) => l.status === 'sent').length}
            </div>
            <div className="text-[11px] text-emerald-300/80 font-medium">Hormuud Gateway</div>
          </div>
        </div>

        {/* Most Recent 5 SMS Entries */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>📋 5-ta Farriimood ee Ugu Dambeeyay (Most Recent 5 SMS Logs):</span>
            </span>
            <button
              onClick={() => setActiveTab('history')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer font-semibold transition-colors flex items-center gap-1"
            >
              <span>Eeg Dhammaan Logs-ka ({firestoreLogs.length})</span>
              <span>→</span>
            </button>
          </div>

          {recent5Logs.length === 0 ? (
            <div className="bg-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400 border border-slate-800">
              Wali ma jiraan farriimo SMS ah oo lagu kaydiyay Firestore sms_logs.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent5Logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-800/60 hover:bg-slate-800/90 p-4 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-slate-100 text-sm">{log.recipientName || 'Waalid'}</span>
                      <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                        {log.recipientPhone || log.recipients}
                      </span>
                      {log.studentName && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-bold border border-slate-700">
                          Arday: {log.studentName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate font-sans italic">
                      "{log.message}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-slate-700/50 pt-2 md:pt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                        log.status === 'simulated'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : log.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {log.status === 'simulated' ? '🧪 SIMULATED' : log.status === 'sent' ? '⚡ LIVE SENT' : '❌ FAILED'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TAB 0: STANDALONE PARENT CHAT HUB */}
      {activeTab === 'chat_hub' && (
        <ParentsChatView
          parents={parents}
          students={students}
          teachers={teachers}
          settings={settings}
          currentUser={currentUser}
        />
      )}

      {/* TAB 1: ABSENT STUDENTS MESSAGING */}
      {activeTab === 'absent' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Taariikhda *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Lọc Fasalka</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="all">Dhammaan Fasallada</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shift})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {absentRecords.length > 0 && (
              <button
                disabled={isSending}
                onClick={handleBulkDispatch}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {isSending ? (
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-amber-200" />
                )}
                <span>
                  {isSending ? 'Waa la dirayaa...' : `🚀 Bulk SMS (${absentRecords.length} Waalid)`}
                </span>
              </button>
            )}
          </div>

          {/* Absent List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-rose-950 text-white flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>Liiska Ardayda Ka Maqan Dugsiga ({absentRecords.length} Arday) - Taariikhda: {selectedDate}</span>
              </span>
              <span className="text-[11px] text-amber-200 bg-rose-900/80 px-2.5 py-0.5 rounded-full font-semibold">
                {isMockMode ? '🧪 Mock Mode Active' : '⚡ Hormuud API Ready'}
              </span>
            </div>

            {absentRecords.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#0e7a48] mx-auto opacity-80" />
                <h3 className="font-bold text-slate-800 text-sm">Masha Allah! Ma jiraan arday maqan oo la diiwaangeliyay taariikhdan.</h3>
                <p className="text-xs text-slate-500">Dhammaan ardaydu waxay ahaayeen kuwo jooga ama fasax leh.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {absentRecords.map((rec, idx) => {
                  const student = getStudentInfo(rec.studentId);
                  const stName = student ? student.fullName : rec.studentName;
                  const parentName = student ? student.parentName : 'Waalidka Ardayga';
                  const phone = student ? student.parentPhone : '+252 61 000 0000';
                  const className = student ? student.className : 'Fasal';
                  const textMsg = generateMessageText('Absent', student);

                  return (
                    <div
                      key={rec.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{stName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {className}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                            <span>👨‍👦 Waalidka: <strong className="text-slate-800">{parentName}</strong></span>
                            <span>📞 Nambarka: <strong className="text-slate-800 font-mono">{phone}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Send Buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          disabled={isSending}
                          onClick={() => handleDispatchSmsViaApi(phone, textMsg, stName, parentName)}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>🚀 Dir Hormuud SMS</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsApp(phone, textMsg, stName, parentName)}
                          className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1ebc57] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
                          <span>💬 WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            const smsUrl = `sms:${phone}?body=${encodeURIComponent(textMsg)}`;
                            window.open(smsUrl, '_self');
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>📱 App SMS</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST / CUSTOM MESSAGE */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#0e7a48]" />
                <span>Diyaarinta Farriinta Cusub</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Mode: <strong className="text-slate-800">{isMockMode ? '🧪 Mock (Test)' : '⚡ Live API'}</strong>
              </span>
            </h3>

            {/* Target Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Qofka / Kooxda Fariinta loo dirayo *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('single')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    targetType === 'single'
                      ? 'bg-[#0e7a48] text-white border-[#0e7a48]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👤 Waalid Arday
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('class')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    targetType === 'class'
                      ? 'bg-[#0e7a48] text-white border-[#0e7a48]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🏫 Fasal Dhammaantiis
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('unpaid')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    targetType === 'unpaid'
                      ? 'bg-[#0e7a48] text-white border-[#0e7a48]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  💰 Ardayda Unpaid Fee
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                    targetType === 'all'
                      ? 'bg-[#0e7a48] text-white border-[#0e7a48]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📢 Dhammaan Waalidiinta
                </button>
              </div>
            </div>

            {/* Target Select Dropdowns */}
            {targetType === 'single' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doorho Ardayga (Waalidka)</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} — Waalidka: {s.parentName} ({s.parentPhone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'class' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doorho Fasalka</label>
                <select
                  value={selectedClassBroadcast}
                  onChange={(e) => setSelectedClassBroadcast(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.shift}) — {c.teacherName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message Category / Preset Template */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Mawduuca Fariinta (Message Category)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'Absent', label: '🚨 Maqnaansho (Absent Alert)' },
                  { id: 'Fee', label: '💰 Fee-da Bisha (Fee Reminder)' },
                  { id: 'Hifz', label: '📖 Hifzi Qur’aanka (Hifz Progress)' },
                  { id: 'General', label: '📢 Ogaysiis Guud (General Alert)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const c = cat.id as any;
                      setMessageCategory(c);
                      const st = students.find((s) => s.id === selectedStudentId);
                      setCustomMessage(generateMessageText(c, st));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      messageCategory === cat.id
                        ? 'bg-[#0e7a48] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nuxurka Farriinta (Message Text) *</label>
              <textarea
                rows={5}
                value={
                  customMessage ||
                  generateMessageText(
                    messageCategory,
                    students.find((s) => s.id === selectedStudentId)
                  )
                }
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0e7a48] leading-relaxed"
                placeholder="Halkan ku qor farriinta aad u direyso waalidka..."
              />
            </div>

            {/* Dispatch Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 flex-wrap">
              <button
                type="button"
                disabled={isSending}
                onClick={() => {
                  const st = students.find((s) => s.id === selectedStudentId);
                  const phone = st ? st.parentPhone : '+252615553344';
                  const text = customMessage || generateMessageText(messageCategory, st);
                  handleDispatchSmsViaApi(phone, text, st?.fullName, st?.parentName);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>🚀 Dir SMS Gateway ({isMockMode ? 'Mock' : 'Live'})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const st = students.find((s) => s.id === selectedStudentId);
                  const phone = st ? st.parentPhone : '+252615553344';
                  const text = customMessage || generateMessageText(messageCategory, st);
                  handleSendWhatsApp(phone, text, st?.fullName, st?.parentName);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebc57] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>💬 Ku Dir WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Preview Side */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-xs text-amber-200 uppercase tracking-wider">Muuqaalka Fariinta (Message Preview)</h4>
            </div>

            <div className="bg-emerald-950/80 border border-emerald-800/60 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                <span>📱 Waalidka: {students.find((s) => s.id === selectedStudentId)?.parentName || 'Waalidka'}</span>
                <span>{settings.schoolName}</span>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-sans">
                {customMessage ||
                  generateMessageText(
                    messageCategory,
                    students.find((s) => s.id === selectedStudentId)
                  )}
              </p>
              <div className="text-[10px] text-emerald-400/80 text-right font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-amber-300">💡 Qoraal Ogeysiis:</div>
              <p>
                Farriinta SMS-ka ahi waxay toos ugu kaydsami doontaa Firestore collection
                <code className="text-amber-200 font-mono ml-1">sms_logs</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY LOGS FROM FIRESTORE */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Firestore Collection: sms_logs ({firestoreLogs.length} Farriimood)</span>
            </span>
            <span className="text-[10px] text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
              Real-time Firestore Sync Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {firestoreLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <Info className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">Wali farriimo kuma jiraan Firestore sms_logs.</p>
                <p className="text-slate-400">Marka aad fariin SMS ah dirto, halkan ayay toos ugu muuqan doontaa.</p>
              </div>
            ) : (
              firestoreLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">
                        {log.recipientName || 'Waalid'}
                      </span>
                      <span className="text-[11px] text-slate-600 font-mono">
                        ({log.recipientPhone || log.recipients})
                      </span>
                      {log.studentName && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#0e7a48] text-[10px] font-bold">
                          Ardayga: {log.studentName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.gateway || 'SMS Gateway'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug italic font-serif">
                      "{log.message}"
                    </p>
                    {log.notice && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
                        ℹ️ {log.notice}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'simulated'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : log.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {log.status === 'simulated'
                        ? '🧪 Simulated'
                        : log.status === 'sent'
                        ? '⚡ Sent Live'
                        : '❌ Failed'}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">{log.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: API INTEGRATION CONFIGURATION & MOCK TOGGLE */}
      {activeTab === 'api' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-300" />
              <span>Dejinta SMS Gateway API (Hormuud SMS & Mock Dry Run Mode)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Halkan ka samee habaynta Hormuud SMS API ama shaqaysii Mock Mode si aad u tijaabiso fariimaha adigoon u baahnayn API Key.
            </p>
          </div>

          <form onSubmit={handleSaveApiSettings} className="space-y-5">
            {/* MOCK MODE TOGGLE CARD */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-600" />
                    <span>Shaqaysii Mod-ka Tijaabada (Mock / Dry Run Mode)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Haddii badhankani daaran yahay, fariimuhu ma ahaan doonaan kuwo u baxaya Hormuud halkaas beddelkeeda si guul ah ayaa loogu jilcin doonaa Firestore.
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsMockMode(!isMockMode)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    isMockMode ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isMockMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Notice Banner */}
              {isMockMode ? (
                <div className="p-3 bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    🧪 Nidaamku wuxuu ku jiraa Mock Mode. Looma baahna API Key, fariimaha kollay si simulated ah ayay u badhaadheen doonaan!
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    ⚡ Nidaamku wuxuu doonayaa inuu ku shaqeeyo LIVE MODE. Geli API Key sax ah oo ugu yaraan 10 xaraf ah.
                  </span>
                </div>
              )}
            </div>

            {/* Gateway Provider Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nooca Gateway-ga (Integration Channel)
              </label>
              <select
                value={apiGateway}
                onChange={(e) => setApiGateway(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="hormuud">Hormuud SMS Gateway API (Somalia)</option>
                <option value="telesom">Telesom Zaad SMS API (Somaliland)</option>
                <option value="somtel">Somtel Bulk SMS Gateway</option>
                <option value="twilio">Twilio Cloud SMS API</option>
              </select>
            </div>

            {/* Sender ID, API Key, Token Secret */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sender ID / Magaca Soo Diraha
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  placeholder="e.g. TAHDIIB-MIS"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hormuud API Key *</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  placeholder="Geli Hormuud API Key (Ugu yaraan 10 xaraf)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Token Secret (Optional)</span>
              </label>
              <input
                type="password"
                value={tokenSecret}
                onChange={(e) => setTokenSecret(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                placeholder="Geli Token Secret haddii Hormuud ku siiyay"
              />
            </div>

            {/* Form Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Success Toast */}
            {apiSuccessToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{apiSuccessToast}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Keydi Dejinta SMS Gateway</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setApiKey('HORMUUD_LIVE_KEY_89234723984723894');
                  setTokenSecret('SECRET_839247239847');
                  setIsMockMode(false);
                  setValidationError(null);
                  triggerToast('🔑 Sample Live Credentials loaded for testing!');
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer"
              >
                Geli Key Tijaabo oo Sax Ah (10+ xaraf)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WHATSAPP AUTOMATED NOTIFICATIONS & API GATEWAY TAB */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/40">
                  <Smartphone className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-amber-300 flex items-center gap-2">
                    <span>📲 AUTOMATED WHATSAPP NOTIFICATIONS (THIRD-PARTY API)</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-300 text-[10px] rounded-full font-mono uppercase tracking-wider border border-emerald-400/40">
                      Auto-Trigger Active
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
                    Nidaamku wuxuu si toos ah (Automated) fariimo WhatsApp ah ugu dirayaa waalidiinta marka **Ardayga loo calaamadeeyo Absent (Maqan)** ama marka **Risiti cusub oo Lacag-bixin ah la diiwaangeliyo**.
                  </p>
                </div>
              </div>

              {/* Master Status Badge */}
              <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-emerald-400/30">
                <span className={`w-3 h-3 rounded-full ${waEnabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-white">
                  {waEnabled ? '⚡ WhatsApp Gateway: SHAKAN (Active)' : '🔒 WhatsApp Gateway: ZIRAN (Disabled)'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Automated Triggers & API Config */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Automated Notification Rules & Triggers */}
            <form onSubmit={handleSaveWhatsAppSettings} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-emerald-600" />
                  <span>Qawaaniinta Fariimaha Tooska Ah (Automated Rules)</span>
                </h4>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold">
                  Rule Trigger Config
                </span>
              </div>

              {/* Master Enable Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">
                    Shid / Zir Adeegga WhatsApp-ka (Master WhatsApp Switch)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Awood-sii ama ka zim dhammaan fariimaha WhatsApp-ka ee nidaamka.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaEnabled(!waEnabled)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    waEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    waEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule 1: Auto Absent Alert */}
              <div className="flex items-center justify-between p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>1. Ogeysiiska Maqnaanshaha Ardayda (Absent Alert)</span>
                  </span>
                  <p className="text-[11px] text-rose-700/90 leading-tight">
                    Fariin WhatsApp ah oo toos ah u dir waalidka isla marka ardayga xaadiriska loogu calaamadeeyo <strong>ABSENT</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaAutoAbsent(!waAutoAbsent)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    waAutoAbsent ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    waAutoAbsent ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Rule 2: Auto Payment Receipt */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>2. Risitiika Lacag-bixinta Tooska Ah (Payment Receipt)</span>
                  </span>
                  <p className="text-[11px] text-emerald-800/90 leading-tight">
                    Fariin WhatsApp ah oo risiti xaqiijin ah leh u dir waalidka marka maaliyadda lagu daro lacag-bixin cusub.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaAutoPayment(!waAutoPayment)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    waAutoPayment ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    waAutoPayment ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Third-Party API Endpoint Config */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Third-Party WhatsApp Gateway Endpoint URL</span>
                  </label>
                  <input
                    type="text"
                    value={waGatewayUrl}
                    onChange={(e) => setWaGatewayUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                    placeholder="https://api.ultramsg.com/instance10293/messages/chat"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sida UltraMsg, Wasender API, Green API, ama webhook API kasta oo WhatsApp ah.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instance ID / Token</label>
                    <input
                      type="text"
                      value={waInstanceId}
                      onChange={(e) => setWaInstanceId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      placeholder="e.g. instance10293"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">API Key / Access Secret</label>
                    <input
                      type="password"
                      value={waApiKey}
                      onChange={(e) => setWaApiKey(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      placeholder="Geli WhatsApp API Key"
                    />
                  </div>
                </div>

                {/* Mock Mode Switch */}
                <div className="flex items-center justify-between p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-amber-600" />
                    <span>WhatsApp Mock / Simulation Mode (Test Dry Run)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setWaMockMode(!waMockMode)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      waMockMode ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      waMockMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>KEYDI DEJINTA WHATSAPP AUTOMATION</span>
              </button>
            </form>

            {/* 2. Direct WhatsApp Message Tester */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Tijaabi Dirista Direct WhatsApp Message</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Sida tooska ah fariin tijaabo ah ugu dir nambar gaar ah si aad u xaqiijiso API-ga.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dooro Arday ama Geli Nambarka Waalidka
                    </label>
                    <select
                      onChange={(e) => {
                        const std = students.find((s) => s.id === e.target.value);
                        if (std) {
                          setWaTestPhone(std.parentPhone || std.phone || '');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold mb-2"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.parentName || 'Waalid'} - {s.parentPhone || 'Mobile'})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={waTestPhone}
                      onChange={(e) => setWaTestPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                      placeholder="e.g. 252615000000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qoraalka Fariinta (Message)</label>
                    <textarea
                      rows={4}
                      value={waTestMessage}
                      onChange={(e) => setWaTestMessage(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleTestWhatsAppDispatch}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>{isSending ? 'Diritaanku wuu socdaa...' : '🚀 DIR FARIIN TIJAABO AH (WHATSAPP API)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Real-time WhatsApp Logs Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Diiwaanka WhatsApp Logs (Firestore Collection: whatsapp_logs)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Dhammaan fariimaha loo diray waalidiinta oo ku kaydsan database-ka cloud-ka ee Firestore.
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-200 self-start sm:self-auto">
                Wadarta Logs: {whatsappLogs.length}
              </span>
            </div>

            {whatsappLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Weli ma jiro fariimo WhatsApp ah oo la diray.</p>
                <p className="text-[11px] text-slate-400">
                  Marka arday loo calaamadeeyo Absent ama la bixiyo lacag, ama fariin tijaabo ah la diro, si toos ah ayay halkan uga muuqan doonaan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Event / Sababta</th>
                      <th className="p-3">Nambarka Waalidka</th>
                      <th className="p-3">Magaca Ardayga / Waalidka</th>
                      <th className="p-3">Qoraalka Fariinta</th>
                      <th className="p-3">Status / Mode</th>
                      <th className="p-3">Taariikhda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {whatsappLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                              log.event === 'Absent'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : log.event === 'Payment'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {log.event || 'Custom'}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{log.recipientPhone}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900">{log.studentName || 'Arday'}</span>
                          {log.recipientName && (
                            <span className="block text-[10px] text-slate-500">Waalid: {log.recipientName}</span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs">
                          <p className="line-clamp-2 text-[11px] font-sans text-slate-700 whitespace-pre-wrap">
                            {log.message}
                          </p>
                        </td>
                        <td className="p-3 shrink-0">
                          {log.status === 'sent' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold border border-emerald-300 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>LIVE SENT</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300 flex items-center gap-1 w-fit">
                              <FlaskConical className="w-3 h-3 text-amber-600" />
                              <span>SIMULATED (MOCK)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. PUSH NOTIFICATIONS BROADCAST TAB */}
      {activeTab === 'push_broadcast' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white p-6 rounded-2xl border border-rose-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-600 text-white shadow-lg animate-pulse">
                  <Siren className="w-6 h-6" />
                </span>
                <h3 className="text-xl font-black text-white">
                  🚨 Baahinta Fariimaha Degdegga ah (Push Notification Broadcast)
                </h3>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed max-w-2xl">
                Maamulayaashu waxay halkan ka soo diri karaan fariimo degdeg ah oo toos shaashadda (screen popup overlay) ugu soo baxa macallimiinta iyo waalidiinta marka ay ku jiraan nidaamka.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-rose-300 font-bold">Wadarta Push Alerts</div>
                <div className="text-2xl font-black text-white">{pushNotificationsList.length}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form & Quick Templates (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quick Template Selector */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Doorashooyin Degdeg Ah (Quick Emergency Templates)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPushTitle('🚨 DUGSIGU WAA FASAX MAANTA');
                      setCustomPushMessage('Asc dhammaan waalidiinta iyo macallimiinta, waxaa idin ogeysiineynaa in Dugsigu fasax yahay maanta sababo la xidhiidha cimilada/roobka. Mahadsanidiin.');
                      setPushPriority('emergency');
                      setPushTarget('all');
                    }}
                    className="p-3 text-left bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                      <span>🌧️ Fasax Degdeg Ah</span>
                    </div>
                    <p className="text-[11px] text-rose-700 line-clamp-1 mt-0.5">Dugsigu waa fasax cimilada/roobka darteed...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPushTitle('⏰ BEDDELIDA WAQTIGA DUGSIGA');
                      setCustomPushMessage('Asc dhammaan macallimiinta iyo waalidiinta, waxaa jira beddelid yar oo lagu sameeyay waqtiga Dugsiga Subax / Galab. Fadhlan eeg jadwal-ka cusub.');
                      setPushPriority('urgent');
                      setPushTarget('all');
                    }}
                    className="p-3 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      <span>⏰ Beddelida Shift-ka</span>
                    </div>
                    <p className="text-[11px] text-amber-800 line-clamp-1 mt-0.5">Beddelid lagu sameeyay waqtiga Subax/Galab...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPushTitle('📢 SHIR WAALIDIIN DEGDEG AH');
                      setCustomPushMessage('Asc dhammaan waalidiinta sharafta leh, waxaa jira shir muhiim ah oo ka dhacaya xarunta dugsiga. Dhammaan waalidiinta waxaa laga codsanayaa inay soo maraan.');
                      setPushPriority('urgent');
                      setPushTarget('parents');
                    }}
                    className="p-3 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <span>👥 Shir Waalidiinta</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 line-clamp-1 mt-0.5">Shir muhiim ah oo ka dhacaya dugsiga...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPushTitle('💵 OGEYSIIS BIXINTA LACAGTA BISHI');
                      setCustomPushMessage('Asc waalidiinta sharafta leh, waxaa la xusuusinayaa in la joogo waqtigii bixinta fiida bisha. Fadhlan ku bixiya EVC Plus ama Zaad.');
                      setPushPriority('normal');
                      setPushTarget('parents');
                    }}
                    className="p-3 text-left bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                      <span>💵 Ogeysiis Fee Bixinta</span>
                    </div>
                    <p className="text-[11px] text-sky-800 line-clamp-1 mt-0.5">Xusuusin bixinta fiida bisha...</p>
                  </button>
                </div>
              </div>

              {/* Composition Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span>Qoor Farriinta Degdegga Ah (Compose Alert)</span>
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ciwaanka Farriinta (Alert Title) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      placeholder="e.g. 🚨 DUGSIGU WAA FASAX MAANTA"
                      className="w-full px-3.5 py-2.5 text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-rose-500 transition-all"
                    />
                  </div>

                  {/* Target Audience & Priority Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Target Audience */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teegeerayaasha (Target Audience)
                      </label>
                      <select
                        value={pushTarget}
                        onChange={(e) => setPushTarget(e.target.value as NotificationTargetAudience)}
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      >
                        <option value="all">🌐 Dhammaan (Macallimiin + Waalidiin + Arday)</option>
                        <option value="teachers">👨‍🏫 Macallimiinta Keliya (Teachers Only)</option>
                        <option value="parents">👨‍👩‍👧‍👦 Waalidiinta Keliya (Parents Only)</option>
                        <option value="students">🎓 Ardayda Keliya (Students Only)</option>
                      </select>
                    </div>

                    {/* Priority Level */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Heerka Degdegga (Priority)
                      </label>
                      <select
                        value={pushPriority}
                        onChange={(e) => setPushPriority(e.target.value as NotificationPriority)}
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      >
                        <option value="normal">📢 Normal (Ogeysiis Caadi Ah)</option>
                        <option value="urgent">⚡ Urgent (Ogeysiis Degdeg Ah)</option>
                        <option value="emergency">🚨 Emergency (Xaalad Degdeg Ah + Sound)</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Qoraalka Fariinta (Message Content) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={pushMessage}
                      onChange={(e) => setCustomPushMessage(e.target.value)}
                      placeholder="Qoor fariinta oo dhameystiran..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-sans text-slate-900 focus:bg-white focus:border-rose-500 transition-all leading-relaxed"
                    />
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={isSendingPush}
                    onClick={handleSendPushBroadcast}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                      pushPriority === 'emergency'
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30'
                        : pushPriority === 'urgent'
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSendingPush ? 'Baahintu weey socotaa...' : '🚀 BAAHI FARIINTA TOOSKA AH (SEND LIVE PUSH)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Screen Card Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Muqaalka Shaashada (Screen Preview)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300">
                    Live Simulator
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Sidaan oo kale ayay fariintu ugu dhaceysaa shaashadaha isticmaalayaasha oo dhan:
                </p>

                {/* Preview Card */}
                <div
                  className={`p-5 rounded-2xl border-2 space-y-3 ${
                    pushPriority === 'emergency'
                      ? 'bg-gradient-to-b from-rose-950 to-slate-900 border-rose-500 text-rose-100 shadow-lg shadow-rose-900/30'
                      : pushPriority === 'urgent'
                      ? 'bg-gradient-to-b from-amber-950 to-slate-900 border-amber-500 text-amber-100 shadow-lg shadow-amber-900/30'
                      : 'bg-gradient-to-b from-emerald-950 to-slate-900 border-emerald-500 text-emerald-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20">
                      {pushPriority === 'emergency'
                        ? '🚨 XAALAD DEGDEG AH'
                        : pushPriority === 'urgent'
                        ? '⚡ FARIIN DEGDEG AH'
                        : '📢 DUGSIGA BROADCAST'}
                    </span>
                    <span className="text-[10px] text-white/60 font-mono">Iminka</span>
                  </div>

                  <h5 className="font-extrabold text-base text-white leading-snug">{pushTitle || 'Ciwaanka Alert-ka'}</h5>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/80 p-3 rounded-xl border border-white/10">
                    {pushMessage || 'Qoraalka fariintu halkan ayuu ka muuqan doonaa...'}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-white/70">
                    <span>Soo Diray: {settings.schoolName || 'Maamulka Dugsiga'}</span>
                    <span className="uppercase text-amber-300">Audience: {pushTarget}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table: Active & History Push Notifications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-600" />
                  <span>Diiwaanka Fariimaha Degdegga ah (Firestore: push_notifications)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Maamul fariimaha lagu baahiyay shaashadaha, oo arag inta isticmaale oo akhrisay.
                </p>
              </div>

              <span className="px-3 py-1 bg-rose-50 text-rose-800 text-xs font-extrabold rounded-full border border-rose-200 self-start sm:self-auto">
                Wadarta Alert-yada: {pushNotificationsList.length}
              </span>
            </div>

            {pushNotificationsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Siren className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Weli ma jiro Push Notifications la baahiyay.</p>
                <p className="text-[11px] text-slate-400">
                  Isticmaal foomka sare si aad fariin degdeg ah ugu baahiso shaashadaha macallimiinta iyo waalidiinta.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Ciwaanka (Title)</th>
                      <th className="p-3">Qoraalka (Message)</th>
                      <th className="p-3">Ku Socota (Audience)</th>
                      <th className="p-3">Soo Diray</th>
                      <th className="p-3">Akhriyay (Read Count)</th>
                      <th className="p-3">Status / Controls</th>
                      <th className="p-3">Taariikhda</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {pushNotificationsList.map((notif) => (
                      <tr key={notif.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                              notif.priority === 'emergency'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : notif.priority === 'urgent'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {notif.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-slate-900">{notif.title}</td>
                        <td className="p-3 max-w-xs">
                          <p className="line-clamp-2 text-[11px] font-sans text-slate-700 whitespace-pre-wrap">
                            {notif.message}
                          </p>
                        </td>
                        <td className="p-3 uppercase font-bold text-slate-700">{notif.targetAudience}</td>
                        <td className="p-3 font-semibold text-slate-800">{notif.senderName}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black border border-slate-300">
                            👁️ {notif.readByUsers ? notif.readByUsers.length : 0} Akhriyay
                          </span>
                        </td>
                        <td className="p-3 shrink-0">
                          <button
                            onClick={() => handleTogglePushActive(notif)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                              notif.active
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {notif.active ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ACTIVE</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                                <span>DISABLED</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString('so-SO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeletePushNotification(notif.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Tirtir Alert-ka"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
