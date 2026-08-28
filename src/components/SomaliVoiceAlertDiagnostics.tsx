import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SomaliVoiceAlertManager } from '../lib/SomaliVoiceAlertManager';
import { sendPushNotificationToFirestore } from '../lib/firebase';
import {
  Mic,
  Volume2,
  Vibrate,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Play,
  Square,
  Sparkles,
  Terminal,
  Activity,
  Trash2,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SomaliVoiceAlertDiagnosticsProps {
  currentUser?: User | null;
  onOpenAdminVoiceModal?: () => void;
}

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export const SomaliVoiceAlertDiagnostics: React.FC<SomaliVoiceAlertDiagnosticsProps> = ({
  currentUser,
  onOpenAdminVoiceModal,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeSlotTesting, setActiveSlotTesting] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [hasVibrationSupport, setHasVibrationSupport] = useState<boolean>(false);
  const [audioCtxState, setAudioCtxState] = useState<string>('unknown');

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        time: timeStr,
        type,
        message,
      },
      ...prev.slice(0, 49), // Keep latest 50 logs
    ]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check vibration support
      const supportsVib = 'vibrate' in navigator;
      setHasVibrationSupport(supportsVib);

      // Check Notification Permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      // Check AudioContext
      try {
        const ctx = SomaliVoiceAlertManager.claimAudioFocus();
        if (ctx) {
          setAudioCtxState(ctx.state);
        }
      } catch (e) {
        setAudioCtxState('unavailable');
      }

      addLog('System Diagnostics Initialized: Somali Voice Alert Manager ready.', 'info');
    }
  }, []);

  // Request Browser Notification Permission
  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addLog('Browser notification API is not supported in this environment.', 'warn');
      return;
    }

    try {
      addLog('Requesting browser push notification permission...', 'info');
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        addLog('Notification permission GRANTED by browser!', 'success');
        new Notification('Tahdiibul Adfaal - System Test', {
          body: 'Ogeysiisyada webka ee Machadka Tahdiibul Adfaal waa la kiciyay!',
          icon: '/icon.png',
        });
      } else {
        addLog(`Notification permission status: ${permission}`, 'warn');
      }
    } catch (err: any) {
      addLog(`Failed to request notification permission: ${err?.message || err}`, 'error');
    }
  };

  // Test Audio Playback
  const handleTestAudioPlayback = async (slotId: 'subax' | 'duhur' | 'fiid' | 'custom') => {
    setIsPlayingAudio(true);
    setActiveSlotTesting(slotId);

    const labels: Record<string, string> = {
      subax: '🌅 Quraacda (07:00 AM)',
      duhur: '☀️ Qadada (01:00 PM)',
      fiid: '🌙 Fasaxa Galabnimo (07:00 PM)',
      custom: '🗣️ Custom Voice Alert Message',
    };

    addLog(`Testing audio playback for: ${labels[slotId]}...`, 'info');

    try {
      const customText =
        slotId === 'custom'
          ? 'Digniin! Digniin! Maamulka Machadka Tahdiibul Adfaal wuxuu idin ogeysiinayaa in dhammaan ubadku ay u diyaar garoobaan xifdiga Qur\'aanka.'
          : undefined;

      const success = await SomaliVoiceAlertManager.playSomaliMaleVoice({
        slotId: slotId !== 'custom' ? slotId : undefined,
        customText,
        onEnded: () => {
          addLog(`Audio playback finished successfully for ${labels[slotId]}.`, 'success');
          setIsPlayingAudio(false);
          setActiveSlotTesting(null);
        },
        onError: (err) => {
          addLog(`Audio playback encountered error: ${err?.message || err}`, 'error');
          setIsPlayingAudio(false);
          setActiveSlotTesting(null);
        },
      });

      if (success) {
        addLog(`Somali voice playback triggered successfully for ${labels[slotId]}.`, 'success');
      } else {
        addLog(`Playback returned fallback or was blocked by duplicate guard.`, 'warn');
      }
    } catch (err: any) {
      addLog(`Cilad ayaa ka dhacday ciyaarista codka: ${err?.message || err}`, 'error');
    } finally {
      setTimeout(() => {
        setIsPlayingAudio(false);
        setActiveSlotTesting(null);
      }, 1500);
    }
  };

  // Stop Audio Playback
  const handleStopAudio = () => {
    SomaliVoiceAlertManager.stopCurrentAudio();
    setIsPlayingAudio(false);
    setActiveSlotTesting(null);
    addLog('Audio playback stopped manually.', 'warn');
  };

  // Test Vibration Pattern
  const handleTestVibration = (pattern: number[], patternName: string) => {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) {
      addLog(`Vibration API not supported on this browser/device (${patternName}).`, 'warn');
      return;
    }

    try {
      const success = navigator.vibrate(pattern);
      if (success) {
        addLog(`📳 Vibration pattern triggered: ${patternName} [${pattern.join(', ')} ms]`, 'success');
      } else {
        addLog(`Vibration pattern rejected by device hardware settings.`, 'warn');
      }
    } catch (err: any) {
      addLog(`Error triggering vibration: ${err?.message || err}`, 'error');
    }
  };

  // Stop Vibration
  const handleStopVibration = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(0);
      addLog('Vibration stopped manually.', 'info');
    }
  };

  // Test Web Push Notification Trigger
  const handleTestPushNotificationTrigger = async () => {
    addLog('Triggering test push notification to Firestore...', 'info');
    try {
      const testNotification = {
        id: `diagnostic-test-${Date.now()}`,
        title: '🎙️ Diagnostic Test - Machadka Tahdiibul Adfaal',
        message: 'Kani waa tijaabada Ogeysiiska Codka ah ee Machadka Tahdiibul Adfaal.',
        senderName: currentUser?.name || 'Admin Diagnostic System',
        senderRole: 'admin' as const,
        targetAudience: 'all' as const,
        priority: 'urgent' as const,
        createdAt: new Date().toISOString(),
        active: true,
        readByUsers: [],
      };

      await sendPushNotificationToFirestore(testNotification);
      addLog('🚀 Push notification broadcasted to Firestore successfully! Parent devices will receive voice alert overlay.', 'success');

      // Also trigger browser native notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(testNotification.title, {
          body: testNotification.message,
          icon: '/icon.png',
        });
      }
    } catch (err: any) {
      addLog(`Failed to send test push notification: ${err?.message || err}`, 'error');
    }
  };

  // Test Simultaneous Combo Alert
  const handleTestComboAlert = async () => {
    addLog('⚡ Executing Combo Diagnostic Alert (Vibration + Somali Voice Audio + Notification)...', 'info');

    // 1. Vibration
    handleTestVibration([300, 100, 300, 100, 500], 'Combo Alert Rhythm');

    // 2. Audio
    handleTestAudioPlayback('subax');

    // 3. Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🎙️ Tahdiibul Adfaal Combo Alert Test', {
        body: 'Digniin! Quraacda Machadka Tahdiibul Adfaal waa la tijaabiyay!',
      });
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-6 my-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shadow-inner shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                Admin Diagnostics
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                <span>Somali Voice Alert Integration</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              🎙️ Diagnostic Section: Somali Voice Alert & Notification System
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Baaritaanka iyo tijaabinta ciyaarista codadka Soomaaliga ah, ruxmada (vibration), iyo ogeysiisyada maamulka.
            </p>
          </div>
        </div>

        {onOpenAdminVoiceModal && (
          <button
            onClick={onOpenAdminVoiceModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300 shrink-0"
          >
            <Mic className="w-4 h-4 text-slate-950" />
            <span>Fura Modal-ka Fariinta Codka</span>
          </button>
        )}
      </div>

      {/* System Status Indicators Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* AudioContext Status */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Audio Context</div>
              <div className="text-xs font-black text-white capitalize">{audioCtxState}</div>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              audioCtxState === 'running' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
        </div>

        {/* Vibration Support Status */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Vibrate className="w-4 h-4 text-teal-400" />
            <div>
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Hardware Vibration</div>
              <div className="text-xs font-black text-white">
                {hasVibrationSupport ? 'Supported' : 'Not Supported / Desktop'}
              </div>
            </div>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${hasVibrationSupport ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        </div>

        {/* Notification Permission Status */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Web Push Permission</div>
              <div className="text-xs font-black text-white capitalize">{notificationPermission}</div>
            </div>
          </div>
          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestNotificationPermission}
              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded-lg cursor-pointer"
            >
              Enable
            </button>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Audio Playback Functionality */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>1. Audio Playback Tests</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Somali Male MP3</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-normal">
            Tijaabi ciyaarista rasmiga ah ee faylasha MP3-ga Soomaaliga ah ee maamulka Tahdiibul Adfaal:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isPlayingAudio}
              onClick={() => handleTestAudioPlayback('subax')}
              className={`w-full py-2.5 px-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSlotTesting === 'subax'
                  ? 'bg-emerald-950 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>🌅 Quraacda (07:00 AM)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">alert_breakfast_so.mp3</span>
            </button>

            <button
              type="button"
              disabled={isPlayingAudio}
              onClick={() => handleTestAudioPlayback('duhur')}
              className={`w-full py-2.5 px-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSlotTesting === 'duhur'
                  ? 'bg-emerald-950 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>☀️ Qadada (01:00 PM)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">alert_lunch_so.mp3</span>
            </button>

            <button
              type="button"
              disabled={isPlayingAudio}
              onClick={() => handleTestAudioPlayback('fiid')}
              className={`w-full py-2.5 px-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSlotTesting === 'fiid'
                  ? 'bg-emerald-950 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>🌙 Fasaxa Galabnimo (07:00 PM)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">alert_evening_break_so.mp3</span>
            </button>

            <button
              type="button"
              disabled={isPlayingAudio}
              onClick={() => handleTestAudioPlayback('custom')}
              className="w-full py-2.5 px-3 rounded-xl border border-teal-500/50 bg-teal-950/40 text-teal-200 hover:bg-teal-900/60 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span>🗣️ Custom Somali Voice Alert</span>
              </span>
              <span className="text-[10px] text-teal-300 font-mono">TTS Fallback</span>
            </button>

            <button
              type="button"
              onClick={handleStopAudio}
              className="w-full py-2 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Jooji Codka (Stop Audio)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Vibration Patterns */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
              <Vibrate className="w-4 h-4 text-teal-400" />
              <span>2. Vibration Patterns</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Mobile Haptics</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-normal">
            Tijaabi ruxmada telefoonka mobilka marka digniintu gaarto waalidka:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleTestVibration([100, 50, 100], 'Short Chime Pulse')}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Vibrate className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>📳 Pattern 1: Short Chime</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">[100, 50, 100] ms</span>
            </button>

            <button
              type="button"
              onClick={() => handleTestVibration([300, 100, 300, 100, 500], 'Somali Alert Rhythm')}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Vibrate className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>📳 Pattern 2: Somali Alert Rhythm</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono">[300..500] ms</span>
            </button>

            <button
              type="button"
              onClick={() => handleTestVibration([500, 150, 500, 150, 800], 'Emergency SOS Alarm')}
              className="w-full py-2.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Vibrate className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                <span>🚨 Pattern 3: Emergency SOS</span>
              </span>
              <span className="text-[10px] text-rose-300 font-mono">[500..800] ms</span>
            </button>

            <button
              type="button"
              onClick={handleStopVibration}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <span>Jooji Ruxmada (Stop Vibration)</span>
            </button>
          </div>
        </div>

        {/* Card 3: Notification Triggers & Combo */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>3. Notification Triggers</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Broadcast Test</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-normal">
            Tijaabi kicinada ogeysiisyada Firestore iyo push notification-ka dhabta ah:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleTestPushNotificationTrigger}
              className="w-full py-2.5 px-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>📢 Test Firestore Push Trigger</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono">Firestore</span>
            </button>

            <button
              type="button"
              onClick={handleTestComboAlert}
              className="w-full py-3 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-400"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>⚡ TEST COMBO (AUDIO + VIBRATION + PUSH)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Log Output Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Diagnostic Console Log Output</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
              {logs.length} entries
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLogs([])}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 h-36 overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic text-center py-8">
              Log output is empty. Run any test button above to inspect diagnostic logs.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : log.type === 'warn'
                      ? 'text-amber-300'
                      : log.type === 'error'
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
