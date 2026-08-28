import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, User as UserIcon, X, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

interface ChangeProfileModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const ChangeProfileModal: React.FC<ChangeProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser,
}) => {
  const [username, setUsername] = useState(currentUser.username);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync component form state whenever modal opens or currentUser changes
  React.useEffect(() => {
    if (isOpen) {
      setUsername(currentUser.username || '');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Fadlan geli Username sax ah.');
      return;
    }

    const currentPass = currentUser.password || '';

    // Verify old password if password is being changed
    if (newPassword || confirmPassword) {
      if (currentPass && !oldPassword) {
        setError('Fadlan geli Nambarsireedkaagii Hore (Old Password) si aad u xaqiijiso.');
        return;
      }
      if (currentPass && oldPassword !== currentPass) {
        setError('Nambarsireedka hore (Old Password) waa meel lagu qalday!');
        return;
      }
      if (newPassword.length < 3) {
        setError('Password-ka cusub waa inuu ka badan yahay 3 xaraf.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Password-ka cusub iyo kan loo celiyay ma isfogaadaan (Don\'t match)!');
        return;
      }
    } else if (oldPassword && currentPass && oldPassword !== currentPass) {
      setError('Nambarsireedka hore (Old Password) waa meel lagu qalday!');
      return;
    }

    const updated: User = {
      ...currentUser,
      username: cleanUsername,
      password: newPassword ? newPassword.trim() : currentPass,
    };

    try {
      onUpdateUser(updated);
      setSuccess('✅ Username-ka iyo Password-ka waa la beddelay si guul leh!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setError('Cillad ayaa dhacday marka la kaydinayay xogta. Fadlan dib u tijaabi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e7a48] text-white">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h3 className="font-extrabold text-sm">Beddel Username & Password</h3>
              <p className="text-[10px] text-emerald-100">Cusboonaysii akoonkaaga galitaanka</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card summary */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Akoonka Hadda: </span>
            <span className="font-black text-slate-800">{currentUser.name}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
            {currentUser.role}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Magaca Galitaanka (Username-ka Cusub) *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48] font-bold text-slate-800"
                placeholder="Geli Username-ka cusub..."
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Username-kan ayaad ku soo geli doontaa app-ka.</p>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-[11px] font-bold text-[#0e7a48] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Beddelka Nambarsireedka (Password Change):</span>
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Password-ka Hadda (Old Password)
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
                  placeholder="Geli nambarsireedkaagii hore"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Password-ka Cusub
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
                    placeholder="Password cusub"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ku Celi Password-ka
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
                    placeholder="Ku celi password-ka"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Kanasal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
              <span>Keydi Username-ka & Password-ka</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
