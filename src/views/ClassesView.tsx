import React, { useState } from 'react';
import { ClassRoom, ClassGroup, Teacher, Student, ShiftType, User, SchoolSettings } from '../types';
import { BookOpenCheck, Plus, Users, User as UserIcon, Clock, DoorClosed, X, Edit2, Trash2, UserPlus, CheckCircle2, UserCheck, Search, Lock, Layers } from 'lucide-react';
import { ClassGroupManager } from '../components/ClassGroupManager';

interface ClassesViewProps {
  currentUser?: User | null;
  classes: ClassRoom[];
  classGroups?: ClassGroup[];
  teachers: Teacher[];
  students?: Student[];
  settings?: SchoolSettings;
  onAddClass: (cls: Omit<ClassRoom, 'id'>) => void;
  onUpdateClass?: (cls: ClassRoom) => void;
  onDeleteClass?: (id: string) => void;
  onUpdateStudent?: (student: Student) => void;
  onSaveGroup?: (group: ClassGroup) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  currentUser,
  classes,
  classGroups = [],
  teachers,
  students = [],
  settings,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onUpdateStudent,
  onSaveGroup,
  onDeleteGroup,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const canEditClasses = isAdmin || (currentUser?.role === 'teacher' && settings?.privacyPermissions?.restrictClassAndTeacherEditingToAdmin === false);
  const [activeTab, setActiveTab] = useState<'classes' | 'groups'>('classes');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const displayedClasses = React.useMemo(() => {
    if (currentUser?.role === 'teacher') {
      const restrictTeacher = settings?.privacyPermissions?.restrictTeacherToAssignedClassOnly !== false;
      if (restrictTeacher) {
        const myClasses = classes.filter(
          (c) =>
            c.teacherId === currentUser.id ||
            c.teacherName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
            currentUser.name.toLowerCase().includes(c.teacherName.toLowerCase())
        );
        return myClasses.length > 0 ? myClasses : classes;
      }
    }
    return classes;
  }, [classes, currentUser, settings]);

  // Modal states for assigning student & selecting teacher
  const [selectedClassForStudent, setSelectedClassForStudent] = useState<ClassRoom | null>(null);
  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<ClassRoom | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [shift, setShift] = useState<ShiftType>('Subax');
  const [capacity, setCapacity] = useState<number>(25);
  const [roomNumber, setRoomNumber] = useState('R-105');

  const openEditModal = (cls: ClassRoom) => {
    setEditingClass(cls);
    setName(cls.name);
    setTeacherId(cls.teacherId);
    setShift(cls.shift);
    setCapacity(cls.capacity);
    setRoomNumber(cls.roomNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selTeacher = teachers.find((t) => t.id === teacherId);
    const tName = selTeacher ? selTeacher.fullName : 'Macallin Yuusuf';

    if (editingClass) {
      if (onUpdateClass) {
        onUpdateClass({
          ...editingClass,
          name,
          teacherId,
          teacherName: tName,
          shift,
          capacity,
          roomNumber,
        });
      }
      setEditingClass(null);
    } else {
      onAddClass({
        name,
        teacherId,
        teacherName: tName,
        shift,
        capacity,
        totalStudents: 0,
        roomNumber,
      });
      setIsOpenModal(false);
    }

    setName('');
  };

  return (
    <div className="space-y-5">
      {/* Header & View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-emerald-700" />
            <span>Fasallada & Guruubyada Waxbarashada</span>
          </h2>
          <p className="text-xs text-slate-500">
            Maamul fasallada dugsiga, samee guruubyo (A, B, C) fasal kasta, u xilsaar macallin iyo ardayda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* TAB BUTTONS */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>Fasallada ({classes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'groups'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Guruubyada ({classGroups.length})</span>
            </button>
          </div>

          {activeTab === 'classes' && canEditClasses && (
            <button
              onClick={() => {
                setEditingClass(null);
                setName('');
                setIsOpenModal(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Samee Fasal Cusub</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'groups' ? (
        <ClassGroupManager
          currentUser={currentUser}
          classes={classes}
          classGroups={classGroups}
          students={students}
          teachers={teachers}
          onSaveGroup={onSaveGroup || (() => {})}
          onDeleteGroup={onDeleteGroup || (() => {})}
          onUpdateStudent={onUpdateStudent || (() => {})}
        />
      ) : (
        <>

      {!canEditClasses && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>🔒 Maamulka Fasallada: Kaliya Maamulaha (Admin) ayaa xaq u leh inuu sameeyo, beddelo ama tirtiro fasallada.</span>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedClasses.map((cls) => {
          const classStudents = students.filter((s) => s.classId === cls.id || s.className.toLowerCase().includes(cls.name.toLowerCase()));
          const enrolledStudentsCount = classStudents.length > 0 ? classStudents.length : cls.totalStudents;
          const occupancyPercentage = Math.min(
            100,
            Math.round((enrolledStudentsCount / cls.capacity) * 100)
          );

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Chamber: {cls.roomNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    {cls.shift}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-slate-800 font-medium">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Macallinka: <strong>{cls.teacherName}</strong></span>
                    </div>
                    {canEditClasses && (
                      <button
                        onClick={() => setSelectedClassForTeacher(cls)}
                        className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        Dooro Macallin
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Tirada Ardayda: <strong>{enrolledStudentsCount}</strong> / {cls.capacity} Arday
                      </span>
                    </div>
                    {canEditClasses && (
                      <button
                        onClick={() => setSelectedClassForStudent(cls)}
                        className="px-2 py-1 bg-[#0e7a48] hover:bg-[#0b633a] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3 text-[#d4af37]" />
                        <span>Ku dar Arday</span>
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="pt-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${occupancyPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Mashquulka: {occupancyPercentage}%</span>
                {canEditClasses && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                      title="Wax ka beddel Fasalka"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteClass && (
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Tirtir Fasalka"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      {(isOpenModal || editingClass) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-amber-400" />
                <span>{editingClass ? 'Wax ka beddel Fasalka (Edit)' : 'Samee Fasal Cusub'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenModal(false);
                  setEditingClass(null);
                }}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Magaca Fasalka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Fasal E - Xifdi Kaamil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Macallinka Fasalka
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.subjectSpecialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waqtiga (Shift)</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Subax">Subax</option>
                    <option value="Galab">Galab</option>
                    <option value="Habeen">Habeen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chamber / Room #
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qaadida Maksamada Ardayda (Capacity)
                </label>
                <input
                  type="number"
                  min={5}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenModal(false);
                    setEditingClass(null);
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

      {/* Select Teacher Modal */}
      {selectedClassForTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0e7a48] text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Dooro Macallinka Fasalka: {selectedClassForTeacher.name}</span>
              </h3>
              <button
                onClick={() => setSelectedClassForTeacher(null)}
                className="p-1 text-slate-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Fadlan dooro macallinka aad u igmanayso fasalkan (<strong>{selectedClassForTeacher.name}</strong>):
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {teachers.map((tch) => {
                  const isSelected = selectedClassForTeacher.teacherId === tch.id || selectedClassForTeacher.teacherName === tch.fullName;

                  return (
                    <button
                      key={tch.id}
                      onClick={() => {
                        if (onUpdateClass) {
                          onUpdateClass({
                            ...selectedClassForTeacher,
                            teacherId: tch.id,
                            teacherName: tch.fullName,
                          });
                        }
                        setSelectedClassForTeacher(null);
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-[#0e7a48] text-[#0e7a48] font-bold'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0e7a48] text-[#d4af37] font-black text-xs flex items-center justify-center">
                          {tch.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{tch.fullName}</div>
                          <div className="text-[10px] text-slate-500">{tch.subjectSpecialty} • {tch.phone}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0e7a48]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedClassForTeacher(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Xir (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Move Student to Class Modal */}
      {selectedClassForStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0e7a48] text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#d4af37]" />
                <span>Ku Dar / Gey Arday Fasalka: {selectedClassForStudent.name}</span>
              </h3>
              <button
                onClick={() => setSelectedClassForStudent(null)}
                className="p-1 text-slate-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Raadi magaca ardayga ama ID-ga..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0e7a48]"
                />
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {students
                  .filter(
                    (s) =>
                      s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      s.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  )
                  .map((std) => {
                    const isInThisClass =
                      std.classId === selectedClassForStudent.id ||
                      std.className.toLowerCase().includes(selectedClassForStudent.name.toLowerCase());

                    return (
                      <div
                        key={std.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isInThisClass
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0e7a48] text-white font-bold text-xs flex items-center justify-center">
                            {std.gender === 'Female' ? '👧' : '👦'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{std.fullName}</div>
                            <div className="text-[10px] text-slate-500">
                              ID: {std.studentId} • Fasalka Hadda: <strong className="text-slate-700">{std.className}</strong>
                            </div>
                          </div>
                        </div>

                        {isInThisClass ? (
                          <span className="px-2 py-1 bg-emerald-200 text-emerald-900 text-[10px] font-extrabold rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                            Kusoo Jira
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (onUpdateStudent) {
                                onUpdateStudent({
                                  ...std,
                                  classId: selectedClassForStudent.id,
                                  className: selectedClassForStudent.name,
                                });
                              }
                            }}
                            className="px-3 py-1 bg-[#0e7a48] hover:bg-[#0b633a] text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <UserPlus className="w-3 h-3 text-[#d4af37]" />
                            <span>Ku Dar Fasalkan</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedClassForStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Dhammaystir (Done)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
