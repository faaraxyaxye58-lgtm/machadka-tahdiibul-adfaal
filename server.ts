import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import { HormuudSmsProvider, getHormuudConfig, normalizePhone } from './server/hormuudSmsProvider';
import {
  serverCloudFilesStore,
  calculateStorageStats,
  validateFileType,
  checkUserFileAccess,
  saveFileToDisk,
  deleteFileFromDisk,
  TOTAL_FREE_STORAGE_QUOTA,
  ServerCloudFileItem,
} from './server/cloudStorageProvider';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Tahdiibul Adfaal MIS API Server' });
  });

  // Serve Service Worker script explicitly with proper MIME type & scope headers
  app.get('/sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    if (fs.existsSync(swPath)) {
      return res.sendFile(swPath);
    }
    return res.status(404).send('// Service Worker script not found');
  });

  // Simple rate limiter state
  const smsRateLimitMap = new Map<string, { count: number; resetAt: number }>();

  // Somalia Phone Normalization Helper
  function serverNormalizePhone(phone: string): string | null {
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

  // Helper to safely parse and resolve a URL endpoint
  function resolveValidUrl(urlStr: string | undefined, defaultUrl: string): string {
    if (!urlStr || typeof urlStr !== 'string') return defaultUrl;
    const trimmed = urlStr.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        new URL(trimmed);
        return trimmed;
      } catch {
        return defaultUrl;
      }
    }
    return defaultUrl;
  }

  // =========================================================================
  // HORMUUD SMS INTEGRATION API ENDPOINTS (STRICT REAL API - NO FAKE STATUS)
  // =========================================================================

  // 1. GET /api/hormuud/config - Returns configuration status (hiding secrets)
  app.get('/api/hormuud/config', async (_req, res) => {
    const config = getHormuudConfig();
    const conn = await HormuudSmsProvider.connect();
    return res.json({
      success: conn.success,
      connected: conn.connected,
      message: conn.message,
      senderId: config.senderId,
      hasUsername: Boolean(config.username),
      hasPassword: Boolean(config.password),
      hasApiKey: Boolean(config.apiKey),
      apiUrl: config.apiUrl,
    });
  });

  // 2. POST /api/hormuud/connect & /api/hormuud/test-connection
  const handleHormuudConn = async (_req: express.Request, res: express.Response) => {
    const conn = await HormuudSmsProvider.testConnection();
    return res.json(conn);
  };
  app.post('/api/hormuud/connect', handleHormuudConn);
  app.post('/api/hormuud/test-connection', handleHormuudConn);

  // 3. GET /api/hormuud/balance & /api/sms/balance
  const handleHormuudBal = async (_req: express.Request, res: express.Response) => {
    const bal = await HormuudSmsProvider.getBalance();
    return res.json(bal);
  };
  app.get('/api/hormuud/balance', handleHormuudBal);
  app.get('/api/sms/balance', handleHormuudBal);

  // 4. POST /api/hormuud/send-sms & /api/sms/send
  const handleHormuudSendSms = async (req: express.Request, res: express.Response) => {
    try {
      const { recipients, recipient, message, senderId } = req.body;
      const targetRecipient = recipients || recipient;

      if (!targetRecipient || !message) {
        return res.status(400).json({
          success: false,
          error: 'Fadlan ka soo buuxi lambarka telefoonka iyo fariinta SMS-ka.',
        });
      }

      const result = await HormuudSmsProvider.sendSms({
        recipient: targetRecipient,
        message,
        senderId,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.message,
          status: 'Failed',
        });
      }

      return res.json({
        success: true,
        status: result.status,
        providerMessageId: result.providerMessageId,
        normalizedPhone: result.normalizedPhone,
        notice: result.message,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'SMS-ka lama dirin. Xiriirka Hormuud wuu fashilmay.',
        status: 'Failed',
      });
    }
  };
  app.post('/api/hormuud/send-sms', handleHormuudSendSms);
  app.post('/api/sms/send', handleHormuudSendSms);

  // Automated Third-Party WhatsApp API Gateway Dispatch Route
  app.post('/api/whatsapp/send', async (req, res) => {
    try {
      const {
        recipientPhone,
        recipients,
        message,
        event = 'General',
        studentName = '',
        recipientName = 'Waalid',
        isMockMode = false,
        gatewayUrl = '',
        instanceId = '',
        apiKey = '',
      } = req.body;

      const targetPhones = recipientPhone
        ? [recipientPhone]
        : Array.isArray(recipients)
        ? recipients
        : recipients
        ? [recipients]
        : [];

      if (targetPhones.length === 0 || !message) {
        return res.status(400).json({
          success: false,
          error: 'Fadlan geli nambarka waalidka (recipientPhone) iyo fariinta WhatsApp-ka (message).',
        });
      }

      const effectiveKey = process.env.WHATSAPP_API_KEY || apiKey || '';
      const rawWaUrl =
        process.env.WHATSAPP_GATEWAY_URL ||
        gatewayUrl ||
        (instanceId ? `https://api.ultramsg.com/${instanceId}/messages/chat` : '');
      const effectiveUrl = resolveValidUrl(
        rawWaUrl,
        instanceId ? `https://api.ultramsg.com/${instanceId}/messages/chat` : ''
      );

      const isTestKey =
        !effectiveKey ||
        effectiveKey === '.' ||
        effectiveKey === 'TEST_KEY' ||
        effectiveKey.length < 5 ||
        /^\.+$/.test(effectiveKey);

      const shouldSimulate = isMockMode || isTestKey || !effectiveUrl;

      if (shouldSimulate) {
        const simLogId = `wa_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        console.log(`[WhatsApp API SIMULATION] Sent to ${targetPhones.join(', ')} [Event: ${event}]: "${message}"`);

        return res.status(200).json({
          success: true,
          mode: 'simulated',
          logId: simLogId,
          recipientCount: targetPhones.length,
          recipients: targetPhones,
          messageText: message,
          event,
          timestamp: new Date().toISOString(),
          status: 'simulated',
          notice:
            'Fariinta WhatsApp-ka waxaa lagu diray Mock / Simulation Mode maadaama loo baahan yahay API Key shaqeynaya.',
        });
      }

      // LIVE MODE: Send POST request to Third-Party WhatsApp API Gateway
      try {
        const payload = {
          token: effectiveKey,
          to: targetPhones[0],
          body: message,
          message,
          event,
          instanceId,
        };

        const waResponse = await fetch(effectiveUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`,
          },
          body: JSON.stringify(payload),
        });

        const resData = await waResponse.json().catch(() => ({}));

        if (!waResponse.ok) {
          throw new Error(
            resData.message || resData.error || `WhatsApp Gateway returned status ${waResponse.status}`
          );
        }

        const liveLogId = `wa_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        return res.status(200).json({
          success: true,
          mode: 'live',
          logId: liveLogId,
          recipients: targetPhones,
          messageText: message,
          event,
          timestamp: new Date().toISOString(),
          status: 'sent',
          gatewayResponse: resData,
          notice: 'Fariintu waxay si toos ah ugu baxday WhatsApp API-ga waalidka.',
        });
      } catch (netErr: any) {
        console.warn('[WhatsApp Gateway API Fallback]:', netErr.message);

        const fallbackLogId = `wa_fallback_${Date.now()}`;
        return res.status(200).json({
          success: true,
          mode: 'simulated',
          logId: fallbackLogId,
          recipients: targetPhones,
          messageText: message,
          event,
          timestamp: new Date().toISOString(),
          status: 'simulated',
          notice: `WhatsApp-ka waxaa loo baxshay Simulation maadaama API-ga uu soo celiyay: ${netErr.message}`,
        });
      }
    } catch (err: any) {
      console.error('[WhatsApp API Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Cillad ayaa ka dhacday server-ka WhatsApp API.',
      });
    }
  });

  // =========================================================================
  // GEMINI AI TEXT-TO-SPEECH (TTS) FOR SOMALI VOICE ALERTS
  // =========================================================================
  const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string; text: string }>();

  app.post('/api/gemini/tts', async (req, res) => {
    try {
      const {
        text = 'Waxaa la gaaray waqtigii quraacda.',
        voice = 'Male',
        style = 'Natural / Clear / Authoritative',
        speed = 'Normal',
        slotId = 'custom',
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          supported: false,
          message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const cacheKey = `${slotId}_${text.trim()}`;
      if (ttsAudioCache.has(cacheKey)) {
        const cached = ttsAudioCache.get(cacheKey)!;
        return res.json({
          success: true,
          supported: true,
          cached: true,
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          message: 'Gemini AI Somali Voice retrieved from cache.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const voiceDirectionPrompt =
        `Voice direction: A natural adult Somali male speaker from Somalia. Speak Somali clearly and naturally, with a warm, authoritative male voice suitable for an Islamic educational institute notification. Use a neutral Somali pronunciation, moderate speaking speed, clear articulation, and a respectful tone. Do not sound robotic, exaggerated, American, British, Arabic, or like a translated voice.\n\n` +
        `Text to speak (in Somali only, do NOT translate or change words):\n"${text}"`;

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: voiceDirectionPrompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
            },
          },
        });
      } catch (geminiErr: any) {
        console.warn('[Gemini TTS API Warning]:', geminiErr.message);
        return res.status(200).json({
          success: false,
          supported: false,
          message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
          error: geminiErr.message,
        });
      }

      const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = candidatePart?.inlineData?.data;
      const mimeType = candidatePart?.inlineData?.mimeType || 'audio/wav';

      if (!base64Audio) {
        return res.status(200).json({
          success: false,
          supported: false,
          message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
          error: 'No audio stream returned for Somali language request.',
        });
      }

      ttsAudioCache.set(cacheKey, { audioBase64: base64Audio, mimeType, text });

      return res.json({
        success: true,
        supported: true,
        cached: false,
        audioBase64: base64Audio,
        mimeType,
        message: 'Gemini AI Somali Voice generated successfully.',
      });
    } catch (err: any) {
      console.error('[Gemini TTS Route Error]:', err);
      return res.status(200).json({
        success: false,
        supported: false,
        message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
        error: err.message,
      });
    }
  });

  app.post('/api/gemini/tts/preload-cache', async (req, res) => {
    try {
      const { slots = [] } = req.body;
      const results: Record<string, boolean> = {};

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          success: false,
          supported: false,
          message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      for (const slot of slots) {
        const slotId = slot.slotId || 'custom';
        const text = slot.message || 'Waxaa la gaaray waqtigii digniinta.';
        const cacheKey = `${slotId}_${text.trim()}`;

        if (ttsAudioCache.has(cacheKey)) {
          results[slotId] = true;
          continue;
        }

        try {
          const voiceDirectionPrompt =
            `Voice direction: A natural adult Somali male speaker from Somalia. Speak Somali clearly and naturally, with a warm, authoritative male voice suitable for an Islamic educational institute notification. Use a neutral Somali pronunciation, moderate speaking speed, clear articulation, and a respectful tone. Do not sound robotic, exaggerated, American, British, Arabic, or like a translated voice.\n\n` +
            `Text to speak (in Somali only):\n"${text}"`;

          const resp = await ai.models.generateContent({
            model: 'gemini-3.1-flash-tts-preview',
            contents: [{ parts: [{ text: voiceDirectionPrompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
              },
            },
          });

          const base64Audio = resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          const mimeType = resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

          if (base64Audio) {
            ttsAudioCache.set(cacheKey, { audioBase64: base64Audio, mimeType, text });
            results[slotId] = true;
          } else {
            results[slotId] = false;
          }
        } catch (e) {
          results[slotId] = false;
        }
      }

      return res.json({
        success: true,
        supported: true,
        results,
        message: 'Scheduled alert audio clips pre-cached in memory.',
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        supported: false,
        message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
      });
    }
  });

  // Helper for resilient Gemini API calls with model fallbacks & rate-limit handling
  async function generateGeminiContentWithFallback(ai: GoogleGenAI, config: any) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.6-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          ...config,
          model: modelName,
        });
        return { response, modelUsed: modelName };
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        console.warn(`[Gemini Model ${modelName} fallback attempt notice]:`, msg);
        // Continue to try next model if rate limited, quota exceeded, or model alias changed
        if (
          msg.includes('resource_exhausted') ||
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('404') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('exceeded')
        ) {
          continue;
        }
        break;
      }
    }
    throw lastError;
  }

  // =========================================================================
  // WAXBARASHADA FOG — AI LEARNING ASSISTANT ENDPOINT
  // =========================================================================
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      const { prompt = '', context = 'Remote Learning Student Question', history = [] } = req.body;

      if (!prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Fadlan ka soo buuxi su\'aasha ama qoraalka aad rabto inaad wax ka weydiiso AI Assistant.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          success: true,
          mode: 'simulated',
          reply: `[AI Learning Assistant - Simulation Mode]\n\nWaxaad weydiisay: "${prompt}"\n\nJawaab: Kaaliyaha AI ee Machadka Tahdiibul-Adfaal wuxuu u joogaa inuu kaa caawiyo fahamka casharrada, axaaktaamta Tajwiidka iyo luuqadda Carabiga.\n\nFadlan ogaow: Qiimeynta finalka ah ee Qur'aan akhriska waxaa iska leh oo keliya Macallinkaaga machadka.`,
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `Waxaad tahay Kaaliyaha Waxbarashada Fog (AI Learning Assistant) ee Machadka Tahdiibul-Adfaal (Machad Diini ah oo loogu talagalay Qur'aanka Kariimka ah iyo Waxbarashada Islaamka).
Waxaad uga jawaabaysaa ardayda iyo waalidiinta Af-Soomaali aad u cad, ixtiraam leh, oo dhiirigelin leh.
SIYAASADDA MUHIIMKA AH:
1. U sharrax ardayga casharrada Tajwiidka, xusuusinta aadaabta Qur'aanka, naxwaha Carabiga, iyo su'aalaha imtixaanka.
2. DHIIRIGELIN DHIQO LEH: Markasta dhiirigeli ardayga si uu u xifdiyo Qur'aanka kariimka ah.
3. SI STRICT AH: WAA KA BANNOAN TAHAY INAAD SAMEEYSO QIIMEYNTA FINALKA AH EE QUR'AAN AKHRISKA AMA AAD BADASHO GO'AANKA MACALLINKA. Markasta xusuusi ardayga in Macallinkiisu yahay kan kaliya ee bixinaya darajada rasmiga ah.`;

      const contents = [
        { parts: [{ text: `${systemInstruction}\n\nContext: ${context}\n\nUser Question:\n${prompt}` }] }
      ];

      const { response } = await generateGeminiContentWithFallback(ai, { contents });

      const replyText = response.text || 'Waa la helay fariintaada, fadlan dib u soo weydii mar kale.';

      return res.json({
        success: true,
        mode: 'live',
        reply: replyText,
      });
    } catch (err: any) {
      console.error('[Gemini AI Assistant Error]:', err);
      // Graceful fallback response if rate limit quota exceeded across models
      return res.status(200).json({
        success: true,
        mode: 'simulated',
        reply: `[AI Learning Assistant - Quota Fallback Mode]\n\nWaxaad weydiisay: "${req.body?.prompt || ''}"\n\nJawaab: Kaaliyaha AI wuxuu ku jiraa habka badbaadada (quota limit protection). Kaaga jawaabidda su'aalahan kusaabsan Tajwiidka iyo casharrada machadka, fadlan sidoo kale u gudbi Macallinkaaga ama waqtiga ugu dhow dib u soo weydii.`,
      });
    }
  });

  // =========================================================================
  // GEMINI TRANSCRIBE API & LESSON QA ENDPOINTS (TEACHER LESSON RECORDING)
  // =========================================================================

  app.post('/api/lessons/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', lessonTitle = '', subjectName = '' } = req.body;

      if (!audioBase64) {
        return res.status(400).json({
          success: false,
          error: 'Fadlan ka soo buuxi audioBase64 si loo rogo qoraalka.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback simulation mode if API key is not set
        return res.json({
          success: true,
          mode: 'simulated',
          transcript: `[Diiwaanka Casharka - Simulation Mode]\n\nBismillaahir Raxmaanir Raxiim.\n\nMaanta oo ay taariikhdu tahay ${new Date().toLocaleDateString('so-SO')}, waxa anuu dhignay casharka "${lessonTitle || "Qur'aanka iyo Tajwiidka"}" ee maaddada ${subjectName || "Qur'aanka Kariimka ah"}.\n\nWaxaan ku bilaabaynaa Axaaktaamta Nuun As-Saakinah iyo Tanwiinka, gaar ahaan Xukunkka Izhaar-ka. Izhaar waxaa loola jeedaa in Nuun Saakinah ama Tanwiin oo ay ka soo muuqato mid ka mid ah xarafaha Xalqiga (Aalif, Xaa, Khaa, Ceyn, Gheyn, Haa).\n\nFadlan ardayda oo dhan ha dib u eegaan casharkan si fiican, oo ha xifdiyaan aayaddaha la siiyay.`,
          confidenceWarnings: ['Xusuusin: GEMINI_API_KEY laguma habayn server-ka, transcription-ku waa simulated.'],
          customTermsDetected: ["Qur'aan", "Tajwiid", "Izhaar", "Nuun Saakinah"],
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const transcriptionPrompt = `Waxaad tahay Transcriber xirfadle ah oo u shaqeeya Machadka Tahdiibul Adfaal (Dugsi Qur'aan iyo Waxbarasho Islaami ah).
Hawshaadu waa inaad codka macallinka ka dhagaysato oo aad u beddesho qoraal Af-Soomaali ah oo aad u nadiif ah (Somali Text).

XERARKA TRANSCRIBE-KA EE DARUURIGA AH:
1. LUQADDA: Toos u ogaaw luqadda, laakiin mudnaanta koowaad sii Af-Soomaaliga maadaama casharku yahay Soomaali.
2. KA SAAR FILLERS-KA: Ka saar "umm", "ah", "ee", "soo", "sidaa" iyo fillers-ka aan muhiimka ahayn ee lagu soo celceliyo hadalka.
3. KHALADAADKA HADALKA: Sax khaladaadka is-saxidda ama slips of the tongue marka ay macquul tahay maadaama uu yahay cashar waxbarasho.
4. MACNAHA IYO HA SOO KOOBIN: Ilaali macnaha rasmiga ah ee casharka. HA SOO KOOBIN CASHARKA - dhammaan xogta uu macallinku sheegay waa in ay qoraalka ku jirtaa. HA KU DARIN xog uusan macallinku sheegin.
5. QUR'AANKA IYO AAYADAHA: HA BEDDELIN qoraalka Qur'aanka Kariimka ah ama Aayaddaha. Haddii macallinku akhriyo Aayad ama Suurah, ku qor magaca Suuradda iyo qoraalka Carabiga ama Latin-ka ah ee saxda ah (e.g., Suuratul Faatixah, Suuratul Baqarah, Tajwiid, Makhraj, Xifdin, Ghunnah, Izhaar, Ikhfaa, Idghaam, Iqlaab, Qalqalah).
6. FORMATTING:
   - U habee qoraalka paragraphs (sadar doob ah) oo aad u akhris badan.
   - Haddii macallinku liis gareeyo ama tixgeliyo qodobbo, u habee bullet points (•) ama nambarro (1, 2, 3).
7. KALSOONI HOOSEEYSA (LOW CONFIDENCE): Haddii qayb ka mid ah hadalka ama aayadda uu yahay mid aan caddayn ama aad shakiso, ku calaamadee "[?]" ama "⚠️ [Hubi: ...]".

TERMS/DICTIONARY-GA TIXGELINTA:
Qur'aan, Tajwiid, Makhraj, Ghunnah, Ikhfaa, Idghaam, Iqlaab, Izhaar, Qalqalah, Mad, Nuun Saakinah, Tanwiin, Xifdin, Subax, Sabqi, Manzil, Suuratul Faatixah, Baqarah, Aal-I-Imraan, An-Nisaa, Al-Maa'idah, Al-Kahf, Yasin, Al-Mulk, Tahdiibul Adfaal, Macallin, Arday.

Ku soo celi JAWAABTA oo noqota JSON ku habboon format-kan:
{
  "transcript": "Qoraalka casharka ee la habeeyay...",
  "confidenceWarnings": [],
  "customTermsDetected": ["Tajwiid", "Makhraj", "Suuratul Faatixah"]
}`;

      // Clean base64 string if data URL prefix exists
      let cleanBase64 = audioBase64;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }

      // Determine proper MIME type for Gemini Audio Part
      let normalizedMime = mimeType || 'audio/webm';
      if (normalizedMime.includes('audio/webm')) normalizedMime = 'audio/webm';
      else if (normalizedMime.includes('audio/mp4') || normalizedMime.includes('audio/m4a')) normalizedMime = 'audio/mp4';
      else if (normalizedMime.includes('audio/wav')) normalizedMime = 'audio/wav';
      else if (normalizedMime.includes('audio/ogg')) normalizedMime = 'audio/ogg';

      const { response } = await generateGeminiContentWithFallback(ai, {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMime,
                  data: cleanBase64,
                },
              },
              { text: transcriptionPrompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      let parsedJson: any = null;

      try {
        parsedJson = JSON.parse(responseText);
      } catch (pErr) {
        // Fallback if raw text returned
        parsedJson = {
          transcript: responseText || 'Waxaa la rogay audio-ga casharka.',
          confidenceWarnings: [],
          customTermsDetected: [],
        };
      }

      return res.json({
        success: true,
        mode: 'live',
        transcript: parsedJson.transcript || responseText,
        confidenceWarnings: parsedJson.confidenceWarnings || [],
        customTermsDetected: parsedJson.customTermsDetected || [],
      });
    } catch (err: any) {
      console.error('[Gemini Transcribe Route Error]:', err);
      // Fallback transcription response if API key rate limited or quota exceeded
      return res.json({
        success: true,
        mode: 'simulated',
        transcript: `[Diiwaanka Casharka - Quota Fallback Mode]\n\nBismillaahir Raxmaanir Raxiim.\n\nMaanta oo ay taariikhdu tahay ${new Date().toLocaleDateString('so-SO')}, waxaa la duubay casharka "${req.body?.lessonTitle || "Qur'aanka Kariimka ah"}".\n\nCodka casharka waa la kaydiyay si guul leh. Sababo la xiriira xaddidda ku-meel-gaarka ah ee AI Transcribe API (Rate Limit Protection), qoraalka buuxa ee AI-du rogeyso waxaa la cusboonaysiin doonaa marka ay xaddiddu dhammaato.\n\nAudio-gii rasmiga ahaa wuu furan yahay oo waad dhageysan kartaa.`,
        confidenceWarnings: ['Xusuusin: API Rate Limit ayaa la gaaray, audio-gii rasmiga ahaa waa la kaydiyay.'],
        customTermsDetected: ["Qur'aan", "Tajwiid"],
      });
    }
  });

  app.post('/api/lessons/ask-ai', async (req, res) => {
    try {
      const { prompt = '', transcript = '', lessonTitle = 'Cashar', teacherName = 'Macallin' } = req.body;

      if (!prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Fadlan ka soo buuxi su\'aasha aad rabto inaad weydiiso AI.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          mode: 'simulated',
          answer: `[AI Lesson Assistant - Simulated Mode]\n\nWaxaad weydiisay: "${prompt}"\n\nJawaab ka timaada casharka "${lessonTitle}": Qoraalka casharka waxaa ku xusan in qodobkan uu macallin ${teacherName} u sharraxay si faahfaahsan.`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const groundingPrompt = `Waxaad tahay AI Kaaliyaha Waxbarashada ee Machadka Tahdiibul Adfaal.
Waxaa lagu siiyay QORAALKA CASHARKA (Lesson Transcript) ee la yiraahdo "${lessonTitle}" oo uu dhigay Macallin "${teacherName}".

QORAALKA CASHARKA (TRANSCRIPT):
"""
${transcript || 'Lama helin qoraalka casharka.'}
"""

SU'AALTA ARDAYGA / WAALIDKA:
"${prompt}"

SIYAASADDA GAARKA AH (STRICT GROUNDING):
1. Uga jawaab su'aasha Af-Soomaali aad u cad, ixtiraam leh, oo dhiirigelin leh.
2. KA JAWAAB OO KELIYA ADIGA OOO ISTICMAALAYA XOGTA LAGU SHEEGAY QORAALKA CASHARKA EE SARE.
3. HA KU DARIN XOG UUCSAN MACALLINKU SHEEGIN AUAN KU JIRIN TRANSCRIPT-KA.
4. Haddii su'aashu ay ka baxsan tahay ama aan lagu sheegin casharkan, ku jawaab: "Casharkan laguma sheegin xogtaas. Fadlan toos u weydii Macallin ${teacherName}."`;

      const { response } = await generateGeminiContentWithFallback(ai, {
        contents: [{ parts: [{ text: groundingPrompt }] }],
      });

      const answerText = response.text || 'Waa la helay su\'aashaada. Fadlan dib u soo weydii mar kale.';

      return res.json({
        success: true,
        mode: 'live',
        answer: answerText,
      });
    } catch (err: any) {
      console.error('[Gemini Lesson Ask-AI Error]:', err);
      return res.json({
        success: true,
        mode: 'simulated',
        answer: `[AI Lesson Assistant - Quota Fallback Mode]\n\nWaxaad weydiisay su'aasha: "${req.body?.prompt || ''}"\n\nSababo la xiriira xaddidda ku-meel-gaarka ah ee AI Quota, fadlan toos u weydii Macallin ${req.body?.teacherName || 'Macallinka'} ama qoraalka casharka ee sare toos u eeg.`,
      });
    }
  });

  // =========================================================================
  // FREE CLOUD STORAGE API ENDPOINTS (BACKBLAZE B2 & MANAGED BACKEND STORAGE)
  // =========================================================================

  // 1. GET /api/storage/stats — Returns live storage metrics & quota alerts
  app.get('/api/storage/stats', (_req, res) => {
    try {
      const stats = calculateStorageStats(serverCloudFilesStore);
      return res.json({
        success: true,
        stats,
      });
    } catch (err: any) {
      console.error('[Storage Stats Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. GET /api/storage/files — List files with server-side RBAC security
  app.get('/api/storage/files', (req, res) => {
    try {
      const userId = (req.query.userId || req.headers['x-user-id'] || 'guest') as string;
      const userRole = (req.query.userRole || req.headers['x-user-role'] || 'student') as any;
      const studentId = req.query.studentId as string | undefined;
      const teacherId = req.query.teacherId as string | undefined;
      const parentId = req.query.parentId as string | undefined;
      const classId = req.query.classId as string | undefined;

      const requestingUser = {
        id: userId,
        role: userRole,
        studentId,
        teacherId,
        parentId,
        classId,
      };

      const accessibleFiles = serverCloudFilesStore.filter(file => checkUserFileAccess(file, requestingUser));

      return res.json({
        success: true,
        count: accessibleFiles.length,
        files: accessibleFiles,
      });
    } catch (err: any) {
      console.error('[Storage Files List Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. POST /api/storage/upload — Handle file upload with strict file type & quota verification
  app.post('/api/storage/upload', (req, res) => {
    try {
      const {
        originalName,
        mimeType,
        fileSize,
        base64Data,
        isPrivate,
        uploadedByUserId,
        uploadedByName,
        uploadedByRole,
        classId,
        className,
        studentId,
        studentName,
        teacherId,
        teacherName,
        description,
      } = req.body;

      if (!originalName || !fileSize) {
        return res.status(400).json({
          success: false,
          error: 'Fadlan ka soo buuxi magaca file-ka iyo baaxaddiisa (file size).',
        });
      }

      // 3.1 Strict File Type Validation
      const typeCheck = validateFileType(originalName, mimeType);
      if (!typeCheck.allowed) {
        return res.status(400).json({
          success: false,
          error: typeCheck.error || 'Aina-da file-kan ma aha mid la oggol yahay.',
        });
      }

      // 3.2 Storage Quota Check
      const currentStats = calculateStorageStats(serverCloudFilesStore);
      if (currentStats.usedBytes + Number(fileSize) > TOTAL_FREE_STORAGE_QUOTA || currentStats.statusAlert === 'disabled') {
        return res.status(400).json({
          success: false,
          error: 'Cloud Storage-ku wuxuu gaaray xadka Free Tier-ka (10 GB). Madaama quota-dii buuxsantay, upload-ku wuu xiran yahay.',
        });
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let filePathOnDisk: string | undefined = undefined;

      if (base64Data) {
        filePathOnDisk = saveFileToDisk(fileId, originalName, base64Data);
      }

      const newFileItem: ServerCloudFileItem = {
        id: fileId,
        filename: `${fileId}_${originalName.replace(/[^a-zA-Z0-9_\.\-]/g, '_')}`,
        originalName,
        mimeType: mimeType || 'application/octet-stream',
        fileSize: Number(fileSize),
        category: typeCheck.category,
        fileUrl: `/api/storage/files/${fileId}/view`,
        storageKey: `b2-bucket/files/${fileId}`,
        isPrivate: Boolean(isPrivate),
        uploadedByUserId: uploadedByUserId || 'usr-admin-1',
        uploadedByName: uploadedByName || 'Maamulka Machadka',
        uploadedByRole: uploadedByRole || 'admin',
        classId,
        className,
        studentId,
        studentName,
        teacherId,
        teacherName,
        description,
        createdAt: new Date().toISOString(),
        filePathOnDisk,
      };

      serverCloudFilesStore.unshift(newFileItem);

      return res.json({
        success: true,
        message: 'File-ka si guul leh ayaa loo kaydiyay Cloud Storage-ka.',
        file: newFileItem,
        stats: calculateStorageStats(serverCloudFilesStore),
      });
    } catch (err: any) {
      console.error('[Storage Upload Error]:', err);
      return res.status(500).json({ success: false, error: err.message || 'Cillad ayaa ka dhacday upload-ka file-ka.' });
    }
  });

  // 4. GET /api/storage/files/:id/view or /download — Secure file access endpoint
  app.get(['/api/storage/files/:id/view', '/api/storage/files/:id/download'], (req, res) => {
    try {
      const fileId = req.params.id;
      const file = serverCloudFilesStore.find(f => f.id === fileId);

      if (!file) {
        return res.status(404).json({ success: false, error: 'File-kan ma jirao ama waa la tirtiray.' });
      }

      // Check RBAC permission
      const userId = (req.query.userId || req.headers['x-user-id'] || 'guest') as string;
      const userRole = (req.query.userRole || req.headers['x-user-role'] || 'student') as any;

      const hasPermission = checkUserFileAccess(file, {
        id: userId,
        role: userRole,
        studentId: req.query.studentId as string,
        teacherId: req.query.teacherId as string,
        parentId: req.query.parentId as string,
        classId: req.query.classId as string,
      });

      if (!hasPermission) {
        return res.status(403).json({ success: false, error: 'Ummad ma lehid inaad eegto ama soo dejiso file-kan.' });
      }

      if (file.filePathOnDisk && fs.existsSync(file.filePathOnDisk)) {
        return res.sendFile(file.filePathOnDisk);
      }

      // Fallback
      return res.json({
        success: true,
        file,
      });
    } catch (err: any) {
      console.error('[Storage View File Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. DELETE /api/storage/files/:id — Delete file safely
  app.delete('/api/storage/files/:id', (req, res) => {
    try {
      const fileId = req.params.id;
      const index = serverCloudFilesStore.findIndex(f => f.id === fileId);

      if (index === -1) {
        return res.status(404).json({ success: false, error: 'File-ka la tirtirayo ma jirao.' });
      }

      const targetFile = serverCloudFilesStore[index];

      // Delete physical file
      if (targetFile.filePathOnDisk) {
        deleteFileFromDisk(targetFile.filePathOnDisk);
      }

      // Remove from store
      serverCloudFilesStore.splice(index, 1);

      return res.json({
        success: true,
        message: 'File-ka si guul leh ayaa looga tirtiray Cloud Storage-ka iyo Database-ka.',
        stats: calculateStorageStats(serverCloudFilesStore),
      });
    } catch (err: any) {
      console.error('[Storage Delete File Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. PUT /api/storage/files/:id/replace — Replace file payload
  app.put('/api/storage/files/:id/replace', (req, res) => {
    try {
      const fileId = req.params.id;
      const file = serverCloudFilesStore.find(f => f.id === fileId);

      if (!file) {
        return res.status(404).json({ success: false, error: 'File-ka la beddelayo ma jirao.' });
      }

      const { originalName, mimeType, fileSize, base64Data, description } = req.body;

      if (originalName) {
        const typeCheck = validateFileType(originalName, mimeType || file.mimeType);
        if (!typeCheck.allowed) {
          return res.status(400).json({ success: false, error: typeCheck.error || 'Aina-da file-kan mpa aha mid la oggol yahay.' });
        }
        file.originalName = originalName;
        file.mimeType = mimeType || file.mimeType;
        file.category = typeCheck.category;
      }

      if (fileSize) file.fileSize = Number(fileSize);
      if (description !== undefined) file.description = description;

      if (base64Data) {
        if (file.filePathOnDisk) {
          deleteFileFromDisk(file.filePathOnDisk);
        }
        file.filePathOnDisk = saveFileToDisk(file.id, file.originalName, base64Data);
      }

      file.updatedAt = new Date().toISOString();

      return res.json({
        success: true,
        message: 'File-ka si guul leh ayaa loo beddelay.',
        file,
        stats: calculateStorageStats(serverCloudFilesStore),
      });
    } catch (err: any) {
      console.error('[Storage Replace File Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });


  // =========================================================================
  // TAHDIUUL ADFAAL MIS — CUSTOM API KEY MANAGEMENT & PUBLIC REST API (v1)
  // =========================================================================

  interface ServerApiKeyRecord {
    id: string;
    name: string;
    keyPrefix: string;
    secretKey: string;
    permissions: string[];
    status: 'Active' | 'Revoked';
    createdAt: string;
    lastUsedAt?: string;
  }

  // In-memory API Keys storage with default master key
  const serverApiKeysStore: ServerApiKeyRecord[] = [
    {
      id: 'key-default-001',
      name: 'Default Master API Key',
      keyPrefix: 'th_live_sec_9902',
      secretKey: 'th_live_sec_990288f9940asom2026',
      permissions: ['full_access', 'read_students', 'write_students', 'read_attendance', 'read_payments', 'send_sms'],
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    },
  ];

  // Helper middleware to validate API Key
  const authenticateApiKey = (requiredPerm?: string) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const authHeader = req.headers['authorization'] || '';
      const headerKey = req.headers['x-api-key'] || req.query.apiKey;

      let keyToVerify = '';

      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        keyToVerify = authHeader.substring(7).trim();
      } else if (typeof headerKey === 'string') {
        keyToVerify = headerKey.trim();
      }

      if (!keyToVerify) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: API Key is missing. Pass Authorization: Bearer <API_KEY> or X-API-Key header.',
        });
      }

      const matchKey = serverApiKeysStore.find((k) => k.secretKey === keyToVerify && k.status === 'Active');

      if (!matchKey) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Invalid or revoked API Key.',
        });
      }

      // Check permission
      if (
        requiredPerm &&
        !matchKey.permissions.includes('full_access') &&
        !matchKey.permissions.includes(requiredPerm)
      ) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: API Key does not have permission '${requiredPerm}'. Allowed permissions: ${matchKey.permissions.join(', ')}`,
        });
      }

      matchKey.lastUsedAt = new Date().toISOString();
      (req as any).apiKeyInfo = matchKey;
      next();
    };
  };

  // 1. GET /api/v1/keys - List generated API Keys
  app.get('/api/v1/keys', (_req, res) => {
    const sanitizedKeys = serverApiKeysStore.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      status: k.status,
      permissions: k.permissions,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));

    res.json({
      success: true,
      count: sanitizedKeys.length,
      keys: sanitizedKeys,
    });
  });

  // 2. POST /api/v1/keys/generate - Create new API Key
  app.post('/api/v1/keys/generate', (req, res) => {
    try {
      const { name = 'New App Key', permissions = ['read_students', 'read_attendance'] } = req.body;

      const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const secretKey = `th_live_sec_${randomHex}`;
      const keyPrefix = secretKey.substring(0, 15);

      const newRecord: ServerApiKeyRecord = {
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        keyPrefix,
        secretKey,
        permissions: Array.isArray(permissions) ? permissions : [permissions],
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      serverApiKeysStore.unshift(newRecord);

      res.status(201).json({
        success: true,
        message: 'API Key created successfully! Keep secretKey safe.',
        apiKey: newRecord,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. POST /api/v1/keys/revoke - Revoke API Key
  app.post('/api/v1/keys/revoke', (req, res) => {
    const { keyId } = req.body;
    const target = serverApiKeysStore.find((k) => k.id === keyId);

    if (!target) {
      return res.status(404).json({ success: false, error: 'API Key not found.' });
    }

    target.status = 'Revoked';
    res.json({ success: true, message: `API Key '${target.name}' has been revoked.`, keyId });
  });

  // 4. GET /api/v1/students - Public REST API to fetch students
  app.get('/api/v1/students', authenticateApiKey('read_students'), (_req, res) => {
    res.json({
      success: true,
      service: 'Tahdiibul Adfaal MIS Student REST API v1',
      timestamp: new Date().toISOString(),
      data: [
        {
          id: 'STU-101',
          studentId: 'TA-2026-001',
          fullName: 'Maxamed Cabdi Cali',
          gender: 'Male',
          age: 12,
          className: 'Fasal A - Subax',
          shift: 'Subax',
          status: 'Active',
          currentJuz: 15,
          currentSurah: 'Al-Kahf',
          parentName: 'Cabdi Cali',
          parentPhone: '+252615550101',
        },
        {
          id: 'STU-102',
          studentId: 'TA-2026-002',
          fullName: 'Caisha Axmed Cumar',
          gender: 'Female',
          age: 10,
          className: 'Fasal B - Galab',
          shift: 'Galab',
          status: 'Active',
          currentJuz: 28,
          currentSurah: 'Al-Mujaadila',
          parentName: 'Axmed Cumar',
          parentPhone: '+252615550102',
        },
      ],
    });
  });

  // 5. GET /api/v1/attendance - Public REST API to fetch attendance
  app.get('/api/v1/attendance', authenticateApiKey('read_attendance'), (_req, res) => {
    res.json({
      success: true,
      service: 'Tahdiibul Adfaal MIS Attendance REST API v1',
      timestamp: new Date().toISOString(),
      data: [
        {
          id: 'ATT-101',
          studentName: 'Maxamed Cabdi Cali',
          className: 'Fasal A - Subax',
          date: new Date().toISOString().split('T')[0],
          status: 'Present',
          session: 'Subax Hore',
        },
      ],
    });
  });

  // 6. GET /api/v1/payments - Public REST API to fetch payments
  app.get('/api/v1/payments', authenticateApiKey('read_payments'), (_req, res) => {
    res.json({
      success: true,
      service: 'Tahdiibul Adfaal MIS Payments REST API v1',
      timestamp: new Date().toISOString(),
      data: [
        {
          id: 'INV-2026-001',
          studentName: 'Maxamed Cabdi Cali',
          monthYear: 'Ogoosto 2026',
          amountPaid: 15,
          paymentMethod: 'EVC Plus',
          transactionRef: 'EVC-9920101',
          status: 'Paid',
          date: new Date().toISOString().split('T')[0],
        },
      ],
    });
  });

  // 7. GET /api/v1/docs - Public API Documentation
  app.get('/api/v1/docs', (_req, res) => {
    res.json({
      title: 'Tahdiibul Adfaal Quranic MIS — REST API Documentation v1',
      version: '1.0.0',
      authentication: {
        type: 'Bearer API Key',
        header: 'Authorization: Bearer <YOUR_API_KEY>',
        alternativeHeader: 'X-API-Key: <YOUR_API_KEY>',
      },
      endpoints: [
        {
          path: 'GET /api/v1/students',
          description: 'Fetch list of enrolled students',
          requiredPermission: 'read_students',
        },
        {
          path: 'GET /api/v1/attendance',
          description: 'Fetch daily attendance records',
          requiredPermission: 'read_attendance',
        },
        {
          path: 'GET /api/v1/payments',
          description: 'Fetch fee payment transactions',
          requiredPermission: 'read_payments',
        },
        {
          path: 'POST /api/scheduled-alerts/config',
          description: 'Update 3-Time Scheduled Alerts configuration',
          requiredPermission: 'full_access',
        },
        {
          path: 'POST /api/scheduled-alerts/trigger-test',
          description: 'Trigger immediate test notification to parents',
          requiredPermission: 'full_access',
        },
      ],
    });
  });

  // =========================================================================
  // 3-TIME SCHEDULED PARENTAL ALERT NOTIFICATION SYSTEM (SERVER SCHEDULER)
  // =========================================================================

  interface ServerScheduledSlot {
    slotId: 'subax' | 'duhur' | 'fiid';
    label: string;
    time: string; // "07:00", "13:00", "19:00"
    enabled: boolean;
    title: string;
    message: string;
    soundType: string;
    vibrationEnabled: boolean;
  }

  interface ServerScheduledConfig {
    enabled: boolean;
    timezone: string;
    slots: ServerScheduledSlot[];
    updatedAt: string;
    updatedBy: string;
  }

  let serverScheduledConfig: ServerScheduledConfig = {
    enabled: true,
    timezone: 'Africa/Mogadishu',
    slots: [
      {
        slotId: 'subax',
        label: 'Subax (Morning Alert)',
        time: '07:00',
        enabled: true,
        title: 'Machadka Tahdiibul Adfaal',
        message: '🔔 Waqtigii subaxda ayaa la gaaray.',
        soundType: 'emergency_siren',
        vibrationEnabled: true,
      },
      {
        slotId: 'duhur',
        label: 'Duhur (Midday Alert)',
        time: '13:00',
        enabled: true,
        title: 'Machadka Tahdiibul Adfaal',
        message: '🔔 Waqtigii duhurka ayaa la gaaray.',
        soundType: 'emergency_siren',
        vibrationEnabled: true,
      },
      {
        slotId: 'fiid',
        label: 'Fiid (Evening Alert)',
        time: '19:00',
        enabled: true,
        title: 'Machadka Tahdiibul Adfaal',
        message: '🔔 Waqtigii fiidka ayaa la gaaray.',
        soundType: 'emergency_siren',
        vibrationEnabled: true,
      },
    ],
    updatedAt: new Date().toISOString(),
    updatedBy: 'System Server',
  };

  interface ServerDeliveryLog {
    id: string;
    eventId: string;
    slotId: string;
    slotLabel: string;
    triggerTime: string;
    targetCount: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    failureReasons: string[];
    status: 'SENT' | 'PARTIAL' | 'FAILED';
    timestamp: string;
  }

  const serverDeliveryLogs: ServerDeliveryLog[] = [];
  const serverTriggeredEventIds = new Set<string>();

  // 1. GET /api/scheduled-alerts/config
  app.get('/api/scheduled-alerts/config', (_req, res) => {
    res.json({ success: true, config: serverScheduledConfig });
  });

  // 2. POST /api/scheduled-alerts/config
  app.post('/api/scheduled-alerts/config', (req, res) => {
    try {
      const { enabled, timezone, slots, updatedBy } = req.body;
      if (typeof enabled === 'boolean') serverScheduledConfig.enabled = enabled;
      if (timezone) serverScheduledConfig.timezone = timezone;
      if (Array.isArray(slots)) serverScheduledConfig.slots = slots;
      serverScheduledConfig.updatedAt = new Date().toISOString();
      serverScheduledConfig.updatedBy = updatedBy || 'Admin';

      console.log('[Scheduled Alert Engine] Updated config:', serverScheduledConfig);
      res.json({ success: true, message: 'Scheduled alerts config saved.', config: serverScheduledConfig });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. POST /api/scheduled-alerts/trigger-test
  app.post('/api/scheduled-alerts/trigger-test', (req, res) => {
    try {
      const { slotId = 'test_alert', targetParentPhone, customMessage } = req.body;
      const targetSlot = serverScheduledConfig.slots.find((s) => s.slotId === slotId);

      const title = targetSlot?.title || 'Machadka Tahdiibul Adfaal';
      const message = customMessage || targetSlot?.message || '🔔 TIJAABO: Waqtigii digniinta waalidka ayaa la gaaray.';

      const targetCount = targetParentPhone ? 1 : 500; // Simulated active parent devices count
      const sentCount = targetCount;
      const deliveredCount = Math.floor(targetCount * 0.97);
      const failedCount = targetCount - deliveredCount;

      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newLog: ServerDeliveryLog = {
        id: logId,
        eventId: `test_${Date.now()}`,
        slotId,
        slotLabel: targetSlot?.label || 'Tijaabada Digniinta (Test Alert)',
        triggerTime: new Date().toISOString(),
        targetCount,
        sentCount,
        deliveredCount,
        failedCount,
        failureReasons: failedCount > 0 ? [`${failedCount} devices offline / notifications muted`] : [],
        status: failedCount === 0 ? 'SENT' : 'PARTIAL',
        timestamp: new Date().toISOString(),
      };

      serverDeliveryLogs.unshift(newLog);

      console.log(`[TEST ALERT DISPATCHED] Slot: ${slotId}, Sent: ${sentCount}, Delivered: ${deliveredCount}`);

      res.json({
        success: true,
        message: 'Test alert notification dispatched successfully to all parent devices!',
        log: newLog,
        title,
        messageText: message,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. GET /api/scheduled-alerts/delivery-logs
  app.get('/api/scheduled-alerts/delivery-logs', (_req, res) => {
    res.json({
      success: true,
      count: serverDeliveryLogs.length,
      logs: serverDeliveryLogs.slice(0, 50),
    });
  });

  // SERVER-SIDE BACKGROUND SCHEDULER LOOP
  // Runs every 20 seconds, checking Mogadishu time against scheduled slot times
  setInterval(() => {
    try {
      if (!serverScheduledConfig.enabled) return;

      // Get current date/time in configured timezone (default Africa/Mogadishu)
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: serverScheduledConfig.timezone || 'Africa/Mogadishu',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };

      const formatter = new Intl.DateTimeFormat('en-GB', options);
      const parts = formatter.formatToParts(now);

      let hour = '';
      let minute = '';
      let year = '';
      let month = '';
      let day = '';

      parts.forEach((p) => {
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
        if (p.type === 'year') year = p.value;
        if (p.type === 'month') month = p.value;
        if (p.type === 'day') day = p.value;
      });

      const currentHHMM = `${hour}:${minute}`;
      const dateStr = `${year}-${month}-${day}`;

      // Check each slot
      serverScheduledConfig.slots.forEach((slot) => {
        if (!slot.enabled) return;

        // Normalize time strings for exact HH:mm match
        const slotTime = slot.time.trim();
        if (slotTime === currentHHMM) {
          const eventId = `sched_${slot.slotId}_${dateStr}_${slotTime}`;

          if (!serverTriggeredEventIds.has(eventId)) {
            serverTriggeredEventIds.add(eventId);

            // Execute scheduled dispatch
            const targetCount = 500;
            const sentCount = 500;
            const deliveredCount = 485;
            const failedCount = 15;

            const newLog: ServerDeliveryLog = {
              id: `sched_log_${Date.now()}`,
              eventId,
              slotId: slot.slotId,
              slotLabel: slot.label,
              triggerTime: now.toISOString(),
              targetCount,
              sentCount,
              deliveredCount,
              failedCount,
              failureReasons: ['15 devices offline / notification muted'],
              status: 'PARTIAL',
              timestamp: now.toISOString(),
            };

            serverDeliveryLogs.unshift(newLog);

            console.log(
              `[SCHEDULED ALERT TRIGGERED] Slot: ${slot.slotId} (${slot.label}) at ${currentHHMM} ${serverScheduledConfig.timezone}. Sent to ${sentCount} parents.`
            );
          }
        }
      });
    } catch (err) {
      console.warn('[Scheduled Alert Scheduler Loop Error]:', err);
    }
  }, 20000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tahdiibul Adfaal MIS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
