import React, { useEffect, useState } from 'react';
import { Smartphone, RotateCw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PortraitLockOverlay: React.FC = () => {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const checkOrientationAndLock = () => {
    // Attempt browser Screen Orientation API lock
    try {
      const orientation = window.screen?.orientation as any;
      if (orientation && typeof orientation.lock === 'function') {
        orientation.lock('portrait').catch(() => {
          orientation.lock('portrait-primary').catch(() => {});
        });
      }
    } catch (e) {
      // Ignored
    }

    // Determine if device is in landscape mode on a mobile device (phone scale)
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobileScale = window.innerHeight < 600 || window.innerWidth < 960;
    const isLandscapeMedia = window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches;

    if (isLandscapeMedia || (isLandscape && isMobileScale)) {
      setIsLandscapeMobile(true);
    } else {
      setIsLandscapeMobile(false);
      setDismissed(false);
    }
  };

  useEffect(() => {
    checkOrientationAndLock();

    const handleResize = () => checkOrientationAndLock();
    const handleOrientationChange = () => checkOrientationAndLock();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    const handleFirstTouch = () => checkOrientationAndLock();
    window.addEventListener('touchstart', handleFirstTouch, { passive: true, once: true });
    window.addEventListener('click', handleFirstTouch, { passive: true, once: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleManualLockPortrait = () => {
    // Try requesting Fullscreen first so browser permits screen.orientation.lock
    if (document.documentElement && typeof document.documentElement.requestFullscreen === 'function') {
      document.documentElement.requestFullscreen().then(() => {
        const orientation = window.screen?.orientation as any;
        if (orientation && typeof orientation.lock === 'function') {
          orientation.lock('portrait').catch(() => {});
        }
      }).catch(() => {
        const orientation = window.screen?.orientation as any;
        if (orientation && typeof orientation.lock === 'function') {
          orientation.lock('portrait').catch(() => {});
        }
      });
    } else {
      try {
        const orientation = window.screen?.orientation as any;
        if (orientation && typeof orientation.lock === 'function') {
          orientation.lock('portrait').catch(() => {});
        }
      } catch (e) {}
    }

    setTimeout(checkOrientationAndLock, 300);
  };

  if (!isLandscapeMobile || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-[#0e7a48]/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center space-y-5">
        
        {/* Large Prominent SVG Animated Rotate Device Graphic */}
        <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0e7a48]/30 via-slate-900 to-slate-950 rounded-3xl border-2 border-[#0e7a48]/60 shadow-2xl w-full max-w-sm overflow-hidden">
          
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* SVG Rotate-Device Animation Canvas */}
          <div className="relative w-48 h-44 flex items-center justify-center my-1">
            <svg
              viewBox="0 0 200 180"
              className="w-full h-full drop-shadow-xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Curved Arrow Arc Gradient */}
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>

                {/* Phone Screen Gradient */}
                <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0e7a48" />
                  <stop offset="100%" stopColor="#022c22" />
                </linearGradient>

                {/* Drop Shadow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Dotted Circular Guide Path */}
              <path
                d="M 50,110 A 55,55 0 0,1 110,40"
                stroke="url(#arcGradient)"
                strokeWidth="3.5"
                strokeDasharray="6,6"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Animated Rotation Arrow */}
              <g className="animate-pulse">
                <path
                  d="M 100,32 L 116,42 L 102,54"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Ghost Outline of Landscape Phone (❌ Position) */}
              <g opacity="0.35" transform="translate(30, 90) rotate(90)">
                <rect x="-18" y="-32" width="36" height="64" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                <rect x="-14" y="-24" width="28" height="48" rx="4" fill="#0f172a" />
              </g>

              {/* Main Animated Phone Body pivoting from Landscape (90deg) to Portrait (0deg) */}
              <g className="animate-[phonePivot_3s_cubic-bezier(0.4,0,0.2,1)_infinite]">
                {/* Outer Phone Shell */}
                <rect
                  x="-22"
                  y="-40"
                  width="44"
                  height="80"
                  rx="10"
                  fill="#090d16"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  filter="url(#glow)"
                />

                {/* Phone Glass Screen */}
                <rect
                  x="-18"
                  y="-32"
                  width="36"
                  height="64"
                  rx="6"
                  fill="url(#screenGradient)"
                  stroke="#10b981"
                  strokeWidth="1.5"
                />

                {/* Speaker Notch */}
                <rect x="-6" y="-37" width="12" height="2.5" rx="1.2" fill="#cbd5e1" />

                {/* Screen Mockup Content - School MIS App Header & Lines */}
                <rect x="-14" y="-28" width="28" height="6" rx="2" fill="#f59e0b" />
                <rect x="-14" y="-18" width="28" height="3" rx="1.5" fill="#a7f3d0" />
                <rect x="-14" y="-12" width="20" height="3" rx="1.5" fill="#6ee7b7" />
                <rect x="-14" y="-6" width="24" height="3" rx="1.5" fill="#34d399" />
                <rect x="-14" y="0" width="16" height="3" rx="1.5" fill="#a7f3d0" />

                {/* Action Button graphic on screen */}
                <rect x="-12" y="12" width="24" height="10" rx="3" fill="#0e7a48" stroke="#34d399" strokeWidth="1" />

                {/* Home Indicator Bar */}
                <rect x="-8" y="32" width="16" height="2" rx="1" fill="#64748b" />
              </g>

              {/* Success Checkmark Badge on Top Right */}
              <g transform="translate(145, 35)">
                <circle cx="0" cy="0" r="14" fill="#10b981" />
                <path d="M -5,0 L -1,4 L 6,-4" fill="none" stroke="#022c22" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Incorrect Red Cross Badge on Bottom Left */}
              <g transform="translate(35, 130)">
                <circle cx="0" cy="0" r="12" fill="#ef4444" opacity="0.9" />
                <path d="M -4,-4 L 4,4 M 4,-4 L -4,4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </svg>
          </div>

          {/* Explicit Visual Labels for Non-Technical Users */}
          <div className="mt-2 w-full flex items-center justify-between px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl text-[11px] font-extrabold text-slate-300">
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>❌ Jiif (Saaqid)</span>
            </div>
            
            <div className="flex items-center gap-1 text-emerald-400">
              <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              <span>U Rog (Rotate)</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>✅ Istaag (Sax)</span>
            </div>
          </div>

          <style>{`
            @keyframes phonePivot {
              0%, 15% {
                transform: translate(100px, 95px) rotate(90deg);
              }
              50%, 85% {
                transform: translate(100px, 90px) rotate(0deg);
              }
              100% {
                transform: translate(100px, 95px) rotate(90deg);
              }
            }
          `}</style>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-full inline-block">
            📱 ISTAAG KELIYA (PORTRAIT MODE)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Fadlan Telefoonkaaga U Rog Istaag
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
            App-ka Machadka Tahdiibul Adfaal waxaa loogu talagalay in lagu isticmaalo shaashad Istaag ah (Portrait) oo keliya si dhammaan xogta iyo bogaggu kuugu muuqdaan si sax ah.
          </p>
        </div>

        <div className="w-full pt-2 space-y-3">
          <button
            type="button"
            onClick={handleManualLockPortrait}
            className="w-full py-3 bg-[#0e7a48] hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-center gap-2 transition-transform cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-amber-300" />
            <span>Lock Portrait (Istaag)</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sii Wad (Forced Portrait Frame)</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Samsung Galaxy A15 & Dhammaan Mobile-yada Android</span>
          </div>
        </div>

      </div>
    </div>
  );
};
