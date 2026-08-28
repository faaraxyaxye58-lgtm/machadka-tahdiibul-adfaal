import React from 'react';
import { Student, SchoolSettings, HifzRecord, AttendanceRecord, PaymentTransaction } from '../types';
import { Printer, X, Users, BookMarked, CheckCircle2, Clock, ShieldAlert, Award, FileText, Sparkles, AlertCircle } from 'lucide-react';

interface PrintParentTeacherMeetingModalProps {
  student: Student;
  settings: SchoolSettings;
  hifzRecords: HifzRecord[];
  attendanceRecords: AttendanceRecord[];
  paymentRecords: PaymentTransaction[];
  teacherNotes?: string;
  onClose: () => void;
}

export const PrintParentTeacherMeetingModal: React.FC<PrintParentTeacherMeetingModalProps> = ({
  student,
  settings,
  hifzRecords,
  attendanceRecords,
  paymentRecords,
  teacherNotes = '',
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Calculate Student Attendance Metrics
  const studentAttendance = attendanceRecords.filter((a) => a.studentId === student.id || a.studentName === student.fullName);
  const totalAttDays = studentAttendance.length;
  const presentDays = studentAttendance.filter((a) => a.status === 'Present').length;
  const absentDays = studentAttendance.filter((a) => a.status === 'Absent').length;
  const lateDays = studentAttendance.filter((a) => a.status === 'Late').length;
  const excusedDays = studentAttendance.filter((a) => a.status === 'Permission' || a.status === 'Excused').length;
  
  const attRate = totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 95;

  // Calculate Student Hifz Metrics
  const studentHifz = hifzRecords.filter((h) => h.studentId === student.id || h.studentName === student.fullName);
  const latestHifz = studentHifz[0];

  // Calculate Fee Metrics
  const studentPayments = paymentRecords.filter((p) => p.studentId === student.id || p.studentName === student.fullName);
  const totalPaid = studentPayments.reduce((acc, p) => acc + p.amountPaid, 0);

  const currentDate = new Date().toLocaleDateString('so-SO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[95vh] overflow-y-auto">
        {/* Controls Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black tracking-wide uppercase">
              Warbixinta Shirka Waalidiinta (Parent-Teacher Meeting PDF Summary)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Daabac / Dejiso PDF (Print PDF)</span>
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

        {/* Printable Meeting Document */}
        <div className="p-8 sm:p-10 text-slate-900 bg-white space-y-6" id="pt-meeting-printable">
          {/* Document Header */}
          <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border-2 border-amber-400 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#0e7a48] text-amber-300 font-black flex items-center justify-center text-2xl rounded-2xl border-2 border-amber-400 shadow-xs">
                  TA
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
                  {settings.schoolName}
                </h1>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  {settings.schoolSubtitle || 'Markazka Quraanka & Barbaarinta Ubadka'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Sannad Dugsyeedka: <strong className="text-slate-800">{settings.academicYear}</strong> • Taariikhda: <strong className="text-slate-800">{currentDate}</strong>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3.5 py-1.5 bg-slate-900 text-amber-300 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-400/50 shadow-xs">
                📜 WARBIXINTA WAALIDKA
              </span>
              <p className="text-[11px] font-extrabold text-emerald-800 uppercase mt-1">
                Parent-Teacher Conference Summary
              </p>
            </div>
          </div>

          {/* Student & Parent Info Banner */}
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Magaca Ardayga:</span>
              <strong className="text-sm font-black text-slate-900 block">{student.fullName}</strong>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">ID Ardayga:</span>
              <strong className="font-mono font-bold text-slate-800 block">{student.studentId}</strong>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Fasalka:</span>
              <strong className="font-bold text-slate-800 block">{student.className}</strong>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Waalidka Guard:</span>
              <strong className="font-bold text-slate-900 block">{student.parentName} ({student.parentPhone})</strong>
            </div>
          </div>

          {/* Section 1: Hifz & Quran Performance */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b pb-1">
              <BookMarked className="w-4 h-4 text-[#0e7a48]" />
              <span>1. Heerka Xifdiga Qur'aanka Kariimka (Quran Progress)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Juz-ka Hada Ilbaa:</span>
                <span className="text-lg font-black text-[#0e7a48] block">Juz {student.currentJuz}</span>
                <span className="text-[10px] font-bold text-slate-500">
                  {student.currentJuz >= 30 ? '⭐ Dhammaystay 30-ka Juz' : `${Math.round((student.currentJuz / 30) * 100)}% Dhameeyay`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Suuradda Hada Uu Joogo:</span>
                <span className="text-sm font-black text-amber-900 block mt-1">{student.currentSurah || 'Suuradda 1-aad'}</span>
                <span className="text-[10px] font-medium text-slate-500">Hifz active</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Qiimaynta Casharkii Ugu Dambeeyay:</span>
                <span className="text-sm font-black text-emerald-800 block mt-1">
                  {latestHifz?.grade ? `Darajada: ${latestHifz.grade}` : 'Mumtaaz (A+)'}
                </span>
                <span className="text-[10px] font-medium text-slate-500">Duruus & Sabqi</span>
              </div>
            </div>
          </div>

          {/* Section 2: Attendance & Punctuality Breakdown */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b pb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>2. Warbixinta Xaadiriska & Dhaqanka (Attendance & Punctuality)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase block">Celceliska Joogitaanka</span>
                <strong className="text-xl font-black text-blue-900">{attRate}%</strong>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] font-extrabold text-emerald-900 uppercase block">Maalmood Joogay</span>
                <strong className="text-lg font-black text-emerald-800">{presentDays} Maalmood</strong>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                <span className="text-[10px] font-extrabold text-rose-900 uppercase block">Maalmood Maqnaa</span>
                <strong className="text-lg font-black text-rose-700">{absentDays} Maalmood</strong>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase block">Ragaaday / Idan</span>
                <strong className="text-lg font-black text-amber-800">{lateDays + excusedDays} Maalmood</strong>
              </div>
            </div>
          </div>

          {/* Section 3: Financial Overview */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b pb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>3. Xaaladda Bixinta Adaada (Tuition Fee Status)</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-semibold">
              <div className="space-y-0.5">
                <p className="text-slate-700">Adaada Bisha: <strong className="text-slate-900 font-extrabold">${student.feeMonthly}.00</strong></p>
                <p className="text-slate-500 text-[11px]">Wadarta Bishan Bixisay: ${totalPaid}.00</p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  student.feeStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  {student.feeStatus === 'Paid' ? '✅ La Bixiyay (Paid)' : '⚠️ Deyn Baa Ku Dhiman (Unpaid)'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Teacher & Principal Notes for Parent */}
          <div className="space-y-2 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b pb-1">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>4. Talooyinka Macallinka & Maamulka (Teacher Evaluation & Home Guidance)</span>
            </h3>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-800 space-y-2 min-h-[90px]">
              <p className="font-bold text-amber-950">
                Xusuusin & Talooyin loo jeedinayo Waalidka Guriga:
              </p>
              <p className="leading-relaxed font-medium italic text-slate-800 whitespace-pre-wrap">
                {teacherNotes ||
                  "Ardaygu wuxuu muujiyay dadaal sare xifdiska Qur'aanka. Waxaan waalidka ka codsanaynaa in ay guriga kaga cawiyaan marooraanka (sabqiga) ugu dambeya si uu xifdiskiisu u noqdo mid sugan."}
              </p>
            </div>
          </div>

          {/* Signatures Grid */}
          <div className="pt-8 grid grid-cols-3 gap-4 text-center items-end border-t border-slate-300">
            <div>
              <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
              <p className="text-[11px] font-extrabold text-slate-800 uppercase">Sinaanta Waalidka</p>
              <p className="text-[10px] text-slate-500">Parent Signature</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-amber-500 bg-amber-50 flex flex-col items-center justify-center p-1 text-[8px] font-black text-emerald-950 uppercase leading-none shadow-2xs">
                <span>SEAL</span>
                <span className="text-[6px] text-amber-800 font-mono mt-0.5">OFFICIAL</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Taariikhda Shirka</p>
            </div>

            <div>
              <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
              <p className="text-[11px] font-extrabold text-slate-800 uppercase">Macallinka Class-ka</p>
              <p className="text-[10px] text-slate-500">Teacher Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
