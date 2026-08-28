import { User, SchoolSettings } from '../types';
import { canUserAccessPayments } from '../lib/permissionUtils';

/**
 * Formats a monetary value.
 * If `isHidden` is true, returns masked placeholder (e.g., "$••••••").
 */
export function formatMoney(
  amount: number | string | undefined | null,
  isHidden: boolean = false,
  currencySymbol: string = '$'
): string {
  if (isHidden) {
    return `${currencySymbol}••••••`;
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  if (isNaN(num)) return `${currencySymbol}0`;

  return `${currencySymbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Determines whether financial amounts should be hidden based on:
 * 1. User payment access permissions (canUserAccessPayments).
 * 2. Global toggle `isMoneyHiddenState` (User clicked the Eye button in Navbar).
 * 3. School Admin privacy settings `hideFinancialTotals` or `hideFinancialsForSubAdmins`.
 * 4. User role (Super Admin vs Sub-Admin / Staff / Teacher / Parent).
 */
export function isFinancialDataHidden(
  currentUser: User | null | undefined,
  settings: SchoolSettings,
  isMoneyHiddenState: boolean
): boolean {
  // Always hide financial data/totals from teachers
  if (currentUser?.role === 'teacher') {
    return true;
  }

  // If user is restricted from payments (Qof-Qof or Dhammaan), hide money
  if (!canUserAccessPayments(currentUser, settings)) {
    return true;
  }

  // If user closed the Eye toggle (isMoneyHiddenState === true), hide money
  if (isMoneyHiddenState) {
    return true;
  }

  // If Eye is OPEN (isMoneyHiddenState === false), money is VISIBLE.
  // Privacy restriction only applies to non-admin/non-finance roles if explicitly enabled in settings.
  const permissions = settings?.privacyPermissions || {};
  if (permissions.hideFinancialTotals || permissions.hideFinancialsForSubAdmins) {
    const isPrimaryAdminOrFinance =
      currentUser?.role === 'admin' || currentUser?.role === 'finance';
    if (!isPrimaryAdminOrFinance) {
      return true;
    }
  }

  return false;
}
