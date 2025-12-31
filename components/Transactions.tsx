
import React, { useState } from 'react';
import { Plus, Search, Trash2, Calendar, FileText, Download, FileSpreadsheet, FileBarChart } from 'lucide-react';
import { Transaction, Category, PatientType, TransactionType } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | TransactionType>('All');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat || !newAmount) return;
    onAdd({
      type: newType,
      category: newCat,
      amount: parseFloat(newAmount),
      date: newDate,
      patientType: newType === 'Income' ? newPatient : 'None',
      note: newNote,
    });
    setShowModal(false);
    setNewCat('');
    setNewAmount('');
    setNewNote('');
  };

  const exportToXLSX = () => {
    const data = filtered.map(t => ({
      Tanggal: t.date,
      Tipe: t.type === 'Income' ? 'Pendapatan' : 'Pengeluaran',
      Kategori: t.category,
      'Tipe Pasien': t.patientType === 'None' ? '-' : t.patientType,
      Catatan: t.note,
      Jumlah: t.amount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Transaksi");
    XLSX.writeFile(wb, `Laporan_BasmalahMedika_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Transaksi - Klinik Basmalah Medika", 14, 15);
    
    const tableData = filtered.map(t => [
      t.date,
      t.type === 'Income' ? 'Pendapatan' : 'Pengeluaran',
      t.category,
      t.patientType === 'None' ? '-' : t.patientType,
      t.note,
      formatCurrency(t.amount)
    ]);

    (doc as any).autoTable({
      head: [['Tanggal', 'Tipe', 'Kategori', 'Pasien', 'Catatan', 'Jumlah']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Laporan_BasmalahMedika_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-slate-600"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="All">Semua Tipe</option>
            <option value="Income">Pendapatan</option>
            <option value="Expense">Pengeluaran</option>
          </select>
          
          <div className="flex gap-2">
            <button 
              onClick={exportToXLSX}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              XLSX
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
            >
              <FileBarChart className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Transaksi Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Rincian</th>
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
                      <div className={`p-2 rounded-lg ${t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === 'Income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{t.note || 'Tanpa keterangan'}</p>
                        {t.type === 'Income' && (
                          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Pasien: {t.patientType}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700">{t.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {t.date}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-bold text-right ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-12 h-12 mb-4 opacity-10" />
              <p className="font-medium">Belum ada data transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="text-2xl font-bold text-slate-800">Tambah Transaksi</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setNewType('Income')}
                  className={`py-2.5 rounded-xl font-bold transition-all ${newType === 'Income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pendapatan
                </button>
                <button 
                  type="button"
                  onClick={() => setNewType('Expense')}
                  className={`py-2.5 rounded-xl font-bold transition-all ${newType === 'Expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pengeluaran
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Kategori</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-xl p-3 outline-none font-medium transition-all"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.filter(c => c.type === newType).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Jumlah (IDR)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-xl p-3 outline-none font-medium transition-all"
                    placeholder="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
              </div>

              {newType === 'Income' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Jenis Pasien</label>
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                    {['Umum', 'BPJS'].map(p => (
                      <label key={p} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="patient" 
                          checked={newPatient === p} 
                          onChange={() => setNewPatient(p as any)}
                          className="w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-xl p-3 outline-none font-medium transition-all"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Catatan</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-xl p-3 outline-none font-medium transition-all resize-none h-20"
                  placeholder="Masukkan keterangan..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ArrowUpRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
  </svg>
);

const ArrowDownRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
