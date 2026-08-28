// Server-side Hormuud SMS Provider Service
// Manages real HTTP requests to Hormuud SMS API

export interface HormuudSmsConfig {
  apiUrl: string;
  username: string;
  password: string;
  apiKey: string;
  tokenSecret: string;
  senderId: string;
}

export function getHormuudConfig(): HormuudSmsConfig {
  return {
    apiUrl: process.env.HORMUUD_SMS_API_URL || 'https://api.hormuud.com/v1/sms/send',
    username: process.env.HORMUUD_SMS_USERNAME || '',
    password: process.env.HORMUUD_SMS_PASSWORD || '',
    apiKey: process.env.HORMUUD_SMS_API_KEY || '',
    tokenSecret: process.env.HORMUUD_SMS_TOKEN || process.env.HORMUUD_SMS_TOKEN_SECRET || '',
    senderId: process.env.HORMUUD_SENDER_ID || process.env.HORMUUD_SMS_SENDER_ID || 'TAHDIIB-MIS',
  };
}

export function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  let clean = String(phone).trim().replace(/[\s\-\(\)\.]/g, '');
  if (clean.startsWith('+')) clean = clean.substring(1);
  if (clean.startsWith('252')) {
    const num = clean.substring(3);
    if (num.length >= 7 && num.length <= 10) return `+252${num}`;
  }
  if (clean.startsWith('0')) {
    const num = clean.substring(1);
    if (num.length >= 7 && num.length <= 10) return `+252${num}`;
  }
  if (/^[1-9]\d{6,9}$/.test(clean)) {
    return `+252${clean}`;
  }
  return null;
}

export class HormuudSmsProvider {
  /**
   * Connect and verify Hormuud API credentials.
   * NEVER returns connected=true unless real credentials exist and real ping request succeeds!
   */
  static async connect(): Promise<{
    success: boolean;
    connected: boolean;
    message: string;
    senderId: string;
    details?: any;
  }> {
    const config = getHormuudConfig();

    if (!config.username && !config.apiKey && !config.password) {
      return {
        success: false,
        connected: false,
        senderId: config.senderId,
        message: 'Xiriirka Hormuud wuu fashilmay: Username ama Password-ka Hormuud laguma kaydin Environment Variables-ka server-ka.',
      };
    }

    try {
      // Test real HTTP request to Hormuud API endpoint
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
          'X-Username': config.username,
        },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
          action: 'ping',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok || data.status === 'success' || data.code === 200) {
        return {
          success: true,
          connected: true,
          senderId: config.senderId,
          message: '🟢 Hormuud SMS waa ku xiran yahay',
          details: data,
        };
      }

      let errDesc = 'Xiriirka Hormuud wuu fashilmay.';
      if (response.status === 401 || response.status === 403 || (data.message && data.message.toLowerCase().includes('auth'))) {
        errDesc = 'Username ama Password-ka Hormuud waa khaldan yahay.';
      } else if (data.message) {
        errDesc = `Xiriirka Hormuud wuu fashilmay: ${data.message}`;
      }

      return {
        success: false,
        connected: false,
        senderId: config.senderId,
        message: `🔴 Hormuud SMS lama xiriirin (${errDesc})`,
      };
    } catch (err: any) {
      return {
        success: false,
        connected: false,
        senderId: config.senderId,
        message: `🔴 Hormuud SMS lama xiriirin: Xiriirka Hormuud wuu fashilmay (${err.message || 'Network error'})`,
      };
    }
  }

  static async testConnection(): Promise<{
    success: boolean;
    connected: boolean;
    message: string;
    senderId: string;
  }> {
    return this.connect();
  }

  /**
   * Fetches real SMS credit balance from Hormuud API endpoint.
   * Returns null balance if unavailable. NO fake balance!
   */
  static async getBalance(): Promise<{
    success: boolean;
    balance: number | string | null;
    message: string;
  }> {
    const config = getHormuudConfig();

    if (!config.username && !config.apiKey) {
      return {
        success: false,
        balance: null,
        message: 'SMS Balance lama heli karo. Secrets-ka Hormuud laguma xirin .env.',
      };
    }

    try {
      const balanceUrl = config.apiUrl.replace('/send', '/balance');
      const response = await fetch(balanceUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
          'X-Username': config.username,
        },
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const bal = data.balance ?? data.sms_credits ?? data.credit ?? null;
        if (bal !== null) {
          return {
            success: true,
            balance: bal,
            message: 'SMS Balance-ka si toos ah ayaa looga soo aqriyay Hormuud API.',
          };
        }
      }
    } catch (e) {
      // Failed to fetch balance
    }

    return {
      success: false,
      balance: null,
      message: 'SMS Balance lama heli karo.',
    };
  }

  /**
   * Dispatch SMS via real Hormuud SMS API endpoint.
   */
  static async sendSms(options: {
    recipient: string | string[];
    message: string;
    senderId?: string;
  }): Promise<{
    success: boolean;
    providerMessageId?: string;
    normalizedPhone?: string;
    message: string;
    status: 'Sent' | 'Delivered' | 'Failed' | 'Pending';
  }> {
    const config = getHormuudConfig();
    const rawPhones = Array.isArray(options.recipient) ? options.recipient : [options.recipient];
    const validPhones: string[] = [];

    for (const p of rawPhones) {
      const norm = normalizePhone(p);
      if (norm && !validPhones.includes(norm)) {
        validPhones.push(norm);
      }
    }

    if (validPhones.length === 0) {
      return {
        success: false,
        message: 'Lambarka telefoonka waa khaldan yahay.',
        status: 'Failed',
      };
    }

    if (!config.username && !config.apiKey) {
      return {
        success: false,
        message: 'Xiriirka Hormuud wuu fashilmay: Username ama Password-ka Hormuud laguma kaydin Environment Variables-ka server-ka.',
        status: 'Failed',
      };
    }

    const sender = options.senderId || config.senderId || 'TAHDIIB-MIS';

    try {
      const payload = {
        mobile: validPhones,
        to: validPhones.length === 1 ? validPhones[0] : validPhones,
        message: options.message,
        text: options.message,
        senderid: sender,
        sender: sender,
        username: config.username,
        password: config.password,
      };

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
          'X-Token-Secret': config.tokenSecret,
          'X-Username': config.username,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errDesc = 'SMS-ka lama dirin.';
        if (response.status === 401 || response.status === 403) {
          errDesc = 'Username ama Password-ka Hormuud waa khaldan yahay.';
        } else if (response.status === 402 || (resData.message && resData.message.toLowerCase().includes('balance'))) {
          errDesc = 'SMS Balance-ku kuma filna.';
        } else if (resData.message) {
          errDesc = `SMS-ka lama dirin: ${resData.message}`;
        }
        return {
          success: false,
          message: errDesc,
          status: 'Failed',
        };
      }

      const msgId = resData.message_id || resData.msgid || `HRM-MSG-${Date.now()}`;
      return {
        success: true,
        providerMessageId: msgId,
        normalizedPhone: validPhones[0],
        message: 'SMS-ka si guul leh ayaa loo diray.',
        status: 'Sent',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMS-ka lama dirin: Xiriirka Hormuud wuu fashilmay (${err.message || 'Network error'})`,
        status: 'Failed',
      };
    }
  }

  static async getDeliveryStatus(msgId: string): Promise<{
    status: 'Pending' | 'Sent' | 'Delivered' | 'Failed';
    providerMessageId: string;
  }> {
    return {
      status: 'Sent',
      providerMessageId: msgId,
    };
  }
}
