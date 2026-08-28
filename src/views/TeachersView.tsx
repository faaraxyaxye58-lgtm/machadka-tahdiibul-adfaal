import React, { useState } from 'react';
import { Teacher, ClassRoom, Student, Gender, SchoolSettings, User, TeacherEvaluation } from '../types';
import { Users, Plus, Phone, Mail, BookOpen, Calendar, DollarSign, Trash2, X, Clock, CheckCircle2, UserCheck, Edit2, Lock, Star, Award, ShieldCheck, Printer, FileText, Search, ThumbsUp, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatMoney, isFinancialDataHidden } from '../utils/moneyUtils';
import { TeacherEvaluationModal } from '../components/TeacherEvaluationModal';

interface TeachersViewProps {
  currentUser?: User | null;
  users?: User[];
  teachers: Teacher[];
  classes: ClassRoom[];
  students?: Student[];
  settings: SchoolSettings;
  evaluations?: TeacherEvaluation[];
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'teacherId'>, credentials?: { username: string; password: string }) => void;
  onUpdateTeacher?: (teacher: Teacher, credentials?: { username: string; password: string }) => void;
  onDeleteTeacher: (id: string) => void;
  onSaveEvaluation?: (evaluation: TeacherEvaluation) => void;
  onDeleteEvaluation?: (id: string) => void;
  isMoneyHidden?: boolean;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  currentUser,
  users = [],
  teachers,
  classes,
  students = [],
  settings,
  evaluations = [],
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onSaveEvaluation,
  onDeleteEvaluation,
  isMoneyHidden = false,
}) => {
  const shouldHideMoney = isFinancialDataHidden(currentUser, settings, isMoneyHidden);
  const isAdmin = currentUser?.role === 'admin';
  const canEditTeachers = isAdmin || (currentUser?.role === 'teacher' && settings?.privacyPermissions?.restrictClassAndTeacherEditingToAdmin === false);

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'evaluations'>('list');
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenEvalModal, setIsOpenEvalModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<TeacherEvaluation | null>(null);
  const [selectedTeacherForStudents, setSelectedTeacherForStudents] = useState<Teacher | null>(null);

  // Filters for Evaluations
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [selectedRecFilter, setSelectedRecFilter] = useState<string>('all');
  const [evalSearchQuery, setEvalSearchQuery] = useState<string>('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+252 61 ');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [photoUrl, setPhotoUrl] = useState('');
  const [subjectSpecialty, setSubjectSpecialty] = useState("Hifzi Qur'aan & Tajwiid");
  const [assignedClass, setAssignedClass] = useState(classes[0]?.name || 'Juz Amma');
  const [salary, setSalary] = useState<number>(200);

  const openEditModal = (tch: Teacher) => {
    setEditingTeacher(tch);
    setFullName(tch.fullName);
    setPhone(tch.phone);
    setEmail(tch.email);
    
    // Find matching user record
    const existingUser = users.find(
      (u) =>
        u.id === tch.id ||
        (u.phone && u.phone.replace(/\D/g, '') === tch.phone.replace(/\D/g, '')) ||
        u.name.trim().toLowerCase() === tch.fullName.trim().toLowerCase()
    );
    setUsername(existingUser?.username || `tch_${tch.fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    setPassword(existingUser?.password || '123456');
    setPhotoUrl(tch.photoUrl || '');
    setSubjectSpecialty(tch.subjectSpecialty || "Hifzi Qur'aan & Tajwiid");
    setAssignedClass(tch.assignedClasses[0] || classes[0]?.name || 'Juz Amma');
    setSalary(tch.salary);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = {
      username: username || `tch_${fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      password: password || '123456',
    };

    if (editingTeacher) {
      if (onUpdateTeacher) {
        onUpdateTeacher(
          {
            ...editingTeacher,
            fullName,
            phone,
            email: email || editingTeacher.email,
            photoUrl,
            subjectSpecialty,
            assignedClasses: [assignedClass],
            salary,
          },
          creds
        );
      }
      setEditingTeacher(null);
    } else {
      onAddTeacher(
        {
          fullName,
          gender: 'Male',
          phone,
          email: email || `${fullName.toLowerCase().replace(/\s+/g, '')}@tahdiib.edu`,
          photoUrl,
          subjectSpecialty,
          assignedClasses: [assignedClass],
          salary,
          hireDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        },
        creds
      );
      setIsOpenAddModal(false);
    }

    setFullName('');
    setPhotoUrl('');
    setUsername('');
    setPassword('123456');
  };

  // Filtered Evaluations
  const filteredEvaluations = evaluations.filter((ev) => {
    if (selectedTeacherFilter !== 'all' && ev.teacherId !== selectedTeacherFilter) return false;
    if (selectedRecFilter !== 'all' && ev.recommendation !== selectedRecFilter) return false;
    if (evalSearchQuery.trim()) {
      const q = evalSearchQuery.toLowerCase();
      return (
        ev.teacherName.toLowerCase().includes(q) ||
        ev.evaluatorName.toLowerCase().includes(q) ||
        ev.academicTerm.toLowerCase().includes(q) ||
        ev.strengths.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePrintEvaluation = (ev: TeacherEvaluation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Warbixinta Qiimaynta Macallinka - ${ev.teacherName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0e7a48; padding-bottom: 15px; margin-bottom: 20px; }
            .school-title { font-size: 22px; font-weight: bold; color: #0e7a48; }
            .school-sub { font-size: 13px; color: #64748b; }
            .doc-title { font-size: 16px; font-weight: bold; margin-top: 10px; background: #f0fdf4; color: #166534; padding: 8px; border-radius: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 13px; }
            .score-box { background: #fff8e1; border: 1px solid #ffe082; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .score-num { font-size: 28px; font-weight: bold; color: #b45309; }
            .section { margin-bottom: 15px; font-size: 13px; }
            .section-title { font-weight: bold; color: #0e7a48; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-title">${settings.schoolName || 'Tahdiibul Adfaal MIS'}</div>
            <div class="school-sub">${settings.schoolSubtitle || 'WARBIXINTA QIIMAYNTA WAXQABADKA MACALLINKA'}</div>
            <div class="doc-title">TEACHER PERFORMANCE EVALUATION REPORT</div>
          </div>

          <div class="grid">
            <div><strong>Macallinka:</strong> ${ev.teacherName}</div>
            <div><strong>Kormeeraha (Evaluator):</strong> ${ev.evaluatorName}</div>
            <div><strong>Taariikhda Qiimaynta:</strong> ${ev.evaluationDate}</div>
            <div><strong>Kalfadhiga:</strong> ${ev.academicTerm}</div>
          </div>

          <div class="score-box">
            <div>NATIIJADA GUUD EE QIIMAYNTA (OVERALL RATING)</div>
            <div class="score-num">⭐ ${ev.overallRating} / 5.0</div>
            <div><strong>Go'aanka Maamulka:</strong> ${ev.recommendation}</div>
          </div>

          <div class="section">
            <div class="section-title">1. TAYA-DHOWRKA QODOBBADA (RATING BREAKDOWN)</div>
            <ul>
              <li>Tayo Dhigista & Tajwiidka: <strong>${ev.teachingScore} / 5</strong></li>
              <li>Ilaalinta Waqtiga & Xaadiriska: <strong>${ev.quranPunctualityScore} / 5</strong></li>
              <li>Edbinta & Maamulka Fasalka: <strong>${ev.disciplineScore} / 5</strong></li>
              <li>Dhiirigelinta & Natiijada Ardayda: <strong>${ev.studentEngagementScore} / 5</strong></li>
            </ul>
          </div>

          <div class="section">
            <div class="section-title">2. AWOODAHA & QODOBBADA WANAAGSAN (STRENGTHS)</div>
            <p>${ev.strengths || 'N/A'}</p>
          </div>

          <div class="section">
            <div class="section-title">3. QODOBBADA U BAAHAN HORUMARINTA (AREAS FOR IMPROVEMENT)</div>
            <p>${ev.areasForImprovement || 'N/A'}</p>
          </div>

          <div class="section">
            <div class="section-title">4. GUNAANADKA & FIKRADAHA MAAMULKA (ADMIN COMMENTS)</div>
            <p>${ev.adminComments || 'N/A'}</p>
          </div>

          <div class="footer">
            <div>Sahiixa Kormeeraha: ______________________</div>
            <div>Sahiixa Agaasimaha: ______________________</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="space-y-5">
      {/* Header with Navigation Sub-tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0e7a48]" />
              <span>Bogga Macallimiinta & Qiimaynta (Teacher Management & Performance Review)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Diiwaanka macallimiinta, fasallada ay dhigaan, iyo kormeerka qiimaynta waxqabadka maamulka.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEditTeachers && activeSubTab === 'evaluations' && (
              <button
                onClick={() => {
                  setEditingEvaluation(null);
                  setIsOpenEvalModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-200" />
                <span>+ Bixi Qiimayn Cusub (New Evaluation)</span>
              </button>
            )}

            {canEditTeachers && activeSubTab === 'list' && (
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setFullName('');
                  setPhotoUrl('');
                  setIsOpenAddModal(true);
                }}
                className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#d4af37]" />
                <span>+ Ku Dar Macallin Cusub</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'list'
                ? 'bg-[#0e7a48] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Diiwaanka Macallimiinta ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('evaluations')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'evaluations'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>⭐ Qiimaynta Waxqabadka (Teacher Evaluations - {evaluations.length})</span>
          </button>
        </div>
      </div>

      {!canEditTeachers && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>🔒 Maamulka Macallimiinta: Kaliya Maamulaha (Admin) ayaa xaq u leh inuu ku daro macallin ama qiimeyo waxqabadkiisa.</span>
        </div>
      )}

      {/* SUB-TAB 1: TEACHER LIST */}
      {activeSubTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((tch) => {
            const teacherClass = classes.find((c) => c.teacherId === tch.id || tch.assignedClasses.includes(c.name));
            const assignedClassName = teacherClass ? teacherClass.name : tch.assignedClasses[0] || 'Xifdi Kaamil';

            const countStudents = students.filter(
              (s) => (teacherClass && s.classId === teacherClass.id) || s.className.includes(assignedClassName)
            ).length || (teacherClass ? teacherClass.totalStudents : 15);

            // Latest evaluation rating for this teacher
            const teacherEvals = evaluations.filter((e) => e.teacherId === tch.id);
            const latestEval = teacherEvals.sort(
              (a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime()
            )[0];

            return (
              <div
                key={tch.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#0e7a48] transition-all p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0e7a48] text-[#d4af37] font-black text-lg flex items-center justify-center border border-amber-300 shadow-xs overflow-hidden shrink-0">
                        {tch.photoUrl ? (
                          <img src={tch.photoUrl} alt={tch.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{tch.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                          {tch.fullName}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">{tch.teacherId}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-[#0e7a48]">
                      {tch.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                      <BookOpen className="w-3.5 h-3.5 text-[#0e7a48] shrink-0" />
                      <span>Fasalka: <strong className="text-[#0e7a48]">{assignedClassName}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Tirada Ardayda: <strong className="text-slate-900">{countStudents} Arday</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{tch.phone}</span>
                    </div>

                    {/* Latest Rating Badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Qiimaynta Maamulka:</span>
                      </span>
                      {latestEval ? (
                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-extrabold rounded text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{latestEval.overallRating} / 5</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Weli la ma qiimayn</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-[11px]">
                      <DollarSign className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span>
                        Mushaharka: <strong>
                          {settings.privacyPermissions?.hideTeacherSalary && !isAdmin
                            ? '🔒 Qaron (Admin Only)'
                            : formatMoney(tch.salary, shouldHideMoney, settings.currency)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedTeacherForStudents(tch)}
                      className="px-2 py-1 bg-[#0e7a48]/10 text-[#0e7a48] hover:bg-[#0e7a48] hover:text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Ardayda ({countStudents})
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditingEvaluation(null);
                          setSelectedTeacherFilter(tch.id);
                          setIsOpenEvalModal(true);
                        }}
                        className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-600 hover:text-white rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Bixi Qiimayn Cusub"
                      >
                        <Award className="w-3 h-3" />
                        <span>Qiimee</span>
                      </button>
                    )}
                  </div>

                  {canEditTeachers && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(tch)}
                        className="p-1.5 text-slate-500 hover:text-[#0e7a48] hover:bg-emerald-50 rounded cursor-pointer"
                        title="Beddel Xogta Macallinka"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTeacher(tch.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 cursor-pointer"
                        title="Tirtir Macallinka"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: TEACHER EVALUATIONS LIST */}
      {activeSubTab === 'evaluations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Raadi magaca macallinka, kormeeraha, ama faahfaahinta..."
                  value={evalSearchQuery}
                  onChange={(e) => setEvalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div>
                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="all">Dhammaan Macallimiinta ({teachers.length})</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedRecFilter}
                  onChange={(e) => setSelectedRecFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="all">Dhammaan Go'aannada (Recommendations)</option>
                  <option value="Excellent">🌟 Excellent (Sare)</option>
                  <option value="Promote">🎖️ Promote (Dallacsiin)</option>
                  <option value="Retain">👍 Retain (Mahadcelin)</option>
                  <option value="Needs Training">📘 Needs Training</option>
                  <option value="Warning">⚠️ Warning (Digniin)</option>
                </select>
              </div>
            </div>

            <div className="text-slate-500 font-bold shrink-0">
              Waxaa la helay: <span className="text-[#0e7a48] font-black">{filteredEvaluations.length}</span> warbixin
            </div>
          </div>

          {/* Evaluations Cards */}
          {filteredEvaluations.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Weli Ma Jirto Qiimayn La Bixiyay</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Maamuluhu kormeer iyo qiimayn ma uusan diiwaangelin macallimiinta filter-kan. Guji badhanka sare si aad qiimayn cusub uga diiwaangeliso Firestore database.
              </p>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingEvaluation(null);
                    setIsOpenEvalModal(true);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-200" />
                  <span>+ Bixi Qiimayntii Ugu Horeysay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 transition-all p-5 space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>{ev.teacherName}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>Kormeeray: <strong>{ev.evaluatorName}</strong></span>
                        <span>•</span>
                        <span>{ev.evaluationDate}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span>{ev.overallRating} / 5.0</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold block mt-1">
                        {ev.academicTerm}
                      </span>
                    </div>
                  </div>

                  {/* Star Rating Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Tayo Dhigista:</span>
                      <span className="font-extrabold text-amber-600">{ev.teachingScore} / 5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ilaalinta Waqtiga:</span>
                      <span className="font-extrabold text-amber-600">{ev.quranPunctualityScore} / 5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Edbinta Fasalka:</span>
                      <span className="font-extrabold text-amber-600">{ev.disciplineScore} / 5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Dhiirigelinta:</span>
                      <span className="font-extrabold text-amber-600">{ev.studentEngagementScore} / 5</span>
                    </div>
                  </div>

                  {/* Feedback summary */}
                  <div className="space-y-2 text-xs">
                    {ev.strengths && (
                      <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px] mb-0.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Awoodaha Wanaagsan:</span>
                        </span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{ev.strengths}</p>
                      </div>
                    )}

                    {ev.areasForImprovement && (
                      <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-100">
                        <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Qodobada U Baahan Horumarinta:</span>
                        </span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{ev.areasForImprovement}</p>
                      </div>
                    )}

                    {ev.adminComments && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] mb-0.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#0e7a48]" />
                          <span>Fikrada Maamulka:</span>
                        </span>
                        <p className="text-slate-700 text-[11px] leading-relaxed">{ev.adminComments}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendation Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-[11px] font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Go'aanka: {ev.recommendation}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePrintEvaluation(ev)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Daabac Warbixinta Qiimaynta"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Daabac</span>
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingEvaluation(ev);
                              setIsOpenEvalModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded cursor-pointer"
                            title="Beddel Qiimaynta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteEvaluation && (
                            <button
                              onClick={() => onDeleteEvaluation(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Tirtir Qiimaynta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {(isOpenAddModal || editingTeacher) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0e7a48] text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4af37]" />
                <span>{editingTeacher ? 'Wax ka beddel Macallinka (Edit)' : 'Ku Dar Macallin Cusub'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenAddModal(false);
                  setEditingTeacher(null);
                }}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Magaca Macallinka oo Dhameystiran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Shiikh Axmed Maxamed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefoonka Macallinka *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Username (Gelitaanka)
                  </label>
                  <input
                    type="text"
                    placeholder="tch_yuusuf"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Password (Sireed)
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-[#0e7a48] font-mono font-bold text-[#0e7a48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Sawirka Macallinka (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/teacher.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fasalka uu Dhigayo *
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mushaarka Bisha ($ USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={salary}
                    onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0e7a48]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenAddModal(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Keydi Isbeddelka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Evaluation Modal */}
      {(isOpenEvalModal || editingEvaluation) && (
        <TeacherEvaluationModal
          currentUser={currentUser}
          teachers={teachers}
          selectedTeacherId={selectedTeacherFilter !== 'all' ? selectedTeacherFilter : undefined}
          initialEvaluation={editingEvaluation}
          onSaveEvaluation={(newEval) => {
            if (onSaveEvaluation) {
              onSaveEvaluation(newEval);
            }
            setIsOpenEvalModal(false);
            setEditingEvaluation(null);
          }}
          onClose={() => {
            setIsOpenEvalModal(false);
            setEditingEvaluation(null);
          }}
        />
      )}

      {/* Teacher Students Modal */}
      {selectedTeacherForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="p-4 bg-[#0e7a48] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#d4af37]">
                  Fasalka & Ardayda: {selectedTeacherForStudents.fullName}
                </h3>
                <p className="text-xs text-green-100">
                  Fasalka: {selectedTeacherForStudents.assignedClasses.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacherForStudents(null)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="text-xs font-bold text-slate-700 border-b pb-1">
                Ardayda igman macallinkan:
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {students
                  .filter((s) =>
                    selectedTeacherForStudents.assignedClasses.some(
                      (ac) => s.className.toLowerCase().includes(ac.toLowerCase()) || ac.toLowerCase().includes(s.className.toLowerCase())
                    )
                  )
                  .map((st, i) => (
                    <div
                      key={st.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold">{i + 1}.</span>
                        <span className="font-bold text-slate-900">{st.fullName}</span>
                      </div>
                      <span className="text-[10px] bg-[#d4af37]/20 text-[#8a7123] px-2 py-0.5 rounded font-bold">
                        Juz {st.currentJuz}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

