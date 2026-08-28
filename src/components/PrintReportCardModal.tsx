import React from 'react';
import { ExamRecord, Student, SchoolSettings } from '../types';
import { Printer, X, Award, CheckCircle } from 'lucide-react';

interface PrintReportCardModalProps {
  exam: ExamRecord;
  student?: Student;
  settings: SchoolSettings;
  onClose: () => void;
}

export const PrintReportCardModal: React.FC<PrintReportCardModalProps> = ({
  exam,
  student,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold">Kaarka Natiijada Imtixaanka (Report Card)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Daabac (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div className="p-8 space-y-6 text-slate-800 bg-white" id="reportcard-printable">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-400 bg-emerald-50 p-1 shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-xl">
                    TA
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-black text-emerald-950">{settings.schoolName}</h1>
                <p className="text-xs text-slate-600">{settings.schoolSubtitle}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Sannad Dugsyeedka: {settings.academicYear}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-900 text-amber-300 rounded-lg text-xs font-extrabold uppercase">
                KAARKA NATIIJADA
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1">{exam.term}</p>
            </div>
          </div>

          {/* Student Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Ardayga:</span>
              <span className="font-bold text-emerald-950 text-sm block">{exam.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Tixraaca ID:</span>
              <span className="font-mono font-bold text-slate-800 block">{student?.studentId || 'TA-2026'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Fasalka:</span>
              <span className="font-semibold text-slate-800 block">{student?.className || 'Fasal A'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Juz-ka Qur'aanka:</span>
              <span className="font-bold text-amber-800 block">Juz {student?.currentJuz || 1}</span>
            </div>
          </div>

          {/* Grades Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Darajooyinka Maadooyinka:
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-900 text-white font-bold text-left">
                  <th className="p-2.5 rounded-tl-lg">Maaddada</th>
                  <th className="p-2.5 text-center">Tirada Sare</th>
                  <th className="p-2.5 text-center">Dhibcaha Ardayga</th>
                  <th className="p-2.5 text-center rounded-tr-lg">Xaaladda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border border-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800">Qur'aanka Kariimka (Xifdi)</td>
                  <td className="p-2.5 text-center text-slate-500">100</td>
                  <td className="p-2.5 text-center font-bold text-emerald-800 text-sm">{exam.quranScore}</td>
                  <td className="p-2.5 text-center text-emerald-700 font-bold">Guul</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800">Tajwiidka & Dhageysiga</td>
                  <td className="p-2.5 text-center text-slate-500">100</td>
                  <td className="p-2.5 text-center font-bold text-emerald-800 text-sm">{exam.tajweedScore}</td>
                  <td className="p-2.5 text-center text-emerald-700 font-bold">Guul</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800">Tarbiya Islaamiya & Akhlaaq</td>
                  <td className="p-2.5 text-center text-slate-500">100</td>
                  <td className="p-2.5 text-center font-bold text-emerald-800 text-sm">{exam.tarbiyaScore}</td>
                  <td className="p-2.5 text-center text-emerald-700 font-bold">Guul</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800">Luuqada Carabiga & Qaaciydo</td>
                  <td className="p-2.5 text-center text-slate-500">100</td>
                  <td className="p-2.5 text-center font-bold text-emerald-800 text-sm">{exam.carabigaScore}</td>
                  <td className="p-2.5 text-center text-emerald-700 font-bold">Guul</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scores Summary & Rank */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Wadarta Dhibcaha</span>
              <span className="text-xl font-black text-slate-900">{exam.totalScore} / 400</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Celceliska (%)</span>
              <span className="text-xl font-black text-emerald-900">{exam.averagePercentage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-center">
              <span className="text-[10px] text-amber-800 font-bold uppercase block">Kaalinta Fasalka</span>
              <span className="text-xl font-black text-amber-950">
                Kaalinta {exam.rankInClass || 1}aad
              </span>
            </div>
          </div>

          {/* Remarks */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">Faallada Macallinka:</span>
            <p className="text-slate-600 italic">"{exam.remarks}"</p>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1 text-slate-400 font-mono">
                [Saxiixa Macallinka]
              </div>
              <p className="text-slate-500 mt-1 text-[11px]">Macallinka Fasalka</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-300 flex items-end justify-center pb-1 text-slate-400 font-mono">
                [Saxiixa Maamulaha]
              </div>
              <p className="text-slate-500 mt-1 text-[11px]">{settings.principalName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
