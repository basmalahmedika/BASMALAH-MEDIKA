
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  CalendarDays,
  Users,
  Banknote
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
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { SummaryStats, Transaction, PatientDailyStat, BalanceItem } from '../types';

interface DashboardProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  balanceItems: BalanceItem[];
  theme: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, patientStats, balanceItems, theme }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  const dashboardStats = useMemo(() => {
    const summary = filteredTransactions.reduce((acc, curr) => {
      if (curr.type === 'Income') {
        acc.totalIncome += curr.amount;
        if (curr.patientType === 'BPJS') acc.bpjsIncome += curr.amount;
        if (curr.patientType === 'Umum') acc.umumIncome += curr.amount;
      } else {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, bpjsIncome: 0, umumIncome: 0 });
    
    return {
      ...summary,
      netProfit: summary.totalIncome - summary.totalExpense
    };
  }, [filteredTransactions]);

  const weeklyData = useMemo(() => {
    const data = [];
    const end = new Date(endDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayIncome = transactions
        .filter(t => t.date === dateStr && t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.date === dateStr && t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        Income: dayIncome,
        Expense: dayExpense
      });
    }
    return data;
  }, [transactions, endDate]);

  const monthlyData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toISOString().substring(0, 7);
      const monthIncome = transactions
        .filter(t => t.date.startsWith(monthKey) && t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);
      const monthExpense = transactions
        .filter(t => t.date.startsWith(monthKey) && t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: d.toLocaleDateString('id-ID', { month: 'short' }),
        Profit: monthIncome - monthExpense
      });
    }
    return data;
  }, [transactions]);

  const pieData = [
    { name: 'Umum', value: dashboardStats.umumIncome, color: '#10b981' },
    { name: 'BPJS', value: dashboardStats.bpjsIncome, color: '#6366f1' },
  ];

  const primaryColorClass = `text-${theme.primary}`;
  const lightBgClass = `bg-${theme.secondary}`;
  const primaryBgClass = `bg-${theme.primary}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${lightBgClass} rounded-2xl`}>
            <Filter className={`w-5 h-5 ${primaryColorClass}`} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Filter Dashboard</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Rentang data ringkasan</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-slate-300 font-bold">s/d</span>
          <input type="date" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp className="w-16 h-16 text-emerald-600" /></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Pendapatan</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(dashboardStats.totalIncome)}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingDown className="w-16 h-16 text-rose-600" /></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Pengeluaran</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(dashboardStats.totalExpense)}</h3>
        </div>
        <div className={`${primaryBgClass} p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet className="w-16 h-16" /></div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Profit Bersih</p>
          <h3 className="text-3xl font-black tracking-tighter">{formatCurrency(dashboardStats.netProfit)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className={`p-4 ${lightBgClass} rounded-[1.5rem]`}><BarChart3 className={`w-6 h-6 ${primaryColorClass}`} /></div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Tren Mingguan</h3>
              <p className="text-xs text-slate-400 font-medium italic">Pemasukan vs Pengeluaran 7 hari terakhir</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="Income" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className={`p-4 ${lightBgClass} rounded-[1.5rem]`}><CalendarDays className={`w-6 h-6 ${primaryColorClass}`} /></div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Tren Pertumbuhan Bulanan</h3>
              <p className="text-xs text-slate-400 font-medium italic">Laba bersih dalam 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="Profit" stroke="#6366f1" strokeWidth={4} dot={{r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 ${lightBgClass} rounded-[1.5rem]`}><PieChartIcon className={`w-6 h-6 ${primaryColorClass}`} /></div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Segmentasi Pendapatan</h3>
                <p className="text-xs text-slate-400 font-medium italic">Berdasarkan tipe pasien</p>
              </div>
            </div>
            <div className="h-64 w-full">
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
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                     <Users className="w-5 h-5 text-emerald-600" />
                     <h4 className="font-black text-xs text-emerald-800 uppercase tracking-wider">Pasien Umum</h4>
                  </div>
                  <p className="text-2xl font-black text-emerald-900">{formatCurrency(dashboardStats.umumIncome)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                    {dashboardStats.totalIncome > 0 ? ((dashboardStats.umumIncome / dashboardStats.totalIncome) * 100).toFixed(1) : 0}% dari total
                  </p>
               </div>
               <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                  <div className="flex items-center gap-3 mb-4">
                     <Users className="w-5 h-5 text-indigo-600" />
                     <h4 className="font-black text-xs text-indigo-800 uppercase tracking-wider">Pasien BPJS</h4>
                  </div>
                  <p className="text-2xl font-black text-indigo-900">{formatCurrency(dashboardStats.bpjsIncome)}</p>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1">
                    {dashboardStats.totalIncome > 0 ? ((dashboardStats.bpjsIncome / dashboardStats.totalIncome) * 100).toFixed(1) : 0}% dari total
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
