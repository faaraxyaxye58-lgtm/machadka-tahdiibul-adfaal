import React, { useState, useMemo } from 'react';
import { Customer, CustomerType, CustomerTransaction, User, SchoolSettings } from '../types';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  DollarSign,
  History,
  Phone,
  MapPin,
  Printer,
  FileText,
  X,
  CheckCircle2,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

interface CustomersViewProps {
  currentUser?: User | null;
  settings: SchoolSettings;
  customers: Customer[];
  onSaveCustomers: (updated: Customer[]) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  currentUser,
  settings,
  customers,
  onSaveCustomers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<CustomerType>('Cash Customer');
  const [formAddress, setFormAddress] = useState('');
  const [formBalance, setFormBalance] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // Sample transactions store in memory/local
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([
    {
      id: 'ctx-1',
      customerId: 'cust-1',
      customerName: 'Raage Maxamed',
      date: new Date().toISOString().split('T')[0],
      type: 'Sale',
      amount: 45,
      description: 'Iibinta Kitaabbada & Qalamaan',
      processedBy: currentUser?.name || 'Admin',
    },
  ]);

  // Transaction modal states
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [transCustomer, setTransCustomer] = useState<Customer | null>(null);
  const [transType, setTransType] = useState<'Sale' | 'Payment' | 'Credit' | 'Debit'>('Sale');
  const [transAmount, setTransAmount] = useState<number>(0);
  const [transDesc, setTransDesc] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'all' || c.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, selectedType]);

  const totalBalance = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [customers]);

  const dhexeCount = useMemo(() => customers.filter((c) => c.type === 'Dhexe Customer').length, [customers]);
  const raageCount = useMemo(() => customers.filter((c) => c.type === 'Raage Customer').length, [customers]);
  const cashCount = useMemo(() => customers.filter((c) => c.type === 'Cash Customer').length, [customers]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormType('Cash Customer');
    setFormAddress('');
    setFormBalance(0);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormType(c.type);
    setFormAddress(c.address || '');
    setFormBalance(c.balance || 0);
    setFormNotes(c.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Fadlan geli magaca customer-ka');
      return;
    }

    if (editingCustomer) {
      const updated = customers.map((c) =>
        c.id === editingCustomer.id
          ? {
              ...c,
              name: formName.trim(),
              phone: formPhone.trim(),
              type: formType,
              address: formAddress.trim(),
              balance: Number(formBalance),
              notes: formNotes.trim(),
            }
          : c
      );
      onSaveCustomers(updated);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        type: formType,
        address: formAddress.trim(),
        balance: Number(formBalance),
        createdAt: new Date().toISOString().split('T')[0],
        notes: formNotes.trim(),
      };
      onSaveCustomers([...customers, newCust]);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Ma hubtaa inaad tirtirto customer-ka ${name}?`)) {
      const updated = customers.filter((c) => c.id !== id);
      onSaveCustomers(updated);
    }
  };

  const handleOpenTransaction = (c: Customer) => {
    setTransCustomer(c);
    setTransType('Sale');
    setTransAmount(0);
    setTransDesc('');
    setIsTransModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transCustomer || transAmount <= 0) {
      alert('Fadlan geli xaddi lacageed oo sax ah.');
      return;
    }

    const newTx: CustomerTransaction = {
      id: `ctx-${Date.now()}`,
      customerId: transCustomer.id,
      customerName: transCustomer.name,
      date: new Date().toISOString().split('T')[0],
      type: transType,
      amount: Number(transAmount),
      description: transDesc.trim() || `${transType} Transaction`,
      processedBy: currentUser?.name || 'Admin',
    };

    setTransactions([newTx, ...transactions]);

    // Adjust customer balance
    let balanceChange = 0;
    if (transType === 'Sale' || transType === 'Debit') {
      balanceChange = Number(transAmount);
    } else if (transType === 'Payment' || transType === 'Credit') {
      balanceChange = -Number(transAmount);
    }

    const updated = customers.map((c) =>
      c.id === transCustomer.id ? { ...c, balance: (c.balance || 0) + balanceChange } : c
    );
    onSaveCustomers(updated);

    setIsTransModalOpen(false);
  };

  const handlePrintCustomers = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0e7a48] to-emerald-800 text-white p-6 rounded-2xl shadow-lg border border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d4af37] text-slate-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customer Management Module</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Maamulka Customers-ka</h1>
          <p className="text-emerald-100 text-xs mt-1">
            Maamul Dhexe Customer, Raage Customer iyo Cash Customer leh Balance & Transaction History.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrintCustomers}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-white/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#d4af37] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Ku Dar Customer</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Tirada Customers-ka
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{customers.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Guud ahaan diiwaanka</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Dhexe Customers
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{dhexeCount}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Dhexe Category</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Raage Customers
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{raageCount}</span>
          <span className="text-[10px] text-blue-600 font-medium">Raage Category</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Guud ahaan Balance ($)
          </span>
          <span className={`text-2xl font-black mt-1 block ${totalBalance >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
            ${totalBalance.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Total Owed / Balance</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi magaca, talefanka ama cinwaanka..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'Dhexe Customer', 'Raage Customer', 'Cash Customer'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedType === type
                    ? 'bg-[#0e7a48] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {type === 'all' ? 'Dhammaan Customers' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Diiwaanka Customers-ka ({filteredCustomers.length})</span>
          </h3>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <UserCheck className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-bold text-sm text-slate-600">Lama helin wax customer ah.</p>
            <p className="text-xs">Riix "+ Ku Dar Customer" si aad u diiwaangeliso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Category (Type)</th>
                  <th className="p-3.5">Cinwaanka</th>
                  <th className="p-3.5 text-right">Balance ($)</th>
                  <th className="p-3.5 text-center">Taariikhda</th>
                  <th className="p-3.5 text-center">Hawlgallada (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{c.name}</div>
                          {c.notes && <div className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">{c.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-bold">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] inline-block ${
                          c.type === 'Dhexe Customer'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : c.type === 'Raage Customer'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{c.address || '—'}</td>
                    <td className="p-3.5 text-right font-black text-sm">
                      <span className={c.balance > 0 ? 'text-amber-600' : c.balance < 0 ? 'text-emerald-600' : 'text-slate-500'}>
                        ${c.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-slate-500 text-[11px]">{c.createdAt}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenTransaction(c)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                          title="Ku dar Transaction / Lacag bixin"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Tx</span>
                        </button>
                        <button
                          onClick={() => setSelectedHistoryCustomer(c)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
                          title="Eeg Taariikhda Transactions-ka"
                        >
                          <History className="w-3 h-3" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Wax ka beddel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Tirtir"
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

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingCustomer ? 'Wax ka Beddel Customer' : 'Diiwaangeli Customer Cusub'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Magaca Customer-ka *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Raage Maxamed Cali"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lambarka Phone-ka</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g., +252615551122"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category (Type)</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CustomerType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="Dhexe Customer">Dhexe Customer</option>
                    <option value="Raage Customer">Raage Customer</option>
                    <option value="Cash Customer">Cash Customer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cinwaanka (Address)</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g., Hodan, Muqdisho"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Balance ($)</label>
                <input
                  type="number"
                  value={formBalance}
                  onChange={(e) => setFormBalance(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Faahfaahin / Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Faahfaahin dheeraad ah..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                  className="px-5 py-2 bg-[#0e7a48] hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {isTransModalOpen && transCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Ku Dar Transaction</h3>
                <p className="text-xs text-slate-500">Customer: {transCustomer.name}</p>
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
                <label className="font-bold text-slate-700 block mb-1">Nooca Hawlgalka (Type)</label>
                <select
                  value={transType}
                  onChange={(e) => setTransType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Sale">Sale (Iib - Ku dar Deyn)</option>
                  <option value="Payment">Payment (Bixin - Ka joo Deyn)</option>
                  <option value="Debit">Debit (Ku dar Balance)</option>
                  <option value="Credit">Credit (Ka yar Balance)</option>
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-emerald-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Faahfaahinta / Description</label>
                <input
                  type="text"
                  value={transDesc}
                  onChange={(e) => setTransDesc(e.target.value)}
                  placeholder="e.g., Bixinta buugaagta & maaddada"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY MODAL */}
      {selectedHistoryCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <span>History-ga: {selectedHistoryCustomer.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Balance: ${selectedHistoryCustomer.balance.toLocaleString()} • Type: {selectedHistoryCustomer.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 grow pr-1 text-xs">
              {transactions.filter((t) => t.customerId === selectedHistoryCustomer.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  Ma jiro wax transaction ah oo u duuban customer-kan.
                </div>
              ) : (
                transactions
                  .filter((t) => t.customerId === selectedHistoryCustomer.id)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">{tx.description}</div>
                        <div className="text-[10px] text-slate-500">
                          {tx.date} • Processed by: {tx.processedBy || 'Admin'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            tx.type === 'Sale' || tx.type === 'Debit' ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {tx.type === 'Sale' || tx.type === 'Debit' ? '+' : '-'}${tx.amount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{tx.type}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Khaarajin (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
