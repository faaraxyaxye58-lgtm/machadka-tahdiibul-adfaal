import React, { useState, useMemo } from 'react';
import { ProductItem, ProductTransaction, User, SchoolSettings } from '../types';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Printer,
  X,
  TrendingUp,
  ShoppingBag,
  Building2,
  DollarSign,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface ProductsViewProps {
  currentUser?: User | null;
  settings: SchoolSettings;
  products: ProductItem[];
  onSaveProducts: (updated: ProductItem[]) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  currentUser,
  settings,
  products,
  onSaveProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);

  // Stock Transaction Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [stockTxType, setStockTxType] = useState<'Sale' | 'Purchase' | 'Adjustment'>('Purchase');
  const [stockQty, setStockQty] = useState<number>(1);
  const [stockCustomerOrCompany, setStockCustomerOrCompany] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.quantity <= 5).length;
  }, [products]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormCode(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName('');
    setFormCompany('Machadka Tahdiib');
    setFormCategory('Kitaabbo');
    setFormQuantity(10);
    setFormUnitPrice(5);
    setFormCostPrice(3);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormCompany(p.companyName);
    setFormCategory(p.category || 'Kitaabbo');
    setFormQuantity(p.quantity);
    setFormUnitPrice(p.unitPrice);
    setFormCostPrice(p.costPrice || p.unitPrice * 0.7);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Fadlan geli magaca badeecada.');
      return;
    }

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              code: formCode.trim(),
              name: formName.trim(),
              companyName: formCompany.trim(),
              category: formCategory.trim(),
              quantity: Number(formQuantity),
              unitPrice: Number(formUnitPrice),
              costPrice: Number(formCostPrice),
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : p
      );
      onSaveProducts(updated);
    } else {
      const newPrd: ProductItem = {
        id: `prd-${Date.now()}`,
        code: formCode.trim(),
        name: formName.trim(),
        companyName: formCompany.trim(),
        category: formCategory.trim(),
        quantity: Number(formQuantity),
        unitPrice: Number(formUnitPrice),
        costPrice: Number(formCostPrice),
        salesCount: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      onSaveProducts([...products, newPrd]);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Ma hubtaa inaad tirtirto badeecada ${name}?`)) {
      const updated = products.filter((p) => p.id !== id);
      onSaveProducts(updated);
    }
  };

  const handleOpenStockTx = (p: ProductItem) => {
    setSelectedProduct(p);
    setStockTxType('Purchase');
    setStockQty(5);
    setStockCustomerOrCompany('');
    setIsStockModalOpen(true);
  };

  const handleSaveStockTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || stockQty <= 0) return;

    let qtyChange = stockQty;
    if (stockTxType === 'Sale') {
      qtyChange = -stockQty;
    }

    const newQty = Math.max(0, selectedProduct.quantity + qtyChange);
    const newSales = stockTxType === 'Sale' ? selectedProduct.salesCount + stockQty : selectedProduct.salesCount;

    const updated = products.map((p) =>
      p.id === selectedProduct.id
        ? {
            ...p,
            quantity: newQty,
            salesCount: newSales,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : p
    );
    onSaveProducts(updated);

    setIsStockModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-6 rounded-2xl shadow-lg border border-teal-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Inventory & Stock Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Badeecada & Stock-ha</h1>
          <p className="text-teal-100 text-xs mt-1">
            Diiwaanka badeecadaha, Kitaabbada, agabka Dugsiga, Qiimaha, Iibka iyo Stock-ha.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-white/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Stock Report</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Ku Dar Badeeco</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Tirada Badeecadaha
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{products.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Badeecadood u duuban</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Qiimaha Stock-ha ($)
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            ${totalInventoryValue.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Total Inventory Value</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Low Stock Alert
          </span>
          <span className={`text-2xl font-black mt-1 block ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {lowStockCount}
          </span>
          <span className="text-[10px] text-rose-500 font-medium">≤ 5 xabbo ee ku dhow dhammaad</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Badeecadaha La Iibiyay
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {products.reduce((acc, p) => acc + (p.salesCount || 0), 0)}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Total Items Sold</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi koodhka, badeecada ama shirkadda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span>Warbixinta Stock-ha / Badeecada ({filteredProducts.length})</span>
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="font-bold text-sm text-slate-600">Lama helin wax badeeco ah.</p>
            <p className="text-xs">Riix "+ Ku Dar Badeeco" si aad u geliso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Badeecada (Item Name)</th>
                  <th className="p-3.5">Shirkadda (Company)</th>
                  <th className="p-3.5 text-center">Stock Qty</th>
                  <th className="p-3.5 text-right">Selling Price ($)</th>
                  <th className="p-3.5 text-right">Cost Price ($)</th>
                  <th className="p-3.5 text-center">Iibka (Sales)</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">{p.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3.5 text-slate-600">{p.companyName}</td>
                    <td className="p-3.5 text-center font-extrabold">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs inline-block ${
                          p.quantity <= 5
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.quantity} xabbo
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-700">${p.unitPrice}</td>
                    <td className="p-3.5 text-right font-bold text-slate-500">${p.costPrice || 0}</td>
                    <td className="p-3.5 text-center font-extrabold text-blue-700">{p.salesCount || 0}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenStockTx(p)}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg border border-teal-200 cursor-pointer"
                          title="Stock Adjustment / Sale / Purchase"
                        >
                          + / - Stock
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
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
                {editingProduct ? 'Wax ka Beddel Badeecada' : 'Diiwaangeli Badeeco Cusub'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Koodhka (Code) *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Kitaabbo, Notebooks"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Magaca Badeecada *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Mus'haf Tajweed, Kitaabka Axaaktaamta"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shirkadda Soo Saartay (Company)</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g., Maktabadda Al-Adfaal"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Iibka ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
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
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Badeeco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TX MODAL */}
      {isStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Beddel Stock-ha</h3>
                <p className="text-xs text-slate-500">
                  {selectedProduct.name} (Hadda: {selectedProduct.quantity} xabbo)
                </p>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockTx} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nooca Hawlgalka</label>
                <select
                  value={stockTxType}
                  onChange={(e) => setStockTxType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Purchase">Purchase (Iibso Stock cusub - Ku dar)</option>
                  <option value="Sale">Sale (Iibi badeeco - Ka yar)</option>
                  <option value="Adjustment">Adjustment (Stock Adjustment)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tirada (Quantity)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-teal-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Xaqiiji Hawlgalka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
