
import React, { useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BarChart3,
  CalendarDays,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar,
  LineChart,
  Line,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { SummaryStats, Transaction, PatientDailyStat, BalanceItem } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DashboardProps {
  stats: SummaryStats;
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  balanceItems: BalanceItem[];
  theme: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, transactions = [], theme }) => {
  const weeklyChartRef = useRef<HTMLDivElement>(null);
  const monthlyChartRef = useRef<HTMLDivElement>(null);
  const sourceChartRef = useRef<HTMLDivElement>(null);
  const allocationChartRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const formatShortCurrency = (val: number) => {
    if (!val || isNaN(val)) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'jt';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'rb';
    return val.toString();
  };

  const incomeSourceData = useMemo(() => [
    { name: 'Pasien Umum', value: stats.umumIncome || 0, color: '#10b981' },
    { name: 'Klaim BPJS', value: stats.bpjsIncome || 0, color: '#3b82f6' }
  ], [stats]);

  const allocationData = useMemo(() => {
    const profit = stats.netProfit > 0 ? stats.netProfit : 0;
    return [
      { name: 'Biaya Operasional', value: stats.totalExpense || 0, color: '#f43f5e' },
      { name: 'Laba Bersih', value: profit, color: '#8b5cf6' }
    ];
  }, [stats]);

  const weeklyData = useMemo(() => {
    const data = [];
    const today = new Date();
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayIncome = safeTransactions
        .filter(t => t && t.date === dateStr && t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const dayExpense = safeTransactions
        .filter(t => t && t.date === dateStr && t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      data.push({
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        Income: dayIncome,
        Expense: dayExpense
      });
    }
    return data;
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const data = [];
    const now = new Date();
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toISOString().substring(0, 7);
      
      const monthIncome = safeTransactions
        .filter(t => t && t.date && t.date.startsWith(monthKey) && t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const monthExpense = safeTransactions
        .filter(t => t && t.date && t.date.startsWith(monthKey) && t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      data.push({
        name: d.toLocaleDateString('id-ID', { month: 'short' }),
        Profit: monthIncome - monthExpense
      });
    }
    return data;
  }, [transactions]);

  const exportChartToPDF = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#020617' // Slate 950 for consistent dark look
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFillColor(2, 6, 23);
      pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Export PDF Error:", err);
    }
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent === 0) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="text-slate-400 text-xs font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-bold mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-slate-200">{entry.name}:</span>
              <span className="text-white">{formatShortCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 -m-6 lg:-m-10 p-6 lg:p-10 bg-slate-950 min-h-full text-slate-100">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            Executive Dashboard
          </h2>
          <p className="text-slate-400 mt-2 font-medium">Real-time financial overview & analytics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Pemasukan</span>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-2 relative z-10">{formatCurrency(stats.totalIncome)}</h3>
          <p className="text-xs text-slate-400 font-medium relative z-10">Total akumulasi pendapatan</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">Pengeluaran</span>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-2 relative z-10">{formatCurrency(stats.totalExpense)}</h3>
          <p className="text-xs text-slate-400 font-medium relative z-10">Total biaya operasional</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-8 rounded-[2rem] relative overflow-hidden group shadow-2xl shadow-indigo-900/20">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/40">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">Profit Bersih</span>
          </div>
          <h3 className="text-4xl font-bold text-white tracking-tight mb-2 relative z-10">{formatCurrency(stats.netProfit)}</h3>
          <p className="text-xs text-indigo-200 font-medium relative z-10">Saldo kas tersedia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={sourceChartRef} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] relative min-h-[350px] group/card">
           <button onClick={() => exportChartToPDF(sourceChartRef, 'Sumber_Pendapatan')} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 opacity-0 group-hover/card:opacity-100 transition-opacity z-10"><Download className="w-4 h-4"/></button>
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700"><PieChartIcon className="w-6 h-6 text-emerald-400" /></div>
              <div>
                <h3 className="font-bold text-white text-lg">Sumber Pendapatan</h3>
                <p className="text-xs text-slate-400">Umum vs BPJS</p>
              </div>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={incomeSourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                   {incomeSourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />)}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, entry: any) => <span className="text-slate-300 font-bold ml-1">{value}</span>} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div ref={allocationChartRef} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] relative min-h-[350px] group/card">
           <button onClick={() => exportChartToPDF(allocationChartRef, 'Alokasi_Keuangan')} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 opacity-0 group-hover/card:opacity-100 transition-opacity z-10"><Download className="w-4 h-4"/></button>
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700"><TrendingUp className="w-6 h-6 text-indigo-400" /></div>
              <div>
                <h3 className="font-bold text-white text-lg">Alokasi Keuangan</h3>
                <p className="text-xs text-slate-400">Operasional vs Laba</p>
              </div>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                   {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />)}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, entry: any) => <span className="text-slate-300 font-bold ml-1">{value}</span>} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={weeklyChartRef} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] relative group/card min-h-[400px]">
          <button onClick={() => exportChartToPDF(weeklyChartRef, 'Aktivitas_Mingguan')} className="absolute top-8 right-8 p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 opacity-0 group-hover/card:opacity-100 z-10">
            <Download className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700"><BarChart3 className="w-6 h-6 text-sky-400" /></div>
            <div>
              <h3 className="font-bold text-white text-lg">Aktivitas Mingguan</h3>
              <p className="text-xs text-slate-400">Cash flow 7 hari terakhir</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '600'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '600'}} />
                <Tooltip cursor={{fill: '#1e293b'}} content={<CustomTooltip />} />
                <Bar dataKey="Income" name="Pendapatan" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="Expense" name="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div ref={monthlyChartRef} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] relative group/card min-h-[400px]">
          <button onClick={() => exportChartToPDF(monthlyChartRef, 'Pertumbuhan_Laba')} className="absolute top-8 right-8 p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 opacity-0 group-hover/card:opacity-100 z-10">
            <Download className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700"><CalendarDays className="w-6 h-6 text-violet-400" /></div>
            <div>
              <h3 className="font-bold text-white text-lg">Pertumbuhan Laba</h3>
              <p className="text-xs text-slate-400">Tren profit 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '600'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '600'}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Profit" stroke="#8b5cf6" strokeWidth={4} dot={{r: 6, fill: '#8b5cf6', strokeWidth: 4, stroke: '#1e293b'}} activeDot={{r: 8, strokeWidth: 0, fill: '#fff'}}>
                   <LabelList dataKey="Profit" position="top" formatter={formatShortCurrency} style={{ fontSize: '10px', fontWeight: '800', fill: '#a78bfa' }} offset={15} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
