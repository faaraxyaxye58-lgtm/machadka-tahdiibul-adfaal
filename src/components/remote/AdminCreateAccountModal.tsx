import React, { useState } from 'react';
import { X, UserCheck, Key, ShieldCheck, CreditCard, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RemoteRegistration, User, Student } from '../../types';
import { Storage } from '../../lib/storage';
import { hashPassword } from '../../lib/hashUtils';
import { saveItemToFirestore, COLLECTIONS } from '../../lib/firebase';

interface AdminCreateAccountModalProps {
  isOpen: boolean;
  registration: RemoteRegistration | null;
  onClose: () => void;
  onSuccess: (updatedReg: RemoteRegistration, newUser: User) => void;
  students: Student[];
}

export const AdminCreateAccountModal: React.FC<AdminCreateAccountModalProps> = ({
  isOpen,
  registration,
  onClose,
  onSuccess,
  students,
}) => {
  if (!isOpen || !registration) return null;

  // Auto-generate suggested username & student ID
  const cleanNamePart = registration.fullName.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const suggestedUsername = registration.username || `${cleanNamePart}${Math.floor(100 + Math.random() * 900)}`;
  const suggestedStudentId = registration.studentId || `TA-REM-${Math.floor(1000 + Math.random() * 9000)}`;
  const defaultPassword = `Tahdiib@${Math.floor(1000 + Math.random() * 9000)}`;

  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState(defaultPassword);
  const [studentId, setStudentId] = useState(suggestedStudentId);
  const [assignedClass, setAssignedClass] = useState(registration.gradeLevel || 'Fasalka 1-aad');
  const [role, setRole] = useState<'student' | 'parent'>('student');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userTrim = username.trim().toLowerCase();
    const passTrim = password.trim();
    const stuIdTrim = studentId.trim().toUpperCase();

    if (!userTrim || !passTrim || !stuIdTrim) {
      setErrorMessage('Fadlan buuxi dhammaan dhinacyada loo baahan yahay.');
      return;
    }

    // DUPLICATE PROTECTION: Check Phone Number, Username, Student ID
    const currentUsers = Storage.getUsers();
    const currentRegs = Storage.getRemoteRegistrations();
    const currentStudents = Storage.getStudents();
    const cleanPhone = registration.phone.replace(/\D/g, '');

    // Check Duplicate Username
    const dupUsernameUser = currentUsers.find((u) => u.username && u.username.toLowerCase() === userTrim);
    const dupUsernameReg = currentRegs.find(
      (r) => r.id !== registration.id && r.username && r.username.toLowerCase() === userTrim
    );
    if (dupUsernameUser || dupUsernameReg) {
      setErrorMessage('Xogtan (Username-kan) hore ayaa loogu diiwaangeliyay nidaamka. Fadlan la xiriir Maamulka Machadka.');
      return;
    }

    // Check Duplicate Student ID
    const dupStudentId = currentStudents.find((s) => s.studentId && s.studentId.toUpperCase() === stuIdTrim);
    const dupStudentReg = currentRegs.find(
      (r) => r.id !== registration.id && r.studentId && r.studentId.toUpperCase() === stuIdTrim
    );
    if (dupStudentId || dupStudentReg) {
      setErrorMessage('Xogtan (Student ID-gan) hore ayaa loogu diiwaangeliyay nidaamka. Fadlan la xiriir Maamulka Machadka.');
      return;
    }

    // Check Duplicate Phone
    const dupPhoneUser = currentUsers.find(
      (u) => u.phone && cleanPhone.length >= 6 && u.phone.replace(/\D/g, '').includes(cleanPhone) && u.id !== registration.createdUserId
    );
    if (dupPhoneUser) {
      setErrorMessage('Xogtan (Lambarka telefoonka) hore ayaa loogu diiwaangeliyay nidaamka. Fadlan la xiriir Maamulka Machadka.');
      return;
    }

    setIsSubmitting(true);

    try {
      const hashedPassword = await hashPassword(passTrim);
      const newUserId = `usr-rem-${Date.now()}`;
      const newStudentDbId = `std-rem-${Date.now()}`;

      // 1. Create User entity
      const newUser: User = {
        id: newUserId,
        name: registration.fullName,
        username: userTrim,
        password: hashedPassword, // SECURE HASHED PASSWORD
        email: `${userTrim}@online.tahdiib.edu`,
        role: role as any,
        phone: registration.phone,
        status: 'Active',
        learningMode: 'remote',
        studentId: stuIdTrim,
      };

      // 2. Create Student entity for database
      const newStudent: Student = {
        id: newStudentDbId,
        studentId: stuIdTrim,
        fullName: registration.fullName,
        gender: 'Male',
        age: registration.age || 10,
        parentName: registration.parentName,
        parentPhone: registration.phone,
        classId: `cls-rem-${assignedClass.replace(/\s+/g, '-').toLowerCase()}`,
        className: assignedClass,
        shift: 'Subax',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        currentJuz: 1,
        currentSurah: 'Surat Al-Baqarah',
        feeMonthly: 15,
        feePaid: 15,
        feeStatus: 'Paid',
        learningMode: 'remote',
        cityCountry: registration.cityCountry,
      };

      // 3. Update Registration object to status ACTIVE
      const updatedReg: RemoteRegistration = {
        ...registration,
        status: 'Active',
        username: userTrim,
        passwordHash: hashedPassword,
        passwordPlainForAdmin: passTrim,
        studentId: stuIdTrim,
        assignedClassName: assignedClass,
        role: role,
        mustChangePassword: true,
        createdUserId: newUserId,
        createdStudentId: newStudentDbId,
        reviewedBy: 'Admin',
        reviewedAt: new Date().toISOString(),
      };

      // Save to Users storage
      const updatedUsers = [newUser, ...currentUsers.filter((u) => u.id !== newUserId)];
      Storage.saveUsers(updatedUsers);
      saveItemToFirestore(COLLECTIONS.USERS, newUser).catch(() => {});

      // Save to Students storage
      const updatedStudents = [newStudent, ...currentStudents.filter((s) => s.id !== newStudentDbId)];
      Storage.saveStudents(updatedStudents);
      saveItemToFirestore(COLLECTIONS.STUDENTS, newStudent).catch(() => {});

      // Save updated Registrations list
      const updatedRegs = currentRegs.map((r) => (r.id === registration.id ? updatedReg : r));
      Storage.saveRemoteRegistrations(updatedRegs);
      saveItemToFirestore(COLLECTIONS.REMOTE_REGISTRATIONS, updatedReg).catch(() => {});

      onSuccess(updatedReg, newUser);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Cillad ayaa ka dhacday abuurista akoonka.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <UserCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black">CREATE ONLINE LEARNING ACCOUNT</h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Admin: Sameey Username, Password & Student ID oo ansixi akoon-ka
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Summary Banner */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="text-slate-500 font-bold uppercase text-[10px]">Codsade (Applicant):</div>
              <div className="font-black text-slate-900 text-sm mt-0.5">{registration.fullName}</div>
              <div className="text-slate-600 mt-0.5">
                📞 {registration.phone} • 📍 {registration.cityCountry}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              Pending → Active
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">1. Username *</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. khadra2026"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                2. Password * (Secure Hashing ayaa lagu kaydinayaa)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. Tahdiib@1234"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Student ID *</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. TA-REM-1001"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Class / Heerka *</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
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
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. Role (Xilka Akoonka) *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2.5 rounded-xl border-2 font-black flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'student'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  🎓 Student (Arday)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`p-2.5 rounded-xl border-2 font-black flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'parent'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  👨‍👩‍👧 Parent (Waalid)
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Kanasal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-xl font-black hover:from-emerald-800 hover:to-teal-900 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Waa la sameynayaa...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CREATE ACCOUNT (Active)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
