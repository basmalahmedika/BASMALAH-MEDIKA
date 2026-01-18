
import React, { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, Calendar, ChevronRight, X, List, Download, Upload, FileSpreadsheet, BarChart3, Filter } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { PatientDailyStat, AppTheme } from '../types';
import * as XLSX from 'xlsx';

interface DailyStatsProps {
  stats: PatientDailyStat[];
  onAdd: (s: Omit<PatientDailyStat, 'id'>) => void;
  onDelete: (id: string) => void;
  theme: AppTheme;
}

export const DailyStats: React.FC<DailyStatsProps> = ({ stats, onAdd, onDelete, theme }) => {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rjUmum, setRjUmum] = useState('0');
  const [rjBpjs, setRjBpjs] = useState('0');
  const [riUmum, setRiUmum] = useState('0');
  const [riBpjs, setRiBpjs] = useState('0');
  const [mrsUmum, setMrsUmum] = useState('0');
  const [mrsBpjs, setMrsBpjs] = useState('0');

  // Chart Filtering
  const [filterStart, setFilterStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [filterEnd, setFilterEnd] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStats = useMemo(() => {
    return stats
      .filter(s => s.date >= filterStart && s.date <= filterEnd)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stats, filterStart, filterEnd]);

  // UPDATE: Memisahkan 3 kategori data untuk grafik
  const chartData = useMemo(() => {
    return filteredStats.map(s => ({
      date: s.date.split('-').slice(2).join('/'),
      'Rawat Jalan': s.outpatientUmum + s.outpatientBpjs,
      'Masuk (MRS)': (s.inpatientAdmissionUmum || 0) + (s.inpatientAdmissionBpjs || 0),
      'Pulang (KRS)': s.inpatientDischargeUmum + s.inpatientDischargeBpjs,
    }));
  }, [filteredStats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      date,
      outpatientUmum: parseInt(rjUmum) || 0,
      outpatientBpjs: parseInt(rjBpjs) || 0,
      inpatientDischargeUmum: parseInt(riUmum) || 0,
      inpatientDischargeBpjs: parseInt(riBpjs) || 0,
      inpatientAdmissionUmum: parseInt(mrsUmum) || 0,
      inpatientAdmissionBpjs: parseInt(mrsBpjs) || 0,
    });
    setShowModal(false);
    setRjUmum('0'); setRjBpjs('0'); setRiUmum('0'); setRiBpjs('0'); setMrsUmum('0'); setMrsBpjs('0');
  };

  const handleDownloadXLSX = () => {
    const data = stats.map(s => ({
      Tanggal: s.date,
      'Masuk (Umum)': s.inpatientAdmissionUmum || 0,
      'Masuk (BPJS)': s.inpatientAdmissionBpjs || 0,
      'Rawat Jalan (Umum)': s.outpatientUmum,
      'Rawat Jalan (BPJS)': s.outpatientBpjs,
      'Pulang (Umum)': s.inpatientDischargeUmum,
      'Pulang (BPJS)': s.inpatientDischargeBpjs,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kunjungan Pasien");
    XLSX.writeFile(wb, `Data_Kunjungan_Basmalah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleUploadXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      data.forEach((row: any) => {
        onAdd({
          date: row.Tanggal || new Date().toISOString().split('T')[0],
          inpatientAdmissionUmum: parseInt(row['Masuk (Umum)']) || 0,
          inpatientAdmissionBpjs: parseInt(row['Masuk (BPJS)']) || 0,
          outpatientUmum: parseInt(row['Rawat Jalan (Umum)']) || 0,
          outpatientBpjs: parseInt(row['Rawat Jalan (BPJS)']) || 0,
          inpatientDischargeUmum: parseInt(row['Pulang (Umum)']) || 0,
          inpatientDischargeBpjs: parseInt(row['Pulang (BPJS)']) || 0,
        });
      });
      alert(`Berhasil mengimpor ${data.length} data kunjungan.`);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const primaryBtnClass = `bg-${theme.primary} hover:bg-${theme.accent}`;
  const lightBgClass = `bg-${theme.secondary}`;
  const primaryColorClass = `text-${theme.primary}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kunjungan Pasien Harian</h2>
          <p className="text-sm text-slate-500 font-medium italic">Monitor arus pasien masuk dan keluar</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleDownloadXLSX} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Unduh
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all shadow-sm">
            <Upload className="w-4 h-4" /> Unggah
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleUploadXLSX} />
          
          <button onClick={() => setShowModal(true)} className={`flex items-center gap-2 ${primaryBtnClass} text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg active:scale-95`}>
            <Plus className="w-4 h-4" /> Input Data
          </button>
        </div>
      </div>

      {/* GRAFIK KUNJUNGAN HARIAN DIPERBAIKI */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 ${lightBgClass} rounded-2xl`}><BarChart3 className={`w-6 h-6 ${primaryColorClass}`} /></div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Tren Kunjungan Harian</h3>
              <p className="text-[10px] text-slate-400 font-bold">Rawat Jalan vs Rawat Inap (Masuk & Keluar)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <input type="date" className="bg-transparent text-[10px] font-black outline-none px-2" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
            <span className="text-slate-300 font-bold">-</span>
            <input type="date" className="bg-transparent text-[10px] font-black outline-none px-2" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                
                {/* 3 Bar Terpisah */}
                <Bar dataKey="Masuk (MRS)" name="Masuk (MRS)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rawat Jalan" name="Rawat Jalan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pulang (KRS)" name="Pulang (KRS)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <BarChart3 className="w-12 h-12 opacity-10 mb-2" />
              <p className="text-xs font-black uppercase tracking-widest italic">Tidak ada data untuk rentang ini</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Tanggal</th>
                <th className="px-6 py-5">Masuk (MRS)</th>
                <th className="px-6 py-5">Rawat Jalan</th>
                <th className="px-6 py-5">Pulang (KRS)</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-black text-slate-900 text-sm">{s.date}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-emerald-600 font-black text-base">{(s.inpatientAdmissionUmum || 0) + (s.inpatientAdmissionBpjs || 0)} <small className="text-[10px] text-slate-400 font-bold uppercase">Pasien</small></span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">U: {s.inpatientAdmissionUmum || 0} | B: {s.inpatientAdmissionBpjs || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-indigo-600 font-black text-base">{s.outpatientUmum + s.outpatientBpjs} <small className="text-[10px] text-slate-400 font-bold uppercase">Pasien</small></span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">U: {s.outpatientUmum} | B: {s.outpatientBpjs}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-amber-600 font-black text-base">{s.inpatientDischargeUmum + s.inpatientDischargeBpjs} <small className="text-[10px] text-slate-400 font-bold uppercase">Pasien</small></span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">U: {s.inpatientDischargeUmum} | B: {s.inpatientDischargeBpjs}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button onClick={() => onDelete(s.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Form Kunjungan Harian</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Pilih Tanggal</label>
                <input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 rounded-xl p-4 font-bold outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-emerald-600">Masuk (MRS)</h4>
                  <div className="space-y-2">
                    <input type="number" placeholder="Umum" className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold" value={mrsUmum} onChange={(e) => setMrsUmum(e.target.value)} />
                    <input type="number" placeholder="BPJS" className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold" value={mrsBpjs} onChange={(e) => setMrsBpjs(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600">Rawat Jalan</h4>
                  <div className="space-y-2">
                    <input type="number" placeholder="Umum" className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold" value={rjUmum} onChange={(e) => setRjUmum(e.target.value)} />
                    <input type="number" placeholder="BPJS" className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold" value={rjBpjs} onChange={(e) => setRjBpjs(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-amber-600">Pulang (KRS)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Umum" className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold" value={riUmum} onChange={(e) => setRiUmum(e.target.value)} />
                  <input type="number" placeholder="BPJS" className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold" value={riBpjs} onChange={(e) => setRiBpjs(e.target.value)} />
                </div>
              </div>
              <button type="submit" className={`w-full ${primaryBtnClass} text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95`}>Simpan Data</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
