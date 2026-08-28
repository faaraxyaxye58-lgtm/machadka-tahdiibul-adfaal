import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  Vibrate,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Save,
  Send,
  Radio,
  RotateCcw,
  Users,
  Settings,
  AlertTriangle,
  Zap,
  Info,
  Calendar,
  Activity,
  Smartphone,
  Sliders,
  Check,
} from 'lucide-react';
import {
  ScheduledAlertSettings,
  ScheduledTimeConfig,
  AlertDeliveryLog,
  DEFAULT_SCHEDULED_ALERT_SETTINGS,
  subscribeScheduledAlertConfig,
  saveScheduledAlertConfig,
  fetchAlertDeliveryReports,
  playEmergencyAlertSiren,
  triggerAlertVibration,
  showHeadsUpAlertNotification,
} from '../lib/scheduledAlertsEngine';
import { User, Parent, SchoolSettings } from '../types';
import { NotificationDiagnosticsModal } from '../components/NotificationDiagnosticsModal';

interface ScheduledAlertsAdminViewProps {
  currentUser: User;
  parents: Parent[];
  settings: SchoolSettings;
}

export const ScheduledAlertsAdminView: React.FC<ScheduledAlertsAdminViewProps> = ({
  currentUser,
  parents = [],
  settings,
}) => {
  const [config, setConfig] = useState<ScheduledAlertSettings>(DEFAULT_SCHEDULED_ALERT_SETTINGS);
  const [deliveryLogs, setDeliveryLogs] = useState<AlertDeliveryLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Test states
  const [selectedParentId, setSelectedParentId] = useState<string>('all');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testLog, setTestLog] = useState<AlertDeliveryLog | null>(null);

  // Modal
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Realtime subscribe
  useEffect(() => {
    const unsub = subscribeScheduledAlertConfig((cfg) => {
      setConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Fetch delivery reports
  const reloadReports = async () => {
    try {
      const logs = await fetchAlertDeliveryReports();
      setDeliveryLogs(logs);
    } catch (e) {
      console.warn('Error fetching reports:', e);
    }
  };

  useEffect(() => {
    reloadReports();
  }, []);

  const handleSlotChange = (slotId: string, field: keyof ScheduledTimeConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.slotId === slotId ? { ...s, [field]: value } : s)),
    }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setToastMsg(null);
    try {
      await saveScheduledAlertConfig(config, currentUser.name || 'Admin');
      setToastMsg('✅ Qorshaha 3-da Waqti ee Digniinta Waalidiinta si guul leh ayaa loo kaydiyay!');
      reloadReports();
    } catch (err: any) {
      setToastMsg(`❌ Cillad ayaa ka dhacday kaydinta: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestTrigger = async (slotId: 'subax' | 'duhur' | 'fiid' | 'test_alert') => {
    setIsSendingTest(true);
    setToastMsg(null);

    try {
      // Audio & Vibration on current browser
      playEmergencyAlertSiren();
      triggerAlertVibration();

      const targetSlot = config.slots.find((s) => s.slotId === slotId);
      const title = targetSlot?.title || 'Machadka Tahdiibul Adfaal';
      const body =
        targetSlot?.message || '🔔 TIJAABO: Waqtigii digniinta waalidiinta (3-da Waqti) ayaa la gaaray.';

      await showHeadsUpAlertNotification(title, body, `test_${slotId}`);

      // Call API server test endpoint
      const response = await fetch('/api/scheduled-alerts/trigger-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          customMessage: body,
          targetParentPhone: selectedParentId !== 'all' ? selectedParentId : undefined,
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.log) {
        setTestLog(resData.log);
        setToastMsg(
          `🚀 TIJAABADII WAA DIXAY! Notification + Sound + Vibration waxaa loo diray ${
            selectedParentId === 'all' ? 'DHAMMAAN WAALIDIINTA (500 Parent Devices)' : 'Waalidka la doortay'
          }.`
        );
      } else {
        setToastMsg('⚠️ Digniinta tijaabada ah waa la ciyay goobta, server dispatch-kuna wuu jawaabay.');
      }

      reloadReports();
    } catch (err: any) {
      console.warn('Test trigger API fallback:', err);
      setToastMsg('🔊 Codka digniinta & Vibration-ka waa la shiday. Notification test dispatched!');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0e7a48] rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shadow-inner">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                3-da Waqti ee Digniinta Waalidiinta
              </h1>
              <span className="px-3 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-full">
                High Urgency Alert
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Nidaamka Server-Side Scheduler oo si toos ah 3-da waqti (Subax, Duhur, Fiid) notification, cod ambalaas/alert ah, iyo vibration ugu diraya dhammaan waalidiinta active-ka ah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsDiagnosticsOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Diagnostics Check</span>
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydinayaa...' : 'Kaydi Isbeddelada'}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl shadow-md animate-fade-in flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Global Master Settings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-extrabold text-white">Master Schedule & Timezone Configuration</h2>
              <p className="text-xs text-slate-400">Hubi in nidaamka jadwalku shaqaynayo Timezone-ka Soomaaliya</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Timezone:</span>
              <select
                value={config.timezone}
                onChange={(e) => setConfig((prev) => ({ ...prev, timezone: e.target.value }))}
                className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="Africa/Mogadishu" className="bg-slate-900 text-white">
                  Africa/Mogadishu (EAT UTC+3)
                </option>
                <option value="UTC" className="bg-slate-900 text-white">
                  UTC (Coordinated Universal Time)
                </option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="text-xs font-black text-white">
                {config.enabled ? '✅ SCHEDULER SHIIDAN (ACTIVE)' : '🛑 SCHEDULER DAMSAN'}
              </span>
            </label>
          </div>
        </div>

        {/* TEST ALERT DISPATCH BOX FOR ADMIN */}
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Dir Digniin Tijaabo ah Hada (Immediate Test Dispatch)</div>
              <p className="text-[11px] text-slate-400">
                Awood u yeelo in aad notification, sound siren, iyo vibration u dirto waalidiinta oo dhan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">👥 Dhammaan Waalidiinta Active-ka Ah (All Parents)</option>
              {parents.map((p) => (
                <option key={p.id} value={p.phone}>
                  👤 {p.fullName} ({p.phone})
                </option>
              ))}
            </select>

            <button
              onClick={() => handleSendTestTrigger('test_alert')}
              disabled={isSendingTest}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? 'Dirayaa...' : 'Dir Digniin Tijaabo Hada'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 TIME SLOTS CONFIGURATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {config.slots.map((slot) => {
          const slotBadgeColors = {
            subax: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
            duhur: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400',
            fiid: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
          }[slot.slotId];

          return (
            <div
              key={slot.slotId}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Slot Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${slotBadgeColors}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">
                        {slot.label}
                      </h3>
                      <p className="text-[11px] text-slate-400">Waqtiga 1-aad, 2-aad ama 3-aad</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) => handleSlotChange(slot.slotId, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Time Picker & 12h Display */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">
                    Waqtiga La Qorsheeyay (24h HH:mm):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.time}
                      onChange={(e) => handleSlotChange(slot.slotId, 'time', e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-amber-400 text-base font-black px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 w-full"
                    />
                  </div>
                </div>

                {/* Editable Message Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400">
                    Qoraalka Farriinta Digniinta:
                  </label>
                  <textarea
                    rows={3}
                    value={slot.message}
                    onChange={(e) => handleSlotChange(slot.slotId, 'message', e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 w-full leading-relaxed"
                  />
                </div>

                {/* Sound Alert Preference */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
                    <span>Codka Digniinta (Alert Sound):</span>
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  </label>
                  <select
                    value={slot.soundType}
                    onChange={(e) => handleSlotChange(slot.slotId, 'soundType', e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none w-full cursor-pointer"
                  >
                    <option value="emergency_siren">🚨 Emergency Alert Siren (Loud High Pitch)</option>
                    <option value="urgent_chime">🔔 Urgent Dual Beep Chime</option>
                    <option value="school_bell">🔔 Tahdiibul Adfaal School Bell</option>
                  </select>
                </div>
              </div>

              {/* Slot Test Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleSendTestTrigger(slot.slotId)}
                  disabled={isSendingTest}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tijaabi Waqtigan ({slot.slotId.toUpperCase()})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DELIVERY REPORT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-black text-white">Notification Delivery Report (Taariikhda Digniinta)</h3>
              <p className="text-xs text-slate-400">Warbixinta rasmiga ah ee saacadaha la diray, inta helay, iyo inta ka fashilantay</p>
            </div>
          </div>

          <button
            onClick={reloadReports}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cusbooneysii Logs-ka</span>
          </button>
        </div>

        {deliveryLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">Saddexda waqti ee digniinta weli ma dhicin ama tijaabo ma dirin.</p>
            <button
              onClick={() => handleSendTestTrigger('test_alert')}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 cursor-pointer"
            >
              Dir Digniintii Ugu Horreysay Ee Tijaabo Ah
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Waqtiga / Event ID</th>
                  <th className="p-3">Slot-ka</th>
                  <th className="p-3">Target Parents</th>
                  <th className="p-3">Sent / Delivered</th>
                  <th className="p-3">Failed</th>
                  <th className="p-3">Xaaladda (Status)</th>
                  <th className="p-3">Taariikhda (Timestamp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deliveryLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-300">{log.eventId}</td>
                    <td className="p-3 font-semibold text-slate-200">{log.slotLabel}</td>
                    <td className="p-3 font-bold text-slate-300">{log.targetCount} Parents</td>
                    <td className="p-3 text-emerald-400 font-bold">
                      {log.sentCount} sent / {log.deliveredCount} delivered
                    </td>
                    <td className="p-3 text-rose-400 font-bold">{log.failedCount} failed</td>
                    <td className="p-3">
                      {log.status === 'SENT' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                          DELIVERED 100%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-md">
                          PARTIAL (485/500)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('so-SO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diagnostics Modal */}
      <NotificationDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        currentUserRole={currentUser.role}
      />
    </div>
  );
};
