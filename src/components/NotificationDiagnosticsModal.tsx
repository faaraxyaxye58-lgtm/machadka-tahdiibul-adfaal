import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Volume2,
  Vibrate,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  Radio,
  Zap,
  Info,
  Sliders,
} from 'lucide-react';
import {
  NotificationDiagnosticsResult,
  runNotificationDiagnostics,
  playEmergencyAlertSiren,
  triggerAlertVibration,
  showHeadsUpAlertNotification,
} from '../lib/scheduledAlertsEngine';
import { SomaliVoiceAlertManager } from '../lib/SomaliVoiceAlertManager';

interface NotificationDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
}

export const NotificationDiagnosticsModal: React.FC<NotificationDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'parent',
}) => {
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnosticsResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setTestResultMsg(null);
    try {
      const res = await runNotificationDiagnostics();
      setDiagnostics(res);
    } catch (e) {
      console.error('Error running diagnostics:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleRunDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAlertImmediate = async () => {
    playEmergencyAlertSiren();
    triggerAlertVibration();

    await SomaliVoiceAlertManager.playSomaliMaleVoice({
      slotId: 'subax',
    });

    const ok = await showHeadsUpAlertNotification(
      'Machadka Tahdiibul Adfaal',
      '🔔 TIJAABO: Codka nin Soomaali ah, sireen-ka, vibration-ka, iyo banner-ku waa shaqaynayaan!',
      'tahdiib-diagnostic-test'
    );

    if (ok) {
      setTestResultMsg('✅ Digniinta tijaabada ah waxay si guul leh ugu dhacday telefoonkaaga (Somali Male Voice + Sound + Vibration + Banner)!');
    } else {
      setTestResultMsg('⚠️ Codka nin Soomaali ah iyo vibration-ka waa lagu dhawaaqay. Fadlan oggolow Notifications-ka.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0e7a48] p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Notification Diagnostics</span>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] rounded-full">
                  High Importance Channel
                </span>
              </h2>
              <p className="text-xs text-slate-300">Hubinta Digniinta Codka Leh, Vibration-ka & Server Scheduler-ka</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* IMMEDIATE TEST ALERT BUTTON CARD */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-emerald-500/10 border-2 border-amber-500/30 text-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>TIJAABI DIGNIINTA (TEST ALERT)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Riix badhankan si aad goobta ugu tijaabiso Codka Digniinta (High Pitch Siren), Vibration-ka, iyo Banner-ka.
                </p>
              </div>

              <button
                onClick={handleTestAlertImmediate}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-amber-300"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>🔊 TIJAABI DIGNIINTA HADA</span>
              </button>
            </div>

            {testResultMsg && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 text-xs text-amber-200 font-medium animate-fade-in">
                {testResultMsg}
              </div>
            )}
          </div>

          {/* DIAGNOSTICS SUMMARY HEADLINE */}
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  diagnostics?.overallStatus === 'PASS'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {diagnostics?.overallStatus === 'PASS' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Xaaladda Nidaamka Telefoonkaaga:</div>
                <div
                  className={`text-base font-black ${
                    diagnostics?.overallStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {diagnostics?.overallStatus === 'PASS'
                    ? '100% READY — Digniintu waxay shaqaynaysaa si buuxda'
                    : 'ATTENTION REQUIRED — Waxaa jira oggolaansho u baahan in la shido'}
                </div>
              </div>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={isRunning}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Hubinayaa...' : 'Eeg Hada'}</span>
            </button>
          </div>

          {/* DIAGNOSTICS CHECKLIST */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Checklist-ka Nidaamka (Somali Audio & Android Diagnostics Verification)
            </h4>

            {[
              {
                key: 'somaliVoiceAsset',
                label: '1. Somali Audio Asset (alert_breakfast_so.mp3)',
                status: diagnostics?.somaliVoiceAsset,
                desc: diagnostics?.details.somaliVoiceAsset,
                fixInstruction: 'Assets-ka MP3/WAV waxay ku jiraan gudaha PWA/Android package-ka.',
              },
              {
                key: 'audioPlayback',
                label: '2. Audio Playback (Somali Male Voice Engine)',
                status: diagnostics?.audioPlayback,
                desc: diagnostics?.details.audioPlayback,
                fixInstruction: 'Hubi in HTML5 Audio & Web Audio API ay shaqaynayaan.',
              },
              {
                key: 'notificationPermission',
                label: '3. Notification Permission (Oggolaanshaha Banner-ka)',
                status: diagnostics?.notificationPermission,
                desc: diagnostics?.details.notificationPermission,
                fixInstruction: 'Ka shid Oggolaanshaha Notifications-ka browser-ka ama App Settings-ka Android.',
              },
              {
                key: 'notificationChannel',
                label: '4. Notification Channel (Tahdiibul Adfaal Alert Channel)',
                status: diagnostics?.notificationChannel,
                desc: diagnostics?.details.notificationChannel,
                fixInstruction: 'Channel-ka digniinta rasmiga ah wuxuu ku tirtiran yahay nidaamka.',
              },
              {
                key: 'soundCapability',
                label: '5. Alarm Capability & Custom Siren Sound',
                status: diagnostics?.soundCapability,
                desc: diagnostics?.details.soundCapability,
                fixInstruction: 'Hubi inuu shaqaynayo Alarm Manager / Web Audio API Synthesizer.',
              },
              {
                key: 'backgroundService',
                label: '6. Background Service Worker & Web Push Engine',
                status: diagnostics?.backgroundService,
                desc: diagnostics?.details.backgroundService,
                fixInstruction: 'ServiceWorker wuxuu ku jiri karaa background maadaama app-ku PWA yahay.',
              },
              {
                key: 'batteryOptimization',
                label: '7. Battery Optimization (Android Power Saver)',
                status: diagnostics?.batteryOptimization || 'WARNING',
                desc: diagnostics?.details.batteryOptimization,
                fixInstruction: 'Ka saar App-ka Tahdiibul Adfaal Battery Saver-ka Android.',
              },
              {
                key: 'lockScreenNotification',
                label: '8. Lock Screen Notification',
                status: diagnostics?.lockScreenNotification || 'PASS',
                desc: diagnostics?.details.lockScreenNotification,
                fixInstruction: 'Shid Lock Screen Notifications ee Android App Settings.',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                  {item.status === 'FAIL' && (
                    <div className="mt-1.5 p-2 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-lg text-[11px]">
                      💡 <strong>Sida loo saxo:</strong> {item.fixInstruction}
                    </div>
                  )}
                  {item.status === 'WARNING' && (
                    <div className="mt-1.5 p-2 bg-amber-950/40 border border-amber-800/40 text-amber-300 rounded-lg text-[11px]">
                      💡 <strong>Talo:</strong> {item.fixInstruction}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {item.status === 'PASS' ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[10px] rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PASS</span>
                    </span>
                  ) : item.status === 'WARNING' ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[10px] rounded-lg flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>WARNING</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black text-[10px] rounded-lg flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>FAIL</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ANDROID RESTRICTIONS & TROUBLESHOOTING CARD */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Farriin Ku Saabsan Xayiraadaha Android & Silent Mode:</span>
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                <strong>Silent Mode & Do Not Disturb:</strong> Haddii telefoonku ku jiro Silent ama Do Not Disturb, Android wuxuu xannibayaa codka dibada ka yimaada ilaa aad App-ka Tahdiibul Adfaal uga dhigto <em>"Override Do Not Disturb"</em>.
              </li>
              <li>
                <strong>Battery Optimization (App Power Saver):</strong> Qaar ka mid ah telefoonada Android (Samsung/Xiaomi) waxay background-ka ka damiyaan apps-ka marka shaashadu xirantaa. Fadlan ka saar Battery Optimization.
              </li>
              <li>
                <strong>Notification Volume:</strong> Hubi in Volume-ka saacada/digniinta (Ringer & Notification Volume) uu sare u kashifay.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Waad Mahadsan tahay (Xir)
          </button>
        </div>
      </div>
    </div>
  );
};
