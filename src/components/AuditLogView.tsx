import React, { useState } from 'react';
import { AuditLogEntry, User as UserType } from '../types';
import { Storage } from '../lib/storage';
import { COLLECTIONS, subscribeCollection, deleteItemFromFirestore, logAuditActivity } from '../lib/firebase';
import {
  History,
  Clock,
  User,
  Search,
  Download,
  Trash2,
  ShieldCheck,
  Calendar,
  Layers,
  Settings,
  BookOpen,
  Award,
  Users,
  DollarSign,
  Plus,
  X,
  Save,
} from 'lucide-react';

interface AuditLogViewProps {
  currentUser?: UserType | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => Storage.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');

  // Manual Log Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualAction, setManualAction] = useState('');
  const [manualCategory, setManualCategory] = useState<AuditLogEntry['category']>('system');
  const [manualDetails, setManualDetails] = useState('');

  // Realtime subscription to Firestore audit logs
  React.useEffect(() => {
    const unsubscribe = subscribeCollection<AuditLogEntry>(COLLECTIONS.AUDIT_LOGS, (fireLogs) => {
      if (fireLogs && fireLogs.length > 0) {
        // Sort descending by timestamp
        const sorted = [...fireLogs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sorted);
        Storage.saveAuditLogs(sorted);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleClearLogs = () => {
    if (confirm('Ma ziiddaa inaad tirtirto dhammaan taariikhda Audit Logs-ka?')) {
      Storage.saveAuditLogs([]);
      setLogs([]);
      logs.forEach((l) => {
        deleteItemFromFirestore(COLLECTIONS.AUDIT_LOGS, l.id).catch(() => {});
      });
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Ma jiraan logs la dhoofin karo!');
      return;
    }
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Category', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${l.user}"`,
      `"${l.userRole || 'admin'}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_Tahdiib_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAction.trim()) return;

    await logAuditActivity(
      currentUser?.name || 'Admin',
      currentUser?.role || 'admin',
      manualAction.trim(),
      manualCategory,
      manualDetails.trim() || 'Custom administrative activity recorded manually.'
    );

    setManualAction('');
    setManualDetails('');
    setIsManualModalOpen(false);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesRole = selectedRole === 'all' || (log.userRole && log.userRole.toLowerCase() === selectedRole.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp).getTime();
      const now = new Date().getTime();
      if (dateFilter === 'today') {
        matchesDate = now - logDate < 24 * 60 * 60 * 1000;
      } else if (dateFilter === '7days') {
        matchesDate = now - logDate < 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === 'month') {
        matchesDate = now - logDate < 30 * 24 * 60 * 60 * 1000;
      }
    }

    return matchesSearch && matchesCategory && matchesRole && matchesDate;
  });

  // Category Badge Helper
  const getCategoryBadge = (cat: AuditLogEntry['category']) => {
    switch (cat) {
      case 'students':
        return { label: 'Ardayda', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Users };
      case 'teachers':
        return { label: 'Macallimiinta', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Users };
      case 'attendance':
        return { label: 'Xaadiriska', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Calendar };
      case 'payments':
        return { label: 'Maaliyadda', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: DollarSign };
      case 'classes':
        return { label: 'Fasallada', bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: Layers };
      case 'system':
      case 'settings':
        return { label: 'Dejimaha', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: Settings };
      case 'exams':
        return { label: 'Imtixaanaadka', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: Award };
      case 'hifz':
        return { label: 'Hifdiga', bg: 'bg-teal-100 text-teal-800 border-teal-300', icon: BookOpen };
      default:
        return { label: cat, bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: History };
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('so-SO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return ts;
    }
  };

  const last24hCount = logs.filter(
    (l) => new Date().getTime() - new Date(l.timestamp).getTime() < 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Stats */}
      <div className="bg-emerald-950 p-5 rounded-2xl text-white border border-amber-400/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#d4af37] text-base flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>Taariikhda Falallada Isticmaalayaasha (Admin Audit Log)</span>
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            Halkan waxaa ku keedsoona dhammaan falallada muhiimka ah oo lagu sameeyay system-ka (sida ku daridda ardayda, bixinta lacagaha, dib-u-dhigga xaadiriska, ama badalidda dejimaha).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ku Dar Log Manual</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-600 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Dhoofi CSV</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-bold text-xs rounded-xl border border-rose-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-300" />
            <span>Tirtir Logs-ka</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Wadarta Dhammaan Logs-ka</span>
          <span className="font-black text-slate-900 text-lg">{logs.length} Log</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Falallada 24 Saac Ugu Dambeeyay</span>
          <span className="font-black text-emerald-700 text-lg">{last24hCount} Falal</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Logs-ka La Siftaye (Filtered)</span>
          <span className="font-black text-amber-700 text-lg">{filteredLogs.length} Log</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Heerka Amniga System-ka</span>
          <span className="font-black text-[#0e7a48] text-xs flex items-center gap-1 mt-1">
            <ShieldCheck className="w-4 h-4 text-[#0e7a48]" />
            <span>Audit Tracking Active</span>
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Raadi falal, magac ama faahfaahin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">🗓️ Taariikhda: Dhammaan</option>
            <option value="today">⚡ Maanta (24h)</option>
            <option value="7days">📆 7-dii Maalmood Ugu Dambeeyay</option>
            <option value="month">🗓️ Bishan (30 Days)</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Qaybaha Dhammaan (All Categories)</option>
            <option value="students">Ardayda (Students)</option>
            <option value="teachers">Macallimiinta (Teachers)</option>
            <option value="attendance">Xaadiriska (Attendance)</option>
            <option value="payments">Maaliyadda (Payments)</option>
            <option value="classes">Fasallada (Classes)</option>
            <option value="settings">Dejimaha (Settings)</option>
            <option value="exams">Imtixaanaadka (Exams)</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Doorka (All Roles)</option>
            <option value="admin">Admin</option>
            <option value="teacher">Macallin</option>
            <option value="finance">Maaliya</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600 text-sm">Ma jiraan Audit Logs la helay.</p>
            <p className="text-xs text-slate-400">Marka falal muhiim ah lagu sameeyo system-ka halkan ayaa lagu diiwaangelin doonaa.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const badge = getCategoryBadge(log.category);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 text-[#0e7a48] rounded-xl border border-emerald-100 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{log.action}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">{log.details}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                          <User className="w-3 h-3 text-emerald-700" />
                          <span>{log.user}</span>
                          {log.userRole && (
                            <span className="uppercase text-[9px] font-black px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {log.userRole}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 md:pl-4">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Action Log Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#d4af37] flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Ku Dar Qoraal Maamul / Log Manual</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Falalka (Action Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beddelida Siyaasadda Lacagaha, Dib-u-angajinta Fasallada"
                  value={manualAction}
                  onChange={(e) => setManualAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Qaybta (Category) *</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as AuditLogEntry['category'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="system">Dejimaha & System</option>
                  <option value="students">Ardayda</option>
                  <option value="teachers">Macallimiinta</option>
                  <option value="payments">Maaliyadda</option>
                  <option value="attendance">Xaadiriska</option>
                  <option value="exams">Imtixaanaadka</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faahfaahinta (Details) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Geli faahfaahinta ku saabsan shaqada aad qabatay..."
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  <span>Keydi Log-ga</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

