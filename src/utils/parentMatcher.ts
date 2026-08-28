import { Student, User, Parent } from '../types';

/**
 * Returns the list of students associated with a parent user.
 * Matches by phone number digits, parent name, or childrenIds in parents array.
 */
export function getParentChildren(
  currentUser: User | null | undefined,
  students: Student[],
  parents: Parent[] = []
): Student[] {
  if (!currentUser || currentUser.role !== 'parent') {
    return students;
  }

  const cleanUserPhone = currentUser.phone
    ? currentUser.phone.replace(/\D/g, '')
    : currentUser.username
    ? currentUser.username.replace(/\D/g, '')
    : '';

  const cleanUserName = currentUser.name ? currentUser.name.trim().toLowerCase() : '';

  // Find matching Parent record in parents list if exists
  const matchedParentRecord = parents.find((p) => {
    const cleanPPhone = p.phone ? p.phone.replace(/\D/g, '') : '';
    const cleanPName = p.fullName ? p.fullName.trim().toLowerCase() : '';

    if (cleanUserPhone && cleanPPhone) {
      if (
        cleanPPhone === cleanUserPhone ||
        (cleanUserPhone.length >= 5 &&
          cleanPPhone.length >= 5 &&
          (cleanPPhone.slice(-7) === cleanUserPhone.slice(-7) ||
            cleanPPhone.includes(cleanUserPhone) ||
            cleanUserPhone.includes(cleanPPhone)))
      ) {
        return true;
      }
    }
    if (cleanUserName && cleanPName && cleanUserName === cleanPName) {
      return true;
    }
    return false;
  });

  return students.filter((s) => {
    // 1. Direct match by childrenIds from parent record
    if (matchedParentRecord && matchedParentRecord.childrenIds && matchedParentRecord.childrenIds.includes(s.id)) {
      return true;
    }

    // 2. Phone number digits match
    const cleanStdPhone = s.parentPhone ? s.parentPhone.replace(/\D/g, '') : '';
    if (cleanUserPhone.length >= 5 && cleanStdPhone.length >= 5) {
      if (
        cleanUserPhone === cleanStdPhone ||
        cleanUserPhone.slice(-7) === cleanStdPhone.slice(-7) ||
        cleanStdPhone.includes(cleanUserPhone) ||
        cleanUserPhone.includes(cleanStdPhone)
      ) {
        return true;
      }
    }

    // 3. Parent name match
    const cleanStdParentName = s.parentName ? s.parentName.trim().toLowerCase() : '';
    if (cleanUserName && cleanStdParentName) {
      if (
        cleanUserName === cleanStdParentName ||
        cleanUserName.includes(cleanStdParentName) ||
        cleanStdParentName.includes(cleanUserName)
      ) {
        return true;
      }
    }

    return false;
  });
}
