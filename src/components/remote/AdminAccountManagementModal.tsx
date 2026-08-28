import React, { useState } from 'react';
import { X, UserCheck, Key, ShieldCheck, CreditCard, BookOpen, AlertCircle, CheckCircle2, Lock, RefreshCw, Trash2, Power } from 'lucide-react';
import { RemoteRegistration, User, Student, OnlineAccountStatus } from '../../types';
import { Storage } from '../../lib/storage';
import { hashPassword } from '../../lib/hashUtils';
import { saveItemToFirestore, COLLECTIONS } from '../../lib/firebase';

interface AdminAccountManagementModalProps {
  isOpen: boolean;
  registration: RemoteRegistration | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const AdminAccountManagementModal: React.FC<AdminAccountManagementModalProps> = ({
  isOpen,
  registration,
  onClose,
  onUpdate,
}) => {
  if (!isOpen || !registration) return null;

  const [username, setUsername] = useState(registration.username || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [studentId, setStudentId] = useState(registration.studentId || '');
  const [assignedClass, setAssignedClass] = useState(registration.assignedClassName || registration.gradeLevel || 'Fasalka 1-aad');
  const [role, setRole] = useState<'student' | 'parent'>(registration.role || 'student');
  const [status, setStatus] = useState<OnlineAccountStatus>(registration.status);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // SAVE CHANGES
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const userTrim = username.trim().toLowerCase();
    const stuIdTrim = studentId.trim().toUpperCase();

    if (!userTrim || !stuIdTrim) {
      setErrorMessage('Username iyo Student ID lama bannayn karo.');
      return;
    }

    // DUPLICATE CHECK
    const currentUsers = Storage.getUsers();
    const currentRegs = Storage.getRemoteRegistrations();

    if (userTrim !== (registration.username || '').toLowerCase()) {
      const dupUser = currentUsers.find((u) => u.username && u.username.toLowerCase() === userTrim && u.id !== registration.createdUserId);
      const dupReg = currentRegs.find((r) => r.id !== registration.id && r.username && r.username.toLowerCase() === userTrim);
      if (dupUser || dupReg) {
        setErrorMessage('Xogtan (Username-kan) hore ayaa loogu diiwaangeliyay nidaamka. Fadlan la xiriir Maamulka Machadka.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let updatedHash = registration.passwordHash;
      let plainPass = registration.passwordPlainForAdmin;

      if (passwordInput.trim()) {
        updatedHash = await hashPassword(passwordInput.trim());
        plainPass = passwordInput.trim();
      }

      const updatedReg: RemoteRegistration = {
        ...registration,
        username: userTrim,
        passwordHash: updatedHash,
        passwordPlainForAdmin: plainPass,
        studentId: stuIdTrim,
        assignedClassName: assignedClass,
        role: role,
        status: status,
        reviewedBy: 'Admin',
        reviewedAt: new Date().toISOString(),
      };

      // Update in storage
      const regs = Storage.getRemoteRegistrations();
      const newRegs = regs.map((r) => (r.id === registration.id ? updatedReg : r));
      Storage.saveRemoteRegistrations(newRegs);
      saveItemToFirestore(COLLECTIONS.REMOTE_REGISTRATIONS, updatedReg).catch(() => {});

      // Update User if exists
      if (registration.createdUserId) {
        const users = Storage.getUsers();
        const updatedUsers = users.map((u) => {
          if (u.id === registration.createdUserId) {
            return {
              ...u,
              username: userTrim,
              password: updatedHash || u.password,
              role: role as any,
              status: status === 'Active' ? ('Active' as const) : ('Blocked' as const),
              studentId: stuIdTrim,
            };
          }
          return u;
        });
        Storage.saveUsers(updatedUsers);
      }

      setSuccessMessage('✅ Isbeddellada akoonka si guul leh ayaa loo kaydiyay!');
      setPasswordInput('');
      onUpdate();
    } catch (err: any) {
      setErrorMessage(err.message || 'Cillad ayaa dhacday.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // TOGGLE SUSPEND / REACTIVATE
  const handleToggleStatus = async (newStatus: 'Active' | 'Suspended') => {
    setStatus(newStatus);
    const regs = Storage.getRemoteRegistrations();
    const updatedReg: RemoteRegistration = {
      ...registration,
      status: newStatus,
      reviewedBy: 'Admin',
      reviewedAt: new Date().toISOString(),
    };
    const newRegs = regs.map((r) => (r.id === registration.id ? updatedReg : r));
    Storage.saveRemoteRegistrations(newRegs);

    if (registration.createdUserId) {
      const users = Storage.getUsers();
      const updatedUsers = users.map((u) =>
        u.id === registration.createdUserId
          ? { ...u, status: newStatus === 'Active' ? ('Active' as const) : ('Blocked' as const) }
          : u
      );
      Storage.saveUsers(updatedUsers);
    }

    onUpdate();
    setSuccessMessage(`✅ Status-ka akoonka waxaa loo beddelay: ${newStatus.toUpperCase()}`);
  };

  // DELETE ACCOUNT
  const handleDeleteAccount = () => {
    if (!window.confirm(`Ma ziirtaa inaad tirtirto akoonka ${registration.fullName}? Action-kan tilmaami karo dib looma soo celin karo.`)) {
      return;
    }

    const regs = Storage.getRemoteRegistrations().filter((r) => r.id !== registration.id);
    Storage.saveRemoteRegistrations(regs);

    if (registration.createdUserId) {
      const users = Storage.getUsers().filter((u) => u.id !== registration.createdUserId);
      Storage.saveUsers(users);
    }

    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black">MAAMUL AKOONKA (ACCOUNT MANAGEMENT)</h2>
              <p className="text-xs text-slate-300 mt-0.5">{registration.fullName}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveChanges} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Status Control Bar */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Status-ka Hadda:</div>
              <span
                className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'Suspended'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {status === 'Active' ? (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('Suspended')}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>SUSPEND ACCOUNT</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('Active')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>REACTIVATE ACCOUNT</span>
                </button>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Change Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reset Password (Bannac haddii aadan beddelayn)
              </label>
              <input
                type="text"
                placeholder="Geli password cusub si aad u badasho..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Student ID</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Class</label>
                <select
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Fasalka 1-aad">Fasalka 1-aad</option>
                  <option value="Fasalka 2-aad">Fasalka 2-aad</option>
                  <option value="Fasalka 3-aad">Fasalka 3-aad</option>
                  <option value="Fasalka 4-aad">Fasalka 4-aad</option>
                  <option value="Fasalka 5-aad">Fasalka 5-aad</option>
                  <option value="Fasalka 6-aad">Fasalka 6-aad</option>
                  <option value="Fasalka 7-aad">Fasalka 7-aad</option>
                  <option value="Fasalka 8-aad">Fasalka 8-aad</option>
                  <option value="Fasalka Hifdiga">Fasalka Hifdiga Qur'aanka</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2 rounded-xl border-2 font-bold ${
                    role === 'student' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                  }`}
                >
                  Student (Arday)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`p-2 rounded-xl border-2 font-bold ${
                    role === 'parent' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                  }`}
                >
                  Parent (Waalid)
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE ACCOUNT</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
              >
                Kanasal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-800 text-white rounded-xl font-black hover:bg-emerald-900 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                SAVE CHANGES 💾
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
