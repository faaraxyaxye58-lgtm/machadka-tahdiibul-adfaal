import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  PhoneCall,
  KeyRound,
  AlertTriangle,
  Battery,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  BookOpen
} from 'lucide-react';
import {
  StudentDeviceControlState,
  verifyPin,
  playLockChime
} from '../lib/deviceControlEngine';

interface StudentDeviceLockOverlayProps {
  deviceState: StudentDeviceControlState;
  onUnlockWithPin: () => void;
  onRequestParentEmergencyUnlock?: () => void;
}

export const StudentDeviceLockOverlay: React.FC<StudentDeviceLockOverlayProps> = ({
  deviceState,
  onUnlockWithPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto request browser fullscreen on lock to maximize security
  useEffect(() => {
    if (deviceState.isLocked) {
      playLockChime('lock');
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {
        // Fullscreen request might require user gesture
      }
    }
  }, [deviceState.isLocked]);

  if (!deviceState.isLocked) return null;

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setIsVerifying(true);

    try {
      const isValid = await verifyPin(pinInput, deviceState.parentPinHash);
      if (isValid) {
        playLockChime('unlock');
        onUnlockWithPin();
        setShowPinModal(false);
        setPinInput('');
      } else {
        setPinError('PIN-ka Waalidku waa khalad! Fadlan mar kale isku day.');
      }
    } catch (err) {
      setPinError('Khalad ayaa dhacay marka PIN-ka la xaqiijinayay.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950 text-white flex flex-col justify-between p-6 overflow-hidden select-none animate-fade-in font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-2xl animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-white tracking-wide">
              Machadka Tahdiibul Adfaal
            </h2>
            <p className="text-xs text-rose-400 font-bold uppercase tracking-widest">
              Parent Device Lockdown Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span>{deviceState.batteryLevel}%</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Main Lock Center Box */}
      <div className="relative z-10 my-auto text-center max-w-md mx-auto space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-rose-600 to-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-900/50 border border-rose-400/30 animate-bounce">
            <ShieldAlert className="w-12 h-12 text-slate-950" />
          </div>
          <span className="absolute -bottom-2 right-2 px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black rounded-full uppercase tracking-widest">
            LOCKED
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Telefoonka Waa La Xiray
          </h1>
          <p className="text-sm text-slate-300 font-medium leading-relaxed px-4">
            Waalidkaaga ama nidaamka xakameynta ayaa xiray qalabkan inta lagu jiro waqtiga waxbarashada ama nasashada.
          </p>
        </div>

        {/* Lock Reason Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ardayga: <strong className="text-amber-400">{deviceState.studentName}</strong></span>
            <span>Xaaladda: <strong className="text-rose-400">Locked</strong></span>
          </div>
          <div className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold block mb-0.5">Sababta Lock-ga:</span>
            <span>{deviceState.lockReason || 'Jadwalka xiritaanka otomaatiga ah ee waalidka (Scheduled Lock).'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Emergency Call Parent */}
          <a
            href={`tel:${deviceState.parentPhone}`}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 border border-emerald-400/40 active:scale-95 transition-transform"
          >
            <PhoneCall className="w-4 h-4 text-amber-300" />
            <span>Wac Waalidka ({deviceState.parentPhone})</span>
          </a>

          {/* Emergency Call 112 */}
          <a
            href="tel:112"
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-rose-400 font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 border border-slate-800 active:scale-95 transition-transform"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Emergency (112)</span>
          </a>
        </div>

        {/* Enter Parent PIN button */}
        <button
          onClick={() => setShowPinModal(true)}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 border border-amber-300/40 active:scale-95 transition-transform cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span>Ku Furbu PIN-ka Waalidka (Parent PIN)</span>
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div className="relative z-10 text-center text-[11px] text-slate-500 border-t border-slate-900 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Tahdiibul Adfaal Student Safety System • Galaxy A15 Compatible</span>
        <span>Emergency functions (112, Parent Phone) remain unlocked.</span>
      </div>

      {/* Parent PIN Entry Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-white shadow-2xl relative">
            <button
              onClick={() => {
                setShowPinModal(false);
                setPinError(null);
                setPinInput('');
              }}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Geli PIN-ka Waalidka</h3>
              <p className="text-xs text-slate-400">
                Adoo ah waalidka ama maamulaha, geli 4-ta lambar ee sirta ah si aad u furto qalabkan.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-full text-center tracking-[1em] text-2xl font-mono font-black py-3 bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-2xl text-amber-400 outline-none"
                />
                {pinError && (
                  <p className="text-xs font-bold text-rose-400 mt-2 text-center animate-shake">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || pinInput.length < 4}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying...' : 'Fur Telefoonka'}</span>
                </button>
              </div>
            </form>

            <p className="text-[10px] text-center text-slate-500 font-mono">
              Default Parent PIN: <strong>1234</strong> (Ka beddel Parent Settings)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
