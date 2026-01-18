
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
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Zap,
  Check,
  Info,
  Banknote,
  ShoppingCart,
  BarChart as BarChartIcon,
  Coins,
  FileText
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

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onBulkAdd: (bulk: Omit<Transaction, 'id'>[]) => void;
  onUpdate: (id: string, t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
  theme: AppTheme;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions = [], categories = [], onAdd, onBulkAdd, onUpdate, onDelete, theme }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | TransactionType>('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // States for Quick Inputs
  const [quickInputDate, setQuickInputDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Specific Modal Inputs
  const [modalHariIni, setModalHariIni] = useState('');
  const [modalEsokHari, setModalEsokHari] = useState('');

  // Flexible Quick Input Form
  const [qType, setQType] = useState<TransactionType>('Income');
  const [qCat, setQCat] = useState('');
  const [qAmount, setQAmount] = useState('');
  const [qNote, setQNote] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [newType, setNewType] = useState<TransactionType>('Income');
  const [newCat, setNewCat] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPatient, setNewPatient] = useState<PatientType>('Umum');
  const [newNote, setNewNote] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.note || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'All' || t.type === filterType;
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesDateStart = dateStart === '' || t.date >= dateStart;
      const matchesDateEnd = dateEnd === '' || t.date <= dateEnd;
      return matchesSearch && matchesFilter && matchesCategory && matchesDateStart && matchesDateEnd;
    });
  }, [transactions, searchTerm, filterType, filterCategory, dateStart, dateEnd]);

  const expenseChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filtered.filter(t => t.type === 'Expense').forEach(t => {
      dataMap[t.category] = (dataMap[t.category] || 0) + t.amount;
    });
    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const handleSaveModalHariIni = () => {
    const amount = parseFloat(modalHariIni);
    if (isNaN(amount) || amount <= 0) return;
    onAdd({
      type: 'Income',
      category: 'Modal Kas',
      amount,
      date: quickInputDate,
      patientType: 'None',
      note: 'Modal Hari Ini (Input Cepat)'
    });
    setModalHariIni('');
  };

  const handleSaveModalEsokHari = () => {
    const amount = parseFloat(modalEsokHari);
    if (isNaN(amount) || amount <= 0) return;
    onAdd({
      type: 'Expense',
      category: 'Modal Kas',
      amount,
      date: quickInputDate,
      patientType: 'None',
      note: 'Modal Esok Hari (Input Cepat)'
    });
    setModalEsokHari('');
  };

  const handleQuickFormSave = () => {
    const amount = parseFloat(qAmount);
    if (!qCat || isNaN(amount) || amount <= 0) return;

    onAdd({
      type: qType,
      category: qCat,
      amount,
      date: quickInputDate,
      patientType: qType === 'Income' ? 'Umum' : 'None',
      note: qNote || 'Input Cepat Panel'
    });

    setQAmount('');
    setQNote('');
    setQCat('');
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setNewCat('');
    setNewAmount('');
    setNewNote('');
    setNewType('Income');
    setNewPatient('Umum');
    setNewDate(new Date().toISOString().split('T')[0]);
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
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const bulk: Omit<Transaction, 'id'>[] = data.map((row: any) => ({
          type: row.Tipe === 'Pendapatan' ? 'Income' : 'Expense',
          category: row.Kategori || 'Lain-lain',
          amount: parseFloat(row.Jumlah) || 0,
          date: row.Tanggal || new Date().toISOString().split('T')[0],
          patientType: (row.Pasien || 'None') as PatientType,
          note: row.Catatan || ''
        }));
        
        if (bulk.length > 0) {
          onBulkAdd(bulk);
          alert(`${bulk.length} transaksi berhasil diimpor.`);
        }
      } catch (err) {
        alert('Gagal mengimpor file. Periksa format kolom Excel Anda.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) return alert("Tidak ada data untuk diekspor.");
    const ws = XLSX.utils.json_to_sheet(filtered.map(t => ({
      Tanggal: t.date,
      Tipe: t.type === 'Income' ? 'Pendapatan' : 'Pengeluaran',
      Kategori: t.category,
      'Tipe Pasien': t.patientType,
      Jumlah: t.amount,
      Catatan: t.note
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, `Laporan_Transaksi_Basmalah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const lightBgClass = theme ? `bg-${theme.secondary}` : 'bg-slate-50';
  const primaryTextClass = theme ? `text-${theme.primary}` : 'text-slate-600';
  const primaryBtnClass = theme ? `bg-${theme.primary} hover:opacity-90` : 'bg-slate-800';

  return (
    <div className="animate-in fade-in duration-500 pb-20 space-y-8">
      
      {/* QUICK INPUT PANEL REDESIGNED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MODAL HARIAN SECTION */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className={`p-6 border-b border-slate-100 flex items-center gap-3 ${lightBgClass}`}>
            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Input Modal Kas</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase italic">Setoran harian rutin</p>
            </div>
          </div>
          <div className="p-8 space-y-8 flex-1">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[11px] font-black text-slate-700 outline-none focus:bg-white focus:border-indigo-300 transition-all" 
                    value={quickInputDate} 
                    onChange={(e) => setQuickInputDate(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="group">
                    <label className="text-[10px] font-black uppercase text-emerald-600 ml-1 mb-1 block tracking-tighter">Modal Hari Ini (Pendapatan)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Rp 0"
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                        value={modalHariIni}
                        onChange={(e) => setModalHariIni(e.target.value)}
                      />
                      <button 
                        onClick={handleSaveModalHariIni}
                        disabled={!modalHariIni}
                        className={`p-3 rounded-xl transition-all shadow-md ${modalHariIni ? 'bg-emerald-500 text-white hover:scale-105' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black uppercase text-rose-600 ml-1 mb-1 block tracking-tighter">Modal Esok Hari (Pengeluaran)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Rp 0"
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:bg-white focus:border-rose-500 transition-all shadow-inner"
                        value={modalEsokHari}
                        onChange={(e) => setModalEsokHari(e.target.value)}
                      />
                      <button 
                        onClick={handleSaveModalEsokHari}
                        disabled={!modalEsokHari}
                        className={`p-3 rounded-xl transition-all shadow-md ${modalEsokHari ? 'bg-rose-500 text-white hover:scale-105' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
             </div>
             <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed italic">Catatan: Modal kas akan otomatis masuk ke kategori "Modal Kas".</p>
             </div>
          </div>
        </div>

        {/* FLEXIBLE QUICK INPUT SECTION */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Input Rutin Terpadu</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase italic">Input cepat kategori pilihan</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button 
                  onClick={() => { setQType('Income'); setQCat(''); }} 
                  className={`py-2 rounded-xl text-[11px] font-black uppercase transition-all ${qType === 'Income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                >
                  Pendapatan
                </button>
                <button 
                  onClick={() => { setQType('Expense'); setQCat(''); }} 
                  className={`py-2 rounded-xl text-[11px] font-black uppercase transition-all ${qType === 'Expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}
                >
                  Pengeluaran
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Kategori</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  value={qCat}
                  onChange={(e) => setQCat(e.target.value)}
                >
                  <option value="">-- Pilih --</option>
                  {categories.filter(c => c.type === qType).map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (IDR)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xl font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner"
                  value={qAmount}
                  onChange={(e) => setQAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div className="space-y-2 flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Catatan Tambahan
                </label>
                <textarea 
                  placeholder="Tulis keterangan transaksi di sini..."
                  className="w-full h-40 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all resize-none shadow-inner"
                  value={qNote}
                  onChange={(e) => setQNote(e.target.value)}
                />
              </div>
              
              <button 
                onClick={handleQuickFormSave}
                disabled={!qCat || !qAmount}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] ${(!qCat || !qAmount) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ANALYTICS CHART RESPONSIVE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
           <div className={`p-4 ${lightBgClass} rounded-[1.5rem]`}><BarChartIcon className={`w-6 h-6 ${primaryTextClass}`} /></div>
           <div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Analisa Pengeluaran Periode</h3>
              <p className="text-xs text-slate-400 font-medium italic">Data grafik menyesuaikan filter rentang waktu dan kategori di bawah</p>
           </div>
        </div>
        <div className="h-80 w-full">
           {expenseChartData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart layout="vertical" data={expenseChartData} margin={{ left: 50, right: 150, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} formatter={(v: any) => formatCurrency(v)} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[0, 10, 10, 0]} barSize={28}>
                    <LabelList dataKey="value" position="right" formatter={(v: any) => formatCurrency(v)} style={{ fontSize: '10px', fontWeight: '900', fill: '#1e293b' }} offset={12} />
                    {expenseChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#e11d48' : '#f43f5e'} />)}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
               <BarChartIcon className="w-12 h-12 opacity-5 mb-2" />
               <p className="text-xs font-black uppercase tracking-widest">Tidak ada pengeluaran di periode ini</p>
             </div>
           )}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari Catatan atau Kategori..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner border border-slate-200">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => uploadInputRef.current?.click()} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-200 shadow-sm"><Upload className="w-4 h-4" /> Impor</button>
            <input type="file" ref={uploadInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm"><FileSpreadsheet className="w-4 h-4" /> Ekspor</button>
            <button onClick={handleOpenAdd} className={`flex items-center gap-2 ${primaryBtnClass} text-white px-8 py-3 rounded-2xl font-extrabold shadow-lg transition-all active:scale-95`}><Plus className="w-5 h-5" /> Baru</button>
          </div>
        </div>

        {/* COMPREHENSIVE FILTER BAR */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-wrap items-center gap-6 shadow-sm">
           <div className="flex items-center gap-3 border-r border-slate-100 pr-4">
             <Filter className={`w-4 h-4 ${primaryTextClass}`} />
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter Data</span>
           </div>
           
           <div className="flex flex-wrap items-center gap-4">
             <select 
               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500/30 transition-all" 
               value={filterType} 
               onChange={(e) => setFilterType(e.target.value as any)}
             >
               <option value="All">Semua Tipe</option>
               <option value="Income">Pendapatan</option>
               <option value="Expense">Pengeluaran</option>
             </select>

             <select 
               className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500/30 transition-all" 
               value={filterCategory} 
               onChange={(e) => setFilterCategory(e.target.value)}
             >
                <option value="All">Semua Kategori</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
             </select>

             <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                <input 
                  type="date" 
                  className="bg-transparent text-[10px] font-black outline-none px-2 py-1" 
                  value={dateStart} 
                  onChange={(e) => setDateStart(e.target.value)} 
                />
                <span className="text-slate-300 font-bold">s/d</span>
                <input 
                  type="date" 
                  className="bg-transparent text-[10px] font-black outline-none px-2 py-1" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)} 
                />
             </div>

             {(dateStart || dateEnd || filterType !== 'All' || filterCategory !== 'All') && (
               <button 
                 onClick={() => { setDateStart(''); setDateEnd(''); setFilterType('All'); setFilterCategory('All'); setSearchTerm(''); }} 
                 className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
               >
                 <X className="w-3.5 h-3.5" /> Bersihkan
               </button>
             )}
           </div>
        </div>
      </div>

      {/* RESULTS LIST */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative flex flex-col justify-between h-full">
               <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'Income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               <div>
                 <p className={`text-[10px] font-black uppercase ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'} mb-1`}>{t.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}</p>
                 <h4 className="font-black text-slate-900 leading-tight mb-2">{t.category}</h4>
                 <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed">{t.note || 'Tidak ada catatan'}</p>
               </div>
               <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-4">
                 <p className={`text-lg font-black ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</p>
                 <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{t.date}</span>
               </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-300">
               <BarChartIcon className="w-16 h-16 mx-auto mb-4 opacity-5" />
               <p className="text-sm font-black uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
               <p className="text-xs mt-2 italic">Cobalah menyesuaikan filter atau kata kunci pencarian Anda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-8 py-6">Kategori</th>
                <th className="px-6 py-6">Catatan / Informasi</th>
                <th className="px-6 py-6">Tanggal</th>
                <th className="px-6 py-6 text-right">Jumlah</th>
                <th className="px-8 py-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${t.type === 'Income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-sm text-slate-900">{t.note || '-'}</td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500">{t.date}</td>
                  <td className={`px-6 py-6 font-black text-right ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleOpenEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{editId ? 'Ubah Data' : 'Transaksi Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button type="button" onClick={() => setNewType('Income')} className={`py-2.5 rounded-xl font-black transition-all ${newType === 'Income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Pendapatan</button>
                <button type="button" onClick={() => setNewType('Expense')} className={`py-2.5 rounded-xl font-black transition-all ${newType === 'Expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>Pengeluaran</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                  <select required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold outline-none transition-all" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                    <option value="">Pilih...</option>
                    {categories.filter(c => c.type === newType).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Jumlah (IDR)</label>
                  <input required type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold outline-none transition-all" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                <input type="date" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl p-4 font-bold outline-none" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Catatan Tambahan</label>
                <input type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold outline-none" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              </div>
              <button type="submit" className={`w-full ${primaryBtnClass} text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-[0.98]`}>{editId ? 'SIMPAN PERUBAHAN' : 'TAMBAH TRANSAKSI'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
