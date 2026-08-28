import React from 'react';
import { Student, SchoolSettings, HifzRecord } from '../types';
import { Printer, X, Award, CheckCircle2, BookOpen, Star, Sparkles } from 'lucide-react';

interface PrintQuranCertificateModalProps {
  student: Student;
  hifzRecord?: HifzRecord;
  settings: SchoolSettings;
  onClose: () => void;
}

export const PrintQuranCertificateModal: React.FC<PrintQuranCertificateModalProps> = ({
  student,
  hifzRecord,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const certificateDate = hifzRecord?.date || new Date().toISOString().split('T')[0];
  const juzAchieved = student.currentJuz || hifzRecord?.sabqiJuz || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[95vh] overflow-y-auto">
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black tracking-wide uppercase">
              Shahaadada Xifdiska Qur'aanka Kariimka (Quran Completion Certificate)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Daabac Shahaadada (Print Certificate)</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Container */}
        <div
          className="p-8 sm:p-12 text-slate-900 bg-amber-50/30 relative border-[12px] border-double border-emerald-800 m-2 sm:m-4 rounded-xl shadow-inner text-center space-y-6"
          id="quran-certificate-printable"
        >
          {/* Decorative Corners */}
          <div className="absolute top-2 left-2 text-amber-500 font-serif text-2xl select-none">❖</div>
          <div className="absolute top-2 right-2 text-amber-500 font-serif text-2xl select-none">❖</div>
          <div className="absolute bottom-2 left-2 text-amber-500 font-serif text-2xl select-none">❖</div>
          <div className="absolute bottom-2 right-2 text-amber-500 font-serif text-2xl select-none">❖</div>

          {/* Bismillah & Calligraphy Heading */}
          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-serif text-emerald-950 font-black tracking-widest">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-800 tracking-wider">
              "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
            </div>
          </div>

          {/* School Header */}
          <div className="flex flex-col items-center justify-center space-y-2 pt-2">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="School Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border-2 border-amber-400 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-800 rounded-2xl border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl shadow-md">
                TA
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-wide">
              {settings.schoolName}
            </h1>
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">
              {settings.schoolSubtitle || 'Markazka Quraanka & Barbaarinta Ubadka'}
            </p>
          </div>

          {/* Certificate Title */}
          <div className="py-2">
            <div className="inline-block px-6 py-2 bg-emerald-900 text-amber-300 rounded-full font-black text-sm sm:text-base border-2 border-amber-400 uppercase tracking-widest shadow-md">
              🎓 SHAHAADADA XIFDISKA QUR'AANKA (QURAN DIPLOMA)
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-4 max-w-xl mx-auto py-2">
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Maamulka iyo Dugsiga sare ee <strong className="text-emerald-950 font-black">{settings.schoolName}</strong> wuxuu markhaati ka yahay in ardayga sharafka leh ee lagu magacaabo:
            </p>

            <div className="py-2 border-b-2 border-amber-400 inline-block px-8 bg-white/80 rounded-xl shadow-xs">
              <span className="text-lg sm:text-2xl font-black text-emerald-900 tracking-wide uppercase">
                {student.fullName}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-800 space-y-1">
              <p>
                Wuxuu/Waxay si guul leh ku dhamaysatay xifdinta iyo aqrinta
              </p>
              <p className="text-base sm:text-lg font-black text-amber-900 bg-amber-100/80 inline-block px-4 py-1 rounded-lg border border-amber-300">
                {juzAchieved >= 30 ? "⭐ DHAMMAAN 30-KA JUZ EE QUR'AANKA KARIIMKA" : `📖 JUZ ${juzAchieved} EE QUR'AANKA KARIIMKA`}
              </p>
              {student.currentSurah && (
                <p className="text-xs font-bold text-emerald-800 mt-1">
                  Suuradda ugu dambeysay: {student.currentSurah}
                </p>
              )}
            </div>
          </div>

          {/* Grade / Evaluation */}
          {hifzRecord?.grade && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Dajada / Qiimaynta Hifz-ka: {hifzRecord.grade}</span>
            </div>
          )}

          {/* Signatures & Stamp Grid */}
          <div className="pt-8 grid grid-cols-3 gap-4 text-center items-end border-t border-slate-300/80">
            <div>
              <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
              <p className="text-[11px] font-extrabold text-slate-800 uppercase">Macallinka Class-ka</p>
              <p className="text-[10px] text-slate-500">Teacher Signature</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-100/50 flex flex-col items-center justify-center p-1 text-[9px] font-black text-emerald-900 uppercase leading-none text-center shadow-xs">
                <span>STAMP</span>
                <span className="text-[7px] text-amber-800 font-mono mt-0.5">VERIFIED</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Taariikhda: {certificateDate}</p>
            </div>

            <div>
              <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
              <p className="text-[11px] font-extrabold text-slate-800 uppercase">Maamulaha Dugsiga</p>
              <p className="text-[10px] text-slate-500">School Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
