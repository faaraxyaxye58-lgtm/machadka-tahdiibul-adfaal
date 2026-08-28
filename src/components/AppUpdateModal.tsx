import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Zap,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  INSTALLED_APP_BUILD,
  PublishedAppVersionConfig,
} from '../lib/appVersionEngine';

export const APP_VERSION = INSTALLED_APP_BUILD.versionName;

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: () => void;
  versionConfig?: PublishedAppVersionConfig;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  onMarkAsRead,
  versionConfig,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  if (!isOpen) return null;

  const latestName = versionConfig?.latestVersionName || INSTALLED_APP_BUILD.versionName;
  const latestCode = versionConfig?.latestVersionCode || INSTALLED_APP_BUILD.versionCode;
  const buildDate = versionConfig?.releaseDate || INSTALLED_APP_BUILD.buildDate || '23 Agoosto 2026';

  const handleClose = () => {
    if (dontShowAgain && onMarkAsRead) {
      onMarkAsRead();
    }
    onClose();
  };

  const handlePerformUpdate = async () => {
    setIsUpdating(true);
    if (dontShowAgain && onMarkAsRead) {
      onMarkAsRead();
    }
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.error('Cache clear error:', e);
    }
    setTimeout(() => {
      if (versionConfig?.downloadUrl) {
        window.location.href = versionConfig.downloadUrl;
      } else {
        window.location.reload();
      }
    }, 500);
  };

  const releaseNotesList = versionConfig?.releaseNotes || [
    'Nidaamka Cusbooneysiinta Tooska Ah (Auto Build Update Engine) & Dhawrista Xogta (Data Protection).',
    'Dalacista Tooska Ah ee 29-ka Bisha (Auto 29th Billing).',
    'Garaaf Xisaabeedka Recharts (Paid vs Pending Pie Chart).',
    'Diiwaanka SMS Audit Logs & Dhoofinta CSV.',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative my-auto animate-in zoom-in-95 duration-150 max-h-[85vh]">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0e7a48] to-emerald-800 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Xir"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37] text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>CUSUB</span>
            </span>
            <span className="text-xs text-emerald-100 font-bold">
              Build {latestCode} • {buildDate}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 leading-tight">
            <span>🆕 Cusbooneysiin Cusub</span>
          </h2>
          <p className="text-xs text-emerald-100 leading-snug mt-1 font-medium">
            Waxyaabo cusub ayaa lagu soo kordhiyay App-ka Tahdiibul Adfaal.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 4 Core Highlight Bullets */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-emerald-100 text-[#0e7a48] rounded-lg shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">⚡ Cusbooneysiin otomaatig ah</span>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-emerald-100 text-[#0e7a48] rounded-lg shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">🔐 Ilaalinta xogta oo la xoojiyay</span>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-emerald-100 text-[#0e7a48] rounded-lg shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">📊 Warbixinnada iyo maamulka oo la hagaajiyay</span>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-emerald-100 text-[#0e7a48] rounded-lg shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">☁️ Cloud Sync oo la xoojiyay</span>
            </div>
          </div>

          {/* Expandable "Faahfaahin dheeraad ah" */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#0e7a48] hover:text-emerald-800 cursor-pointer transition-colors py-1"
            >
              <span>Faahfaahin dheeraad ah</span>
              {showMoreDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showMoreDetails && (
              <div className="mt-2.5 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2 text-xs text-slate-700 animate-in fade-in duration-150">
                <div className="font-bold text-[#0e7a48] text-[11px] uppercase tracking-wider mb-1">
                  Xogta Release-ka (Build {latestCode} Notes):
                </div>
                {releaseNotesList.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0e7a48] shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-700 leading-relaxed">{note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Checkbox "Ima tusin mar kale" */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-[#0e7a48] rounded border-slate-300 focus:ring-[#0e7a48] cursor-pointer"
              />
              <span>Ima tusin mar kale</span>
            </label>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer min-h-[44px] text-center"
          >
            Marka Dambe
          </button>

          <button
            type="button"
            onClick={handlePerformUpdate}
            disabled={isUpdating}
            className="flex-1 py-3 px-4 bg-[#0e7a48] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 min-h-[44px]"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cusbooneysiinayaa...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Cusbooneysii Hadda</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
