import React, { useState, useEffect } from 'react';
import { PushNotificationItem, User, Student } from '../types';
import {
  Bell,
  X,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react';
import {
  requestNotificationPermission,
  playHighPriorityAlertSound,
} from '../lib/studentExitEngine';
import {
  playEmergencyAlertSiren,
  triggerAlertVibration,
  showHeadsUpAlertNotification,
} from '../lib/scheduledAlertsEngine';
import { NotificationDiagnosticsModal } from './NotificationDiagnosticsModal';
import { db, COLLECTIONS } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ParentNotificationCenterProps {
  currentUser: User | null;
  parentChildren: Student[];
  notifications: PushNotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}

export const ParentNotificationCenter: React.FC<ParentNotificationCenterProps> = ({
  currentUser,
  parentChildren = [],
  notifications = [],
  onMarkAsRead,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [filterTab, setFilterTab] = useState<'all' | 'exit' | 'unread'>('all');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const handleTestAlert = async () => {
    playEmergencyAlertSiren();
    triggerAlertVibration();
    await showHeadsUpAlertNotification(
      'Machadka Tahdiibul Adfaal',
      '🔔 TIJAABO: Digniinta codka leh, vibration-ka, iyo heads-up notification-ku waa shaqaynayaan!'
    );
  };

  // Filter notifications relevant to parent's children
  const childIds = parentChildren.map((c) => c.id);
  const childPhones = parentChildren.map((c) => c.parentPhone?.replace(/\D/g, '').slice(-7)).filter(Boolean);

  const myNotifications = notifications.filter((n) => {
    if (currentUser?.role === 'admin') return true;
    if (n.studentId && childIds.includes(n.studentId)) return true;
    if (n.parentId && n.parentId === currentUser?.id) return true;
    if (n.parentPhone && childPhones.some((ph) => ph && n.parentPhone?.includes(ph))) return true;
    return false;
  });

  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const filteredList = myNotifications.filter((n) => {
    if (filterTab === 'unread') return !n.isRead;
    if (filterTab === 'exit') return n.type === 'StudentExit';
    return true;
  });

  const handleEnablePermissions = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    if (res === 'granted') {
      playHighPriorityAlertSound();
    }
  };

  const handleToggleRead = async (notif: PushNotificationItem) => {
    const updated = { ...notif, isRead: !notif.isRead };
    if (onMarkAsRead) onMarkAsRead(notif.id);

    try {
      await setDoc(doc(db, COLLECTIONS.PUSH_NOTIFICATIONS, notif.id), updated, { merge: true });
    } catch (e) {
      console.error('Error updating notification state in Firestore:', e);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer border border-slate-700"
        title="Ogeysiisyada Waalidka"
      >
        <Bell className="w-5 h-5 text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer / Panel */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 w-[92vw] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-fade-in max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0e7a48] text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Ogeysiisyada Waalidka</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded-full">
                      {unreadCount} cusub
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-300">Machadka Tahdiibul Adfaal</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* High Priority Sound & Permission Explanation Card */}
          <div className="p-3 bg-amber-50/90 border-b border-amber-200 text-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-[11px]">
                <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                <span>3-da Waqti: Digniinta Codka Leh (High Importance)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTestAlert}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Tijaabi codka ambalaasta/digniinta"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>🔊 TIJAABI DIGNIINTA</span>
                </button>
                <button
                  onClick={() => setIsDiagnosticsOpen(true)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Diagnostics Check"
                >
                  <span>Diagnostics</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              Marka 3-da waqti (Subax, Duhur, Fiid) ay gaaraan, telefoonku wuxuu dhawaaqayaa cod digniin ah oo leh vibration.
            </p>
            {permissionState !== 'granted' && (
              <button
                onClick={handleEnablePermissions}
                className="w-full py-1.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Oggolow Ogeysiisyada (Notification Permission)</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between p-2 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Dhammaan ({myNotifications.length})
              </button>
              <button
                onClick={() => setFilterTab('exit')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  filterTab === 'exit'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                🚨 Bixitaan
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  filterTab === 'unread'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aan la akhrin ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto p-3 space-y-2.5 flex-1 divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Bell className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs font-bold text-slate-500">Marnaba ogeysiis cusub ma jiro.</p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const isExit = notif.type === 'StudentExit';

                return (
                  <div
                    key={notif.id}
                    className={`pt-2.5 first:pt-0 p-3 rounded-2xl border transition-all ${
                      !notif.isRead
                        ? 'bg-amber-50/60 border-amber-300/80 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider ${
                            isExit
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isExit ? '🚨 Bixitaan' : notif.type}
                        </span>
                        <span className="text-[11px] font-black text-slate-900">
                          {notif.studentName}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleRead(notif)}
                        className={`p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          notif.isRead
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                        }`}
                        title={notif.isRead ? 'U bel akhrin' : 'Calaamadee in la akhriyay'}
                      >
                        <Check className="w-3 h-3" />
                        <span>{notif.isRead ? 'La akhriyay' : 'Akhri'}</span>
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{notif.exitTime || notif.timestamp}</span>
                      </span>
                      {notif.shiftName && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {notif.shiftName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <NotificationDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
};
