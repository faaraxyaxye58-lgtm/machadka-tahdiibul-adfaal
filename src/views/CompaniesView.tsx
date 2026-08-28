import React, { useState, useMemo } from 'react';
import { SupplierCompany, CompanyTransaction, User, SchoolSettings } from '../types';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Printer,
  X,
  Package,
  History,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

interface CompaniesViewProps {
  currentUser?: User | null;
  settings: SchoolSettings;
  companies: SupplierCompany[];
  onSaveCompanies: (updated: SupplierCompany[]) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  currentUser,
  settings,
  companies,
  onSaveCompanies,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SupplierCompany | null>(null);
  const [selectedHistoryCompany, setSelectedHistoryCompany] = useState<SupplierCompany | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProducts, setFormProducts] = useState('');
  const [formBalance, setFormBalance] = useState<number>(0);

  // Transactions store in memory
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([
    {
      id: 'ctx-1',
      companyId: 'comp-1',
      companyName: 'Maktabadda Al-Anwaar',
      date: new Date().toISOString().split('T')[0],
      type: 'Purchase',
      amount: 250,
      details: 'Keenidda 50 Mus\'haf Tajweed & Qaaciydo',
      receiptNo: 'REC-9912',
    },
  ]);

  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [transCompany, setTransCompany] = useState<SupplierCompany | null>(null);
  const [transType, setTransType] = useState<'Purchase' | 'Payment'>('Purchase');
  const [transAmount, setTransAmount] = useState<number>(0);
  const [transDetails, setTransDetails] = useState('');

  const filteredCompanies = useMemo(() => {
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const totalCompanyBalance = useMemo(() => {
    return companies.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [companies]);

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormAddress('Muqdisho, Soomaaliya');
    setFormProducts('Kitaabbo, Uniforms, Stationery');
    setFormBalance(0);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: SupplierCompany) => {
    setEditingCompany(c);
    setFormName(c.companyName);
    setFormContact(c.contactPerson || '');
    setFormPhone(c.phone);
    setFormAddress(c.address);
    setFormProducts(c.productsSupplied ? c.productsSupplied.join(', ') : '');
    setFormBalance(c.balance);
    setIsAddModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Fadlan geli magaca shirkadda.');
      return;
    }

    const productsArray = formProducts
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (editingCompany) {
      const updated = companies.map((c) =>
        c.id === editingCompany.id
          ? {
              ...c,
              companyName: formName.trim(),
              contactPerson: formContact.trim(),
              phone: formPhone.trim(),
              address: formAddress.trim(),
              productsSupplied: productsArray,
              balance: Number(formBalance),
            }
          : c
      );
      onSaveCompanies(updated);
    } else {
      const newComp: SupplierCompany = {
        id: `comp-${Date.now()}`,
        companyName: formName.trim(),
        contactPerson: formContact.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        productsSupplied: productsArray,
        balance: Number(formBalance),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSaveCompanies([...companies, newComp]);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (confirm(`Ma hubtaa inaad tirtirto shirkadda ${name}?`)) {
      const updated = companies.filter((c) => c.id !== id);
      onSaveCompanies(updated);
    }
  };

  const handleOpenTransaction = (c: SupplierCompany) => {
    setTransCompany(c);
    setTransType('Purchase');
    setTransAmount(0);
    setTransDetails('');
    setIsTransModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transCompany || transAmount <= 0) return;

    const newTx: CompanyTransaction = {
      id: `ctx-${Date.now()}`,
      companyId: transCompany.id,
      companyName: transCompany.companyName,
      date: new Date().toISOString().split('T')[0],
      type: transType,
      amount: Number(transAmount),
      details: transDetails.trim() || `${transType} Transaction`,
      receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setTransactions([newTx, ...transactions]);

    // Update company balance
    const balanceChange = transType === 'Purchase' ? Number(transAmount) : -Number(transAmount);
    const updated = companies.map((c) =>
      c.id === transCompany.id ? { ...c, balance: (c.balance || 0) + balanceChange } : c
    );
    onSaveCompanies(updated);

    setIsTransModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Suppliers & Vendor Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Shirkadaha & Ganacsiga</h1>
          <p className="text-blue-100 text-xs mt-1">
            Diiwaanka shirkadaha alaabta keena (Suppliers), Balance-ka lagu leeyahay iyo history-ga rasiidhyada.
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
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Ku Dar Shirkad</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Tirada Shirkadaha
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{companies.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Active Suppliers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Guud ahaan Balance ($)
          </span>
          <span className={`text-2xl font-black mt-1 block ${totalCompanyBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            ${totalCompanyBalance.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Lacagta lagu leeyahay Machadka</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Transactions Total
          </span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">{transactions.length}</span>
          <span className="text-[10px] text-indigo-600 font-medium">Invoices & Receipts recorded</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi magaca shirkadda, talefanka ama cinwaanka..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Diiwaanka Shirkadaha & Vendors ({filteredCompanies.length})</span>
          </h3>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-bold text-sm text-slate-600">Lama helin wax shirkad ah.</p>
            <p className="text-xs">Riix "+ Ku Dar Shirkad" si aad u geliso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Shirkadda (Company)</th>
                  <th className="p-3.5">Qofka Xiriirka</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Badeecadaha (Products)</th>
                  <th className="p-3.5 text-right">Balance ($)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">{c.companyName}</td>
                    <td className="p-3.5 text-slate-600">{c.contactPerson || '—'}</td>
                    <td className="p-3.5 font-bold text-slate-700">{c.phone}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {c.productsSupplied && c.productsSupplied.length > 0 ? c.productsSupplied.join(', ') : '—'}
                    </td>
                    <td className="p-3.5 text-right font-black text-sm text-indigo-700">
                      ${(c.balance || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenTransaction(c)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-lg border border-indigo-200 cursor-pointer"
                        >
                          + Tx / Receipt
                        </button>
                        <button
                          onClick={() => setSelectedHistoryCompany(c)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] rounded-lg border border-slate-300 cursor-pointer"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(c.id, c.companyName)}
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
                {editingCompany ? 'Wax ka Beddel Shirkad' : 'Diiwaangeli Shirkad Cusub'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Magaca Shirkadda *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Maktabadda Al-Anwaar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qofka Xiriirka</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="e.g., Cumar Maxamed"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+252615551122"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cinwaanka (Address)</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Badeecadaha (Comma separated)</label>
                <input
                  type="text"
                  value={formProducts}
                  onChange={(e) => setFormProducts(e.target.value)}
                  placeholder="Kitaabbo, Uniforms, Stationery"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Balance ($)</label>
                <input
                  type="number"
                  value={formBalance}
                  onChange={(e) => setFormBalance(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700"
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
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Shirkad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {isTransModalOpen && transCompany && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Ku Dar Transaction Shirkad</h3>
                <p className="text-xs text-slate-500">{transCompany.companyName}</p>
              </div>
              <button
                onClick={() => setIsTransModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Type</label>
                <select
                  value={transType}
                  onChange={(e) => setTransType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Purchase">Purchase (Iibsi alaab - Ku dar Balance)</option>
                  <option value="Payment">Payment (Bixin lacag - Ka yar Balance)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lacagta ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transAmount || ''}
                  onChange={(e) => setTransAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-indigo-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Faahfaahinta (Details)</label>
                <input
                  type="text"
                  value={transDetails}
                  onChange={(e) => setTransDetails(e.target.value)}
                  placeholder="e.g., Keenidda Mus'haf & Kitaabbo"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {selectedHistoryCompany && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  History: {selectedHistoryCompany.companyName}
                </h3>
                <p className="text-xs text-slate-500">
                  Balance: ${selectedHistoryCompany.balance.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryCompany(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 grow text-xs">
              {transactions.filter((t) => t.companyId === selectedHistoryCompany.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">Ma jiro wax transaction ah.</div>
              ) : (
                transactions
                  .filter((t) => t.companyId === selectedHistoryCompany.id)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900">{tx.details}</div>
                        <div className="text-[10px] text-slate-500">
                          {tx.date} • Ref: {tx.receiptNo}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            tx.type === 'Purchase' ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {tx.type === 'Purchase' ? '+' : '-'}${tx.amount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{tx.type}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedHistoryCompany(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
