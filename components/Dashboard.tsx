
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Stethoscope,
  BedDouble,
  Calendar as CalendarIcon,
  Filter,
  ChevronDown
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { SummaryStats, Transaction, PatientDailyStat } from '../types';

interface DashboardProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  theme: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats: globalStats, transactions, patientStats, theme }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Filtered Data based on Date Range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  const filteredPatientStats = useMemo(() => {
    return patientStats.filter(s => s.date >= startDate && s.date <= endDate);
  }, [patientStats, startDate, endDate]);

  // Derived Stats for the selected range
  const rangeStats = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      if (curr.type === 'Income') {
        acc.totalIncome += curr.amount;
        if (curr.patientType === 'BPJS') acc.bpjsIncome += curr.amount;
        if (curr.patientType === 'Umum') acc.umumIncome += curr.amount;
      } else {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, netProfit: 0, bpjsIncome: 0, umumIncome: 0 });
  }, [filteredTransactions]);

  rangeStats.netProfit = rangeStats.totalIncome - rangeStats.totalExpense;

  const pieData = [
    { name: 'BPJS', value: rangeStats.bpjsIncome, color: '#10b981' },
    { name: 'Umum', value: rangeStats.umumIncome, color: '#0ea5e9' },
  ];

  const latestStat = filteredPatientStats[0] || { 
    outpatientUmum: 0, 
    outpatientBpjs: 0, 
    inpatientDischargeUmum: 0, 
    inpatientDischargeBpjs: 0 
  };

  // Chart Data preparation based on filtered range
  const chartData = useMemo(() => {
    const grouped: Record<string, { income: number, expense: number }> = {};
    filteredTransactions.forEach(t => {
      const dateKey = t.date.split('-').slice(1).join('/'); // MM/DD
      if (!grouped[dateKey]) grouped[dateKey] = { income: 0, expense: 0 };
      if (t.type === 'Income') grouped[dateKey].income += t.amount;
      else grouped[dateKey].expense += t.amount;
    });
    return Object.entries(grouped)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-7); // Last 7 days in range
  }, [filteredTransactions]);

  const primaryColorClass = `text-${theme.primary}`;
  const lightBgClass = `bg-${theme.secondary}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Date Filter Section */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${lightBgClass} rounded-xl`}>
            <Filter className={`w-5 h-5 ${primaryColorClass}`} />
          </div>
          <h3 className="font-bold text-slate-700">Filter Jangkauan Data</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-sm font-semibold text-slate-600"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <span className="text-slate-300 font-bold">s/d</span>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-sm font-semibold text-slate-600"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pendapatan (Periode)" 
          amount={rangeStats.totalIncome} 
          icon={<TrendingUp className={`w-6 h-6 ${primaryColorClass}`} />} 
          bg={lightBgClass}
          trend={`${filteredTransactions.filter(t => t.type === 'Income').length} Transaksi`}
          isUp={true}
        />
        <StatCard 
          title="Pengeluaran (Periode)" 
          amount={rangeStats.totalExpense} 
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />} 
          bg="bg-rose-50"
          trend={`${filteredTransactions.filter(t => t.type === 'Expense').length} Transaksi`}
          isUp={false}
        />
        <StatCard 
          title="Avg. Rawat Jalan" 
          amount={latestStat.outpatientUmum + latestStat.outpatientBpjs} 
          isCurrency={false}
          icon={<Stethoscope className="w-6 h-6 text-indigo-600" />} 
          bg="bg-indigo-50"
          trend={`${latestStat.outpatientBpjs} BPJS`}
          isUp={true}
        />
        <StatCard 
          title="Pasien Pulang RI" 
          amount={latestStat.inpatientDischargeUmum + latestStat.inpatientDischargeBpjs} 
          isCurrency={false}
          icon={<BedDouble className="w-6 h-6 text-amber-600" />} 
          bg="bg-amber-50"
          trend={`${latestStat.inpatientDischargeBpjs} BPJS`}
          isUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-800">Alur Keuangan (7 Titik Terakhir)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Pendapatan</span>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">Pengeluaran</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-8 text-slate-800">Proporsi Layanan</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-700">{Math.round((rangeStats.bpjsIncome / (rangeStats.totalIncome || 1)) * 100)}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Share BPJS</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-sm font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">Transaksi Terbaru dalam Jangkauan</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredTransactions.length} Total</span>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-6 py-4">Layanan</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Pasien</th>
                <th className="px-6 py-4 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.slice(0, 10).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.category}</span>
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{t.note}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      t.patientType === 'BPJS' ? 'bg-emerald-100 text-emerald-700' : 
                      t.patientType === 'Umum' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {t.patientType === 'None' ? '-' : t.patientType}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-black text-right ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold">Tidak ada transaksi pada jangkauan tanggal ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<any> = ({ title, amount, icon, bg, trend, isUp, isCurrency = true }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl ${bg} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black tracking-tight text-slate-900 mt-1">
          {isCurrency ? formatCurrency(amount) : amount}
        </p>
      </div>
    </div>
  );
};
