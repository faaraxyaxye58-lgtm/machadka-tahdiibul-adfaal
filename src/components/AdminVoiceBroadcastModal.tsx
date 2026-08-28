import React, { useState } from 'react';
import { User, NotificationPriority, NotificationTargetAudience, BroadcastNotification } from '../types';
import { sendPushNotificationToFirestore, logAuditActivity } from '../lib/firebase';
import { SomaliVoiceAlertManager } from '../lib/SomaliVoiceAlertManager';
import {
  Mic,
  Volume2,
  Send,
  X,
  ShieldAlert,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';

interface AdminVoiceBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const PRESET_TEMPLATES = [
  {
    id: 'subax',
    label: '🌅 Quraacda (07:00 AM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii quraacda ee Machadka Tahdiibul Adfaal. Fadlan hubi ubadkaaga.',
  },
  {
    id: 'duhur',
    label: '☀️ Qadada (01:00 PM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii qadada ee ubadka Machadka Tahdiibul Adfaal. Ubadku way fasaxan yihiin.',
  },
  {
    id: 'fiid',
    label: '🌙 Fasaxa Galabnimo (07:00 PM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii xifdiga ee ubadka Machadka Tahdiibul Adfaal. Fadlan xasuusi ubadka xifdiga Qur\'aanka.',
  },
  {
    id: 'custom',
    label: '✏️ Fariin Gaar ah (Custom Message)',
    text: 'Ku soo dhowaada Machadka Tahdiibul Adfaal. Maamulku wuxuu idin ogeysiinayaa in berri uu jiro kulanka waalidiinta iyo macallimiinta.',
  },
];

export const AdminVoiceBroadcastModal: React.FC<AdminVoiceBroadcastModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('subax');
  const [voiceText, setVoiceText] = useState<string>(PRESET_TEMPLATES[0].text);
  const [targetAudience, setTargetAudience] = useState<NotificationTargetAudience>('parents');
  const [priority, setPriority] = useState<NotificationPriority>('urgent');

  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (found) {
      setVoiceText(found.text);
    }
  };

  const handleTestVoiceLocally = async () => {
    setIsPlayingTest(true);
    setStatusMessage(null);

    try {
      await SomaliVoiceAlertManager.playSomaliMaleVoice({
        slotId: selectedPreset !== 'custom' ? (selectedPreset as 'subax' | 'duhur' | 'fiid') : undefined,
        customText: voiceText,
      });

      setStatusMessage({
        type: 'success',
        text: '🔊 Codka AI Soomaaliga ah waa la tijaabiyay! Sidan ayay waalidiintu uga maqli doonaan telefoonadooda.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: '⚠️ Cilad ayaa ka dhacday tijaabinta codka: ' + (err?.message || err),
      });
    } finally {
      setTimeout(() => setIsPlayingTest(false), 1500);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!voiceText.trim()) {
      setStatusMessage({ type: 'error', text: 'Fadlan soo qor ama dooro fariinta codka ah.' });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const notification: BroadcastNotification = {
        id: `voice-alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: '🎙️ Fariin Cod ah oo ka socota Maamulka Machadka Tahdiibul Adfaal',
        message: voiceText.trim(),
        senderName: currentUser.name || 'Maamulka Machadka Tahdiibul Adfaal',
        senderRole: 'admin',
        targetAudience,
        priority,
        createdAt: new Date().toISOString(),
        active: true,
        readByUsers: [],
      };

      await sendPushNotificationToFirestore(notification);

      await logAuditActivity(
        currentUser.name || 'Admin',
        'admin',
        'Fariin Cod ah oo AI Soomaali ah ayaa loo diray Waalidiinta',
        'system',
        `Fariinta codka ah: "${voiceText.slice(0, 60)}..." (Audience: ${targetAudience})`
      );

      setStatusMessage({
        type: 'success',
        text: '🚀 FARIINTA CODKA AH WAA LOO DIRAY DHAMMAAN WAALIDIINTA! Telefoonadooda ayay toos uga dhawaaqaysaa.',
      });

      setTimeout(() => {
        setIsSending(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setIsSending(false);
      setStatusMessage({
        type: 'error',
        text: '⚠️ Cilad ayaa ka dhacday dirista fariinta: ' + (err?.message || err),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0e7a48] px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shadow-inner">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Maamulaha Keliya (Admin Only)
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" />
                  <span>AI Somali Voice Broadcast</span>
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Dir Fariin Cod ah oo AI Soomaali ah (Machadka Tahdiibul Adfaal)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Admin Authorization Security Guard Notice */}
          {!isAdmin ? (
            <div className="p-6 bg-rose-950/80 border border-rose-500 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
              <h3 className="text-base font-black text-rose-200 uppercase">
                ⚠️ Awood Ma Lahid (Restricted Access)
              </h3>
              <p className="text-xs text-rose-100 leading-relaxed max-w-md mx-auto">
                Maamulaha (Admin) oo keliya ayaa awood u leh inuu u soo diro fariimo cod ah oo AI Soomaali ah waalidiinta iyo telefoonadooda Machadka Tahdiibul Adfaal.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Gartay (Close)
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendBroadcast} className="space-y-5">
              {/* Status Alert Toast */}
              {statusMessage && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-extrabold flex items-center justify-between gap-2 animate-fade-in ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusMessage(null)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Template Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>1. Dooro Nooca Fariinta Codka ah (Template):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handlePresetSelect(tmpl.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        selectedPreset === tmpl.id
                          ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{tmpl.label}</span>
                      {selectedPreset === tmpl.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Voice Message Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span>2. Qoraalka Fariinta Codka AI-ga (Somali Text):</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {voiceText.length} xaraf
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Halkan ku qor fariinta aad doonaysid in AI Soomaali ah loogu akhriyo waalidka..."
                  className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner leading-relaxed"
                />
              </div>

              {/* Target Audience & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Target Audience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">
                    Ku Socota (Target Audience):
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as NotificationTargetAudience)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="parents">👨‍👩‍👧‍👦 Waalidiinta Keliya (Parents Only)</option>
                    <option value="all">📢 Dhammaan (Waalidiin, Macallimiin & Arday)</option>
                    <option value="teachers">👨‍🏫 Macallimiinta Keliya (Teachers Only)</option>
                    <option value="students">🎓 Ardayda Keliya (Students Only)</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">
                    Muhiimadda (Priority Level):
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="urgent">⚡ Fariin Degdeg Ah (Urgent Alert)</option>
                    <option value="emergency">🚨 Xaalad Degdeg Ah (Emergency Alert)</option>
                    <option value="normal">📢 Fariin Kheyraat Ah (Normal Broadcast)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Test Voice Locally Button */}
                <button
                  type="button"
                  onClick={handleTestVoiceLocally}
                  disabled={isPlayingTest || !voiceText.trim()}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 border border-teal-400"
                >
                  <Volume2 className="w-4 h-4 text-amber-300" />
                  <span>{isPlayingTest ? 'Codku waa dhawaaqayaa...' : '🔊 TIJAABI CODKA HADA'}</span>
                </button>

                {/* Send Broadcast Button */}
                <button
                  type="submit"
                  disabled={isSending || !voiceText.trim()}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 border border-emerald-300"
                >
                  <Send className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>
                    {isSending
                      ? 'Codka waa la diraa...'
                      : '🚀 SOO DIR FARIINTA CODKA AH'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
