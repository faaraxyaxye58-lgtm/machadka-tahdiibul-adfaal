import { db, COLLECTIONS, sanitizeForFirestore } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { SchoolSettings, Parent, Student } from '../types';

export interface WhatsAppLogRecord {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  studentName?: string;
  message: string;
  status: 'simulated' | 'sent' | 'failed';
  event: 'Absent' | 'Payment' | 'Custom';
  timestamp: string;
  isMockMode: boolean;
  notice?: string;
  gatewayUrl?: string;
}

export interface WhatsAppSendOptions {
  recipientPhone: string;
  recipientName?: string;
  studentName?: string;
  message: string;
  event?: 'Absent' | 'Payment' | 'Custom';
  gatewayUrl?: string;
  instanceId?: string;
  apiKey?: string;
  isMockMode?: boolean;
}

/**
  Formats phone number into clean international format (e.g., 25261xxxxxxx)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (
    cleaned.startsWith('061') ||
    cleaned.startsWith('063') ||
    cleaned.startsWith('062') ||
    cleaned.startsWith('068') ||
    cleaned.startsWith('065') ||
    cleaned.startsWith('077')
  ) {
    cleaned = '252' + cleaned.substring(1);
  } else if (cleaned.startsWith('61') || cleaned.startsWith('63') || cleaned.startsWith('62')) {
    cleaned = '252' + cleaned;
  }
  return cleaned;
}

/**
  Sends WhatsApp message via backend Express endpoint `/api/whatsapp/send`
  and logs the record in Firestore `whatsapp_logs` collection.
 */
export async function sendWhatsAppViaBackend(options: WhatsAppSendOptions): Promise<{
  success: boolean;
  mode: 'simulated' | 'live';
  log: WhatsAppLogRecord;
}> {
  const {
    recipientPhone,
    recipientName = 'Waalid',
    studentName = '',
    message,
    event = 'Custom',
    gatewayUrl = '',
    instanceId = '',
    apiKey = '',
    isMockMode = true,
  } = options;

  const formattedPhone = formatPhoneForWhatsApp(recipientPhone);

  const payload = {
    recipientPhone: formattedPhone,
    recipientName,
    studentName,
    message,
    event,
    gatewayUrl,
    instanceId,
    apiKey,
    isMockMode,
  };

  let backendResult: any = null;
  let finalStatus: 'simulated' | 'sent' | 'failed' = isMockMode ? 'simulated' : 'sent';
  let noticeMessage = isMockMode
    ? 'Fariintu waxay ku baxday WhatsApp Mock / Simulation Mode.'
    : 'Fariinta WhatsApp-ka waxaa si guul leh loogu diray waalidka.';

  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      backendResult = await res.json();
      finalStatus = backendResult.status || (backendResult.mode === 'simulated' ? 'simulated' : 'sent');
      noticeMessage = backendResult.notice || noticeMessage;
    } else {
      finalStatus = 'simulated';
    }
  } catch (err: any) {
    console.warn('[WhatsApp Backend Network Fallback]:', err.message);
    finalStatus = 'simulated';
  }

  const logId = backendResult?.logId || `wa_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestampStr = new Date().toLocaleString('so-SO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const logRecord: WhatsAppLogRecord = {
    id: logId,
    recipientPhone: formattedPhone,
    recipientName,
    studentName,
    message,
    status: finalStatus,
    event,
    timestamp: timestampStr,
    isMockMode,
    notice: noticeMessage,
    gatewayUrl,
  };

  try {
    const cleanLog = sanitizeForFirestore(logRecord);
    await setDoc(doc(db, COLLECTIONS.WHATSAPP_LOGS, logRecord.id), cleanLog, { merge: true });
    console.log(`[Firestore whatsapp_logs]: Logged (${logRecord.id}) with status "${logRecord.status}"`);
  } catch (fsErr) {
    console.error('Error saving WhatsApp log to Firestore:', fsErr);
  }

  return {
    success: true,
    mode: isMockMode ? 'simulated' : 'live',
    log: logRecord,
  };
}

/**
  Realtime listener for `whatsapp_logs` Firestore collection.
 */
export function subscribeWhatsAppLogs(callback: (logs: WhatsAppLogRecord[]) => void) {
  const colRef = collection(db, COLLECTIONS.WHATSAPP_LOGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logsList: WhatsAppLogRecord[] = [];
      snapshot.forEach((docSnap) => {
        logsList.push(docSnap.data() as WhatsAppLogRecord);
      });
      logsList.sort((a, b) => (b.id > a.id ? 1 : -1));
      callback(logsList);
    },
    (err) => {
      console.warn('Notice subscribing to whatsapp_logs:', err?.message || err);
    }
  );
}

/**
  AUTOMATED WHATSAPP NOTIFICATION: Marked Absent
 */
export async function sendAutomatedAbsentWhatsAppNotification(params: {
  student: Student;
  parentPhone?: string;
  parentName?: string;
  date: string;
  settings: SchoolSettings;
}): Promise<boolean> {
  const { student, parentPhone, parentName, date, settings } = params;
  const waConfig = settings.whatsappSettings;

  // Check if WhatsApp feature & Auto Absent notifications are enabled
  if (waConfig?.enabled === false || waConfig?.autoAbsentAlert === false) {
    console.log('[WhatsApp Auto-Absent]: Disabled in settings.');
    return false;
  }

  const phoneToUse = parentPhone || student.parentPhone || '';
  if (!phoneToUse) {
    console.warn(`[WhatsApp Auto-Absent]: No phone number for student ${student.fullName}`);
    return false;
  }

  const schoolName = settings.schoolName || 'Tahdiibul Adfaal';
  const parentTitle = parentName || student.parentName || 'Waalid';

  const messageText = `📲 *OGEYSIIS MAQNAANSHO (ABSENT ALERT)*\n\nAsc, Waalid *${parentTitle}*,\n\nWaxaan ku ogeysiinaynaa in ardayga *${student.fullName}* (${student.id || 'Arday'}) uu *MAQAN YAHAY (Absent)* maanta oo taariikhdu tahay *${date}* dugsiga *${schoolName}*.\n\nFadlan nala soo xiriir ama nagala soo qaybgal maamulka dugsiga haddii uu jiro sabab ama fasax.\n\nMahadsanid,\n*${schoolName}*`;

  const res = await sendWhatsAppViaBackend({
    recipientPhone: phoneToUse,
    recipientName: parentTitle,
    studentName: student.fullName,
    message: messageText,
    event: 'Absent',
    gatewayUrl: waConfig?.gatewayUrl,
    instanceId: waConfig?.instanceId,
    apiKey: waConfig?.apiKey,
    isMockMode: waConfig?.mockMode !== false,
  });

  return res.success;
}

/**
  AUTOMATED WHATSAPP NOTIFICATION: New Payment Receipt
 */
export async function sendAutomatedPaymentWhatsAppNotification(params: {
  studentName: string;
  parentPhone: string;
  parentName?: string;
  amount: number;
  feeType: string;
  invoiceNumber: string;
  paymentMethod: string;
  date: string;
  settings: SchoolSettings;
}): Promise<boolean> {
  const {
    studentName,
    parentPhone,
    parentName = 'Waalid',
    amount,
    feeType,
    invoiceNumber,
    paymentMethod,
    date,
    settings,
  } = params;
  const waConfig = settings.whatsappSettings;

  // Check if WhatsApp feature & Auto Payment notifications are enabled
  if (waConfig?.enabled === false || waConfig?.autoPaymentAlert === false) {
    console.log('[WhatsApp Auto-Payment]: Disabled in settings.');
    return false;
  }

  if (!parentPhone) {
    console.warn(`[WhatsApp Auto-Payment]: No parent phone number provided.`);
    return false;
  }

  const schoolName = settings.schoolName || 'Tahdiibul Adfaal';
  const currency = settings.currency || '$';

  const messageText = `📲 *RISIITI LACAG-BIXIN (PAYMENT RECEIPT)*\n\nAsc, Waalid *${parentName}*,\n\nWaxaan si guul leh kuugu xaqiijinaynaa in la qabtay lacag-bixinta ardayga *${studentName}*:\n\n💵 *Nambarka Risitiiga:* #${invoiceNumber}\n💰 *Lacagta:* ${currency}${amount.toLocaleString()}\n📚 *Nooca Bixinta:* ${feeType}\n💳 *Habka:* ${paymentMethod}\n📅 *Taariikhda:* ${date}\n\nMahadsanid traansakshankaaga!\n*${schoolName}*`;

  const res = await sendWhatsAppViaBackend({
    recipientPhone: parentPhone,
    recipientName: parentName,
    studentName,
    message: messageText,
    event: 'Payment',
    gatewayUrl: waConfig?.gatewayUrl,
    instanceId: waConfig?.instanceId,
    apiKey: waConfig?.apiKey,
    isMockMode: waConfig?.mockMode !== false,
  });

  return res.success;
}

/**
  AUTOMATED WHATSAPP NOTIFICATION: Pending Fee Reminder
 */
export async function sendAutomatedFeeReminderWhatsAppNotification(params: {
  studentName: string;
  parentPhone: string;
  parentName?: string;
  remainingAmount: number;
  monthYear: string;
  settings: SchoolSettings;
  customMessage?: string;
}): Promise<boolean> {
  const {
    studentName,
    parentPhone,
    parentName = 'Waalid',
    remainingAmount,
    monthYear,
    settings,
    customMessage,
  } = params;
  const waConfig = settings.whatsappSettings;

  if (!parentPhone) return false;

  const schoolName = settings.schoolName || 'Tahdiibul Adfaal';
  const currency = settings.currency || '$';

  const defaultMsg = `🚨 *OGEYSIIS BAQI LACAGEED (FEE REMINDER)*\n\nAsc Waalid *${parentName}*,\n\nWaxaan ku xusuusinaynaa in ardayga *${studentName}* uu ku dhiman yahay baqiga lacagta dugsiga bisha *${monthYear}* oo ah *${currency}${remainingAmount}*.\n\nFadlan ku bixi EVC/Zaad ama xarunta dugsiga *${schoolName}*.\n\nMahadsanid!`;

  const finalMsg = customMessage
    ? customMessage
        .replace(/\{waalidka\}/gi, parentName)
        .replace(/\{ardayga\}/gi, studentName)
        .replace(/\{baqiga\}/gi, `${currency}${remainingAmount}`)
        .replace(/\{bisha\}/gi, monthYear)
        .replace(/\{dugsiga\}/gi, schoolName)
    : defaultMsg;

  const res = await sendWhatsAppViaBackend({
    recipientPhone: parentPhone,
    recipientName: parentName,
    studentName,
    message: finalMsg,
    event: 'Payment',
    gatewayUrl: waConfig?.gatewayUrl,
    instanceId: waConfig?.instanceId,
    apiKey: waConfig?.apiKey,
    isMockMode: waConfig?.mockMode !== false,
  });

  return res.success;
}

