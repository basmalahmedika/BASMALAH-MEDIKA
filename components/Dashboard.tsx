
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
  ChevronDown,
  DollarSign,
  Coins
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
import { SummaryStats, Transaction, PatientDailyStat, BalanceItem } from '../types';

interface DashboardProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  balanceItems: BalanceItem[]; // Tambahkan balanceItems untuk menghitung Modal
  theme: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats: globalStats, transactions, patientStats, balanceItems, theme }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // 1. Kalkulasi Laba Hari Ini
  const dailyProfit = useMemo(() => {
    return transactions
      .filter(t => t.date === todayStr)
      .reduce((acc, curr) => curr.type === 'Income' ? acc + curr.amount : acc - curr.amount, 0);
  }, [transactions, todayStr]);

  // 2. Kalkulasi Laba Bulan Ini
  const monthlyProfit = useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(currentMonth))
      .reduce((acc, curr) => curr.type === 'Income' ? acc + curr.amount : acc - curr.amount, 0);
  }, [transactions, currentMonth]);

  // 3. Kalkulasi Saldo Kas (Termasuk Modal)
  const totalModal = useMemo(() => {
    return balanceItems
      .filter(item => item.category === 'Equity')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [balanceItems]);

  const currentCash = useMemo(() => {
    const totalIncome = transactions.reduce((acc, curr) => curr.type === 'Income' ? acc + curr.amount : acc, 0);
    const totalExpense = transactions.reduce((acc, curr) => curr.type === 'Expense' ? acc + curr.amount : acc, 0);
    return (totalModal + totalIncome) - totalExpense;
  }, [transactions, totalModal]);

  // Filtered Data based on Date Range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  const filteredPatientStats = useMemo(() => {
    return patientStats.filter(s => s.date >= startDate && s.date <= endDate);
  }, [patientStats, startDate, endDate]);

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

  const chartData = useMemo(() => {
    const grouped: Record<string, { income: number, expense: number }> = {};
    filteredTransactions.forEach(t => {
      const dateKey = t.date.split('-').slice(1).join('/');
      if (!grouped[dateKey]) grouped[dateKey] = { income: 0, expense: 0 };
      if (t.type === 'Income') grouped[dateKey].income += t.amount;
      else grouped[dateKey].expense += t.amount;
    });
    return Object.entries(grouped)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-7);
  }, [filteredTransactions]);

  const primaryColorClass = `text-${theme.primary}`;
  const lightBgClass = `bg-${theme.secondary}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Saldo Kas & Profit Cards (Highlight Utama) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-gradient-to-br from-${theme.primary} to-slate-800 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative group`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
            <Wallet className="w-24 h-24" />
          </div>
          <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-widest mb-1">Total Saldo Kas (Inc. Modal)</p>
          <h2 className="text-3xl font-black tracking-tight">{formatCurrency(currentCash)}</h2>
          <div className="mt-6 flex items-center gap-2">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Modal Awal: {formatCurrency(totalModal)}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Laba Bersih Hari Ini</p>
            <h2 className={`text-3xl font-black tracking-tight ${dailyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(dailyProfit)}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
             <CalendarIcon className="w-4 h-4" /> {todayStr}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Laba Bersih Bulan Ini</p>
            <h2 className={`text-3xl font-black tracking-tight ${monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(monthlyProfit)}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600">
             <TrendingUp className="w-4 h-4" /> {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${lightBgClass} rounded-xl`}>
            <Filter className={`w-5 h-5 ${primaryColorClass}`} />
          </div>
          <h3 className="font-bold text-slate-700">Filter Jangkauan Laporan</h3>
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

      {/* Detail Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pendapatan Filter" 
          amount={rangeStats.totalIncome} 
          icon={<TrendingUp className={`w-6 h-6 ${primaryColorClass}`} />} 
          bg={lightBgClass}
          trend="Inflow"
          isUp={true}
        />
        <StatCard 
          title="Pengeluaran Filter" 
          amount={rangeStats.totalExpense} 
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />} 
          bg="bg-rose-50"
          trend="Outflow"
          isUp={false}
        />
        <StatCard 
          title="Pasien Rawat Jalan" 
          amount={latestStat.outpatientUmum + latestStat.outpatientBpjs} 
          isCurrency={false}
          icon={<Stethoscope className="w-6 h-6 text-indigo-600" />} 
          bg="bg-indigo-50"
          trend="Terakhir"
          isUp={true}
        />
        <StatCard 
          title="Pasien Pulang" 
          amount={latestStat.inpatientDischargeUmum + latestStat.inpatientDischargeBpjs} 
          isCurrency={false}
          icon={<BedDouble className="w-6 h-6 text-amber-600" />} 
          bg="bg-amber-50"
          trend="Terakhir"
          isUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-800">Alur Keuangan</h3>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-8 text-slate-800">Sumber Pendapatan</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-bold text-slate-600">{item.name}</span>
                <span className="text-sm font-black text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<any> = ({ title, amount, icon, bg, trend, isUp, isCurrency = true }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl ${bg}`}>
          {icon}
        </div>
        <div className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
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
