import React from 'react';
import { HardDrive, FileText, Image as ImageIcon, File, AlertTriangle, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { CloudStorageStats } from '../../types';

interface StorageMonitorCardProps {
  stats: CloudStorageStats;
  onRefresh?: () => void;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const StorageMonitorCard: React.FC<StorageMonitorCardProps> = ({ stats, onRefresh }) => {
  const getBadgeStyle = () => {
    switch (stats.statusAlert) {
      case 'disabled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getProgressColor = () => {
    switch (stats.statusAlert) {
      case 'disabled':
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    }
  };

  return (
    <div id="storage-monitor-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              ☁️ Backblaze B2 Free Cloud Storage
            </h3>
            <p className="text-xs text-slate-400">
              Free Tier Quota: 10 GB | Kaydinta e-Doc, PDF & Sawirrada Machadka
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getBadgeStyle()}`}>
            {stats.statusAlert === 'disabled' && <ShieldAlert className="w-3.5 h-3.5" />}
            {stats.statusAlert === 'critical' && <AlertTriangle className="w-3.5 h-3.5" />}
            {stats.statusAlert === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
            {stats.statusAlert === 'normal' && <CheckCircle className="w-3.5 h-3.5" />}

            {stats.statusAlert === 'disabled' && '⛔ 100% Full (Upload Disabled)'}
            {stats.statusAlert === 'critical' && '🔴 90%+ Critical Limit'}
            {stats.statusAlert === 'warning' && '🟡 70%+ Warning Threshold'}
            {stats.statusAlert === 'normal' && '🟢 Normal (Free Tier OK)'}
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Cusboonaysii Xogta Storage-ka"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* Quota Progress Bar */}
      <div className="space-y-2 mb-5">
        <div className="flex justify-between text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Storage Used: <strong className="text-white ml-1">{formatBytes(stats.usedBytes)}</strong> / {formatBytes(stats.totalBytes)}
          </span>
          <span className="text-slate-400">
            {stats.usagePercentage}% Used ({formatBytes(stats.availableBytes)} Available)
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.max(2, stats.usagePercentage)}%` }}
          />
        </div>
      </div>

      {/* Alert Banners if high usage */}
      {stats.statusAlert === 'disabled' && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong>⚠️ Cloud Storage-ku wuxuu gaaray xadka Free Tier-ka (10 GB).</strong>
            <p className="mt-0.5 text-red-300">
              Uploadiadka faylalka cusub waa la hakiyay si kumeel-gaar ah. Fadlan tirtir faylalkii hore ee aan loo baahnayn si aad spase cusub u hesho.
            </p>
          </div>
        </div>
      )}

      {stats.statusAlert === 'warning' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Digniin: Kaydka Cloud Storage wuxuu marayaa {stats.usagePercentage}%.</strong>
            <p className="mt-0.5 text-amber-300">
              Fadlan maamul faylalka oo tirtir kuwa aan loo baahnayn ka hor inta uusan gaarin 10 GB limit-ka.
            </p>
          </div>
        </div>
      )}

      {/* Categories Breakdown Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="text-slate-300">PDFs</span>
          </div>
          <span className="font-bold text-slate-100 bg-slate-700/60 px-2 py-0.5 rounded-md">
            {stats.pdfCount}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">Documents</span>
          </div>
          <span className="font-bold text-slate-100 bg-slate-700/60 px-2 py-0.5 rounded-md">
            {stats.documentCount}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Images</span>
          </div>
          <span className="font-bold text-slate-100 bg-slate-700/60 px-2 py-0.5 rounded-md">
            {stats.imageCount}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">Total Files</span>
          </div>
          <span className="font-bold text-slate-100 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            {stats.totalFilesCount}
          </span>
        </div>
      </div>
    </div>
  );
};
