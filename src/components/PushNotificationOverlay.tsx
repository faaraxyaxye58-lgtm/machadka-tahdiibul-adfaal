import React, { useEffect, useState } from 'react';
import { BroadcastNotification, User } from '../types';
import { dismissPushNotificationInFirestore } from '../lib/firebase';
import { SomaliVoiceAlertManager } from '../lib/SomaliVoiceAlertManager';
import {
  Bell,
  AlertTriangle,
  Siren,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  User as UserIcon,
  X,
  Radio,
  Mic,
  Play,
} from 'lucide-react';

interface PushNotificationOverlayProps {
  currentUser: User | null;
  notifications: BroadcastNotification[];
}

// Web Audio API Beep Generator for Emergency Alerts
function playEmergencyChime(isEmergency: boolean) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isEmergency ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isEmergency ? 880 : 587.33, ctx.currentTime); // A5 or D5
    if (isEmergency) {
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    }

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isEmergency ? 0.6 : 0.4));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isEmergency ? 0.6 : 0.4));
  } catch (e) {
    // Audio context play blocked or unsupported
  }
}

export const PushNotificationOverlay: React.FC<PushNotificationOverlayProps> = ({
  currentUser,
  notifications,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifPermission, setBrowserNotifPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Filter notifications that match the current user and are active & unread
  const userId = currentUser?.id || currentUser?.username || 'anonymous_guest';
  const userRole = currentUser?.role || 'parent';

  const activeUnread = notifications.filter((notif) => {
    if (!notif.active) return false;

    // Check if already dismissed
    if (notif.readByUsers && notif.readByUsers.includes(userId)) return false;

    // Check target audience match
    if (notif.targetAudience === 'all') return true;
    if (notif.targetAudience === 'teachers' && (userRole === 'teacher' || userRole === 'admin')) return true;
    if (notif.targetAudience === 'parents' && (userRole === 'parent' || userRole === 'admin')) return true;
    if (notif.targetAudience === 'students' && (userRole === 'student' || userRole === 'admin')) return true;

    return false;
  });

  const currentPopup = activeUnread.length > 0 ? activeUnread[0] : null;
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const handlePlayVoiceAlert = async () => {
    if (!currentPopup) return;
    setIsPlayingVoice(true);
    try {
      await SomaliVoiceAlertManager.playSomaliMaleVoice({
        customText: currentPopup.message,
      });
    } catch (err) {
      console.warn('Voice play notice:', err);
    } finally {
      setTimeout(() => setIsPlayingVoice(false), 1200);
    }
  };

  // Trigger audio & browser native push notification when a new alert pops up
  useEffect(() => {
    if (!currentPopup) return;

    if (soundEnabled) {
      playEmergencyChime(currentPopup.priority === 'emergency');

      // Auto-play AI Somali Voice when broadcast arrives
      handlePlayVoiceAlert();
    }

    // Trigger browser native Push Notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 ${currentPopup.title}`, {
          body: currentPopup.message,
          icon: '/favicon.ico',
          tag: currentPopup.id,
        });
      } catch (e) {
        // Native notification error fallback
      }
    }
  }, [currentPopup?.id, soundEnabled]);

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setBrowserNotifPermission(perm);
    }
  };

  if (!currentPopup) return null;

  const isEmergency = currentPopup.priority === 'emergency';
  const isUrgent = currentPopup.priority === 'urgent';

  const handleDismiss = async () => {
    await dismissPushNotificationInFirestore(currentPopup.id, userId, currentPopup.readByUsers || []);
  };

  const formattedDate = new Date(currentPopup.createdAt).toLocaleTimeString('so-SO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300 transform scale-100 ${
          isEmergency
            ? 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-500 shadow-rose-900/50'
            : isUrgent
            ? 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-500 shadow-amber-900/50'
            : 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500 shadow-emerald-900/50'
        }`}
      >
        {/* Top Emergency Pulse Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isEmergency
              ? 'bg-rose-600/30 border-rose-500/40 text-rose-200'
              : isUrgent
              ? 'bg-amber-600/30 border-amber-500/40 text-amber-200'
              : 'bg-emerald-600/30 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl animate-pulse ${
                isEmergency
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50'
                  : isUrgent
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/50'
                  : 'bg-emerald-500 text-slate-950'
              }`}
            >
              {isEmergency ? (
                <Siren className="w-6 h-6 animate-bounce" />
              ) : isUrgent ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Radio className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">
                  {isEmergency
                    ? '🚨 XAALAD DEGDEG AH (EMERGENCY)'
                    : isUrgent
                    ? '⚡ FARIIN DEGDEG AH (URGENT ALERT)'
                    : '📢 FARIIN DUGSIGA (SCHOOL BROADCAST)'}
                </span>
                {activeUnread.length > 1 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-400 text-slate-950 rounded-full">
                    +{activeUnread.length - 1} Fariin oo kale
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/70 font-semibold mt-0.5">
                Shaashadda tooska ah ee Maamulka Dugsiga Tahdiibul Adfaal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Damu Sanqadha' : 'Bilaaw Sanqadha'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Close / Dismiss */}
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-white">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
              {currentPopup.title}
            </h2>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 font-medium text-sm md:text-base leading-relaxed whitespace-pre-line shadow-inner">
              {currentPopup.message}
            </div>

            {/* AI SOMALI VOICE PLAY BUTTON FOR PARENTS */}
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>🎙️ CODKA MAAMULKA MACHADKA TAHDIIBUL ADFAAL</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  AI Somali Male Voice
                </span>
              </div>
              <button
                onClick={handlePlayVoiceAlert}
                disabled={isPlayingVoice}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-300"
              >
                <Volume2 className="w-5 h-5 text-slate-950 animate-bounce" />
                <span>
                  {isPlayingVoice
                    ? 'Codka Maamulku Waa Dhawaaqayaa...'
                    : '🔊 DHEGEYSO CODKA MAAMULKA (PLAY VOICE ALERT)'}
                </span>
              </button>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Moodee/Soo Diray: <strong className="text-white">{currentPopup.senderName}</strong></span>
            </div>

            <div className="flex items-center gap-2 font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saacada: <strong className="text-white">{formattedDate}</strong></span>
            </div>

            <div className="flex items-center gap-2 font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ku socota: <strong className="text-amber-300 uppercase">{currentPopup.targetAudience}</strong></span>
            </div>
          </div>

          {/* Browser Permission Request Prompt (if not granted yet) */}
          {browserNotifPermission !== 'granted' && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs text-cyan-200">
              <span>Geeska ama browser-ka ku oggolow Push Notifications si ay kuu soo gaaraan.</span>
              <button
                onClick={requestBrowserPermission}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-[11px] cursor-pointer"
              >
                Oggolow (Enable)
              </button>
            </div>
          )}

          {/* Dismiss Action Button */}
          <div className="pt-2">
            <button
              onClick={handleDismiss}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isEmergency
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                  : isUrgent
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>✅ AAD BAAN U AKHRIYAY (DISMISS ALERT)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
