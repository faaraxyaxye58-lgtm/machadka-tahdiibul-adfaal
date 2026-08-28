import React, { useState } from 'react';
import { ExamRecord, Student, ClassRoom, SchoolSettings, User } from '../types';
import { ClipboardList, Plus, Printer, Award, Search, X, Edit2, Trash2 } from 'lucide-react';

interface ExamsViewProps {
  currentUser?: User | null;
  exams: ExamRecord[];
  students: Student[];
  classes: ClassRoom[];
  settings: SchoolSettings;
  onAddExam: (exam: Omit<ExamRecord, 'id' | 'totalScore' | 'averagePercentage'>) => void;
  onUpdateExam?: (exam: ExamRecord) => void;
  onDeleteExam?: (id: string) => void;
  onPrintReportCard: (exam: ExamRecord) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  currentUser,
  exams,
  students,
  classes,
  settings,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onPrintReportCard,
}) => {
  const canManageExams = currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRecord | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [term, setTerm] = useState('Imtixaanka Bisha Ogoosto');
  const [quranScore, setQuranScore] = useState<number>(95);
  const [tajweedScore, setTajweedScore] = useState<number>(90);
  const [tarbiyaScore, setTarbiyaScore] = useState<number>(88);
  const [carabigaScore, setCarabigaScore] = useState<number>(85);
  const [remarks, setRemarks] = useState('Dadaal wanaagsan oo lagu kalsoonaan karo.');

  const filteredExams = exams.filter((ex) => {
    if (currentUser?.role === 'student') {
      const isMe =
        ex.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        ex.studentId.toLowerCase() === currentUser.username.toLowerCase();
      if (!isMe) return false;
    } else if (currentUser?.role === 'parent') {
      const myChildren = students.filter(
        (s) =>
          s.parentName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          (currentUser.phone && s.parentPhone.includes(currentUser.phone))
      );
      const childNames = myChildren.map((c) => c.fullName.toLowerCase());
      const isMyChild = childNames.some((nm) => ex.studentName.toLowerCase().includes(nm));
      if (!isMyChild && myChildren.length > 0) return false;
    }
    return true;
  });

  const openEditModal = (ex: ExamRecord) => {
    setEditingExam(ex);
    setSelectedStudentId(ex.studentId);
    setTerm(ex.term);
    setQuranScore(ex.quranScore);
    setTajweedScore(ex.tajweedScore);
    setTarbiyaScore(ex.tarbiyaScore);
    setCarabigaScore(ex.carabigaScore);
    setRemarks(ex.remarks || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selStudent = students.find((s) => s.id === selectedStudentId);
    const stName = selStudent ? selStudent.fullName : 'Arday';
    const cId = selStudent ? selStudent.classId : 'cls-1';

    if (editingExam) {
      if (onUpdateExam) {
        onUpdateExam({
          ...editingExam,
          studentId: selectedStudentId,
          studentName: stName,
          classId: cId,
          term,
          quranScore,
          tajweedScore,
          tarbiyaScore,
          carabigaScore,
          remarks,
        });
      }
      setEditingExam(null);
    } else {
      onAddExam({
        studentId: selectedStudentId,
        studentName: stName,
        classId: cId,
        term,
        quranScore,
        tajweedScore,
        tarbiyaScore,
        carabigaScore,
        remarks,
        rankInClass: 1,
      });
      setIsOpenModal(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-700" />
            <span>Natiijooyinka Imtixaannada & Kaararka</span>
          </h2>
          <p className="text-xs text-slate-500">
            Geli dhibcaha maadooyinka (Qur'aan, Tajwiid, Tarbiya, Carabiga) iyo soosaarida kaarka ({exams.length} Imtixaan)
          </p>
        </div>

        {canManageExams && (
          <button
            onClick={() => {
              setEditingExam(null);
              setIsOpenModal(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Geli Imtixaan Cusub</span>
          </button>
        )}
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.map((ex) => (
          <div
            key={ex.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900">
                    {ex.term}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{ex.studentName}</h3>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                  Kaalinta {ex.rankInClass || 1}aad
                </span>
              </div>

              {/* Score Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">Qur'aan (Xifdi):</span>
                  <span className="font-extrabold text-emerald-800">{ex.quranScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">Tajwiid:</span>
                  <span className="font-extrabold text-emerald-800">{ex.tajweedScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">Tarbiya:</span>
                  <span className="font-extrabold text-emerald-800">{ex.tarbiyaScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold">Carabiga:</span>
                  <span className="font-extrabold text-emerald-800">{ex.carabigaScore} / 100</span>
                </div>
              </div>

              {/* Average Banner */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-900 text-white rounded-xl">
                <span className="text-xs text-emerald-200">Celceliska:</span>
                <span className="text-sm font-black text-amber-300">{ex.averagePercentage}%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-500 italic max-w-[140px] truncate">
                "{ex.remarks}"
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPrintReportCard(ex)}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  title="Dabac Kaarka Natiijada"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Kaarka</span>
                </button>

                <button
                  onClick={() => openEditModal(ex)}
                  className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                  title="Wax ka beddel Natiijada"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {onDeleteExam && (
                  <button
                    onClick={() => onDeleteExam(ex.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Tirtir Imtixaanka"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Exam Modal */}
      {(isOpenModal || editingExam) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{editingExam ? 'Wax ka beddel Natiijada Imtixaanka (Edit)' : 'Geli Natiijada Imtixaanka'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenModal(false);
                  setEditingExam(null);
                }}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dooro Ardayga *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Muddada Imtixaanka</label>
                <input
                  type="text"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qur'aan (100)</label>
                  <input
                    type="number"
                    max={100}
                    value={quranScore}
                    onChange={(e) => setQuranScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tajwiid (100)</label>
                  <input
                    type="number"
                    max={100}
                    value={tajweedScore}
                    onChange={(e) => setTajweedScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarbiya (100)</label>
                  <input
                    type="number"
                    max={100}
                    value={tarbiyaScore}
                    onChange={(e) => setTarbiyaScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Carabi (100)</label>
                  <input
                    type="number"
                    max={100}
                    value={carabigaScore}
                    onChange={(e) => setCarabigaScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faallada / Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setEditingExam(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Keydi Isbeddelka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
