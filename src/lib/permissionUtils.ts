import { User, SchoolSettings } from '../types';

/**
 * Checks if a given user is allowed to access the Payments/Lacagaha tab and financial totals.
 *
 * Rules:
 * 1. Master Admin (user.role === 'admin') ALWAYS has access.
 * 2. If user.hidePaymentsAccess === true (Individually restricted Qof-Qof by Admin), access DENIED.
 * 3. If settings.privacyPermissions.hidePaymentsGlobal === true (Globally restricted for all non-admins by Admin), access DENIED.
 * 4. If settings.privacyPermissions.hiddenTabsByRole includes 'payments', access DENIED.
 * 5. Finance role has access by default unless blocked by rules 2-4.
 * 6. Other roles (teacher, parent, student) do not have payments access by default.
 */
export function canUserAccessPayments(
  user?: User | null,
  settings?: SchoolSettings | null
): boolean {
  if (!user) return false;

  // Master Admin always has full access
  if (user.role === 'admin') return true;

  // 1. Check individual user block (Qof Qof)
  if (user.hidePaymentsAccess) return false;

  // 2. Check global block for all non-admins (Dhammaan)
  if (settings?.privacyPermissions?.hidePaymentsGlobal) return false;

  // 3. Check role-based hidden tabs setting
  const hiddenTabs =
    settings?.privacyPermissions?.hiddenTabsByRole?.[
      user.role as 'teacher' | 'parent' | 'student' | 'finance'
    ] || [];
  if (hiddenTabs.includes('payments')) return false;

  // 4. Finance role has access by default unless blocked by individual or global rule above
  if (user.role === 'finance') return true;

  // 5. Parent user has access to view their own children's fee status and payment receipts
  if (user.role === 'parent') return true;

  return false;
}
