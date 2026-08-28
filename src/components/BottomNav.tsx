import React, { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  BookMarked,
  CheckSquare,
  DollarSign,
  Users,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  EyeOff,
  Eye,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { User, SchoolSettings } from '../types';
import { getLastBackupInfo } from '../lib/firebase';
import { canUserAccessPayments } from '../lib/permissionUtils';

interface BottomNavProps {
  currentUser?: User | null;
  settings?: SchoolSettings;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  settings,
  activeTab,
  setActiveTab,
  onOpenMenu,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const role = currentUser?.role || 'admin';
  const backupInfo = getLastBackupInfo(settings);
  const isSyncOverdue = backupInfo.isOverdue;

  const getPrimaryTabs = () => {
    let tabs = [
      { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
      { id: 'remote_learning' as NavTab, label: 'Fog', icon: BookOpen },
      { id: 'attendance' as NavTab, label: 'Xaadiris', icon: CheckSquare },
    ];

    if (role === 'admin') {
      tabs.push({ id: 'messaging' as NavTab, label: 'Ogeysiis', icon: Bell });
      tabs.push({ id: 'settings' as NavTab, label: 'Settings', icon: Settings });
    } else {
      tabs.push({ id: 'students' as NavTab, label: role === 'parent' ? 'Ubadka' : 'Ardayda', icon: GraduationCap });
    }

    const hiddenTabs = settings?.privacyPermissions?.hiddenTabsByRole?.[role as 'teacher' | 'parent' | 'student' | 'finance'] || [];
    if (role !== 'admin' && hiddenTabs.length > 0) {
      tabs = tabs.filter(t => !hiddenTabs.includes(t.id));
    }
    return tabs;
  };

  const primaryTabs = getPrimaryTabs();

  if (isMinimized) {
    return (
      <div className="md:hidden fixed bottom-3 right-3 z-40 select-none">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0e7a48] text-white rounded-full shadow-xl hover:bg-[#0b633a] active:scale-95 transition-all text-xs font-bold border border-emerald-400/40"
          title="Muuji Dashboard-ka hoose (Show Navigation Bar)"
        >
          <Eye className="w-4 h-4 text-emerald-200" />
          <span>Muuji Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-1.5 py-1.5 safe-pb flex items-center justify-around select-none">
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-[#0e7a48] font-bold scale-105 bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`relative p-1 rounded-lg ${isActive ? 'bg-[#0e7a48] text-white shadow-xs' : ''}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer relative"
        title={isSyncOverdue ? '⚠️ DIGNIIN: Sync-gu wuxuu ka badan yahay 24h! Riix si aad Dejimaha u gasho' : 'Biro oo Eeg Qaybaha Kale'}
      >
        <div className="relative p-1 rounded-lg bg-amber-100 text-[#0e7a48]">
          <Menu className="w-4 h-4" />
          {isSyncOverdue && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white animate-pulse" />
          )}
        </div>
        <span className="text-[9px] mt-0.5 tracking-tight font-bold text-slate-700 flex items-center gap-0.5">
          <span>Menu</span>
          {isSyncOverdue && <span className="text-rose-600 font-extrabold">⚠️</span>}
        </span>
      </button>

      {/* Hide / Collapse Toggle Button */}
      <button
        onClick={() => setIsMinimized(true)}
        className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
        title="Qari Dashboard-ka hoose si aad xogta si buuxda u aragto"
      >
        <div className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
          <EyeOff className="w-4 h-4" />
        </div>
        <span className="text-[9px] mt-0.5 tracking-tight font-medium text-slate-500">
          Qari
        </span>
      </button>
    </div>
  );
};
