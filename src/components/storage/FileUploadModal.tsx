import React, { useState, useRef } from 'react';
import { Upload, X, AlertOctagon, Check, FileText, Image as ImageIcon, File, RefreshCw, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { User, Student, CloudFileItem, CloudStorageStats } from '../../types';
import { formatBytes } from './StorageMonitorCard';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  classes: { id: string; className: string }[];
  students: Student[];
  storageStats: CloudStorageStats;
  onUploadSuccess: (newFile: CloudFileItem) => void;
  replaceTargetFile?: CloudFileItem | null;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  classes,
  students,
  storageStats,
  onUploadSuccess,
  replaceTargetFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isQuotaFull = storageStats.statusAlert === 'disabled';

  const validateSelectedFile = (file: File): boolean => {
    setFileError(null);
    setServerError(null);

    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();

    // 1. STRICT CHECK FOR VIDEO & AUDIO
    const isAudioExt = /\.(mp3|wav|aac|m4a|ogg|flac|wma|opus|mid|amr)$/i.test(name);
    const isVideoExt = /\.(mp4|mkv|avi|mov|wmv|flv|webm|3gp|m4v|mpeg|mpg)$/i.test(name);
    const isAudioMime = type.startsWith('audio/');
    const isVideoMime = type.startsWith('video/');

    if (isAudioExt || isVideoExt || isAudioMime || isVideoMime) {
      setFileError("Video iyo Audio hadda lama oggola.");
      setSelectedFile(null);
      return false;
    }

    // 2. STRICT CHECK FOR EXECUTABLES & DANGEROUS FILES
    const isExecExt = /\.(exe|bat|cmd|sh|bin|msi|apk|dmg|vbs|js|py|jar|sys|dll)$/i.test(name);
    const isExecMime = /application\/(x-msdownload|x-executable|x-sh|javascript|x-dos-program)/.test(type);

    if (isExecExt || isExecMime) {
      setFileError("Faylalka noocan ah (Executable / Scripts / Binaries) ma aha kuwo la oggol yahay.");
      setSelectedFile(null);
      return false;
    }

    // 3. CHECK FREE TIER QUOTA
    if (file.size > storageStats.availableBytes) {
      setFileError(`Baaxadda file-kan (${formatBytes(file.size)}) waxay ka weyn tahay spase-ka ku haray Cloud Storage-ka (${formatBytes(storageStats.availableBytes)}).`);
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile && !replaceTargetFile) return;
    if (isQuotaFull) {
      setServerError("Cloud Storage-ku wuxuu gaaray xadka Free Tier-ka (10 GB). Upload-ku wuu xiran yahay.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setServerError(null);

    try {
      const fileToProcess = selectedFile;
      if (!fileToProcess && !replaceTargetFile) return;

      let base64Data = '';
      if (fileToProcess) {
        setUploadProgress(30);
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(fileToProcess);
        });
      }

      setUploadProgress(60);

      const targetClassName = classes.find(c => c.id === classId)?.className || '';
      const targetStudent = students.find(s => s.studentId === studentId || s.id === studentId);

      const payload = {
        originalName: fileToProcess ? fileToProcess.name : replaceTargetFile?.originalName,
        mimeType: fileToProcess ? fileToProcess.type : replaceTargetFile?.mimeType,
        fileSize: fileToProcess ? fileToProcess.size : replaceTargetFile?.fileSize,
        base64Data,
        isPrivate,
        uploadedByUserId: currentUser?.id || 'usr-admin-1',
        uploadedByName: currentUser?.name || 'Maamulka Machadka',
        uploadedByRole: currentUser?.role || 'admin',
        classId: classId || undefined,
        className: targetClassName || undefined,
        studentId: targetStudent?.studentId || studentId || undefined,
        studentName: targetStudent?.fullName || undefined,
        teacherId: currentUser?.teacherId || undefined,
        description: description || undefined,
      };

      setUploadProgress(80);

      const endpoint = replaceTargetFile
        ? `/api/storage/files/${replaceTargetFile.id}/replace`
        : '/api/storage/upload';

      const method = replaceTargetFile ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || 'admin',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fashil ayaa ka dhacay kaydinta file-ka.');
      }

      setUploadProgress(100);
      onUploadSuccess(data.file);
      onClose();
    } catch (err: any) {
      console.error('Upload Error:', err);
      setServerError(err.message || 'Cillad ayaa ka dhacday shabakadda inta upload-ku socday.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="file-upload-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                {replaceTargetFile ? '🔄 Beddel File-ka (Replace File)' : '☁️ Upload File ku dar Cloud Storage'}
              </h3>
              <p className="text-xs text-slate-400">PDFs, Documents, Images & Educational Files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quota Disabled Alert */}
          {isQuotaFull && (
            <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>
                <strong>⚠️ Cloud Storage-ku wuxuu gaaray xadka Free Tier-ka (10 GB).</strong> Form-yada upload-ka waa la hakiyay.
              </span>
            </div>
          )}

          {/* File Error (Video/Audio/Executables/Quota) */}
          {fileError && (
            <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 font-medium animate-shake">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          {!replaceTargetFile && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-emerald-500/40 bg-slate-800/40 hover:bg-slate-800/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-sm text-slate-100">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</span>
                  <span className="text-xs text-emerald-400 font-medium">Guji si aad u beddesho file-ka la doortay</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="font-medium text-sm text-slate-200">
                    Kala soo jiid ama guji si aad u doorato File
                  </span>
                  <span className="text-xs text-slate-400 max-w-xs">
                    📄 PDF, Documents (Word, Excel), 🖼️ Images (PNG, JPG).
                  </span>
                  <span className="text-[11px] text-rose-400 font-semibold mt-1">
                    ❌ Video & Audio ma aha kuwo la oggol yahay
                  </span>
                </div>
              )}
            </div>
          )}

          {replaceTargetFile && (
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">File-ka la beddelayo:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{replaceTargetFile.originalName}</p>
            </div>
          )}

          {/* Metadata Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fasalka Loo Qoondeeyay (Class Assignment):
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Dhammaan Fasallada (Guud) --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ardayda Loo Qoondeeyay (A اختیاری - Optional):
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Dhammaan Ardayda --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.studentId || st.id}>
                    {st.fullName} ({st.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sifaynta / Qoraal Gaban (Description / Note):
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ku qor faahfaahinta kintaabka, shaxda, ama warbixinta..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Privacy setting */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="private-check"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-800 border-slate-700 rounded focus:ring-emerald-500"
              />
              <label htmlFor="private-check" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                Private File (Loo eegi karo oo keliya Ardayga/Macallinka loo qoondeeyay)
              </label>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Waxaa socda upload-ka Cloud Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Server Error & Retry */}
          {serverError && (
            <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2">
              <span>{serverError}</span>
              <button
                type="button"
                onClick={handleUploadSubmit}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          >
            Ka noqon (Cancel)
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={(!selectedFile && !replaceTargetFile) || uploading || isQuotaFull}
            className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl shadow-lg shadow-emerald-950/50 transition flex items-center gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Waxaa socda Upload...
              </>
            ) : replaceTargetFile ? (
              '🔄 Beddel File-ka (Replace)'
            ) : (
              '☁️ Kaydi Cloud Storage'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
