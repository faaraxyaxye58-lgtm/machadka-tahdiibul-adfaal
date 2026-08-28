import { Student, User, Teacher, ClassRoom } from '../types';

/**
 * Finds the Teacher record corresponding to a logged-in teacher User.
 */
export function getTeacherForUser(
  currentUser: User | null | undefined,
  teachers: Teacher[] = [],
  users: User[] = []
): Teacher | null {
  if (!currentUser || currentUser.role !== 'teacher') {
    return null;
  }

  // 1. Direct ID match
  const directTeacher = teachers.find((t) => t.id === currentUser.id);
  if (directTeacher) return directTeacher;

  // 2. Match by phone digits
  const cleanUserPhone = currentUser.phone
    ? currentUser.phone.replace(/\D/g, '')
    : currentUser.username
    ? currentUser.username.replace(/\D/g, '')
    : '';

  const cleanUserName = currentUser.name ? currentUser.name.trim().toLowerCase() : '';
  const cleanUserEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : '';

  for (const t of teachers) {
    const cleanTPhone = t.phone ? t.phone.replace(/\D/g, '') : '';
    const cleanTName = t.fullName ? t.fullName.trim().toLowerCase() : '';
    const cleanTEmail = t.email ? t.email.trim().toLowerCase() : '';

    if (cleanUserPhone && cleanTPhone && cleanUserPhone.length >= 5 && cleanTPhone.length >= 5) {
      if (cleanTPhone === cleanUserPhone || cleanTPhone.slice(-7) === cleanUserPhone.slice(-7)) {
        return t;
      }
    }

    if (cleanUserName && cleanTName && (cleanUserName === cleanTName || cleanUserName.includes(cleanTName) || cleanTName.includes(cleanUserName))) {
      return t;
    }

    if (cleanUserEmail && cleanTEmail && cleanUserEmail === cleanTEmail) {
      return t;
    }
  }

  return null;
}

/**
 * Gets the classes assigned to a teacher.
 */
export function getTeacherClasses(
  currentUser: User | null | undefined,
  classes: ClassRoom[] = [],
  teachers: Teacher[] = [],
  users: User[] = []
): ClassRoom[] {
  if (!currentUser) return classes;
  if (currentUser.role !== 'teacher') return classes;

  const teacher = getTeacherForUser(currentUser, teachers, users);
  const cleanUserName = currentUser.name ? currentUser.name.trim().toLowerCase() : '';

  return classes.filter((c) => {
    if (teacher) {
      if (c.teacherId === teacher.id) return true;
      if (teacher.assignedClasses && teacher.assignedClasses.some((acName) => acName.toLowerCase() === c.name.toLowerCase() || c.name.toLowerCase().includes(acName.toLowerCase()) || acName.toLowerCase().includes(c.name.toLowerCase()))) {
        return true;
      }
      if (c.teacherName && teacher.fullName && c.teacherName.trim().toLowerCase() === teacher.fullName.trim().toLowerCase()) {
        return true;
      }
    }
    if (cleanUserName && c.teacherName && c.teacherName.trim().toLowerCase() === cleanUserName) {
      return true;
    }
    return false;
  });
}

/**
 * Gets students belonging to a teacher's assigned classes.
 */
export function getTeacherStudents(
  currentUser: User | null | undefined,
  students: Student[] = [],
  classes: ClassRoom[] = [],
  teachers: Teacher[] = [],
  users: User[] = []
): Student[] {
  if (!currentUser) return students;
  if (currentUser.role !== 'teacher') return students;

  const teacherClasses = getTeacherClasses(currentUser, classes, teachers, users);
  const teacherClassIds = teacherClasses.map((c) => c.id);
  const teacherClassNames = teacherClasses.map((c) => c.name.toLowerCase());

  const teacher = getTeacherForUser(currentUser, teachers, users);
  if (teacher && teacher.assignedClasses) {
    teacher.assignedClasses.forEach((cn) => {
      if (!teacherClassNames.includes(cn.toLowerCase())) {
        teacherClassNames.push(cn.toLowerCase());
      }
    });
  }

  return students.filter((s) => {
    if (teacherClassIds.includes(s.classId)) return true;
    if (s.className && teacherClassNames.some((cn) => s.className.toLowerCase().includes(cn) || cn.includes(s.className.toLowerCase()))) {
      return true;
    }
    return false;
  });
}

/**
 * Gets visible teachers for a logged in user.
 * Admin sees all teachers.
 * Teacher sees ONLY their own teacher record.
 */
export function getVisibleTeachers(
  currentUser: User | null | undefined,
  teachers: Teacher[] = [],
  users: User[] = []
): Teacher[] {
  if (!currentUser) return teachers;
  if (currentUser.role === 'admin' || currentUser.role === 'finance') return teachers;
  if (currentUser.role === 'teacher') {
    const me = getTeacherForUser(currentUser, teachers, users);
    if (me) return [me];
    const filtered = teachers.filter((t) => {
      if (t.fullName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
      if (currentUser.phone && t.phone && t.phone.replace(/\D/g, '').slice(-7) === currentUser.phone.replace(/\D/g, '').slice(-7)) return true;
      return false;
    });
    return filtered.length > 0 ? filtered : [];
  }
  return teachers;
}
