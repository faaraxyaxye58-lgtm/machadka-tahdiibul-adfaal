import React, { useState, useMemo } from 'react';
import { BookItem, AmaanoRecord, User, SchoolSettings } from '../types';
import {
  Library,
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  X,
  UserCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface BooksAmaanoViewProps {
  currentUser?: User | null;
  settings: SchoolSettings;
  books: BookItem[];
  amaanoRecords: AmaanoRecord[];
  onSaveBooks: (updated: BookItem[]) => void;
  onSaveAmaanoRecords: (updated: AmaanoRecord[]) => void;
}

export const BooksAmaanoView: React.FC<BooksAmaanoViewProps> = ({
  currentUser,
  settings,
  books,
  amaanoRecords,
  onSaveBooks,
  onSaveAmaanoRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'amaano'>('books');
  const [searchTerm, setSearchTerm] = useState('');

  // Book Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [bookQty, setBookQty] = useState<number>(10);

  // Amaano Modal
  const [isAmaanoModalOpen, setIsAmaanoModalOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerRole, setBorrowerRole] = useState<'Student' | 'Teacher' | 'Parent' | 'Staff' | 'External'>('Student');
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDateExpected, setReturnDateExpected] = useState('');

  const filteredBooks = useMemo(() => {
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [books, searchTerm]);

  const filteredAmaano = useMemo(() => {
    return amaanoRecords.filter(
      (a) =>
        a.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.borrowerPhone.includes(searchTerm)
    );
  }, [amaanoRecords, searchTerm]);

  const totalBooksCount = useMemo(() => books.reduce((acc, b) => acc + b.quantity, 0), [books]);
  const totalBorrowedCount = useMemo(() => amaanoRecords.filter((a) => a.status === 'Borrowed').length, [amaanoRecords]);

  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookTitle('');
    setBookAuthor('Macallin Au');
    setBookCategory("Qur'aan & Tajwiid");
    setBookQty(10);
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (b: BookItem) => {
    setEditingBook(b);
    setBookTitle(b.title);
    setBookAuthor(b.author || '');
    setBookCategory(b.category || '');
    setBookQty(b.quantity);
    setIsBookModalOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      alert('Fadlan geli magaca buugga.');
      return;
    }

    if (editingBook) {
      const updated = books.map((b) =>
        b.id === editingBook.id
          ? {
              ...b,
              title: bookTitle.trim(),
              author: bookAuthor.trim(),
              category: bookCategory.trim(),
              quantity: Number(bookQty),
              availableCount: Math.max(0, Number(bookQty) - b.borrowedCount),
            }
          : b
      );
      onSaveBooks(updated);
    } else {
      const newBook: BookItem = {
        id: `bk-${Date.now()}`,
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category: bookCategory.trim(),
        quantity: Number(bookQty),
        borrowedCount: 0,
        availableCount: Number(bookQty),
      };
      onSaveBooks([...books, newBook]);
    }
    setIsBookModalOpen(false);
  };

  const handleDeleteBook = (id: string, title: string) => {
    if (confirm(`Ma hubtaa inaad tirtirto buugga ${title}?`)) {
      onSaveBooks(books.filter((b) => b.id !== id));
    }
  };

  const handleOpenAddAmaano = () => {
    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerRole('Student');
    setSelectedBookTitle(books[0]?.title || '');
    setBorrowDate(new Date().toISOString().split('T')[0]);

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);
    setReturnDateExpected(expDate.toISOString().split('T')[0]);

    setIsAmaanoModalOpen(true);
  };

  const handleSaveAmaano = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !selectedBookTitle.trim()) {
      alert('Fadlan geli magaca qofka iyo buugga amaanada.');
      return;
    }

    const newAmaano: AmaanoRecord = {
      id: `amn-${Date.now()}`,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim(),
      borrowerRole: borrowerRole,
      bookTitle: selectedBookTitle.trim(),
      borrowDate: borrowDate,
      returnDateExpected: returnDateExpected,
      status: 'Borrowed',
    };

    onSaveAmaanoRecords([newAmaano, ...amaanoRecords]);

    // Increment book borrowed count
    const updatedBooks = books.map((b) =>
      b.title.toLowerCase() === selectedBookTitle.toLowerCase()
        ? {
            ...b,
            borrowedCount: b.borrowedCount + 1,
            availableCount: Math.max(0, b.availableCount - 1),
          }
        : b
    );
    onSaveBooks(updatedBooks);

    setIsAmaanoModalOpen(false);
  };

  const handleReturnAmaano = (id: string) => {
    const target = amaanoRecords.find((a) => a.id === id);
    if (!target) return;

    const updatedRecords = amaanoRecords.map((a) =>
      a.id === id
        ? {
            ...a,
            status: 'Returned' as const,
            returnDateActual: new Date().toISOString().split('T')[0],
          }
        : a
    );
    onSaveAmaanoRecords(updatedRecords);

    // Decrement book borrowed count
    const updatedBooks = books.map((b) =>
      b.title.toLowerCase() === target.bookTitle.toLowerCase()
        ? {
            ...b,
            borrowedCount: Math.max(0, b.borrowedCount - 1),
            availableCount: b.availableCount + 1,
          }
        : b
    );
    onSaveBooks(updatedBooks);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white p-6 rounded-2xl shadow-lg border border-amber-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-300 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider mb-2">
            <Library className="w-3.5 h-3.5" />
            <span>Library & Borrowed Items Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Maktabada Buugaagta & Amaanada</h1>
          <p className="text-amber-100 text-xs mt-1">
            Diiwaangelinta buugaagta, qaatayaasha amaanada, taariikhda soo celinta iyo xaaladdooda.
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
          {activeTab === 'books' ? (
            <button
              onClick={handleOpenAddBook}
              className="px-4 py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Ku Dar Buug</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddAmaano}
              className="px-4 py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Diiwaangeli Amaano</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'books'
              ? 'bg-[#0e7a48] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Buugaagta ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('amaano')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'amaano'
              ? 'bg-[#0e7a48] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Amaano & Diiwaanka ({amaanoRecords.length})</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Tirada Buugaagta
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalBooksCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">Guud ahaan Maktabada</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Buugaagta Amaanada ah
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{totalBorrowedCount}</span>
          <span className="text-[10px] text-amber-600 font-medium">Hadda gacanta lagu hayo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Available Books
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {books.reduce((acc, b) => acc + b.availableCount, 0)}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Loo diyaariyay akhriska</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[11px] font-bold block uppercase tracking-wider">
            Soo Celiyeen
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {amaanoRecords.filter((a) => a.status === 'Returned').length}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Diiwaanka la soo celiyay</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'books' ? 'Raadi buugga, qoraaga...' : 'Raadi qofka qaatay, buugga...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
      </div>

      {/* TAB 1: BOOKS */}
      {activeTab === 'books' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>Diiwaanka Buugaagta Maktabada ({filteredBooks.length})</span>
            </h3>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="font-bold text-sm text-slate-600">Lama helin wax buug ah.</p>
              <p className="text-xs">Riix "+ Ku Dar Buug" si aad u geliso.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Magaca Buugga (Title)</th>
                    <th className="p-3.5">Qoraaga (Author)</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-center">Tirada Guud</th>
                    <th className="p-3.5 text-center">Amaano (Borrowed)</th>
                    <th className="p-3.5 text-center">Available</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-900">{b.title}</td>
                      <td className="p-3.5 text-slate-600">{b.author || '—'}</td>
                      <td className="p-3.5 text-slate-600">{b.category || '—'}</td>
                      <td className="p-3.5 text-center font-bold">{b.quantity}</td>
                      <td className="p-3.5 text-center font-bold text-amber-700">{b.borrowedCount}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">{b.availableCount}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditBook(b)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(b.id, b.title)}
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
      )}

      {/* TAB 2: AMAANO */}
      {activeTab === 'amaano' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Diiwaanka Amaanada & Borrowed Items ({filteredAmaano.length})</span>
            </h3>
          </div>

          {filteredAmaano.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Clock className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="font-bold text-sm text-slate-600">Lama helin wax amaano ah.</p>
              <p className="text-xs">Riix "+ Diiwaangeli Amaano" si aad u geliso.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Qofka Qaatay (Borrower)</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Buugga (Item)</th>
                    <th className="p-3.5 text-center">Taariikhda Qaadashada</th>
                    <th className="p-3.5 text-center">Khadka Soo Celinta</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredAmaano.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-900">
                        <div>{a.borrowerName}</div>
                        {a.borrowerPhone && <div className="text-[10px] text-slate-500">{a.borrowerPhone}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {a.borrowerRole}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-900">{a.bookTitle}</td>
                      <td className="p-3.5 text-center text-slate-600">{a.borrowDate}</td>
                      <td className="p-3.5 text-center font-bold text-slate-700">{a.returnDateExpected}</td>
                      <td className="p-3.5 text-center font-bold">
                        {a.status === 'Borrowed' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px]">
                            ⌛ Qaatay (Borrowed)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px]">
                            ✅ Soo Celiyay
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {a.status === 'Borrowed' && (
                          <button
                            onClick={() => handleReturnAmaano(a.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer"
                          >
                            ✓ Soo Celiyay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BOOK MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingBook ? 'Wax ka Beddel Buug' : 'Diiwaangeli Buug Cusub'}
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Magaca Buugga *</label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g., Axaaktaamta Tajwiidka"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Qoraaga (Author)</label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="e.g., Sheekh Axmed"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    placeholder="Qur'aan, Tajwiid"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tirada (Quantity) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bookQty}
                    onChange={(e) => setBookQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Buugga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AMAANO MODAL */}
      {isAmaanoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Diiwaangeli Qaadasho Amaano</h3>
              <button
                onClick={() => setIsAmaanoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAmaano} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Magaca Qofka Qaatay *</label>
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="e.g., Yahye Cabdi Maxamed"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone-ka</label>
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder="+25261..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={borrowerRole}
                    onChange={(e) => setBorrowerRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Parent">Parent</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Buugga (Book Title) *</label>
                <select
                  value={selectedBookTitle}
                  onChange={(e) => setSelectedBookTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-900"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.title}>
                      {b.title} (Available: {b.availableCount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Taariikhda Qaadashada</label>
                  <input
                    type="date"
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khadka Soo Celinta</label>
                  <input
                    type="date"
                    value={returnDateExpected}
                    onChange={(e) => setReturnDateExpected(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAmaanoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kansal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Kaydi Amaanada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
