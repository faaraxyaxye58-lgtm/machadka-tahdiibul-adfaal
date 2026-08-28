import React, { useState } from 'react';
import { Parent, Student, SchoolSettings, User } from '../types';
import { HeartHandshake, Phone, Mail, MapPin, Send, MessageSquare, CheckCircle, Plus, X, Edit2, Trash2, Smartphone } from 'lucide-react';
import { sendSmsViaBackend } from '../lib/smsService';

interface ParentsViewProps {
  currentUser?: User | null;
  users?: User[];
  parents: Parent[];
  students: Student[];
  settings: SchoolSettings;
  onAddParent: (parent: Omit<Parent, 'id'>, credentials?: { username: string; password: string }) => void;
  onUpdateParent?: (parent: Parent, credentials?: { username: string; password: string }) => void;
  onDeleteParent?: (id: string) => void;
}

export const ParentsView: React.FC<ParentsViewProps> = ({
  currentUser,
  users = [],
  parents,
  students,
  settings,
  onAddParent,
  onUpdateParent,
  onDeleteParent,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [sentSmsId, setSentSmsId] = useState<string | null>(null);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+252 61 ');
  const [address, setAddress] = useState('Muqdisho');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');

  // Filter parents for parent user
  const displayParents = parents.filter((p) => {
    if (currentUser?.role === 'parent') {
      return (
        p.fullName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        (currentUser.phone && p.phone.includes(currentUser.phone))
      );
    }
    return true;
  });

  const openEditModal = (prn: Parent) => {
    setEditingParent(prn);
    setFullName(prn.fullName);
    setPhone(prn.phone);
    setAddress(prn.address);
    const existingUser = users.find(
      (u) =>
        u.id === prn.id ||
        (u.phone && u.phone.replace(/\D/g, '') === prn.phone.replace(/\D/g, '')) ||
        u.name.trim().toLowerCase() === prn.fullName.trim().toLowerCase()
    );
    const cleanPhone = prn.phone.replace(/\D/g, '');
    setUsername(existingUser?.username || `walid_${cleanPhone.slice(-6) || '123'}`);
    setPassword(existingUser?.password || '123456');
  };

  const handleSendSms = (parentId: string, parentName: string, phone: string) => {
    setSentSmsId(parentId);
    setTimeout(() => {
      setSentSmsId(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = {
      username: username || `walid_${phone.replace(/\D/g, '').slice(-6) || Date.now().toString().slice(-4)}`,
      password: password || '123456',
    };

    if (editingParent) {
      if (onUpdateParent) {
        onUpdateParent(
          {
            ...editingParent,
            fullName,
            phone,
            address,
          },
          creds
        );
      }
      setEditingParent(null);
    } else {
      onAddParent(
        {
          fullName,
          phone,
          address,
          childrenIds: [],
          totalPendingFees: 0,
        },
        creds
      );
      setIsOpenAddModal(false);
    }
    setFullName('');
    setUsername('');
    setPassword('123456');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-700" />
            <span>Waalidiinta & Xiriirka Machadka</span>
          </h2>
          <p className="text-xs text-slate-500">
            Diiwaanka waalidiinta carruurtu u dhigtaan dugsiga iyo dirista fariimaha SMS/Ogeysiiska ({parents.length} Waalid)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingParent(null);
              setFullName('');
              setPhone('+252 61 ');
              setAddress('Muqdisho');
              setIsOpenAddModal(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ku Dar Waalid Cusub</span>
          </button>
        )}
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayParents.map((prn) => {
          const cleanPrnPhone = prn.phone ? prn.phone.replace(/\D/g, '') : '';
          const linkedStudents = students.filter((s) => {
            const cleanStudentParentPhone = s.parentPhone ? s.parentPhone.replace(/\D/g, '') : '';
            const matchPhone =
              cleanPrnPhone.length > 5 &&
              cleanStudentParentPhone.length > 5 &&
              (cleanPrnPhone === cleanStudentParentPhone ||
                cleanPrnPhone.endsWith(cleanStudentParentPhone) ||
                cleanStudentParentPhone.endsWith(cleanPrnPhone));
            const matchName =
              s.parentName && prn.fullName && s.parentName.trim().toLowerCase() === prn.fullName.trim().toLowerCase();
            const matchId = prn.childrenIds && prn.childrenIds.includes(s.id);
            return matchPhone || matchName || matchId;
          });

          return (
            <div
              key={prn.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{prn.fullName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{prn.address}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Carruurta Dhigata:
                    </span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      {linkedStudents.length} Arday
                    </span>
                  </div>
                </div>

                {/* Linked Children */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Ubadka Dugsiga U Dhiga:
                  </span>
                  {linkedStudents.length === 0 ? (
                    <p className="text-slate-400 italic">Lama xiriirin arday gaar ah.</p>
                  ) : (
                    linkedStudents.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0"
                      >
                        <span className="font-bold text-slate-800">{child.fullName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                            Juz {child.currentJuz}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              child.feeStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {child.feeStatus === 'Paid' ? 'Bixiyay' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions & SMS Simulation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>
                    {settings.privacyPermissions?.hideParentPhoneNumbers && !isAdmin
                      ? prn.phone.replace(/(\+\d{3}\s*\d{2})\s*\d{3}\s*(\d{2})/, '$1 *** **$2')
                      : prn.phone}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEditModal(prn)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        title="Beddel Waalidka"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {onDeleteParent && (
                        <button
                          onClick={() => onDeleteParent(prn.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Tirtir Waalidka"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      sendSmsViaBackend({
                        recipients: prn.phone,
                        recipientName: prn.fullName,
                        recipientPhone: prn.phone,
                        message: `Asc Waalidka sharafta leh (${prn.fullName}), kani waa ogeysiis ka socda dugsiga Qur'aanka ee ${settings.schoolName}.`,
                        senderId: settings.schoolName || 'TAHDIIB-MIS',
                        gateway: 'Hormuud Bulk SMS',
                        messageType: 'General',
                        apiKey: settings.smsSettings?.apiKey,
                        isMockMode: settings.smsSettings?.isMockMode !== false,
                      });
                      handleSendSms(prn.id, prn.fullName, prn.phone);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      sentSmsId === prn.id
                        ? 'bg-emerald-800 text-amber-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {sentSmsId === prn.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-amber-300 animate-bounce" />
                        <span>SMS Waa la diray!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        <span>API SMS</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`sms:${prn.phone}?body=${encodeURIComponent(
                      `Asc Waalid ${prn.fullName}, ku saabsan dugsiga ${settings.schoolName}...`
                    )}`}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Direct Device SMS"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Device SMS</span>
                  </a>

                  <a
                    href={`https://wa.me/${prn.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Asc Waalidka sharafta leh (${prn.fullName}), ku saabsan dugsiga ${settings.schoolName}...`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-[#25D366] hover:bg-[#1ebc57] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    title="WhatsApp Direct Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Parent Modal */}
      {(isOpenAddModal || editingParent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                <span>{editingParent ? 'Wax ka beddel Waalidka (Edit)' : 'Ku Dar Waalid Cusub'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsOpenAddModal(false);
                  setEditingParent(null);
                }}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Magaca Waalidka / Mas'uulka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cabdi Maxamed Jaamac"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefoonka *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Username (Gelitaanka)
                  </label>
                  <input
                    type="text"
                    placeholder="walid_612345"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Password (Sireed)
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Degaanka / Anwaanka</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenAddModal(false);
                    setEditingParent(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kanasal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Keydi Isbeddelka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
