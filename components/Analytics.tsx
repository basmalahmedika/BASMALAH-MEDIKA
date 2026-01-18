
import React, { useMemo, useState } from 'react';
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
  Cell
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
  History,
  TrendingUp as TrendingUpIcon,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar
} from 'lucide-react';
import { SummaryStats, Transaction, PatientDailyStat, BalanceItem, AppTheme } from '../types';
import * as XLSX from 'xlsx';

interface AnalyticsProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  balanceItems: BalanceItem[];
  onUpdateBalance: (id: string, item: Partial<BalanceItem>) => void;
  onAddBalance: (item: Omit<BalanceItem, 'id'>) => void;
  onDeleteBalance: (id: string) => void;
  theme: AppTheme;
}

type ReportType = 'balance-sheet' | 'profit-loss';

export const Analytics: React.FC<AnalyticsProps> = ({ 
  stats, transactions, patientStats, balanceItems, onUpdateBalance, onAddBalance, onDeleteBalance, theme 
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [showModal, setShowModal] = useState(false);
  const [modalCat, setModalCat] = useState<'Asset' | 'Liability' | 'Equity'>('Asset');
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // State untuk Filter Tanggal Tren Pertumbuhan
  const [trendStartDate, setTrendStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [trendEndDate, setTrendEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const monthlyComparisonData = useMemo(() => {
    const data = [];
    let current = new Date(trendStartDate);
    current.setDate(1); // Pastikan mulai dari awal bulan
    const end = new Date(trendEndDate);
    // Set end date to end of month to ensure inclusion if user picks mid-month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);

    while (current <= end) {
      const monthKey = current.toISOString().substring(0, 7); // YYYY-MM
      const label = current.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      let income = 0;
      let expense = 0;

      // Filter transaksi untuk bulan ini
      transactions.forEach(t => {
        if (t.date.startsWith(monthKey)) {
          if (t.type === 'Income') income += t.amount;
          else expense += t.amount;
        }
      });

      data.push({
        key: monthKey,
        label: label,
        Income: income,
        Expense: expense,
        NetProfit: income - expense
      });

      // Pindah ke bulan berikutnya
      current.setMonth(current.getMonth() + 1);
    }
    return data;
  }, [transactions, trendStartDate, trendEndDate]);

  const assets = balanceItems.filter(i => i.category === 'Asset');
  const liabilities = balanceItems.filter(i => i.category === 'Liability');
  const manualEquities = balanceItems.filter(i => i.category === 'Equity');

  const totalAssets = assets.reduce((a, b) => a + b.amount, 0);
  const totalLiabilities = liabilities.reduce((a, b) => a + b.amount, 0);
  const totalManualEquity = manualEquities.reduce((a, b) => a + b.amount, 0);
  
  const currentProfit = stats.netProfit;
  const totalEquity = totalManualEquity + currentProfit;
  const totalPassiva = totalLiabilities + totalEquity;
  
  const isBalanced = Math.abs(totalAssets - totalPassiva) < 1;

  const incomeByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'Income').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'Expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const estimatedTax = stats.totalIncome * 0.005;
  const netProfitAfterTax = stats.netProfit - estimatedTax;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBalance({ name: itemName, amount: parseFloat(itemAmount) || 0, category: modalCat });
    setItemName(''); setItemAmount(''); setShowModal(false);
  };

  const startEditing = (item: BalanceItem) => {
    setEditingItemId(item.id);
    setEditValue(item.amount.toString());
  };

  const saveEdit = (id: string) => {
    onUpdateBalance(id, { amount: parseFloat(editValue) || 0 });
    setEditingItemId(null);
  };

  const exportTaxReport = () => {
    const data: any[][] = [
      ["LAPORAN LABA RUGI & PERHITUNGAN PAJAK UMKM - TAHUN PAJAK 2026"],
      ["KLINIK BASMALAH MEDIKA"],
      ["Periode Laporan:", "Real-time s/d " + new Date().toLocaleDateString('id-ID')],
      [],
      ["A. PENDAPATAN BRUTO (OMZET)", "JUMLAH (IDR)"],
      ...incomeByCategory,
      ["TOTAL PENDAPATAN BRUTO", stats.totalIncome],
      [],
      ["B. PENGELUARAN OPERASIONAL", "JUMLAH (IDR)"],
      ...expenseByCategory,
      ["TOTAL PENGELUARAN", stats.totalExpense],
      [],
      ["C. RINGKASAN PAJAK UMKM (PP 55/2022)"],
      ["Total Omzet Bruto", stats.totalIncome],
      ["Tarif Pajak PPh Final", "0.5%"],
      ["ESTIMASI PAJAK TERHUTANG", estimatedTax],
      [],
      ["D. LABA BERSIH SETELAH PAJAK"],
      ["Laba Bersih Sebelum Pajak", stats.netProfit],
      ["Estimasi Pajak", estimatedTax],
      ["LABA BERSIH AKHIR", netProfitAfterTax],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Pajak");
    XLSX.writeFile(wb, `Laporan_Pajak_2026_Klinik_Basmalah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const primaryColorClass = `text-${theme.primary}`;
  const lightBgClass = `bg-${theme.secondary}`;
  const primaryBgClass = `bg-${theme.primary}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1.5 rounded-3xl w-fit shadow-inner">
          <button onClick={() => setActiveReport('profit-loss')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'profit-loss' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}>LABA RUGI & PAJAK</button>
          <button onClick={() => setActiveReport('balance-sheet')} className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'balance-sheet' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}>NERACA KEUANGAN</button>
        </div>
        
        {activeReport === 'profit-loss' && (
          <button onClick={exportTaxReport} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-700 transition-all active:scale-95 border-b-4 border-emerald-800">
            <Download className="w-4 h-4" /> EKSPOR PAJAK UMKM (.XLSX)
          </button>
        )}
      </div>

      {activeReport === 'profit-loss' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <ArrowUpRight className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/5 group-hover:scale-110 transition-transform" />
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Total Pendapatan</p>
               <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalIncome)}</h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <ArrowDownRight className="absolute -right-4 -bottom-4 w-24 h-24 text-rose-500/5 group-hover:scale-110 transition-transform" />
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Total Pengeluaran</p>
               <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalExpense)}</h3>
            </div>
            <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-rose-500 mb-1 tracking-widest">PPh Final (0.5%)</p>
              <h3 className="text-2xl font-black text-rose-600">{formatCurrency(estimatedTax)}</h3>
            </div>
            <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
               <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase text-emerald-100 mb-1 tracking-widest">Profit Akhir</p>
              <h3 className="text-2xl font-black">{formatCurrency(netProfitAfterTax)}</h3>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
               <div className="flex items-center gap-4">
                 <div className={`p-4 bg-emerald-50 rounded-[1.5rem]`}><TrendingUpIcon className={`w-6 h-6 text-emerald-600`} /></div>
                 <div>
                   <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Tren Pertumbuhan Laba</h3>
                   <p className="text-xs text-slate-400 font-medium italic">Estimasi profit bersih bulanan</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 px-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                  </div>
                  <input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" value={trendStartDate} onChange={(e) => setTrendStartDate(e.target.value)} />
                  <span className="text-slate-300 font-bold">-</span>
                  <input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" value={trendEndDate} onChange={(e) => setTrendEndDate(e.target.value)} />
               </div>
            </div>

            <div className="h-80 w-full">
              {monthlyComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}} formatter={(v: any) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="NetProfit" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <Activity className="w-12 h-12 opacity-10 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest italic">Tidak ada data untuk rentang ini</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Rincian Pendapatan</h4>
              <div className="space-y-4">
                {incomeByCategory.map(([cat, val]) => (
                  <div key={cat} className="flex justify-between items-center py-3 border-b border-slate-50 hover:bg-slate-50 px-2 transition-colors rounded-lg">
                    <span className="text-sm font-bold text-slate-600">{cat}</span>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Rincian Pengeluaran</h4>
              <div className="space-y-4">
                {expenseByCategory.map(([cat, val]) => (
                  <div key={cat} className="flex justify-between items-center py-3 border-b border-slate-50 hover:bg-slate-50 px-2 transition-colors rounded-lg">
                    <span className="text-sm font-bold text-slate-600">{cat}</span>
                    <span className="text-sm font-black text-rose-600">{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className={`p-8 border-b border-slate-100 ${lightBgClass} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Briefcase className={`w-8 h-8 ${primaryColorClass}`} />
                <div>
                  <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Neraca Keuangan 2026</h3>
                  <p className="text-xs text-slate-400 font-bold">Laporan Aktiva & Pasiva</p>
                </div>
              </div>
              {isBalanced ? (
                <div className="flex flex-col items-end">
                   <span className="flex items-center gap-1.5 text-[10px] font-black bg-emerald-500 text-white px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-4 h-4" /> Balanced
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-black bg-rose-500 text-white px-4 py-2 rounded-full uppercase tracking-widest">Unbalanced</span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
              <div className="p-10 border-r border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aset (Aktiva)</h4>
                  <button onClick={() => {setModalCat('Asset'); setShowModal(true)}} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                  {assets.map((item) => (
                    <div key={item.id} className="flex justify-between items-start group p-4 hover:bg-slate-50 rounded-2xl transition-all">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-500 font-black uppercase tracking-tighter">{item.name}</span>
                        {editingItemId === item.id ? (
                          <input autoFocus type="number" className="bg-white border rounded px-3 py-1.5 text-sm font-black w-32 mt-2 outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                        ) : (
                          <span onClick={() => startEditing(item)} className="text-lg font-black text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors">{formatCurrency(item.amount)}</span>
                        )}
                      </div>
                      <button onClick={() => onDeleteBalance(item.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t-2 border-slate-50 flex justify-between items-center px-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Harta</span>
                  <span className={`text-2xl font-black ${primaryColorClass}`}>{formatCurrency(totalAssets)}</span>
                </div>
              </div>
              <div className="p-10 bg-slate-50/20">
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Kewajiban</h4>
                    <button onClick={() => {setModalCat('Liability'); setShowModal(true)}} className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Plus className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-6">
                    {liabilities.map((item) => (
                      <div key={item.id} className="flex justify-between items-start group p-4 hover:bg-white rounded-2xl transition-all">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500 font-black uppercase tracking-tighter">{item.name}</span>
                          {editingItemId === item.id ? (
                            <input autoFocus type="number" className="bg-white border rounded px-3 py-1.5 text-sm font-black w-32 mt-2 outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                          ) : (
                            <span onClick={() => startEditing(item)} className="text-lg font-black text-slate-900 cursor-pointer hover:text-indigo-600">{formatCurrency(item.amount)}</span>
                          )}
                        </div>
                        <button onClick={() => onDeleteBalance(item.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ekuitas</h4>
                    <button onClick={() => {setModalCat('Equity'); setShowModal(true)}} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Plus className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-6">
                    {manualEquities.map((item) => (
                      <div key={item.id} className="flex justify-between items-start group p-4 hover:bg-white rounded-2xl transition-all">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500 font-black uppercase tracking-tighter">{item.name}</span>
                          {editingItemId === item.id ? (
                            <input autoFocus type="number" className="bg-white border rounded px-3 py-1.5 text-sm font-black w-32 mt-2 outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                          ) : (
                            <span onClick={() => startEditing(item)} className="text-lg font-black text-slate-900 cursor-pointer hover:text-indigo-600">{formatCurrency(item.amount)}</span>
                          )}
                        </div>
                        <button onClick={() => onDeleteBalance(item.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <div className="flex justify-between items-start p-5 bg-indigo-600 text-white rounded-2xl shadow-lg relative overflow-hidden group">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">Laba Berjalan</span>
                        <span className="text-xl font-black">{formatCurrency(currentProfit)}</span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-white/40" />
                    </div>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t-2 border-slate-100 flex justify-between items-center px-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pasiva</span>
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(totalPassiva)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className={`bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden`}>
              <div className="relative z-10">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Asset Turnover Ratio</p>
                <h2 className="text-5xl font-black tracking-tighter">{(stats.totalIncome / (totalAssets || 1)).toFixed(2)}<small className="text-xl">x</small></h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Tambah {modalCat}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Akun</label>
                <input required type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold outline-none" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo (IDR)</label>
                <input required type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold outline-none" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} />
              </div>
              <button type="submit" className={`w-full ${primaryBgClass} text-white py-4 rounded-2xl font-black uppercase tracking-widest`}>Simpan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
