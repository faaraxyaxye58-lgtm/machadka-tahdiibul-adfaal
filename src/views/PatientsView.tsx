import React, { useState, useMemo } from 'react';
import { PatientRecord, Gender, User, SchoolSettings } from '../types';
import {
  Stethoscope,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  Printer,
  X,
  History,
  FileText,
  UserCheck,
} from 'lucide-react';

interface PatientsViewProps {
  currentUser?: User | null;
  settings: SchoolSettings;
  patients: PatientRecord[];
  onSavePatients: (updated: PatientRecord[]) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  currentUser,
  settings,
  patients,
  onSavePatients,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<PatientRecord | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGender, setFormGender] = useState<Gender>('Male');
  const [formAge, setFormAge] = useState<number>(10);
  const [formNotes, setFormNotes] = useState('');

  // Medical History Modal
  const [isHistoryAddModalOpen, setIsHistoryAddModalOpen] = useState(false);
  const [historyDiagnosis, setHistoryDiagnosis] = useState('');
  const [historyTreatment, setHistoryTreatment] = useState('');

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormName('');
    setFormPhone('');
    setFormGender('Male');
    setFormAge(10);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: PatientRecord) => {
    setEditingPatient(p);
    setFormName(p.fullName);
    setFormPhone(p.phone);
    setFormGender(p.gender);
    setFormAge(p.age);
    setFormNotes(p.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Fadlan geli magaca bukaanka.');
      return;
    }

    if (editingPatient) {
      const updated = patients.map((p) =>
        p.id === editingPatient.id
          ? {
              ...p,
              fullName: formName.trim(),
              phone: formPhone.trim(),
              gender: formGender,
              age: Number(formAge),
              notes: formNotes.trim(),
            }
          : p
      );
      onSavePatients(updated);
    } else {
      const newPatient: PatientRecord = {
        id: `pat-${Date.now()}`,
        patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: formName.trim(),
        phone: formPhone.trim(),
        gender: formGender,
        age: Number(formAge),
        registrationDate: new Date().toISOString().split('T')[0],
        notes: formNotes.trim(),
        medicalHistory: [],
      };
      onSavePatients([...patients, newPatient]);
    }
    setIsAddModalOpen(false);
  };

  const handleDeletePatient = (id: string, name: string) => {
    if (confirm(`Ma hubtaa inaad tirtirto bukaanka ${name}?`)) {
      onSavePatients(patients.filter((p) => p.id !== id));
    }
  };

  const handleAddMedicalHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHistoryPatient || !historyDiagnosis.trim()) return;

    const newHistoryItem = {
      id: `mhist-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      diagnosis: historyDiagnosis.trim(),
      treatment: historyTreatment.trim(),
      doctorOrNurse: currentUser?.name || 'Dhaktarka Machadka',
    };

    const updatedPatients = patients.map((p) =>
      p.id === selectedHistoryPatient.id
        ? {
            ...p,
            medicalHistory: [newHistoryItem, ...(p.medicalHistory || [])],
          }
        : p
    );

    onSavePatients(updatedPatients);
    setSelectedHistoryPatient(updatedPatients.find((p) => p.id === selectedHistoryPatient.id) || null);

    setHistoryDiagnosis('');
    setHistoryTreatment('');
    setIsHistoryAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-800 to-pink-900 text-white p-6 rounded-2xl shadow-lg border border-rose-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-300 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Health & Clinic Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Patients & Dhiigga Bukaanka</h1>
          <p className="text-rose-100 text-xs mt-1">
            Diiwaanka bukaannada, xaaladahooda caafimaad, taariikhda daawada iyo xogta clinic-ka Machadka.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-white/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Diiwaangeli Patient</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Tirada Patients-ka
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{patients.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Bukaanno u duuban</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Medical Checkups Total
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            {patients.reduce((acc, p) => acc + (p.medicalHistory?.length || 0), 0)}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">Baaritaanno & daaweyn la sameeyay</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Labiska / gender
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">
            👦 {patients.filter((p) => p.gender === 'Male').length} • 👧 {patients.filter((p) => p.gender === 'Female').length}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Wiilal & Gabdho</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi magaca bukaanka, ID-ga ama talefanka..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-rose-600" />
            <span>Diiwaanka Bukaannada / Patients ({filteredPatients.length})</span>
          </h3>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Stethoscope className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-bold text-sm text-slate-600">Lama helin wax patient ah.</p>
            <p className="text-xs">Riix "+ Diiwaangeli Patient" si aad u geliso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Magaca Bukaanka</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5 text-center">Gender / Da'da</th>
                  <th className="p-3.5 text-center">Taariikhda Registration</th>
                  <th className="p-3.5 text-center">History</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-extrabold text-slate-900">{p.patientId}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">{p.fullName}</td>
                    <td className="p-3.5 text-slate-600 font-bold">{p.phone || '—'}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px]">
                        {p.gender === 'Female' ? '👧 Female' : '👦 Male'} • {p.age} jir
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-slate-600">{p.registrationDate}</td>
                    <td className="p-3.5 text-center font-bold text-rose-700">
                      {p.medicalHistory?.length || 0} Baaritaan
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedHistoryPatient(p)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] rounded-lg border border-rose-200 cursor-pointer"
                        >
                          Eeg Medical History
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(p.id, p.fullName)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingPatient ? 'Wax ka Beddel Bukaanka' : 'Diiwaangeli Patient Cusub'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Magaca Bukaanka *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Axmed Maxamed Cumar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone-ka</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+25261..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as Gender)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Male">Male (Wiil)</option>
                    <option value="Female">Female (Gabadh)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Da'da (Age)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formAge}
                  onChange={(e) => setFormAge(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Faahfaahin</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes ama xaalad caafimaad..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Bukaanka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDICAL HISTORY MODAL */}
      {selectedHistoryPatient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Medical History: {selectedHistoryPatient.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  ID: {selectedHistoryPatient.patientId} • Phone: {selectedHistoryPatient.phone || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryPatient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-end shrink-0">
              <button
                onClick={() => setIsHistoryAddModalOpen(true)}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ku dar Baaritaan / Daawayn</span>
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 grow text-xs">
              {!selectedHistoryPatient.medicalHistory || selectedHistoryPatient.medicalHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  Ma jiro wax baaritaan ah oo hore loogu duubay bukaankan.
                </div>
              ) : (
                selectedHistoryPatient.medicalHistory.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span>{m.diagnosis}</span>
                      <span className="text-[10px] text-slate-500">{m.date}</span>
                    </div>
                    {m.treatment && <p className="text-slate-700 text-xs">Treatment: {m.treatment}</p>}
                    <p className="text-[10px] text-slate-400">Doctor/Nurse: {m.doctorOrNurse || 'Staff'}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedHistoryPatient(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEDICAL HISTORY ITEM SUB-MODAL */}
      {isHistoryAddModalOpen && selectedHistoryPatient && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-900 text-base">Ku dar Baaritaan Caafimaad</h3>

            <form onSubmit={handleAddMedicalHistory} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cudurka / Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={historyDiagnosis}
                  onChange={(e) => setHistoryDiagnosis(e.target.value)}
                  placeholder="e.g., Qandho, Madax-xanuun"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Daawada / Treatment</label>
                <textarea
                  rows={2}
                  value={historyTreatment}
                  onChange={(e) => setHistoryTreatment(e.target.value)}
                  placeholder="e.g., Paracetamol, Nasasho"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHistoryAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Baaritaanka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
