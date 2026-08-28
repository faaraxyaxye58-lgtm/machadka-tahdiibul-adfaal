import fs from 'fs';
import path from 'path';

export interface ServerCloudFileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number; // in bytes
  category: 'pdf' | 'document' | 'image' | 'report' | 'other';
  fileUrl: string;
  storageKey: string;
  isPrivate: boolean;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: 'admin' | 'teacher' | 'parent' | 'finance' | 'student';
  classId?: string;
  className?: string;
  studentId?: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  filePathOnDisk?: string;
  base64Data?: string;
}

export interface StorageStatsResponse {
  usedBytes: number;
  totalBytes: number; // 10 GB = 10,737,418,240 bytes
  availableBytes: number;
  totalFilesCount: number;
  pdfCount: number;
  documentCount: number;
  imageCount: number;
  reportCount: number;
  otherCount: number;
  usagePercentage: number;
  statusAlert: 'normal' | 'warning' | 'critical' | 'disabled';
  b2Enabled: boolean;
  bucketName: string;
}

// Backblaze B2 Free Tier Limit = 10 GB
export const TOTAL_FREE_STORAGE_QUOTA = 10 * 1024 * 1024 * 1024; // 10,737,418,240 bytes

const UPLOADS_DIR = path.join(process.cwd(), 'uploads_cloud');

// Ensure upload folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads_cloud directory:', err);
  }
}

// In-Memory Cloud File Records synced with server
export let serverCloudFilesStore: ServerCloudFileItem[] = [
  {
    id: "file-pdf-001",
    filename: "Manhajka_Tajwiidka_Fasalka_1.pdf",
    originalName: "Manhajka Tajwiidka & Axaaktaamka - Fasalka 1-aad.pdf",
    mimeType: "application/pdf",
    fileSize: 4850000,
    category: "pdf",
    fileUrl: "/api/storage/files/file-pdf-001/view",
    storageKey: "b2-bucket/docs/Manhajka_Tajwiidka_Fasalka_1.pdf",
    isPrivate: false,
    uploadedByUserId: "usr-admin-1",
    uploadedByName: "Sheekh Cabdiraxmaan Maxamed Cali",
    uploadedByRole: "admin",
    classId: "rcls-101",
    className: "Fasalka Fog - Group A",
    description: "Kintaabka rasmiga ah ee Tajwiidka iyo Axaaktaamka Aasaasiga ah ee Machadka Tahdiibul-Adfaal.",
    createdAt: "2026-08-15T09:00:00.000Z",
  },
  {
    id: "file-doc-002",
    filename: "Jadwalka_Imtixaanaadka_Nusufta_Sannadka.docx",
    originalName: "Jadwalka Imtixaanaadka Nusufta Sannadka 2026.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 1250000,
    category: "document",
    fileUrl: "/api/storage/files/file-doc-002/view",
    storageKey: "b2-bucket/docs/Jadwalka_Imtixaanaadka_2026.docx",
    isPrivate: false,
    uploadedByUserId: "usr-admin-1",
    uploadedByName: "Sheekh Cabdiraxmaan Maxamed Cali",
    uploadedByRole: "admin",
    description: "Shaxda iyo waqtiyada imtixaanaadka nusufta sannadka ee dhammaan fasallada.",
    createdAt: "2026-08-20T10:30:00.000Z",
  },
  {
    id: "file-img-003",
    filename: "Shahaadada_Xifdinta_Quraanka_Sample.png",
    originalName: "Shahaadada Xifdinta Qur'aanka (Sample Certificate).png",
    mimeType: "image/png",
    fileSize: 2100000,
    category: "image",
    fileUrl: "/tahdiib_logo.jpg",
    storageKey: "b2-bucket/images/Shahaadada_Sample.png",
    isPrivate: false,
    uploadedByUserId: "usr-admin-1",
    uploadedByName: "Sheekh Cabdiraxmaan Maxamed Cali",
    uploadedByRole: "admin",
    description: "Saynshiga shahaadada xifdinta ee la siiyo ardayda dhameaysa 30-ka Juz.",
    createdAt: "2026-08-22T14:15:00.000Z",
  },
  {
    id: "file-pdf-004",
    filename: "Warbixinta_Natiijooyinka_Ardayda_Term1.pdf",
    originalName: "Warbixinta Natiijooyinka Ardayda Term 1.pdf",
    mimeType: "application/pdf",
    fileSize: 3400000,
    category: "report",
    fileUrl: "/api/storage/files/file-pdf-004/view",
    storageKey: "b2-bucket/reports/Warbixinta_Term1.pdf",
    isPrivate: true,
    uploadedByUserId: "usr-teacher-1",
    uploadedByName: "Macallin Yuusuf Axmed",
    uploadedByRole: "teacher",
    classId: "rcls-101",
    className: "Fasalka Fog - Group A",
    description: "Warbixinta rasmiga ah ee natiijooyinka iyo xifdiga ardayda ee Sannad-duqeedka.",
    createdAt: "2026-08-25T11:00:00.000Z",
  },
];

// Helper to check Backblaze B2 Environment Configuration
export function getB2Config() {
  const keyId = process.env.B2_KEY_ID || '';
  const applicationKey = process.env.B2_APPLICATION_KEY || '';
  const bucketName = process.env.B2_BUCKET_NAME || 'tahdiib-mis-storage';
  const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';

  return {
    isConfigured: Boolean(keyId && applicationKey),
    keyId,
    applicationKey,
    bucketName,
    endpoint,
  };
}

// 1. File Type & Extension Validation
export function validateFileType(originalName: string, mimeType: string): { allowed: boolean; category: 'pdf' | 'document' | 'image' | 'report' | 'other'; error?: string } {
  const cleanName = (originalName || '').toLowerCase();
  const cleanMime = (mimeType || '').toLowerCase();

  // Check Video & Audio (STRICTLY DISALLOWED)
  const isAudioExt = /\.(mp3|wav|aac|m4a|ogg|flac|wma|opus|mid|midi|amr)$/i.test(cleanName);
  const isVideoExt = /\.(mp4|mkv|avi|mov|wmv|flv|webm|3gp|m4v|mpeg|mpg|ts)$/i.test(cleanName);
  const isAudioMime = cleanMime.startsWith('audio/');
  const isVideoMime = cleanMime.startsWith('video/');

  if (isAudioExt || isVideoExt || isAudioMime || isVideoMime) {
    return {
      allowed: false,
      category: 'other',
      error: "Video iyo Audio hadda lama oggola.",
    };
  }

  // Check Executable & Dangerous files (STRICTLY DISALLOWED)
  const isExecExt = /\.(exe|bat|cmd|sh|bin|msi|apk|dmg|vbs|js|py|jar|sys|dll|scr|com|ps1)$/i.test(cleanName);
  const isExecMime = /application\/(x-msdownload|x-executable|x-sh|javascript|x-dos-program)/.test(cleanMime);

  if (isExecExt || isExecMime) {
    return {
      allowed: false,
      category: 'other',
      error: "Faylalka noocan ah (Executable / Scripts / Binaries) ma aha kuwo la oggol yahay.",
    };
  }

  // Determine Allowed Categories
  if (/\.pdf$/i.test(cleanName) || cleanMime === 'application/pdf') {
    return { allowed: true, category: 'pdf' };
  }

  if (
    /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods|odp)$/i.test(cleanName) ||
    cleanMime.includes('word') ||
    cleanMime.includes('excel') ||
    cleanMime.includes('spreadsheet') ||
    cleanMime.includes('powerpoint') ||
    cleanMime.includes('presentation') ||
    cleanMime.includes('text/')
  ) {
    return { allowed: true, category: 'document' };
  }

  if (
    /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico)$/i.test(cleanName) ||
    cleanMime.startsWith('image/')
  ) {
    return { allowed: true, category: 'image' };
  }

  if (
    /\.(zip|rar|7z|json|xml|pages|numbers|key)$/i.test(cleanName) ||
    cleanMime.includes('zip') ||
    cleanMime.includes('json') ||
    cleanMime.includes('xml')
  ) {
    return { allowed: true, category: 'report' };
  }

  // General approved educational file
  return { allowed: true, category: 'other' };
}

// 2. Storage Stats Calculator
export function calculateStorageStats(files: ServerCloudFileItem[]): StorageStatsResponse {
  const b2 = getB2Config();
  const usedBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  const availableBytes = Math.max(0, TOTAL_FREE_STORAGE_QUOTA - usedBytes);
  const totalFilesCount = files.length;

  const pdfCount = files.filter(f => f.category === 'pdf').length;
  const documentCount = files.filter(f => f.category === 'document').length;
  const imageCount = files.filter(f => f.category === 'image').length;
  const reportCount = files.filter(f => f.category === 'report').length;
  const otherCount = files.filter(f => f.category === 'other').length;

  const usagePercentage = Math.min(100, Number(((usedBytes / TOTAL_FREE_STORAGE_QUOTA) * 100).toFixed(2)));

  let statusAlert: 'normal' | 'warning' | 'critical' | 'disabled' = 'normal';
  if (usagePercentage >= 100) {
    statusAlert = 'disabled';
  } else if (usagePercentage >= 90) {
    statusAlert = 'critical';
  } else if (usagePercentage >= 70) {
    statusAlert = 'warning';
  }

  return {
    usedBytes,
    totalBytes: TOTAL_FREE_STORAGE_QUOTA,
    availableBytes,
    totalFilesCount,
    pdfCount,
    documentCount,
    imageCount,
    reportCount,
    otherCount,
    usagePercentage,
    statusAlert,
    b2Enabled: b2.isConfigured,
    bucketName: b2.bucketName,
  };
}

// 3. Server-side Security & RBAC Access Check
export function checkUserFileAccess(
  file: ServerCloudFileItem,
  requestingUser: {
    id: string;
    role: 'admin' | 'teacher' | 'parent' | 'finance' | 'student';
    studentId?: string;
    teacherId?: string;
    parentId?: string;
    classId?: string;
    assignedClasses?: string[];
  }
): boolean {
  if (!requestingUser) return false;

  // Admin and Finance have full management access
  if (requestingUser.role === 'admin' || requestingUser.role === 'finance') {
    return true;
  }

  // File creator always has access
  if (file.uploadedByUserId === requestingUser.id) {
    return true;
  }

  // Teacher Access
  if (requestingUser.role === 'teacher') {
    if (file.teacherId && file.teacherId === requestingUser.teacherId) return true;
    if (file.classId && requestingUser.assignedClasses && requestingUser.assignedClasses.includes(file.classId)) return true;
    if (!file.isPrivate) return true; // Public educational materials
    return false;
  }

  // Student Access
  if (requestingUser.role === 'student') {
    // Student can access their specific files
    if (file.studentId && file.studentId === requestingUser.studentId) return true;
    // Student can access public files assigned to their class
    if (file.classId && file.classId === requestingUser.classId && !file.isPrivate) return true;
    // Public non-private general school documents
    if (!file.isPrivate && !file.studentId) return true;
    return false;
  }

  // Parent Access
  if (requestingUser.role === 'parent') {
    // Parent can access their children's files
    if (file.studentId && file.studentId === requestingUser.studentId) return true;
    if (file.classId && file.classId === requestingUser.classId && !file.isPrivate) return true;
    if (!file.isPrivate && !file.studentId) return true;
    return false;
  }

  return false;
}

// Save physical file payload to server disk
export function saveFileToDisk(fileId: string, originalName: string, base64OrBuffer: string | Buffer): string {
  const safeFilename = `${fileId}_${originalName.replace(/[^a-zA-Z0-9_\.\-]/g, '_')}`;
  const fullPath = path.join(UPLOADS_DIR, safeFilename);

  if (typeof base64OrBuffer === 'string') {
    const cleanBase64 = base64OrBuffer.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(fullPath, Buffer.from(cleanBase64, 'base64'));
  } else {
    fs.writeFileSync(fullPath, base64OrBuffer);
  }

  return fullPath;
}

// Remove physical file from server disk
export function deleteFileFromDisk(filePath?: string): boolean {
  if (!filePath) return true;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (err) {
    console.error('Error deleting physical file:', err);
    return false;
  }
}
