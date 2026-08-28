import { AuditLogEntry, User } from '../types';
import { Storage } from './storage';
import { COLLECTIONS, saveItemToFirestore } from './firebase';

export function logAuditAction(
  currentUser: User | null | undefined,
  action: string,
  category: AuditLogEntry['category'],
  details: string
) {
  try {
    const userDisplay = currentUser
      ? `${currentUser.name || currentUser.username}`
      : 'Admin';
    const userRole = currentUser?.role || 'admin';

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: userDisplay,
      userRole,
      action,
      category,
      details,
    };

    // Save to Local Storage
    const currentLogs = Storage.getAuditLogs();
    const updatedLogs = [newLog, ...currentLogs];
    Storage.saveAuditLogs(updatedLogs);

    // Save to Firestore
    saveItemToFirestore(COLLECTIONS.AUDIT_LOGS, newLog).catch((err) => {
      console.warn('Firestore audit log save warning:', err);
    });

    return newLog;
  } catch (err) {
    console.error('Failed to log audit action:', err);
    return null;
  }
}
