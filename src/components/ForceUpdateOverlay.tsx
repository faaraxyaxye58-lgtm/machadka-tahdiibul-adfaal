import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  INSTALLED_APP_BUILD,
  PublishedAppVersionConfig,
} from '../lib/appVersionEngine';

interface ForceUpdateOverlayProps {
  versionConfig: PublishedAppVersionConfig;
}

export const ForceUpdateOverlay: React.FC<ForceUpdateOverlayProps> = ({
  versionConfig,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePerformUpdate = async () => {
    setIsRefreshing(true);
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
      console.error('Error clearing cache on force update:', e);
    }

    setTimeout(() => {
      if (versionConfig.downloadUrl) {
        window.location.href = versionConfig.downloadUrl;
      } else {
        window.location.reload();
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden flex flex-col relative my-auto animate-in zoom-in-95 duration-150 max-h-[85vh]">
        
        {/* Header Emergency Red Banner */}
        <div className="bg-gradient-to-r from-rose-800 to-rose-900 text-white p-5 sm:p-6 relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-white" />
              <span>Cusbooneysiintu Waa Qasab</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 leading-tight">
            <span>Cusbooneysii App-ka Tahdiibul Adfaal</span>
          </h2>

          <p className="text-xs text-rose-100 leading-relaxed mt-1 font-medium">
            Version-kan duugga ah lagama taageero nidaamka. Waa in aad cusbooneysiisaa app-ka si aad u sii isticmaasho.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {/* Version Info Box */}
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-center">
            <div className="flex-1">
              <span className="text-[10px] font-extrabold uppercase text-rose-600 block">Version-ka Hadda</span>
              <span className="text-xs font-black text-rose-900 block mt-0.5">
                v{INSTALLED_APP_BUILD.versionName} (Build {INSTALLED_APP_BUILD.versionCode})
              </span>
            </div>
            <div className="w-px h-8 bg-rose-200" />
            <div className="flex-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">Version-ka Cusub</span>
              <span className="text-xs font-black text-emerald-950 block mt-0.5">
                v{versionConfig.latestVersionName} (Build {versionConfig.latestVersionCode})
              </span>
            </div>
          </div>

          {/* Data Safety Notice */}
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <span className="font-extrabold block">Xogtaada 100% Waa Dhawran Tahay:</span>
              Cusbooneysiintu ma tirayso xogta ardayda, maaliyadda ama xaadiriska. Dhammaan xogtu waxay ku kaydsan tahay Google Cloud.
            </div>
          </div>
        </div>

        {/* Action Button (ONLY Cusbooneysii Hadda) */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePerformUpdate}
            disabled={isRefreshing}
            className="w-full py-3.5 px-4 bg-[#0e7a48] hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-60 min-h-[48px]"
          >
            {isRefreshing ? (
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
