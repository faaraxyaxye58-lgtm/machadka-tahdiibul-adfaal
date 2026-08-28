import React, { useState } from 'react';
import { User, SchoolSettings, PrivacyPermissions } from '../types';
import {
  Lock,
  Unlock,
  ShieldCheck,
  UserCheck,
  X,
  Users,
  BookOpen,
  DollarSign,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { logAuditAction } from '../lib/auditLogger';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users?: User[];
  settings: SchoolSettings;
  onSaveSettings: (newSettings: SchoolSettings) => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users = [],
  settings,
  onSaveSettings,
  onUpdateUser,
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState<'teacher' | 'parent' | 'finance' | 'admin' | 'user_specific'>('teacher');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [permissions, setPermissions] = useState<PrivacyPermissions>(
    settings.privacyPermissions || {}
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleToggle = (key: keyof PrivacyPermissions, value: any) => {
    const updated = { ...permissions, [key]: value };
    setPermissions(updated);
    const updatedSettings: SchoolSettings = {
      ...settings,
      privacyPermissions: updated,
    };
    onSaveSettings(updatedSettings);

    setSaveSuccessMsg('Awoodda waa la cusboonaysiiyay!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);

    logAuditAction(
      currentUser,
      'Awoodaha Isticmaalayaasha La Beddelay',
      'settings',
      `Waxaa la beddelay awoodda "${String(key)}" oo loo dhigay ${JSON.stringify(value)}.`
    );
  };

  const handleMultipleToggle = (updates: Partial<PrivacyPermissions>) => {
    const updated = { ...permissions, ...updates };
    setPermissions(updated);
    const updatedSettings: SchoolSettings = {
      ...settings,
      privacyPermissions: updated,
    };
    onSaveSettings(updatedSettings);

    setSaveSuccessMsg('Awoodaha waa la cusboonaysiiyay!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);

    logAuditAction(
      currentUser,
      'Awoodaha Isticmaalayaasha La Beddelay',
      'settings',
      `Waxaa la beddelay awoodaha: ${Object.keys(updates).join(', ')}.`
    );
  };

  const handleUnlockAll = () => {
    const unlockedPermissions: PrivacyPermissions = {
      allowTeacherTakeAttendance: true,
      restrictTeacherEditAttendance: false,
      restrictTeacherEditHifz: false,
      restrictTeacherToAssignedClassOnly: false,
      restrictParentToOwnChildrenOnly: false,
      hideExamsFromParents: false,
      hideTeacherSalary: false,
      hideFinancialTotals: false,
      restrictClassAndTeacherEditingToAdmin: false,
      hiddenTabsByRole: {
        teacher: [],
        parent: [],
        finance: [],
      },
    };

    setPermissions(unlockedPermissions);
    const updatedSettings: SchoolSettings = {
      ...settings,
      privacyPermissions: unlockedPermissions,
    };
    onSaveSettings(updatedSettings);

    setSaveSuccessMsg('🎉 Dhammaan awoodaha dhammaan isticmaalayaasha waa la furay (Unlocked All)!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);

    logAuditAction(
      currentUser,
      'Soo Furista Dhammaan Awoodaha',
      'settings',
      'Admin-ku wuxuu si buuxda u furay dhammaan awoodaha macallimiinta, waalidiinta, iyo maaliyadda.'
    );
  };

  const handleResetDefaults = () => {
    const defaultPermissions: PrivacyPermissions = {
      allowTeacherTakeAttendance: true,
      restrictTeacherEditAttendance: false,
      restrictTeacherEditHifz: false,
      restrictTeacherToAssignedClassOnly: true,
      restrictParentToOwnChildrenOnly: true,
      hideExamsFromParents: false,
      hideTeacherSalary: false,
      hideFinancialTotals: false,
    };

    setPermissions(defaultPermissions);
    const updatedSettings: SchoolSettings = {
      ...settings,
      privacyPermissions: defaultPermissions,
    };
    onSaveSettings(updatedSettings);

    setSaveSuccessMsg('Dhaqan-gelintii hore ee awoodaha waa la soo celiyay!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Helper badge for current status
  const isTeacherAttendanceUnlocked =
    permissions.allowTeacherTakeAttendance !== false && !permissions.restrictTeacherEditAttendance;
  const isTeacherHifzUnlocked = !permissions.restrictTeacherEditHifz;
  const isParentExamsUnlocked = !permissions.hideExamsFromParents;
  const isFinanceTotalsUnlocked = !permissions.hideFinancialTotals;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="bg-emerald-950 p-4 sm:p-6 text-white border-b border-amber-400/40 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white bg-emerald-900/60 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer"
            title="Xir"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#d4af37] to-amber-500 text-slate-950 rounded-2xl shadow-lg shrink-0">
              <Zap className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#d4af37]">
                  Maamulida & Furista Awoodaha Isticmaalayaasha
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-amber-300 border border-emerald-600">
                  User Permissions
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Ka kantarool awoodaha ay leeyihiin Macallimiinta, Waalidiinta, iyo Maaliyadda. Waa lagu furi karaa ama lagu xiri karaa badhan hal klik ah.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons Bar for Admin */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-emerald-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUnlockAll}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-[#d4af37] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-amber-300"
                >
                  <Unlock className="w-4 h-4 text-slate-950" />
                  <span>🔓 FUR DHAMMAAN AWOODAHA (UNLOCK ALL)</span>
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="px-3 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-700 active:scale-95"
                  title="Soo celi qaabkii hore"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Dhaqangalkii Hore</span>
                </button>
              </div>

              {saveSuccessMsg && (
                <span className="text-xs font-black text-amber-300 bg-emerald-900/90 px-3 py-1.5 rounded-xl border border-amber-400/50 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{saveSuccessMsg}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Logged in User Current Role Summary Banner */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#0e7a48]" />
            <span className="font-bold text-slate-700">Akoonkaada Hadda:</span>
            <span className="font-black text-slate-900">{currentUser.name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              {currentUser.role}
            </span>
          </div>

          <div className="text-slate-500 text-[11px] font-medium">
            {!isAdmin && (
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-700" />
                <span>Kaliye Admin-ka ayaa beddeli kara awoodaha.</span>
              </span>
            )}
            {isAdmin && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Waxaad tahay Maamule (Admin) - Awood buuxda ayaa leedahay.</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body: Role Tabs & Toggle Lists */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Role Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveRoleTab('teacher')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeRoleTab === 'teacher'
                  ? 'bg-[#0e7a48] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>👨‍🏫 Macallimiinta (Teachers)</span>
              {isTeacherAttendanceUnlocked && isTeacherHifzUnlocked ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => setActiveRoleTab('parent')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeRoleTab === 'parent'
                  ? 'bg-[#0e7a48] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>👨‍👩‍👧 Waalidiinta (Parents)</span>
              {isParentExamsUnlocked ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => setActiveRoleTab('finance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeRoleTab === 'finance'
                  ? 'bg-[#0e7a48] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>💼 Maaliyadda (Finance)</span>
              {isFinanceTotalsUnlocked ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => setActiveRoleTab('user_specific')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeRoleTab === 'user_specific'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <Lock className="w-4 h-4 text-rose-300" />
              <span>👤 Xiritaanka Lacagaha (Qof-Qof)</span>
            </button>

            <button
              onClick={() => setActiveRoleTab('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeRoleTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>👑 Maamulaha (Admin)</span>
            </button>
          </div>

          {/* TAB 1: TEACHER PERMISSIONS */}
          {activeRoleTab === 'teacher' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-900">
                  Xaaladda Awoodaha Macallimiinta Hadda:
                </span>
                <span className="font-mono font-bold text-[#0e7a48] flex items-center gap-1">
                  {isTeacherAttendanceUnlocked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Xaadirinta waa furan tahay (Unlocked)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Xaadirinta waa xiran tahay (Locked)</span>
                    </>
                  )}
                </span>
              </div>

              {/* Toggle Item 1: Attendance */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      1. Xaadirinta Ardayda (Mark Student Attendance)
                    </span>
                    {isTeacherAttendanceUnlocked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FURAN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        XIRAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    U ogolaaw macallimiinta inay xaadiriyaan oo keydiyaan xaadiriska maalinlahay ee ardayda fasalkooda.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={isTeacherAttendanceUnlocked}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      handleMultipleToggle({
                        allowTeacherTakeAttendance: isChecked,
                        restrictTeacherEditAttendance: !isChecked,
                        restrictClassAndTeacherEditingToAdmin: !isChecked,
                        restrictTeacherAttendanceToAdmin: !isChecked,
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>

              {/* Toggle Item 2: Hifz Progress Editing */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      2. Diiwaangelinta Hifdiga Quraanka (Record Quran Hifz Progress)
                    </span>
                    {!permissions.restrictTeacherEditHifz ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FURAN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        XIRAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    U ogolaaw macallimiinta inay dhibco ama casharro Hifdi ah u qoraan ardayda.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={!permissions.restrictTeacherEditHifz}
                    onChange={(e) => handleToggle('restrictTeacherEditHifz', !e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>

              {/* Toggle Item 3: Class Isolation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      3. Asturnaanta Fasalka (Restrict to Assigned Class Only)
                    </span>
                    {permissions.restrictTeacherToAssignedClassOnly !== false ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                        SIRTII GAAR
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        DHAMMAAN FASALLADA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Marka ay furan tahay (Sirtii Gaar ah), macallinku wuxuu arkaa oo kaliya fasalkiisa. Marka la ka saaro, dhammaan fasallada wuu arki karaa.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={permissions.restrictTeacherToAssignedClassOnly !== false}
                    onChange={(e) => handleToggle('restrictTeacherToAssignedClassOnly', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PARENT PERMISSIONS */}
          {activeRoleTab === 'parent' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-extrabold text-blue-900">
                  Awoodaha Waalidiinta ee App-ka Mobile-ka & Web-ka:
                </span>
                <span className="font-mono font-bold text-blue-800">
                  {isParentExamsUnlocked ? 'Imtixaanaadku waa muuqdaan' : 'Imtixaanaadku waa qarsan yihiin'}
                </span>
              </div>

              {/* Toggle Item 1: View Exams */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      1. Aragga Natiijooyinka Imtixaanaadka (View Exam Scores)
                    </span>
                    {!permissions.hideExamsFromParents ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FURAN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        QARSAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    U ogolaaw waalidiinta inay arkaan natiijada iyo kaarka imtixaanaadka caruurtooda.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={!permissions.hideExamsFromParents}
                    onChange={(e) => handleToggle('hideExamsFromParents', !e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>

              {/* Toggle Item 2: Restrict Parent to Own Children */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      2. Kaliya Caruurtiisa Gaarka Ah (Restrict Parent to Own Children)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                      AAN TIRTIRMI KARIN (SAFE)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Waalidku wuxuu si toos ah u arkaa oo kaliya ardayda magaciisa ama taleefankiisa ku xiran.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={permissions.restrictParentToOwnChildrenOnly !== false}
                    onChange={(e) => handleToggle('restrictParentToOwnChildrenOnly', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCE PERMISSIONS */}
          {activeRoleTab === 'finance' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-900">
                  Awoodaha Qaybta Maaliyadda (Finance User Permissions):
                </span>
                <span className="font-mono font-bold text-amber-900">
                  {!permissions.hideFinancialTotals ? 'Wadarta Maaliyadda Waa Furan tahay' : 'Wadarta Maaliyadda Waa Qarsan tahay'}
                </span>
              </div>

              {/* Toggle Item 1: Hide Financial Totals */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      1. Aragga Wadarta Guud ee Lacagaha Machadka (View Total Revenue)
                    </span>
                    {!permissions.hideFinancialTotals ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FURAN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        QARSAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Gudbi ama muuji wadarta guud ee dakhliga machadka.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={!permissions.hideFinancialTotals}
                    onChange={(e) => handleToggle('hideFinancialTotals', !e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>

              {/* Toggle Item 2: Teacher Salary Visibility */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      2. Aragga Mushaaraadka Macallimiinta (View Teacher Salaries)
                    </span>
                    {!permissions.hideTeacherSalary ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FURAN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        QARSAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Muuji inta uu macallin kasta mushaar u leeyahay.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={!permissions.hideTeacherSalary}
                    onChange={(e) => handleToggle('hideTeacherSalary', !e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>

              {/* Toggle Item 3: Hide Payments Tab Globally (Dhammaan) */}
              <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      3. Xiritaanka Bogga Lacagaha (Dhammaan Isticmaalayaasha Aan Admin Ahayn)
                    </span>
                    {permissions.hidePaymentsGlobal ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-200 text-rose-950 border border-rose-400">
                        XIRAN (BLOCKED)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        FURAN (ALLOWED)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Xir bogga Lacagaha (Payments) dhammaan isticmaalayaasha aan Admin ahayn mar qof walba (Global block).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={!!permissions.hidePaymentsGlobal}
                    onChange={(e) => handleToggle('hidePaymentsGlobal', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3.5: USER-SPECIFIC PAYMENTS RESTRICTION (Qof-Qof) */}
          {activeRoleTab === 'user_specific' && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span>🔒 Xiritaanka Ogolaanshaha Lacagaha (Qof-Qof / Individual Restrict):</span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px]">
                    {users.filter(u => u.hidePaymentsAccess).length} Isticmaale ayaan Lacagaha arki karin
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Halkan waxaad uga xiri kartaa ama uga furi kartaa helitaanka bogga Lacagaha (Payments) isticmaale kasta si gaar ah (Qof Qof). Qofka aad ka xirto ma arki karo bogga ama tirooyinka lacagaha.
                </p>
                <input
                  type="text"
                  placeholder="Ka raadi magac ama username..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto p-1">
                {users
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
                  )
                  .map((usr) => {
                    const isUserBlocked = !!usr.hidePaymentsAccess;
                    return (
                      <div
                        key={usr.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isUserBlocked
                            ? 'bg-rose-50/80 border-rose-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">{usr.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              {usr.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate font-mono">@{usr.username}</p>
                        </div>

                        {usr.role === 'admin' ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black shrink-0">
                            👑 Admin Full Access
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => {
                              if (!onUpdateUser) return;
                              const updatedUser: User = {
                                ...usr,
                                hidePaymentsAccess: !isUserBlocked,
                              };
                              onUpdateUser(updatedUser);
                              setSaveSuccessMsg(
                                !isUserBlocked
                                  ? `🔒 Lacagaha waa ka xiran yihiin ${usr.name}`
                                  : `💳 Lacagaha waa u furan yihiin ${usr.name}`
                              );
                              setTimeout(() => setSaveSuccessMsg(''), 2500);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                              isUserBlocked
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{isUserBlocked ? 'Xiran (Block)' : 'Furan (Allow)'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN ROLE SUMMARY & DASHBOARD PROTECTION */}
          {activeRoleTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      🛡️ Qari Admin Dashboard-ka Ka dib Isticmaalayaasha
                    </span>
                    {permissions.hideAdminDashboardFromUsers ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        QARSAN (HIDDEN)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        MUUQDA (VISIBLE)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Sidoo kale waxay ka qarineysaa Dashboard-ka maamulka (Admin Dashboard) dhammaan isticmaalayaasha aan admin-ka ahayn.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={!!permissions.hideAdminDashboardFromUsers}
                    onChange={(e) => handleToggle('hideAdminDashboardFromUsers', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7a48]"></div>
                </label>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl border border-amber-400/40 space-y-3">
                <div className="flex items-center gap-2 text-[#d4af37]">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="font-extrabold text-base">Awoodaha Maamulaha Guud (Master Admin Permissions)</h3>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Maamuluhu (Admin) wuxuu leeyahay awood buuxda oo 100% ah oo uu ku maamulo dhammaan qaybaha nidaamka:
                </p>
                <ul className="text-xs text-amber-200/90 space-y-1.5 pl-4 list-disc font-medium">
                  <li>Baddalida ama furista awoodaha macallimiinta, waalidiinta, iyo maaliyadda.</li>
                  <li>Diiwaangelinta, beddelida, ama tirtiridda ardayda, macallimiinta, fasallada, iyo akoonnada.</li>
                  <li>Eegista dhammaan Audit Logs-ka iyo taariikhda falallada lagu sameeyay nidaamka.</li>
                  <li>Baddalida dejimaha machadka iyo magaca machadka.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Tahdiib Adfaal MIS Permission System v2.8
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Waad Mahadsan Tahay (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
