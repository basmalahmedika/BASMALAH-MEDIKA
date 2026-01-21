
import React, { useMemo, useState, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart,
  Line,
  Cell,
  LabelList
} from 'recharts';
import { 
  Briefcase, 
  TrendingUp, 
  Activity,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Download,
  FileText,
  Upload,
  Calendar,
  Printer,
  Edit2
} from 'lucide-react';
import { SummaryStats, Transaction, PatientDailyStat, BalanceItem, AppTheme, TransactionType } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalyticsProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  balanceItems: BalanceItem[];
  onUpdateBalance: (id: string, item: Partial<BalanceItem>) => void;
  onAddBalance: (item: Omit<BalanceItem, 'id'>) => void;
  onDeleteBalance: (id: string) => void;
  onBulkAdd: (bulk: Omit<Transaction, 'id'>[]) => void;
  theme: AppTheme;
}

type ReportType = 'balance-sheet' | 'profit-loss';

export const Analytics: React.FC<AnalyticsProps> = ({ 
  stats, transactions = [], patientStats = [], balanceItems = [], onUpdateBalance, onAddBalance, onDeleteBalance, onBulkAdd, theme 
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceModalType, setBalanceModalType] = useState<'Asset' | 'Liability' | 'Equity'>('Asset');
  const [balanceIdToEdit, setBalanceIdToEdit] = useState<string | null>(null);
  const [balanceName, setBalanceName] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  
  const reportRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [trendStartDate, setTrendStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [trendEndDate, setTrendEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const monthlyComparisonData = useMemo(() => {
    const data = [];
    const start = new Date(trendStartDate);
    const end = new Date(trendEndDate);
    let curr = new Date(start.getFullYear(), start.getMonth(), 1);

    while (curr <= end) {
      const monthKey = curr.toISOString().substring(0, 7);
      const label = curr.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      let income = 0, expense = 0;
      (Array.isArray(transactions) ? transactions : []).forEach(t => {
        if (t && t.date && t.date.startsWith(monthKey)) {
          if (t.type === 'Income') income += (t.amount || 0);
          else expense += (t.amount || 0);
        }
      });
      data.push({ monthKey, label, Income: income, Expense: expense, NetProfit: income - expense, Tax: income * 0.005 });
      curr.setMonth(curr.getMonth() + 1);
    }
    return data;
  }, [transactions, trendStartDate, trendEndDate]);

  const detailedReport = useMemo(() => {
    const filteredTx = transactions.filter(t => t.date >= trendStartDate && t.date <= trendEndDate);
    const groupByCategory = (type: TransactionType) => {
      const grouped: Record<string, number> = {};
      filteredTx.filter(t => t.type === type).forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + (t.amount || 0); });
      return Object.entries(grouped).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    };
    const incomeDetails = groupByCategory('Income');
    const expenseDetails = groupByCategory('Expense');
    const totalIncome = incomeDetails.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenseDetails.reduce((sum, item) => sum + item.amount, 0);
    return { incomeDetails, expenseDetails, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
  }, [transactions, trendStartDate, trendEndDate]);

  const exportTrendChartToPDF = async () => {
    if (!trendChartRef.current) return;
    try {
      const canvas = await html2canvas(trendChartRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.text("Tren Laba Bersih 6 Bulan", 10, 10);
      pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, pdfHeight);
      pdf.save(`Tren_Laba_Medika_${new Date().getFullYear()}.pdf`);
    } catch (err) { console.error(err); }
  };

  const handleOpenBalanceModal = (type: 'Asset' | 'Liability' | 'Equity', item?: BalanceItem) => {
    setBalanceModalType(type);
    if (item) { setBalanceIdToEdit(item.id); setBalanceName(item.name); setBalanceAmount(item.amount.toString()); setBalanceModalType(item.category); }
    else { setBalanceIdToEdit(null); setBalanceName(''); setBalanceAmount(''); }
    setShowBalanceModal(true);
  };

  const handleSaveBalanceItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(balanceAmount);
    if (!balanceName || isNaN(amount)) return;
    if (balanceIdToEdit) onUpdateBalance(balanceIdToEdit, { name: balanceName, amount, category: balanceModalType });
    else onAddBalance({ name: balanceName, amount, category: balanceModalType });
    setShowBalanceModal(false);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Laba_Rugi_${trendStartDate}_${trendEndDate}.pdf`);
    } catch (err) { console.error(err); }
  };

  const handleDownloadXLSX = () => {
    const wb = XLSX.utils.book_new();
    const rows = [["LAPORAN LABA RUGI"], [`Periode: ${trendStartDate} s/d ${trendEndDate}`], [""], ["PENDAPATAN"]];
    detailedReport.incomeDetails.forEach(item => rows.push([item.name, item.amount]));
    rows.push(["TOTAL PENDAPATAN", detailedReport.totalIncome], [""], ["BEBAN OPERASIONAL"]);
    detailedReport.expenseDetails.forEach(item => rows.push([item.name, item.amount]));
    rows.push(["TOTAL PENGELUARAN", detailedReport.totalExpense], [""], ["LABA BERSIH", detailedReport.netProfit]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Laba Rugi");
    XLSX.writeFile(wb, `Laporan_Laba_Rugi_${trendStartDate}.xlsx`);
  };

  const handleImportXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          patientType: (row.Pasien || row.patientType || 'None'),
          note: row.Catatan || row.note || 'Import from Analytics'
        }));
        onBulkAdd(bulk as any);
        alert(`Berhasil mengimpor ${bulk.length} transaksi.`);
      } catch (err) { alert('Gagal impor.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const assets = (Array.isArray(balanceItems) ? balanceItems : []).filter(i => i && i.category === 'Asset');
  const liabilities = (Array.isArray(balanceItems) ? balanceItems : []).filter(i => i && i.category === 'Liability');
  const equities = (Array.isArray(balanceItems) ? balanceItems : []).filter(i => i && i.category === 'Equity');
  const totalAssets = assets.reduce((a, b) => a + (b.amount || 0), 0);
  const totalLiabilities = liabilities.reduce((a, b) => a + (b.amount || 0), 0);
  const totalEquityBase = equities.reduce((a, b) => a + (b.amount || 0), 0);
  const totalPassiva = totalLiabilities + totalEquityBase + (stats.netProfit || 0);

  const primaryColorClass = theme?.primary ? `text-${theme.primary}` : 'text-indigo-600';
  const primaryBgClass = theme?.primary ? `bg-${theme.primary}` : 'bg-indigo-600';
  const primaryBtnClass = theme?.primary ? `bg-${theme.primary} hover:opacity-90` : 'bg-slate-800';

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-3xl w-fit">
          <button onClick={() => setActiveReport('profit-loss')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'profit-loss' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}>LAPORAN LABA RUGI</button>
          <button onClick={() => setActiveReport('balance-sheet')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'balance-sheet' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}>NERACA KEUANGAN</button>
        </div>
        {activeReport === 'profit-loss' && (
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="date" className="bg-transparent text-xs font-black outline-none w-28" value={trendStartDate} onChange={(e) => setTrendStartDate(e.target.value)} />
                <span className="text-slate-300 font-bold">-</span>
                <input type="date" className="bg-transparent text-xs font-black outline-none w-28" value={trendEndDate} onChange={(e) => setTrendEndDate(e.target.value)} />
             </div>
             <button onClick={() => uploadInputRef.current?.click()} className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-2xl transition-colors"><Upload className="w-5 h-5" /></button>
             <input type="file" ref={uploadInputRef} className="hidden" accept=".xlsx" onChange={handleImportXLSX} />
             <button onClick={handleDownloadPDF} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl transition-colors"><Printer className="w-5 h-5" /></button>
             <button onClick={handleDownloadXLSX} className={`flex items-center gap-2 ${primaryBgClass} text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all`}><Download className="w-4 h-4" /> UNDUH EXCEL</button>
          </div>
        )}
      </div>

      {activeReport === 'profit-loss' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Pendapatan Bruto</p>
               <h3 className="text-2xl font-black text-slate-900">{formatCurrency(detailedReport.totalIncome)}</h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Total Beban</p>
               <h3 className="text-2xl font-black text-slate-900">{formatCurrency(detailedReport.totalExpense)}</h3>
            </div>
            <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm group">
               <p className="text-[10px] font-black uppercase text-rose-500 mb-1 tracking-widest">PPh Final UMKM (0.5%)</p>
               <h3 className="text-2xl font-black text-rose-600">{formatCurrency(detailedReport.totalIncome * 0.005)}</h3>
            </div>
            <div className={`bg-slate-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group`}>
               <p className="text-[10px] font-black uppercase text-white/60 mb-1 tracking-widest">Laba Bersih Setelah Pajak</p>
               <h3 className="text-2xl font-black">{formatCurrency(detailedReport.netProfit - (detailedReport.totalIncome * 0.005))}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div ref={reportRef} className="bg-white p-10 rounded-xl border border-slate-200 shadow-sm min-h-[600px] text-slate-800 font-sans">
                <div className="border-b-2 border-slate-800 pb-4 mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Laporan Laba Rugi Terperinci</h2>
                  <p className="text-sm text-slate-500 font-medium">Periode: {trendStartDate} - {trendEndDate}</p>
                </div>
                <div className="mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-4 border-b border-emerald-100 pb-2">Pendapatan</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {detailedReport.incomeDetails.map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed border-slate-100 last:border-0"><td className="py-2 text-slate-600 pl-4">{item.name}</td><td className="py-2 text-right font-bold text-slate-800">{formatCurrency(item.amount)}</td></tr>
                      ))}
                      <tr className="bg-emerald-50/50"><td className="py-3 font-black text-slate-900 uppercase pl-2">Total Pendapatan</td><td className="py-3 text-right font-black text-emerald-600">{formatCurrency(detailedReport.totalIncome)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 mb-4 border-b border-rose-100 pb-2">Pengeluaran</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {detailedReport.expenseDetails.map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed border-slate-100 last:border-0"><td className="py-2 text-slate-600 pl-4">{item.name}</td><td className="py-2 text-right font-bold text-slate-800">{formatCurrency(item.amount)}</td></tr>
                      ))}
                      <tr className="bg-rose-50/50"><td className="py-3 font-black text-slate-900 uppercase pl-2">Total Pengeluaran</td><td className="py-3 text-right font-black text-rose-600">{formatCurrency(detailedReport.totalExpense)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="border-t-4 border-slate-100 pt-4"><div className="flex justify-between items-center py-4 px-4 bg-slate-50 rounded-xl font-black uppercase text-slate-900"><span>Laba Rugi Bersih</span><span className={detailedReport.netProfit >= 0 ? 'text-indigo-600 text-2xl' : 'text-rose-600 text-2xl'}>{formatCurrency(detailedReport.netProfit)}</span></div></div>
              </div>
            </div>
            <div ref={trendChartRef} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-fit relative group/card">
              <button onClick={exportTrendChartToPDF} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 border border-slate-100 opacity-0 group-hover/card:opacity-100 transition-opacity"><Download className="w-4 h-4"/></button>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl"><TrendingUpIcon className="w-5 h-5 text-indigo-600" /></div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Grafik Tren Laba</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 'bold'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontSize: '12px'}} />
                    <Line type="monotone" dataKey="NetProfit" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 min-h-[500px]">
          <div className="flex justify-between items-center mb-8"><h3 className="font-black text-2xl uppercase tracking-tighter">Neraca Keuangan Aktiva & Pasiva</h3><div className="text-xs text-slate-400 font-bold bg-slate-100 px-4 py-2 rounded-xl">{totalAssets === totalPassiva ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> SEIMBANG (BALANCED)</span> : <span className="text-rose-600 flex items-center gap-1"><X className="w-4 h-4"/> BELUM SEIMBANG</span>}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100"><div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4"><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">AKTIVA</h4><button onClick={() => handleOpenBalanceModal('Asset')} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all"><Plus className="w-5 h-5"/></button></div><div className="space-y-4">{assets.map(item => (<div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-2xl group transition-all hover:shadow-sm border border-transparent hover:border-emerald-100"><span className="font-bold text-slate-600">{item.name}</span><div className="flex items-center gap-4"><span className="font-black text-slate-900">{formatCurrency(item.amount)}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleOpenBalanceModal('Asset', item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-lg"><Edit2 className="w-3 h-3"/></button><button onClick={() => onDeleteBalance(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-lg"><Trash2 className="w-3 h-3"/></button></div></div></div>))}<div className="pt-6 border-t-2 border-slate-200 flex justify-between mt-8 font-black"><span className="text-xs text-slate-400 uppercase">TOTAL AKTIVA</span><span className={`text-2xl ${primaryColorClass}`}>{formatCurrency(totalAssets)}</span></div></div></div>
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100"><div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4"><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">PASIVA</h4><button onClick={() => handleOpenBalanceModal('Liability')} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all"><Plus className="w-5 h-5"/></button></div><div className="space-y-4">{[...liabilities, ...equities].map(item => (<div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-2xl group hover:shadow-sm transition-all border border-transparent hover:border-rose-100"><div><span className="font-bold text-slate-600 block">{item.name}</span><span className="text-[9px] font-black uppercase text-slate-300">{item.category}</span></div><div className="flex items-center gap-4"><span className="font-black text-slate-900">{formatCurrency(item.amount)}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleOpenBalanceModal(item.category, item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-lg"><Edit2 className="w-3 h-3"/></button><button onClick={() => onDeleteBalance(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-lg"><Trash2 className="w-3 h-3"/></button></div></div></div>))}<div className="flex justify-between p-5 bg-indigo-600 text-white rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all"><div><span className="font-bold block">Laba Berjalan Klinik</span><span className="text-[9px] uppercase opacity-70">Automated</span></div><span className="font-black">{formatCurrency(stats.netProfit)}</span></div><div className="pt-6 border-t-2 border-slate-200 flex justify-between mt-8 font-black"><span className="text-xs text-slate-400 uppercase">TOTAL PASIVA</span><span className="text-2xl text-slate-900">{formatCurrency(totalPassiva)}</span></div></div></div>
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBalanceModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6">{balanceIdToEdit ? 'Edit Item' : 'Tambah Item'}</h3>
            <form onSubmit={handleSaveBalanceItem} className="space-y-4">
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori</label><select className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={balanceModalType} onChange={(e) => setBalanceModalType(e.target.value as any)}><option value="Asset">AKTIVA</option><option value="Liability">KEWAJIBAN</option><option value="Equity">MODAL</option></select></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Akun</label><input required type="text" placeholder="Nama Akun" className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={balanceName} onChange={(e) => setBalanceName(e.target.value)} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nilai (IDR)</label><input required type="number" placeholder="0" className="w-full bg-slate-50 p-4 rounded-xl border-none outline-none font-bold text-sm" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} /></div>
               <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowBalanceModal(false)} className="flex-1 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Batal</button><button type="submit" className={`flex-1 py-4 rounded-xl text-white font-black text-sm uppercase shadow-xl active:scale-95 transition-all ${primaryBtnClass}`}>SIMPAN</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
