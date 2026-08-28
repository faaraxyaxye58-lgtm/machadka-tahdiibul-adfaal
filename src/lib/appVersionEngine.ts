import { doc, onSnapshot, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db, COLLECTIONS, sanitizeForFirestore, logAuditActivity } from './firebase';

export interface AppBuildMetadata {
  versionName: string;
  versionCode: number;
  buildDate: string;
  buildTag: string;
}

export const INSTALLED_APP_BUILD: AppBuildMetadata = {
  versionName: '2.9.0',
  versionCode: 29,
  buildDate: '23 Ogosto 2026',
  buildTag: 'Build 29 (Official Production)',
};

export interface VersionHistoryItem {
  versionName: string;
  versionCode: number;
  releaseDate: string;
  notes: string[];
  minSupportedVersionCode: number;
  forceUpdateEnabled: boolean;
}

export interface PublishedAppVersionConfig {
  id: string; // 'app_version_config'
  latestVersionName: string;
  latestVersionCode: number;
  minSupportedVersionCode: number;
  forceUpdateEnabled: boolean;
  releaseNotes: string[];
  releaseDate: string;
  downloadUrl: string;
  updatedAt: string;
  publishedBy: string;
  versionHistory?: VersionHistoryItem[];
}

export const DEFAULT_PUBLISHED_VERSION_CONFIG: PublishedAppVersionConfig = {
  id: 'app_version_config',
  latestVersionName: '2.9.0',
  latestVersionCode: 29,
  minSupportedVersionCode: 28,
  forceUpdateEnabled: false,
  releaseNotes: [
    'Nidaamka Cusbooneysiinta Tooska Ah (Automatic Build Update Engine) & Dhawrista Xogta (Data Protection).',
    'Muuqaalka Qasabka Ah (Force Update Overlay) ee marka Build duug ah la isticmaalayo.',
    'Ilaalinta 100% ee xogta ardayda, maaliyadda, xaadiriska & casharrada Qur\'aanka.',
    'Warbixinta Version-yada (Version Analytics Report) ee uu maamulku kaga bogan karo kombuyutarrada/telefannada ardayda.',
  ],
  releaseDate: '23 Ogosto 2026',
  downloadUrl: 'https://play.google.com/store/apps/details?id=com.tahdiib.mis',
  updatedAt: new Date().toISOString(),
  publishedBy: 'Maamulka Dugsiga',
  versionHistory: [
    {
      versionName: '2.9.0',
      versionCode: 29,
      releaseDate: '23 Ogosto 2026',
      notes: [
        'Automatic Build Update System + Data Safety Guarantee.',
        'Force Update Enforcement overlay for unsupported builds.',
        'Admin Version Management & User Version Analytics Report.',
      ],
      minSupportedVersionCode: 28,
      forceUpdateEnabled: false,
    },
    {
      versionName: '2.8.0',
      versionCode: 28,
      releaseDate: '11 Ogosto 2026',
      notes: [
        'Dalacista Tooska Ah ee 29-ka Bisha (Auto 29th Billing).',
        'Garaaf Xisaabeedka Recharts (Paid vs Pending).',
      ],
      minSupportedVersionCode: 27,
      forceUpdateEnabled: false,
    },
  ],
};

export type UpdateCheckStatus = 'UP_TO_DATE' | 'SOFT_UPDATE_AVAILABLE' | 'FORCE_UPDATE_REQUIRED';

export function evaluateUpdateStatus(
  installedCode: number,
  config: PublishedAppVersionConfig
): UpdateCheckStatus {
  // If installed build is below minimum supported, FORCE UPDATE REQUIRED
  if (installedCode < config.minSupportedVersionCode) {
    return 'FORCE_UPDATE_REQUIRED';
  }
  // If force update toggle is ON globally and installed build is behind latest
  if (config.forceUpdateEnabled && installedCode < config.latestVersionCode) {
    return 'FORCE_UPDATE_REQUIRED';
  }
  // If installed build is behind latest
  if (installedCode < config.latestVersionCode) {
    return 'SOFT_UPDATE_AVAILABLE';
  }
  return 'UP_TO_DATE';
}

/**
 * AUTOMATIC FORCE SYNC ENGINE
 * Seamlessly purges browser cache and reloads frontend code when a new build is detected.
 * DOES NOT TOUCH FIRESTORE DATABASE OR USER DATA (Data Protection Guarantee).
 */
export function performAutomaticBuildSync(latestVersionCode: number, latestVersionName: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const syncedCodeStr = localStorage.getItem('tahdiib_synced_build_code');
    const syncedCode = syncedCodeStr ? parseInt(syncedCodeStr, 10) : 0;

    // Prevent infinite reload loop: If already synced to this or higher build, do nothing
    if (syncedCode >= latestVersionCode && INSTALLED_APP_BUILD.versionCode >= latestVersionCode) {
      return false;
    }

    // Save synced version BEFORE reloading to guarantee loop prevention
    localStorage.setItem('tahdiib_synced_build_code', String(latestVersionCode));
    localStorage.setItem('tahdiib_auto_updated_version_banner', latestVersionName);

    // 1. Purge Web Caches
    if ('caches' in window) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((key) => caches.delete(key))).catch(() => {});
      });
    }

    // 2. Unregister stale Service Worker to pull new assets
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }

    // 3. Single automatic smooth reload to boot new build
    setTimeout(() => {
      window.location.reload();
    }, 250);

    return true;
  } catch (err) {
    console.warn('Automatic Build Sync Error:', err);
    return false;
  }
}

// Real-time Firestore Subscription for Published Version Config
export function subscribeAppVersionConfig(
  callback: (config: PublishedAppVersionConfig) => void
) {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'app_version_config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PublishedAppVersionConfig;
        callback({
          ...DEFAULT_PUBLISHED_VERSION_CONFIG,
          ...data,
        });
      } else {
        // Doc doesn't exist yet, seed default remotely
        setDoc(docRef, sanitizeForFirestore(DEFAULT_PUBLISHED_VERSION_CONFIG), { merge: true })
          .catch((err) => console.warn('Could not auto-seed version config:', err));
        callback(DEFAULT_PUBLISHED_VERSION_CONFIG);
      }
    },
    (err) => {
      console.warn('Error subscribing to app_version_config:', err?.message || err);
      // Fallback to local default if offline
      callback(DEFAULT_PUBLISHED_VERSION_CONFIG);
    }
  );
}

export async function publishAppVersionConfig(
  config: PublishedAppVersionConfig,
  publisherName: string
): Promise<void> {
  try {
    const updatedHistory = [...(config.versionHistory || [])];
    const existingIndex = updatedHistory.findIndex((h) => h.versionCode === config.latestVersionCode);
    
    const newHistoryItem: VersionHistoryItem = {
      versionName: config.latestVersionName,
      versionCode: config.latestVersionCode,
      releaseDate: config.releaseDate || new Date().toLocaleDateString('so-SO'),
      notes: config.releaseNotes || [],
      minSupportedVersionCode: config.minSupportedVersionCode,
      forceUpdateEnabled: config.forceUpdateEnabled,
    };

    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = newHistoryItem;
    } else {
      updatedHistory.unshift(newHistoryItem);
    }

    const payload: PublishedAppVersionConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      publishedBy: publisherName,
      versionHistory: updatedHistory,
    };

    const docRef = doc(db, COLLECTIONS.SETTINGS, 'app_version_config');
    await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });

    await logAuditActivity(
      publisherName,
      'Admin',
      'Version Config Updated',
      'system',
      `Published Version: ${config.latestVersionName} (Build ${config.latestVersionCode}), Min Supported Build: ${config.minSupportedVersionCode}, Force Update: ${config.forceUpdateEnabled ? 'ENABLED' : 'DISABLED'}`
    );
  } catch (err) {
    console.error('Error publishing app version config:', err);
    throw err;
  }
}

// User Version Analytics Ping
export interface UserVersionReportEntry {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  versionName: string;
  versionCode: number;
  lastPing: string;
  userAgent?: string;
  deviceType?: string;
}

export async function pingUserActiveVersion(user: {
  id: string;
  username: string;
  fullName?: string;
  role: string;
}) {
  if (!user || !user.id) return;
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(userAgent);
    
    const reportData: UserVersionReportEntry = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName || user.username,
      role: user.role,
      versionName: INSTALLED_APP_BUILD.versionName,
      versionCode: INSTALLED_APP_BUILD.versionCode,
      lastPing: new Date().toISOString(),
      userAgent: userAgent.substring(0, 150),
      deviceType: isMobile ? 'Mobile / Tablet' : 'Desktop Browser',
    };

    const docRef = doc(db, COLLECTIONS.SETTINGS, `user_version_pings_${user.id}`);
    await setDoc(docRef, sanitizeForFirestore(reportData), { merge: true });
  } catch (err) {
    console.warn('Could not ping user version analytics:', err);
  }
}

export async function fetchUserVersionReports(): Promise<UserVersionReportEntry[]> {
  try {
    const colRef = collection(db, COLLECTIONS.SETTINGS);
    const snap = await getDocs(colRef);
    const list: UserVersionReportEntry[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.id.startsWith('user_version_pings_')) {
        list.push(docSnap.data() as UserVersionReportEntry);
      }
    });
    return list;
  } catch (err) {
    console.error('Error fetching user version reports:', err);
    return [];
  }
}
