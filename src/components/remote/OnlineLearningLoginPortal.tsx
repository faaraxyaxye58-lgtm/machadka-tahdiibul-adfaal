import React, { useState } from 'react';
import { BookOpen, UserCheck, Key, LogIn, UserPlus, AlertCircle, ShieldCheck, CheckCircle2, Search, Clock, Lock } from 'lucide-react';
import { User, RemoteRegistration } from '../../types';
import { Storage } from '../../lib/storage';
import { verifyPassword } from '../../lib/hashUtils';

interface OnlineLearningLoginPortalProps {
  onLoginSuccess: (user: User) => void;
  onOpenRegisterModal: () => void;
}

export const OnlineLearningLoginPortal: React.FC<OnlineLearningLoginPortalProps> = ({
  onLoginSuccess,
  onOpenRegisterModal,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status Lookup State (by phone or username)
  const [searchPhone, setSearchPhone] = useState('');
  const [statusSearchResult, setStatusSearchResult] = useState<RemoteRegistration | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userInput = username.trim().toLowerCase();
    const passInput = password.trim();

    if (!userInput || !passInput) {
      setErrorMessage('Fadlan geli Username-ka iyo Password-ka.');
      return;
    }

    setIsSubmitting(true);

    try {
      const registrations = Storage.getRemoteRegistrations();
      const users = Storage.getUsers();

      // 1. Search in RemoteRegistrations
      const matchedReg = registrations.find(
        (r) =>
          (r.username && r.username.toLowerCase() === userInput) ||
          (r.phone && r.phone.replace(/\D/g, '').includes(userInput.replace(/\D/g, '')) && userInput.length >= 6) ||
          (r.studentId && r.studentId.toLowerCase() === userInput)
      );

      // 2. Search in Users list
      const matchedUser = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === userInput) ||
          (u.email && u.email.toLowerCase() === userInput) ||
          (u.phone && u.phone.replace(/\D/g, '').includes(userInput.replace(/\D/g, '')) && userInput.length >= 6)
      );

      // Evaluate status if registration or user found
      const activeStatus = matchedReg ? matchedReg.status : matchedUser ? (matchedUser.status === 'Blocked' ? 'Suspended' : 'Active') : null;

      if (matchedReg) {
        if (matchedReg.status === 'Pending') {
          setErrorMessage('“Codsigaaga wali wuxuu sugayaa oggolaanshaha Maamulka Machadka.”');
          setIsSubmitting(false);
          return;
        }

        if (matchedReg.status === 'Rejected') {
          setErrorMessage('“Codsigaaga lama ansixin. Fadlan la xiriir Maamulka Machadka.”');
          setIsSubmitting(false);
          return;
        }

        if (matchedReg.status === 'Suspended') {
          setErrorMessage('“Account-kaaga waa la hakiyay. Fadlan la xiriir Maamulka Machadka.”');
          setIsSubmitting(false);
          return;
        }

        // Verify password
        const isPassValid = await verifyPassword(passInput, matchedReg.passwordHash || matchedReg.passwordPlainForAdmin);
        if (!isPassValid && passInput !== matchedReg.passwordPlainForAdmin) {
          setErrorMessage('Username ama Password waa khalad.');
          setIsSubmitting(false);
          return;
        }

        // Create User Session for logged in user
        const loggedUser: User = {
          id: matchedReg.createdUserId || `usr-${matchedReg.id}`,
          name: matchedReg.fullName,
          username: matchedReg.username || userInput,
          password: matchedReg.passwordHash || '',
          email: `${matchedReg.username || userInput}@online.tahdiib.edu`,
          role: matchedReg.role || 'student',
          phone: matchedReg.phone,
          status: 'Active',
          learningMode: 'remote',
          studentId: matchedReg.studentId,
        };

        onLoginSuccess(loggedUser);
        return;
      }

      // Check standard matched user
      if (matchedUser) {
        if (matchedUser.status === 'Blocked') {
          setErrorMessage('“Account-kaaga waa la hakiyay. Fadlan la xiriir Maamulka Machadka.”');
          setIsSubmitting(false);
          return;
        }

        const isPassValid = await verifyPassword(passInput, matchedUser.password);
        if (!isPassValid && matchedUser.password !== passInput) {
          setErrorMessage('Username ama Password waa khalad.');
          setIsSubmitting(false);
          return;
        }

        onLoginSuccess(matchedUser);
        return;
      }

      setErrorMessage('Username ama Password waa khalad. Haddii aadan wali akoon lahayn, fadlan is-diiwaangeli.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Cillad ayaa dhacday inta lagu jiro loginka.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Search Handler
  const handleStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const query = searchPhone.replace(/\D/g, '');
    if (!query) return;

    const regs = Storage.getRemoteRegistrations();
    const found = regs.find((r) => r.phone && r.phone.replace(/\D/g, '').includes(query));
    setStatusSearchResult(found || null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 px-2">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center space-y-4">
        <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
          <BookOpen className="w-10 h-10 text-emerald-300 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-xl mx-auto">
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
            MACHADKA TAHDIIBUL ADFAAL
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">NIDAAMKA WAXBARASHADA ONLINE-KA (ONLINE LEARNING PORTAL)</h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            Kusoo dhowaw aagga login-ka casharrada fog. Fadlan gali Username-ka iyo Password-ka uu Maamulku kuusiiyay, ama is-diiwaangeli si codsigaaga loo ansixiyo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* CARD 1: OFFICIAL LOGIN FORM */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-xl space-y-6">
          <div className="space-y-1 text-center sm:text-left border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <LogIn className="w-5 h-5 text-emerald-700" />
              <span>GELI AKOONKA (LOGIN)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Geli Username & Password-ka uu Maamulku kuu sameeyay marka codsigaaga la ansixiyay.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-2xl text-xs font-bold leading-relaxed space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Ogeysiis Nidaamka:</span>
              </div>
              <p className="pl-7">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-black text-slate-800 mb-1.5">Username *</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Geli Username-kaaga..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-2xl font-mono text-xs font-bold focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-800 mb-1.5">Password *</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Geli Password-kaaga..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-2xl font-mono text-xs font-bold focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl font-black text-xs shadow-xl hover:from-emerald-900 hover:to-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Waa la xaqiijinayaa...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-emerald-300" />
                  <span>LOGIN (Geli Casharrada)</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600 font-medium">Weli maadan is-diiwaangelin?</p>
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="w-full py-3 border-2 border-emerald-600 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/80 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>📝 ISDIIWAANGELI (DIR CODSI CUSUB)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: CHECK REGISTRATION STATUS & WORKFLOW GUIDE */}
        <div className="space-y-6">
          {/* Status Search Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                🔍 STATUS CHECKER
              </span>
              <h4 className="text-lg font-black text-white">Hubi Xaalada Codsigaaga (Status)</h4>
              <p className="text-xs text-slate-400">
                Geli lambarkaaga telefoonka si aad u ogaato haddii Maamulku ansixiyay codsigaaga.
              </p>
            </div>

            <form onSubmit={handleStatusSearch} className="flex gap-2">
              <input
                type="tel"
                placeholder="+252 61..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                HUBI 🔍
              </button>
            </form>

            {hasSearched && (
              <div className="pt-3 border-t border-slate-800 text-xs">
                {statusSearchResult ? (
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{statusSearchResult.fullName}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          statusSearchResult.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : statusSearchResult.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : statusSearchResult.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {statusSearchResult.status.toUpperCase()}
                      </span>
                    </div>

                    {statusSearchResult.status === 'Pending' && (
                      <p className="text-amber-300 text-[11px] leading-relaxed">
                        “Codsigaaga wali wuxuu sugayaa oggolaanshaha Maamulka Machadka.”
                      </p>
                    )}

                    {statusSearchResult.status === 'Rejected' && (
                      <p className="text-rose-300 text-[11px] leading-relaxed">
                        “Codsigaaga lama ansixin. Fadlan la xiriir Maamulka Machadka.”
                      </p>
                    )}

                    {statusSearchResult.status === 'Suspended' && (
                      <p className="text-rose-300 text-[11px] leading-relaxed">
                        “Account-kaaga waa la hakiyay. Fadlan la xiriir Maamulka Machadka.”
                      </p>
                    )}

                    {statusSearchResult.status === 'Active' && (
                      <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800/80 text-[11px] text-emerald-200 space-y-1">
                        <div>✅ Akoonkaaga waa Active!</div>
                        <div>
                          🔑 Username: <span className="font-mono font-bold text-white">{statusSearchResult.username}</span>
                        </div>
                        <p className="text-[10px] text-emerald-300">
                          Fadlan ku gal Username-ka kore iyo Password-kii Maamulku kuusiiyay.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800 rounded-xl text-rose-400 text-center font-bold">
                    Codsigan laguma helin nidaamka. Fadlan marka hore is-diiwaangeli.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Workflow Steps Card */}
          <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-200 text-xs text-emerald-950 space-y-3">
            <h4 className="font-black text-emerald-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Sida ay u shaqeyso Diiwaangelinta Online-ka:</span>
            </h4>
            <div className="space-y-2 font-medium">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  <strong>ISDIIWAANGELIN:</strong> Buuxi foomka diiwaangelinta adiga oo bixinaya magacaaga, telefoonkaaga, iyo fasalkaaga.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  <strong>PENDING APPROVAL:</strong> Codsigaaga wuxuu tagayaa Maamulka Machadka si loogu dib-u-eego.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  <strong>ADMIN CREATES ACCOUNT:</strong> Admin-ka ayaa kuu sameynaya Username, Password, iyo Student ID marka uu ansixiyo.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <p>
                  <strong>ACTIVE & LOGIN:</strong> Marka akoonkaaga uu noqdo Active, waxaad si toos ah uga qaybqaadan kartaa casharrada Online-ka ah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
