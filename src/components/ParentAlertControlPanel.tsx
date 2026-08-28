import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Vibrate,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Smartphone,
  Zap,
  Sliders,
  AlertTriangle,
  Activity,
  Check,
} from 'lucide-react';
import {
  ParentAlertPreferences,
  ScheduledAlertSettings,
  DEFAULT_PARENT_ALERT_PREFERENCES,
  DEFAULT_SCHEDULED_ALERT_SETTINGS,
  subscribeParentAlertPreferences,
  saveParentAlertPreferences,
  subscribeScheduledAlertConfig,
  playEmergencyAlertSiren,
  triggerAlertVibration,
  showHeadsUpAlertNotification,
  syncScheduledAlertsWithServiceWorker,
} from '../lib/scheduledAlertsEngine';
import { User } from '../types';
import { NotificationDiagnosticsModal } from './NotificationDiagnosticsModal';
import { SomaliVoiceAlertManager } from '../lib/SomaliVoiceAlertManager';
import { Mic, Radio } from 'lucide-react';

interface ParentAlertControlPanelProps {
  currentUser: User;
  onOpenAdminVoiceModal?: () => void;
}

export const ParentAlertControlPanel: React.FC<ParentAlertControlPanelProps> = ({
  currentUser,
  onOpenAdminVoiceModal,
}) => {
  const parentIdOrPhone = currentUser?.phone || currentUser?.id || 'default_parent';

  const [prefs, setPrefs] = useState<ParentAlertPreferences>(() =>
    DEFAULT_PARENT_ALERT_PREFERENCES
  );
  const [config, setConfig] = useState<ScheduledAlertSettings>(
    DEFAULT_SCHEDULED_ALERT_SETTINGS
  );
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTestingSound, setIsTestingSound] = useState(false);

  // Subscribe to Parent Alert Preferences
  useEffect(() => {
    const unsub = subscribeParentAlertPreferences(parentIdOrPhone, (p) => {
      setPrefs(p);
    });
    return () => unsub();
  }, [parentIdOrPhone]);

  // Subscribe to Master Scheduled Alert Config (3 Times: Subax, Duhur, Fiid)
  useEffect(() => {
    const unsub = subscribeScheduledAlertConfig((cfg) => {
      setConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Sync Service Worker Background Local Notification Scheduler
  useEffect(() => {
    if (config?.slots) {
      syncScheduledAlertsWithServiceWorker(
        config.slots,
        prefs.alertsEnabled && config.enabled
      );
    }
  }, [config, prefs.alertsEnabled]);

  // Update Notification Permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Primary Action: One-Touch Activation
  const handleToggleActivation = async () => {
    setToastMsg(null);
    const newStatus = !prefs.alertsEnabled;

    if (newStatus && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        try {
          const res = await Notification.requestPermission();
          setPermissionState(res);
          if (res !== 'granted') {
            setToastMsg('⚠️ Fadlan oggolow ogeysiisyada (Notifications) si digniintu u dhawaaqdo.');
          }
        } catch (e) {
          console.warn('Permission request error:', e);
        }
      }
    }

    const updated: ParentAlertPreferences = {
      ...prefs,
      alertsEnabled: newStatus,
      parentIdOrPhone,
    };

    setPrefs(updated);
    await saveParentAlertPreferences(updated);

    if (newStatus) {
      // Test sound & vibration brief chime on activation confirmation
      if (prefs.soundEnabled) playEmergencyAlertSiren();
      if (prefs.vibrationEnabled) triggerAlertVibration();

      setToastMsg('🟢 DIGNIINTA WAA HAWLGELIYAY! 3-da waqti (Subax, Duhur, Fiid) si otomaatig ah ayay u dhawaaqayaan.');
    } else {
      setToastMsg('🛑 Digniintii 3-da waqti waa la damiyay.');
    }
  };

  // Toggle individual setting
  const handleUpdatePrefField = async (field: keyof ParentAlertPreferences, value: any) => {
    const updated = { ...prefs, [field]: value, parentIdOrPhone };
    setPrefs(updated);
    await saveParentAlertPreferences(updated);
  };

  // Test Somali Voice Only Button
  const handleTestSomaliVoiceOnly = async () => {
    setIsTestingSound(true);
    setToastMsg(null);

    await SomaliVoiceAlertManager.playSomaliMaleVoice({
      slotId: 'subax',
    });

    setToastMsg("🔊 CODKA SOOMAALIGA WAA LA TIJAABIYAY: «Digniin! Digniin! Waalidow, waxaa la gaaray xilligii quraacda ee Machadka Tahdiibul Adfaal...»");
    setTimeout(() => setIsTestingSound(false), 1200);
  };

  // Test Full System Alert Button
  const handleTestFullSystem = async () => {
    setIsTestingSound(true);
    setToastMsg(null);

    triggerAlertVibration();
    playEmergencyAlertSiren();

    await SomaliVoiceAlertManager.playSomaliMaleVoice({
      slotId: 'subax',
    });

    const ok = await showHeadsUpAlertNotification(
      'Machadka Tahdiibul Adfaal',
      '🔔 TIJAABO DIGNIINTA OO DHAN: Notification + Vibration + Somali Male Voice + Buttons + Channel Waa Shaqaynayaan!',
      'tahdiib-test-full'
    );

    if (ok) {
      setToastMsg('🔔 DIGNIINTA OO DHAN WAA LA TIJAABIYAY! Notification + Vibration + Somali Male Voice + Buttons waa 100% active!');
    } else {
      setToastMsg('🔊 Codka Soomaaliga, sireen-ka, iyo vibration-ka waa la tijaabiyay! Fadlan oggolow Notifications-ka if banner was blocked.');
    }

    setTimeout(() => setIsTestingSound(false), 1500);
  };

  // Auto Timer Runner for Client-side Check
  useEffect(() => {
    if (!prefs.alertsEnabled || !config.enabled) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      config.slots.forEach((slot) => {
        if (slot.enabled && slot.time === currentHHmm) {
          const triggeredKey = `tahdiib_alert_triggered_${slot.slotId}_${todayStr}`;
          if (!localStorage.getItem(triggeredKey)) {
            localStorage.setItem(triggeredKey, 'true');

            if (prefs.soundEnabled) playEmergencyAlertSiren();
            if (prefs.vibrationEnabled) triggerAlertVibration();

            showHeadsUpAlertNotification(slot.title || 'Machadka Tahdiibul Adfaal', slot.message, slot.slotId);
          }
        }
      });
    }, 25000); // Check every 25 seconds

    return () => clearInterval(intervalId);
  }, [prefs, config]);

  const isFullyActive = prefs.alertsEnabled && config.enabled && permissionState === 'granted';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3.5 rounded-2xl border ${
              isFullyActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-950/50 shadow-inner'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}
          >
            <Bell className={`w-7 h-7 ${isFullyActive ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Digniinta 3-da Waqti (Subax, Duhur & Fiid)
              </h3>
              {isFullyActive ? (
                <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>🟢 Digniintu way shaqaynaysaa</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[10px] rounded-full uppercase tracking-wider">
                  🔴 Digniintu ma shaqaynayso
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Digniinta 3-da waqti waxay waalidka si toos ah ugu soo xasuusinaysaa xifdiga Qur'aanka, xaadiriska, iyo jadwalka ubadka.
            </p>
          </div>
        </div>

        {/* Diagnostics Modal Button */}
        <button
          onClick={() => setIsDiagnosticsOpen(true)}
          className="self-start sm:self-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Diagnostics Check</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMsg && (
        <div className="p-3.5 bg-slate-950 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl shadow-md flex items-center justify-between gap-2 animate-fade-in">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* DEDICATED ADMIN AI VOICE BROADCAST CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 border-2 border-emerald-500/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
              MAAMULAHA KELIYA (ADMIN ONLY)
            </span>
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>Somali AI Voice Message</span>
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-black text-white">
            🎙️ Dir Fariin Cod ah oo AI Soomaali ah (Machadka Tahdiibul Adfaal)
          </h4>
          <p className="text-[11px] text-slate-300 max-w-lg leading-relaxed">
            {currentUser?.role === 'admin'
              ? 'Maamule ahaan, waxaad fariin cod ah oo AI Soomaali ah toos ugu diri kartaa telefoonada waalidiinta.'
              : 'ℹ️ Maamulaha (Admin) oo keliya ayaa awood u leh inuu u soo diro fariin cod ah waalidiinta.'}
          </p>
        </div>

        {currentUser?.role === 'admin' ? (
          <button
            onClick={onOpenAdminVoiceModal}
            className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300 shrink-0"
          >
            <Mic className="w-4 h-4 text-slate-950" />
            <span>🎙️ SOO DIR FARIIN COD AH</span>
          </button>
        ) : (
          <div className="px-4 py-2 bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-bold rounded-xl shrink-0">
            🔒 Maamulaha Keliya
          </div>
        )}
      </div>

      {/* Permission Required Banner (If Notification Permission is Denied/Default) */}
      {permissionState !== 'granted' && (
        <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ Oggolaanshaha Ogeysiisyada (Notification Permission) Waa Maqan Yahay</span>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-relaxed">
            Si codka digniinta iyo vibration-ku ay u dhawaaqaan marka 3-da waqti la gaaro, fadlan oggolow ogeysiisyada browser-ka ama telefoonkaaga.
          </p>
          <button
            onClick={async () => {
              if (typeof window !== 'undefined' && 'Notification' in window) {
                const res = await Notification.requestPermission();
                setPermissionState(res);
              }
            }}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95"
          >
            Oggolow Notifications Hada
          </button>
        </div>
      )}

      {/* MAIN ONE-TOUCH ACTIVATION BUTTON */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Status-ka Waalidka (Parent Status):
          </div>
          <div className="text-sm sm:text-base font-black text-white flex items-center justify-center sm:justify-start gap-2">
            {prefs.alertsEnabled ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>🟢 DIGNIINTA WAA HAWL (ACTIVE)</span>
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>🔴 DIGNIINTU MA SHAQAYNAYSO (INACTIVE)</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {prefs.alertsEnabled
              ? 'Waalidku hal mar ayuu hawlgeliyay. Nidaamku iskii ayuu 3-da waqti u dhawaaqayaa.'
              : 'Guji batoonka dahabiga ah si aad u shido digniinta automatic-ka ah.'}
          </p>
        </div>

        {/* Big Activation Toggle Button */}
        <button
          onClick={handleToggleActivation}
          className={`w-full sm:w-auto py-3.5 px-6 font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
            prefs.alertsEnabled
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-950/50'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-amber-950/50 animate-pulse'
          }`}
        >
          {prefs.alertsEnabled ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[3]" />
              <span>🟢 DIGNIINTA WAA HAWL</span>
            </>
          ) : (
            <>
              <Bell className="w-5 h-5 text-slate-950" />
              <span>🔔 HAWLGELI 3-DA DIGNIIN</span>
            </>
          )}
        </button>
      </div>

      {/* 3 ACTIVE TIME SLOTS DISPLAY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {config.slots.map((slot) => {
          const slotBadges = {
            subax: { color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400', name: '🌅 Subax' },
            duhur: { color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400', name: '☀️ Duhur' },
            fiid: { color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400', name: '🌙 Fiid' },
          }[slot.slotId];

          return (
            <div
              key={slot.slotId}
              className={`p-3.5 rounded-2xl bg-gradient-to-br border ${slotBadges.color} flex items-center justify-between gap-2`}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-black tracking-wider block opacity-80">
                  {slotBadges.name}
                </span>
                <span className="text-sm font-black text-white font-mono block">
                  {slot.formatted12h || slot.time}
                </span>
              </div>
              <div className="p-2 bg-slate-950/50 rounded-xl border border-white/10 text-xs font-extrabold">
                {slot.enabled && prefs.alertsEnabled ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ON</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">OFF</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ALERT SETTINGS CONTROLS & TEST BUTTON */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
              Alert Settings (Gudaha App-ka)
            </h4>
          </div>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
          >
            {showSettingsDrawer ? 'Qari Settings' : 'Muuji Settings'}
          </button>
        </div>

        {/* Inline Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Toggle 1: 3-da Waqti */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <span className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>🔔 3-da Waqti</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.alertsEnabled}
              onChange={(e) => handleUpdatePrefField('alertsEnabled', e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          {/* Toggle 2: Codka (Sound) */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <span className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>🔊 Codka (Sound)</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.soundEnabled}
              onChange={(e) => handleUpdatePrefField('soundEnabled', e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          {/* Toggle 3: Vibration */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <span className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-purple-400" />
              <span>📳 Vibration</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.vibrationEnabled}
              onChange={(e) => handleUpdatePrefField('vibrationEnabled', e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* TWO DEDICATED TEST BUTTONS (SOMALI VOICE & FULL SYSTEM) */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tijaabinta Digniinta & Codka Soomaaliga:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Button 1: Somali Voice Only */}
            <button
              onClick={handleTestSomaliVoiceOnly}
              disabled={isTestingSound}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-emerald-300"
            >
              <Volume2 className="w-4 h-4 text-slate-950 shrink-0" />
              <span>{isTestingSound ? 'Codka Soomaaliga Waa Dhawaaqayaa...' : '🔊 TIJAABI CODKA SOOMAALIGA'}</span>
            </button>

            {/* Button 2: Full System Alert */}
            <button
              onClick={handleTestFullSystem}
              disabled={isTestingSound}
              className="px-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-amber-300"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950 shrink-0" />
              <span>{isTestingSound ? 'Digniinta Oo Dhan Wey Dhawaaqaysaa...' : '🔔 TIJAABI DIGNIINTA OO DHAN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics Modal */}
      <NotificationDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
};
