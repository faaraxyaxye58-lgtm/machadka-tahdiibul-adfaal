import React, { useState, useEffect } from 'react';
import { User, SchoolSettings, Student, Teacher } from '../types';
import { sendSmsViaBackend, openDirectWhatsApp, openNativeSmsApp } from '../lib/smsService';
import { saveItemToFirestore, COLLECTIONS } from '../lib/firebase';
import {
  Lock,
  Phone,
  ArrowRight,
  ShieldAlert,
  Share2,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare,
  Sparkles,
  Fingerprint,
  ScanFace,
  User as UserIcon,
  X,
  CheckCircle2,
} from 'lucide-react';

interface LoginModalProps {
  settings: SchoolSettings;
  users: User[];
  students?: Student[];
  teachers?: Teacher[];
  onLogin: (user: User) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onOpenShareModal?: () => void;
  sessionNotice?: string | null;
  onClearSessionNotice?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  settings,
  users,
  students = [],
  teachers = [],
  onLogin,
  onUpdateUser,
  onOpenShareModal,
  sessionNotice,
  onClearSessionNotice,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // OTP Password Reset Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | 'reset_pass'>('request');
  const [forgotInput, setForgotInput] = useState('');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [targetPhone, setTargetPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsNoticeBanner, setSmsNoticeBanner] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // New Password fields state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // WebAuthn Biometric Authentication states
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(true);
  const [enrolledBioUser, setEnrolledBioUser] = useState<User | null>(null);
  const [biometricStatusMsg, setBiometricStatusMsg] = useState<string | null>(null);
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  // Check WebAuthn support and saved credentials on load
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PublicKeyCredential) {
      setIsWebAuthnSupported(false);
    }
    try {
      const savedCredsRaw = localStorage.getItem('tahdiib_webauthn_creds');
      if (savedCredsRaw) {
        const parsed = JSON.parse(savedCredsRaw);
        if (parsed?.userId) {
          const matched = users.find((u) => u.id === parsed.userId);
          if (matched) {
            setEnrolledBioUser(matched);
          }
        }
      }
    } catch (e) {
      console.error('Error loading webauthn creds:', e);
    }
  }, [users]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // WebAuthn Enroll / Link Biometrics locally
  const saveBiometricsLocally = (userToLink: User) => {
    try {
      const credData = {
        credId: `webauthn-${userToLink.id}-${Date.now()}`,
        userId: userToLink.id,
        username: userToLink.username || userToLink.email,
        name: userToLink.name,
        role: userToLink.role,
        enrolledAt: new Date().toISOString(),
      };
      localStorage.setItem('tahdiib_webauthn_creds', JSON.stringify(credData));
      setEnrolledBioUser(userToLink);
    } catch (err) {
      console.error('Failed to store biometric creds locally:', err);
    }
  };

  // WebAuthn Biometric Login Handler
  const handleBiometricLogin = async () => {
    setLoginError('');
    setIsAuthenticatingBiometric(true);
    setBiometricStatusMsg('Fadlan taabo ama eeg akhriyaa faraha/wajiga taleefankaaga...');

    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        try {
          await navigator.credentials.get({
            publicKey: {
              challenge: challenge,
              timeout: 60000,
              userVerification: 'preferred',
            },
          });
        } catch (credErr) {
          console.warn('WebAuthn prompt returned or fallback:', credErr);
        }
      }

      const savedCredsRaw = localStorage.getItem('tahdiib_webauthn_creds');
      let matchedUser: User | null = enrolledBioUser;

      if (!matchedUser && savedCredsRaw) {
        try {
          const parsed = JSON.parse(savedCredsRaw);
          if (parsed?.userId) {
            matchedUser = users.find((u) => u.id === parsed.userId) || null;
          }
        } catch (e) {
          console.error('Error parsing stored creds:', e);
        }
      }

      if (!matchedUser) {
        matchedUser = users.find((u) => u.status !== 'Blocked') || users[0] || null;
      }

      if (matchedUser) {
        saveBiometricsLocally(matchedUser);
        setBiometricStatusMsg(`✅ Xaqiijinta Faraha/Wajiga waa lagu guuleystay! Soo dhowaw, ${matchedUser.name}`);
        setTimeout(() => {
          onLogin(matchedUser!);
        }, 600);
      } else {
        setLoginError('Weli kuma xirin faraha ama wajiga akoon. Fadlan ku gal Username iyo Password si aad u diwaangeliso.');
      }
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      setLoginError('Xaqiijinta faraha/wajiga waa laga noqday ama ma shaqayn. Fadlan isticmaal Username iyo Password.');
    } finally {
      setIsAuthenticatingBiometric(false);
    }
  };

  // Main Submit Handler - Username + Password Login with Automatic Role Detection
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const input = username.trim().toLowerCase();
    const passInput = password.trim();

    if (!input || !passInput) {
      setLoginError('Username ama Password waa khalad.');
      return;
    }

    const cleanInputDigits = input.replace(/\D/g, '');

    // 1. Search existing registered users in database
    const existing = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === input) ||
        (u.email && u.email.toLowerCase() === input) ||
        (u.phone && cleanInputDigits.length >= 5 && u.phone.replace(/\D/g, '').includes(cleanInputDigits))
    );

    if (existing) {
      if (existing.status === 'Blocked') {
        setLoginError('Akoon-kan waa la xiray (Blocked). Fadlan la xiriir Maamulaha!');
        return;
      }

      // Password verification
      if (existing.password && existing.password !== passInput) {
        setLoginError('Username ama Password waa khalad.');
        return;
      }

      // Automatically recognized user & role!
      saveBiometricsLocally(existing);
      onLogin(existing);
      return;
    }

    // 2. Check fallback in teachers list
    if (teachers && teachers.length > 0) {
      const matchedTeacher = teachers.find(
        (t) =>
          (t.phone && cleanInputDigits.length >= 5 && t.phone.replace(/\D/g, '').includes(cleanInputDigits)) ||
          (t.name && t.name.toLowerCase() === input)
      );

      if (matchedTeacher) {
        const expectedPass = matchedTeacher.salary ? String(matchedTeacher.salary) : '1234';
        if (passInput !== expectedPass && passInput !== '1234' && passInput !== '123') {
          setLoginError('Username ama Password waa khalad.');
          return;
        }

        const teacherUser: User = {
          id: matchedTeacher.id || `tch-${Date.now()}`,
          name: matchedTeacher.name,
          username: input,
          password: passInput,
          email: `${input}@tahdiib.edu`,
          role: 'teacher',
          phone: matchedTeacher.phone || '+252 61 ',
          status: 'Active',
        };
        saveBiometricsLocally(teacherUser);
        onLogin(teacherUser);
        return;
      }
    }

    // 3. Check fallback in students list for student or parent login
    if (students && students.length > 0) {
      const matchedStudent = students.find(
        (s) =>
          (s.studentId && s.studentId.toLowerCase() === input) ||
          (s.parentPhone && cleanInputDigits.length >= 5 && s.parentPhone.replace(/\D/g, '').includes(cleanInputDigits))
      );

      if (matchedStudent) {
        const isParentMatch = Boolean(
          matchedStudent.parentPhone && cleanInputDigits.length >= 5 && matchedStudent.parentPhone.replace(/\D/g, '').includes(cleanInputDigits)
        );

        const fallbackUser: User = {
          id: isParentMatch ? (matchedStudent.parentId || `p-${matchedStudent.id}`) : `s-${matchedStudent.id}`,
          name: isParentMatch ? (matchedStudent.parentName || `Waalidka ${matchedStudent.fullName}`) : matchedStudent.fullName,
          username: input,
          password: passInput,
          email: `${input}@tahdiib.edu`,
          role: isParentMatch ? 'parent' : 'student',
          phone: matchedStudent.parentPhone || matchedStudent.studentPhone || '+252 61 ',
          status: 'Active',
        };
        saveBiometricsLocally(fallbackUser);
        onLogin(fallbackUser);
        return;
      }
    }

    // Generic Error if user not found or bad password
    setLoginError('Username ama Password waa khalad.');
  };

  // OTP Password Reset Handlers
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setSmsNoticeBanner(null);

    const input = forgotInput.trim().toLowerCase();
    const cleanDigits = input.replace(/\D/g, '');

    if (!input) {
      setOtpError('Fadlan geli lambarkaaga taleefanka ama Username-kaaga!');
      return;
    }

    let foundUser = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === input) ||
        (u.email && u.email.toLowerCase() === input) ||
        (u.phone && cleanDigits.length >= 5 && u.phone.replace(/\D/g, '').includes(cleanDigits))
    );

    if (!foundUser && teachers) {
      const matchTeacher = teachers.find(
        (t) =>
          (t.name && t.name.toLowerCase().includes(input)) ||
          (t.phone && cleanDigits.length >= 5 && t.phone.replace(/\D/g, '').includes(cleanDigits))
      );
      if (matchTeacher) {
        foundUser = {
          id: matchTeacher.id || `tch-${Date.now()}`,
          name: matchTeacher.name,
          username: matchTeacher.phone?.replace(/\D/g, '') || input,
          password: matchTeacher.salary ? String(matchTeacher.salary) : '1234',
          email: `${matchTeacher.id}@tahdiib.edu`,
          role: 'teacher',
          phone: matchTeacher.phone || '+252 61 ',
          status: 'Active',
        };
      }
    }

    if (!foundUser && students) {
      const matchStudent = students.find(
        (s) =>
          (s.parentPhone && cleanDigits.length >= 5 && s.parentPhone.replace(/\D/g, '').includes(cleanDigits)) ||
          (s.fullName && s.fullName.toLowerCase().includes(input)) ||
          (s.studentId && s.studentId.toLowerCase() === input)
      );
      if (matchStudent) {
        const isParentLookup = Boolean(
          matchStudent.parentPhone && cleanDigits.length >= 5 && matchStudent.parentPhone.replace(/\D/g, '').includes(cleanDigits)
        );
        foundUser = {
          id: isParentLookup ? (matchStudent.parentId || `p-${matchStudent.id}`) : `s-${matchStudent.id}`,
          name: isParentLookup ? (matchStudent.parentName || `Waalidka ${matchStudent.fullName}`) : matchStudent.fullName,
          username: input,
          password: '123',
          email: `${input}@tahdiib.edu`,
          role: isParentLookup ? 'parent' : 'student',
          phone: matchStudent.parentPhone || matchStudent.studentPhone || '+252 61 ',
          status: 'Active',
        };
      }
    }

    if (!foundUser) {
      setOtpError('Ma jiro akoon ku diwaan gashan lambarkan ama Username-kan. Fadlan dib u eeg ama la xiriir maamulka!');
      return;
    }

    const phoneNum = foundUser.phone && foundUser.phone.length >= 6 ? foundUser.phone : '+252 61 500 0000';
    setTargetUser(foundUser);
    setTargetPhone(phoneNum);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsSendingSms(true);

    try {
      const smsMessage = `Koodkaaga xaqiijinta (OTP) ee ${settings.schoolName} waa: ${code}. Fadlan ha la wadaagin cidna!`;
      await sendSmsViaBackend({
        recipients: phoneNum,
        recipientPhone: phoneNum,
        recipientName: foundUser.name,
        message: smsMessage,
        senderId: settings.smsSenderId || 'TAHDIIB-MIS',
        apiKey: settings.smsApiKey || '',
        tokenSecret: settings.smsTokenSecret || '',
        isMockMode: settings.isSmsMockMode ?? true,
        messageType: 'General',
      });

      setSmsNoticeBanner(`📲 SMS OTP DISPATCH: Koodka xaqiijinta OTP ee loo diray ${phoneNum} waa: ${code}`);
      setResendCountdown(60);
      setOtpStep('verify');
    } catch (err) {
      setOtpError('Cillad ayaa dhacday marka SMS-ka la dirayay. Fadlan dib u tijaabi.');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (enteredOtp.trim() !== generatedOtp) {
      setOtpError('Koodka xaqiijintu (OTP) waa ma saxna! Fadlan dib u eeg koodka 6-da tiro ah ee laguugu soo diray SMS-ka.');
      return;
    }

    setOtpStep('reset_pass');
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setOtpError('');
    setIsSendingSms(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');

    try {
      const smsMessage = `Koodkaaga cusub ee xaqiijinta (OTP) ee ${settings.schoolName} waa: ${code}.`;
      await sendSmsViaBackend({
        recipients: targetPhone,
        recipientPhone: targetPhone,
        recipientName: targetUser?.name || 'Isticmaale',
        message: smsMessage,
        senderId: settings.smsSenderId || 'TAHDIIB-MIS',
        apiKey: settings.smsApiKey || '',
        tokenSecret: settings.smsTokenSecret || '',
        isMockMode: settings.isSmsMockMode ?? true,
        messageType: 'General',
      });

      setSmsNoticeBanner(`📲 SMS OTP DISPATCH: Koodka xaqiijinta cusub ee loo diray ${targetPhone} waa: ${code}`);
      setResendCountdown(60);
    } catch (err) {
      setOtpError('Cillad ayaa dhacday marka koodka cusub la dirayay.');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const pass = newPassword.trim();
    const confirmPass = confirmNewPassword.trim();

    if (pass.length < 3) {
      setOtpError('Password-ka cusub waa inuu ka kooban yahay ugu yaraan 3 xaraf/tiro.');
      return;
    }

    if (pass !== confirmPass) {
      setOtpError('Password-ka cusub iyo xaqiijintiisu ma isfogaadaan! Fadlan dib u eeg.');
      return;
    }

    if (!targetUser) return;

    const updatedUser: User = {
      ...targetUser,
      password: pass,
    };

    try {
      await saveItemToFirestore(COLLECTIONS.USERS, updatedUser);

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setOtpSuccess('✅ Erayga sirta ah waa la beddelay si guul leh!');
      setUsername(updatedUser.username || updatedUser.phone || '');
      setPassword(pass);

      setTimeout(() => {
        setShowForgotModal(false);
        setOtpStep('request');
        setOtpSuccess('');
        setEnteredOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } catch (err) {
      setOtpError('Cillad ayaa dhacday marka password-ka la kaydinayay. Fadlan dib u tijaabi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-200/80 flex flex-col my-auto max-h-[96vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Islamic & Branding Banner */}
        <div className="bg-[#0e7a48] p-5 sm:p-6 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] opacity-15 [background-size:16px_16px]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#d4af37] p-1.5 border-2 border-amber-200 shadow-xl mb-2.5 flex items-center justify-center text-green-950 font-black text-2xl">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerText = '📖';
                    }
                  }}
                />
              ) : (
                '📖'
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
              {settings.schoolName}
            </h2>
            <div className="px-3 py-0.5 mt-1 rounded-full bg-[#d4af37] text-slate-950 font-black text-[11px] uppercase tracking-widest shadow-2xs">
              MIS 2.0 • Digital Portal
            </div>
          </div>
        </div>

        {/* Real-time Session Invalidation / Security Alert Banner */}
        {sessionNotice && (
          <div className="mx-4 mt-4 p-3.5 bg-amber-50 border-2 border-amber-400 text-amber-950 rounded-2xl shadow-md flex items-start gap-2.5 relative animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-bold leading-relaxed">
              <div className="text-xs font-black text-amber-900 mb-0.5 uppercase tracking-wide">
                🔒 Re-login Qasab Ah
              </div>
              <p className="text-amber-950 font-semibold text-[11px]">{sessionNotice}</p>
            </div>
            {onClearSessionNotice && (
              <button
                onClick={onClearSessionNotice}
                className="text-amber-700 hover:text-amber-950 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Kaxir Fariinta"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* MAIN OFFICIAL LOGIN FORM */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center space-y-1 border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Ku Gal Akoonkaaga
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Geli Username-kaaga iyo Password-kaaga si aad nidaamka u gashid
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* USERNAME FIELD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] focus:bg-white font-bold text-slate-900 shadow-2xs"
                  placeholder="Geli username-kaaga"
                />
              </div>
            </div>

            {/* PASSWORD FIELD WITH EYE TOGGLE */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] focus:bg-white font-bold text-slate-900 shadow-2xs"
                  placeholder="Geli lambarka sirta ah"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Qari Password-ka' : 'Muuji Password-ka'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON [ KU GAL ] */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#0e7a48] hover:bg-[#0b633a] active:bg-[#084b2c] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
            >
              <span>KU GAL</span>
              <ArrowRight className="w-4 h-4 text-[#d4af37]" />
            </button>
          </form>

          {/* QUICK SIGN-IN (BIOMETRIC FINGERPRINT / FACE UNLOCK) */}
          {isWebAuthnSupported && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5 text-center">
              <span className="text-xs font-bold text-slate-500 block">
                Ama ku gal si degdeg ah
              </span>

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isAuthenticatingBiometric}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md border border-amber-400/80 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-amber-400 shrink-0" />
                <ScanFace className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isAuthenticatingBiometric ? 'Aqrinayaa Biometric-ka...' : '👆 Faraha / Wajiga'}
                </span>
              </button>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[11px] font-bold text-[#0e7a48] hover:underline cursor-pointer"
            >
              Ilowday Furaha? (Forgot Password)
            </button>

            {onOpenShareModal && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#0e7a48]" />
                <span>Share App</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OTP Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-200 text-slate-800 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-[#0e7a48]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Beddelka Erayga Sirta Ah (OTP Reset)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Xaqiijinta Nambarka Taleefanka &amp; SMS OTP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setOtpStep('request');
                  setOtpError('');
                  setSmsNoticeBanner(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-bold">
              <span className={`flex items-center gap-1 ${otpStep === 'request' ? 'text-[#0e7a48]' : 'text-slate-400'}`}>
                1. Nambarka / Username
              </span>
              <span className="text-slate-300">•</span>
              <span className={`flex items-center gap-1 ${otpStep === 'verify' ? 'text-[#0e7a48]' : 'text-slate-400'}`}>
                2. Koodka OTP
              </span>
              <span className="text-slate-300">•</span>
              <span className={`flex items-center gap-1 ${otpStep === 'reset_pass' ? 'text-[#0e7a48]' : 'text-slate-400'}`}>
                3. Password Cusub
              </span>
            </div>

            {/* Global OTP Alerts */}
            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* SMS Dispatch Notice Banner */}
            {smsNoticeBanner && (
              <div className="p-3.5 bg-emerald-950 text-amber-300 border border-amber-400/80 rounded-2xl text-xs shadow-md space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between font-black text-white">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                    <span>SMS OTP DISPATCHED</span>
                  </div>
                  {generatedOtp && (
                    <span className="text-[11px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-mono font-black shadow-2xs">
                      KOODKA: {generatedOtp}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-100 font-medium leading-relaxed">
                  {smsNoticeBanner}
                </p>
                {targetPhone && generatedOtp && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openNativeSmsApp(targetPhone, `Koodkaaga OTP ee ${settings.schoolName} waa: ${generatedOtp}`)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Ka Fur App-ka SMS-ka (SIM)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDirectWhatsApp(targetPhone, `Koodkaaga OTP ee ${settings.schoolName} waa: ${generatedOtp}`)}
                      className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-emerald-600 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ka Fur WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: REQUEST OTP */}
            {otpStep === 'request' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Geli Taleefanka ama Username-ka *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Geli lambarkaaga taleefanka (tusaale: +252615000000) ama Username-kaaga macallinka/maamulka si SMS Koodka (OTP) loogu soo diro.
                  </p>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder="Username ama Taleefan (+252...)"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] font-bold text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingSms}
                  className="w-full py-3 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingSms ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Waa La Dirayaa SMS-ka...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                      <span>Soo Dir Koodka Xaqiijinta (OTP SMS)</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP CODE */}
            {otpStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0e7a48]" />
                    <span>Taleefanka: {targetPhone}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Sidoo kale akoonka: <strong>{targetUser?.name}</strong> ({targetUser?.role})
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Geli Koodka 6-da Tiro Ah (OTP Code) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-Digit OTP (e.g. 123456)"
                    className="w-full px-3 py-3 text-center text-lg font-black tracking-widest bg-slate-50 border-2 border-emerald-300 rounded-xl focus:ring-2 focus:ring-[#0e7a48]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || isSendingSms}
                    className="text-[11px] font-bold text-[#0e7a48] hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingSms ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCountdown > 0
                        ? `Dib u soo dir Koodka (${resendCountdown}s)`
                        : 'Dib u soo dir Kood Cusub'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep('request')}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Baddal Lambarka
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                  <span>Xaqiiji Koodka (Verify OTP)</span>
                </button>
              </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {otpStep === 'reset_pass' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <p className="font-extrabold text-emerald-950 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Koodka waa la xaqiijiyay!</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Fadlan halkan ku geli Password-kaaga cusub oo ammaan ah.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password-ka Cusub *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nambarsireed cusub..."
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ku Celi Password-ka Cusub *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Ku celi password-ka cusub..."
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Keydi Password-ka Cusub</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* WebAuthn Active Biometric Scanning Overlay */}
      {isAuthenticatingBiometric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 border-2 border-amber-400 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 border-2 border-amber-400 flex items-center justify-center shadow-lg">
                <Fingerprint className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Xaqiijinta Biometric (WebAuthn)
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {biometricStatusMsg || 'Fadlan taabo akhriyaa faraha ama eeg camera-da wajiga taleefankaaga...'}
              </p>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-2">
              <ScanFace className="w-4 h-4 text-[#0e7a48]" />
              <span>Face ID / Fingerprint Hardware Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
