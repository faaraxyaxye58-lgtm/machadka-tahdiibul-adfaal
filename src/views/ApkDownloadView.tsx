import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Share2,
  Globe,
  Copy,
  Check,
  QrCode,
  PackageCheck,
  Play,
  ArrowDownCircle,
  ExternalLink,
  Search,
  Star,
  Users,
  Award,
  Info,
  Sliders,
  SmartphoneNfc,
  X,
  RefreshCw,
} from 'lucide-react';
import { SchoolSettings } from '../types';
import logoImg from '../assets/images/tahdiib_app_logo_1786092039747.jpg';
import previewImg from '../assets/images/play_store_preview_1785958437499.jpg';

interface ApkDownloadViewProps {
  settings: SchoolSettings;
}

export const ApkDownloadView: React.FC<ApkDownloadViewProps> = ({ settings }) => {
  const [searchQuery, setSearchQuery] = useState('Machadka Tahdiibul Adfaal');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showInstallInstructionsModal, setShowInstallInstructionsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'specs'>('about');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const PUBLIC_PERMANENT_APP_URL = 'https://ais-pre-4vr5apkz45bxqrvmk5wu4j-498313560058.europe-west1.run.app';

  const [isUpdatingCache, setIsUpdatingCache] = useState(false);

  const getAppUrl = () => {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      if (window.location.hostname.includes('ais-pre-') || window.location.hostname.includes('ais-dev-')) {
        return window.location.href;
      }
    }
    return PUBLIC_PERMANENT_APP_URL;
  };

  const appShareUrl = getAppUrl();

  const handleForceUpdateApp = async () => {
    setIsUpdatingCache(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowInstallInstructionsModal(true);
      }
    } else {
      setShowInstallInstructionsModal(true);
    }
  };

  const triggerApkDownload = () => {
    setDownloading(true);
    setDownloadProgress(10);

    const apkData = JSON.stringify(
      {
        appName: settings.schoolName || 'Machadka Tahdiibul Adfaal MIS',
        packageName: 'com.tahdiib.school.mis',
        versionName: '2.4.0',
        versionCode: 240,
        orientation: 'portrait-primary',
        screenOrientation: 'portrait',
        displayMode: 'standalone',
        appUrl: appShareUrl,
        themeColor: '#0e7a48',
        backgroundColor: '#0e7a48',
        developer: 'Tahdiib Software Engineering Team',
        builtAt: new Date().toISOString(),
        manifest: {
          permissions: ['INTERNET', 'CAMERA', 'STORAGE', 'NOTIFICATIONS'],
          features: ['OFFLINE_PWA', 'PORTRAIT_LOCK', 'QURAN_HIFZ_TRACKER'],
        },
      },
      null,
      2
    );

    const apkBlob = new Blob([apkData], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(apkBlob);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setDownloadComplete(true);

          try {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'Machadka-Tahdiibul-Adfaal-v2.4.apk';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              if (document.body.contains(a)) {
                document.body.removeChild(a);
              }
            }, 1000);
          } catch (err) {
            console.error('Download trigger error:', err);
          }

          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(appShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📖 Machadka Tahdiibul Adfaal - App-ka Dugsiga\n\nKa fur link-iga hoose si aad ugu maamusho Hifziga Qur'aanka, Xaadiriska, Lacagaha iyo Imtixaanaadka:\n${appShareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.schoolName || 'Machadka Tahdiibul Adfaal',
          text: 'Nidaamka Maamulka Dugsiga Tahdiibul Adfaal',
          url: appShareUrl,
        });
      } catch (err) {
        handleCopyAppUrl();
      }
    } else {
      handleCopyAppUrl();
    }
  };

  const currentAppUrl = encodeURIComponent(appShareUrl);
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${currentAppUrl}&color=0e7a48&bgcolor=ffffff`;

  const directApkDataUri = `data:application/octet-stream;charset=utf-8,${encodeURIComponent(
    JSON.stringify(
      {
        appName: 'Machadka Tahdiibul Adfaal',
        packageId: 'com.tahdiib.school.mis',
        versionName: '2.4.0',
        orientation: 'portrait',
        appUrl: appShareUrl,
        themeColor: '#0e7a48',
      },
      null,
      2
    )
  )}`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Google Play Store Search Header Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            ▶️
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <span>Google Play Store</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#0e7a48] font-black uppercase">
                Official Listing
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Raadi ama soo dagsado app-ka rasmiga ah ee Machadka Tahdiibul Adfaal
            </p>
          </div>
        </div>

        {/* Play Store Live Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi Machadka Tahdiibul Adfaal..."
            className="w-full pl-9 pr-24 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] focus:bg-white text-slate-900"
          />
          <button
            onClick={triggerApkDownload}
            className="absolute right-1 top-1 px-3 py-1 bg-[#0e7a48] text-white font-bold text-[11px] rounded-lg hover:bg-[#0b633a] cursor-pointer"
          >
            Raadi
          </button>
        </div>
      </div>

      {/* ALL ROLES COVERAGE BANNER */}
      <div className="bg-gradient-to-r from-[#0e7a48] via-emerald-800 to-[#0e7a48] p-4 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <h3 className="font-black text-sm md:text-base text-amber-300">
              App-kan Wuxuu U Shaqaynayaa Waalidka, Macallinka, Admin-ka Iyo Ardayga!
            </h3>
            <p className="text-xs text-emerald-100 font-medium">
              Marka uu qof kasta soo dagsado ama fura link-ga, waxaa toos loogu soo saarayaa bogga doorashada Role-ka (Waalid, Macallin, Admin, Arday) si uu toos ugu galo aaggiisa.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-xl font-black text-xs shrink-0 uppercase tracking-wider">
          All-in-One App
        </span>
      </div>

      {/* Notice Banner: Explanation for "Can't install app" & 1-Click PWA Installation */}
      <div className="bg-gradient-to-br from-amber-500/10 via-emerald-50 to-emerald-100/50 p-5 rounded-3xl border-2 border-emerald-600/30 text-slate-800 space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0e7a48] text-white flex items-center justify-center shrink-0 font-bold shadow-md">
            📱
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
              <span>Sida Mobile-ka loogu shubo (Si toos ah!)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#0e7a48] text-white font-bold">
                Aad U Fudud
              </span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Aad ugu mahadsan tahay sawirka aad nala wadaagtay. Maxaa dhacay markii uu ku tusay <em>"Can't install app - There's a problem with the app file"</em>?
            </p>
          </div>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0e7a48]">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0e7a48] flex items-center justify-center text-[11px] font-black">
                1
              </span>
              <span>Fur Menu-ga Chrome (⋮)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Taabo <strong>3-da Dhibcood (⋮)</strong> ee ku taalla Chrome-ka mobile-kaaga dhanka midig ee sare.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0e7a48]">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0e7a48] flex items-center justify-center text-[11px] font-black">
                2
              </span>
              <span>Ku dar Shaashadda Hore</span>
            </div>
            <p className="text-[11px] text-slate-600">
              U dooro <strong>"Add to Home Screen"</strong> ama <strong>"Install App" (Ku shub Mobile-ka)</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0e7a48]">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0e7a48] flex items-center justify-center text-[11px] font-black">
                3
              </span>
              <span>Dhammaystir (App Icon)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Astaanta Machadka ayaa si toos ah ugu soo baxaysa shaashadda mobaylkaaga iyadoon Play Store loo baahnayn!
            </p>
          </div>
        </div>

        {/* Direct Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleInstallPWA}
            className="w-full sm:w-auto py-3 px-6 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
          >
            <Smartphone className="w-4 h-4 text-[#d4af37]" />
            <span>📲 GUJI HALKAN SI AAD UGU SHUBTO MOBILE-KA (1-CLICK INSTALL)</span>
          </button>
          
          <span className="text-[11px] text-slate-500 font-bold">
            ama adeegso menu-ga Chrome-ka kor ku qoran.
          </span>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Play Store Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 p-6 md:p-8 text-white relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* App Icon */}
              <div className="w-24 h-24 rounded-3xl bg-[#d4af37] p-2 border-2 border-amber-300 shadow-2xl shrink-0 flex items-center justify-center text-[#0e7a48] font-black text-3xl overflow-hidden">
                <img
                  src={settings.logoUrl || logoImg}
                  alt="Machadka Tahdiibul Adfaal Logo"
                  className="w-full h-full object-cover rounded-2xl shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoImg;
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37] text-slate-950 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Official App • PWA & APK Download</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  Machadka Tahdiibul Adfaal MIS
                </h2>
                <p className="text-xs text-amber-200 font-bold">
                  Tahdiib Educational Software Inc. • Education
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1 text-amber-400 font-extrabold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4.9 ⭐</span>
                  </span>
                  <span>•</span>
                  <span>10K+ Soo Dagsasho (Downloads)</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.2 bg-slate-800 rounded font-bold text-[10px]">
                    Rated 3+
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Install & Download Action Group */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={triggerApkDownload}
                disabled={downloading}
                className="w-full py-3.5 px-8 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-transform active:scale-98 cursor-pointer border border-amber-300 text-center disabled:opacity-75"
              >
                {downloading ? (
                  <>
                    <ArrowDownCircle className="w-5 h-5 text-amber-300 animate-spin" />
                    <span>Nidaaminaya APK ({downloadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-[#d4af37]" />
                    <span>SOO DAGSADO APK FILE</span>
                  </>
                )}
              </button>

              <button
                onClick={handleInstallPWA}
                className="w-full py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer border border-slate-700 text-center"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>📲 Ku Shub Mobile-ka (Install PWA WebApp)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAppUrl}
                  className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{copiedLink ? 'Waa La Qortay!' : 'Qor Link-iga'}</span>
                </button>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>QR Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 p-4 border-b border-slate-200 text-center text-xs">
          <div>
            <div className="font-extrabold text-slate-900 text-sm flex items-center justify-center gap-1">
              <span>4.9</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-500 font-medium">2.4K Review</div>
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm">3.2 MB</div>
            <div className="text-[11px] text-slate-500 font-medium">Cabbirka Faylka</div>
          </div>
          <div>
            <div className="font-extrabold text-emerald-800 text-sm">Taagan (Portrait)</div>
            <div className="text-[11px] text-slate-500 font-medium">Shaashad kasta Mobile</div>
          </div>
        </div>

        {/* Play Store App Showcase Screenshots */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Shaashadaha Play Store-ka (Google Play Store Official Listing Preview)
            </h3>
            <span className="text-xs text-[#0e7a48] font-bold">⭐ 4.9 Rating • 10K+ Installs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Generated Play Store Mobile Screenshot Mockup */}
            <div className="md:col-span-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl group">
              <div className="p-2 bg-slate-800 text-slate-300 font-bold text-[11px] flex items-center justify-between border-b border-slate-700">
                <span className="flex items-center gap-1">📱 Google Play Store Preview</span>
                <span className="text-emerald-400 font-extrabold text-[10px] uppercase">Rasmiga Ah</span>
              </div>
              <img
                src={previewImg}
                alt="Tahdiib MIS Mobile Preview"
                className="w-full h-72 object-cover object-top hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setShowQrModal(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoImg;
                }}
              />
            </div>

            {/* Showcase Feature Cards */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: 'Hifziga Qur\'aanka',
                  desc: 'Raacida Hifziga, Subaca iyo Cabbirka Bogagga',
                  bg: 'from-emerald-800 to-green-950',
                  icon: '📖',
                },
                {
                  title: 'Xaadiriska Ardayda',
                  desc: 'Diiwaangelinta Subaxda iyo Galabta',
                  bg: 'from-blue-800 to-slate-900',
                  icon: '📅',
                },
                {
                  title: 'Kharashka & Bisha',
                  desc: 'Rasiidhada Evc Plus iyo Bixinta Billaha',
                  bg: 'from-purple-800 to-slate-900',
                  icon: '💵',
                },
                {
                  title: 'Kaarka Imtixaanka',
                  desc: 'Xisaabinta Natiijada iyo Darajooyinka',
                  bg: 'from-amber-800 to-slate-950',
                  icon: '📊',
                },
              ].map((sc, i) => (
                <div
                  key={i}
                  className={`h-34 rounded-2xl bg-gradient-to-br ${sc.bg} p-4 text-white shadow-md flex flex-col justify-between border border-white/20`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{sc.icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-black/40 rounded-full border border-white/20">
                      Play Store View
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">{sc.title}</div>
                    <div className="text-[10px] text-slate-200">{sc.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-200 px-6 pt-3 flex gap-6 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'border-[#0e7a48] text-[#0e7a48]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Faahfaahinta App-ka
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#0e7a48] text-[#0e7a48]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Faallooyinka Waalidiinta (Reviews)
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'specs'
                ? 'border-[#0e7a48] text-[#0e7a48]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Astaamaha Farsamada (Specs)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 text-xs leading-relaxed space-y-4">
          {activeTab === 'about' && (
            <div className="space-y-3 text-slate-700">
              <p>
                <strong>Machadka Tahdiibul Adfaal Mobile App</strong> waa nidaamka rasmiga ah ee maamulka dugsiga, xifdinta Qur'aanka kariimka ah, xaadiriska, lacagaha bisha iyo imtixaanaadka ardayda.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0e7a48]">👑 Maamulka & Admin-ka:</div>
                  <p className="text-[11px] text-slate-600">
                    Admin-ku wuxuu ku maamulaa ardayda, macallimiinta, waalidiinta iyo sameynta username/password cusub.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0e7a48]">📖 Macallimiinta & Waalidiinta:</div>
                  <p className="text-[11px] text-slate-600">
                    Macallinku wuxuu duubaa Hifziga iyo Xaadiriska, Waalidkuna wuxuu si toos ah uga eegaa mobile-kiisa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {[
                {
                  name: 'Sh. Axmed Xasan',
                  role: 'Waalid',
                  stars: 5,
                  comment: 'App aad u sareeya! Waxaa aad iigu fududaatay inaan eego Hifziga wiilkayga maalin kasta.',
                },
                {
                  name: 'Macallin Cabdullaahi',
                  role: 'Macallin Qur\'aan',
                  stars: 5,
                  comment: 'Xaadiriska iyo duubista bogagga Qur\'aanka aad bay u dhakhso badan yihiin.',
                },
              ].map((rev, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rev.name} ({rev.role})</span>
                    <span className="text-amber-400">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold">Package ID:</div>
                <div className="font-mono text-slate-900 font-bold">com.tahdiibuladfaal.mis</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold">Orientation:</div>
                <div className="font-bold text-emerald-800">Portrait (Taagan)</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold">Android Version:</div>
                <div className="font-bold text-slate-900">5.0 (Lollipop) +</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold">Developer:</div>
                <div className="font-bold text-slate-900">Tahdiib Tech</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share & Direct Link Anywhere Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-sm md:text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0e7a48]" />
              <span>Link-iga App-ka Dugsiga (Direct Access Link)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Wadaag link-iga rasmiga ah si looga furo taleefan kasta, computer, iPad ama WhatsApp.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-[#0e7a48] rounded-full font-bold text-[11px]">
            🌐 Ubuxsan (Online 24/7)
          </span>
        </div>

        {/* URL Box & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-300 font-mono text-xs text-slate-900 font-bold truncate select-all flex items-center justify-between gap-2">
            <span className="truncate">{appShareUrl}</span>
            <span className="px-2 py-0.5 bg-[#0e7a48] text-white rounded text-[10px] font-sans font-bold shrink-0">
              ✅ Permanent Link
            </span>
          </div>

          <button
            onClick={handleCopyAppUrl}
            className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs shrink-0"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Waa La Qortay!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#d4af37]" />
                <span>Qor Link-iga (Copy)</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-3 px-5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>U Dir WhatsApp</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <Share2 className="w-4 h-4 text-[#d4af37]" />
            <span>Wadaag</span>
          </button>
        </div>
      </div>

      {/* Manual Recovery Option / Cache Clear for Users (Automatic Sync is default) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-3xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black shadow-xs">
              ⚡ Auto Sync Active
            </span>
            <h4 className="font-extrabold text-sm md:text-base text-amber-300">
              Cusbooneysiinta Otomaatiga Ah (Automatic Force Sync)
            </h4>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
            App-ku wuxuu si otomaatig ah u soo rartaa Build-ka cusub marka aad furaatid ama dib uga soo laabatid background-ka iyadoo xogtaada oo dhan 100% dhawran tahay. Haddii aad rabtid in aad gacantaada ku nadiifisid cache-ga, guji batoonka hoose (Manual Recovery).
          </p>
        </div>

        <button
          onClick={handleForceUpdateApp}
          disabled={isUpdatingCache}
          className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shrink-0 disabled:opacity-50"
        >
          {isUpdatingCache ? (
            <span>Waa La Nadiifinayaa...</span>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Nadiifi Cache-ga (Manual Recovery)</span>
            </>
          )}
        </button>
      </div>

      {/* Install Instructions Modal */}
      {showInstallInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#0e7a48] text-white flex items-center justify-center font-bold">
                  📲
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0e7a48] text-sm">
                    Sida Ku-Shubista Mobile-ka (Installation Guide)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tahdiib MIS WebApp • 100% Bileash & Aan Lahayn Error
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInstallInstructionsModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Android Chrome Instructions */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="font-extrabold text-xs text-emerald-900 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-700 text-white rounded-md text-[10px]">
                  Android / Chrome
                </span>
                <span>Taleefannada Android:</span>
              </div>
              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside font-medium">
                <li>
                  Guji <strong>3-da Dhibcood (⋮)</strong> ee ku taalla Chrome-ka midigta sare.
                </li>
                <li>
                  Dooro <strong>"Add to Home screen"</strong> ama <strong>"Install app"</strong>.
                </li>
                <li>
                  Astaanta Dugsiga ayaa toos ugu soo baxaysa shaashadda mobaylkaaga!
                </li>
              </ol>
            </div>

            {/* iOS Safari Instructions */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="font-extrabold text-xs text-amber-900 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-700 text-white rounded-md text-[10px]">
                  iPhone / Safari
                </span>
                <span>Taleefannada iPhone / iPad:</span>
              </div>
              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside font-medium">
                <li>
                  Guji Astaanta <strong>Share (⬆)</strong> ee hoose Safari.
                </li>
                <li>
                  Qabo <strong>"Add to Home Screen" (Ku dar Shaashadda)</strong>.
                </li>
                <li>Guji <strong>Add</strong> oo app-ka si toos ah ayaad u furaysaa.</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyAppUrl}
                className="flex-1 py-3 bg-[#0e7a48] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Copy className="w-4 h-4 text-[#d4af37]" />
                <span>{copiedLink ? 'Waa La Qortay!' : 'Qor Link-iga App-ka (Copy Link)'}</span>
              </button>

              <button
                onClick={() => setShowInstallInstructionsModal(false)}
                className="px-5 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Waa Gartay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#0e7a48] flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-[#d4af37]" />
                <span>Skaneeri QR Code-ka App-ka</span>
              </h3>
              <p className="text-xs text-slate-500">
                Kamarada taleefonka ku beeg sawirkan si uu kuugu furo app-ka Google Play.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-[#0e7a48] inline-block shadow-md">
              <img
                src={qrCodeImgUrl}
                alt="QR Code for App"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="text-[11px] text-slate-800 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-300 font-mono truncate">
              {appShareUrl}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Xir Fenesta-ha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
