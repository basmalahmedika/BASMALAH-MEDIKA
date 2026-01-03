
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
  Line
} from 'recharts';
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  X,
  PlusCircle
} from 'lucide-react';
import { SummaryStats, Transaction, PatientDailyStat, BalanceItem, AppTheme } from '../types';

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

export const Analytics: React.FC<AnalyticsProps> = ({ 
  stats, transactions, patientStats, balanceItems, onUpdateBalance, onAddBalance, onDeleteBalance, theme 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalCat, setModalCat] = useState<'Asset' | 'Liability' | 'Equity'>('Asset');
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const assets = balanceItems.filter(i => i.category === 'Asset');
  const liabilities = balanceItems.filter(i => i.category === 'Liability');
  const equities = balanceItems.filter(i => i.category === 'Equity');

  const totalAssets = assets.reduce((a, b) => a + b.amount, 0);
  const totalLiabilities = liabilities.reduce((a, b) => a + b.amount, 0);
  const totalEquity = equities.reduce((a, b) => a + b.amount, 0);
  const totalPassiva = totalLiabilities + totalEquity;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBalance({
      name: itemName,
      amount: parseFloat(itemAmount) || 0,
      category: modalCat
    });
    setItemName('');
    setItemAmount('');
    setShowModal(false);
  };

  const patientChartData = useMemo(() => {
    return patientStats.slice(0, 10).reverse().map(s => ({
      date: s.date.split('-').slice(1).join('/'),
      'Rawat Jalan': s.outpatientUmum + s.outpatientBpjs,
      'MRS': (s.inpatientAdmissionUmum || 0) + (s.inpatientAdmissionBpjs || 0),
      'KRS': s.inpatientDischargeUmum + s.inpatientDischargeBpjs,
    }));
  }, [patientStats]);

  const serviceKPIs = useMemo(() => {
    const categories: Record<string, { income: number, count: number }> = {};
    transactions.filter(t => t.type === 'Income').forEach(t => {
      if (!categories[t.category]) categories[t.category] = { income: 0, count: 0 };
      categories[t.category].income += t.amount;
      categories[t.category].count += 1;
    });

    return Object.entries(categories).map(([name, val]) => ({
      name,
      revenue: val.income,
      count: val.count,
      avg: val.income / val.count
    })).sort((a, b) => b.revenue - a.revenue);
  }, [transactions]);

  const primaryColorClass = `text-${theme.primary}`;
  const lightBgClass = `bg-${theme.secondary}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      
      {/* SECTION 1: NERACA KEUANGAN CRUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className={`p-6 border-b border-slate-100 ${lightBgClass} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Briefcase className={`w-6 h-6 ${primaryColorClass}`} />
              <h3 className="font-bold text-lg text-slate-800">Laporan Neraca Keuangan</h3>
            </div>
            <div className="flex items-center gap-4">
               {Math.abs(totalAssets - totalPassiva) < 1 ? (
                 <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Balanced</span>
               ) : (
                 <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase">Unbalanced</span>
               )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* ASET */}
            <div className="p-6 border-r border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Aset (Aktiva)</h4>
                <button onClick={() => {setModalCat('Asset'); setShowModal(true)}} className="text-emerald-600 hover:text-emerald-700">
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {assets.map((item) => (
                  <div key={item.id} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                      <span className="text-xs font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                    <button onClick={() => onDeleteBalance(item.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total Aset</span>
                  <span className="font-extrabold text-emerald-600">{formatCurrency(totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* PASIVA */}
            <div className="p-6 bg-slate-50/30">
              <div className="space-y-8">
                {/* Liabilitas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Kewajiban (Hutang)</h4>
                    <button onClick={() => {setModalCat('Liability'); setShowModal(true)}} className="text-rose-600 hover:text-rose-700">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {liabilities.map((item) => (
                      <div key={item.id} className="flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                        </div>
                        <button onClick={() => onDeleteBalance(item.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ekuitas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Ekuitas (Modal)</h4>
                    <button onClick={() => {setModalCat('Equity'); setShowModal(true)}} className="text-indigo-600 hover:text-indigo-700">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {equities.map((item) => (
                      <div key={item.id} className="flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                        </div>
                        <button onClick={() => onDeleteBalance(item.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total Pasiva</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(totalPassiva)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-${theme.primary} to-slate-800 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl`}>
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Status Keuangan</span>
            </div>
            <p className="text-emerald-100 text-sm font-medium">Margin Keuntungan Bersih</p>
            <h2 className="text-4xl font-black tracking-tight mt-1">
              {Math.round((stats.netProfit / (stats.totalIncome || 1)) * 100)}%
            </h2>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
               <p className="text-xs text-white/70">Arus Kas Masuk: {formatCurrency(stats.totalIncome)}</p>
             </div>
             <button className="w-full bg-white text-slate-900 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-50 transition-colors">
               Export Neraca PDF
             </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: VOLUME PASIEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-800">Grafik Kunjungan & Inap</h3>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Rawat Jalan" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="MRS" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-rose-600" />
              <h3 className="font-bold text-lg text-slate-800">Tren Pemulangan (KRS)</h3>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Line type="monotone" dataKey="KRS" stroke="#f59e0b" strokeWidth={4} dot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: KPI PER LAYANAN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`p-3 ${lightBgClass} rounded-2xl`}>
               <TrendingUp className={`w-6 h-6 ${primaryColorClass}`} />
             </div>
             <div>
               <h3 className="font-bold text-lg text-slate-800">Key Performance Indicators (Per Layanan)</h3>
               <p className="text-sm text-slate-400">Efektivitas pendapatan per kategori layanan medis</p>
             </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
           {serviceKPIs.slice(0, 4).map((kpi, idx) => (
             <div key={idx} className="p-8 hover:bg-slate-50 transition-colors group">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">SVC-{idx + 1}</span>
                   </div>
                   <div className={`${primaryColorClass} font-bold text-xs flex items-center gap-1`}>
                     <ChevronRight className="w-4 h-4" /> Detail
                   </div>
                </div>
                <h4 className="font-bold text-slate-800 mb-2 truncate" title={kpi.name}>{kpi.name}</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
                    <p className="text-xl font-extrabold text-slate-900">{formatCurrency(kpi.revenue)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-700">{kpi.count} Transaksi</p>
                    <p className="text-sm font-bold text-indigo-600">{formatCurrency(kpi.avg)}/avg</p>
                  </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* MODAL NERACA */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <h3 className="text-lg font-bold text-slate-800">Tambah Item {modalCat}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Item</label>
                <input required type="text" className="w-full bg-slate-50 p-3 rounded-xl outline-none" placeholder="Contoh: Kas Kecil" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Jumlah (IDR)</label>
                <input required type="number" className="w-full bg-slate-50 p-3 rounded-xl outline-none" placeholder="0" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} />
              </div>
              <button type="submit" className={`w-full bg-${theme.primary} text-white py-3 rounded-xl font-bold shadow-lg mt-4`}>Simpan Item</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
