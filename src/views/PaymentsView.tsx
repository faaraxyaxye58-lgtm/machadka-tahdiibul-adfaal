import React, { useState, useMemo, useEffect } from 'react';
import { PaymentTransaction, Student, SchoolSettings, PaymentMethod, User } from '../types';
import {
  DollarSign,
  Plus,
  Printer,
  Search,
  CheckCircle,
  AlertCircle,
  Wallet,
  X,
  Edit2,
  Trash2,
  MessageSquare,
  Smartphone,
  Send,
  CheckCircle2,
  AlertTriangle,
  Key,
  ShieldCheck,
  RotateCw,
  Info,
  Users,
  Check,
  Sparkles,
  Settings,
  Calendar,
  Clock,
  PieChart as PieChartIcon,
  TrendingUp,
  XCircle,
  FileText,
  Filter,
  Download,
  Calculator,
  Zap,
  ArrowUpRight,
  Receipt,
  UserX,
  CheckCheck,
} from 'lucide-react';
import { formatMoney, isFinancialDataHidden } from '../utils/moneyUtils';
import { sendSmsViaBackend, validateApiKey, subscribeSmsLogs, SmsLogRecord } from '../lib/smsService';
import { sendAutomatedPaymentWhatsAppNotification, sendAutomatedFeeReminderWhatsAppNotification, sendWhatsAppViaBackend } from '../lib/whatsappService';
import { getCurrentSomaliMonthYear } from '../utils/billingUtils';
import { getParentChildren } from '../utils/parentMatcher';

interface ParsedSmsPayment {
  id: string;
  rawSms: string;
  amount: number;
  phone: string;
  cleanPhone: string;
  refNumber: string;
  dateStr: string;
  monthYear: string;
  provider: PaymentMethod;
  matchedStudent?: Student;
  status: 'Matched' | 'Unmatched' | 'AlreadyRegistered';
}

interface PaymentsViewProps {
  currentUser?: User | null;
  payments: PaymentTransaction[];
  students: Student[];
  settings: SchoolSettings;
  onAddPayment: (payment: Omit<PaymentTransaction, 'id' | 'invoiceNumber'>) => void;
  onUpdatePayment?: (payment: PaymentTransaction) => void;
  onDeletePayment?: (id: string) => void;
  onPrintReceipt: (payment: PaymentTransaction) => void;
  isOpenModal: boolean;
  setIsOpenModal: (open: boolean) => void;
  isMoneyHidden?: boolean;
  onTrigger29thBilling?: (forceRun?: boolean) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  currentUser,
  payments,
  students,
  settings,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onPrintReceipt,
  isOpenModal,
  setIsOpenModal,
  isMoneyHidden = false,
  onTrigger29thBilling,
}) => {
  const shouldHideMoney = isFinancialDataHidden(currentUser, settings, isMoneyHidden);
  const canManagePayments = currentUser?.role === 'admin' || currentUser?.role === 'finance';

  const [searchTerm, setSearchTerm] = useState('');
  const [editingPayment, setEditingPayment] = useState<PaymentTransaction | null>(null);

  // Tab State: 'payments' | 'debtors' | 'sms_parser' | 'sms_logs'
  const [activeTab, setActiveTab] = useState<'payments' | 'debtors' | 'sms_parser' | 'sms_logs'>('payments');

  // Debtors breakdown state
  const [debtorsSearch, setDebtorsSearch] = useState('');
  const [debtorsClassFilter, setDebtorsClassFilter] = useState('all');
  const [debtorsStatusFilter, setDebtorsStatusFilter] = useState<'all' | 'Pending' | 'Overdue'>('all');

  // Mobile SMS Payment Parser state
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [parsedSmsList, setParsedSmsList] = useState<ParsedSmsPayment[]>([]);

  // SMS Logs state and filter
  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>([]);
  const [smsSearchTerm, setSmsSearchTerm] = useState('');
  const [smsStatusFilter, setSmsStatusFilter] = useState<'all' | 'sent' | 'simulated' | 'failed'>('all');

  // Subscribe to realtime SMS logs from Firestore
  useEffect(() => {
    const unsubscribe = subscribeSmsLogs((logs) => {
      setSmsLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  // Filter SMS Logs
  const filteredSmsLogs = useMemo(() => {
    return smsLogs.filter((log) => {
      const matchesStatus = smsStatusFilter === 'all' || log.status === smsStatusFilter;
      const term = smsSearchTerm.toLowerCase().trim();
      if (!term) return matchesStatus;

      const matchesPhone = log.recipientPhone ? log.recipientPhone.toLowerCase().includes(term) : false;
      const matchesRecipName = log.recipientName ? log.recipientName.toLowerCase().includes(term) : false;
      const matchesStudName = log.studentName ? log.studentName.toLowerCase().includes(term) : false;
      const matchesMsg = log.message ? log.message.toLowerCase().includes(term) : false;
      const matchesSender = log.senderId ? log.senderId.toLowerCase().includes(term) : false;

      return matchesStatus && (matchesPhone || matchesRecipName || matchesStudName || matchesMsg || matchesSender);
    });
  }, [smsLogs, smsStatusFilter, smsSearchTerm]);

  // Export SMS Logs to CSV file
  const handleExportSmsLogsCSV = () => {
    if (filteredSmsLogs.length === 0) {
      alert('Ma jiraan diiwaan SMS ah oo loo dhoofiyo CSV.');
      return;
    }

    const headers = ['ID', 'Taariikhda & Waqtiga', 'Telefoonka', 'Waalidka', 'Ardayga', 'Xaalada (Status)', 'Fariinta (Message)', 'Sender ID'];
    const rows = filteredSmsLogs.map((log) => {
      const formattedDate = log.timestamp ? new Date(log.timestamp).toLocaleString() : '';
      const phone = log.recipientPhone || '';
      const parentName = (log.recipientName || '').replace(/"/g, '""');
      const studentName = (log.studentName || '').replace(/"/g, '""');
      const status = log.status || 'sent';
      const msg = (log.message || '').replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
      const sender = log.senderId || 'HORMUUD-API';

      return [`"${log.id || ''}"`, `"${formattedDate}"`, `"${phone}"`, `"${parentName}"`, `"${studentName}"`, `"${status}"`, `"${msg}"`, `"${sender}"`].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diiwaanka_SMS_Hormuud_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [monthYear, setMonthYear] = useState('Ogoosto 2026');
  const [amountPaid, setAmountPaid] = useState<number>(15);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EVC Plus');
  const [transactionRef, setTransactionRef] = useState('EVC982001');

  // Helper to compute student remaining fee
  const getStudentRemainingFee = (s: Student): number => {
    if (s.feeRemaining !== undefined) return s.feeRemaining;
    const monthly = s.feeMonthly || 15;
    const paid = s.feePaid || 0;
    return Math.max(0, monthly - paid);
  };

  // Filter students with pending/overdue fees or remaining balance > 0
  const pendingStudents = useMemo(() => {
    return students.filter((s) => {
      const rem = getStudentRemainingFee(s);
      return (s.feeStatus === 'Pending' || s.feeStatus === 'Overdue' || rem > 0) && Boolean(s.parentPhone);
    });
  }, [students]);

  const totalPendingBalance = useMemo(() => {
    return pendingStudents.reduce((acc, s) => acc + getStudentRemainingFee(s), 0);
  }, [pendingStudents]);

  // Total Paid Amount from completed payments
  const totalPaidAmount = useMemo(() => {
    return payments
      .filter((p) => p.status !== 'Pending')
      .reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  }, [payments]);

  // Total Pending Amount from all active students
  const totalPendingAmount = useMemo(() => {
    return students.reduce((acc, s) => acc + getStudentRemainingFee(s), 0);
  }, [students]);

  const totalExpectedAmount = totalPaidAmount + totalPendingAmount;
  const collectionRate = totalExpectedAmount > 0 ? Math.round((totalPaidAmount / totalExpectedAmount) * 100) : 0;

  const pieChartData = useMemo(() => {
    return [
      { name: 'Lacagta La Bixiyay (Paid)', value: totalPaidAmount, color: '#0e7a48' },
      { name: 'Baqiga Lagu Leeyahay (Pending)', value: totalPendingAmount, color: '#d97706' },
    ];
  }, [totalPaidAmount, totalPendingAmount]);

  // --- Debtors Breakdown Filter ---
  const filteredDebtors = useMemo(() => {
    return students.filter((s) => {
      const remaining = getStudentRemainingFee(s);
      const isDebtor = s.feeStatus === 'Pending' || s.feeStatus === 'Overdue' || remaining > 0;
      if (!isDebtor) return false;

      const matchesStatus = debtorsStatusFilter === 'all' || s.feeStatus === debtorsStatusFilter;
      const matchesClass = debtorsClassFilter === 'all' || s.className === debtorsClassFilter;

      const term = debtorsSearch.toLowerCase().trim();
      if (!term) return matchesStatus && matchesClass;

      const matchesName = s.fullName.toLowerCase().includes(term);
      const matchesParent = s.parentName.toLowerCase().includes(term);
      const matchesPhone = s.parentPhone.includes(term);
      const matchesClassname = s.className.toLowerCase().includes(term);

      return matchesStatus && matchesClass && (matchesName || matchesParent || matchesPhone || matchesClassname);
    });
  }, [students, debtorsStatusFilter, debtorsClassFilter, debtorsSearch]);

  // --- Mobile SMS Payment Parser Engine ---
  const handleParseSmsInput = (input: string) => {
    setRawSmsInput(input);
    if (!input.trim()) {
      setParsedSmsList([]);
      return;
    }

    const lines = input.split(/(?:\r?\n){2,}|---+|===+/).filter((l) => l.trim().length > 5);
    const smsChunks = lines.length > 0 ? lines : [input];

    const results: ParsedSmsPayment[] = [];

    smsChunks.forEach((chunk, index) => {
      const text = chunk.trim();
      if (!text) return;

      // 1. Amount
      let amount = 0;
      const amountMatch = text.match(/(?:\$|USD)\s*([0-9]+(?:\.[0-9]{1,2})?)|([0-9]+(?:\.[0-9]{1,2})?)\s*(?:\$|USD|Doolar)/i);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1] || amountMatch[2]);
      } else {
        const fallbackAmount = text.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
        if (fallbackAmount) amount = parseFloat(fallbackAmount[1]);
      }

      // 2. Phone
      let phone = '';
      const phoneMatch = text.match(/(?:252\s*)?(?:61|62|63|68|77|90)\d{7}|06\d{8}|\d{9,12}/);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/\s+/g, '');
      }
      const cleanPhone = phone.replace(/^(\+?252|0)/, '');

      // 3. Provider
      let provider: PaymentMethod = 'EVC Plus';
      if (/Zaad/i.test(text)) provider = 'Zaad';
      else if (/Sahal/i.test(text)) provider = 'Sahal';
      else if (/eDahab/i.test(text)) provider = 'eDahab';
      else if (/Kaash|Cash/i.test(text)) provider = 'Kaash';

      // 4. Ref Number
      let refNumber = `SMS-${Date.now().toString().slice(-5)}-${index + 1}`;
      const refMatch = text.match(/(?:Ref|TX|Txn|ID|EVC|ZD|SHL|ED)[:\s#]*([A-Z0-9]{4,15})/i);
      if (refMatch) {
        refNumber = refMatch[1].toUpperCase();
      }

      // 5. Date & Month
      let dateStr = new Date().toISOString().split('T')[0];
      let monthYear = getCurrentSomaliMonthYear();
      const dateMatch = text.match(/(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/);
      if (dateMatch) {
        dateStr = dateMatch[1];
        const parts = dateStr.split(/[\/\.-]/);
        if (parts.length >= 3) {
          let day = 1, month = 8, year = 2026;
          if (parts[0].length === 4) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
          } else {
            month = parseInt(parts[1]);
            year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]);
          }
          const monthNames = [
            'Janaayo', 'Febraayo', 'Marsi', 'Abriil', 'May', 'Juun',
            'Luulyo', 'Ogoosto', 'Sitedembar', 'Oktobar', 'Nofembar', 'Diseembar'
          ];
          const mName = monthNames[(month - 1) % 12] || 'Ogoosto';
          monthYear = `${mName} ${year}`;
        }
      }

      // 6. Match Student
      let matchedStudent: Student | undefined = undefined;
      if (cleanPhone.length >= 6) {
        matchedStudent = students.find((s) => {
          const cleanPPhone = (s.parentPhone || '').replace(/\D/g, '').replace(/^252|^0/, '');
          return cleanPPhone.includes(cleanPhone) || cleanPhone.includes(cleanPPhone);
        });
      }

      if (!matchedStudent) {
        const lowerText = text.toLowerCase();
        matchedStudent = students.find((s) => {
          const lowerStudent = s.fullName.toLowerCase();
          const lowerParent = s.parentName.toLowerCase();
          return lowerText.includes(lowerStudent) || lowerText.includes(lowerParent);
        });
      }

      // 7. Check if already registered
      const isAlreadyPaid = payments.some(
        (p) => p.transactionRef.toLowerCase() === refNumber.toLowerCase()
      );

      let status: ParsedSmsPayment['status'] = 'Unmatched';
      if (isAlreadyPaid) {
        status = 'AlreadyRegistered';
      } else if (matchedStudent) {
        status = 'Matched';
      }

      results.push({
        id: `sms-parse-${index}-${Date.now()}`,
        rawSms: text,
        amount: amount || 15,
        phone: phone || matchedStudent?.parentPhone || '252610000000',
        cleanPhone,
        refNumber,
        dateStr,
        monthYear,
        provider,
        matchedStudent,
        status,
      });
    });

    setParsedSmsList(results);
  };

  // Group Parsed SMS Payments by Month
  const parsedSmsMonthlyBreakdown = useMemo(() => {
    const map: { [month: string]: { count: number; totalAmount: number } } = {};
    parsedSmsList.forEach((item) => {
      if (!map[item.monthYear]) {
        map[item.monthYear] = { count: 0, totalAmount: 0 };
      }
      map[item.monthYear].count += 1;
      map[item.monthYear].totalAmount += item.amount;
    });
    return map;
  }, [parsedSmsList]);

  const parsedSmsGrandTotal = useMemo(() => {
    return parsedSmsList.reduce((sum, item) => sum + item.amount, 0);
  }, [parsedSmsList]);

  // Handler to Auto-Register Parsed SMS Payment
  const handleAutoRegisterSmsPayment = (item: ParsedSmsPayment) => {
    if (!item.matchedStudent) {
      alert('Tallaabadani waxay u baahan tahay in ardaygu ku xirnaado SMS-ka!');
      return;
    }

    onAddPayment({
      studentId: item.matchedStudent.id,
      studentName: item.matchedStudent.fullName,
      parentName: item.matchedStudent.parentName,
      monthYear: item.monthYear,
      amountPaid: item.amount,
      paymentMethod: item.provider,
      transactionRef: item.refNumber,
      date: item.dateStr || new Date().toISOString().split('T')[0],
      status: 'Paid',
      processedBy: 'SMS Mobile Reader',
    });

    setParsedSmsList((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: 'AlreadyRegistered' } : p))
    );

    setSmsToast(`⚡ Bixintii $${item.amount} ee ${item.matchedStudent.fullName} (${item.refNumber}) waa la diiwaangeliyay!`);
    setTimeout(() => setSmsToast(null), 4000);
  };

  const handleLoadSampleSms = (type: 'current' | 'past' | 'batch') => {
    let sample = '';
    if (type === 'current') {
      sample = `[$15.00] ka heshay 252615551234 (Axmed Jaamac) Tar: 13/08/2026 Txn: EVC98211`;
    } else if (type === 'past') {
      sample = `[$15.00] ka heshay 252618889900 (Cumar Xasan) Tar: 15/07/2026 Txn: EVC88102`;
    } else if (type === 'batch') {
      sample = `[$15.00] ka heshay 252615551234 (Axmed Jaamac) Tar: 13/08/2026 Txn: EVC98211\n\nZaad: You received $20.00 from 252634455661 (Farhiya Ali) on 12/08/2026. Ref: ZD9910\n\n[$15.00] ka heshay 252618889900 (Cumar Xasan) Tar: 15/07/2026 Txn: EVC88102\n\nSahal: $15.00 ka heshay 252627788990 (Farxaan Maxamed). Ref: SHL7721 Date: 10/06/2026`;
    }
    handleParseSmsInput(sample);
  };

  // Custom SMS & WhatsApp Fee Reminder State
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [reminderChannel, setReminderChannel] = useState<'sms' | 'whatsapp' | 'both'>('both');
  const [smsTemplate, setSmsTemplate] = useState<string>(
    'Asc Waalid {waalidka}, waxaan ku xusuusinaynaa in ardayga {ardayga} uu ku dhiman yahay baqiga lacagta dugsiga oo dhan {baqiga} ({bisha}). Fadlan ku bixi EVC/Zaad ama xarunta {dugsiga}. Mahadsanid.'
  );
  const [apiKey, setApiKey] = useState<string>(() => settings.smsSettings?.apiKey || localStorage.getItem('sms_api_key') || '');
  const [tokenSecret, setTokenSecret] = useState<string>(() => settings.smsSettings?.tokenSecret || localStorage.getItem('sms_token_secret') || '');
  const [senderId, setSenderId] = useState<string>(() => settings.smsSettings?.senderId || localStorage.getItem('sms_sender_id') || settings.schoolName || 'TAHDIIB-MIS');
  const [isMockMode, setIsMockMode] = useState<boolean>(() => settings.smsSettings?.isMockMode ?? true);

  useEffect(() => {
    if (settings.smsSettings) {
      if (settings.smsSettings.apiKey) setApiKey(settings.smsSettings.apiKey);
      if (settings.smsSettings.tokenSecret) setTokenSecret(settings.smsSettings.tokenSecret);
      if (settings.smsSettings.senderId) setSenderId(settings.smsSettings.senderId);
      if (settings.smsSettings.isMockMode !== undefined) setIsMockMode(settings.smsSettings.isMockMode);
    }
  }, [settings.smsSettings]);
  const [selectedSmsStudentIds, setSelectedSmsStudentIds] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsProgress, setSmsProgress] = useState<{ total: number; sent: number; failed: number; current?: string } | null>(null);
  const [smsToast, setSmsToast] = useState<string | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Dedicated Parent Fee Portal - Only shows required fee, paid amount, remaining balance, and receipts for THEIR OWN CHILDREN
  if (currentUser?.role === 'parent') {
    const myChildren = getParentChildren(currentUser, students);
    const myChildIds = myChildren.map((c) => c.id);
    const myPayments = payments.filter(
      (p) =>
        myChildIds.includes(p.studentId) ||
        myChildren.some((c) => p.studentName.toLowerCase().includes(c.fullName.toLowerCase()))
    );

    const totalRequiredMonthly = myChildren.reduce((acc, c) => acc + (c.feeMonthly || 0), 0);
    const totalMyPaid = myChildren.reduce((acc, c) => acc + (c.feePaid || 0), 0);
    const totalMyRemaining = myChildren.reduce(
      (acc, c) => acc + (c.feeRemaining ?? (c.feeStatus === 'Paid' ? 0 : c.feeMonthly)),
      0
    );

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 rounded-2xl shadow-xl border border-amber-400/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-slate-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
              👨‍👩‍👧 Boga Bixinta Lacagaha Ubadkaaga • Parent Portal
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Bixinta Lacagaha: {currentUser.name}</span>
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              Warbixinta dhameystiran ee lacagaha laga rabo ubadkaaga, inta aad bixisay, baaqiga dhiman iyo rasiidhada bixinta.
            </p>
          </div>
        </div>

        {/* 3 Personal Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase block">1. Wadarta Bille Ah Laga Rabo</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatMoney(totalRequiredMonthly, false, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-500">Lacagta billaha ah ee {myChildren.length} arday</p>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase block">2. Wadarta Aad Bixisay</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {formatMoney(totalMyPaid, false, settings.currency)}
            </div>
            <p className="text-[11px] text-emerald-700">Lacagta laga xareeyay rasiidhadaada</p>
          </div>

          <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-1">
            <span className="text-xs font-bold text-rose-800 uppercase block">3. Baaqiga Dhiman</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-700">
              {formatMoney(totalMyRemaining, false, settings.currency)}
            </div>
            <p className="text-[11px] text-rose-700">Baaqiga dhiman ee laguu leeyahay</p>
          </div>
        </div>

        {/* Children Fee Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span>👶 Xaaladda Bixinta Lacagaha Ubadkaaga</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myChildren.map((child) => {
              const remaining = child.feeRemaining ?? (child.feeStatus === 'Paid' ? 0 : child.feeMonthly);
              return (
                <div key={child.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{child.fullName}</h4>
                      <p className="text-xs text-slate-500">Fasalka: {child.className} • ID: {child.studentId}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        child.feeStatus === 'Paid'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {child.feeStatus === 'Paid' ? '✅ Fee Paid' : '⚠️ Fee Unpaid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-center text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bille</span>
                      <span className="font-bold text-slate-800">
                        {formatMoney(child.feeMonthly, false, settings.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bixiyay</span>
                      <span className="font-bold text-emerald-700">
                        {formatMoney(child.feePaid, false, settings.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Baaqiga</span>
                      <span className="font-bold text-rose-700">
                        {formatMoney(remaining, false, settings.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History Receipts for Parents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span>🧾 Diiwaanka Rasiidhada Lacagaha Aad Bixisay</span>
          </h3>

          {myPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Wali ma jiro rasiidh bixin lacag ah oo loo duubay ubadkaaga.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Rasiidka #</th>
                    <th className="p-3">Ardayga</th>
                    <th className="p-3">Bisha</th>
                    <th className="p-3">Lacagta</th>
                    <th className="p-3">Habka</th>
                    <th className="p-3">Taariikhda</th>
                    <th className="p-3 text-right">Rasiidka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-800">{p.invoiceNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                      <td className="p-3 font-semibold text-emerald-800">{p.monthYear}</td>
                      <td className="p-3 font-black text-emerald-700">
                        {formatMoney(p.amountPaid, false, settings.currency)}
                      </td>
                      <td className="p-3 text-slate-600">{p.paymentMethod}</td>
                      <td className="p-3 text-slate-500">{p.date}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onPrintReceipt(p)}
                          className="px-3 py-1 bg-[#0e7a48] hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Eeg Rasiidka</span>
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
    );
  }

  const openAddModalForStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    const remaining = getStudentRemainingFee(student);
    setAmountPaid(remaining > 0 ? remaining : student.feeMonthly || 15);
    setIsOpenModal(true);
  };

  const openSmsModalForStudents = (studentListOrIds?: (string | Student)[], channel: 'sms' | 'whatsapp' | 'both' = 'both') => {
    setReminderChannel(channel);
    if (studentListOrIds && studentListOrIds.length > 0) {
      const ids = studentListOrIds.map((item) => (typeof item === 'string' ? item : item.id));
      setSelectedSmsStudentIds(ids);
    } else {
      setSelectedSmsStudentIds(pendingStudents.map((s) => s.id));
    }
    setSmsProgress(null);
    setIsSmsModalOpen(true);
  };

  const toggleSelectAllSms = () => {
    if (selectedSmsStudentIds.length === pendingStudents.length) {
      setSelectedSmsStudentIds([]);
    } else {
      setSelectedSmsStudentIds(pendingStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudentForSms = (id: string) => {
    if (selectedSmsStudentIds.includes(id)) {
      setSelectedSmsStudentIds(selectedSmsStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedSmsStudentIds([...selectedSmsStudentIds, id]);
    }
  };

  const handleSendSingleStudentAutoRemind = async (student: Student, channel: 'sms' | 'whatsapp' | 'both' = 'both') => {
    if (!student.parentPhone) {
      alert(`Ardayga ${student.fullName} ma laha nambarka waalidka.`);
      return;
    }

    const remainingFee = getStudentRemainingFee(student);
    const currentMonth = getCurrentSomaliMonthYear();
    let msgSuccess = false;

    // 1. Send via Hormuud Bulk SMS API
    if (channel === 'sms' || channel === 'both') {
      const messageText = smsTemplate
        .replace(/\{waalidka\}/gi, student.parentName || 'Waalid')
        .replace(/\{ardayga\}/gi, student.fullName)
        .replace(/\{baqiga\}/gi, `$${remainingFee}`)
        .replace(/\{bisha\}/gi, currentMonth)
        .replace(/\{dugsiga\}/gi, settings.schoolName || 'Tahdiib Al-Adfaal');

      try {
        await sendSmsViaBackend({
          recipients: student.parentPhone,
          recipientName: student.parentName,
          recipientPhone: student.parentPhone,
          studentName: student.fullName,
          message: messageText,
          senderId: senderId || settings.schoolName || 'TAHDIIB-MIS',
          gateway: 'Hormuud Bulk SMS',
          messageType: 'Fee',
          apiKey,
          tokenSecret,
          isMockMode,
        });
        msgSuccess = true;
      } catch (err) {
        console.error('Hormuud SMS error:', err);
      }
    }

    // 2. Send via WhatsApp API
    if (channel === 'whatsapp' || channel === 'both') {
      try {
        await sendAutomatedFeeReminderWhatsAppNotification({
          studentName: student.fullName,
          parentPhone: student.parentPhone,
          parentName: student.parentName,
          remainingAmount: remainingFee,
          monthYear: currentMonth,
          settings,
          customMessage: smsTemplate,
        });
        msgSuccess = true;
      } catch (err) {
        console.error('WhatsApp API error:', err);
      }
    }

    const chLabel = channel === 'both' ? 'Hormuud SMS & WhatsApp' : channel === 'sms' ? 'Hormuud SMS' : 'WhatsApp';
    setSmsToast(`⚡ Xusuusinta baqiga ($${remainingFee}) ee ${student.fullName} waxaa lagu diray ${chLabel}!`);
    setTimeout(() => setSmsToast(null), 4500);
  };

  // Send Templated SMS Notification for an Individual Payment Record
  const handleSendPaymentSmsAlert = async (payment: PaymentTransaction) => {
    const matchedStudent = students.find(
      (s) => s.id === payment.studentId || s.fullName.toLowerCase() === payment.studentName.toLowerCase()
    );

    const recipientPhone = matchedStudent?.parentPhone || '252610000000';
    const parentName = payment.parentName || matchedStudent?.parentName || 'Waalid';

    const messageText = `Asc Waalid ${parentName}, waxaa nidaamka lagu diiwaangeliyay bixinta lacagta dugsiga ee ardayga ${payment.studentName}. Invoice #${payment.invoiceNumber}, Lacagta: $${payment.amountPaid} (${payment.monthYear}) [Txn: ${payment.transactionRef}]. Mahadsanid, ${settings.schoolName || 'Tahdiib Al-Adfaal'}.`;

    try {
      await sendSmsViaBackend({
        recipients: recipientPhone,
        recipientName: parentName,
        recipientPhone: recipientPhone,
        studentName: payment.studentName,
        message: messageText,
        senderId: senderId || settings.schoolName || 'TAHDIIB-MIS',
        gateway: 'Hormuud Bulk SMS',
        messageType: 'Fee',
        apiKey,
        tokenSecret,
        isMockMode,
      });

      try {
        await sendAutomatedPaymentWhatsAppNotification({
          studentName: payment.studentName,
          parentPhone: recipientPhone,
          parentName: parentName,
          amount: payment.amountPaid,
          feeType: payment.monthYear,
          invoiceNumber: payment.invoiceNumber,
          paymentMethod: payment.paymentMethod,
          date: payment.date,
          settings,
        });
      } catch (waErr) {
        console.error('WhatsApp notification error:', waErr);
      }

      setSmsToast(`📲 Fariinta SMS Alert ee Invoice #${payment.invoiceNumber} (${payment.studentName}) waa loo diray waalidka (${recipientPhone})!`);
      setTimeout(() => setSmsToast(null), 4500);
    } catch (err: any) {
      alert(`Cillad ayaa ka dhacday dirista SMS Alert: ${err?.message || err}`);
    }
  };

  const handleSendSmsReminders = async () => {
    const selectedStudents = pendingStudents.filter((s) => selectedSmsStudentIds.includes(s.id));
    if (selectedStudents.length === 0) {
      setSmsToast('Fadlan dooro ugu yaraan hal waalid oo aad xusuusin u direso.');
      setTimeout(() => setSmsToast(null), 4000);
      return;
    }

    // Save configuration to localStorage
    localStorage.setItem('sms_api_key', apiKey);
    localStorage.setItem('sms_token_secret', tokenSecret);
    localStorage.setItem('sms_sender_id', senderId);

    setIsSendingSms(true);
    setSmsProgress({ total: selectedStudents.length, sent: 0, failed: 0 });

    let successCount = 0;
    let failCount = 0;
    const currentMonth = getCurrentSomaliMonthYear();

    for (let i = 0; i < selectedStudents.length; i++) {
      const student = selectedStudents[i];
      const remainingFee = getStudentRemainingFee(student);
      const message = smsTemplate
        .replace(/\{waalidka\}/gi, student.parentName || 'Waalid')
        .replace(/\{ardayga\}/gi, student.fullName)
        .replace(/\{baqiga\}/gi, `$${remainingFee}`)
        .replace(/\{bisha\}/gi, currentMonth)
        .replace(/\{dugsiga\}/gi, settings.schoolName || 'Tahdiib Al-Adfaal');

      setSmsProgress({
        total: selectedStudents.length,
        sent: successCount,
        failed: failCount,
        current: `${student.parentName} (${student.fullName})`,
      });

      let okSms = false;
      let okWa = false;

      // 1. Dispatch via Hormuud SMS API
      if (reminderChannel === 'sms' || reminderChannel === 'both') {
        try {
          const smsRes = await sendSmsViaBackend({
            recipients: student.parentPhone,
            recipientName: student.parentName,
            recipientPhone: student.parentPhone,
            studentName: student.fullName,
            message,
            senderId: senderId || settings.schoolName || 'TAHDIIB-MIS',
            gateway: 'Hormuud Bulk SMS',
            messageType: 'Fee',
            apiKey,
            tokenSecret,
            isMockMode,
          });
          if (smsRes.success) okSms = true;
        } catch (err) {
          console.error('Hormuud SMS dispatch error:', err);
        }
      }

      // 2. Dispatch via WhatsApp API
      if (reminderChannel === 'whatsapp' || reminderChannel === 'both') {
        try {
          const waRes = await sendAutomatedFeeReminderWhatsAppNotification({
            studentName: student.fullName,
            parentPhone: student.parentPhone,
            parentName: student.parentName,
            remainingAmount: remainingFee,
            monthYear: currentMonth,
            settings,
            customMessage: smsTemplate,
          });
          if (waRes) okWa = true;
        } catch (err) {
          console.error('WhatsApp dispatch error:', err);
        }
      }

      if (okSms || okWa) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setSmsProgress({ total: selectedStudents.length, sent: successCount, failed: failCount });
    setIsSendingSms(false);

    const modeText = isMockMode ? '🧪 [MOCK MODE - Simulated]' : '🚀 [LIVE API Gateway]';
    const channelName = reminderChannel === 'both' ? 'Hormuud SMS & WhatsApp' : reminderChannel === 'sms' ? 'Hormuud SMS' : 'WhatsApp';
    setSmsToast(`${modeText}: Si guul ah ayaa xusuusinta (${channelName}) loogu diray ${successCount}/${selectedStudents.length} waalid!`);
    setTimeout(() => setSmsToast(null), 5000);
  };

  const openEditModal = (p: PaymentTransaction) => {
    setEditingPayment(p);
    setSelectedStudentId(p.studentId);
    setMonthYear(p.monthYear);
    setAmountPaid(p.amountPaid);
    setPaymentMethod(p.paymentMethod);
    setTransactionRef(p.transactionRef);
  };

  const filteredPayments = payments.filter((p) => {
    if (currentUser?.role === 'student') {
      const isMe =
        p.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        p.studentId.toLowerCase() === currentUser.username.toLowerCase();
      if (!isMe) return false;
    } else if (currentUser?.role === 'parent') {
      const myChildren = students.filter(
        (s) =>
          s.parentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          (currentUser.phone && s.parentPhone.includes(currentUser.phone))
      );
      const childNames = myChildren.map((c) => c.fullName.toLowerCase());
      const isMyChild = childNames.some((nm) => p.studentName.toLowerCase().includes(nm));
      if (!isMyChild && myChildren.length > 0) return false;
    }

    return (
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selStudent = students.find((s) => s.id === selectedStudentId);
    const stName = selStudent ? selStudent.fullName : 'Arday';
    const prnName = selStudent ? selStudent.parentName : 'Waalid';

    if (editingPayment) {
      if (onUpdatePayment) {
        onUpdatePayment({
          ...editingPayment,
          studentId: selectedStudentId,
          studentName: stName,
          parentName: prnName,
          monthYear,
          amountPaid,
          paymentMethod,
          transactionRef,
        });
      }
      setEditingPayment(null);
    } else {
      const todayDate = new Date().toISOString().split('T')[0];
      const invNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

      onAddPayment({
        studentId: selectedStudentId,
        studentName: stName,
        parentName: prnName,
        monthYear,
        amountPaid,
        paymentMethod,
        transactionRef,
        date: todayDate,
        status: 'Paid',
        processedBy: 'Maaliyadda',
      });

      // Send automated WhatsApp receipt notification to parent
      const parentPhone = selStudent?.parentPhone || selStudent?.phone || '';
      if (parentPhone) {
        sendAutomatedPaymentWhatsAppNotification({
          studentName: stName,
          parentPhone,
          parentName: prnName,
          amount: amountPaid,
          feeType: `Bisha ${monthYear}`,
          invoiceNumber: invNum,
          paymentMethod,
          date: todayDate,
          settings,
        }).catch((err) => console.error('WhatsApp payment receipt notification error:', err));
      }

      setIsOpenModal(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-700" />
            <span>Maamulka Lacagaha & Bixinta Adaada</span>
          </h2>
          <p className="text-xs text-slate-500">
            Diiwaanka lacagaha la bixiyay, rasiidhada mobile money-ga iyo baaqiga ({payments.length} Bixin)
          </p>
        </div>

        {canManagePayments && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openSmsModalForStudents()}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Dir SMS Ogeysiis Baqiga Lacagta ah ee lagu leeyahay Waalidiinta (Hormuud API)"
            >
              <MessageSquare className="w-4 h-4 text-amber-100" />
              <span>Dir SMS Ogeysiis (Baqiga)</span>
              {pendingStudents.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-900/80 text-amber-100 border border-amber-400/40">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setEditingPayment(null);
                setIsOpenModal(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Bixi Lacag / Rasiidh</span>
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {smsToast && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs border border-slate-700 animate-fade-in">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{smsToast}</span>
          </div>
          <button onClick={() => setSmsToast(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 29-ka Bisha Monthly Fee Auto-Billing Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#0e7a48] to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Calendar className="w-32 h-32 text-amber-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                <Calendar className="w-3 h-3" />
                <span>29-ka Bisha Auto-Billing</span>
              </span>
              {settings.lastBilledMonth === getCurrentSomaliMonthYear() ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-100 border border-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  <span>Bisha {settings.lastBilledMonth}: Waa La Dalacay ({settings.lastBilledDate || '29-ka Bisha'})</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/90 text-amber-200 border border-amber-600/60 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300 animate-pulse" />
                  <span>Diyaar u ah Dalacista 29-ka Bisha ({getCurrentSomaliMonthYear()})</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>Dalacista Lacagta Waalidiinta (Monthly Auto-Billing)</span>
            </h3>

            <p className="text-xs text-emerald-100 leading-relaxed">
              Nidaamku wuxuu bisha 29-keeda toos u dalacaa lacagta dugsiga ($15/arday ama custom fee) dhamaan waalidiinta/ardayda active-ka ah. Waxaad kaloo halkan toos uga kicin kartaa dalacista ama aad SMS ogeysiis ah kaga diri kartaa waalidiinta.
            </p>
          </div>

          {canManagePayments && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Ma ziiddaa inaad ku dalacdo lacagta bisha (${getCurrentSomaliMonthYear()}) dhamaan waalidiinta/ardayda active-ka ah?`)) {
                    onTrigger29thBilling?.(true);
                  }
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer border border-amber-300"
              >
                <RotateCw className="w-4 h-4 text-slate-900" />
                <span>⚡ Ku Dalac Waalidiinta (29-ka Bisha)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSmsTemplate(
                    'Asc Waalid {waalidka}. Waxaan ku ogeysiinaynaa in maanta oo ay tahay 29-ka bisha kugu dalacantay lacagta dugsiga bisha {bisha} oo ah {baqiga}. Fadlan ku bixi EVC/Zaad ama xarunta {dugsiga}. Mahadsanid.'
                  );
                  openSmsModalForStudents();
                }}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                <span>SMS Ogeysiis 29-ka Bisha</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recharts Financial Overview: Paid vs Pending Fee Distribution */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-[#0e7a48] rounded-xl border border-emerald-100">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Eegmada Maaliyadda (Paid vs. Pending Overview)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0e7a48]">
                  Recharts Pie Chart
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Kala saarista dakhliga la helay iyo baqiga la sugayo ee waalidiinta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            <TrendingUp className="w-4 h-4 text-[#0e7a48]" />
            <span>Koraanka Bixinta: {collectionRate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Summary Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                Lacagta La Bixiyay (Paid)
              </span>
              <p className="text-lg sm:text-xl font-black text-emerald-950">
                {formatMoney(totalPaidAmount, shouldHideMoney, settings.currency)}
              </p>
              <p className="text-[10px] text-emerald-700 font-medium">
                Dakhliga soo galay diiwaanka
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                Baqiga Lagu Leeyahay (Pending)
              </span>
              <p className="text-lg sm:text-xl font-black text-amber-950">
                {formatMoney(totalPendingAmount, shouldHideMoney, settings.currency)}
              </p>
              <p className="text-[10px] text-amber-700 font-medium">
                Baqiga dhiman ee waalidiinta
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Wadarta Guud ee Bisha (Expected)
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900">
                {formatMoney(totalExpectedAmount, shouldHideMoney, settings.currency)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Kharashka la filayo bisha dhan
              </p>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Heerka Bixinta (Rate)
              </span>
              <div className="flex items-center justify-between">
                <p className="text-base sm:text-lg font-black text-indigo-950">
                  {collectionRate}%
                </p>
                <span className="text-[10px] font-bold text-indigo-700">
                  {collectionRate >= 70 ? '🟢 Wanaagsan' : '⚠️ U baahan ogeysiis'}
                </span>
              </div>
              <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Native SVG Donut Chart */}
          <div className="lg:col-span-6 bg-slate-50/80 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[220px]">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray={`${Math.min(100, Math.max(0, collectionRate))}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-base font-black text-slate-900 leading-none">{collectionRate}%</span>
                <span className="text-[10px] text-slate-500 font-bold mt-0.5">La Bixiyay</span>
              </div>
            </div>
            {/* Legend List */}
            <div className="space-y-2 text-xs w-full sm:w-auto">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 bg-white p-2 px-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-slate-700 text-xs">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    {formatMoney(item.value, shouldHideMoney, settings.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Students Fee Alert Banner */}
      {pendingStudents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl border border-amber-300 shrink-0 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-amber-950 flex flex-wrap items-center gap-2">
                <span>Ardayda Baqiga Laguu Leeyahay ({pendingStudents.length} Arday)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 font-black text-amber-950 border border-amber-300">
                  Wadarta Baqiga: {formatMoney(totalPendingBalance, shouldHideMoney, settings.currency)}
                </span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                U dir ogeysiis SMS ah (Hormuud Bulk SMS API) waalidiinta si ay baqiga u soo bixiyaan.
              </p>
            </div>
          </div>

          {canManagePayments && (
            <button
              onClick={() => openSmsModalForStudents()}
              className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors border border-amber-800/20"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-200" />
              <span>Dir SMS Ogeysiis Waalidiinta ({pendingStudents.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-200 pb-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#0e7a48] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span>Diiwaanka Bixinta (Payments)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-black">
              {filteredPayments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('debtors')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'debtors'
                ? 'bg-rose-800 text-white shadow-md'
                : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>Qof Kasta oo Wax Lagu Leeyahay (Debtors)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-200 text-rose-950 font-black">
              {pendingStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sms_parser')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sms_parser'
                ? 'bg-amber-600 text-slate-950 shadow-md font-black'
                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-900" />
            <span>Xisaabiyaha SMS Payments (Mobile Reader)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-amber-400 font-black">
              NEW
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sms_logs')}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sms_logs'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>SMS Audit Logs</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
              {smsLogs.length}
            </span>
          </button>
        </div>

        {activeTab === 'sms_logs' && (
          <button
            type="button"
            onClick={handleExportSmsLogsCSV}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer border border-emerald-600"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Dhoofi CSV (Export SMS Logs)</span>
          </button>
        )}
      </div>

      {/* Tab 1: Payments List */}
      {activeTab === 'payments' && (
        <>
          {/* Filter / Search Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi invoice #, arday ama TX ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payments History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800">
                    <th className="p-3 min-w-[140px]">Invoice # & Taariikhda</th>
                    <th className="p-3 min-w-[160px]">Ardayga & Waalidka</th>
                    <th className="p-3">Bisha Lacagta</th>
                    <th className="p-3">Method & Ref</th>
                    <th className="p-3">Lacagta ($)</th>
                    <th className="p-3 text-center min-w-[140px]">Tallaabooyinka & Rasiidh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <div>{p.invoiceNumber}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{p.date}</span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.studentName}</div>
                        <div className="text-[10px] text-slate-500">Waalid: {p.parentName}</div>
                      </td>

                      <td className="p-3 font-semibold text-emerald-800">{p.monthYear}</td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800">{p.paymentMethod}</span>
                        <div className="text-[10px] font-mono text-slate-500">{p.transactionRef}</div>
                      </td>

                      <td className="p-3 font-black text-emerald-900 text-sm">
                        {formatMoney(p.amountPaid, shouldHideMoney, settings.currency)}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onPrintReceipt(p)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors border border-amber-300 shadow-2xs cursor-pointer"
                            title="Imtixaan Rasiidhka"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-800" />
                            <span>Rasiidh</span>
                          </button>

                          {/* SMS Alert Button for individual payment record */}
                          <button
                            onClick={() => handleSendPaymentSmsAlert(p)}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-transform active:scale-95 shadow-2xs cursor-pointer border border-emerald-600"
                            title="Dir SMS Alert ogeysiis bixinta ah waalidka"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                            <span>SMS Alert</span>
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Wax ka beddel Bixinta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {onDeletePayment && (
                            <button
                              onClick={() => onDeletePayment(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Tirtir Bixinta"
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
      )}

      {/* Tab 2: Debtors Breakdown (Qof Kasta oo Wax Lagu Leeyahay) */}
      {activeTab === 'debtors' && (
        <div className="space-y-4">
          {/* Debtors Search and Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi ardayga, waalidka, ama taleefanka..."
                value={debtorsSearch}
                onChange={(e) => setDebtorsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={debtorsStatusFilter}
                onChange={(e) => setDebtorsStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">🌐 Dhamaan Baqiga ({pendingStudents.length})</option>
                <option value="Pending">⏳ Pending (Isla Bisha)</option>
                <option value="Overdue">🚨 Overdue (Bilo Hore Lagu Leeyahay)</option>
              </select>

              <select
                value={debtorsClassFilter}
                onChange={(e) => setDebtorsClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">📚 Dhamaan Fasallada</option>
                {Array.from(new Set(students.map((s) => s.className))).map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => openSmsModalForStudents(pendingStudents, 'both')}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title="Dir SMS iyo WhatsApp xusuusin ah dhamaan waalidiinta leh baqiga"
              >
                <Send className="w-3.5 h-3.5" />
                <span>⚡ Dir Xusuusinta Baqiga (Hormuud SMS / WhatsApp)</span>
              </button>
            </div>
          </div>

          {/* Debtors List Table */}
          <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <h4 className="font-black text-xs text-rose-950">
                  Diiwaanka Ardayda & Waalidiinta Wax Lagu Leeyahay ({filteredDebtors.length} Arday)
                </h4>
              </div>
              <span className="font-extrabold text-xs text-rose-900 bg-rose-200/80 px-2.5 py-0.5 rounded-full border border-rose-300">
                Wadarta Baqiga: {formatMoney(totalPendingAmount, shouldHideMoney, settings.currency)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800">
                    <th className="p-3 min-w-[160px]">Ardayga & Fasalka</th>
                    <th className="p-3 min-w-[160px]">Waalidka & Telefoonka</th>
                    <th className="p-3 text-center">Fee Bisha ($)</th>
                    <th className="p-3 text-center">La Bixiyay ($)</th>
                    <th className="p-3 text-center min-w-[110px]">Baqiga Lagu Leeyahay ($)</th>
                    <th className="p-3 text-center">Xaalada</th>
                    <th className="p-3 text-center min-w-[180px]">Tallaabooyinka Direct-ka Ah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDebtors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                        🎉 Ma jiraan arday ama waalidiin baqi lagu leeyahay marka loo eego filter-kaas!
                      </td>
                    </tr>
                  ) : (
                    filteredDebtors.map((s) => {
                      const remaining = getStudentRemainingFee(s);
                      const monthlyFee = s.feeMonthly || 15;
                      const paidFee = s.feePaid || 0;

                      return (
                        <tr key={s.id} className="hover:bg-rose-50/40 transition-colors">
                          <td className="p-3">
                            <div className="font-black text-slate-900 text-xs">{s.fullName}</div>
                            <div className="text-[10px] font-semibold text-slate-500">
                              {s.className} • Shift: {s.shift || 'Subax'}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-800">{s.parentName}</div>
                            <div className="text-[11px] font-mono text-emerald-800 font-bold">
                              {s.parentPhone || 'Telefoon La\'aan'}
                            </div>
                          </td>

                          <td className="p-3 text-center font-bold text-slate-700">
                            {formatMoney(monthlyFee, shouldHideMoney, settings.currency)}
                          </td>

                          <td className="p-3 text-center font-bold text-emerald-700">
                            {formatMoney(paidFee, shouldHideMoney, settings.currency)}
                          </td>

                          <td className="p-3 text-center font-black text-rose-700 text-sm bg-rose-50/60">
                            {formatMoney(remaining, shouldHideMoney, settings.currency)}
                          </td>

                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                s.feeStatus === 'Overdue'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {s.feeStatus === 'Overdue' ? '🚨 Overdue' : '⏳ Pending'}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Pay Action */}
                              <button
                                onClick={() => {
                                  openAddModalForStudent(s);
                                }}
                                className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-transform active:scale-95 shadow-2xs cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-amber-300" />
                                <span>Bixi</span>
                              </button>

                              {/* Hormuud SMS Action */}
                              {s.parentPhone && (
                                <button
                                  onClick={() => openSmsModalForStudents([s], 'sms')}
                                  className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors border border-amber-300 cursor-pointer flex items-center gap-1 text-[11px]"
                                  title="Dir Hormuud Bulk SMS"
                                >
                                  <Smartphone className="w-3.5 h-3.5 text-amber-800" />
                                  <span className="hidden sm:inline">SMS</span>
                                </button>
                              )}

                              {/* WhatsApp Action */}
                              {s.parentPhone && (
                                <button
                                  onClick={() => openSmsModalForStudents([s], 'whatsapp')}
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg transition-colors border border-emerald-300 cursor-pointer flex items-center gap-1 text-[11px]"
                                  title="Dir WhatsApp Ogeysiis"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-800" />
                                  <span className="hidden sm:inline">WA</span>
                                </button>
                              )}

                              {/* Auto Dual Direct Remind Action */}
                              {s.parentPhone && (
                                <button
                                  onClick={() => handleSendSingleStudentAutoRemind(s, 'both')}
                                  className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold rounded-lg transition-colors border border-indigo-300 cursor-pointer flex items-center gap-1 text-[11px]"
                                  title="⚡ Direct Auto Remind (SMS + WhatsApp)"
                                >
                                  <Send className="w-3.5 h-3.5 text-indigo-800" />
                                  <span className="hidden lg:inline">Auto Both</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mobile SMS Payment Parser Calculator */}
      {activeTab === 'sms_parser' && (
        <div className="space-y-4">
          {/* Top Banner Info */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-4 rounded-2xl shadow-md border border-amber-400/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-950 text-amber-400 rounded-xl shadow-inner shrink-0">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
                    <span>📱 Xisaabiyaha SMS Payments (Mobile Money Reader)</span>
                    <span className="bg-slate-950 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      AUTOMATED ENGINE
                    </span>
                  </h3>
                  <p className="text-xs text-slate-900 font-medium mt-0.5">
                    Geli ama ku shub SMS-yada EVC Plus / Zaad / Sahal ka soo dhacay telefoonkaaga. Nidaamku wuxuu si toos ah u xisaabin doonaa lacagaha bilihii hore iyo bisha hada, wuxuuna kuu xiri doonaa ardayda leedahay!
                  </p>
                </div>
              </div>

              {/* Sample Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-slate-900">SMS Presets:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSms('current')}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  ⚡ Sample EVC (Bisha Hada)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSms('past')}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  ⏳ Sample (Bishii Luulyo)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSms('batch')}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  📚 Sample Multiple SMS (Batch)
                </button>
              </div>
            </div>
          </div>

          {/* SMS Input Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span>Qoraalka SMS-yada Telefoonka Soo Dhacay (Paste Incoming SMS Messages):</span>
              </label>
              {rawSmsInput && (
                <button
                  onClick={() => handleParseSmsInput('')}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear (Safi)
                </button>
              )}
            </div>

            <textarea
              rows={4}
              placeholder="Ku dheji (paste) halkan fariimaha SMS-ka ah ee ku soo dhacay EVC Plus, Zaad ama Sahal. Tusaale: [$15.00] ka heshay 252615551234 (Axmed Jaamac) Tar: 13/08/2026 Txn: EVC98211..."
              value={rawSmsInput}
              onChange={(e) => handleParseSmsInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Monthly Comparison Summary Cards */}
          {parsedSmsList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    SMS Payments La Akhriyay
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {parsedSmsList.length} Fariimood
                  </div>
                </div>
                <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
                  <Smartphone className="w-5 h-5 text-amber-800" />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Ardayda La Hubiyay (Matched)
                  </span>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">
                    {parsedSmsList.filter((i) => i.status === 'Matched').length} Arday
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-800" />
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-md border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wide">
                    Wadarta Guud ee SMS Payments
                  </span>
                  <div className="text-xl font-black text-white mt-0.5">
                    {formatMoney(parsedSmsGrandTotal, shouldHideMoney, settings.currency)}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-black">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Monthly Breakdown Pills */}
          {Object.keys(parsedSmsMonthlyBreakdown).length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Lacagaha Loo Kala Qaybiyay Bilo ahaan:</span>
              </span>

              {Object.entries(parsedSmsMonthlyBreakdown).map(([month, data]: [string, { count: number; totalAmount: number }]) => (
                <div
                  key={month}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs flex items-center gap-2"
                >
                  <span className="text-xs font-extrabold text-slate-900">{month}:</span>
                  <span className="text-xs font-black text-emerald-800">
                    {formatMoney(data.totalAmount, shouldHideMoney, settings.currency)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    ({data.count} txns)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Extracted SMS Payments Table */}
          {parsedSmsList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <h4 className="font-extrabold text-xs flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Diiwaanka Fariimaha Akhriya (Parsed SMS Results)</span>
                </h4>
                <span className="text-[11px] font-bold text-amber-300">
                  Ready to auto-register with 1-Click
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <th className="p-3 min-w-[130px]">Bisha & Taariikhda</th>
                      <th className="p-3 min-w-[120px]">Provider & Ref</th>
                      <th className="p-3">Lacagta SMS ($)</th>
                      <th className="p-3 min-w-[160px]">Ardayga Lagu Xiray (Matched Student)</th>
                      <th className="p-3 text-center min-w-[110px]">Xaalada</th>
                      <th className="p-3 text-center min-w-[150px]">Tallaabada Direct-ka Ah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedSmsList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold">
                          <div className="text-emerald-800 font-extrabold">{item.monthYear}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.dateStr}</div>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-slate-900">{item.provider}</span>
                          <div className="text-[10px] font-mono text-slate-500">{item.refNumber}</div>
                        </td>

                        <td className="p-3 font-black text-emerald-800 text-sm">
                          {formatMoney(item.amount, shouldHideMoney, settings.currency)}
                        </td>

                        <td className="p-3">
                          {item.matchedStudent ? (
                            <div>
                              <div className="font-extrabold text-slate-900">{item.matchedStudent.fullName}</div>
                              <div className="text-[10px] text-slate-500">
                                Class: {item.matchedStudent.className} • Tel: {item.phone}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-amber-800">Phone: {item.phone}</div>
                              <div className="text-[10px] text-slate-400">Arday gaar ah laguma helin</div>
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {item.status === 'AlreadyRegistered' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                              ✓ Re-registered
                            </span>
                          ) : item.status === 'Matched' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ✓ Matched
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ Unmatched
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {item.matchedStudent && item.status !== 'AlreadyRegistered' ? (
                            <button
                              onClick={() => handleAutoRegisterSmsPayment(item)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg shadow-2xs flex items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer border border-amber-600"
                            >
                              <Zap className="w-3.5 h-3.5 fill-slate-950" />
                              <span>⚡ Toos U Diiwaangeli</span>
                            </button>
                          ) : item.status === 'AlreadyRegistered' ? (
                            <span className="text-[11px] font-bold text-slate-400">Kala xisaabsan</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">Dooro ardayga</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: SMS Audit Logs */}
      {activeTab === 'sms_logs' && (
        <div className="space-y-3">
          {/* SMS Filter Controls */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Raadi taleefan, magac waalid, arday ama qoraal SMS..."
                value={smsSearchTerm}
                onChange={(e) => setSmsSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={smsStatusFilter}
                onChange={(e) => setSmsStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">🌐 Dhamaan Xaaladaha ({smsLogs.length})</option>
                <option value="sent">✅ Sent (Direct Hormuud API)</option>
                <option value="simulated">🧪 Simulated (Test Mode)</option>
                <option value="failed">❌ Failed (Flop/Error)</option>
              </select>
            </div>
          </div>

          {/* SMS Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800">
                    <th className="p-3 min-w-[140px]">Taariikhda & Waqtiga</th>
                    <th className="p-3 min-w-[150px]">Telefoonka & Waalidka</th>
                    <th className="p-3 min-w-[130px]">Ardayga Target-ka</th>
                    <th className="p-3 min-w-[110px]">Xaalada (Status)</th>
                    <th className="p-3">Qoraalka Fariinta (SMS Message)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSmsLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                        Ma jiraan diiwaan SMS ah oo laga helay raadintaada.
                      </td>
                    </tr>
                  ) : (
                    filteredSmsLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-700">
                          <div className="font-bold text-slate-900">
                            {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 font-mono text-xs text-[#0e7a48]">
                            {log.recipientPhone}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Waalid: {log.recipientName || 'Unspecified'}
                          </div>
                        </td>

                        <td className="p-3 font-semibold text-slate-800">
                          {log.studentName || '—'}
                        </td>

                        <td className="p-3">
                          {log.status === 'sent' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sent (Hormuud API)</span>
                            </span>
                          )}
                          {log.status === 'simulated' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300 inline-flex items-center gap-1">
                              <Info className="w-3 h-3 text-sky-600" />
                              <span>Simulated (Test)</span>
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-slate-700 max-w-xs sm:max-w-md">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] font-sans leading-relaxed text-slate-800">
                            {log.message}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Record Payment Modal */}
      {(isOpenModal || editingPayment) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>{editingPayment ? 'Wax ka beddel Bixinta Lacagta (Edit)' : 'Bixi Lacagta Dugsiga'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenModal(false);
                  setEditingPayment(null);
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} - {s.className} ({s.feeStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bisha Lacagta</label>
                  <input
                    type="text"
                    required
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lacagta ($)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Habka Bixinta</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad Service</option>
                    <option value="eDahab">eDahab Mobile</option>
                    <option value="Sahal">Sahal Express</option>
                    <option value="Kaash">Kaash (Cash)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ref / TX ID</label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setEditingPayment(null);
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

      {/* Custom SMS Reminder Modal (Hormuud Bulk SMS API) */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-amber-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-800 rounded-xl border border-amber-700">
                  <MessageSquare className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-2 text-amber-50">
                    <span>Dir SMS Ogeysiis Baqiga Lacagta (Hormuud API)</span>
                  </h3>
                  <p className="text-[11px] text-amber-200/80">
                    Diris SMS ogeysiis toos ah waalidiinta leh baqiga lacagta dugsiga
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="p-1.5 rounded-lg bg-amber-800/60 hover:bg-amber-800 text-amber-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* API Configuration & Gateway Toggle Header */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                {/* Channel Selector */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>📡 Gateway Channel:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setReminderChannel('sms')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reminderChannel === 'sms'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      📱 Hormuud SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderChannel('whatsapp')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reminderChannel === 'whatsapp'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      💬 WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderChannel('both')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        reminderChannel === 'both'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      ⚡ Labada Channel
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">
                        {reminderChannel === 'both'
                          ? 'Dual Gateway: Hormuud SMS + WhatsApp'
                          : reminderChannel === 'sms'
                          ? 'SMS Gateway: Hormuud Bulk SMS API'
                          : 'WhatsApp Gateway API'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isMockMode
                          ? '🧪 Mode: Simulated / Mock Mode (Tijaabo Ammaan ah)'
                          : '🚀 Mode: Live Gateway API'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMockMode(!isMockMode)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                        isMockMode
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {isMockMode ? '🧪 Mock Mode (On)' : '🚀 Live Gateway (On)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowApiSettings(!showApiSettings)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-600" />
                      <span>{showApiSettings ? 'Qari Settings' : 'API Keys'}</span>
                    </button>
                  </div>
                </div>

                {/* API Key Settings Drawer */}
                {showApiSettings && (
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Sender ID (Alpha)</label>
                      <input
                        type="text"
                        value={senderId}
                        onChange={(e) => setSenderId(e.target.value)}
                        placeholder="e.g. TAHDIIB-MIS"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">API Key (Hormuud)</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Hormuud API Key..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Token Secret</label>
                      <input
                        type="password"
                        value={tokenSecret}
                        onChange={(e) => setTokenSecret(e.target.value)}
                        placeholder="Token Secret..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Qoraalka Farriinta SMS-ka (Custom SMS Template):
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {smsTemplate.length} xaraf
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed"
                  placeholder="Geli qoraalka SMS-ka..."
                />

                {/* Quick Placeholder Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">Tagaaga Gaarka ah:</span>
                  {[
                    { tag: '{waalidka}', label: 'Magaca Waalidka' },
                    { tag: '{ardayga}', label: 'Magaca Ardayga' },
                    { tag: '{baqiga}', label: 'Baqiga ($)' },
                    { tag: '{bisha}', label: 'Bisha' },
                    { tag: '{dugsiga}', label: 'Dugsiga' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setSmsTemplate((prev) => `${prev} ${item.tag}`)}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold font-mono transition-colors cursor-pointer"
                      title={`Ku dar ${item.label}`}
                    >
                      + {item.tag}
                    </button>
                  ))}
                </div>

                {/* Live Message Preview for First Selected Student */}
                {pendingStudents.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                      📱 Muuqaalka Tusaalaha SMS-ka (Live Sample Preview):
                    </span>
                    <p className="text-slate-800 font-medium italic text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-100">
                      "{smsTemplate
                        .replace(/\{waalidka\}/gi, pendingStudents[0]?.parentName || 'Jaamac Cabdi')
                        .replace(/\{ardayga\}/gi, pendingStudents[0]?.fullName || 'Axmed Jaamac')
                        .replace(/\{baqiga\}/gi, `$${getStudentRemainingFee(pendingStudents[0])}`)
                        .replace(/\{bisha\}/gi, 'Ogoosto 2026')
                        .replace(/\{dugsiga\}/gi, settings.schoolName || 'Tahdiib Al-Adfaal')}"
                    </p>
                  </div>
                )}
              </div>

              {/* Recipients Selection Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Waalidiinta leh Baqiga Lacagta ({selectedSmsStudentIds.length}/{pendingStudents.length} Doortay)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleSelectAllSms}
                    className="text-xs text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    {selectedSmsStudentIds.length === pendingStudents.length ? 'Baaqso Dhammaan' : 'Dooro Dhammaan'}
                  </button>
                </div>

                {pendingStudents.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    🎉 Ma jiraan arday waalidiintooda lagu leeyahay baqiga lacagta dugsiga!
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                    {pendingStudents.map((s) => {
                      const isSelected = selectedSmsStudentIds.includes(s.id);
                      const remaining = getStudentRemainingFee(s);

                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleSelectStudentForSms(s.id)}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer select-none ${
                            isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by row click
                              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {s.fullName} <span className="text-slate-400 font-normal">({s.className})</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Waalid: <strong className="text-slate-700">{s.parentName}</strong> ({s.parentPhone})
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              Baqiga: ${remaining}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live Dispatch Progress Bar */}
              {isSendingSms && smsProgress && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="w-4 h-4 animate-spin text-amber-700" />
                      <span>SMS-ka waa la dirayaa... {smsProgress.current}</span>
                    </span>
                    <span>
                      {smsProgress.sent + smsProgress.failed}/{smsProgress.total}
                    </span>
                  </div>

                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((smsProgress.sent + smsProgress.failed) / smsProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Wadarta Doorashada: <strong className="text-amber-900 font-bold">{selectedSmsStudentIds.length} Waalid</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSmsModalOpen(false)}
                    disabled={isSendingSms}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Kanasal
                  </button>

                  <button
                    type="button"
                    onClick={handleSendSmsReminders}
                    disabled={isSendingSms || selectedSmsStudentIds.length === 0}
                    className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSendingSms ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Waa La Dirayaa...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dir SMS Ogeysiiska ({selectedSmsStudentIds.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
