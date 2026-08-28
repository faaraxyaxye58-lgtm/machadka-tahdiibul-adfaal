import React, { useState } from 'react';
import {
  CurriculumUnit,
  CurriculumTopic,
  ClassRoom,
  Teacher,
  SchoolSettings,
  User,
  LessonStatus,
} from '../types';
import {
  BookOpen as BookOpenIcon,
  CheckCircle2 as CheckCircle2Icon,
  Clock as ClockIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Calendar as CalendarIcon,
  UserCheck as UserCheckIcon,
  Edit3 as Edit3Icon,
  Trash2 as Trash2Icon,
  Printer as PrinterIcon,
  Sparkles as SparklesIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  X as XIcon,
  FileText as FileTextIcon,
  AlertCircle as AlertCircleIcon,
  GraduationCap as GraduationCapIcon,
  Layers as LayersIcon,
  BookMarked as BookMarkedIcon,
  Check as CheckIcon,
} from 'lucide-react';

interface CurriculumViewProps {
  units: CurriculumUnit[];
  classes: ClassRoom[];
  teachers: Teacher[];
  settings: SchoolSettings;
  currentUser: User | null;
  onSaveUnit: (unit: CurriculumUnit) => void;
  onDeleteUnit: (id: string) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  units,
  classes,
  teachers,
  settings,
  currentUser,
  onSaveUnit,
  onDeleteUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<CurriculumUnit | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState<{ [unitId: string]: string }>({});

  // Form State for Add/Edit
  const [formUnitNumber, setFormUnitNumber] = useState<number>(1);
  const [formUnitTitle, setFormUnitTitle] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('Tajwiidka');
  const [formClassName, setFormClassName] = useState(classes[0]?.name || 'Fasal A - Subax');
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');
  const [formTargetStartDate, setFormTargetStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTargetEndDate, setFormTargetEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<LessonStatus>('In Progress');
  const [formDescription, setFormDescription] = useState('');
  const [formTeacherNotes, setFormTeacherNotes] = useState('');
  const [formTopicsText, setFormTopicsText] = useState('');

  // Extract unique subjects
  const subjectList = Array.from(
    new Set([
      'Tajwiidka',
      'Qaaciydada',
      'Tarbiya & Akhlaaq',
      'Luuqadda Carabiga',
      "Qur'aanka (Hifz)",
      'Xisaabta',
      'Siyrada & Taariikhda',
      ...units.map((u) => u.subjectName),
    ])
  );

  // Extract unique class names
  const classNames = Array.from(
    new Set([...classes.map((c) => c.name), ...units.map((u) => u.className)])
  );

  const isTeacher = currentUser?.role === 'teacher';

  // Filter Units
  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.unitTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.teacherName && unit.teacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      unit.topics.some((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubject === 'all' || unit.subjectName === selectedSubject;
    const matchesClass = selectedClass === 'all' || unit.className === selectedClass;
    const matchesStatus = selectedStatus === 'all' || unit.status === selectedStatus;

    return matchesSearch && matchesSubject && matchesClass && matchesStatus;
  });

  // Calculate Dashboard Summary Metrics
  const totalUnitsCount = filteredUnits.length;
  const completedUnitsCount = filteredUnits.filter((u) => u.status === 'Completed').length;
  const inProgressUnitsCount = filteredUnits.filter((u) => u.status === 'In Progress').length;
  const notStartedUnitsCount = filteredUnits.filter((u) => u.status === 'Not Started').length;

  let totalTopics = 0;
  let completedTopics = 0;
  filteredUnits.forEach((u) => {
    totalTopics += u.topics.length;
    completedTopics += u.topics.filter((t) => t.isCompleted).length;
  });

  const overallProgressPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingUnit(null);
    setFormUnitNumber(units.length + 1);
    setFormUnitTitle('');
    setFormSubjectName(subjectList[0] || 'Tajwiidka');
    setFormClassName(classNames[0] || 'Fasal A - Subax');
    setFormTeacherId(teachers[0]?.id || '');
    setFormTargetStartDate(new Date().toISOString().split('T')[0]);
    setFormTargetEndDate('');
    setFormStatus('In Progress');
    setFormDescription('');
    setFormTeacherNotes('');
    setFormTopicsText("1. Dhaqangalka iyo qeexidda kalfadhiga\n2. Qodobka 2-aad ee casharka\n3. Imtixaanka yar ee cutubka");
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (unit: CurriculumUnit) => {
    setEditingUnit(unit);
    setFormUnitNumber(unit.unitNumber);
    setFormUnitTitle(unit.unitTitle);
    setFormSubjectName(unit.subjectName);
    setFormClassName(unit.className);
    setFormTeacherId(unit.teacherId || '');
    setFormTargetStartDate(unit.targetStartDate || '');
    setFormTargetEndDate(unit.targetEndDate || '');
    setFormStatus(unit.status);
    setFormDescription(unit.description || '');
    setFormTeacherNotes(unit.teacherNotes || '');
    setFormTopicsText(unit.topics.map((t) => t.title).join('\n'));
    setModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUnitTitle.trim()) return;

    const assignedTeacher = teachers.find((t) => t.id === formTeacherId);

    // Parse topics from textarea
    const rawLines = formTopicsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const updatedTopics: CurriculumTopic[] = rawLines.map((lineText, index) => {
      // Remove leading numbers like "1. ", "2) "
      const cleanTitle = lineText.replace(/^[\d\.\-\)]+\s*/, '');
      if (editingUnit) {
        const existingTopic = editingUnit.topics[index];
        if (existingTopic) {
          return { ...existingTopic, title: cleanTitle };
        }
      }
      return {
        id: `top-${Date.now()}-${index}`,
        title: cleanTitle,
        isCompleted: false,
      };
    });

    const unitPayload: CurriculumUnit = {
      id: editingUnit ? editingUnit.id : `curr-${Date.now()}`,
      unitNumber: Number(formUnitNumber) || 1,
      unitTitle: formUnitTitle.trim(),
      subjectName: formSubjectName,
      className: formClassName,
      teacherId: formTeacherId,
      teacherName: assignedTeacher?.fullName || currentUser?.name || 'Macallin Hadaf',
      targetStartDate: formTargetStartDate,
      targetEndDate: formTargetEndDate,
      status: formStatus,
      topics: updatedTopics,
      description: formDescription,
      teacherNotes: formTeacherNotes,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onSaveUnit(unitPayload);
    setModalOpen(false);
  };

  // Toggle topic completion
  const handleToggleTopic = (unit: CurriculumUnit, topicId: string) => {
    const updatedTopics = unit.topics.map((top) => {
      if (top.id === topicId) {
        const nextCompleted = !top.isCompleted;
        return {
          ...top,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return top;
    });

    const allCompleted = updatedTopics.every((t) => t.isCompleted);
    const someCompleted = updatedTopics.some((t) => t.isCompleted);

    let nextStatus: LessonStatus = unit.status;
    if (allCompleted && updatedTopics.length > 0) {
      nextStatus = 'Completed';
    } else if (someCompleted) {
      nextStatus = 'In Progress';
    }

    const updatedUnit: CurriculumUnit = {
      ...unit,
      topics: updatedTopics,
      status: nextStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onSaveUnit(updatedUnit);
  };

  // Quick Add Topic to an existing Unit
  const handleAddTopicToUnit = (unit: CurriculumUnit) => {
    const titleText = newTopicTitle[unit.id]?.trim();
    if (!titleText) return;

    const newTopic: CurriculumTopic = {
      id: `top-${Date.now()}`,
      title: titleText,
      isCompleted: false,
    };

    const updatedUnit: CurriculumUnit = {
      ...unit,
      topics: [...unit.topics, newTopic],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onSaveUnit(updatedUnit);
    setNewTopicTitle((prev) => ({ ...prev, [unit.id]: '' }));
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0e7a48] text-amber-300 rounded-2xl shadow-lg border border-emerald-700/50">
            <BookMarkedIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                Manhajka & Cutubyada Casharrada
              </h1>
              <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase">
                Curriculum Planner
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Diiwaanka cutubyada, la socodka horumarka casharrada iyo manhajka la baray.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <PrinterIcon className="w-4 h-4 text-amber-300" />
            <span>Daabac Manhajka</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 text-amber-300" />
            <span>Qorsheyso Cutub Cusub</span>
          </button>
        </div>
      </div>

      {/* Analytics & Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cutubyo */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Warta Cutubyada
            </span>
            <div className="p-2 bg-slate-800 text-amber-300 rounded-xl">
              <LayersIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalUnitsCount}</span>
            <span className="text-xs text-slate-400 font-bold">Cutubyo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Warta guud ee maadooyinka la qorsheeyay
          </p>
        </div>

        {/* Overall Completion Percentage */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Horumarka Guud
            </span>
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
              <CheckCircle2Icon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {overallProgressPercentage}%
            </span>
            <span className="text-xs text-slate-400 font-bold">
              ({completedTopics}/{totalTopics} Qodob)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* Active Cutubyo (In Progress) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Cutubyo Socda
            </span>
            <div className="p-2 bg-amber-950 text-amber-400 rounded-xl border border-amber-800">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">{inProgressUnitsCount}</span>
            <span className="text-xs text-slate-400 font-bold">Socda Maanta</span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-1 font-medium">
            Casharrada lagu jiro sharxiddooda
          </p>
        </div>

        {/* Completed Cutubyo */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              La Dhameeyay
            </span>
            <div className="p-2 bg-blue-950 text-blue-400 rounded-xl border border-blue-800">
              <SparklesIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">{completedUnitsCount}</span>
            <span className="text-xs text-slate-400 font-bold">Dhammaystiran</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cutubyadii la dhameeyay oo dhan
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Geli magaca cutubka, maadada ama macallinka..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Filter by Subject */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Dhammaan Maadooyinka</option>
              {subjectList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Class */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Dhammaan Fasallada</option>
              {classNames.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 text-slate-200 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Dhammaan Xaaladaha</option>
              <option value="In Progress">Socda (In Progress)</option>
              <option value="Completed">Dhammaystiran (Completed)</option>
              <option value="Not Started">Raan Bilaaban (Not Started)</option>
            </select>
          </div>
        </div>
      </div>

      {/* List of Curriculum Units */}
      {filteredUnits.length === 0 ? (
        <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-800 text-slate-400 rounded-full flex items-center justify-center">
            <BookOpenIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Lama helin wax cutub ama manhaj ah</h3>
            <p className="text-xs text-slate-400 mt-1">
              Fadlan beddel raadinta ama guji badhanka sare si aad u qorsheyso cutub cusub.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 text-amber-300" />
            <span>Afeefo Cutub Cusub</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUnits.map((unit) => {
            const unitTotalTopics = unit.topics.length;
            const unitDoneTopics = unit.topics.filter((t) => t.isCompleted).length;
            const unitPct =
              unitTotalTopics > 0 ? Math.round((unitDoneTopics / unitTotalTopics) * 100) : 0;
            const isExpanded = expandedUnitId === unit.id;

            return (
              <div
                key={unit.id}
                className={`bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden ${
                  unit.status === 'Completed'
                    ? 'border-emerald-800/80 shadow-md'
                    : unit.status === 'In Progress'
                    ? 'border-amber-500/60 shadow-lg'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl text-xs font-black shrink-0 ${
                        unit.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : unit.status === 'In Progress'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span>#{unit.unitNumber}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-amber-300 text-[10px] font-black rounded-full border border-slate-700">
                          {unit.subjectName}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-full">
                          📍 {unit.className}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            unit.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : unit.status === 'In Progress'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {unit.status === 'Completed'
                            ? 'Dhammaystiran'
                            : unit.status === 'In Progress'
                            ? 'Socda'
                            : 'Bilaaban'}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-white">{unit.unitTitle}</h3>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                        {unit.teacherName && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <UserCheckIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>{unit.teacherName}</span>
                          </span>
                        )}
                        {unit.targetStartDate && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {unit.targetStartDate}{' '}
                              {unit.targetEndDate ? `→ ${unit.targetEndDate}` : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress & Toggle Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {unitPct}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({unitDoneTopics}/{unitTotalTopics} Qodob)
                        </span>
                      </div>
                      <div className="w-28 sm:w-36 bg-slate-800 h-2 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            unitPct === 100
                              ? 'bg-emerald-500'
                              : unitPct > 0
                              ? 'bg-amber-400'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: `${unitPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(unit)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Wax ka baddal cutubka"
                      >
                        <Edit3Icon className="w-4 h-4 text-amber-300" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteUnit(unit.id)}
                        className="p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                        title="Tir cutubkan"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 bg-slate-950/60 space-y-5">
                    {/* Description & Teacher Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unit.description && (
                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-black uppercase text-amber-300 block">
                            📖 Faahfaahinta Cutubka:
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {unit.description}
                          </p>
                        </div>
                      )}

                      {unit.teacherNotes && (
                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-black uppercase text-emerald-400 block">
                            ✍️ Xusuus-qorka Macallinka:
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {unit.teacherNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Topics List Checkbox Interactive */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          📋 Cutubyada & Qodobada Casharka (Topics Checklist):
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">
                          Guji si aad u calaamadayso kan la dhameeyay
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {unit.topics.map((topic) => (
                          <div
                            key={topic.id}
                            onClick={() => handleToggleTopic(unit, topic.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              topic.isCompleted
                                ? 'bg-emerald-950/40 border-emerald-800/80 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                  topic.isCompleted
                                    ? 'bg-[#0e7a48] border-emerald-400 text-amber-300'
                                    : 'border-slate-600 bg-slate-800'
                                }`}
                              >
                                {topic.isCompleted && <CheckIcon className="w-3.5 h-3.5" />}
                              </div>
                              <span
                                className={`text-xs font-semibold ${
                                  topic.isCompleted ? 'line-through text-slate-400' : 'text-slate-200'
                                }`}
                              >
                                {topic.title}
                              </span>
                            </div>

                            {topic.completedAt && (
                              <span className="text-[9px] font-mono font-bold text-emerald-400 shrink-0">
                                {topic.completedAt}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add new topic inline */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Ku dar qodob ama kalfadhadh cusub..."
                          value={newTopicTitle[unit.id] || ''}
                          onChange={(e) =>
                            setNewTopicTitle({ ...newTopicTitle, [unit.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTopicToUnit(unit);
                          }}
                          className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTopicToUnit(unit)}
                          className="px-3 py-2 bg-slate-800 hover:bg-[#0e7a48] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Ku dar Qodob
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#0e7a48] text-amber-300 rounded-xl">
                  <BookMarkedIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {editingUnit ? 'Wax ka baddal Cutubka Manhajka' : 'Qorsheyso Cutub/Mawduuc Cusub'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Lambarka Cutubka (#)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formUnitNumber}
                    onChange={(e) => setFormUnitNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Maadada (Subject Name)
                  </label>
                  <select
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  >
                    {subjectList.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Magaca Cutubka/Mawduuca (Unit Title)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cutubka 1-aad: Axaaktaamta Nuun As-Saakinah..."
                  value={formUnitTitle}
                  onChange={(e) => setFormUnitTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Fasalka (Classroom)
                  </label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  >
                    {classNames.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Macallinka Masuulka Ah
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Dooro Macallin...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.subjectSpecialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Taariikhda Billaabidda
                  </label>
                  <input
                    type="date"
                    value={formTargetStartDate}
                    onChange={(e) => setFormTargetStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Taariikhda Dhammaystirka
                  </label>
                  <input
                    type="date"
                    value={formTargetEndDate}
                    onChange={(e) => setFormTargetEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Xaaladda Cutubka
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as LessonStatus)}
                    className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Not Started">Raan Bilaaban (Not Started)</option>
                    <option value="In Progress">Socda (In Progress)</option>
                    <option value="Completed">Dhammaystiran (Completed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Qodobada Cutubka (Qodob kasta khad gaar ah ku qor)
                </label>
                <textarea
                  rows={4}
                  placeholder="1. Qodobka koowaad ee casharka&#10;2. Qodobka labaad&#10;3. Kalfadhiga imtixaanka"
                  value={formTopicsText}
                  onChange={(e) => setFormTopicsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Faahfaahinta & Faahfaahinta Dheeraadka ah
                </label>
                <input
                  type="text"
                  placeholder="E.g., Kalfadhiga lagu baranayo qawaaniinta tajwiidka..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Xusuus-qorka Macallinka (Notes)
                </label>
                <input
                  type="text"
                  placeholder="E.g., Ardaydu waxay u baahan yihiin dib u eegis dheeraad ah..."
                  value={formTeacherNotes}
                  onChange={(e) => setFormTeacherNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-white rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black rounded-xl text-xs cursor-pointer shadow-lg"
                >
                  Keydi Cutubka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
