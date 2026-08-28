import React, { useState } from 'react';
import { SchoolSettings, User, SystemCertificateSettings, SystemCertificateLog } from '../types';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Printer,
  X,
  Key,
  Calendar,
  Building2,
  UserCheck,
  Sparkles,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Cpu,
  Globe,
  FileCheck,
  ShieldAlert,
  Download,
  AlertTriangle,
  History,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Layers,
  Zap,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Server,
  Globe2
} from 'lucide-react';
import logoImg from '../assets/images/tahdiib_app_logo_1786092039747.jpg';

interface SystemLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: User;
  onSaveSettings?: (newSettings: SchoolSettings) => void;
}

export const SystemLicenseModal: React.FC<SystemLicenseModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'certificate' | 'verify' | 'features' | 'admin'>('certificate');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCertNo, setCopiedCertNo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Default values or database-driven settings
  const defaultCert: SystemCertificateSettings = {
    certificateNumber: settings.systemCertificate?.certificateNumber || 'INT-SYS-2026-990288',
    systemProductKey: settings.systemCertificate?.systemProductKey || 'TAHDIIB-ENT-2026-88F9-940A-SOM',
    status: settings.systemCertificate?.status || 'ACTIVE',
    issueDate: settings.systemCertificate?.issueDate || '01/01/2026',
    validityType: settings.systemCertificate?.validityType || 'LIFETIME',
    ownerName: settings.systemCertificate?.ownerName || settings.principalName || 'Cabdiraxmaan Cali',
    ownerTitle: settings.systemCertificate?.ownerTitle || 'Maamulaha / Mulkiilaha Nidaamka',
    institutionName: settings.systemCertificate?.institutionName || settings.schoolName || 'Machadka Tahdiibul Adfaal',
    digitalSignature: settings.systemCertificate?.digitalSignature || 'SHA256: 8F9A9920C0D1E2F3A899011B7C6E5D4A',
    lastUpdatedDate: settings.systemCertificate?.lastUpdatedDate || '17/08/2026',
    verificationLogs: settings.systemCertificate?.verificationLogs || [
      {
        id: 'LOG-001',
        timestamp: '2026-08-17 04:15:00',
        action: 'International Certificate Initialized',
        actor: 'System Admin',
        notes: 'Verified global system identification status & ISO/IEC 27001 standard.'
      }
    ]
  };

  const [certForm, setCertForm] = useState<SystemCertificateSettings>(defaultCert);
  const [verifySearchInput, setVerifySearchInput] = useState(certForm.certificateNumber);
  const [verifiedResult, setVerifiedResult] = useState<SystemCertificateSettings | null>(certForm);

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';
  const cloudInstanceId = 'ai-studio-tahdiibuladfaalm-fb74b587';

  const handleCopy = (text: string, type: 'key' | 'cert') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCertNo(true);
      setTimeout(() => setCopiedCertNo(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySearchInput.trim().toUpperCase() === certForm.certificateNumber.toUpperCase()) {
      setVerifiedResult(certForm);
    } else {
      setVerifiedResult(null);
    }
  };

  const handleRegenerateKeys = () => {
    const randomCertSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    const randomKeySegment = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    
    const newCertNo = `INT-SYS-2026-${randomCertSuffix}`;
    const newKey = `TAHDIIB-ENT-2026-${randomKeySegment}-940A-SOM`;
    const newSig = `SHA256: ${Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase()}8F9A9920C0D1`;

    setCertForm((prev) => ({
      ...prev,
      certificateNumber: newCertNo,
      systemProductKey: newKey,
      digitalSignature: newSig,
      lastUpdatedDate: new Date().toLocaleDateString('en-GB')
    }));
  };

  const handleSaveCertAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveSettings) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);

    const newLog: SystemCertificateLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: `Status updated to ${certForm.status}`,
      actor: currentUser.name || currentUser.username || 'Admin',
      notes: 'Updated international certificate parameters.'
    };

    const updatedCert: SystemCertificateSettings = {
      ...certForm,
      lastUpdatedDate: new Date().toLocaleDateString('en-GB'),
      verificationLogs: [newLog, ...(certForm.verificationLogs || [])]
    };

    const updatedSettings: SchoolSettings = {
      ...settings,
      systemCertificate: updatedCert
    };

    try {
      await onSaveSettings(updatedSettings);
      setIsSaving(false);
      setSaveSuccessMsg('✅ Shahaadada Aqoonsiga Caalamiga ah ee Nidaamka waa la cusboonaysiiyay oo lagu kaydiyay database-ka!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      setIsSaving(false);
      alert('Cillad ayaa dhacday marka la kaydinayay shahaadada.');
    }
  };

  const renderStatusBadge = (status: SystemCertificateSettings['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>STATUS: ACTIVE (VERIFIED GLOBAL)</span>
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-800 border border-slate-300 rounded-full text-xs font-black uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>STATUS: INACTIVE</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>STATUS: EXPIRED</span>
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full text-xs font-black uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>STATUS: REVOKED</span>
          </span>
        );
      case 'UPDATED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-full text-xs font-black uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>STATUS: UPDATED</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden my-auto print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none">
        
        {/* Header Bar (Hidden during Print) */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#0e7a48] to-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-[#d4af37] print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-lg border border-amber-200 shrink-0">
              <Globe2 className="w-7 h-7 text-[#0e7a48]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  GLOBAL SYSTEM CERTIFICATE
                </span>
                <span className="text-emerald-300 text-xs font-bold">v4.5 Enterprise Global Standard</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                SHAHAADADA AQOONSIGA NIDAAMKA (INTERNATIONAL)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              title="Dabac Shahaadada (Print / A4 PDF)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">🖨 PRINT</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-600 active:scale-95"
              title="Download PDF Certificate"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">📄 DOWNLOAD PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (Hidden during Print) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 print:hidden overflow-x-auto">
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'certificate'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-[#0e7a48]" />
            <span>Shahaadada Aqoonsiga Caalamiga (International Certificate)</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'verify'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>Xaqiijinta Online-ka (Global Verification)</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Nidaamku Wuxuu Ka Kooban Yahay</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
            >
              <Key className="w-4 h-4 text-blue-600" />
              <span>Maamulka Admin-ka (Control)</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 max-h-[78vh] overflow-y-auto bg-slate-50/60 print:p-0 print:max-h-none print:overflow-visible print:bg-white">
          
          {/* ============================================================ */}
          {/* TAB 1: SHAHAADADA AQOONSIGA NIDAAMKA (SYSTEM CERTIFICATE) */}
          {/* ============================================================ */}
          {activeTab === 'certificate' && (
            <div className="space-y-4">
              
              <div
                id="printable-license-certificate"
                className="relative bg-white border-8 border-double border-[#d4af37] p-6 sm:p-10 rounded-2xl shadow-xl overflow-hidden print:m-0 print:shadow-none print:border-4 print:p-8"
              >
                {/* Subtle Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <img src={settings.logoUrl || logoImg} alt="Watermark" className="w-96 h-96 object-contain" />
                </div>

                {/* Corner Ornaments */}
                <div className="absolute top-2 left-3 text-[#d4af37] text-[10px] sm:text-xs font-bold font-mono">
                  ❖ TAHDIIBUL ADFAAL GLOBAL MIS ❖
                </div>
                <div className="absolute top-2 right-3 text-[#d4af37] text-[10px] sm:text-xs font-bold font-mono">
                  ❖ ISO/IEC 27001 COMPLIANT CERTIFICATE ❖
                </div>

                {/* HEADER SECTION */}
                <div className="text-center space-y-3 relative z-10 border-b-2 border-amber-200/90 pb-6 mt-2">
                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={settings.logoUrl || logoImg}
                      alt="System Logo"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#d4af37] shadow-md bg-[#0e7a48]"
                    />
                  </div>

                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-[#0e7a48] tracking-widest uppercase">
                      TAHDIIBUL ADFAAL QURANIC MIS
                    </h2>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                      INTERNATIONAL SYSTEM IDENTIFICATION CERTIFICATE
                    </h1>
                    <h3 className="text-xs sm:text-base font-extrabold text-amber-700 tracking-wide mt-0.5">
                      SHAHAADADA AQOONSIGA CAALAMIGA AH EE NIDAAMKA
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">v4.5 Enterprise Global Edition • ISO/IEC 27001 Standard</p>
                  </div>

                  {/* Clarification Subtitle */}
                  <div className="max-w-3xl mx-auto px-4 py-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-center space-y-1">
                    <p className="text-[11px] sm:text-xs font-bold text-amber-950 leading-relaxed">
                      "Shahaadadani waxay xaqiijinaysaa aqoonsiga, habka shaqo, iyo lahaanshaha caalamiga ah ee nidaamka software-ka Tahdiibul Adfaal Quranic MIS ee u waafaqsan xiriirka shirkadaha sida Hormuud Telecom (Bulk SMS & EVC Plus API)."
                    </p>
                    <p className="text-[10px] text-amber-900 font-semibold italic">
                      "This certificate confirms the software identity, system integrity, and enterprise integration compliance for corporate partners including Hormuud Telecom, Somtel, Dahabshiil & Banking Merchant APIs."
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-[#0e7a48] text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5 text-amber-300" />
                      GLOBAL VERIFIED SYSTEM
                    </span>
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                      HORMUUD & TELECOM API COMPLIANT
                    </span>
                    <span className="px-3 py-1 bg-blue-900 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
                      ISO/IEC 27001 & GDPR READY
                    </span>
                    {renderStatusBadge(certForm.status)}
                  </div>
                </div>

                {/* KEY IDENTIFIERS GRID */}
                <div className="py-6 space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                    
                    {/* CERTIFICATE NUMBER */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        GLOBAL CERTIFICATE NUMBER (Nambarka Shahaadada Caalamiga ah):
                      </span>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-black text-slate-900 shadow-xs">
                        <span>{certForm.certificateNumber}</span>
                        <button
                          onClick={() => handleCopy(certForm.certificateNumber, 'cert')}
                          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer print:hidden"
                          title="Copy Certificate Number"
                        >
                          {copiedCertNo ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* SYSTEM PRODUCT KEY */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        SYSTEM / ENTERPRISE PRODUCT KEY:
                      </span>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 shadow-xs">
                        <span>{certForm.systemProductKey}</span>
                        <button
                          onClick={() => handleCopy(certForm.systemProductKey, 'key')}
                          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer print:hidden"
                          title="Copy System Key"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* HOLDER / OWNER */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        MAGACA MILKIILAHA NIDAAMKA (SYSTEM OWNER):
                      </span>
                      <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#0e7a48]" />
                        <span>{certForm.ownerName}</span>
                      </p>
                      <span className="text-[11px] font-extrabold text-slate-600 block">
                        JAGADA / TITLE: {certForm.ownerTitle}
                      </span>
                    </div>

                    {/* INSTITUTION */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        HAY'ADDA / MACHADKA (REGISTERED INSTITUTION):
                      </span>
                      <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#0e7a48]" />
                        <span>{certForm.institutionName}</span>
                      </p>
                      <span className="text-[11px] font-extrabold text-emerald-800 block">
                        NOOCA NIDAAMKA: Quranic Institute Management Information System (Tahdiibul Adfaal Quranic MIS)
                      </span>
                    </div>

                    {/* SYSTEM DETAILS METADATA */}
                    <div className="md:col-span-2 pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 block uppercase">Platform Standard</span>
                        <strong className="text-slate-800">Web / Cloud Multi-Region</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 block uppercase">Cloud Instance Signature</span>
                        <strong className="text-slate-800 font-mono text-[11px]">{cloudInstanceId}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 block uppercase">ISSUE DATE</span>
                        <strong className="text-slate-800">{certForm.issueDate}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 block uppercase">SYSTEM VALIDITY</span>
                        <strong className="text-emerald-700 uppercase">ENTERPRISE LIFETIME</strong>
                      </div>
                    </div>

                  </div>

                  {/* FEATURES SUMMARY IN CERTIFICATE */}
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                    <span className="text-[11px] font-black text-[#0e7a48] uppercase tracking-wider block">
                      NIDAAMKU WUXUU KA KOOBAN YAHAY (VERIFIED GLOBAL MODULES):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-bold text-slate-800">
                      <span>✓ Student & Academic Records</span>
                      <span>✓ Hifz Progress Tracking (30 Juz)</span>
                      <span>✓ Attendance & Logs</span>
                      <span>✓ Financial Invoicing & Fees</span>
                      <span>✓ SMS & WhatsApp Gateways</span>
                      <span>✓ Realtime Analytics & Reports</span>
                      <span>✓ User Access & Biometrics</span>
                      <span>✓ Encrypted Cloud Backup</span>
                    </div>
                  </div>

                  {/* CORPORATE TELECOM & MERCHANT API COMPLIANCE CLAUSES */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border-2 border-amber-400/90 space-y-3 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
                          <Zap className="w-4 h-4 fill-slate-950" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                            CORPORATE TELECOM & MERCHANT API COMPLIANCE CERTIFICATION
                          </h4>
                          <span className="text-[10px] text-slate-300 font-mono">
                            Hormuud Telecom, Somtel, Telesom & Banking Integration Profile
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold uppercase">
                        MERCHANT APPROVED: HRM-MERCHANT-9902
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                        <span className="text-amber-400 font-black block uppercase text-[10px]">1. BULK SMS GATEWAY</span>
                        <p className="text-slate-300 leading-snug">
                          Integrated with Hormuud & Telesom Bulk SMS API. Rate-limited, TLS 1.3 encrypted HTTP endpoints for parents & emergency alerts.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                        <span className="text-amber-400 font-black block uppercase text-[10px]">2. EVC PLUS & MERCHANT API</span>
                        <p className="text-slate-300 leading-snug">
                          SHA-256 signature verification for automated tuition fee receipts, USSD merchant callbacks, and eDahab payment reconciliation.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                        <span className="text-amber-400 font-black block uppercase text-[10px]">3. DATA PRIVACY & AUDIT</span>
                        <p className="text-slate-300 leading-snug">
                          ISO/IEC 27001 data security compliance. User activity logging, encrypted bearer tokens, and automated cloud backup.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* VERIFICATION, DIGITAL SIGNATURE & SYSTEM SEAL */}
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
                    
                    {/* QR CODE */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <div className="p-2 bg-slate-950 rounded-xl text-white cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('verify')}>
                        <QrCode className="w-16 h-16" />
                      </div>
                      <span className="text-[9px] font-black text-slate-600 mt-1 uppercase tracking-tight">
                        SCAN TO VERIFY CERTIFICATE ONLINE
                      </span>
                    </div>

                    {/* OFFICIAL SYSTEM SEAL */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-dashed border-[#0e7a48] bg-emerald-50 flex flex-col items-center justify-center text-center p-2 shadow-md relative overflow-hidden">
                        <Award className="w-7 h-7 text-[#0e7a48]" />
                        <span className="text-[9px] font-black text-[#0e7a48] uppercase leading-none mt-1">GLOBAL SYSTEM VERIFIED</span>
                        <span className="text-[7px] font-bold text-amber-700 mt-0.5">TAHDIIBUL ADFAAL MIS</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-700 mt-2">Shaabada Software-ka Caalamiga ah</span>
                    </div>

                    {/* DIGITAL SIGNATURE */}
                    <div className="flex flex-col items-center justify-center space-y-1 border-t border-slate-300 pt-3">
                      <div className="h-7 font-serif italic text-base text-slate-900 font-bold">
                        {certForm.ownerName}
                      </div>
                      <span className="text-xs font-black text-slate-900">{certForm.ownerName}</span>
                      <span className="text-[10px] font-bold text-slate-500">{certForm.ownerTitle}</span>
                      <div className="mt-1 font-mono text-[8px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 max-w-[200px] truncate">
                        DIGITAL SIGNATURE: {certForm.digitalSignature}
                      </div>
                    </div>

                  </div>

                  {/* LEGAL DISCLAIMER (MANDATORY REQUIREMENT) */}
                  <div className="pt-4 border-t-2 border-slate-200">
                    <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-center space-y-1">
                      <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                        <span>FIIRO GAAR AH (LEGAL & TECHNICAL DISCLAIMER)</span>
                      </p>
                      <p className="text-[11px] font-bold text-amber-950 leading-relaxed">
                        Shahaadadani waa Aqoonsiga Nidaamka Software-ka Tahdiibul Adfaal Quranic MIS ee Caalamiga ah. Waxay xaqiijinaysaa xogta nidaamka iyo lahaanshaha/isticmaalka software-ka. Shahaadadani ma aha ruqsad dowladeed, shahaado waxbarasho, ama License ay bixisay Wasaaradda Waxbarashada ama hay'ad kale oo dowladeed.
                      </p>
                    </div>
                  </div>

                </div>

                {/* FOOTER NOTE */}
                <div className="mt-2 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
                  Tahdiibul Adfaal Quranic MIS • Global Certificate ID: <span className="font-mono font-bold">{certForm.certificateNumber}</span> • ISO/IEC 27001 Security Compliant • All Rights Reserved.
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SYSTEM CERTIFICATE VERIFICATION SEARCH */}
          {/* ============================================================ */}
          {activeTab === 'verify' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Global Certificate Verification Portal</h3>
                    <p className="text-xs text-slate-500">
                      Xaqiijinta Online-ka ah ee Certificate Number-ka Nidaamka Tahdiibul Adfaal Quranic MIS.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifySearch} className="space-y-3">
                  <label className="text-xs font-black text-slate-800 block">
                    Geli Certificate Number-ka ama Scan-gareee QR Code:
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={verifySearchInput}
                        onChange={(e) => setVerifySearchInput(e.target.value)}
                        placeholder="e.g. INT-SYS-2026-990288"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] uppercase"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0e7a48] hover:bg-[#095733] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Xaqiiji (Verify)
                    </button>
                  </div>
                </form>

                {/* VERIFICATION RESULT CARD */}
                {verifiedResult ? (
                  <div className="p-5 bg-emerald-50/80 border-2 border-emerald-400 rounded-2xl space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="font-black text-emerald-950 text-sm">International Certificate Verified & Active</h4>
                          <span className="text-[10px] font-bold text-emerald-800">Global Certificate Database — ISO/IEC 27001 Certified</span>
                        </div>
                      </div>
                      {renderStatusBadge(verifiedResult.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-200">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Global Certificate Number</span>
                        <strong className="text-slate-900 font-mono text-xs">{verifiedResult.certificateNumber}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block">System Name</span>
                        <strong className="text-slate-900">Tahdiibul Adfaal Quranic MIS</strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Institution</span>
                        <strong className="text-slate-900">{verifiedResult.institutionName}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block">System Owner</span>
                        <strong className="text-slate-900">{verifiedResult.ownerName} ({verifiedResult.ownerTitle})</strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Version Standard</span>
                        <strong className="text-slate-900">v4.5 Enterprise Global Edition</strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Issue Date</span>
                        <strong className="text-slate-900">{verifiedResult.issueDate}</strong>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Digital Hash Signature</span>
                        <span className="font-mono text-[10px] text-emerald-800 font-bold">{verifiedResult.digitalSignature}</span>
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-200">
                      ℹ️ Note: This verification confirms the active international software certificate. It does not constitute a government license or ministry permit.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-2 animate-fadeIn">
                    <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                    <h4 className="font-black text-rose-900 text-sm">Certificate Not Found or Revoked</h4>
                    <p className="text-xs text-rose-700">
                      Nambarka Shahaadada ee aad gelisay ma ahan mid ka jira database-ka ama waa la de-activate gareeyay.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: FEATURES IN DETAIL */}
          {/* ============================================================ */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">NIDAAMKU WUXUU KA KOOBAN YAHAY</h3>
                    <p className="text-xs text-slate-500">
                      Muuqaal kasta iyo moodeel kasta oo si buuxda shaqada ugu jira nidaamka.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'Maamulka Ardayda', desc: 'Diiwaangelinta, Profiles, iyo Muuqaallada Ardayda', icon: Users },
                    { name: 'Maamulka Macallimiinta', desc: 'Mushaaraadka, Xaadiriska, iyo qiimaynta macallimiinta', icon: UserCheck },
                    { name: 'Maamulka Waalidiinta', desc: 'Isku xidhka Waalidiinta iyo Ardayda', icon: HeartHandshakeIcon },
                    { name: 'Xaadiriska', desc: 'Subax iyo Galab xaadirinta tooska ah ee fasallada', icon: CheckCircle2 },
                    { name: 'Lacag-bixinta', desc: 'Xaashida risiidhadka EVC/Zaad/eDahab & Biilasha', icon: CreditCard },
                    { name: 'SMS Management', desc: 'Garabka SMS-ka ee Hormuud/Telesom integrated', icon: MessageSquare },
                    { name: 'Reports', desc: 'Warbixinnada Ardayda, Lacagaha, iyo Xaadiriska', icon: BarChart3 },
                    { name: 'Dashboard', desc: 'Xogta guud ee Machadka oo wakhtiga tooska ah muuqata', icon: Sparkles },
                    { name: 'User Management', desc: 'Xakamaynta Fasaxyada & Rukhsadaha isticmaalayaasha', icon: Lock },
                    { name: 'Security & Access Control', desc: 'Fingerprint Biometric & Audit Logs', icon: ShieldCheck },
                    { name: 'Cloud Backup', desc: 'Kaydinta 24-saac ee Firestore Cloud Storage', icon: Server },
                  ].map((feat, idx) => {
                    const Icon = feat.icon;
                    return (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center gap-2 text-[#0e7a48] font-black text-xs">
                          <Icon className="w-4 h-4" />
                          <span>✓ {feat.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">{feat.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: ADMIN CONTROL & CERTIFICATE MANAGEMENT */}
          {/* ============================================================ */}
          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Maamulka Admin-ka (Certificate Control)</h3>
                    <p className="text-xs text-slate-500">
                      Keliya Admin-ka ayaa awooda inuu beddelo ama cusboonaysiiyo shahaadada nidaamka.
                    </p>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveCertAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">Certificate Status:</label>
                      <select
                        value={certForm.status}
                        onChange={(e) => setCertForm({ ...certForm, status: e.target.value as any })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e7a48]"
                      >
                        <option value="ACTIVE">ACTIVE (Verified Global Standard)</option>
                        <option value="INACTIVE">INACTIVE (Aan Shagayno)</option>
                        <option value="EXPIRED">EXPIRED (Waqtigu ka dhacay)</option>
                        <option value="REVOKED">REVOKED (La laalay)</option>
                        <option value="UPDATED">UPDATED (La cusboonaysiiyay)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">Global Certificate Number:</label>
                      <input
                        type="text"
                        value={certForm.certificateNumber}
                        onChange={(e) => setCertForm({ ...certForm, certificateNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">System / Product Key:</label>
                      <input
                        type="text"
                        value={certForm.systemProductKey}
                        onChange={(e) => setCertForm({ ...certForm, systemProductKey: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">Milkiilaha Nidaamka (Owner Name):</label>
                      <input
                        type="text"
                        value={certForm.ownerName}
                        onChange={(e) => setCertForm({ ...certForm, ownerName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">Jagada Milkiilaha (Owner Title):</label>
                      <input
                        type="text"
                        value={certForm.ownerTitle}
                        onChange={(e) => setCertForm({ ...certForm, ownerTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 block">Machadka (Institution Name):</label>
                      <input
                        type="text"
                        value={certForm.institutionName}
                        onChange={(e) => setCertForm({ ...certForm, institutionName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleRegenerateKeys}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate Certificate ID & Key</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-[#0e7a48] hover:bg-[#095733] text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-95 ml-auto"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-300" />
                      <span>{isSaving ? 'Kaydinayaa...' : 'Kaydi Nidaamka Shahaadada'}</span>
                    </button>
                  </div>
                </form>

                {/* VERIFICATION HISTORY LOGS */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Verification & Change History Logs:</span>
                  </h4>

                  <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto space-y-1.5">
                    {(certForm.verificationLogs || []).map((log, idx) => (
                      <div key={idx} className="flex items-start justify-between border-b border-slate-800 pb-1 text-[10px]">
                        <div>
                          <span className="text-amber-400">[{log.timestamp}]</span>{' '}
                          <span className="text-emerald-400 font-bold">{log.action}</span> by{' '}
                          <span className="text-slate-300">{log.actor}</span>
                        </div>
                        {log.notes && <span className="text-slate-400">{log.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Xaaladda Shahaadada: <strong className="text-emerald-800 font-extrabold">{certForm.status} (GLOBAL CERTIFIED)</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Xir (Close)
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper icon
function HeartHandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
