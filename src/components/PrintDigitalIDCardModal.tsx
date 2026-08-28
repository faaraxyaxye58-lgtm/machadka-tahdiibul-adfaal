import React, { useState } from 'react';
import { Student, SchoolSettings } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, QrCode, ShieldCheck, Sparkles, Phone, MapPin, Building, GraduationCap, CheckCircle2 } from 'lucide-react';

interface PrintDigitalIDCardModalProps {
  student: Student;
  settings: SchoolSettings;
  onClose: () => void;
}

export const PrintDigitalIDCardModal: React.FC<PrintDigitalIDCardModalProps> = ({
  student,
  settings,
  onClose,
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');

  const handlePrint = () => {
    window.print();
  };

  // Structured verification payload for QR code
  const qrVerificationData = JSON.stringify({
    studentId: student.studentId,
    fullName: student.fullName,
    className: student.className,
    shift: student.shift,
    school: settings.schoolName,
    juz: student.currentJuz,
    parentPhone: student.parentPhone,
    status: student.status,
    verifiedAt: new Date().toISOString().split('T')[0],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 my-auto max-h-[95vh] overflow-y-auto">
        {/* Controls Bar (Hidden during printing) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
              <QrCode className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Digital Student ID Card (Kadhka Aqoonsiga Ardayga)
              </h3>
              <p className="text-[11px] text-amber-300 font-bold">
                {student.fullName} ({student.studentId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Side Selector */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveSide('both')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                  activeSide === 'both' ? 'bg-[#0e7a48] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Labada Dhinac
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                  activeSide === 'front' ? 'bg-[#0e7a48] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hore (Front)
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                  activeSide === 'back' ? 'bg-[#0e7a48] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nyastee (Back)
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Daabac ID Card-ka</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-10 space-y-8 bg-slate-900" id="id-card-printable">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {/* FRONT SIDE CARD */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div className="w-[340px] h-[520px] bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-5 border-4 border-amber-400/90 shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0">
                {/* Background Islamic Watermark Accent */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Header Branding */}
                <div className="relative z-10 text-center border-b border-amber-400/40 pb-3">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-10 h-10 object-cover rounded-xl border border-amber-300 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#0e7a48] text-amber-300 font-black flex items-center justify-center text-sm rounded-xl border border-amber-300 shadow-sm">
                        TA
                      </div>
                    )}
                    <div className="text-left">
                      <h2 className="text-xs font-black uppercase tracking-tight text-white leading-tight">
                        {settings.schoolName}
                      </h2>
                      <p className="text-[8px] font-extrabold text-amber-300 uppercase tracking-widest">
                        {settings.schoolSubtitle || 'Markazka Quraanka & Barbaarinta Ubadka'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block px-3 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-full shadow-2xs">
                    STUDENT DIGITAL ID CARD
                  </span>
                </div>

                {/* Student Photo & Gold Badge */}
                <div className="relative z-10 my-auto text-center space-y-3">
                  <div className="relative inline-block mx-auto">
                    <div className="w-28 h-28 mx-auto rounded-2xl bg-amber-400 p-1 shadow-xl border-2 border-amber-300 overflow-hidden">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.fullName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#0e7a48] text-amber-300 font-black text-4xl flex items-center justify-center rounded-xl">
                          {student.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Verified Badge */}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#0e7a48] text-amber-300 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-amber-400 flex items-center gap-1 shadow-md whitespace-nowrap">
                      <ShieldCheck className="w-3 h-3 text-amber-300" />
                      <span>VERIFIED ARDAY</span>
                    </div>
                  </div>

                  {/* Student Name & ID */}
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight uppercase">
                      {student.fullName}
                    </h3>
                    <p className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                      ID: {student.studentId}
                    </p>
                  </div>

                  {/* Class, Shift & Quran Juz */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 text-[10px]">
                    <div className="border-r border-slate-800 pr-1">
                      <span className="text-slate-400 block font-bold text-[8px] uppercase">Fasalka & Waqtiga:</span>
                      <strong className="text-white font-extrabold">{student.className} ({student.shift})</strong>
                    </div>
                    <div className="pl-1">
                      <span className="text-slate-400 block font-bold text-[8px] uppercase">Xifdiga Qur'aanka:</span>
                      <strong className="text-amber-300 font-extrabold">Juz {student.currentJuz} / 30</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar with QR Code */}
                <div className="relative z-10 border-t border-amber-400/40 pt-3 flex items-center justify-between gap-3">
                  <div className="bg-white p-1.5 rounded-xl border-2 border-amber-400 shrink-0 shadow-md">
                    <QRCodeSVG
                      value={qrVerificationData}
                      size={54}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex-1 text-left text-[9px] space-y-0.5">
                    <p className="font-extrabold text-amber-300 uppercase leading-none">
                      SKANGA XAQIIJINTA (QR)
                    </p>
                    <p className="text-slate-300 text-[8px] leading-tight font-medium">
                      Ku skan gareey kaamira si aad u xaqiijiso xogta rasmiga ah ee ardayga.
                    </p>
                    <p className="text-slate-400 text-[7px] font-mono">
                      Sannadka: {settings.academicYear || '2025/2026'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BACK SIDE CARD */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div className="w-[340px] h-[520px] bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 border-4 border-emerald-500/80 shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0">
                {/* Header Back */}
                <div className="border-b border-slate-800 pb-2 text-center">
                  <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    SHURUUDAHA & SIYAASADDA KADHKA
                  </h4>
                  <p className="text-[8px] text-slate-400 uppercase font-bold">
                    Official Student Identification Rules
                  </p>
                </div>

                {/* Terms & Parent Info */}
                <div className="space-y-3 my-auto text-[10px] text-slate-300">
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[9px] font-extrabold text-amber-300 uppercase block">
                      👤 Xogta Waalidka & Masuulka:
                    </span>
                    <p className="text-white font-bold">{student.parentName} ({student.parentRelation || 'Waalid'})</p>
                    <p className="text-emerald-400 font-mono font-extrabold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{student.parentPhone}</span>
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-1.5 leading-relaxed">
                    <span className="text-[9px] font-extrabold text-amber-300 uppercase block">
                      📌 Ogaysiis Waalidka & Ardayda:
                    </span>
                    <ul className="list-disc pl-3 text-[9px] text-slate-300 space-y-1">
                      <li>Kadhkani waa aqoonsiga rasmiga ah ee ardayga uu ku soo galo machadka.</li>
                      <li>Haddii uu kadohu ka lumo ardayga, fadlan si degdeg ah ugu wargeli maamulka.</li>
                      <li>Kadhkani ma aha mid loo wareejin karo qof kale.</li>
                    </ul>
                  </div>

                  <div className="bg-emerald-950/80 p-2.5 rounded-2xl border border-emerald-800/80 text-[9px] text-emerald-200 text-center space-y-0.5">
                    <span className="font-extrabold text-white block">📍 Machadka Tahdiib Al-Adfaal</span>
                    <p className="text-[8px] text-emerald-300">Moqadisho, Somalia • Tel: +252 61 5000000</p>
                  </div>
                </div>

                {/* Footer Stamp & Signature Line */}
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[9px]">
                  <div className="text-left">
                    <div className="border-b border-slate-600 w-24 mb-0.5"></div>
                    <span className="text-slate-400 font-bold block text-[8px] uppercase">SAXIIXA MAAMULKA</span>
                  </div>

                  <div className="w-10 h-10 rounded-full border border-amber-400 bg-amber-400/20 flex items-center justify-center text-[7px] font-black text-amber-300 uppercase text-center leading-none">
                    SEAL
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
