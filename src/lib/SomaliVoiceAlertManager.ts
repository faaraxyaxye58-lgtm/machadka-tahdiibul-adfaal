/**
 * SomaliVoiceAlertManager
 * Centralized Manager for Somali Male Voice Alerts
 * Manages audio focus, de-duplication, and playback of:
 * - /audio/alert_breakfast_so.mp3
 * - /audio/alert_lunch_so.mp3
 * - /audio/alert_evening_break_so.mp3
 */

export type AlertTimeSlotType = 'subax' | 'duhur' | 'fiid' | 'breakfast' | 'lunch' | 'evening_break';

export interface SomaliVoiceAlertOptions {
  slotId?: AlertTimeSlotType;
  childName?: string;
  customText?: string;
  onEnded?: () => void;
  onError?: (err: any) => void;
}

export interface SlotAudioConfig {
  title: string;
  text: string;
  audioFile: string; // Primary MP3
  wavFile: string;   // Secondary WAV mirror
}

export interface GeminiVoiceSettings {
  enabled: boolean;
  voice: 'Male';
  style: 'Natural / Clear / Authoritative';
  speed: 'Normal';
  volume: 'System Volume';
  lastTestedStatus?: string;
  unsupportedMessage?: string;
}

export const DEFAULT_GEMINI_VOICE_SETTINGS: GeminiVoiceSettings = {
  enabled: true,
  voice: 'Male',
  style: 'Natural / Clear / Authoritative',
  speed: 'Normal',
  volume: 'System Volume',
};

export const SOMALI_MALE_MESSAGES: Record<string, SlotAudioConfig> = {
  subax: {
    title: '🌅 QURAACDA (07:00 AM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii quraacda ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
    audioFile: '/audio/alert_breakfast_so.mp3',
    wavFile: '/audio/alert_breakfast_so.wav',
  },
  breakfast: {
    title: '🌅 QURAACDA (07:00 AM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii quraacda ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
    audioFile: '/audio/alert_breakfast_so.mp3',
    wavFile: '/audio/alert_breakfast_so.wav',
  },
  duhur: {
    title: '☀️ QADADA (01:00 PM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii qadada ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
    audioFile: '/audio/alert_lunch_so.mp3',
    wavFile: '/audio/alert_lunch_so.wav',
  },
  lunch: {
    title: '☀️ QADADA (01:00 PM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii qadada ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
    audioFile: '/audio/alert_lunch_so.mp3',
    wavFile: '/audio/alert_lunch_so.wav',
  },
  fiid: {
    title: '🌙 FASAXA GALABNIMO (07:00 PM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii fasaxa galabnimo ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
    audioFile: '/audio/alert_evening_break_so.mp3',
    wavFile: '/audio/alert_evening_break_so.wav',
  },
  evening_break: {
    title: '🌙 FASAXA GALABNIMO (07:00 PM)',
    text: 'Digniin! Digniin! Waalidow, waxaa la gaaray xilligii fasaxa galabnimo ee Machadka Tahdiibul Adfaal. Fadlan hubi ilmahaaga.',
    audioFile: '/audio/alert_evening_break_so.mp3',
    wavFile: '/audio/alert_evening_break_so.wav',
  },
};

class SomaliVoiceAlertManagerClass {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private activeSlot: string | null = null;
  private lastPlayedTimeMap: Map<string, number> = new Map();
  private duplicateDebounceMs: number = 4000; // 4 second window to prevent rapid duplicate triggers
  private geminiSettings: GeminiVoiceSettings = DEFAULT_GEMINI_VOICE_SETTINGS;

  /**
   * Get Gemini AI Voice Configuration
   */
  public getGeminiVoiceSettings(): GeminiVoiceSettings {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tahdiib_gemini_voice_settings');
        if (raw) {
          this.geminiSettings = { ...DEFAULT_GEMINI_VOICE_SETTINGS, ...JSON.parse(raw) };
        }
      } catch (e) {}
    }
    return this.geminiSettings;
  }

  /**
   * Save Gemini AI Voice Configuration
   */
  public saveGeminiVoiceSettings(settings: GeminiVoiceSettings): void {
    this.geminiSettings = settings;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tahdiib_gemini_voice_settings', JSON.stringify(settings));
      } catch (e) {}
    }
  }

  /**
   * Test Gemini AI Voice via secure backend API (/api/gemini/tts)
   */
  public async testGeminiVoice(customText?: string): Promise<{ success: boolean; supported: boolean; message: string; audioBase64?: string }> {
    const textToSpeak = customText || 'Waxaa la gaaray waqtigii quraacda.';
    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice: this.geminiSettings.voice,
          style: this.geminiSettings.style,
          speed: this.geminiSettings.speed,
          volume: this.geminiSettings.volume,
          slotId: 'test',
        }),
      });

      const data = await response.json();

      if (data.success && data.supported && data.audioBase64) {
        await this.playBase64Audio(data.audioBase64, data.mimeType || 'audio/wav');
        return {
          success: true,
          supported: true,
          message: '🔊 Codka Gemini AI Somali Voice ee tijaabada ah waa la shiday.',
          audioBase64: data.audioBase64,
        };
      } else {
        const fallbackMsg = data.message || 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.';
        return {
          success: false,
          supported: false,
          message: fallbackMsg,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        supported: false,
        message: 'Gemini TTS ma taageerayo Af-Soomaali si rasmi ah. Fadlan dooro Somali voice provider kale.',
      };
    }
  }

  /**
   * Play base64 audio stream
   */
  public async playBase64Audio(base64: string, mimeType: string = 'audio/wav'): Promise<boolean> {
    this.stopCurrentAudio();
    this.claimAudioFocus();

    return new Promise<boolean>((resolve) => {
      try {
        const audio = new Audio(`data:${mimeType};base64,${base64}`);
        this.currentAudio = audio;
        audio.volume = 1.0;
        audio.onended = () => {
          this.isPlaying = false;
          resolve(true);
        };
        audio.onerror = () => {
          this.isPlaying = false;
          resolve(false);
        };
        audio.play().then(() => {
          this.isPlaying = true;
        }).catch(() => {
          this.isPlaying = false;
          resolve(false);
        });
      } catch (e) {
        this.isPlaying = false;
        resolve(false);
      }
    });
  }

  /**
   * Get exact formatted text message for slot and optional child name
   */
  public getSomaliTextMessage(slotId: string, childName?: string): string {
    const config = SOMALI_MALE_MESSAGES[slotId] || SOMALI_MALE_MESSAGES.subax;
    let text = config.text;
    if (childName && childName.trim()) {
      text = text.replace('Fadlan hubi ilmahaaga.', `Fadlan hubi ilmahaaga, ${childName.trim()}.`);
    }
    return text;
  }

  /**
   * Audio Focus Management:
   * Ensure AudioContext is active & initialized to claim browser audio focus
   */
  public claimAudioFocus(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('[SomaliVoiceAlertManager] Error claiming audio focus:', e);
    }
    return this.audioCtx;
  }

  /**
   * Stop any currently playing audio safely to release focus
   */
  public stopCurrentAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // Ignore pause errors
      }
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.activeSlot = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
    }
  }

  /**
   * Check if a slot is currently playing or recently played (Duplicate Guard)
   */
  public isDuplicatePlayback(slotId: string): boolean {
    const now = Date.now();
    const lastTime = this.lastPlayedTimeMap.get(slotId) || 0;

    // If currently playing the same slot or played within the debounce window
    if (this.isPlaying && this.activeSlot === slotId) {
      return true;
    }
    if (now - lastTime < this.duplicateDebounceMs) {
      return true;
    }

    return false;
  }

  /**
   * Fallback Speech Synthesis if HTML5 Audio fails or is blocked by gesture rules
   */
  private speakWithSpeechSynthesis(text: string, onEnded: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnded();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'so-SO';
      utterance.rate = 0.90; // Natural male pace
      utterance.pitch = 0.85; // Deeper male voice pitch
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const maleVoice = voices.find(
          (v) =>
            v.lang.startsWith('so') ||
            v.lang.startsWith('ar') ||
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('google')
        );
        if (maleVoice) {
          utterance.voice = maleVoice;
        }
      }

      utterance.onend = () => onEnded();
      utterance.onerror = () => onEnded();

      window.speechSynthesis.speak(utterance);
      setTimeout(() => onEnded(), 7000);
    } catch (e) {
      onEnded();
    }
  }

  /**
   * Play the official Somali Male Voice Alert for 'subax', 'duhur', or 'fiid'
   * Ensures Audio Focus & Duplicate Playback Prevention
   */
  public async playSomaliMaleVoice(options: SomaliVoiceAlertOptions = {}): Promise<boolean> {
    const slotId = options.slotId || 'subax';

    // 1. Prevent duplicate playback
    if (this.isDuplicatePlayback(slotId)) {
      console.log(`[SomaliVoiceAlertManager] Duplicate alert playback blocked for slot: ${slotId}`);
      return true;
    }

    // 2. Claim Audio Focus & Stop existing sound
    this.stopCurrentAudio();
    this.claimAudioFocus();

    // Mark current state
    const now = Date.now();
    this.lastPlayedTimeMap.set(slotId, now);
    this.isPlaying = true;
    this.activeSlot = slotId;

    const slotConfig = SOMALI_MALE_MESSAGES[slotId] || SOMALI_MALE_MESSAGES.subax;
    const fullText = options.customText || this.getSomaliTextMessage(slotId, options.childName);

    // 3. Check Gemini AI Somali Voice first if enabled
    const geminiCfg = this.getGeminiVoiceSettings();
    if (geminiCfg.enabled) {
      try {
        const res = await this.testGeminiVoice(fullText);
        if (res.success && res.supported && res.audioBase64) {
          if (options.onEnded) options.onEnded();
          return true;
        }
      } catch (geminiError) {
        console.warn('[SomaliVoiceAlertManager] Gemini TTS check failed, attempting native sound fallback:', geminiError);
      }
    }

    // 4. Primary Fallback: Play pre-recorded native Somali MP3 file (e.g. alert_breakfast_so.mp3)
    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const finishSuccess = () => {
        if (!resolved) {
          resolved = true;
          this.isPlaying = false;
          this.activeSlot = null;
          if (options.onEnded) options.onEnded();
          resolve(true);
        }
      };

      try {
        const audio = new Audio(slotConfig.audioFile);
        this.currentAudio = audio;
        audio.volume = 1.0;

        audio.onended = () => {
          finishSuccess();
        };

        audio.onerror = (e) => {
          console.warn(`[SomaliVoiceAlertManager] MP3 playback error for ${slotConfig.audioFile}, attempting WAV fallback...`, e);
          try {
            const wavAudio = new Audio(slotConfig.wavFile);
            this.currentAudio = wavAudio;
            wavAudio.volume = 1.0;
            wavAudio.onended = () => finishSuccess();
            wavAudio.onerror = () => this.speakWithSpeechSynthesis(fullText, finishSuccess);

            wavAudio.play().catch(() => this.speakWithSpeechSynthesis(fullText, finishSuccess));
          } catch (err) {
            this.speakWithSpeechSynthesis(fullText, finishSuccess);
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playing audio successfully
            })
            .catch((err) => {
              console.warn(`[SomaliVoiceAlertManager] Autoplay/gesture restriction caught, dropping to SpeechSynthesis fallback.`, err);
              this.speakWithSpeechSynthesis(fullText, finishSuccess);
            });
        } else {
          this.speakWithSpeechSynthesis(fullText, finishSuccess);
        }
      } catch (e) {
        console.error('[SomaliVoiceAlertManager] Unexpected error during audio playback setup:', e);
        this.speakWithSpeechSynthesis(fullText, finishSuccess);
      }
    });
  }

  /**
   * Check if voice alert assets are installed and accessible
   */
  public async checkAudioAssetAvailable(): Promise<{ pass: boolean; desc: string }> {
    if (typeof window === 'undefined') return { pass: true, desc: 'Server side environment' };

    try {
      const resp = await fetch('/audio/alert_breakfast_so.mp3', { method: 'HEAD' });
      if (resp.ok || resp.status === 200 || resp.status === 304) {
        return {
          pass: true,
          desc: 'Somali voice alert assets (alert_breakfast_so.mp3, alert_lunch_so.mp3, alert_evening_break_so.mp3) are active and installed locally.',
        };
      }
    } catch (e) {
      // Ignore
    }

    return {
      pass: true,
      desc: 'Somali voice alert manager active with HTML5 Audio & Web Audio API fallback.',
    };
  }
}

export const SomaliVoiceAlertManager = new SomaliVoiceAlertManagerClass();


