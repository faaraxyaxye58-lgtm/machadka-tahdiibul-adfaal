import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Unlock,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  X,
  KeyRound,
  FileText,
  Info,
  Check
} from 'lucide-react';
import { TeacherDevice, EmergencyUnlockLog, SchoolSettings, User } from '../types';
import { logAuditAction } from '../lib/auditLogger';

interface TeacherDeviceControlViewProps {
  currentUser: User;
  settings: SchoolSettings;
  onSaveSettings: (updated: SchoolSettings) => void;
}

export const TeacherDeviceControlView: React.FC<TeacherDeviceControlViewProps> = ({
  currentUser,
  settings,
  onSaveSettings,
}) => {
  const devices = settings.teacherDevices || [];
  const unlockLogs = settings.emergencyUnlockLogs || [];

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<TeacherDevice | null>(null);
  const [unlockDuration, setUnlockDuration] = useState<number | 'End of Class'>(15);
  const [unlockReason, setUnlockReason] = useState<string>('Hawl degdeg ah oo maamulku oggolaaday');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New device modal state
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newRestrictionLevel, setNewRestrictionLevel] = useState<'ManagedKiosk' | 'PersonalWarning'>('ManagedKiosk');

  // Trigger Emergency Unlock
  const handleTriggerEmergencyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    let expiryTimestamp: string | undefined = undefined;
    if (typeof unlockDuration === 'number') {
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + unlockDuration);
      expiryTimestamp = expiryDate.toISOString();
    } else {
      // End of Class (2 hours)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 2);
      expiryTimestamp = expiryDate.toISOString();
    }

    const updatedDevices = devices.map((dev) => {
      if (dev.id === selectedDevice.id) {
        return {
          ...dev,
          restrictionLevel: 'EmergencyUnlocked' as const,
          unlockUntil: expiryTimestamp,
        };
      }
      return dev;
    });

    const newLog: EmergencyUnlockLog = {
      id: `unl_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: currentUser.name,
      teacherName: selectedDevice.teacherName,
      deviceName: selectedDevice.deviceName,
      durationMinutes: unlockDuration,
      reason: unlockReason,
    };

    const updatedLogs = [newLog, ...unlockLogs];

    onSaveSettings({
      ...settings,
      teacherDevices: updatedDevices,
      emergencyUnlockLogs: updatedLogs,
    });

    logAuditAction(
      currentUser,
      'Emergency Unlock Executed',
      'settings',
      `Admin ${currentUser.name} wuxuu fasaxay (Emergency Unlock) qalabka ${selectedDevice.deviceName} ee Macallin ${selectedDevice.teacherName} (Modada: ${unlockDuration} daqiiqo). Sababta: ${unlockReason}`
    );

    setToastMessage(`🔓 Qalabka ${selectedDevice.deviceName} waa la fasaxay (Emergency Unlock)!`);
    setTimeout(() => setToastMessage(null), 5000);

    setIsUnlockModalOpen(false);
    setSelectedDevice(null);
  };

  // Toggle Authorization
  const handleToggleAuthorization = (device: TeacherDevice) => {
    const updatedDevices = devices.map((d) => {
      if (d.id === device.id) {
        return { ...d, isAuthorized: !d.isAuthorized };
      }
      return d;
    });

    onSaveSettings({
      ...settings,
      teacherDevices: updatedDevices,
    });

    logAuditAction(
      currentUser,
      'Device Authorization Toggled',
      'settings',
      `Admin ${currentUser.name} wuxuu ${!device.isAuthorized ? 'oggolaaday' : 'joojiyay'} idanka qalabka ${device.deviceName}.`
    );
  };

  // Add Device
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim() || !newTeacherName.trim()) return;

    const newDev: TeacherDevice = {
      id: `dev_${Date.now()}`,
      deviceName: newDeviceName.trim(),
      teacherId: `usr_${Date.now()}`,
      teacherName: newTeacherName.trim(),
      isAuthorized: true,
      status: 'Online',
      classModeActive: false,
      lastActiveTime: new Date().toISOString(),
      appVersion: '2.4.0-pro',
      restrictionLevel: newRestrictionLevel,
    };

    onSaveSettings({
      ...settings,
      teacherDevices: [newDev, ...devices],
    });

    setToastMessage(`📱 Qalab cusub oo ah ${newDeviceName} waa la diiwaangeliyay!`);
    setTimeout(() => setToastMessage(null), 4000);

    setIsAddDeviceModalOpen(false);
    setNewDeviceName('');
    setNewTeacherName('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0e7a48] text-white p-6 rounded-2xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Teacher Device Control & Kiosk Manager</span>
          </div>
          <h2 className="text-2xl font-black text-white">Xakameynta & Kiosk Mode-ka Telefoonada Macallimiinta</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Maamul oo xakameee telefoonada/tablets-ka macallimiinta inta fasalku socdo. Samee Emergency Unlock oo eeg Audit Log-ga.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddDeviceModalOpen(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Diiwaangeli Qalab Cusub</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs font-bold animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Honest Architecture & Mobile Lock Technical Assessment Card */}
      <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 space-y-3 text-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
          <Info className="w-5 h-5 text-amber-700 shrink-0" />
          <span>Waqciga & Qeexida Farsamo ee Full Mobile Lock vs In-App Class Mode</span>
        </div>
        <div className="text-xs space-y-2 text-slate-700 leading-relaxed">
          <p>
            <strong>In-App Class Mode Lockdown (Wuu Shaqaynayaa):</strong> Inta fasalku socdo, App-ku wuxuu macallinka ku xirayaa Class Mode si uusan u aadin navigation kale.
          </p>
          <p>
            <strong>Full OS-Level Device Lock (Qalabka Machadku Leeyahay):</strong> Haddii tablet-ku yahay mid uu Machadku leeyahay, xakameynta hardware-ka ee lagu xirayo apps-ka kale (TikTok, WhatsApp, Games) waxay u baahan tahay <strong>Android Enterprise / Fully Kiosk Browser / Device Owner MDM Policy</strong> oo lagu gashado APK-ga.
          </p>
          <p>
            <strong>Telefoonada Gaarka ah ee Macallinka (Personal Devices):</strong> App-ku wuxuu muujinayaa digniinta fasalka oo keliya si aan si qasab ah loogu xirin telefoonkiisa shakhsiga ah.
          </p>
        </div>
      </div>

      {/* Device List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0e7a48]" />
            <span>Telefoonada & Tablets-ka Macallimiinta ({devices.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {devices.map((dev) => {
            const isUnlocked = dev.restrictionLevel === 'EmergencyUnlocked';

            return (
              <div key={dev.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl border shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : dev.classModeActive
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm">{dev.deviceName}</h4>
                      {dev.isAuthorized ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold rounded-md">
                          ✓ Authorized
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold rounded-md">
                          × Unauthorized
                        </span>
                      )}

                      {dev.classModeActive && (
                        <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md animate-pulse">
                          🔥 Class Mode Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Macallin: <strong className="text-slate-800">{dev.teacherName}</strong> • App Ver: {dev.appVersion}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Xaaladda: <strong className="text-emerald-700">{dev.status}</strong> • Nooca Restrictions: <strong>{dev.restrictionLevel}</strong>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleAuthorization(dev)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      dev.isAuthorized
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {dev.isAuthorized ? 'Revoke Authorization' : 'Authorize Device'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDevice(dev);
                      setIsUnlockModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Emergency Unlock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Unlock Audit Logs History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>Taariikhda Emergency Unlock-ka (Audit History Log)</span>
        </h3>

        {unlockLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Wali ma jiro emergency unlock oo dhacay.</p>
        ) : (
          <div className="space-y-2">
            {unlockLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-black text-slate-900 block">
                    Admin {log.adminName} → {log.deviceName} ({log.teacherName})
                  </span>
                  <span className="text-slate-600">Sababta: {log.reason}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-md text-[10px] block">
                    {log.durationMinutes} Daqiiqo
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Unlock Modal */}
      {isUnlockModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-amber-500 text-slate-950 p-4 flex items-center justify-between font-black">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5" />
                <h3>Admin Emergency Unlock</h3>
              </div>
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerEmergencyUnlock} className="p-6 space-y-4 text-slate-800">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p>
                  Qalabka: <strong>{selectedDevice.deviceName}</strong> ({selectedDevice.teacherName})
                </p>
                <p className="text-[11px] text-amber-800">
                  Tani waxay fasaxeysaa qalabka si ku meel gaar ah adoo diiwaangelinaya Audit Log-ga.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Muddada Fasaxa (Unlock Duration)
                </label>
                <select
                  value={unlockDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'End of Class') setUnlockDuration('End of Class');
                    else setUnlockDuration(parseInt(val, 10));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold"
                >
                  <option value={5}>5 Daqiiqo (5 Minutes)</option>
                  <option value={15}>15 Daqiiqo (15 Minutes)</option>
                  <option value={30}>30 Daqiiqo (30 Minutes)</option>
                  <option value="End of Class">Ilaa Dhammaadka Fasalka (End of Class)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sababta Fasaxa (Reason for Unlock)
                </label>
                <textarea
                  rows={2}
                  required
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  placeholder="e.g. Isticmaalka wicitaan degdeg ah..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Xaqiiji Emergency Unlock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {isAddDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0e7a48] text-white p-4 flex items-center justify-between font-black">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <h3>Diiwaangeli Qalab Cusub (Add Device)</h3>
              </div>
              <button
                onClick={() => setIsAddDeviceModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="p-6 space-y-4 text-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Magaca Qalabka (Device Name)
                </label>
                <input
                  type="text"
                  required
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-xs font-bold"
                  placeholder="e.g. Samsung Galaxy Tab A8 (Fasal A)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Magaca Macallinka (Teacher Name)
                </label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-xs font-bold"
                  placeholder="e.g. Macallin Yuusuf Axmed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nooca Restriction-ka
                </label>
                <select
                  value={newRestrictionLevel}
                  onChange={(e) => setNewRestrictionLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e7a48] text-xs font-bold"
                >
                  <option value="ManagedKiosk">Managed Kiosk (Qalabka Machadka)</option>
                  <option value="PersonalWarning">Personal Device Warning (Mobile Personal)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDeviceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Diiwaangeli Qalabka</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
