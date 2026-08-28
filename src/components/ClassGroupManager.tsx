import React, { useState, useMemo } from 'react';
import { ClassRoom, ClassGroup, Student, Teacher, User } from '../types';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  UserCheck,
  Check,
  X,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ClassGroupManagerProps {
  currentUser?: User | null;
  classes: ClassRoom[];
  classGroups: ClassGroup[];
  students: Student[];
  teachers: Teacher[];
  selectedClassId?: string;
  onSaveGroup: (group: ClassGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateStudent: (student: Student) => void;
  onClose?: () => void;
}

export const ClassGroupManager: React.FC<ClassGroupManagerProps> = ({
  currentUser,
  classes,
  classGroups,
  students,
  teachers,
  selectedClassId: initialClassId,
  onSaveGroup,
  onDeleteGroup,
  onUpdateStudent,
  onClose,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [activeClassId, setActiveClassId] = useState<string>(
    initialClassId || classes[0]?.id || ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states for creating/editing group
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClassGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupTeacherId, setGroupTeacherId] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Modal states for assigning/transferring student
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  const activeClass = classes.find((c) => c.id === activeClassId);

  // Filter groups for current active class
  const classGroupsForActive = useMemo(() => {
    return classGroups.filter((g) => g.classId === activeClassId);
  }, [classGroups, activeClassId]);

  // Filter students for active class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === activeClassId);
  }, [students, activeClassId]);

  // Students in selected group or all
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) => {
      const matchesGroup =
        selectedGroupId === 'all'
          ? true
          : selectedGroupId === 'ungrouped'
          ? !s.groupId
          : s.groupId === selectedGroupId;
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [classStudents, selectedGroupId, searchTerm]);

  const openNewGroupModal = () => {
    setEditingGroup(null);
    setGroupName(`Guruub ${String.fromCharCode(65 + classGroupsForActive.length)}`); // e.g. Guruub A, Guruub B
    setGroupTeacherId(activeClass?.teacherId || '');
    setGroupDescription('');
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (grp: ClassGroup) => {
    setEditingGroup(grp);
    setGroupName(grp.name);
    setGroupTeacherId(grp.teacherId || '');
    setGroupDescription(grp.description || '');
    setIsGroupModalOpen(true);
  };

  const handleSaveGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const selectedTeacher = teachers.find((t) => t.id === groupTeacherId);

    const groupToSave: ClassGroup = {
      id: editingGroup ? editingGroup.id : `grp-${Date.now()}`,
      classId: activeClassId,
      className: activeClass?.name || 'Fasal',
      name: groupName.trim(),
      teacherId: groupTeacherId || undefined,
      teacherName: selectedTeacher?.fullName || activeClass?.teacherName || undefined,
      description: groupDescription.trim() || undefined,
      createdAt: editingGroup?.createdAt || new Date().toISOString(),
    };

    onSaveGroup(groupToSave);
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroupClick = (grp: ClassGroup) => {
    if (confirm(`Ma ziyaadinta rabtaa inaad tirtirto ${grp.name}? Ardayda ku dhex jirta dib ayaa loo soo celin doonaa.`)) {
      // Remove group reference from students in this group
      const groupStudents = students.filter((s) => s.groupId === grp.id);
      groupStudents.forEach((s) => {
        onUpdateStudent({
          ...s,
          groupId: undefined,
          groupName: undefined,
        });
      });
      onDeleteGroup(grp.id);
      if (selectedGroupId === grp.id) {
        setSelectedGroupId('all');
      }
    }
  };

  const handleAssignStudentToGroup = (student: Student, grpId: string) => {
    const grp = classGroups.find((g) => g.id === grpId);
    onUpdateStudent({
      ...student,
      groupId: grpId ? grpId : undefined,
      groupName: grp ? grp.name : undefined,
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudent) return;
    const grp = classGroups.find((g) => g.id === targetGroupId);
    onUpdateStudent({
      ...transferStudent,
      groupId: targetGroupId ? targetGroupId : undefined,
      groupName: grp ? grp.name : undefined,
    });
    setTransferStudent(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
      {/* HEADER BAR */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
              NIDAAMKA GURUUBYADA
            </span>
            <span className="text-slate-400 text-xs font-medium">Classes & Groups Engine</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Maamulka Guruubyada Fasalka</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            U samee Guruubyo (Guruub A, B, C...) fasal kasta, maamul ardayda, u xilsaar macallin, ama u wareeji ardayda.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openNewGroupModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ABUUR GURUUB CUSUB</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* CLASS SELECTOR TABS */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Dooro Fasalka:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {classes.map((cls) => {
              const count = classGroups.filter((g) => g.classId === cls.id).length;
              const isActive = cls.id === activeClassId;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setActiveClassId(cls.id);
                    setSelectedGroupId('all');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition flex items-center gap-2.5 border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-600'}`} />
                  <span>{cls.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count} Guruub
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE CLASS SUMMARY & GROUPS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ALL STUDENTS STAT CARD */}
          <div
            onClick={() => setSelectedGroupId('all')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedGroupId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase opacity-80">Dhammaan Ardayda Fasalka</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black">{classStudents.length}</span>
              <span className="text-xs text-emerald-400 font-bold">Arday</span>
            </div>
          </div>

          {/* GROUPS STAT CARDS */}
          {classGroupsForActive.map((grp) => {
            const grpStudentsCount = classStudents.filter((s) => s.groupId === grp.id).length;
            const isSelected = selectedGroupId === grp.id;
            return (
              <div
                key={grp.id}
                className={`p-4 rounded-2xl border transition relative group ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div
                  onClick={() => setSelectedGroupId(grp.id)}
                  className="cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{grp.name}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      {grpStudentsCount} Arday
                    </span>
                  </div>
                  {grp.teacherName && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Macallin: {grp.teacherName}</span>
                    </p>
                  )}
                  {grp.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">{grp.description}</p>
                  )}
                </div>

                {/* EDIT/DELETE ACTION BUTTONS */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEditGroupModal(grp)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Wax ka beddel Guruubka"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Beddel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroupClick(grp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Tirtir Guruubka"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tirtir</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* UNGROUPED CARD */}
          <div
            onClick={() => setSelectedGroupId('ungrouped')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedGroupId === 'ungrouped'
                ? 'bg-amber-50 text-amber-950 border-amber-400 shadow-md'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-amber-800">Guruub La'aan (Aan Lahayn)</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black">
                {classStudents.filter((s) => !s.groupId).length}
              </span>
              <span className="text-xs text-amber-700 font-bold">Arday</span>
            </div>
          </div>
        </div>

        {/* SEARCH AND STUDENT LIST FOR SELECTED GROUP */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {selectedGroupId === 'all'
                    ? 'Dhammaan Ardayda Fasalka'
                    : selectedGroupId === 'ungrouped'
                    ? 'Ardayda aan Guruub lahayn'
                    : `Ardayda ${classGroups.find((g) => g.id === selectedGroupId)?.name || 'Guruubka'}`}
                </span>
                <span className="text-xs font-normal text-slate-500">({filteredStudents.length})</span>
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Raadi magac ama ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* STUDENTS TABLE */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Ardayga</th>
                    <th className="px-4 py-3">ID-ga</th>
                    <th className="px-4 py-3">Guruubka Hadda</th>
                    <th className="px-4 py-3 text-right">Maamulka Guruubka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Pora ma jiro arday buuxisa shuruudahan.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => {
                      const currentGrp = classGroups.find((g) => g.id === std.groupId);
                      return (
                        <tr key={std.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-extrabold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                              {std.fullName.charAt(0)}
                            </div>
                            <div>
                              <span>{std.fullName}</span>
                              <span className="block text-[10px] font-normal text-slate-400">
                                {std.parentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">{std.studentId}</td>
                          <td className="px-4 py-3">
                            {currentGrp ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                {currentGrp.name}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium text-[11px]">
                                Guruub La'aan
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* SELECT GROUP DROPDOWN FOR INSTANT REASSIGNMENT */}
                              <select
                                value={std.groupId || ''}
                                onChange={(e) => handleAssignStudentToGroup(std, e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                              >
                                <option value="">-- Guruub La'aan --</option>
                                {classGroupsForActive.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>

                              {/* TRANSFER BUTTON */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferStudent(std);
                                  setTargetGroupId(std.groupId || '');
                                }}
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                                title="Wareeji Ardayga"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Wareeji</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT GROUP MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>{editingGroup ? 'Beddel Guruubka' : 'Abuur Guruub Cusub'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroupSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Magaca Guruubka <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guruub A, Guruub B, Guruub C"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Macallinka Guruubka
                </label>
                <select
                  value={groupTeacherId}
                  onChange={(e) => setGroupTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="">-- Same as Class Teacher ({activeClass?.teacherName}) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.subjectSpecialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Faahfaahin / Xusuusin (Option)
                </label>
                <textarea
                  rows={2}
                  placeholder="Faahfaahin ku saabsan guruubkan..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>KAYDI GURUUBKA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER STUDENT MODAL */}
      {transferStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                <span>Wareeji Ardayga</span>
              </h3>
              <button
                type="button"
                onClick={() => setTransferStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <p className="font-black text-slate-900">{transferStudent.fullName}</p>
                <p className="text-slate-500 font-mono">{transferStudent.studentId}</p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    U Wareeji Guruubka:
                  </label>
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="">-- Guruub La'aan (Remove from group) --</option>
                    {classGroupsForActive.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.teacherName || 'Macallin'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferStudent(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Kanasal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>XAQIJI WAREEJINTA</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
