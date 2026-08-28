import React, { useState } from 'react';
import { Teacher, TeacherEvaluation, User } from '../types';
import { X, Star, Award, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, MessageSquare, BookOpen, ThumbsUp } from 'lucide-react';

interface TeacherEvaluationModalProps {
  currentUser?: User | null;
  teachers: Teacher[];
  selectedTeacherId?: string;
  initialEvaluation?: TeacherEvaluation | null;
  onSaveEvaluation: (evaluation: TeacherEvaluation) => void;
  onClose: () => void;
}

export const TeacherEvaluationModal: React.FC<TeacherEvaluationModalProps> = ({
  currentUser,
  teachers,
  selectedTeacherId,
  initialEvaluation,
  onSaveEvaluation,
  onClose,
}) => {
  const [teacherId, setTeacherId] = useState<string>(
    initialEvaluation?.teacherId || selectedTeacherId || teachers[0]?.id || ''
  );
  const [evaluatorName, setEvaluatorName] = useState<string>(
    initialEvaluation?.evaluatorName || currentUser?.name || 'Agaasimaha Machadka (Admin)'
  );
  const [evaluationDate, setEvaluationDate] = useState<string>(
    initialEvaluation?.evaluationDate || new Date().toISOString().split('T')[0]
  );
  const [academicTerm, setAcademicTerm] = useState<string>(
    initialEvaluation?.academicTerm || 'Kalfadhiga Bisha Ogoosto 2026'
  );

  const [teachingScore, setTeachingScore] = useState<number>(initialEvaluation?.teachingScore || 5);
  const [quranPunctualityScore, setQuranPunctualityScore] = useState<number>(
    initialEvaluation?.quranPunctualityScore || 5
  );
  const [disciplineScore, setDisciplineScore] = useState<number>(initialEvaluation?.disciplineScore || 4);
  const [studentEngagementScore, setStudentEngagementScore] = useState<number>(
    initialEvaluation?.studentEngagementScore || 5
  );

  const [strengths, setStrengths] = useState<string>(
    initialEvaluation?.strengths ||
      'Dhigista Tajwiidka iyo xifdiyeinta ardayda si qoto dheer; ilaalinta xifdiga maalinlaha ah.'
  );
  const [areasForImprovement, setAreasForImprovement] = useState<string>(
    initialEvaluation?.areasForImprovement ||
      'Kordhinta isticmaalka qorshe-hoosaadka manhajka iyo dhiirigelinta ardayda xishoodka badan.'
  );
  const [adminComments, setAdminComments] = useState<string>(
    initialEvaluation?.adminComments ||
      "Macallin muqaddas ah oo karti sare u leh maamulka fasalka iyo taya-dhowrka akhriska Qur'aanka."
  );
  const [recommendation, setRecommendation] = useState<TeacherEvaluation['recommendation']>(
    initialEvaluation?.recommendation || 'Excellent'
  );

  // Calculate overall rating out of 5
  const overallRating = Number(
    ((teachingScore + quranPunctualityScore + disciplineScore + studentEngagementScore) / 4).toFixed(1)
  );

  const selectedTeacher = teachers.find((t) => t.id === teacherId) || teachers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const newEval: TeacherEvaluation = {
      id: initialEvaluation?.id || `eval-${Date.now()}`,
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.fullName,
      evaluatorName,
      evaluationDate,
      academicTerm,
      teachingScore,
      quranPunctualityScore,
      disciplineScore,
      studentEngagementScore,
      overallRating,
      strengths,
      areasForImprovement,
      adminComments,
      recommendation,
      createdAt: initialEvaluation?.createdAt || new Date().toISOString(),
    };

    onSaveEvaluation(newEval);
  };

  const renderStarPicker = (label: string, value: number, onChange: (val: number) => void) => {
    return (
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>{label}</span>
          <span className="text-[#0e7a48] font-black">{value} / 5</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                star <= value
                  ? 'bg-amber-100 text-amber-500 hover:bg-amber-200'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
              }`}
            >
              <Star className={`w-5 h-5 ${star <= value ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e7a48] text-white">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {initialEvaluation ? 'Beddel Qiimaynta Macallinka (Edit Review)' : 'Form-ka Qiimaynta Macallinka (Teacher Evaluation Log)'}
              </h3>
              <p className="text-[11px] text-emerald-100">Diiwaangelinta kormeerka & qiimaynta waxqabadka macallinka</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evaluation Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Teacher & Evaluator Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Macallinka La Qiimaynayo *
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-bold text-slate-800"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.assignedClasses.join(', ') || 'Macallin'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qofka Kormeeray / Qiimeeyay (Evaluator) *
              </label>
              <input
                type="text"
                required
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taariikhda Qiimaynta (Evaluation Date) *
              </label>
              <input
                type="date"
                required
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kalfadhiga Waxbarashada (Academic Term) *
              </label>
              <input
                type="text"
                required
                placeholder="Kalfadhiga Bisha Ogoosto 2026"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>
          </div>

          {/* Performance Rating Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Qodobbada Qiimaynta Waxqabadka (1 - 5 Xiddigood):</span>
              </h4>
              <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-black flex items-center gap-1">
                <span>Natiijada Guud:</span>
                <span className="text-amber-600 text-sm">{overallRating} / 5.0</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderStarPicker('1. Tayo Dhigista & Tajwiidka (Teaching)', teachingScore, setTeachingScore)}
              {renderStarPicker('2. Ilaalinta Waqtiga (Punctuality)', quranPunctualityScore, setQuranPunctualityScore)}
              {renderStarPicker('3. Edbinta & Maamulka Fasalka', disciplineScore, setDisciplineScore)}
              {renderStarPicker('4. Dhiirigelinta Ardayda (Engagement)', studentEngagementScore, setStudentEngagementScore)}
            </div>
          </div>

          {/* Textarea fields for qualitative feedback */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Awoodaha & Qodobada Wanaagsan (Strengths)</span>
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Qobobada muhiimka ah oo uu macallinku kaga fiican yahay dhigista iyo maamulka ardayda..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Qodobada U Baahan Horumarinta (Areas for Improvement)</span>
              </label>
              <textarea
                rows={2}
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                placeholder="Xirfadaha ama hababka u baahan dib-u-eegis iyo horumarin freetalk ah..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#0e7a48]" />
                <span>Gunaanadka & Fikradaha Maamulka (Admin Comments)</span>
              </label>
              <textarea
                rows={2}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Warbixinta guud ee maamuluhu ku tirtirsiinayo ama ku dhiirigelinayo macallinka..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48]"
              />
            </div>
          </div>

          {/* Recommendation Selection */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
            <label className="block text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0e7a48]" />
              <span>Talo Bixinta & Go'aanka Maamulka (Recommendation) *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { id: 'Excellent', label: '🌟 Excellent (Sare)', color: 'border-emerald-500 bg-emerald-100 text-emerald-900' },
                { id: 'Promote', label: '🎖️ Promote (Dallacsiin)', color: 'border-blue-500 bg-blue-100 text-blue-900' },
                { id: 'Retain', label: '👍 Retain (Mahadcelin)', color: 'border-slate-400 bg-slate-100 text-slate-900' },
                { id: 'Needs Training', label: '📘 Needs Training', color: 'border-amber-500 bg-amber-100 text-amber-900' },
                { id: 'Warning', label: '⚠️ Warning (Digniin)', color: 'border-rose-500 bg-rose-100 text-rose-900' },
              ].map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecommendation(rec.id as any)}
                  className={`p-2 rounded-xl border-2 font-bold transition-all text-[11px] cursor-pointer text-center ${
                    recommendation === rec.id
                      ? `${rec.color} shadow-xs ring-2 ring-[#0e7a48]`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Kanasal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
              <span>Keydi Qiimaynta (Save to Firestore)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
