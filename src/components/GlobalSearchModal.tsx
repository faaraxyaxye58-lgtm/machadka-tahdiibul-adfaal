import React, { useState, useEffect } from 'react';
import { Student, Teacher, Parent, PaymentTransaction, ClassRoom } from '../types';
import { Search, X, UserCheck, GraduationCap, Users, DollarSign, BookOpen, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  classes: ClassRoom[];
  payments: PaymentTransaction[];
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  students,
  teachers,
  parents,
  classes,
  payments,
  onClose,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const cleanQuery = query.trim().toLowerCase();

  const matchingStudents = cleanQuery
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(cleanQuery) ||
          s.studentId.toLowerCase().includes(cleanQuery) ||
          s.className.toLowerCase().includes(cleanQuery) ||
          s.parentName.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingTeachers = cleanQuery
    ? teachers.filter(
        (t) =>
          t.fullName.toLowerCase().includes(cleanQuery) ||
          t.subject.toLowerCase().includes(cleanQuery) ||
          t.phone.includes(cleanQuery)
      )
    : [];

  const matchingParents = cleanQuery
    ? parents.filter(
        (p) =>
          p.fullName.toLowerCase().includes(cleanQuery) ||
          p.phone.includes(cleanQuery) ||
          p.occupation?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingPayments = cleanQuery
    ? payments.filter(
        (p) =>
          p.studentName.toLowerCase().includes(cleanQuery) ||
          p.invoiceNumber.toLowerCase().includes(cleanQuery) ||
          p.monthYear.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults =
    matchingStudents.length +
    matchingTeachers.length +
    matchingParents.length +
    matchingPayments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[85vh] flex flex-col">
        {/* Search Bar Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center gap-3 shrink-0">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Raadi Arday, Macallin, Waalid, ama Invoice Number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer shrink-0"
          >
            Esc
          </button>
        </div>

        {/* Search Results Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!cleanQuery ? (
            <div className="text-center py-10 space-y-2">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                Gali magac ama ID si aad u raadiso xogta dugsiga oo idil.
              </p>
              <p className="text-[11px] text-slate-400">
                Ardayda, Macallimiinta, Waalidiinta, iyo Bixinta Lacagaha.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs font-bold text-slate-500">
                Lama helin xog u dhigma "<span className="text-slate-900">{query}</span>".
              </p>
            </div>
          ) : (
            <>
              {/* Students Match */}
              {matchingStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between border-b pb-1">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <GraduationCap className="w-4 h-4 text-[#0e7a48]" />
                      <span>Ardayda ({matchingStudents.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('students');
                        onClose();
                      }}
                      className="text-[10px] text-[#0e7a48] hover:underline font-bold"
                    >
                      Eeg Dhammaan ➔
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingStudents.slice(0, 6).map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onNavigateTab('students');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-950">
                            {s.fullName} ({s.studentId})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Fasalka: {s.className} • Waalid: {s.parentName}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teachers Match */}
              {matchingTeachers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between border-b pb-1">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Macallimiinta ({matchingTeachers.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('teachers');
                        onClose();
                      }}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      Eeg Dhammaan ➔
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingTeachers.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigateTab('teachers');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-blue-950">
                            {t.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Maaddada: {t.subject} • Tel: {t.phone}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parents Match */}
              {matchingParents.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between border-b pb-1">
                    <span className="flex items-center gap-1.5 text-purple-800">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Waalidiinta ({matchingParents.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('parents');
                        onClose();
                      }}
                      className="text-[10px] text-purple-700 hover:underline font-bold"
                    >
                      Eeg Dhammaan ➔
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingParents.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigateTab('parents');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-purple-950">
                            {p.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Tel: {p.phone}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Match */}
              {matchingPayments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between border-b pb-1">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>Bixinta Lacagaha ({matchingPayments.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        onNavigateTab('payments');
                        onClose();
                      }}
                      className="text-[10px] text-amber-700 hover:underline font-bold"
                    >
                      Eeg Dhammaan ➔
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingPayments.slice(0, 4).map((pay) => (
                      <div
                        key={pay.id}
                        onClick={() => {
                          onNavigateTab('payments');
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-amber-950">
                            {pay.studentName} (${pay.amount})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Invoice: {pay.invoiceNumber} • {pay.monthYear}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
