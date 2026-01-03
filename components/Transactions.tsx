
import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileBarChart, 
  Edit2, 
  X, 
  Upload,
  LayoutGrid,
  List,
  MoreVertical,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Transaction, Category, PatientType, TransactionType, AppTheme } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onBulkAdd: (bulk: Omit<Transaction, 'id'>[]) => void;
  onUpdate: (id: string, t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
  theme: AppTheme;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onAdd, onBulkAdd, onUpdate, onDelete, theme }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | TransactionType>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  // State for Editing
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [newType, setNewType] = useState<TransactionType>('Income');
  const [newCat, setNewCat] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPatient, setNewPatient] = useState<PatientType>('Umum');
  const [newNote, setNewNote] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const filtered = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.note.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setEditId(null);
    setNewCat('');
    setNewAmount('');
    setNewNote('');
    setNewType('Income');
    setNewPatient('Umum');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditId(t.id);
    setNewType(t.type);
    setNewCat(t.category);
    setNewAmount(t.amount.toString());
    setNewDate(t.date);
    setNewPatient(t.patientType);
    setNewNote(t.note);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat || !newAmount) return;
    
    const transactionData = {
      type: newType,
      category: newCat,
      amount: parseFloat(newAmount),
      date: newDate,
      patientType: newType === 'Income' ? newPatient : 'None',
      note: newNote,
    };

    if (editId) {
      onUpdate(editId, transactionData);
    } else {
      onAdd(transactionData);
    }

    setShowModal(false);
    resetForm();
  };

  const downloadTemplate = () => {
    const templateData = [
      { Tanggal: "2023-12-01", Tipe: "Pendapatan", Kategori: "Layanan Rawat Inap", Pasien: "Umum", Jumlah: 500000, Catatan: "Keterangan" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Basmalah.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const bulkData: Omit<Transaction, 'id'>[] = data.map((row: any) => ({
        date: row.Tanggal || new Date().toISOString().split('T')[0],
        type: row.Tipe === 'Pendapatan' ? 'Income' : 'Expense',
        category: row.Kategori || 'Lain-lain',
        patientType: (row.Pasien || 'None') as PatientType,
        amount: parseFloat(row.Jumlah) || 0,
        note: row.Catatan || ''
      }));
      if (bulkData.length > 0) onBulkAdd(bulkData);
    };
    reader.readAsBinaryString(file);
  };

  const exportToXLSX = () => {
    const data = filtered.map(t => ({ Tanggal: t.date, Tipe: t.type, Kategori: t.category, Pasien: t.patientType, Jumlah: t.amount, Catatan: t.note }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_Transaksi.xlsx`);
  };

  const primaryBtnClass = `bg-${theme.primary} hover:bg-${theme.accent}`;
  const lightBgClass = `bg-${theme.secondary}`;
  const primaryTextClass = `text-${theme.primary}`;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-6 mb-8">
        {/* Top Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari transaksi..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="All">Semua Tipe</option>
              <option value="Income">Pendapatan</option>
              <option value="Expense">Pengeluaran</option>
            </select>
            
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <button 
              onClick={() => uploadInputRef.current?.click()}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-200"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <input type="file" ref={uploadInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            <button 
              onClick={handleOpenAdd}
              className={`flex items-center gap-2 ${primaryBtnClass} text-white px-8 py-3 rounded-2xl font-extrabold shadow-lg transition-all`}
            >
              <Plus className="w-5 h-5" />
              Baru
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full">
               <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'Income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>

               <div>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'} mb-1`}>
                   {t.type === 'Income' ? 'Pendapatan' : 'Pengeluaran'}
                 </p>
                 <h4 className="font-black text-slate-900 leading-tight mb-2">{t.category}</h4>
                 <p className="text-xs text-slate-400 line-clamp-2 min-h-[2.5rem] mb-4">{t.note || 'Tanpa catatan'}</p>
               </div>

               <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</p>
                    <p className={`text-lg font-black ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(t.amount)}
                    </p>
                 </div>
                 {t.patientType !== 'None' && (
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
                      {t.patientType}
                    </span>
                 )}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-4">Informasi</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type === 'Income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{t.note || 'Keterangan Kosong'}</p>
                          {t.patientType !== 'None' && <span className="text-[10px] font-bold text-slate-400 uppercase">Pasien: {t.patientType}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {t.date}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-black text-right ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center text-slate-300">
          <FileText className="w-16 h-16 mb-4 opacity-10" />
          <p className="font-black text-lg uppercase tracking-widest">Data Tidak Ditemukan</p>
          <p className="text-sm">Coba ubah kata kunci pencarian atau filter tipe transaksi.</p>
        </div>
      )}

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <h3 className="text-2xl font-black text-slate-800">{editId ? 'Ubah Data' : 'Tambah Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setNewType('Income')}
                  className={`py-2.5 rounded-xl font-black transition-all ${newType === 'Income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pendapatan
                </button>
                <button 
                  type="button"
                  onClick={() => setNewType('Expense')}
                  className={`py-2.5 rounded-xl font-black transition-all ${newType === 'Expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pengeluaran
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Kategori</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 outline-none font-bold transition-all"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  >
                    <option value="">Pilih...</option>
                    {categories.filter(c => c.type === newType).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Jumlah (IDR)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 outline-none font-bold transition-all"
                    placeholder="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
              </div>

              {newType === 'Income' && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tipe Pasien</label>
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                    {['Umum', 'BPJS'].map(p => (
                      <label key={p} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="patient" 
                          checked={newPatient === p} 
                          onChange={() => setNewPatient(p as any)}
                          className={`w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300`}
                        />
                        <span className="text-sm font-black text-slate-600 group-hover:text-slate-900">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tanggal</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 outline-none font-bold transition-all"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Keterangan / Catatan</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 outline-none font-bold transition-all resize-none h-24"
                  placeholder="Masukkan detail transaksi..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className={`w-full ${primaryBtnClass} text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-100`}
              >
                {editId ? 'PERBARUI DATA' : 'SIMPAN TRANSAKSI'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
