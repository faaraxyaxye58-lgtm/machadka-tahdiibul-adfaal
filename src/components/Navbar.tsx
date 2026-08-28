import React, { useState } from 'react';
import { User, SchoolSettings, Student, PushNotificationItem } from '../types';
import { Search, Bell, LogOut, Smartphone, KeyRound, Share2, Menu, X, Wifi, UserCheck, Eye, EyeOff, Lock, Zap, ShieldAlert, Unlock, AlertTriangle, Award, Mic } from 'lucide-react';
import logoImg from '../assets/images/tahdiib_app_logo_1786092039747.jpg';
import { getLastBackupInfo } from '../lib/firebase';
import { ParentNotificationCenter } from './ParentNotificationCenter';

interface NavbarProps {
  currentUser: User;
  settings: SchoolSettings;
  onLogout: () => void;
  onSwitchRole?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenApkModal: () => void;
  onOpenShareModal?: () => void;
  onOpenChangeProfile?: () => void;
  onOpenAppUpdateModal?: () => void;
  onOpenPermissionsModal?: () => void;
  onNavigateToSettings?: () => void;
  onOpenSearchModal?: () => void;
  onOpenLicenseModal?: () => void;
  onOpenApiKeyModal?: () => void;
  onOpenAdminVoiceModal?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  isMoneyHidden?: boolean;
  onToggleHideMoney?: () => void;
  parentChildren?: Student[];
  notifications?: PushNotificationItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  onLogout,
  onSwitchRole,
  searchQuery,
  setSearchQuery,
  onOpenApkModal,
  onOpenShareModal,
  onOpenChangeProfile,
  onOpenAppUpdateModal,
  onOpenPermissionsModal,
  onNavigateToSettings,
  onOpenSearchModal,
  onOpenLicenseModal,
  onOpenApiKeyModal,
  onOpenAdminVoiceModal,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  isMoneyHidden = false,
  onToggleHideMoney,
  parentChildren = [],
  notifications = [],
}) => {
  const [logoError, setLogoError] = useState<boolean>(false);
  const backupInfo = getLastBackupInfo(settings);
  const isSyncOverdue = backupInfo.isOverdue;
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'parent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'finance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleLabelInSomali = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Maamule';
      case 'teacher':
        return 'Macallin';
      case 'parent':
        return 'Waalid';
      case 'finance':
        return 'Maaliyadda';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs max-w-full overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-2 sm:px-4 md:px-6 gap-2">
        {/* Left: Branding & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 text-slate-700 hover:text-[#0e7a48] hover:bg-slate-100 rounded-xl transition-colors md:hidden cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95"
              title="Menu-ga Taleefanka"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-rose-600" />
              ) : (
                <Menu className="w-5 h-5 text-[#0e7a48]" />
              )}
            </button>
          )}

          {/* Logo with reliable fallback */}
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-[#d4af37]/60 shadow-xs bg-[#0e7a48] flex items-center justify-center shrink-0">
            <img
              src={settings.logoUrl || logoImg}
              alt={settings.schoolName || 'Machadka Tahdiibul Adfaal Logo'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = logoImg;
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-base font-black text-[#0e7a48] leading-tight flex items-center gap-1.5 truncate">
              <span className="truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">{settings.schoolName || 'Tahdiibul Adfaal'}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-[#d4af37] text-slate-950 border border-amber-300 shadow-xs shrink-0 tracking-wider">
                ADFAAL MIS
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-2.5 h-2.5 text-emerald-600" />
                <span>Ku xiran Cloud-ka</span>
              </span>

              {isSyncOverdue && currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white hover:bg-rose-700 border border-rose-300 shadow-xs animate-pulse cursor-pointer transition-all active:scale-95 shrink-0"
                  title="⚠️ DIGNIIN: Ka badan 24h ma dhicin kaydin Firestore! Riix si aad Dejimaha u gasho."
                >
                  <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>24h+ Sync Overdue ⚠️</span>
                </button>
              )}
            </h1>

            <p className="text-[11px] font-bold text-slate-600 leading-tight flex items-center gap-1 mt-0.5 truncate">
              <span>Ku soo dhowow, {getRoleLabelInSomali(currentUser.role)} {currentUser.name ? `(${currentUser.name})` : ''} 👋</span>
            </p>
          </div>
        </div>

        {/* Middle: Search (Desktop) */}
        <div
          onClick={onOpenSearchModal}
          className="hidden md:flex items-center relative max-w-xs w-full cursor-pointer group"
        >
          <Search className="w-4 h-4 absolute left-3 text-slate-400 group-hover:text-[#0e7a48] transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Raadi arday, macallin... (⌘K / Ctrl+K)"
            value={searchQuery}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer focus:outline-none transition-all shadow-2xs font-medium"
          />
        </div>

        {/* Right: Profile, Notification Icon & Compact Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0 py-0.5">
          {/* BADHANKA RAADIN / SEARCH EE MOBILE-KA */}
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Raadi Arday, Macallin, Waalid ama Lacag"
          >
            <Search className="w-4 h-4 text-[#0e7a48]" />
          </button>

          {/* Notification Center with 🔔 Icon (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <ParentNotificationCenter
              currentUser={currentUser}
              parentChildren={parentChildren}
              notifications={notifications}
            />
          )}

          {/* BADHANKA LAGU QARIYO / LAGU MUUJIYO LACAGTA (EYE TOGGLE BUTTON) */}
          {onToggleHideMoney && (
            <button
              onClick={onToggleHideMoney}
              className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 shadow-xs min-h-[40px] ${
                isMoneyHidden
                  ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
              }`}
              title={
                isMoneyHidden
                  ? 'Eye-ka waa xiran yahay - Lacagaha waa qarsan yihiin (Riix si aad u furto / muujiso)'
                  : 'Eye-ka waa furan yahay - Lacagaha waa la arkaa (Riix si aad u xirto / qariso)'
              }
            >
              {isMoneyHidden ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
                  <span className="hidden xs:inline">Qarsan</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden xs:inline">Muuqata</span>
                </>
              )}
            </button>
          )}

          {/* Profile Button */}
          <button
            onClick={onOpenChangeProfile}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left shrink-0 active:scale-95"
            title="Beddel Profile-ka / Password-ka"
          >
            <div className="w-8 h-8 rounded-full bg-[#0e7a48] text-[#d4af37] font-black text-xs flex items-center justify-center border border-[#d4af37]/50 shadow-xs shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                <span>{currentUser.name}</span>
                <KeyRound className="w-3 h-3 text-[#0e7a48]" />
              </p>
              <span
                className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getRoleBadgeColor(
                  currentUser.role
                )}`}
              >
                {getRoleLabelInSomali(currentUser.role)}
              </span>
            </div>
          </button>

          {/* Compact Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 active:scale-95 border border-rose-500 min-h-[40px]"
            title="Ka bax akoonka"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span className="font-extrabold text-[11px]">Ka Bax Akoonka</span>
          </button>
        </div>
      </div>
    </header>
  );
};
