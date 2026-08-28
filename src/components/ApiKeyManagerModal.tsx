import React, { useState, useEffect } from 'react';
import { SchoolSettings, ApiKeyItem, ApiPermission, User } from '../types';
import {
  Key,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  X,
  Code,
  Terminal,
  Trash2,
  RefreshCw,
  AlertCircle,
  Server,
  Zap,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Send,
  BookOpen,
  FileText,
  Database
} from 'lucide-react';

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  currentUser: User;
  onSaveSettings: (updatedSettings: SchoolSettings) => void;
  onOpenHormuudApplicationModal?: () => void;
}

export const ApiKeyManagerModal: React.FC<ApiKeyManagerModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onSaveSettings,
  onOpenHormuudApplicationModal,
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(settings.apiKeys || [
    {
      id: 'key-default-001',
      name: 'Default Master API Key',
      keyPrefix: 'th_live_sec_9902',
      secretKey: 'th_live_sec_990288f9940asom2026',
      permissions: ['full_access', 'read_students', 'read_attendance', 'read_payments', 'send_sms'],
      status: 'Active',
      createdAt: '2026-08-01',
      lastUsedAt: 'Maanta',
    }
  ]);

  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<ApiPermission[]>([
    'read_students',
    'read_attendance'
  ]);
  const [webhookUrl, setWebhookUrl] = useState('');

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newlyCreatedKeySecret, setNewlyCreatedKeySecret] = useState<string | null>(null);

  // Playground tester state
  const [testEndpoint, setTestEndpoint] = useState<'/api/v1/students' | '/api/v1/attendance' | '/api/v1/payments' | '/api/v1/docs'>('/api/v1/students');
  const [selectedKeyForTest, setSelectedKeyForTest] = useState<string>(apiKeys[0]?.secretKey || 'th_live_sec_990288f9940asom2026');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isLoadingTest, setIsLoadingTest] = useState(false);

  // Hormuud SMS API State
  const [hormuudStatus, setHormuudStatus] = useState<{
    connected: boolean;
    message: string;
    senderId: string;
  }>({
    connected: false,
    message: '🔴 Hormuud SMS lama xiriirin',
    senderId: 'TAHDIIB-MIS',
  });
  const [hormuudBalance, setHormuudBalance] = useState<number | string | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isRefreshingBal, setIsRefreshingBal] = useState(false);

  // Send Test SMS Modal State
  const [showTestSmsModal, setShowTestSmsModal] = useState(false);
  const [testPhone, setTestPhone] = useState('+25261');
  const [testMessage, setTestMessage] = useState('Tani waa fariin tijaabo ah oo ka timid Machadka Tahdiibul Adfaal.');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsNotice, setTestSmsNotice] = useState<string | null>(null);
  const [testSmsError, setTestSmsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'keys' | 'hormuud' | 'playground' | 'docs'>('keys');

  useEffect(() => {
    if (isOpen) {
      fetchHormuudStatus();
      fetchHormuudBalance();
    }
  }, [isOpen]);

  const fetchHormuudStatus = async () => {
    setIsTestingConn(true);
    try {
      const res = await fetch('/api/hormuud/config');
      if (res.ok) {
        const data = await res.json();
        setHormuudStatus({
          connected: Boolean(data.connected),
          message: data.message || (data.connected ? '🟢 Hormuud SMS waa ku xiran yahay' : '🔴 Hormuud SMS lama xiriirin'),
          senderId: data.senderId || 'TAHDIIB-MIS',
        });
      } else {
        setHormuudStatus({
          connected: false,
          message: '🔴 Hormuud SMS lama xiriirin: Xiriirka Hormuud wuu fashilmay.',
          senderId: 'TAHDIIB-MIS',
        });
      }
    } catch {
      setHormuudStatus({
        connected: false,
        message: '🔴 Hormuud SMS lama xiriirin: Service-ku ma suurtogalin.',
        senderId: 'TAHDIIB-MIS',
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const fetchHormuudBalance = async () => {
    setIsRefreshingBal(true);
    try {
      const res = await fetch('/api/hormuud/balance');
      if (res.ok) {
        const data = await res.json();
        setHormuudBalance(data.balance ?? null);
      } else {
        setHormuudBalance(null);
      }
    } catch {
      setHormuudBalance(null);
    } finally {
      setIsRefreshingBal(false);
    }
  };

  const handleSendTestSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTestSms(true);
    setTestSmsNotice(null);
    setTestSmsError(null);

    try {
      const res = await fetch('/api/hormuud/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: testPhone,
          message: testMessage,
          senderId: hormuudStatus.senderId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestSmsNotice('SMS-ka si guul leh ayaa loo diray.');
        fetchHormuudBalance();
      } else {
        setTestSmsError(data.error || 'SMS-ka lama dirin. Xiriirka Hormuud wuu fashilmay.');
      }
    } catch (err: any) {
      setTestSmsError(err.message || 'SMS-ka lama dirin: Xiriirka Hormuud wuu fashilmay.');
    } finally {
      setIsSendingTestSms(false);
    }
  };

  if (!isOpen) return null;

  const handleCopySecret = (keyId: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const togglePermission = (perm: ApiPermission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const secretKey = `th_live_sec_${randomHex}`;
    const keyPrefix = secretKey.substring(0, 15);

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix,
      secretKey,
      permissions: selectedPermissions.length === 0 ? ['read_students'] : selectedPermissions,
      status: 'Active',
      createdAt: new Date().toLocaleDateString('en-GB'),
      webhookUrl: webhookUrl.trim() || undefined,
    };

    const updatedKeys = [newKey, ...apiKeys];
    setApiKeys(updatedKeys);
    setNewlyCreatedKeySecret(secretKey);

    // Save to settings
    onSaveSettings({
      ...settings,
      apiKeys: updatedKeys,
    });

    // Reset form
    setNewKeyName('');
    setWebhookUrl('');
    setIsCreatingKey(false);
  };

  const handleRevokeKey = (keyId: string) => {
    const updatedKeys = apiKeys.map((k) => (k.id === keyId ? { ...k, status: 'Revoked' as const } : k));
    setApiKeys(updatedKeys);
    onSaveSettings({
      ...settings,
      apiKeys: updatedKeys,
    });
  };

  const handleRunApiTest = async () => {
    setIsLoadingTest(true);
    setTestResponse(null);

    try {
      const res = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedKeyForTest}`,
        },
      });

      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message || 'Cillad ayaa ka dhacday API Test-ka' }, null, 2));
    } finally {
      setIsLoadingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between border-b-4 border-[#0e7a48]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0e7a48] text-amber-300 rounded-2xl shadow-lg border border-emerald-600">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  DEVELOPER API MANAGER
                </span>
                <span className="text-emerald-400 text-xs font-bold">REST API v1.0</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                MAAMULKA API-YADA (API KEYS & INTEGRATION)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'keys'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Key className="w-4 h-4 text-[#0e7a48]" />
            <span>Tahdiibul API Keys ({apiKeys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hormuud')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'hormuud'
                ? 'bg-white text-emerald-800 border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Hormuud SMS API</span>
            <span className={`w-2 h-2 rounded-full ${hormuudStatus.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'playground'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-600" />
            <span>API Playground & Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-white text-[#0e7a48] border-[#0e7a48] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Dokumentiga API-yada (Docs)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto bg-slate-50/50">

          {/* Newly Created Key Alert Banner */}
          {newlyCreatedKeySecret && (
            <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span>API KEY CUSUB YAA LA DHALIYAY! (SAVE YOUR SECRET KEY)</span>
                </span>
                <button
                  onClick={() => setNewlyCreatedKeySecret(null)}
                  className="text-amber-800 hover:text-amber-950 font-bold text-xs cursor-pointer"
                >
                  Clear Notice
                </button>
              </div>
              <p className="text-xs text-amber-900 font-medium">
                Fadlan nuqul (copy) ka saxo secret key-gan. Amniga dhowrida darteed mar kale lama tusin doono marka aad bogga xirto!
              </p>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-amber-300 font-mono text-xs font-bold text-slate-900">
                <span className="flex-1 truncate">{newlyCreatedKeySecret}</span>
                <button
                  onClick={() => handleCopySecret('new', newlyCreatedKeySecret)}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedKeyId === 'new' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Key</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: API KEYS LIST & GENERATE FORM */}
          {activeTab === 'keys' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Samee ama Maamul API Keys-ka</h3>
                  <p className="text-xs text-slate-500">
                    API Keys-ku waxay kuu sahlayaan in aad App-ka Tahdiibul Adfaal ku xirto Mobile Apps, Parent Portals, ama software kale.
                  </p>
                </div>
                {!isCreatingKey && (
                  <button
                    onClick={() => setIsCreatingKey(true)}
                    className="px-4 py-2.5 bg-[#0e7a48] hover:bg-[#095733] text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Samee API Key Cusub</span>
                  </button>
                )}
              </div>

              {/* CREATE KEY FORM */}
              {isCreatingKey && (
                <form onSubmit={handleGenerateApiKey} className="p-5 bg-white rounded-2xl border-2 border-emerald-300 shadow-md space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#0e7a48]" />
                      <span>Form-ka Dhalinta API Key Cusub</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCreatingKey(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Kansal
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">Magaca API Key-ga (Name):</label>
                    <input
                      type="text"
                      required
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Mobile App Integration Key, Third-Party Portal"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 block">Rukhsadaha & Awoodaha (Permissions):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'read_students', label: '📖 Akhriska Ardayda' },
                        { id: 'write_students', label: '✍️ Wax-ka-beddelka Ardayda' },
                        { id: 'read_attendance', label: '✅ Akhriska Xaadiriska' },
                        { id: 'read_payments', label: '💳 Akhriska Lacagaha' },
                        { id: 'send_sms', label: '📩 Dirida SMS-ka' },
                        { id: 'full_access', label: '⚡ Awood Buuxda (Full Access)' },
                      ].map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id as ApiPermission);
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => togglePermission(perm.id as ApiPermission)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50 text-emerald-950 border-emerald-400 font-black shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{perm.label}</span>
                            {isChecked && <CheckCircle2 className="w-4 h-4 text-[#0e7a48] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">Webhook URL (Sido kale doorsoomaha event-ka):</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.yourdomain.com/webhooks/tahdiib"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingKey(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Kansal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0e7a48] hover:bg-[#095733] text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Dhal Dhagaha API Key Cusub</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ACTIVE API KEYS LIST */}
              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 text-[#0e7a48] rounded-xl">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                            <span>{k.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                k.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {k.status}
                            </span>
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            Prefix: <strong className="text-slate-800">{k.keyPrefix}...</strong> • Created: {k.createdAt}
                          </span>
                        </div>
                      </div>

                      {k.status === 'Active' && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleCopySecret(k.id, k.secretKey)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                            title="Nuqul ka saxo Secret Key-ga"
                          >
                            {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            <span>{copiedKeyId === k.id ? 'Copied!' : 'Copy Secret Key'}</span>
                          </button>

                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl flex items-center gap-1 border border-rose-200 transition-all cursor-pointer"
                            title="Laal / De-activate gareee API Key-gan"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Revoke</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="text-slate-400">PERMISSIONS:</span>
                      {k.permissions.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: HORMUUD SMS INTEGRATION */}
          {activeTab === 'hormuud' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* API MANAGEMENT HEADER CARD */}
              <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl border-2 border-emerald-600/50 shadow-xl space-y-6">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      OFFICIAL INTEGRATION GATEWAY
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight mt-1">
                      MAAMULKA API-YADA (API KEYS & INTEGRATION)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchHormuudStatus}
                      disabled={isTestingConn}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                      <span>{isTestingConn ? 'Eegaya Xiriirka...' : 'TEST CONNECTION'}</span>
                    </button>
                    <button
                      onClick={fetchHormuudBalance}
                      disabled={isRefreshingBal}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBal ? 'animate-spin' : ''}`} />
                      <span>REFRESH BALANCE</span>
                    </button>
                  </div>
                </div>

                {/* API STATUS METRICS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Metric 1: Tahdiibul Internal API */}
                  <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Tahdiibul Internal API
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-base font-black text-emerald-400">🟢 Active</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Port 3000 • HTTPS Secured
                    </span>
                  </div>

                  {/* Metric 2: Hormuud SMS Status */}
                  <div className={`p-4 backdrop-blur-md rounded-2xl border space-y-2 ${
                    hormuudStatus.connected ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-rose-950/30 border-rose-500/50'
                  }`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Hormuud SMS
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        hormuudStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`} />
                      <span className={`text-base font-black ${
                        hormuudStatus.connected ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {hormuudStatus.connected ? '🟢 Connected' : '🔴 Not Connected'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 block font-mono truncate" title={hormuudStatus.message}>
                      {hormuudStatus.message}
                    </span>
                  </div>

                  {/* Metric 3: Real SMS Balance */}
                  <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      SMS Balance
                    </span>
                    <div className="text-xl font-black text-amber-300 font-mono">
                      {hormuudBalance !== null ? `${hormuudBalance} SMS` : '---'}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Real-time credit sync
                    </span>
                  </div>

                  {/* Metric 4: Approved Sender ID */}
                  <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Sender ID
                    </span>
                    <div className="text-base font-black text-emerald-300 font-mono">
                      [{hormuudStatus.senderId}]
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Approved Enterprise Mask
                    </span>
                  </div>

                </div>

                {/* API MANAGEMENT ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={fetchHormuudStatus}
                    className="px-5 py-2.5 bg-[#0e7a48] hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>KU XIR HORMUUD / TEST CONNECTION</span>
                  </button>

                  <button
                    onClick={() => {
                      setTestSmsNotice(null);
                      setTestSmsError(null);
                      setShowTestSmsModal(true);
                    }}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>DIR TEST SMS</span>
                  </button>

                  {onOpenHormuudApplicationModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenHormuudApplicationModal();
                      }}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                      <FileText className="w-4 h-4 text-amber-300" />
                      <span>CODSIGA & DUKUMIINTIYADA HORMUUD</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg ml-auto"
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>SMS HISTORY (BOGGA SMS)</span>
                  </button>
                </div>

              </div>

              {/* TEST SMS DISPATCHER FORM MODAL / CARD */}
              {showTestSmsModal && (
                <form onSubmit={handleSendTestSmsSubmit} className="p-6 bg-white rounded-3xl border-2 border-amber-400 shadow-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">TEST SMS DISPATCHER (HORMUUD API)</h4>
                        <p className="text-xs text-slate-500">Dir fariin tijaabo ah oo toos ugu dhacaysa telefoonka waalidka/tijaabiyaha.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTestSmsModal(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Xir Form-ka
                    </button>
                  </div>

                  {testSmsNotice && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{testSmsNotice}</span>
                    </div>
                  )}

                  {testSmsError && (
                    <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 font-bold text-xs rounded-xl flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{testSmsError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">Lambarka Aqbalaada (Phone):</label>
                      <input
                        type="text"
                        required
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+25261XXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e7a48]"
                      />
                      <span className="text-[10px] text-slate-500 block">Lambarka waxaa si otomaatig ah loogu badali doonaa qaabka +252...</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">Sender ID Mask:</label>
                      <input
                        type="text"
                        disabled
                        value={hormuudStatus.senderId}
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">Qoraalka Fariinta (Message):</label>
                    <textarea
                      required
                      rows={3}
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e7a48]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTestSmsModal(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-300 cursor-pointer"
                    >
                      Kansal
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingTestSms}
                      className="px-6 py-2.5 bg-[#0e7a48] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-amber-300" />
                      <span>{isSendingTestSms ? 'Dirayaa...' : 'DIR TEST SMS HADA'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* SECURITY & ARCHITECTURE NOTICE */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0e7a48] shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <h5 className="font-black uppercase tracking-wider text-[#0e7a48]">ENVIRONMENT SECRETS COMPLIANCE</h5>
                  <p className="leading-relaxed">
                    Hormuud SMS credentials (URL, Username, Password, Token, Sender ID) waxaa si ammaan ah loogu kaydiyay server-side environment variables (`.env`). Frontend-ku ama browser-ku ma laha awood uu ku tirtiro ama uu ku kashifo furayaashaas.
                  </p>
                </div>
              </div>

            </div>
          )}
          {activeTab === 'playground' && (
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-slate-900 text-sm">Interactive API Playground (Live Endpoint Tester)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">Dooro Endpoint-ka:</label>
                    <select
                      value={testEndpoint}
                      onChange={(e) => setTestEndpoint(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="/api/v1/students">GET /api/v1/students (Liiska Ardayda)</option>
                      <option value="/api/v1/attendance">GET /api/v1/attendance (Xaadiriska)</option>
                      <option value="/api/v1/payments">GET /api/v1/payments (Lacagaha)</option>
                      <option value="/api/v1/docs">GET /api/v1/docs (API Documentation)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-700 block">API Key-ga Tijaabada:</label>
                    <input
                      type="text"
                      value={selectedKeyForTest}
                      onChange={(e) => setSelectedKeyForTest(e.target.value)}
                      placeholder="th_live_sec_..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleRunApiTest}
                    disabled={isLoadingTest}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isLoadingTest ? 'Dirayaa...' : 'Test Request Now'}</span>
                  </button>
                </div>

                {/* Response Code Window */}
                {testResponse && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">API Response Output:</span>
                    <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-800 shadow-inner">
                      {testResponse}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTATION & CURL EXAMPLES */}
          {activeTab === 'docs' && (
            <div className="space-y-4 text-xs text-slate-800">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Sida Loo Isticmaalo API-yada Tahdiibul Adfaal MIS</span>
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  Barnaamijyada ka baxsan ama software-ka kale waxay kula xiriiri karaan nidaamka iyaga oo isticmaalaya standard Authorization Bearer header:
                </p>

                <div className="space-y-2">
                  <span className="font-black text-slate-900 block">1. cURL Example (Fetch Students):</span>
                  <pre className="p-3 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-xl overflow-x-auto">
{`curl -X GET "https://YOUR-APP-HOST/api/v1/students" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="font-black text-slate-900 block">2. JavaScript / Node.js Fetch Example:</span>
                  <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto">
{`const response = await fetch('https://YOUR-APP-HOST/api/v1/students', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);`}
                  </pre>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0e7a48]" />
            <span>Tahdiibul Adfaal MIS API Gateway • Port 3000 Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Xir (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
