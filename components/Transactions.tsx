
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  FileSpreadsheet, 
  Edit2, 
  X, 
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Zap,
  Check,
  Coins,
  FileText,
  BarChart as BarChartIcon,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from 'recharts';
import { Transaction, Category, PatientType, TransactionType, AppTheme } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onBulkAdd: (bulk: Omit<Transaction, 'id'>[]) => void;
  onUpdate: (id: string, t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
  theme: AppTheme;
}

export const Transactions: React.FC<TransactionsProps> = ({ 
  transactions = [], 
  categories = [], 
  onAdd, 
  onBulkAdd, 
  onUpdate, 
  onDelete, 
  theme 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNote, setFilterNote] = useState('');
  const [filterType, setFilterType] = useState<'All' | TransactionType>('All');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const [quickInputDate, setQuickInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalHariIni, setModalHariIni] = useState('');
  const [modalEsokHari, setModalEsokHari] = useState('');

  const [qType, setQType] = useState<TransactionType>('Income');
  const [qCat, setQCat] = useState('');
  const [qAmount, setQAmount] = useState('');
  const [qNote, setQNote] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const expenseChartRef = useRef<HTMLDivElement>(null);

  const [newType, setNewType] = useState<TransactionType>('Income');
  const [newCat, setNewCat] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPatient, setNewPatient] = useState<PatientType>('Umum');
  const [newNote, setNewNote] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const filtered = useMemo(() => {
    const data = Array.isArray(transactions) ? transactions : [];
    return data.filter(t => {
      if (!t) return false;
      const matchesSearch = (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNote = (t.note || '').toLowerCase().includes(filterNote.toLowerCase());
      const matchesFilter = filterType === 'All' || t.type === filterType;
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesDateStart = !dateStart || t.date >= dateStart;
      const matchesDateEnd = !dateEnd || t.date <= dateEnd;
      return matchesSearch && matchesNote && matchesFilter && matchesCategory && matchesDateStart && matchesDateEnd;
    });
  }, [transactions, searchTerm, filterNote, filterType, filterCategory, dateStart, dateEnd]);

  const expenseChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filtered.filter(t => t.type === 'Expense').forEach(t => {
      dataMap[t.category] = (dataMap[t.category] || 0) + (t.amount || 0);
    });
    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const exportChartToPDF = async () => {
    if (!expenseChartRef.current) return;
    try {
      const canvas = await html2canvas(expenseChartRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.text("Analisa Biaya per Kategori", 10, 10);
      pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, pdfHeight);
      pdf.save(`Analisa_Pengeluaran_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Gagal export PDF", err);
    }
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
    const amountVal = parseFloat(newAmount);
    if (!newCat || isNaN(amountVal)) return;

    const data: Omit<Transaction, 'id'> = {
      type: newType,
      category: newCat,
      amount: amountVal,
      date: newDate,
      patientType: newType === 'Income' ? newPatient : 'None',
      note: newNote || ''
    };

    if (editId) {
      onUpdate(editId, data);
    } else {
      onAdd(data);
    }
    
    setShowModal(false);
    setEditId(null);
  };

  const handleQuickFormSave = () => {
    const amountVal = parseFloat(qAmount);
    if (!qCat || isNaN(amountVal) || amountVal <= 0) return;
    onAdd({
      type: qType,
      category: qCat,
      amount: amountVal,
      date: quickInputDate,
      patientType: qType === 'Income' ? 'Umum' : 'None',
      note: qNote || 'Input Cepat'
    });
    setQAmount(''); setQNote(''); setQCat('');
  };

  const handleSaveModalHariIni = () => {
    const amount = parseFloat(modalHariIni);
    if (isNaN(amount) || amount <= 0) return;
    onAdd({ type: 'Income', category: 'Modal Kas', amount, date: quickInputDate, patientType: 'None', note: 'Modal Hari Ini (Pendapatan)' });
    setModalHariIni('');
  };

  const handleSaveModalEsokHari = () => {
    const amount = parseFloat(modalEsokHari);
    if (isNaN(amount) || amount <= 0) return;
    onAdd({ type: 'Expense', category: 'Modal Kas', amount, date: quickInputDate, patientType: 'None', note: 'Modal Esok Hari (Pengeluaran)' });
    setModalEsokHari('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const bulk = data.map((row: any) => ({
          type: (row.Tipe === 'Pendapatan' || row.type === 'Income') ? 'Income' : 'Expense',
          category: row.Kategori || row.category || 'Lainnya',
          amount: parseFloat(row.Jumlah || row.amount) || 0,
          date: row.Tanggal || row.date || new Date().toISOString().split('T')[0],
          patientType: (row.Pasien || row.patientType || 'None') as PatientType,
          note: row.Catatan || row.note || ''
        }));
        onBulkAdd(bulk);
        alert(`Berhasil mengimpor ${bulk.length} transaksi.`);
      } catch (err) { alert('Format file tidak didukung.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    const data = filtered.map(t => ({
      Tanggal: t.date,
      Tipe: t.type === 'Income' ? 'Pendapatan' : 'Pengeluaran',
      Kategori: t.category,
      'Tipe Pasien': t.patientType,
      Jumlah: t.amount,
      Catatan: t.note
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const lightBgClass = theme?.secondary ? `bg-${theme.secondary}` : 'bg-emerald-50';
  const primaryTextClass = theme?.primary ? `text-${theme.primary}` : 'text-emerald-600';
  const primaryBtnClass = theme?.primary ? `bg-${theme.primary} hover:opacity-90` : 'bg-slate-800';

  return (
    <div className="animate-in fade-in duration-500 pb-20 space-y-8">
      {/* SECTION 1: MODAL KAS & QUICK INPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
             <div className={`p-3 rounded-2xl ${lightBgClass} ${primaryTextClass}`}><Coins className="w-5 h-5" /></div>
             <h3 className="text-sm font-black uppercase tracking-widest">Input Modal Kas</h3>
          </div>
          <div className="space-y-6 flex-1">
            <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black" value={quickInputDate} onChange={(e) => setQuickInputDate(e.target.value)} />
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-emerald-600 ml-1 mb-1 block">Modal Hari Ini (Pendapatan)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Rp 0" className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black" value={modalHariIni} onChange={(e) => setModalHariIni(e.target.value)} />
                  <button onClick={handleSaveModalHariIni} className="p-3 bg-emerald-500 text-white rounded-xl shadow-md active:scale-95"><Check className="w-5 h-5" /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-rose-600 ml-1 mb-1 block">Modal Esok Hari (Pengeluaran)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Rp 0" className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black" value={modalEsokHari} onChange={(e) => setModalEsokHari(e.target.value)} />
                  <button onClick={handleSaveModalEsokHari} className="p-3 bg-rose-500 text-white rounded-xl shadow-md active:scale-95"><Check className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className={`p-3 rounded-2xl ${lightBgClass} ${primaryTextClass}`}><Zap className="w-5 h-5" /></div>
               <h3 className="text-sm font-black uppercase tracking-widest">Input Cepat</h3>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setQType('Income')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${qType === 'Income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Pendapatan</button>
               <button onClick={() => setQType('Expense')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${qType === 'Expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}>Pengeluaran</button>
            </div>
            <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold" value={qCat} onChange={(e) => setQCat(e.target.value)}>
              <option value="">Pilih Kategori...</option>
              {categories.filter(c => c.type === qType).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input type="number" placeholder="Jumlah (Rp)" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-black" value={qAmount} onChange={(e) => setQAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-4 justify-end">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan</label>
            <textarea placeholder="Keterangan transaksi..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold resize-none" value={qNote} onChange={(e) => setQNote(e.target.value)} />
            <button onClick={handleQuickFormSave} className={`w-full py-3 rounded-xl font-black text-xs text-white shadow-lg active:scale-95 ${primaryBtnClass}`}>SIMPAN TRANSAKSI</button>
          </div>
        </div>
      </div>

      {/* SECTION 2: GRAFIK PENGELUARAN DENGAN TOMBOL PDF */}
      <div ref={expenseChartRef} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group/card">
        <button onClick={exportChartToPDF} className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 opacity-0 group-hover/card:opacity-100 transition-opacity z-10 hover:bg-white hover:text-indigo-600 shadow-sm"><Download className="w-4 h-4"/></button>
        <div className="flex items-center gap-4 mb-8">
           <div className={`p-4 ${lightBgClass} rounded-[1.5rem]`}><BarChartIcon className={`w-6 h-6 ${primaryTextClass}`} /></div>
           <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Analisa Biaya per Kategori</h3>
            <p className="text-xs text-slate-400 italic">Distribusi pengeluaran berdasarkan data filter</p>
           </div>
        </div>
        <div className="h-80 w-full">
           {expenseChartData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart layout="vertical" data={expenseChartData} margin={{ left: 20, right: 80, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} width={120} />
                  <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: any) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[0, 10, 10, 0]} barSize={28}>
                    <LabelList dataKey="value" position="right" formatter={(v: any) => formatCurrency(v)} style={{ fontSize: '10px', fontWeight: '900', fill: '#1e293b' }} offset={10} />
                    {expenseChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#e11d48' : '#f43f5e'} />)}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex items-center justify-center text-slate-300 italic text-xs uppercase tracking-widest">Tidak ada pengeluaran untuk ditampilkan</div>
           )}
        </div>
      </div>

      {/* SECTION 3: TOOLBAR & FILTER */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari kategori..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition-all font-medium text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Filter Catatan..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white transition-all font-medium text-sm" value={filterNote} onChange={(e) => setFilterNote(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => uploadInputRef.current?.click()} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-bold text-xs"><Upload className="w-4 h-4" /> Impor XLSX</button>
             <input type="file" ref={uploadInputRef} className="hidden" accept=".xlsx" onChange={handleFileUpload} />
             <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-bold text-xs"><FileSpreadsheet className="w-4 h-4" /> Ekspor XLSX</button>
             <button onClick={() => { setEditId(null); setShowModal(true); }} className={`flex items-center gap-2 ${primaryBtnClass} text-white px-8 py-3 rounded-2xl font-extrabold shadow-lg active:scale-95 transition-all`}><Plus className="w-5 h-5" /> Baru</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
           <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
              <span className="text-slate-300 font-bold">-</span>
              <input type="date" className="bg-transparent text-[10px] font-black outline-none" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
           </div>
           <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
              <option value="All">Semua Tipe</option>
              <option value="Income">Pendapatan</option>
              <option value="Expense">Pengeluaran</option>
           </select>
           <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="All">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
           </select>
           {(dateStart || dateEnd || filterType !== 'All' || filterCategory !== 'All' || filterNote !== '') && (
             <button onClick={() => { setDateStart(''); setDateEnd(''); setFilterType('All'); setFilterCategory('All'); setFilterNote(''); setSearchTerm(''); }} className="text-xs font-bold text-rose-500 hover:underline">Reset Filter</button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group flex flex-col justify-between">
             <div>
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
                 <p className={`text-[10px] font-black uppercase ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'} mb-1`}>{t.type === 'Income' ? 'Pendapatan' : 'Pengeluaran'}</p>
                 <h4 className="font-black text-slate-900 mb-1 truncate">{t.category}</h4>
                 <p className="text-[10px] text-slate-400 italic mb-4 line-clamp-3">{t.note || 'Tidak ada catatan'}</p>
               </div>
             </div>
             <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
               <p className={`text-lg font-black ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</p>
               <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{t.date}</span>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6">{editId ? 'Edit Transaksi' : 'Transaksi Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button type="button" onClick={() => setNewType('Income')} className={`py-2 rounded-lg font-black text-xs transition-all ${newType === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>PENDAPATAN</button>
                <button type="button" onClick={() => setNewType('Expense')} className={`py-2 rounded-lg font-black text-xs transition-all ${newType === 'Expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>PENGELUARAN</button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori</label>
                <select required className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                  <option value="">Pilih Kategori...</option>
                  {categories.filter(c => c.type === newType).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Jumlah (IDR)</label>
                <input required type="number" placeholder="0" className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal</label>
                <input type="date" className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catatan</label>
                <input type="text" placeholder="Keterangan..." className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              </div>
              <button type="submit" className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase shadow-xl active:scale-95 transition-all mt-4 ${primaryBtnClass}`}>SIMPAN TRANSAKSI</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
