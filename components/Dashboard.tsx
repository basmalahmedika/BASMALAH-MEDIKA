
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Stethoscope,
  BedDouble
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
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, transactions, patientStats }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const pieData = [
    { name: 'BPJS', value: stats.bpjsIncome, color: '#10b981' },
    { name: 'Umum', value: stats.umumIncome, color: '#0ea5e9' },
  ];

  const latestStat = patientStats[0] || { 
    outpatientUmum: 0, 
    outpatientBpjs: 0, 
    inpatientDischargeUmum: 0, 
    inpatientDischargeBpjs: 0 
  };

  const chartData = [
    { name: 'Sen', income: 4000, expense: 2400 },
    { name: 'Sel', income: 3000, expense: 1398 },
    { name: 'Rab', income: 2000, expense: 9800 },
    { name: 'Kam', income: 2780, expense: 3908 },
    { name: 'Jum', income: 1890, expense: 4800 },
    { name: 'Sab', income: 2390, expense: 3800 },
    { name: 'Min', income: 3490, expense: 4300 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pendapatan (IDR)" 
          amount={stats.totalIncome} 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} 
          bg="bg-emerald-50"
          trend="+12%"
          isUp={true}
        />
        <StatCard 
          title="Pengeluaran (IDR)" 
          amount={stats.totalExpense} 
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />} 
          bg="bg-rose-50"
          trend="+4%"
          isUp={false}
        />
        <StatCard 
          title="Rawat Jalan Hari Ini" 
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
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-800">Alur Keuangan Mingguan</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Pendapatan</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">Pengeluaran</span>
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
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
              <span className="text-2xl font-bold text-slate-700">{Math.round((stats.bpjsIncome / (stats.totalIncome || 1)) * 100)}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Share BPJS</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">Transaksi Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Tipe Pasien</th>
                <th className="px-6 py-4 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{t.category}</span>
                      <span className="text-xs text-slate-400">{t.note}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      t.patientType === 'BPJS' ? 'bg-emerald-100 text-emerald-700' : 
                      t.patientType === 'Umum' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {t.patientType === 'None' ? '-' : t.patientType}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold text-right ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bg}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          {isCurrency ? formatCurrency(amount) : amount}
        </p>
      </div>
    </div>
  );
};
