
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Briefcase, 
  TrendingUp, 
  CreditCard, 
  Users, 
  DollarSign, 
  Activity,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { SummaryStats, Transaction, PatientDailyStat } from '../types';

interface AnalyticsProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, transactions, patientStats }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // 1. Neraca Keuangan (Simplified Balance Sheet)
  const balanceSheet = useMemo(() => {
    const cashOnHand = stats.netProfit;
    const receivables = stats.bpjsIncome * 0.2; // Estimation: 20% of BPJS is still in claim process
    const liabilities = stats.totalExpense * 0.15; // Estimation: 15% of expenses are unpaid payables

    return {
      assets: [
        { name: 'Kas & Bank (Laba Bersih)', amount: cashOnHand },
        { name: 'Piutang Klaim BPJS (Estimasi)', amount: receivables },
        { name: 'Inventaris Medis', amount: 50000000 }, // Mock Value
      ],
      liabilities: [
        { name: 'Hutang Dagang (Supplier)', amount: liabilities },
        { name: 'Hutang Gaji Staff', amount: 5000000 }, // Mock Value
      ],
      equity: [
        { name: 'Modal Awal', amount: 100000000 }, // Mock Value
        { name: 'Laba Ditahan', amount: cashOnHand - liabilities },
      ]
    };
  }, [stats]);

  const totalAssets = balanceSheet.assets.reduce((a, b) => a + b.amount, 0);
  const totalLiabEqui = balanceSheet.liabilities.reduce((a, b) => a + b.amount, 0) + balanceSheet.equity.reduce((a, b) => a + b.amount, 0);

  // 2. Grafik Batang Jumlah Pasien (Grouped by Date)
  const patientChartData = useMemo(() => {
    return patientStats.slice(0, 7).reverse().map(s => ({
      date: s.date.split('-').slice(1).join('/'),
      'Rawat Jalan': s.outpatientUmum + s.outpatientBpjs,
      'Rawat Inap (Pulang)': s.inpatientDischargeUmum + s.inpatientDischargeBpjs,
      Umum: s.outpatientUmum + s.inpatientDischargeUmum,
      BPJS: s.outpatientBpjs + s.inpatientDischargeBpjs
    }));
  }, [patientStats]);

  // 3. KPI Per Layanan (Performance per category)
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

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      
      {/* SECTION 1: NERACA KEUANGAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-lg text-slate-800">Laporan Neraca Keuangan</h3>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Snapshot Per Hari Ini</span>
          </div>
          <div className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 border-r border-slate-100">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Aset (Aktiva)</h4>
                <div className="space-y-4">
                  {balanceSheet.assets.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">{item.name}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Total Aset</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(totalAssets)}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50/30">
                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-4">Liabilitas & Ekuitas (Pasiva)</h4>
                <div className="space-y-4">
                  {balanceSheet.liabilities.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium italic">{item.name}</span>
                      <span className="font-bold text-slate-700">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="py-2" />
                  {balanceSheet.equity.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">{item.name}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Total Pasiva</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(totalLiabEqui)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl shadow-emerald-200">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Financial Health</span>
            </div>
            <p className="text-emerald-100 text-sm font-medium">Margin Keuntungan Bersih</p>
            <h2 className="text-4xl font-black tracking-tight mt-1">
              {Math.round((stats.netProfit / (stats.totalIncome || 1)) * 100)}%
            </h2>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
               <p className="text-xs text-emerald-50">Operational Efficiency Optimal</p>
             </div>
             <button className="w-full bg-white text-emerald-700 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-emerald-50 transition-colors">
               Detail Laporan Arus Kas
             </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: GRAFIK BATANG PASIEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-800">Tren Volume Pasien</h3>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">BPJS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Umum</span>
              </div>
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
                <Bar dataKey="BPJS" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Umum" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-rose-600" />
              <h3 className="font-bold text-lg text-slate-800">Pertumbuhan Kunjungan</h3>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                <Line type="monotone" dataKey="Rawat Jalan" stroke="#4f46e5" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} />
                <Line type="monotone" dataKey="Rawat Inap (Pulang)" stroke="#f59e0b" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: KPI PER LAYANAN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-amber-50 rounded-2xl">
               <TrendingUp className="w-6 h-6 text-amber-600" />
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
                   <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                     <ChevronRight className="w-4 h-4" />
                     Detail
                   </div>
                </div>
                <h4 className="font-bold text-slate-800 mb-2 truncate" title={kpi.name}>{kpi.name}</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Contribution</p>
                    <p className="text-xl font-extrabold text-slate-900">{formatCurrency(kpi.revenue)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transactions</p>
                      <p className="text-sm font-bold text-slate-700">{kpi.count} Transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Ticket</p>
                      <p className="text-sm font-bold text-indigo-600">{formatCurrency(kpi.avg)}</p>
                    </div>
                  </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* SECTION 4: QUICK INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-6">
          <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900">Health Coverage Stability</h4>
            <p className="text-sm text-emerald-700 font-medium">BPJS mencakup {(stats.bpjsIncome / (stats.totalIncome || 1) * 100).toFixed(1)}% dari arus kas masuk. Diversifikasi layanan umum direkomendasikan untuk stabilitas margin.</p>
          </div>
        </div>
        <div className="bg-sky-50 border border-sky-100 p-6 rounded-3xl flex items-center gap-6">
          <div className="p-4 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sky-900">Patient Retention Insight</h4>
            <p className="text-sm text-sky-700 font-medium">Layanan Rawat Inap memberikan kontribusi margin per pasien tertinggi. Perawatan fasilitas kamar dapat ditingkatkan untuk menarik pasien umum.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
