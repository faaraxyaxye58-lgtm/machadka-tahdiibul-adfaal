import React, { useState } from 'react';
import { X, GraduationCap, CheckCircle2, UserCheck, MapPin, Phone, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { RemoteRegistration } from '../../types';
import { Storage } from '../../lib/storage';
import { saveItemToFirestore, COLLECTIONS } from '../../lib/firebase';

interface RemoteRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newReg: RemoteRegistration) => void;
}

export const RemoteRegistrationModal: React.FC<RemoteRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    parentName: '',
    phone: '',
    gradeLevel: 'Fasalka 1-aad',
    cityCountry: 'Muqdisho, Soomaaliya',
    otherInfo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullNameTrim = formData.fullName.trim();
    const parentNameTrim = formData.parentName.trim();
    const phoneTrim = formData.phone.trim();
    const cityTrim = formData.cityCountry.trim();

    if (!fullNameTrim || !parentNameTrim || !phoneTrim || !cityTrim) {
      setErrorMessage('Fadlan ka soo buuxi dhammaan xogta muhiimka ah (*).');
      return;
    }

    // Check duplicate phone number in existing registrations
    const currentRegs = Storage.getRemoteRegistrations();
    const cleanPhone = phoneTrim.replace(/\D/g, '');
    const duplicate = currentRegs.find(
      (r) => r.phone && r.phone.replace(/\D/g, '').includes(cleanPhone) && cleanPhone.length >= 6
    );

    if (duplicate) {
      setErrorMessage('Xogtan (Lambarka telefoonka) hore ayaa loogu diiwaangeliyay nidaamka. Fadlan la xiriir Maamulka Machadka.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create pure registration request ONLY (No username, No password, No active account)
      const newReg: RemoteRegistration = {
        id: `reg-rem-${Date.now()}`,
        fullName: fullNameTrim,
        parentName: parentNameTrim,
        phone: phoneTrim,
        gradeLevel: formData.gradeLevel,
        cityCountry: cityTrim,
        otherInfo: formData.otherInfo.trim() || undefined,
        status: 'Pending', // Strictly Pending Approval
        submittedAt: new Date().toISOString(),
      };

      // Save to local storage
      Storage.saveRemoteRegistrations([newReg, ...currentRegs]);

      // Sync to Firestore asynchronously
      saveItemToFirestore(COLLECTIONS.REMOTE_REGISTRATIONS, newReg).catch((err) => {
        console.warn('Firestore sync warning for remote registration:', err);
      });

      setSubmittedSuccess(true);
      if (onSuccess) {
        onSuccess(newReg);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Cillad ayaa ka dhacday diiwaangelinta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <GraduationCap className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black">🎓 ISDIIWAANGELI — ONLINE LEARNING</h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Codsiga Diiwaangelinta Waxbarashada Fog ee Machadka Tahdiibul Adfaal
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {submittedSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Codsigaaga Waa La Helay!</h3>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-medium leading-relaxed max-w-md mx-auto">
                “Codsigaaga waa la helay. Fadlan sug oggolaanshaha Maamulka Machadka.”
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-all shadow-md"
              >
                Gartay, Xir Daaqadda
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-emerald-900 leading-relaxed font-medium">
                ℹ️ <strong>Ogeysiis:</strong> Diiwaangelintu waa codsi keliya. Maamulka Machadka ayaa dib u eegaya oo kuu sameyn doona Username & Password marka la ansixiyo.
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* Magaca Buuxa */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Magaca oo dhammeystiran (Full Name) *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Tusaale: Maxamed Cabdi Cali"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Magaca Waalidka */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Magaca waalidka (Parent Name) *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Tusaale: Cabdi Cali Xasan"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Telefoonka */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Lambarka telefoonka (Phone Number) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+252 61 555 1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Class & Magaalada Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Class / Heerka *
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    5. Magaalada (City) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Tusaale: Muqdisho / Nairobi / Hargeysa"
                      value={formData.cityCountry}
                      onChange={(e) => setFormData({ ...formData, cityCountry: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Macluumaad kale */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  6. Macluumaad kale oo muhiim ah (Other Info)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="Qor macluumaad dheeraad ah ama magaca aad doorbideyso..."
                    value={formData.otherInfo}
                    onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t flex items-center justify-end gap-3">
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
                  className="px-6 py-2.5 bg-[#0e7a48] text-white rounded-xl font-bold hover:bg-[#0b633a] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <span>Waa la dirayaa...</span> : <span>📝 ISDIIWAANGELI (Submit Request)</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
