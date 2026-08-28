import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Smartphone,
  Download,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  Users,
  Clock,
  History,
  Send,
  Save,
  Check,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  INSTALLED_APP_BUILD,
  PublishedAppVersionConfig,
  publishAppVersionConfig,
  fetchUserVersionReports,
  UserVersionReportEntry,
  evaluateUpdateStatus,
} from '../lib/appVersionEngine';
import { backupAllDataToFirestore, getLastBackupInfo } from '../lib/firebase';
import { SchoolSettings, User } from '../types';

interface AppUpdateManagementViewProps {
  currentUser?: User | null;
  settings: SchoolSettings;
  versionConfig: PublishedAppVersionConfig;
  onRefreshVersionConfig?: () => void;
  allDataToBackup?: {
    settings: SchoolSettings;
    users?: any[];
    students?: any[];
    teachers?: any[];
    parents?: any[];
    classes?: any[];
    hifzRecords?: any[];
    attendance?: any[];
    payments?: any[];
    exams?: any[];
  };
}

export const AppUpdateManagementView: React.FC<AppUpdateManagementViewProps> = ({
  currentUser,
  settings,
  versionConfig,
  onRefreshVersionConfig,
  allDataToBackup,
}) => {
  // Form state
  const [latestVersionName, setLatestVersionName] = useState(versionConfig.latestVersionName || '2.9.0');
  const [latestVersionCode, setLatestVersionCode] = useState<number>(versionConfig.latestVersionCode || 29);
  const [minSupportedVersionCode, setMinSupportedVersionCode] = useState<number>(versionConfig.minSupportedVersionCode || 28);
  const [forceUpdateEnabled, setForceUpdateEnabled] = useState<boolean>(versionConfig.forceUpdateEnabled || false);
  const [releaseDate, setReleaseDate] = useState<string>(versionConfig.releaseDate || '23 Ogosto 2026');
  const [downloadUrl, setDownloadUrl] = useState<string>(versionConfig.downloadUrl || 'https://play.google.com/store/apps/details?id=com.tahdiib.mis');
  const [releaseNotes, setReleaseNotes] = useState<string[]>(versionConfig.releaseNotes || []);
  const [newNoteInput, setNewNoteInput] = useState('');

  // Status & Feedback states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);

  // User version reports
  const [userReports, setUserReports] = useState<UserVersionReportEntry[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  useEffect(() => {
    setLatestVersionName(versionConfig.latestVersionName);
    setLatestVersionCode(versionConfig.latestVersionCode);
    setMinSupportedVersionCode(versionConfig.minSupportedVersionCode);
    setForceUpdateEnabled(versionConfig.forceUpdateEnabled);
    setReleaseDate(versionConfig.releaseDate || '23 Ogosto 2026');
    setDownloadUrl(versionConfig.downloadUrl || 'https://play.google.com/store/apps/details?id=com.tahdiib.mis');
    setReleaseNotes(versionConfig.releaseNotes || []);
  }, [versionConfig]);

  const loadReports = async () => {
    setIsLoadingReports(true);
    const reports = await fetchUserVersionReports();
    setUserReports(reports);
    setIsLoadingReports(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    setReleaseNotes([...releaseNotes, newNoteInput.trim()]);
    setNewNoteInput('');
  };

  const handleRemoveNote = (index: number) => {
    setReleaseNotes(releaseNotes.filter((_, i) => i !== index));
  };

  const handlePublishVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestVersionName.trim() || !latestVersionCode) {
      alert('Fadlan geli Version Name iyo Version Code sax ah!');
      return;
    }

    if (latestVersionCode < minSupportedVersionCode) {
      alert('Version Code-ka ugu dambeeya ma ka yaraan karo Minimum Supported Version Code!');
      return;
    }

    setIsPublishing(true);
    setPublishSuccessMessage(null);

    try {
      const newConfig: PublishedAppVersionConfig = {
        ...versionConfig,
        latestVersionName: latestVersionName.trim(),
        latestVersionCode: Number(latestVersionCode),
        minSupportedVersionCode: Number(minSupportedVersionCode),
        forceUpdateEnabled,
        releaseDate,
        downloadUrl,
        releaseNotes,
      };

      await publishAppVersionConfig(
        newConfig,
        currentUser?.fullName || currentUser?.username || 'Admin Maamulka'
      );

      setPublishSuccessMessage(`Sida saxda ah ayaa loo publish-gareeyay Version ${latestVersionName} (Build ${latestVersionCode})! Dhamaan isticmaalayaasha waxay heli doonaan ogeysiiska tooska ah.`);
      if (onRefreshVersionConfig) onRefreshVersionConfig();
      await loadReports();
    } catch (err) {
      alert('Dhib ayaa ka dhacday publish-garaynta: ' + String(err));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateAutoBackup = async () => {
    if (!allDataToBackup) {
      alert('Xogtii lagu samayn lahaa backup lama helin.');
      return;
    }
    setIsBackingUp(true);
    setBackupStatusMessage(null);
    try {
      const res = await backupAllDataToFirestore(allDataToBackup);
      setBackupStatusMessage(`Sida saxda ah ayaa loo kaydiyay 100% xogta dugsiga Firestore Cloud! (${new Date(res.timestamp).toLocaleTimeString('so-SO')})`);
    } catch (err) {
      setBackupStatusMessage('Dhib ayaa ka dhacday kaydinta xogta: ' + String(err));
    } finally {
      setIsBackingUp(false);
    }
  };

  const backupInfo = getLastBackupInfo(settings);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* View Title & Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0e7a48] to-emerald-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Smartphone className="w-48 h-48 text-amber-300" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-widest flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-slate-950" />
            <span>Nidaamka Cusbooneysiinta Tooska Ah (Build Engine)</span>
          </span>
          <span className="text-xs text-emerald-200 font-semibold">
            Local Build: v{INSTALLED_APP_BUILD.versionName} (Code {INSTALLED_APP_BUILD.versionCode})
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <span>Maamulka Version-yada & Force Update</span>
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed mt-2 font-medium">
          Habayso version-ka rasmiga ah ee ku qaybsan Google Play ama Web-ka. Marka aad samayso Build cusub oo ku sii daayso habkan, dhamaan isticmaalayaashii hore waxay toos u heli doonaan cusbooneysiinta iyadoo xogtoodu 100% dhawran tahay.
        </p>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Local Installed Build */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Local Build Hadda</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-slate-900">v{INSTALLED_APP_BUILD.versionName}</span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">
              Code {INSTALLED_APP_BUILD.versionCode}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block pt-1">
            Build Date: {INSTALLED_APP_BUILD.buildDate}
          </span>
        </div>

        {/* Card 2: Production Version in Firestore */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Published Remote Version</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-emerald-950">v{versionConfig.latestVersionName}</span>
            <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-black rounded-lg">
              Code {versionConfig.latestVersionCode}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block pt-1">
            Released: {versionConfig.releaseDate || 'Ogosto 2026'}
          </span>
        </div>

        {/* Card 3: Minimum Supported Build */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Min Supported Build</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-amber-950">Code {versionConfig.minSupportedVersionCode}</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">
              Threshold
            </span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium block pt-1">
            Wadada hoose ee la oggol yahay
          </span>
        </div>

        {/* Card 4: Force Update Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Force Update Mode</span>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-black ${versionConfig.forceUpdateEnabled ? 'text-rose-600' : 'text-slate-600'}`}>
              {versionConfig.forceUpdateEnabled ? '🔴 FORCE UPDATE ON' : '🟢 SOFT UPDATE ONLY'}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${versionConfig.forceUpdateEnabled ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              {versionConfig.forceUpdateEnabled ? 'Qasab' : 'Ikhtiyaar'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block pt-1">
            {versionConfig.forceUpdateEnabled ? 'Users duuga ah waan xireynaa' : 'Waalidiinta waa la ogeysiinayaa'}
          </span>
        </div>

      </div>

      {/* Main Grid: Publish Form & Data Protection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Publish Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#0e7a48]" />
                <span>Sii-daaynta Version Cusub (Publish New Release)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Marka aad nooc cusub ka soo saarto AI Studio, ku qit Version Code-ka cusub halkan si dadku u helaan.
              </p>
            </div>
          </div>

          {publishSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>{publishSuccessMessage}</div>
            </div>
          )}

          <form onSubmit={handlePublishVersion} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Version Name (Tusaale: 2.10.0 or 3.0.0)
                </label>
                <input
                  type="text"
                  value={latestVersionName}
                  onChange={(e) => setLatestVersionName(e.target.value)}
                  placeholder="e.g. 2.10.0"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0e7a48] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Version Code (Number oo kordhaya: 1 → 2 → 3 → 4)
                </label>
                <input
                  type="number"
                  value={latestVersionCode}
                  onChange={(e) => setLatestVersionCode(Number(e.target.value))}
                  placeholder="e.g. 30"
                  min={1}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0e7a48] outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  Code-ku waa inuu ka weyn yahay kii hore ({versionConfig.latestVersionCode}).
                </span>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Minimum Supported Version Code
                </label>
                <input
                  type="number"
                  value={minSupportedVersionCode}
                  onChange={(e) => setMinSupportedVersionCode(Number(e.target.value))}
                  placeholder="e.g. 28"
                  min={1}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0e7a48] outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Xadka ugu hooseeya. Sida Build 27 wax ka yar waxay helayaan Force Update.
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Taariikhda Sii-daaynta (Release Date)
                </label>
                <input
                  type="text"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  placeholder="e.g. 23 Ogosto 2026"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0e7a48] outline-none"
                />
              </div>

            </div>

            {/* Force Update Toggle */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Ku Qasab Cusbooneysiinta (Force Update Global Toggle)</span>
                </span>
                <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                  Haddii aad shoto Force Update, dhammaan isticmaalayaasha haysta Version ka yar Build {latestVersionCode} lagama oggolaan doono inay app-ka galaan ilaa ay cusbooneysiiyaan.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={forceUpdateEnabled}
                  onChange={(e) => setForceUpdateEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Google Play / Download Link */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Google Play Store / App Download URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.tahdiib.mis"
                  className="w-full pl-9 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0e7a48] outline-none"
                />
              </div>
            </div>

            {/* Release Notes Bullet List */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700">
                Waxyaabaha Cusub ee Lagu Soo Kordhiyay (Release Notes / Changelog)
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="Geli feature cusub ama bug fix ah..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ku Dar</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {releaseNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{note}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNote(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isPublishing}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0e7a48] hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing Version to Cloud...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>PUBLISH NEW VERSION TO FIRESTORE</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Right Column (1 Col): Data Protection & Backup Controls */}
        <div className="space-y-6">
          
          {/* Data Safety Card */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-900 border-b border-amber-100 pb-3">
              <ShieldCheck className="w-6 h-6 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-sm font-black uppercase">Data Protection Guarantee</h3>
                <span className="text-[10px] text-amber-800 font-extrabold block">New Build ≠ New Database</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Sanad kasta ama mar kasta oo AI Studio lagu sameeyo build cusub, xogta dugsiga 100% waa la ilaaliyaa. Nidaamku mar walba wuxuu ku xiraa Cloud Firestore-ka oo dib looma tirayo.
            </p>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-1.5 text-xs text-amber-950 font-bold">
              <div className="flex items-center justify-between">
                <span>Auto Backup Status:</span>
                <span className="text-emerald-700">Active</span>
              </div>
              <div className="text-[11px] text-amber-900 font-normal">
                Kaydkii ugu dambeeyay: <span className="font-extrabold">{backupInfo.formattedLastBackup}</span>
              </div>
            </div>

            {backupStatusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl text-xs font-extrabold">
                {backupStatusMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateAutoBackup}
              disabled={isBackingUp}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Samaynaya Kayd Snap...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>CREATE AUTOMATIC DATABASE BACKUP</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Instructions Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-3">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Sida Loo maareeyo Build Update-ka:</span>
            </h4>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4 font-medium leading-relaxed">
              <li>Marka aad AI Studio ku sameeyo build cusub (tusaale Build 30), u samee Version Code ka weyn kii hore.</li>
              <li>Halkan geli Version Code 30, oo riix <span className="text-amber-300 font-extrabold">Publish New Version</span>.</li>
              <li>Isticmaalayaashii hore si toos ah ayay u heli doonaan farriinta cusbooneysiinta marka ay app-ka furaan.</li>
              <li>Sidoo kale, ma jirto xog lumaysa haba yaraatee.</li>
            </ol>
          </div>

        </div>

      </div>

      {/* Version Analytics & User Reports Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0e7a48]" />
              <span>Warbixinta Version-yada ee Taleefannada Isticmaalayaasha (Version Analytics Report)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Halkan ka eeg kuwa haysta Version-ka cusub iyo kuwa weli ku jira Version-yadii hore.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={isLoadingReports}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? 'animate-spin' : ''}`} />
            <span>Cusbooneysii Warbixinta</span>
          </button>
        </div>

        {userReports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Smartphone className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">Weli ma jiraan isticmaalayaal laga qortay version pings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider font-black text-slate-500">
                  <th className="p-3">Isticmaalaha</th>
                  <th className="p-3">Doorka (Role)</th>
                  <th className="p-3">Installed Build</th>
                  <th className="p-3">Aaladda (Device)</th>
                  <th className="p-3">Xaaladda Update-ka</th>
                  <th className="p-3">Dhaqdhaqaaqii Ugu Dambeeyay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {userReports.map((item) => {
                  const status = evaluateUpdateStatus(item.versionCode, versionConfig);
                  return (
                    <tr key={item.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {item.fullName} <span className="text-[10px] text-slate-400 font-normal">(@{item.username})</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 uppercase">
                          {item.role}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-800">
                        v{item.versionName} <span className="text-[10px] text-slate-500">(Code {item.versionCode})</span>
                      </td>
                      <td className="p-3 text-slate-600 font-semibold">
                        {item.deviceType || 'Mobile'}
                      </td>
                      <td className="p-3">
                        {status === 'UP_TO_DATE' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Ugu Dambeeyay (Latest)</span>
                          </span>
                        )}
                        {status === 'SOFT_UPDATE_AVAILABLE' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                            <Download className="w-3 h-3 text-amber-600" />
                            <span>Soft Update Available</span>
                          </span>
                        )}
                        {status === 'FORCE_UPDATE_REQUIRED' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Blocked (Force Update)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(item.lastPing).toLocaleString('so-SO')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
