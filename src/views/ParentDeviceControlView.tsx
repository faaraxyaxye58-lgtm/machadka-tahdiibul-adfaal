import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Eye,
  EyeOff,
  Sliders,
  Settings,
  Plus,
  Trash2,
  HelpCircle,
  Terminal,
  Activity,
  PhoneCall,
  Check,
  X
} from 'lucide-react';
import {
  StudentDeviceControlState,
  AppControlRule,
  DEFAULT_APP_RULES,
  DeviceDiagnosticsResult,
  runDeviceDiagnostics,
  getDeviceBatteryInfo,
  hashPin,
  verifyPin,
  playLockChime
} from '../lib/deviceControlEngine';
import { User, Student, Parent, SchoolSettings } from '../types';
import { saveItemToFirestore, COLLECTIONS } from '../lib/firebase';
import { logAuditAction } from '../lib/auditLogger';

interface ParentDeviceControlViewProps {
  currentUser: User;
  students: Student[];
  parents: Parent[];
  settings: SchoolSettings;
  onSaveSettings: (updated: SchoolSettings) => void;
}

export const ParentDeviceControlView: React.FC<ParentDeviceControlViewProps> = ({
  currentUser,
  students,
  parents,
  settings,
  onSaveSettings,
}) => {
  // Find student assigned to parent or pick first student
  const parentRecord = parents.find(
    (p) =>
      p.fullName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      (currentUser.phone && p.phone.includes(currentUser.phone))
  );

  const matchedStudents = students.filter((s) => {
    if (currentUser.role === 'parent') {
      return (
        (parentRecord && parentRecord.childrenIds && parentRecord.childrenIds.includes(s.id)) ||
        (s.parentName && currentUser.name && s.parentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
        (s.parentPhone && currentUser.phone && s.parentPhone.replace(/\D/g, '').slice(-7) === currentUser.phone.replace(/\D/g, '').slice(-7))
      );
    }
    return true;
  });

  const selectedStudent = matchedStudents[0] || students[0] || {
    id: 'std_demo',
    fullName: 'Cumar Cabdi Maxamed',
    parentName: currentUser.name,
    parentPhone: currentUser.phone || '+252615000000',
  };

  // Default initial device control state
  const [deviceState, setDeviceState] = useState<StudentDeviceControlState>(() => {
    const saved = localStorage.getItem(`tahdiib_device_ctrl_${selectedStudent.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    return {
      id: `dev_${selectedStudent.id}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      parentId: currentUser.id,
      parentPhone: selectedStudent.parentPhone || currentUser.phone || '+252615000000',
      deviceModel: 'Samsung Galaxy A15 (SM-A155F)',
      isLocked: false,
      lockReason: '',
      lastLockTime: 'Maalintii shalay 06:00 PM',
      lastUnlockTime: 'Saaqaddan Hore 08:00 AM',
      lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Online',
      batteryLevel: 88,
      isCharging: false,
      studyModeActive: false,
      scheduledLockEnabled: true,
      scheduleLockTime: '18:00',
      scheduleUnlockTime: '20:00',
      appControlRules: DEFAULT_APP_RULES,
      parentPinHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 for '1234'
      diagnostics: {
        deviceAdmin: 'PASS',
        deviceOwner: 'FAIL',
        accessibilityService: 'FAIL',
        notificationPermission: 'PASS',
        backgroundService: 'PASS',
        batteryOptimization: 'PASS',
        lockCapability: 'PASS',
        appControlCapability: 'FAIL',
        deviceConnection: 'PASS',
        details: {},
      },
    };
  });

  const [activeTab, setActiveTab] = useState<'controls' | 'schedule' | 'studymode' | 'appcontrol' | 'pin' | 'diagnostics' | 'antibypass'>('controls');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PIN settings state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);

  // Diagnostics state
  const [diagnosticsResult, setDiagnosticsResult] = useState<DeviceDiagnosticsResult | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // Load battery telemetry and diagnostics on mount
  useEffect(() => {
    getDeviceBatteryInfo().then((info) => {
      setDeviceState((prev) => ({
        ...prev,
        batteryLevel: info.level,
        isCharging: info.charging,
        lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
    });

    handleRunDiagnostics();
  }, []);

  // Save device state locally and to Firestore
  const updateDeviceState = (updated: StudentDeviceControlState, auditActionDesc?: string) => {
    setDeviceState(updated);
    localStorage.setItem(`tahdiib_device_ctrl_${selectedStudent.id}`, JSON.stringify(updated));
    saveItemToFirestore(COLLECTIONS.SETTINGS, {
      id: `device_ctrl_${selectedStudent.id}`,
      ...updated,
      updatedAt: new Date().toISOString(),
    });

    if (auditActionDesc) {
      logAuditAction(
        currentUser,
        'Parent Device Control Updated',
        'settings',
        `Waalid ${currentUser.name} wuxuu beddelay xakameynta qalabka ardayga ${selectedStudent.fullName}: ${auditActionDesc}`
      );
    }
  };

  // Run live diagnostics
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const diag = await runDeviceDiagnostics();
    setDiagnosticsResult(diag);
    setDeviceState((prev) => ({
      ...prev,
      diagnostics: diag,
    }));
    setIsRunningDiagnostics(false);
  };

  // Instant Lock Now / Unlock Toggle
  const handleToggleLockNow = (lock: boolean, reason: string = 'Lock Now uu riixay Waalidku') => {
    const updated: StudentDeviceControlState = {
      ...deviceState,
      isLocked: lock,
      lockReason: lock ? reason : '',
      status: lock ? 'Locked' : 'Online',
      lastLockTime: lock ? new Date().toLocaleString() : deviceState.lastLockTime,
      lastUnlockTime: !lock ? new Date().toLocaleString() : deviceState.lastUnlockTime,
    };

    updateDeviceState(updated, lock ? 'DEVICE LOCKED NOW' : 'DEVICE UNLOCKED');
    playLockChime(lock ? 'lock' : 'unlock');

    setToastMessage(lock ? `🔒 Telefoonka ${selectedStudent.fullName} waa la xiray (Device Locked)!` : `🔓 Telefoonka ${selectedStudent.fullName} waa la furay (Device Unlocked)!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Study Mode Toggle
  const handleToggleStudyMode = (active: boolean, hours: number = 2) => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hours);

    const updated: StudentDeviceControlState = {
      ...deviceState,
      studyModeActive: active,
      studyModeEndTime: active ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    };

    updateDeviceState(updated, active ? `Study Mode Dhaqaajiyay (${hours} saacadood)` : 'Study Mode oo la damiyay');
    setToastMessage(active ? `📚 Study Mode waa la dhaqaajiyay (${hours} saac)!` : '📚 Study Mode waa la damiyay!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Change PIN handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(null);

    const isValidCurrent = await verifyPin(currentPinInput, deviceState.parentPinHash);
    if (!isValidCurrent) {
      setPinChangeError('PIN-kaaga hadda waa khalad!');
      return;
    }

    if (newPinInput.length < 4) {
      setPinChangeError('PIN-ka cusub waa inuu yahay ugu yaraan 4 lambar!');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinChangeError('PIN-ka cusub iyo xaqiijintu isku mid ma ahan!');
      return;
    }

    const newHash = await hashPin(newPinInput);
    const updated: StudentDeviceControlState = {
      ...deviceState,
      parentPinHash: newHash,
    };

    updateDeviceState(updated, 'Parent PIN updated securely');
    setPinChangeSuccess('🔑 Parent PIN-ka waa la beddelay si guul leh!');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  // App control status change
  const handleAppRuleStatusChange = (ruleId: string, newStatus: 'Allowed' | 'Restricted' | 'Blocked') => {
    const updatedRules = deviceState.appControlRules.map((rule) => {
      if (rule.id === ruleId) {
        return { ...rule, status: newStatus };
      }
      return rule;
    });

    const updated: StudentDeviceControlState = {
      ...deviceState,
      appControlRules: updatedRules,
    };

    updateDeviceState(updated, `App rule status changed for rule ${ruleId} to ${newStatus}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Parent Device Control & Mobile Lock Manager</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Xakameynta & Xiritaanka Telefoonka Ardayga ({selectedStudent.fullName})
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Sida tooska ah u maamul telefoonka ilmahaaga: Lock Now, Scheduled Lock, Study Mode, App Control iyo Diagnostics.
          </p>
        </div>

        {/* Live Device Status Badge */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700/80 text-right space-y-1 shrink-0">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Xaaladda Telefoonka:</span>
            {deviceState.isLocked ? (
              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full animate-pulse flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Device Locked</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-xs font-black rounded-full flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                <span>Device Unlocked</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 flex items-center justify-end gap-3 font-mono">
            <span>🔋 {deviceState.batteryLevel}% {deviceState.isCharging ? '⚡' : ''}</span>
            <span>•</span>
            <span>📶 {deviceState.status}</span>
            <span>•</span>
            <span>🕒 {deviceState.lastSeen}</span>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs font-bold animate-fade-in border border-emerald-500">
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

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'controls'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Lock / Unlock Now</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Scheduled Lock</span>
        </button>

        <button
          onClick={() => setActiveTab('studymode')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'studymode'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Study Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('appcontrol')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'appcontrol'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>App Control</span>
        </button>

        <button
          onClick={() => setActiveTab('pin')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'pin'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Parent PIN</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Device Diagnostics</span>
        </button>

        <button
          onClick={() => setActiveTab('antibypass')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            activeTab === 'antibypass'
              ? 'bg-slate-900 text-amber-400 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Galaxy A15 & Anti-bypass</span>
        </button>
      </div>

      {/* TAB 1: LOCK / UNLOCK NOW CONTROLS */}
      {activeTab === 'controls' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Control Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span>Immediate Device Control</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Riix badhanka si aad isla markiiba u xirto ama u furto telefoonka ilmahaaga.
                </p>
              </div>
            </div>

            {/* Status Display Box */}
            <div className={`p-5 rounded-2xl border text-center space-y-3 ${
              deviceState.isLocked
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                deviceState.isLocked ? 'bg-rose-600 text-white animate-bounce' : 'bg-emerald-600 text-white'
              }`}>
                {deviceState.isLocked ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
              </div>

              <div>
                <h4 className="font-black text-xl">
                  {deviceState.isLocked ? 'Device Locked' : 'Device Unlocked'}
                </h4>
                <p className="text-xs font-semibold mt-1">
                  {deviceState.isLocked
                    ? `Telefoonka waa la xiray si buuxda. Sababta: ${deviceState.lockReason || 'Lock Now'}`
                    : 'Telefoonku waa furan yahay, ilmahagu wuu isticmaali karaa apps-ka la oggolaaday.'}
                </p>
              </div>
            </div>

            {/* Lock / Unlock Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleToggleLockNow(true, 'Waalidku wuxuu riixay LOCK NOW')}
                disabled={deviceState.isLocked}
                className="py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-900/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
              >
                <Lock className="w-5 h-5" />
                <span>LOCK NOW</span>
              </button>

              <button
                onClick={() => handleToggleLockNow(false)}
                disabled={!deviceState.isLocked}
                className="py-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
              >
                <Unlock className="w-5 h-5" />
                <span>UNLOCK</span>
              </button>
            </div>

            {/* Telemetry Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Model-ka Qalabka:</span>
                <span className="font-mono font-bold text-slate-800">{deviceState.deviceModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Aaraada Ugu Dambeysay (Last Seen):</span>
                <span className="font-mono font-bold text-slate-800">{deviceState.lastSeen}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Lock-gii Ugu Dambeeyay:</span>
                <span className="font-mono font-bold text-slate-800">{deviceState.lastLockTime}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-bold">Unlock-gii Ugu Dambeeyay:</span>
                <span className="font-mono font-bold text-slate-800">{deviceState.lastUnlockTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Info & Safety Guidelines */}
          <div className="bg-amber-50/80 border border-amber-300/80 rounded-3xl p-6 space-y-4 text-slate-800">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Gudbinta Amarka Soosaarista (Command Sync Execution)</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-700">
              Markaad riixdo <strong>LOCK NOW</strong>, amarka ammaanka wuxuu toos ugu dhacayaa nidaamka Firestore oo ilaa <strong>1 sekand</strong> ku gaaraya telefoonka ardayga.
            </p>

            <div className="space-y-2 pt-2">
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-900 block">✓ In-App Fullscreen Lockdown:</span>
                <p className="text-slate-600">
                  Ardayga shaashaddiisu waxay isu baddalaysaa "Device Locked", mana geli karo qaybaha kale ee app-ka inta waalidku ka furayo ama Parent PIN lagu furayo.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-900 block">✓ Emergency Functions Unlocked:</span>
                <p className="text-slate-600">
                  Dhammaan wicitaannada degdegga ah (112) iyo wicitaanka nambarkaaga waalidnimo lagama xiri karo telefoonka marka loo eego sharciga Android.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULED LOCK */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Jadwalka Xiritaanka Otomaatiga Ah (Scheduled Lock)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Deji waqtiga telefoonku si otomaatig ah u xirmo (LOCK) iyo waqtiga uu fali karo (UNLOCK).
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <span className="text-xs font-bold text-slate-700 px-2">Scheduled Lock:</span>
              <button
                onClick={() => {
                  const updated = { ...deviceState, scheduledLockEnabled: !deviceState.scheduledLockEnabled };
                  updateDeviceState(updated, `Scheduled lock toggled to ${!deviceState.scheduledLockEnabled}`);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  deviceState.scheduledLockEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {deviceState.scheduledLockEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Lock Schedule Input */}
            <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Waqtiga Xiritaanka (LOCK TIME)</span>
              </div>
              <p className="text-xs text-slate-600">
                Waqtiga maalinlaha ah ee telefoonka ardayga si otomaatig ah loogu xirayo:
              </p>
              <input
                type="time"
                value={deviceState.scheduleLockTime}
                onChange={(e) => {
                  const updated = { ...deviceState, scheduleLockTime: e.target.value };
                  updateDeviceState(updated, `Schedule Lock Time updated to ${e.target.value}`);
                }}
                className="w-full px-4 py-3 bg-white border border-rose-300 rounded-xl font-mono text-lg font-bold text-rose-950 focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <span className="text-[11px] text-rose-700 font-bold block">Tusaale: 18:00 (06:00 PM) → LOCK</span>
            </div>

            {/* Unlock Schedule Input */}
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>Waqtiga Furitaanka (UNLOCK TIME)</span>
              </div>
              <p className="text-xs text-slate-600">
                Waqtiga maalinlaha ah ee telefoonka si otomaatig ah loogu furayo:
              </p>
              <input
                type="time"
                value={deviceState.scheduleUnlockTime}
                onChange={(e) => {
                  const updated = { ...deviceState, scheduleUnlockTime: e.target.value };
                  updateDeviceState(updated, `Schedule Unlock Time updated to ${e.target.value}`);
                }}
                className="w-full px-4 py-3 bg-white border border-emerald-300 rounded-xl font-mono text-lg font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[11px] text-emerald-700 font-bold block">Tusaale: 20:00 (08:00 PM) → UNLOCK</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">💡 Sida uu u shaqeeyo Scheduled Lock:</span>
            <p>
              Sahaa maalin kasta markay gaarto <strong>{deviceState.scheduleLockTime}</strong>, telefoonka ardaygu wuxuu si otomaatig ah u xirmayaa (LOCK) xataa haddii app-ku uu background ku jiro ama la dib u furo. Markay gaarto <strong>{deviceState.scheduleUnlockTime}</strong> wuu furmayaa.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: STUDY MODE */}
      {activeTab === 'studymode' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Mode-ka Waxbarashada (STUDY MODE)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Xaddid isticmaalka apps-ka ciyaaraha inta ardaygu xifdinayo ama dib u egeyo casharradiisa.
              </p>
            </div>

            <button
              onClick={() => handleToggleStudyMode(!deviceState.studyModeActive)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-colors cursor-pointer ${
                deviceState.studyModeActive
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-indigo-600 text-white shadow-md'
              }`}
            >
              {deviceState.studyModeActive ? '🛑 STOP STUDY MODE' : '📚 START STUDY MODE'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleToggleStudyMode(true, 1)}
              className="p-5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl text-left space-y-2 cursor-pointer transition-transform active:scale-95"
            >
              <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black text-[10px] rounded-md uppercase">
                1 Saac
              </span>
              <h4 className="font-black text-slate-900 text-sm">Waxbarasho Gaaban</h4>
              <p className="text-xs text-slate-600">Dhaqaaji Study Mode mudo 1 saac ah (60 Mins).</p>
            </button>

            <button
              onClick={() => handleToggleStudyMode(true, 2)}
              className="p-5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left space-y-2 cursor-pointer transition-transform active:scale-95"
            >
              <span className="px-2.5 py-0.5 bg-amber-600 text-white font-black text-[10px] rounded-md uppercase">
                2 Saacadood
              </span>
              <h4 className="font-black text-slate-900 text-sm">Fasal Sabqi / Subax</h4>
              <p className="text-xs text-slate-600">Dhaqaaji Study Mode mudo 2 saacadood ah (Standard).</p>
            </button>

            <button
              onClick={() => handleToggleStudyMode(true, 4)}
              className="p-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left space-y-2 cursor-pointer transition-transform active:scale-95"
            >
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded-md uppercase">
                4 Saacadood
              </span>
              <h4 className="font-black text-slate-900 text-sm">Maalin Dhab ah</h4>
              <p className="text-xs text-slate-600">Dhaqaaji Study Mode mudo 4 saacadood oo buuxa ah.</p>
            </button>
          </div>

          {/* Active Study Mode Status Banner */}
          {deviceState.studyModeActive && (
            <div className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-800 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
                <BookOpen className="w-5 h-5" />
                <span>STUDY MODE IS ACTIVE CURRENTLY</span>
              </div>
              <p className="text-xs text-indigo-200">
                Waqtiga uu ku geshay Study Mode waa shaqaynayaa. App-ka Machadka Tahdiibul Adfaal oo keliya ayaa loo oggol yahay inuu fali karo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: APP CONTROL */}
      {activeTab === 'appcontrol' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              <span>Maamulida & Xannibaadda Apps-ka (App Control Panel)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Deji xaaladda app kasta oo ku jira telefoonka ilmahaaga: Allowed, Restricted, ama Blocked.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {deviceState.appControlRules.map((rule) => (
              <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{rule.appName}</h4>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] rounded-md">
                      {rule.packageName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Qaybta: {rule.category}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAppRuleStatusChange(rule.id, 'Allowed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rule.status === 'Allowed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Allowed
                  </button>

                  <button
                    onClick={() => handleAppRuleStatusChange(rule.id, 'Restricted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rule.status === 'Restricted'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Restricted
                  </button>

                  <button
                    onClick={() => handleAppRuleStatusChange(rule.id, 'Blocked')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rule.status === 'Blocked'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Blocked
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PARENT PIN */}
      {activeTab === 'pin' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs max-w-xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Beddel PIN-ka Waalidka (Parent PIN)</h3>
            <p className="text-xs text-slate-500">
              PIN-kani wuxuu ka ilaalinayaa ilmahaaga inuu beddelo dejimaha xakameynta ama uu manuuca ka furo shaashadda lock-ga.
            </p>
          </div>

          <form onSubmit={handleChangePin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PIN-kaaga Hadda (Current PIN)
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PIN Cusub (New PIN)
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Xaqiiji PIN-ka Cusub (Confirm New PIN)
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {pinChangeError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {pinChangeError}
              </p>
            )}

            {pinChangeSuccess && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                {pinChangeSuccess}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Keydi PIN-ka Cusub</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: DIAGNOSTICS TOOL */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Device Control Diagnostics Suite</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tijaabi oo hubi dhammaan permissions-ka, background services-ka iyo xiriirka ammaan ee telefoonka.
              </p>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={isRunningDiagnostics}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
              <span>{isRunningDiagnostics ? 'Hubinayaa...' : 'Run Diagnostics Now'}</span>
            </button>
          </div>

          {diagnosticsResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Notification Permission */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Notification Permission</span>
                  {diagnosticsResult.notificationPermission === 'PASS' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-md">FAIL</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{diagnosticsResult.details.notification}</p>
              </div>

              {/* Card 2: Background Service */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Background Worker</span>
                  {diagnosticsResult.backgroundService === 'PASS' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-md">FAIL</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{diagnosticsResult.details.backgroundService}</p>
              </div>

              {/* Card 3: Lock Capability */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Lock Capability</span>
                  {diagnosticsResult.lockCapability === 'PASS' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-md">FAIL</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{diagnosticsResult.details.lockCapability}</p>
              </div>

              {/* Card 4: Device Admin */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Android Device Admin</span>
                  {diagnosticsResult.deviceAdmin === 'PASS' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">REQUIRED FOR APK</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{diagnosticsResult.details.deviceAdmin}</p>
              </div>

              {/* Card 5: Device Owner */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Device Owner (Kiosk MDM)</span>
                  {diagnosticsResult.deviceOwner === 'PASS' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">REQUIRED FOR ADB</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{diagnosticsResult.details.deviceOwner}</p>
              </div>

              {/* Card 6: Accessibility Service */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Accessibility Service</span>
                  {diagnosticsResult.accessibilityService === 'PASS' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">REQUIRED FOR APK</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">{diagnosticsResult.details.accessibilityService}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: SAMSUNG GALAXY A15 & ANTI-BYPASS GUIDE */}
      {activeTab === 'antibypass' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-900" />
              <span>Samsung Galaxy A15 Setup & Anti-bypass Technical Guide</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sharaxaad dhab ah oo ku saabsan sida loogu xiro Device Owner ADB amarka Galaxy A15 iyo ilaalinta bypass-ka.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2 font-mono">
              <span className="text-amber-400 font-bold block">1. ADB Command for Device Owner (Samsung Galaxy A15):</span>
              <p className="text-slate-300">
                Adoo adeegsanaya kombuyuutar ama Android Studio, geli amarkan ADB si aad app-ka ugu siiso awoodda Device Owner iyadoo la adeegsanayo USB Debugging:
              </p>
              <div className="bg-black p-3 rounded-xl border border-slate-800 text-emerald-400 select-all">
                adb shell dpm set-device-owner com.tahdiib.mis/.DeviceAdminRcvr
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-sm block">Samsung One UI Battery Restrictions:</span>
                <p>
                  Galaxy A15-ka, tag: <strong>Settings → Apps → Tahdiibul Adfaal → Battery → dooro "Unrestricted"</strong> si Samsung uusan u dilin background worker-ka inta telefoonku hurdo.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-sm block">Anti-Bypass Protection Vectors:</span>
                <p>
                  Markii Device Owner la gashado APK-ga, Android-ku wuxuu si otomaatig ah u xirayaa: <strong>Force Stop, Uninstall, Settings Reset, Safe Mode, App Data Clear</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
