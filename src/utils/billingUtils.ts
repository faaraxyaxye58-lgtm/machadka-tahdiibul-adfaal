import { Student, Parent, SchoolSettings, PaymentTransaction } from '../types';

export const SOMALI_MONTHS = [
  'Janaayo',
  'Feberaayo',
  'Moorso',
  'Epreel',
  'May',
  'Juun',
  'Luuliyo',
  'Ogoosto',
  'Setembar',
  'Oktoobar',
  'Nofeembar',
  'Deseembar',
];

export function getCurrentSomaliMonthYear(date: Date = new Date()): string {
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const monthName = SOMALI_MONTHS[monthIdx] || 'Ogoosto';
  return `${monthName} ${year}`;
}

export interface BillingExecutionResult {
  billedCount: number;
  totalBilledAmount: number;
  monthYear: string;
  billedDate: string;
  alreadyBilledForThisMonth?: boolean;
}

export function execute29thMonthlyBilling(
  students: Student[],
  parents: Parent[],
  settings: SchoolSettings,
  payments: PaymentTransaction[],
  options?: { forceRun?: boolean }
): {
  updatedStudents: Student[];
  updatedParents: Parent[];
  updatedSettings: SchoolSettings;
  newPayments: PaymentTransaction[];
  result: BillingExecutionResult;
} {
  const now = new Date();
  const currentMonthYear = getCurrentSomaliMonthYear(now);
  const formattedToday = now.toISOString().split('T')[0];

  // If already billed for this month and not forced
  if (settings.lastBilledMonth === currentMonthYear && !options?.forceRun) {
    return {
      updatedStudents: students,
      updatedParents: parents,
      updatedSettings: settings,
      newPayments: payments,
      result: {
        billedCount: 0,
        totalBilledAmount: 0,
        monthYear: currentMonthYear,
        billedDate: settings.lastBilledDate || formattedToday,
        alreadyBilledForThisMonth: true,
      },
    };
  }

  let billedCount = 0;
  let totalBilledAmount = 0;
  const createdPayments: PaymentTransaction[] = [];

  const updatedStudents = students.map((student) => {
    // Only bill active students
    if (student.status !== 'Active') {
      return student;
    }

    const monthlyFee = student.feeMonthly && student.feeMonthly > 0 ? student.feeMonthly : 15;
    const currentRemaining = student.feeRemaining !== undefined ? student.feeRemaining : (monthlyFee - (student.feePaid || 0));
    
    // New total remaining after 29th billing
    const newFeeRemaining = Math.max(0, currentRemaining) + monthlyFee;
    const newStatus: 'Pending' | 'Overdue' = currentRemaining > 0 ? 'Overdue' : 'Pending';

    billedCount += 1;
    totalBilledAmount += monthlyFee;

    // Create a pending invoice transaction record for auditing/receipts
    const invoiceNum = `INV-29-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${student.studentId.replace(/[^a-zA-Z0-9]/g, '')}`;
    const pendingPayment: PaymentTransaction = {
      id: `pay-29-${student.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: invoiceNum,
      studentId: student.id,
      studentName: student.fullName,
      parentName: student.parentName,
      monthYear: currentMonthYear,
      amountPaid: 0,
      paymentMethod: 'EVC Plus',
      transactionRef: 'PENDING-DALACIS-29',
      date: formattedToday,
      status: 'Pending',
      processedBy: 'System (Dalacista Auto 29-ka Bisha)',
    };

    createdPayments.push(pendingPayment);

    return {
      ...student,
      feeRemaining: newFeeRemaining,
      feePaid: 0, // reset current month's paid amount for new billing cycle
      feeStatus: newStatus,
    };
  });

  // Recalculate parents total pending fees
  const updatedParents = parents.map((parent) => {
    const parentStudents = updatedStudents.filter(
      (s) => s.parentPhone === parent.phone || (parent.childrenIds && parent.childrenIds.includes(s.id))
    );
    const newPendingTotal = parentStudents.reduce((sum, s) => sum + (s.feeRemaining || 0), 0);
    return {
      ...parent,
      totalPendingFees: newPendingTotal,
    };
  });

  const updatedSettings: SchoolSettings = {
    ...settings,
    lastBilledMonth: currentMonthYear,
    lastBilledDate: formattedToday,
  };

  return {
    updatedStudents,
    updatedParents,
    updatedSettings,
    newPayments: [...createdPayments, ...payments],
    result: {
      billedCount,
      totalBilledAmount,
      monthYear: currentMonthYear,
      billedDate: formattedToday,
      alreadyBilledForThisMonth: false,
    },
  };
}
