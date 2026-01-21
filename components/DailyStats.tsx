
import React, { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, Calendar, ChevronRight, X, List, Download, Upload, FileSpreadsheet, BarChart3, Filter, FileText, LayoutPanelTop } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LabelList
} from 'recharts';
import { PatientDailyStat, AppTheme } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DailyStatsProps {
  stats: PatientDailyStat[];
  onAdd: (s: Omit<PatientDailyStat, 'id'>) => void;
  onDelete: (id: string) => void;
  theme: AppTheme;
}

export const DailyStats: React.FC<DailyStatsProps> = ({ stats = [], onAdd, onDelete, theme }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Input Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rjUmum, setRjUmum] = useState('');
  const [rjBpjs, setRjBpjs] = useState('');
  const [mrsUmum, setMrsUmum] = useState('');
  const [mrsBpjs, setMrsBpjs] = useState('');
  const [krsUmum, setKrsUmum] = useState(''); // KRS = Pasien Pulang
  const [krsBpjs, setKrsBpjs] = useState('');

  // Filter Chart States
  const [filterStart, setFilterStart] = useState(() => {
    const d = new Date();
    d.setDate(1); // Awal bulan
    return d.toISOString().split('T')[0];
  });
  const [filterEnd, setFilterEnd] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Filter Data untuk Grafik
  const filteredChartData = useMemo(() => {
    const data = (Array.isArray(stats) ? stats : [])
      .filter(s => s.date >= filterStart && s.date <= filterEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    return data.map(s => ({
      date: s.date ? s.date.split('-').slice(1).join('/') : '-',
      'Rawat Jalan': (s.outpatientUmum || 0) + (s.outpatientBpjs || 0),
      'Masuk (MRS)': (s.inpatientAdmissionUmum || 0) + (s.inpatientAdmissionBpjs || 0),
      'Pulang (KRS)': (s.inpatientDischargeUmum || 0) + (s.inpatientDischargeBpjs || 0),
      details: s // Simpan detail untuk tooltip kustom jika diperlukan
    }));
  }, [stats, filterStart, filterEnd]);

  // Export Excel (Semua Data)
  const handleExportXLSX = () => {
    const data = stats.map(s => ({
      Tanggal: s.date,
      'RJ Umum': s.outpatientUmum,
      'RJ BPJS': s.outpatientBpjs,
      'MRS Umum': s.inpatientAdmissionUmum,
      'MRS BPJS': s.inpatientAdmissionBpjs,
      'KRS Umum': s.inpatientDischargeUmum,
      'KRS BPJS': s.inpatientDischargeBpjs
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kunjungan Pasien");
    XLSX.writeFile(wb, `Statistik_Kunjungan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Import Excel
  const handleImportXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        data.forEach((row: any) => {
          onAdd({
            date: row.Tanggal || new Date().toISOString().split('T')[0],
            outpatientUmum: parseInt(row['RJ Umum']) || 0,
            outpatientBpjs: parseInt(row['RJ BPJS']) || 0,
            inpatientAdmissionUmum: parseInt(row['MRS Umum']) || 0,
            inpatientAdmissionBpjs: parseInt(row['MRS BPJS']) || 0,
            inpatientDischargeUmum: parseInt(row['KRS Umum']) || 0,
            inpatientDischargeBpjs: parseInt(row['KRS BPJS']) || 0,
          });
        });
        alert(`Berhasil mengimpor ${data.length} data statistik.`);
      } catch (err) { alert('Format file salah.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Download PDF Grafik
  const handleDownloadChartPDF = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(16);
      pdf.text(`Tren Kunjungan Harian (${filterStart} s/d ${filterEnd})`, 10, 15);
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save(`Grafik_Kunjungan_${filterStart}_${filterEnd}.pdf`);
    } catch (err) {
      console.error("Gagal download PDF", err);
      alert("Gagal mengunduh PDF grafik.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      date,
      outpatientUmum: parseInt(rjUmum) || 0,
      outpatientBpjs: parseInt(rjBpjs) || 0,
      inpatientAdmissionUmum: parseInt(mrsUmum) || 0, // Masuk
      inpatientAdmissionBpjs: parseInt(mrsBpjs) || 0,
      inpatientDischargeUmum: parseInt(krsUmum) || 0, // Pulang/KRS
      inpatientDischargeBpjs: parseInt(krsBpjs) || 0,
    });
    // Reset Form
    setRjUmum(''); setRjBpjs('');
    setMrsUmum(''); setMrsBpjs('');
    setKrsUmum(''); setKrsBpjs('');
    setShowModal(false);
  };

  const primaryBtnClass = theme?.primary ? `bg-${theme.primary}` : 'bg-emerald-600';
  const lightBgClass = theme?.secondary ? `bg-${theme.secondary}` : 'bg-emerald-50';
  const primaryTextClass = theme?.primary ? `text-${theme.primary}` : 'text-emerald-600';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Kunjungan Harian</h2>
          <p className="text-sm text-slate-500">Rekapitulasi pasien Rawat Jalan, Masuk (MRS), dan Pulang (KRS)</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-bold text-xs"><Upload className="w-4 h-4" /> Impor XLSX</button>
           <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleImportXLSX} />
           <button onClick={handleExportXLSX} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-bold text-xs"><Download className="w-4 h-4" /> Ekspor XLSX</button>
           <button onClick={() => setShowModal(true)} className={`flex items-center gap-2 ${primaryBtnClass} text-white px-8 py-3 rounded-2xl font-extrabold shadow-lg hover:opacity-90 transition-all active:scale-95`}><Plus className="w-4 h-4" /> Input Manual</button>
        </div>
      </div>

      {/* CHART SECTION */}
      <div ref={chartRef} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[450px] relative group/chart">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 ${lightBgClass} rounded-2xl`}><BarChart3 className={`w-6 h-6 ${primaryTextClass}`} /></div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Tren Kunjungan Harian</h3>
              <p className="text-[10px] text-slate-400 font-bold">Visualisasi perbandingan RJ vs MRS vs KRS</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="date" className="bg-transparent text-[10px] font-black outline-none w-24" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                <span className="text-slate-300 font-bold">-</span>
                <input type="date" className="bg-transparent text-[10px] font-black outline-none w-24" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
             </div>
             <button 
               onClick={handleDownloadChartPDF} 
               className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-indigo-100 transition-colors"
             >
               <FileText className="w-3 h-3" /> PDF Grafik
             </button>
          </div>
        </div>
        
        <div className="h-80 w-full">
           {filteredChartData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    labelStyle={{fontWeight: 'bold', color: '#1e293b'}}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="Masuk (MRS)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Rawat Jalan" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Pulang (KRS)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <BarChart3 className="w-12 h-12 opacity-20 mb-2" />
               <p className="text-xs font-black uppercase tracking-widest">Tidak ada data di rentang tanggal ini</p>
             </div>
           )}
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-5">Tanggal</th>
              <th className="px-6 py-5">
                <div className="flex flex-col">
                  <span>Rawat Jalan</span>
                  <span className="text-[8px] text-indigo-500">Umum / BPJS</span>
                </div>
              </th>
              <th className="px-6 py-5">
                <div className="flex flex-col">
                  <span>Masuk (MRS)</span>
                  <span className="text-[8px] text-emerald-500">Umum / BPJS</span>
                </div>
              </th>
              <th className="px-6 py-5">
                <div className="flex flex-col">
                  <span>Pulang (KRS)</span>
                  <span className="text-[8px] text-amber-500">Umum / BPJS</span>
                </div>
              </th>
              <th className="px-6 py-5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-5 font-black text-sm text-slate-900">{s.date}</td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-500">U: {s.outpatientUmum || 0}</span>
                       <span className="text-xs font-bold text-slate-500">B: {s.outpatientBpjs || 0}</span>
                     </div>
                     <span className="text-lg font-black text-indigo-600 ml-2">{(s.outpatientUmum || 0) + (s.outpatientBpjs || 0)}</span>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-500">U: {s.inpatientAdmissionUmum || 0}</span>
                       <span className="text-xs font-bold text-slate-500">B: {s.inpatientAdmissionBpjs || 0}</span>
                     </div>
                     <span className="text-lg font-black text-emerald-600 ml-2">{(s.inpatientAdmissionUmum || 0) + (s.inpatientAdmissionBpjs || 0)}</span>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-500">U: {s.inpatientDischargeUmum || 0}</span>
                       <span className="text-xs font-bold text-slate-500">B: {s.inpatientDischargeBpjs || 0}</span>
                     </div>
                     <span className="text-lg font-black text-amber-600 ml-2">{(s.inpatientDischargeUmum || 0) + (s.inpatientDischargeBpjs || 0)}</span>
                   </div>
                </td>
                <td className="px-6 py-5 text-center"><button onClick={() => onDelete(s.id)} className="p-2 text-slate-300 hover:text-rose-600 bg-transparent hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${lightBgClass}`}>
              <div>
                <h3 className="text-xl font-black text-slate-800">Input Kunjungan Harian</h3>
                <p className="text-xs text-slate-500">Masukkan detail jumlah pasien berdasarkan kategori</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-2">
                 <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Tanggal Laporan</label>
                 <input type="date" required className="w-full bg-slate-50 p-4 rounded-xl border-2 border-transparent focus:border-indigo-500/20 outline-none font-bold" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KOLOM 1: RAWAT JALAN */}
                <div className="space-y-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-500" />
                     <h4 className="text-xs font-black uppercase text-indigo-700">Rawat Jalan</h4>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Umum</label>
                     <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" value={rjUmum} onChange={(e) => setRjUmum(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">BPJS</label>
                     <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" value={rjBpjs} onChange={(e) => setRjBpjs(e.target.value)} />
                   </div>
                </div>

                {/* KOLOM 2: MASUK (MRS) */}
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
                     <h4 className="text-xs font-black uppercase text-emerald-700">Pasien Masuk (MRS)</h4>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Umum</label>
                     <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" value={mrsUmum} onChange={(e) => setMrsUmum(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">BPJS</label>
                     <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" value={mrsBpjs} onChange={(e) => setMrsBpjs(e.target.value)} />
                   </div>
                </div>

                {/* KOLOM 3: PULANG (KRS) */}
                <div className="space-y-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500" />
                     <h4 className="text-xs font-black uppercase text-amber-700">Pasien Pulang (KRS)</h4>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Umum</label>
                     <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-amber-500/20" value={krsUmum} onChange={(e) => setKrsUmum(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">BPJS</label>
                     <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-amber-500/20" value={krsBpjs} onChange={(e) => setKrsBpjs(e.target.value)} />
                   </div>
                </div>
              </div>

              <button type="submit" className={`w-full py-5 rounded-2xl text-white font-black text-lg uppercase shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all ${primaryBtnClass}`}>SIMPAN DATA KUNJUNGAN</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
