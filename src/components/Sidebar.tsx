import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HeartHandshake,
  BookOpenCheck,
  BookMarked,
  BookOpen,
  CheckSquare,
  DollarSign,
  ClipboardList,
  BarChart3,
  Settings,
  Smartphone,
  MessageSquare,
  Send,
  ChevronRight,
  X,
  LogOut,
  AlertTriangle,
  Award,
  ShieldCheck,
  UserCheck,
  Package,
  Building2,
  Library,
  Stethoscope,
  Radio,
  Bell,
  HardDrive,
} from 'lucide-react';

import { User, SchoolSettings } from '../types';
import logoImg from '../assets/images/tahdiib_app_logo_1786092039747.jpg';
import { getLastBackupInfo } from '../lib/firebase';
import { canUserAccessPayments } from '../lib/permissionUtils';
import { Storage } from '../lib/storage';

export type NavTab =
  | 'dashboard'
  | 'remote_learning'
  | 'students'
  | 'teachers'
  | 'parents'
  | 'parents_chat'
  | 'sms_management'
  | 'classes'
  | 'classmode'
  | 'devices'
  | 'hifz'
  | 'quran'
  | 'muallim'
  | 'curriculum'
  | 'attendance'
  | 'messaging'
  | 'payments'
  | 'customers'
  | 'products'
  | 'companies'
  | 'books_amaano'
  | 'patients'
  | 'exams'
  | 'reports'
  | 'settings'
  | 'app_updates'
  | 'scheduled_alerts'
  | 'cloud_storage'
  | 'lesson_recording'
  | 'apk';

interface SidebarProps {
  currentUser?: User | null;
  settings?: SchoolSettings;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  counts: {
    students: number;
    teachers: number;
    classes: number;
    unpaidFees: number;
  };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSwitchRole?: () => void;
  onLogout?: () => void;
  onOpenLicenseModal?: () => void;
  onOpenApiKeyModal?: () => void;
  onOpenAdminVoiceModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  settings,
  activeTab,
  setActiveTab,
  counts,
  isMobileOpen = false,
  onCloseMobile,
  onSwitchRole,
  onLogout,
  onOpenLicenseModal,
  onOpenApiKeyModal,
  onOpenAdminVoiceModal,
}) => {
  const role = currentUser?.role || 'admin';
  const backupInfo = getLastBackupInfo(settings);
  const isSyncOverdue = backupInfo.isOverdue;

  const pendingRemoteRegCount = React.useMemo(() => {
    try {
      return Storage.getRemoteRegistrations().filter((r) => r.status === 'Pending').length;
    } catch {
      return 0;
    }
  }, [activeTab]);

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: role === 'parent' ? 'Aagga Waalidka' : role === 'student' ? 'Aagga Ardayga' : role === 'teacher' ? 'Aagga Macallinka' : role === 'finance' ? 'Aagga Maaliyadda' : 'Dashboard',
      sublabel: 'Boga Hore',
      icon: LayoutDashboard,
    },
    {
      id: 'remote_learning' as NavTab,
      label: 'Waxbarashada Fog',
      sublabel: 'Online Learning Module',
      icon: BookOpen,
      highlight: true,
      badgeAlert: role === 'admin' && pendingRemoteRegCount > 0 ? pendingRemoteRegCount : undefined,
    },
    {
      id: 'students' as NavTab,
      label: 'Ardayda',
      sublabel: 'Ardayda & Diiwaanka',
      icon: GraduationCap,
      badge: counts.students,
    },
    {
      id: 'teachers' as NavTab,
      label: 'Macallimiinta',
      sublabel: 'Macallimiinta Machadka',
      icon: Users,
      badge: counts.teachers,
    },
    {
      id: 'parents' as NavTab,
      label: 'Waalidiinta',
      sublabel: 'Waalidiinta & Xiriirka',
      icon: HeartHandshake,
    },
    {
      id: 'classes' as NavTab,
      label: 'Fasallada',
      sublabel: 'Fasallada & Waqtiyada',
      icon: BookOpenCheck,
      badge: counts.classes,
    },
    {
      id: 'classmode' as NavTab,
      label: '🔥 Class Mode',
      sublabel: 'Fasalka Socda (Live)',
      icon: Smartphone,
      highlight: true,
    },
    {
      id: 'devices' as NavTab,
      label: '📱 Device Control',
      sublabel: 'Kiosk & Lock Control',
      icon: ShieldCheck,
      highlight: true,
    },
    {
      id: 'hifz' as NavTab,
      label: "Xifdinta Qur'aanka",
      sublabel: 'Hifzi, Subax & Sabqi',
      icon: BookMarked,
      highlight: true,
    },
    {
      id: 'quran' as NavTab,
      label: "Mus'haf-ka Kareemka",
      sublabel: '114 Suraadood & Audio',
      icon: BookOpen,
      highlight: true,
    },
    {
      id: 'muallim' as NavTab,
      label: '📚 معلم القراءة',
      sublabel: "Qaaciydada & Akhriska",
      icon: GraduationCap,
      highlight: true,
    },
    {
      id: 'curriculum' as NavTab,
      label: '📖 Manhajka & Cutubyada',
      sublabel: 'Curriculum & Lesson Planning',
      icon: BookMarked,
      highlight: true,
    },
    {
      id: 'cloud_storage' as NavTab,
      label: '☁️ Kaydka Cloud-ka',
      sublabel: '10 GB B2 Free Storage',
      icon: HardDrive,
      highlight: true,
    },
    {
      id: 'lesson_recording' as NavTab,
      label: '🎙️ Duubista Casharka',
      sublabel: 'Gemini Transcribe & Audio',
      icon: Radio,
      highlight: true,
    },
    {
      id: 'attendance' as NavTab,
      label: 'Xaadiriska',
      sublabel: 'Xaadiriska Maanta',
      icon: CheckSquare,
    },
    {
      id: 'sms_management' as NavTab,
      label: '📩 SMS Hormuud',
      sublabel: 'SMS Realtime & Balance',
      icon: Send,
      highlight: true,
    },
    {
      id: 'messaging' as NavTab,
      label: '💬 WhatsApp Gateway',
      sublabel: 'Ogeysiisyada WhatsApp',
      icon: MessageSquare,
    },
    {
      id: 'parents_chat' as NavTab,
      label: '📱 Parents Chat Hub',
      sublabel: 'Sheekada Waalidiinta (Realtime)',
      icon: Smartphone,
      highlight: true,
    },
    {
      id: 'payments' as NavTab,
      label: 'Lacagaha',
      sublabel: 'Bixinta & Rasiidhada',
      icon: DollarSign,
      badgeAlert: counts.unpaidFees > 0 ? counts.unpaidFees : undefined,
    },
    {
      id: 'customers' as NavTab,
      label: 'Customers',
      sublabel: 'Dhexe, Raage & Cash',
      icon: UserCheck,
    },
    {
      id: 'products' as NavTab,
      label: 'Badeecada',
      sublabel: 'Stock & Inventory',
      icon: Package,
    },
    {
      id: 'companies' as NavTab,
      label: 'Shirkado',
      sublabel: 'Suppliers & Vendors',
      icon: Building2,
    },
    {
      id: 'books_amaano' as NavTab,
      label: 'Books & Amaano',
      sublabel: 'Maktabada & Amaanada',
      icon: Library,
    },
    {
      id: 'patients' as NavTab,
      label: 'Patients',
      sublabel: 'Caafimaadka & Dhiigga',
      icon: Stethoscope,
    },
    {
      id: 'exams' as NavTab,
      label: 'Imtixaannada',
      sublabel: 'Natiijooyinka & Kaarka',
      icon: ClipboardList,
    },
    {
      id: 'reports' as NavTab,
      label: 'Warbixinno',
      sublabel: 'Xogta & Tuleellada',
      icon: BarChart3,
    },
    {
      id: 'settings' as NavTab,
      label: 'Dejimaha',
      sublabel: 'Maamulka & System-ka',
      icon: Settings,
    },
    {
      id: 'app_updates' as NavTab,
      label: '🚀 App Updates',
      sublabel: 'Build & Force Update',
      icon: Send,
      highlight: true,
    },
    {
      id: 'scheduled_alerts' as NavTab,
      label: '⏰ 3-Time Alerts',
      sublabel: 'Subax, Duhur & Fiid',
      icon: Bell,
      highlight: true,
    },
    {
      id: 'apk' as NavTab,
      label: '📲 Play Store & APK',
      sublabel: 'Google Play & App Download',
      icon: Smartphone,
      highlight: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    // Check if payments tab is blocked individually or globally for this user
    if (item.id === 'payments' && !canUserAccessPayments(currentUser, settings)) {
      return false;
    }

    // Check if Admin configured this tab as hidden for this role
    const hiddenTabs = settings?.privacyPermissions?.hiddenTabsByRole?.[role as 'teacher' | 'parent' | 'student' | 'finance'] || [];
    if (role !== 'admin' && hiddenTabs.includes(item.id)) {
      return false;
    }

    // Check if Admin Dashboard is configured to be hidden for non-admins
    if (role !== 'admin' && item.id === 'dashboard' && settings?.privacyPermissions?.hideAdminDashboardFromUsers) {
      return false;
    }

    if (role === 'admin' || role === 'finance') {
      return true;
    }
    if (role === 'teacher') {
      return ['dashboard', 'students', 'attendance', 'hifz', 'quran', 'muallim', 'exams', 'apk'].includes(item.id);
    }
    if (role === 'parent') {
      return ['dashboard', 'students', 'hifz', 'quran', 'muallim', 'attendance', 'exams', 'apk'].includes(item.id);
    }
    if (role === 'student') {
      return ['dashboard', 'quran', 'hifz', 'attendance', 'exams', 'apk'].includes(item.id);
    }
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0e7a48] text-white select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-green-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Tahdiibul Adfaal Logo"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#d4af37] bg-white p-0.5 shadow-md shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = logoImg;
            }}
          />
          <div>
            <span className="text-white font-black text-base leading-tight uppercase tracking-wider block">
              Tahdiibul
            </span>
            <span className="text-amber-300 font-black text-xs uppercase tracking-widest block drop-shadow-xs">
              ADFAAL MIS
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Indicator Banner & Role Switcher (Admin Only) */}
      <div className="mx-3 mt-3 p-2.5 bg-green-950/60 border border-amber-400/30 rounded-xl flex items-center justify-between gap-2 shadow-xs">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-wider text-green-200/90 font-extrabold">
            AAGGA HADDA AAD JOOGTID:
          </div>
          <div className="text-xs font-black text-[#d4af37] truncate">
            {role === 'parent'
              ? '👨‍👩‍👧‍👦 WAALID'
              : role === 'student'
              ? '🎓 ARDAY'
              : role === 'teacher'
              ? '👨‍🏫 MACALLIN'
              : '🛡️ MAAMULE (ADMIN)'}
          </div>
        </div>
        {role === 'admin' && onSwitchRole && (
          <button
            onClick={() => {
              if (onSwitchRole) onSwitchRole();
              if (onCloseMobile) onCloseMobile();
            }}
            className="py-1 px-2.5 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1 uppercase tracking-wider"
            title="BEDDEL ROLE (Admin Only)"
          >
            <span>BEDDEL ROLE</span>
          </button>
        )}
      </div>

      {/* Nav Section */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 min-h-[48px] rounded-xl text-xs font-semibold transition-all group cursor-pointer active:scale-[0.98] ${
                isActive
                  ? 'bg-white/15 text-[#d4af37] font-bold shadow-xs border-l-4 border-[#d4af37]'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-md shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#d4af37] text-green-950 font-bold'
                      : item.highlight
                      ? 'bg-amber-400/20 text-[#d4af37]'
                      : 'text-white/70 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className={`leading-snug truncate ${isActive ? 'text-[#d4af37] font-bold' : ''}`}>
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-green-200' : 'text-green-200/60 group-hover:text-green-100'
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {item.id === 'settings' && isSyncOverdue && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse flex items-center gap-1 border border-rose-300 shadow-xs shrink-0"
                    title="Digniin: Waxaa ka soo wareegtay 24 saacadood markii u dambeysay ee xogta la keydiyo (Firestore Sync Required)"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
                    <span>24h+ Sync</span>
                  </span>
                )}
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#d4af37] text-green-950'
                        : 'bg-white/15 text-white group-hover:bg-white/25'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.badgeAlert !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37] text-green-950 animate-pulse">
                    {item.badgeAlert}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-[#d4af37] translate-x-0.5' : 'text-green-300/40 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            </button>
          );
        })}

        {/* Prominent Logout Button in Sidebar */}
        {onLogout && (
          <div className="pt-3 mt-2 border-t border-green-700/50 space-y-2">
            {onOpenLicenseModal && (
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenLicenseModal();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-200 hover:to-amber-300 border border-amber-200 transition-all cursor-pointer active:scale-[0.98] shadow-md"
                title="Shahaadada Aqoonsiga Nidaamka (System Identification Certificate)"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0e7a48]" />
                  <span>Aqoonsiga Nidaamka</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-[#0e7a48] text-white px-1.5 py-0.5 rounded font-black">
                  Verified
                </span>
              </button>
            )}

            {onOpenApiKeyModal && (
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenApiKeyModal();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-slate-950 hover:bg-black border border-slate-700 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                title="Maamulka API-yada (API Keys & Integration)"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Maamulka API-yada</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                  REST API
                </span>
              </button>
            )}

            {/* Dedicated Admin Somali AI Voice Broadcast Action */}
            {role === 'admin' && onOpenAdminVoiceModal && (
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenAdminVoiceModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 border border-emerald-400/80 text-emerald-200 hover:text-white transition-all cursor-pointer shadow-md my-2"
                title="Dir Fariin Cod ah oo AI Soomaali ah (Admin Voice Broadcast)"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500 text-slate-950">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-black text-xs">🎙️ Voice Broadcast</div>
                    <div className="text-[10px] text-emerald-300 font-bold">Admin Voice Alert</div>
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">
                  Admin
                </span>
              </button>
            )}

            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-500 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
              title="Ka bax akoonka"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-rose-500 text-white">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-extrabold">Ka Bax Akoonka</span>
              </div>
              <span className="text-[10px] tracking-wider bg-rose-700 text-white px-2 py-0.5 rounded font-black">
                Logout
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer info */}
      <div className="p-2.5 border-t border-green-700/50 bg-green-950/40 text-[11px] text-green-200/80 flex items-center justify-between shrink-0">
        <span className="font-bold">Tahdiibul Adfaal • v2.0</span>
        <span className="text-emerald-400 font-extrabold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Online</span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 min-h-[calc(100vh-57px)] shadow-xl border-r border-green-800 bg-[#0e7a48]">
        {sidebarContent}
      </aside>

      {/* Mobile Horizontal Quick Navigation Bar (Vertical phone screen top scroll) */}
      <div className="md:hidden bg-[#0e7a48] border-b border-green-800 p-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 sticky top-[57px] z-20 shadow-xs">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white text-green-950 shadow-xs'
                  : 'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0e7a48]' : 'text-[#d4af37]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0 ml-auto border border-rose-400 active:scale-95"
            title="Ka bax loginka"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span>Ka Bax</span>
          </button>
        )}
      </div>

      {/* Mobile Vertical Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide Drawer */}
          <div className="relative w-72 max-w-[80vw] bg-[#0e7a48] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
