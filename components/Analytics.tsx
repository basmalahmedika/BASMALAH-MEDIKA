
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
  Users, 
  DollarSign, 
  Activity,
  Plus,
  Trash2,
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Calculator,
  PieChart as PieChartIcon,
  ChevronDown,
  ArrowRight
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

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // --- LOGIKA NERACA ---
  const assets = balanceItems.filter(i => i.category === 'Asset');
  const liabilities = balanceItems.filter(i => i.category === 'Liability');
  const manualEquities = balanceItems.filter(i => i.category === 'Equity');

  const totalAssets = assets.reduce((a, b) => a + b.amount, 0);
  const totalLiabilities = liabilities.reduce((a, b) => a + b.amount, 0);
  const totalManualEquity = manualEquities.reduce((a, b) => a + b.amount, 0);
  
  const currentProfit = stats.netProfit;
  const totalEquity = totalManualEquity + currentProfit;
  const totalPassiva = totalLiabilities + totalEquity;
  
  const balanceDifference = totalAssets - totalPassiva;
  const isBalanced = Math.abs(balanceDifference) < 1;

  // --- LOGIKA LABA RUGI & PAJAK ---
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

  const totalIncomeBruto = stats.totalIncome;
  const umkmTaxRate = 0.005; // 0.5%
  const estimatedTax = totalIncomeBruto * umkmTaxRate;
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

  const exportBalanceSheet = () => {
    const data: any[][] = [
      ["LAPORAN NERACA KEUANGAN"],
      ["Klinik Basmalah Medika"],
      ["Periode:", new Date().toLocaleDateString('id-ID')],
      [],
      ["AKTIVA (ASET)", "JUMLAH", "PASIVA (KEWAJIBAN & EKUITAS)", "JUMLAH"],
    ];

    const passivaItems = [
      ...liabilities.map(l => ({ name: l.name, amount: l.amount })),
      { name: "--- EKUITAS ---", amount: null },
      ...manualEquities.map(e => ({ name: e.name, amount: e.amount })),
      { name: "Laba Berjalan (Auto)", amount: currentProfit }
    ];

    const maxLength = Math.max(assets.length, passivaItems.length);
    for (let i = 0; i < maxLength; i++) {
      const asset = assets[i] || { name: "", amount: null };
      const passiva = passivaItems[i] || { name: "", amount: null };
      data.push([
        asset.name, asset.amount !== null ? asset.amount : "",
        passiva.name, passiva.amount !== null ? passiva.amount : ""
      ]);
    }
    data.push([], ["TOTAL AKTIVA", totalAssets, "TOTAL PASIVA", totalPassiva]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Neraca");
    XLSX.writeFile(wb, `Neraca_Klinik_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportProfitLoss = () => {
    const data: any[][] = [
      ["LAPORAN LABA RUGI & PAJAK UMKM"],
      ["Klinik Basmalah Medika"],
      ["Periode Laporan:", "Real-time s/d " + new Date().toLocaleDateString('id-ID')],
      [],
      ["KATEGORI PENDAPATAN", "JUMLAH (IDR)"],
      ...incomeByCategory,
      ["TOTAL PENDAPATAN BRUTO", totalIncomeBruto],
      [],
      ["KATEGORI PENGELUARAN", "JUMLAH (IDR)"],
      ...expenseByCategory,
      ["TOTAL PENGELUARAN", stats.totalExpense],
      [],
      ["RINGKASAN LABA & PAJAK"],
      ["Laba Sebelum Pajak", stats.netProfit],
      ["Pajak UMKM (0.5% Omzet Bruto)", estimatedTax],
      ["LABA BERSIH SETELAH PAJAK", netProfitAfterTax],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laba Rugi");
    XLSX.writeFile(wb, `LabaRugi_Klinik_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const patientChartData = useMemo(() => {
    return patientStats.slice(0, 10).reverse().map(s => ({
      date: s.date.split('-').slice(1).join('/'),
      'Rawat Jalan': s.outpatientUmum + s.outpatientBpjs,
      'MRS': (s.inpatientAdmissionUmum || 0) + (s.inpatientAdmissionBpjs || 0),
    }));
  }, [patientStats]);

  const primaryColorClass = `text-${theme.primary}`;
  const lightBgClass = `bg-${theme.secondary}`;
  const primaryBgClass = `bg-${theme.primary}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      
      {/* HEADER TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1.5 rounded-3xl w-fit">
          <button 
            onClick={() => setActiveReport('profit-loss')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'profit-loss' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Calculator className="w-4 h-4" />
            LABA RUGI & PAJAK
          </button>
          <button 
            onClick={() => setActiveReport('balance-sheet')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${activeReport === 'balance-sheet' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <PieChartIcon className="w-4 h-4" />
            NERACA KEUANGAN
          </button>
        </div>

        <button 
          onClick={activeReport === 'balance-sheet' ? exportBalanceSheet : exportProfitLoss}
          className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          EKSPOR EXCEL (.XLSX)
        </button>
      </div>

      {activeReport === 'balance-sheet' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`p-6 border-b border-slate-100 ${lightBgClass} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Briefcase className={`w-6 h-6 ${primaryColorClass}`} />
                <h3 className="font-bold text-lg text-slate-800">Laporan Neraca Real-time</h3>
              </div>
              {isBalanced ? (
                <span className="flex items-center gap-1.5 text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3" /> Balanced
                </span>
              ) : (
                <span className="text-[10px] font-black bg-rose-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Unbalanced</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 border-r border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Aset (Aktiva)</h4>
                  <button onClick={() => {setModalCat('Asset'); setShowModal(true)}} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4 min-h-[300px]">
                  {assets.map((item) => (
                    <div key={item.id} className="flex justify-between items-start group">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-500 font-bold">{item.name}</span>
                        {editingItemId === item.id ? (
                          <input autoFocus type="number" className="bg-slate-100 rounded px-2 py-1 text-xs font-black w-24 mt-1" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                        ) : (
                          <span onClick={() => startEditing(item)} className="text-sm font-black text-slate-900 cursor-pointer hover:text-indigo-600">{formatCurrency(item.amount)}</span>
                        )}
                      </div>
                      <button onClick={() => onDeleteBalance(item.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase">Total Aktiva</span>
                  <span className={`text-lg font-black ${primaryColorClass}`}>{formatCurrency(totalAssets)}</span>
                </div>
              </div>

              <div className="p-8 bg-slate-50/30">
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Liabilitas</h4>
                    <button onClick={() => {setModalCat('Liability'); setShowModal(true)}} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-4">
                    {liabilities.map((item) => (
                      <div key={item.id} className="flex justify-between items-start group">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500 font-bold">{item.name}</span>
                          {editingItemId === item.id ? (
                            <input autoFocus type="number" className="bg-white border rounded px-2 py-1 text-xs font-black w-24 mt-1" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                          ) : (
                            <span onClick={() => startEditing(item)} className="text-sm font-black text-slate-900 cursor-pointer hover:text-indigo-600">{formatCurrency(item.amount)}</span>
                          )}
                        </div>
                        <button onClick={() => onDeleteBalance(item.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Ekuitas</h4>
                    <button onClick={() => {setModalCat('Equity'); setShowModal(true)}} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-4">
                    {manualEquities.map((item) => (
                      <div key={item.id} className="flex justify-between items-start group">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-500 font-bold">{item.name}</span>
                          {editingItemId === item.id ? (
                            <input autoFocus type="number" className="bg-white border rounded px-2 py-1 text-xs font-black w-24 mt-1" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)} />
                          ) : (
                            <span onClick={() => startEditing(item)} className="text-sm font-black text-slate-900 cursor-pointer hover:text-indigo-600 flex items-center gap-1">{formatCurrency(item.amount)}</span>
                          )}
                        </div>
                        <button onClick={() => onDeleteBalance(item.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex justify-between items-start p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Laba Berjalan (Auto)</span>
                        <span className="text-sm font-black text-indigo-900">{formatCurrency(currentProfit)}</span>
                      </div>
                      <TrendingUp className="w-4 h-4 text-indigo-300" />
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-200 mt-8 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase">Total Pasiva</span>
                  <span className="text-lg font-black text-slate-900">{formatCurrency(totalPassiva)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* STATS INFO */}
          <div className="flex flex-col gap-6">
            <div className={`bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden`}>
              <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Asset Turnover Ratio</p>
                <h2 className="text-4xl font-black tracking-tighter">{(stats.totalIncome / (totalAssets || 1)).toFixed(2)}x</h2>
                <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-2/3" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Arus Kas Masuk</h4>
               <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientChartData}>
                      <Bar dataKey="Rawat Jalan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* LAPORAN LABA RUGI & PAJAK UMKM */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pendapatan Bruto</p>
               <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalIncomeBruto)}</h3>
            </div>
            <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                  <Calculator className="w-8 h-8 text-rose-200" />
               </div>
               <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1">Pajak PPh Final (0.5%)</p>
               <h3 className="text-2xl font-black text-rose-600">{formatCurrency(estimatedTax)}</h3>
            </div>
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
               <div className="absolute -bottom-4 -right-4 opacity-10">
                  <TrendingUp className="w-24 h-24" />
               </div>
               <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Laba Bersih Akhir</p>
               <h3 className="text-2xl font-black">{formatCurrency(netProfitAfterTax)}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tabel Pendapatan */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Rincian Pendapatan</h3>
               </div>
               <div className="p-0">
                  <table className="w-full">
                     <thead className="bg-slate-50/50">
                        <tr>
                           <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Kategori</th>
                           <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Jumlah</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {incomeByCategory.map(([cat, val]) => (
                           <tr key={cat} className="hover:bg-slate-50/30">
                              <td className="px-6 py-4 text-sm font-bold text-slate-700">{cat}</td>
                              <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(val)}</td>
                           </tr>
                        ))}
                        <tr className="bg-slate-50/80 font-black">
                           <td className="px-6 py-4 text-sm text-slate-900">Total Bruto</td>
                           <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(totalIncomeBruto)}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Tabel Pengeluaran */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Activity className="w-5 h-5" /></div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Rincian Pengeluaran</h3>
               </div>
               <div className="p-0">
                  <table className="w-full">
                     <thead className="bg-slate-50/50">
                        <tr>
                           <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Kategori</th>
                           <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Jumlah</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {expenseByCategory.map(([cat, val]) => (
                           <tr key={cat} className="hover:bg-slate-50/30">
                              <td className="px-6 py-4 text-sm font-bold text-slate-700">{cat}</td>
                              <td className="px-6 py-4 text-sm font-black text-rose-600 text-right">{formatCurrency(val)}</td>
                           </tr>
                        ))}
                        <tr className="bg-slate-50/80 font-black">
                           <td className="px-6 py-4 text-sm text-slate-900">Total Pengeluaran</td>
                           <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(stats.totalExpense)}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-100 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm"><Calculator className="w-8 h-8 text-indigo-600" /></div>
                <div>
                   <h4 className="font-black text-indigo-900 uppercase tracking-widest">Kepatuhan Pajak UMKM</h4>
                   <p className="text-sm text-indigo-600 font-medium">Sesuai PP No. 23 Tahun 2018, tarif pajak final 0.5% dikenakan dari omzet bruto.</p>
                </div>
             </div>
             <div className="flex items-center gap-8">
                <div className="text-center">
                   <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Omzet Bruto</p>
                   <p className="font-black text-indigo-900">{formatCurrency(totalIncomeBruto)}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-300 hidden md:block" />
                <div className="text-center">
                   <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Pajak Terhutang</p>
                   <p className="font-black text-rose-600">{formatCurrency(estimatedTax)}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Tambah {modalCat}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Akun</label>
                <input required type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo (IDR)</label>
                <input required type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl p-4 font-bold" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} />
              </div>
              <button type="submit" className={`w-full ${primaryBgClass} text-white py-4 rounded-2xl font-black uppercase tracking-widest`}>Simpan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
