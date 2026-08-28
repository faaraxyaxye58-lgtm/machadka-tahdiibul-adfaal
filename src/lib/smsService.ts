import { db, COLLECTIONS, sanitizeForFirestore } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

export interface SmsLogRecord {
  id: string;
  parentId?: string;
  studentId?: string;
  recipients: string; // Comma separated or single phone
  recipientName?: string;
  recipientPhone: string;
  studentName?: string;
  message: string;
  senderId: string;
  senderUserId?: string;
  status: 'simulated' | 'sent' | 'delivered' | 'failed' | 'pending';
  gateway: string; // e.g. 'Hormuud/Deentire SMS'
  messageType: 'Absent' | 'Fee' | 'Hifz' | 'Notice' | 'General';
  timestamp: string;
  createdAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  isMockMode: boolean;
  notice?: string;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface SmsSendOptions {
  recipients: string | string[]; // Phone numbers (+252...)
  parentId?: string;
  studentId?: string;
  recipientName?: string;
  recipientPhone?: string;
  studentName?: string;
  message: string;
  senderId?: string;
  senderUserId?: string;
  gateway?: string;
  messageType?: 'Absent' | 'Fee' | 'Hifz' | 'Notice' | 'General';
  apiUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  tokenSecret?: string;
  isMockMode?: boolean;
}

/**
 * Normalizes Somalia phone numbers into standard +252XXXXXXXXX format.
 * Supports:
 * - "+252615001122" -> "+252615001122"
 * - "252615001122"  -> "+252615001122"
 * - "0615001122"   -> "+252615001122"
 * - "615001122"    -> "+252615001122"
 * - "077123456"    -> "+25277123456"
 * - "0621234567"   -> "+252621234567"
 * - "0681234567"   -> "+252681234567"
 * - "0901234567"   -> "+252901234567"
 */
export function normalizeSomaliaPhoneNumber(inputPhone: string): {
  isValid: boolean;
  formattedPhone: string;
  rawPhone: string;
  error?: string;
} {
  if (!inputPhone) {
    return {
      isValid: false,
      formattedPhone: '',
      rawPhone: inputPhone,
      error: 'Lambarka telefoonka waa maran yahay. Fadlan geli lambar Soomaali ah.',
    };
  }

  // Remove spaces, hyphens, brackets, special characters
  let clean = inputPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Handle leading +
  const hasPlus = clean.startsWith('+');
  if (hasPlus) {
    clean = clean.substring(1);
  }

  // If starts with 252 (Somalia Country Code)
  if (clean.startsWith('252')) {
    const numPart = clean.substring(3);
    if (numPart.length >= 7 && numPart.length <= 10) {
      return {
        isValid: true,
        formattedPhone: `+252${numPart}`,
        rawPhone: inputPhone,
      };
    }
  }

  // If starts with local prefix '0' (e.g. 061..., 062..., 077..., 068..., 090...)
  if (clean.startsWith('0')) {
    const numPart = clean.substring(1);
    if (numPart.length >= 7 && numPart.length <= 10) {
      return {
        isValid: true,
        formattedPhone: `+252${numPart}`,
        rawPhone: inputPhone,
      };
    }
  }

  // If direct local mobile without leading 0 (e.g. 61..., 62..., 77..., 68..., 90...)
  if (/^[1-9]\d{6,9}$/.test(clean)) {
    return {
      isValid: true,
      formattedPhone: `+252${clean}`,
      rawPhone: inputPhone,
    };
  }

  return {
    isValid: false,
    formattedPhone: inputPhone,
    rawPhone: inputPhone,
    error: 'Lambarka telefoonka waa khaldan yahay. Fadlan geli lambarka Soomaaliya qaabka +25261XXXXXXX ama 061XXXXXXX.',
  };
}

/**
 * Triggers native device SMS protocol (sms: URI) to open Messages app pre-filled with phone and text.
 * Works on Android, iPhone/iPad, Windows, Mac natively without any API Key!
 */
export function openNativeSmsApp(inputPhone: string, messageText: string): boolean {
  const norm = normalizeSomaliaPhoneNumber(inputPhone);
  const phone = norm.isValid ? norm.formattedPhone : inputPhone;

  // Detect iOS for SMS URI delimiter
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const encodedBody = encodeURIComponent(messageText);
  // iOS uses &body= while Android/Windows/Mac uses ?body=
  const smsUri = isIOS ? `sms:${phone}&body=${encodedBody}` : `sms:${phone}?body=${encodedBody}`;

  try {
    window.location.href = smsUri;
    return true;
  } catch (err) {
    console.error('Error opening native SMS app:', err);
    return false;
  }
}

/**
 * Direct WhatsApp launcher link generator (API-Free)
 */
export function openDirectWhatsApp(inputPhone: string, messageText: string): boolean {
  const norm = normalizeSomaliaPhoneNumber(inputPhone);
  if (!norm.isValid) return false;

  const cleanPhone = norm.formattedPhone.replace('+', '');
  const encodedText = encodeURIComponent(messageText);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  try {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('Error opening WhatsApp:', err);
    return false;
  }
}

/**
 * Sends a Direct SIM SMS (API-Free) by opening device app and logging in Firestore `sms_logs`.
 */
export async function sendDirectSimSms(options: SmsSendOptions): Promise<{
  success: boolean;
  log: SmsLogRecord;
  notice: string;
}> {
  const norm = normalizeSomaliaPhoneNumber(
    Array.isArray(options.recipients) ? options.recipients[0] : options.recipients
  );

  const targetPhone = norm.isValid ? norm.formattedPhone : String(options.recipients);

  // Trigger device SMS app
  openNativeSmsApp(targetPhone, options.message);

  const logId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const timestampStr = now.toLocaleString('so-SO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const logRecord: SmsLogRecord = {
    id: logId,
    parentId: options.parentId,
    studentId: options.studentId,
    recipients: targetPhone,
    recipientName: options.recipientName || 'Waalid',
    recipientPhone: targetPhone,
    studentName: options.studentName,
    message: options.message,
    senderId: options.senderId || 'TAHDIIB-MIS',
    senderUserId: options.senderUserId || 'admin',
    status: 'sent',
    gateway: 'Direct SIM (API-Free)',
    messageType: options.messageType || 'General',
    timestamp: timestampStr,
    createdAt: now.toISOString(),
    sentAt: now.toISOString(),
    isMockMode: false,
    notice: 'SMS-ka waxaa si toos ah looga furay telefoonkaaga (Native SIM Card Dispatch).',
  };

  try {
    const cleanLog = sanitizeForFirestore(logRecord);
    await setDoc(doc(db, COLLECTIONS.SMS_LOGS, logRecord.id), cleanLog, { merge: true });
  } catch (fsErr) {
    console.error('Error saving Direct SIM log to Firestore:', fsErr);
  }

  return {
    success: true,
    log: logRecord,
    notice: 'SMS-ka waxaa si toos ah looga dirayaa SIM Card-ka telefoonkaaga (API-Free Direct Dispatch).',
  };
}

/**
 * Validates the API key according to strict security guidelines:
 * - Must be at least 10 characters long.
 * - Must not be empty, whitespace, or placeholder characters like "." or "TEST_KEY".
 */
export function validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
  const trimmed = (apiKey || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'API Key-gu waa maran yahay. Fadlan geli API Key ugu yaraan 10 xaraf ah ama shaqaysii Mock Mode.',
    };
  }

  if (trimmed === '.' || /^\.+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'API Key-gu ma noqon karo "." ama astaamo gaagaaban. Geli xaraf ka kooban 10+ oo ammaan ah.',
    };
  }

  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: `API Key-gu waa aad u gaaban yahay (${trimmed.length} xaraf). Waa in uu noqdaa ugu yaraan 10 xaraf.`,
    };
  }

  return { isValid: true };
}

/**
 * Send SMS Abstraction Interface - Standardized send function.
 * Called by views, handlers, and background services.
 */
export async function sendSMS(options: SmsSendOptions): Promise<{
  success: boolean;
  mode: 'simulated' | 'live';
  log: SmsLogRecord;
  error?: string;
  notice?: string;
}> {
  return sendSmsViaBackend(options);
}

/**
 * Sends SMS via backend Express endpoint `/api/sms/send` and records log in Firestore `sms_logs` collection.
 */
export async function sendSmsViaBackend(options: SmsSendOptions): Promise<{
  success: boolean;
  mode: 'simulated' | 'live';
  log: SmsLogRecord;
  error?: string;
  notice?: string;
}> {
  const {
    recipients,
    parentId,
    studentId,
    recipientName = 'Waalid',
    recipientPhone,
    studentName = '',
    message,
    senderId = 'TAHDIIB-MIS',
    senderUserId = 'admin',
    gateway = 'Hormuud/Deentire SMS',
    messageType = 'General',
    apiUrl,
    apiKey = '',
    username,
    password,
    tokenSecret = '',
    isMockMode = false,
  } = options;

  // Process & Normalize Recipients
  const rawRecipients = Array.isArray(recipients) ? recipients : [recipients];
  const normalizedPhones: string[] = [];
  let hasInvalidNumber = false;

  for (const r of rawRecipients) {
    const norm = normalizeSomaliaPhoneNumber(r);
    if (norm.isValid) {
      if (!normalizedPhones.includes(norm.formattedPhone)) {
        normalizedPhones.push(norm.formattedPhone);
      }
    } else {
      hasInvalidNumber = true;
    }
  }

  if (normalizedPhones.length === 0) {
    const logErrRecord: SmsLogRecord = {
      id: `err_${Date.now()}`,
      parentId,
      studentId,
      recipients: Array.isArray(recipients) ? recipients.join(', ') : recipients,
      recipientName,
      recipientPhone: recipientPhone || '',
      studentName,
      message,
      senderId,
      senderUserId,
      status: 'failed',
      gateway,
      messageType,
      timestamp: new Date().toLocaleString('so-SO'),
      createdAt: new Date().toISOString(),
      isMockMode: true,
      errorMessage: 'Lambarka telefoonka waa khaldan yahay. Fadlan geli lambar Soomaali ah (+252...).',
    };

    return {
      success: false,
      mode: 'simulated',
      log: logErrRecord,
      error: 'Lambarka telefoonka waa khaldan yahay. Fadlan hubi lambarka Soomaaliya (+252...).',
    };
  }

  // Determine if this dispatch should use Mock Mode / Simulation
  const keyValidation = validateApiKey(apiKey);
  const effectiveMock = isMockMode || !keyValidation.isValid;

  const payload = {
    recipients: normalizedPhones,
    message,
    isMockMode: effectiveMock,
    apiUrl,
    apiKey,
    username,
    password,
    tokenSecret,
    senderId,
    recipientName,
    studentName,
    messageType,
  };

  let backendResult: any = null;
  let finalStatus: 'simulated' | 'sent' | 'delivered' | 'failed' | 'pending' = effectiveMock ? 'simulated' : 'sent';
  let noticeMessage = effectiveMock
    ? 'TEST MODE — SMS dhab ah lama dirin (Simulated SMS).'
    : 'SMS-ka si guul leh ayaa loo diray Hormuud SMS Service.';
  let errorMessageStr: string | undefined = undefined;

  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      backendResult = await res.json();
      finalStatus = backendResult.status || (backendResult.mode === 'simulated' ? 'simulated' : 'sent');
      noticeMessage = backendResult.notice || noticeMessage;
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[Backend SMS API Warn]: Fallback simulation due to API response:', errJson);
      errorMessageStr = errJson.error || 'SMS-ka lama dirin. Fadlan hubi internet-ka ama SMS API-ga.';
      finalStatus = effectiveMock ? 'simulated' : 'failed';
    }
  } catch (err: any) {
    console.warn('[Backend SMS Network Error]: Local fallback simulation engaged:', err.message);
    errorMessageStr = 'Internet-ka ma jiro ama SMS API-ga waa la heli waayay. Fadlan hubi internet-ka.';
    finalStatus = effectiveMock ? 'simulated' : 'failed';
  }

  // Create Log Record for Firestore `sms_logs` collection
  const logId = backendResult?.logId || `sms_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const timestampStr = now.toLocaleString('so-SO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const logRecord: SmsLogRecord = {
    id: logId,
    parentId,
    studentId,
    recipients: normalizedPhones.join(', '),
    recipientName,
    recipientPhone: recipientPhone || normalizedPhones[0] || '',
    studentName,
    message,
    senderId,
    senderUserId,
    status: finalStatus,
    gateway,
    messageType,
    timestamp: timestampStr,
    createdAt: now.toISOString(),
    sentAt: finalStatus === 'sent' || finalStatus === 'simulated' ? now.toISOString() : undefined,
    isMockMode: effectiveMock,
    notice: noticeMessage,
    providerMessageId: backendResult?.providerMessageId || backendResult?.logId,
    errorMessage: errorMessageStr,
  };

  // Save directly to Firestore `sms_logs` collection
  try {
    const cleanLog = sanitizeForFirestore(logRecord);
    await setDoc(doc(db, COLLECTIONS.SMS_LOGS, logRecord.id), cleanLog, { merge: true });
    console.log(`[Firestore sms_logs]: Logged SMS (${logRecord.id}) with status "${logRecord.status}"`);
  } catch (fsErr) {
    console.error('Error saving SMS log to Firestore:', fsErr);
  }

  return {
    success: finalStatus !== 'failed',
    mode: effectiveMock ? 'simulated' : 'live',
    log: logRecord,
    notice: noticeMessage,
    error: errorMessageStr,
  };
}

/**
 * Fetch current Hormuud SMS Balance from server API
 */
export async function fetchSmsBalance(options?: { apiUrl?: string; apiKey?: string }): Promise<{
  success: boolean;
  balance: number | string | null;
  mode: 'live' | 'simulated' | 'not_configured';
  notice: string;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.apiUrl) params.set('apiUrl', options.apiUrl);
    if (options?.apiKey) params.set('apiKey', options.apiKey);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/sms/balance${queryString}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Error fetching SMS balance:', err);
  }
  return {
    success: false,
    balance: null,
    mode: 'not_configured',
    notice: 'SMS service-ka weli lama xiriirin. Fadlan geli SMS API credentials.',
  };
}

/**
 * Realtime subscription to Firestore `sms_logs` collection.
 */
export function subscribeSmsLogs(callback: (logs: SmsLogRecord[]) => void) {
  const colRef = collection(db, COLLECTIONS.SMS_LOGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logsList: SmsLogRecord[] = [];
      snapshot.forEach((docSnap) => {
        logsList.push(docSnap.data() as SmsLogRecord);
      });
      // Sort newest first
      logsList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      callback(logsList);
    },
    (err) => {
      console.warn('Notice subscribing to sms_logs:', err?.message || err);
    }
  );
}
