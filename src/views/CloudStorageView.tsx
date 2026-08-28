import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Upload,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  File,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  AlertTriangle,
  FolderOpen,
  X,
  CheckCircle,
  Database,
  ShieldAlert
} from 'lucide-react';
import { User, Student, Teacher, CloudFileItem, CloudStorageStats } from '../types';
import { Storage } from '../lib/storage';
import { StorageMonitorCard, formatBytes } from '../components/storage/StorageMonitorCard';
import { FileUploadModal } from '../components/storage/FileUploadModal';

interface CloudStorageViewProps {
  currentUser: User | null;
  classes: { id: string; className: string }[];
  students: Student[];
  teachers: Teacher[];
}

export const CloudStorageView: React.FC<CloudStorageViewProps> = ({
  currentUser,
  classes,
  students,
  teachers,
}) => {
  const [files, setFiles] = useState<CloudFileItem[]>(() => Storage.getCloudFiles());
  const [stats, setStats] = useState<CloudStorageStats>({
    usedBytes: 11600000,
    totalBytes: 10737418240,
    availableBytes: 10725818240,
    totalFilesCount: 4,
    pdfCount: 2,
    documentCount: 1,
    imageCount: 1,
    reportCount: 1,
    otherCount: 0,
    usagePercentage: 0.11,
    statusAlert: 'normal',
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('all');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [replaceTargetFile, setReplaceTargetFile] = useState<CloudFileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<CloudFileItem | null>(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState<CloudFileItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Stats & Files from backend API
  const fetchStorageData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/storage/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      }

      // 2. Fetch Files with RBAC parameters
      const params = new URLSearchParams({
        userId: currentUser?.id || '',
        userRole: currentUser?.role || 'student',
      });

      if (currentUser?.studentId) params.append('studentId', currentUser.studentId);
      if (currentUser?.teacherId) params.append('teacherId', currentUser.teacherId);
      if (currentUser?.parentId) params.append('parentId', currentUser.parentId);

      const filesRes = await fetch(`/api/storage/files?${params.toString()}`);
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        if (filesData.success && Array.isArray(filesData.files)) {
          setFiles(filesData.files);
          Storage.saveCloudFiles(filesData.files);
        }
      }
    } catch (err) {
      console.error('Error loading storage data from backend API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, [currentUser]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTargetFile) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/storage/files/${deleteTargetFile.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || 'admin',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fashil ayaa ka dhacay tirtirida file-ka.');
      }

      const updatedFiles = files.filter(f => f.id !== deleteTargetFile.id);
      setFiles(updatedFiles);
      Storage.saveCloudFiles(updatedFiles);

      if (data.stats) {
        setStats(data.stats);
      }

      showNotification('File-ka si guul leh ayaa looga tirtiray Cloud Storage-ka.');
      setDeleteTargetFile(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      showNotification(`Cillad: ${err.message || 'Lama tirtiri karo file-kan.'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Filter Files
  const filteredFiles = files.filter((file) => {
    // Search query filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      file.originalName.toLowerCase().includes(query) ||
      (file.description || '').toLowerCase().includes(query) ||
      (file.uploadedByName || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Category filter
    if (selectedCategory !== 'all' && file.category !== selectedCategory) {
      return false;
    }

    // Dynamic Class filter
    if (selectedClassId !== 'all' && file.classId !== selectedClassId) {
      return false;
    }

    // Privacy filter
    if (selectedPrivacy === 'private' && !file.isPrivate) return false;
    if (selectedPrivacy === 'public' && file.isPrivate) return false;

    return true;
  });

  const canManageFiles = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  return (
    <div id="cloud-storage-view" className="space-y-6 pb-12 text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Storage Monitor */}
      <StorageMonitorCard stats={stats} onRefresh={fetchStorageData} />

      {/* Security & Access Policy Overview Card */}
      <div id="storage-security-policy" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>🛡️ Siyaasadda Amniga & Xaqiijinta Faylalka (File Security & RBAC Policy)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <strong className="text-slate-200 block mb-1">🔐 Access Control (RBAC)</strong>
            <p className="text-slate-400">
              Admin-ku wuxuu leeyahay xakameyn buuxda. Macallinku wuxuu arki karaa fasalladiisa. Ardaydu waxay u gaar yihiin faylalka loo fasaxay.
            </p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <strong className="text-rose-300 block mb-1">🚫 No Video & Audio Allowed</strong>
            <p className="text-slate-400">
              Faylalka Video-ga iyo Audio-ga waa la reebay si loo dhowro 10 GB Free Tier space-ka machadka.
            </p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <strong className="text-emerald-300 block mb-1">📄 Permitted File Formats</strong>
            <p className="text-slate-400">
              Waxaa la oggol yahay PDFs, Word/Excel/PPT Documents, Sawirrada (PNG, JPG), iyo Warbixinada imtixaanaadka.
            </p>
          </div>
        </div>
      </div>

      {/* View Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            📂 Kaydka Documents-ka & Files-ka (Cloud Storage)
          </h2>
          <p className="text-xs text-slate-400">
            Diiwaanka Manhajka, Kitaabyada PDFs-ka, Imtixaanaadka, Warbixinada & Sawirrada.
          </p>
        </div>

        {canManageFiles && (
          <button
            onClick={() => {
              setReplaceTargetFile(null);
              setIsUploadOpen(true);
            }}
            disabled={stats.statusAlert === 'disabled'}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>☁️ Ku dar File (Upload)</span>
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Raadi magaca file-ka ama qoraalka..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">📁 Dhammaan Noocyada (Categories)</option>
              <option value="pdf">📄 PDFs ({stats.pdfCount})</option>
              <option value="document">📄 Word/Excel Documents ({stats.documentCount})</option>
              <option value="image">🖼️ Images ({stats.imageCount})</option>
              <option value="report">📊 Warbixinno (Reports)</option>
              <option value="other">📁 Files Kale</option>
            </select>
          </div>

          {/* Dynamic Class Filter */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">🏫 Dhammaan Fasallada (Dynamic Classes)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Filter */}
          <div>
            <select
              value={selectedPrivacy}
              onChange={(e) => setSelectedPrivacy(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">🔓 Security Status: Dhammaan</option>
              <option value="public">🌐 Public (Wadaag)</option>
              <option value="private">🔒 Private (Khad gaar ah)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Files Grid / List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Waxaa socda soo helida xogta Cloud Storage...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-200">Waqtigan wax file ah ma jiro</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Maysan jirin faylal lagu helay raadinta ama filtarada aad dooratay.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg transition group"
            >
              <div>
                {/* File Header Icon & Privacy Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    {file.category === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                    {file.category === 'document' && <FileText className="w-5 h-5 text-blue-400" />}
                    {file.category === 'image' && <ImageIcon className="w-5 h-5 text-emerald-400" />}
                    {file.category === 'report' && <Database className="w-5 h-5 text-amber-400" />}
                    {file.category === 'other' && <File className="w-5 h-5 text-purple-400" />}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                      file.isPrivate
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {file.isPrivate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {file.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>

                {/* File Title & Details */}
                <h4
                  className="font-semibold text-xs text-slate-100 line-clamp-2 hover:text-emerald-400 cursor-pointer mb-1"
                  title={file.originalName}
                  onClick={() => setPreviewFile(file)}
                >
                  {file.originalName}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                  {file.description || 'Wax sifo ah looma qorin file-kan.'}
                </p>

                {/* Class & Metadata Tags */}
                <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5 mb-3">
                  <div className="flex justify-between">
                    <span>Baaxadda:</span>
                    <strong className="text-slate-200">{formatBytes(file.fileSize)}</strong>
                  </div>
                  {file.className && (
                    <div className="flex justify-between">
                      <span>Fasalka:</span>
                      <span className="text-emerald-400 font-medium">{file.className}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Usoodiyaariyay:</span>
                    <span className="text-slate-300 truncate max-w-[120px]">{file.uploadedByName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taariikhda:</span>
                    <span className="text-slate-400">{file.createdAt.substring(0, 10)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
                  title="Dul-joog/Daawo"
                >
                  <Eye className="w-3.5 h-3.5" /> Eeg
                </button>

                <a
                  href={file.fileUrl}
                  download={file.originalName}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                  title="Soo deji (Download)"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                {canManageFiles && (
                  <>
                    <button
                      onClick={() => {
                        setReplaceTargetFile(file);
                        setIsUploadOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                      title="Beddel (Replace)"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteTargetFile(file)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition"
                      title="Tirtir (Delete)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: File Upload / Replace Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setReplaceTargetFile(null);
        }}
        currentUser={currentUser}
        classes={classes}
        students={students}
        storageStats={stats}
        replaceTargetFile={replaceTargetFile}
        onUploadSuccess={(newFile) => {
          fetchStorageData();
          showNotification('File-ka si guul leh ayaa loo kaydiyay Cloud Storage-ka.');
        }}
      />

      {/* Modal: Delete Confirmation Modal */}
      {deleteTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-100">Ma hubtaa inaad tirtirayso file-kan?</h3>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <strong className="block text-slate-100 mb-1">{deleteTargetFile.originalName}</strong>
              Faylkan waxaa si joogto ah looga tirtiri doonaa Cloud Storage-ka iyo Database-ka.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetFile(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
              >
                Haye / Ka noqon
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-950/50 transition flex items-center gap-1.5"
              >
                {deleting ? 'Waxaa socda tirtirid...' : 'Oo tirtir File-kan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Document / Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2.5 truncate max-w-md">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="font-semibold text-sm text-slate-100 truncate">{previewFile.originalName}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[300px] bg-slate-950/50">
              {previewFile.category === 'image' ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.originalName}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain border border-slate-800 shadow-2xl"
                />
              ) : (
                <div className="text-center space-y-4 max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 mb-1">{previewFile.originalName}</h4>
                    <p className="text-xs text-slate-400">{previewFile.description || 'E-Document ama PDF File.'}</p>
                    <p className="text-xs text-slate-500 mt-1">Baaxadda: {formatBytes(previewFile.fileSize)}</p>
                  </div>
                  <a
                    href={previewFile.fileUrl}
                    download={previewFile.originalName}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg transition"
                  >
                    <Download className="w-4 h-4" /> Soo deji (Download Document)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
