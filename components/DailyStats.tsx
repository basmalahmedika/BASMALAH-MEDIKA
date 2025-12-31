
import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Stethoscope, BedDouble, ChevronRight } from 'lucide-react';
import { PatientDailyStat } from '../types';

interface DailyStatsProps {
  stats: PatientDailyStat[];
  onAdd: (s: Omit<PatientDailyStat, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const DailyStats: React.FC<DailyStatsProps> = ({ stats, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rjUmum, setRjUmum] = useState('0');
  const [rjBpjs, setRjBpjs] = useState('0');
  const [riUmum, setRiUmum] = useState('0');
  const [riBpjs, setRiBpjs] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      date,
      outpatientUmum: parseInt(rjUmum) || 0,
      outpatientBpjs: parseInt(rjBpjs) || 0,
      inpatientDischargeUmum: parseInt(riUmum) || 0,
      inpatientDischargeBpjs: parseInt(riBpjs) || 0
    });
    setShowModal(false);
    setRjUmum('0'); setRjBpjs('0'); setRiUmum('0'); setRiBpjs('0');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Kunjungan Harian</h2>
          <p className="text-sm text-slate-500">Rekapitulasi jumlah pasien dan kepulangan rawat inap</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Input Data Harian
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onDelete(s.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="font-bold text-slate-800">{s.date}</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5" /> Rawat Jalan
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {s.outpatientUmum + s.outpatientBpjs} Pasien
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Umum</span>
                    <span className="font-bold text-indigo-900">{s.outpatientUmum}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">BPJS</span>
                    <span className="font-bold text-indigo-900">{s.outpatientBpjs}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                    <BedDouble className="w-3.5 h-3.5" /> Pulang RI
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {s.inpatientDischargeUmum + s.inpatientDischargeBpjs} Pasien
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Umum</span>
                    <span className="font-bold text-amber-900">{s.inpatientDischargeUmum}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">BPJS</span>
                    <span className="font-bold text-amber-900">{s.inpatientDischargeBpjs}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="text-2xl font-bold text-slate-800">Input Data Harian</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tanggal Laporan</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-xl p-3 outline-none font-medium transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-indigo-600 flex items-center gap-2 uppercase tracking-widest">
                  <Stethoscope className="w-4 h-4" /> Kunjungan Rawat Jalan
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Umum</label>
                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-3" value={rjUmum} onChange={(e) => setRjUmum(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">BPJS</label>
                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-3" value={rjBpjs} onChange={(e) => setRjBpjs(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-amber-600 flex items-center gap-2 uppercase tracking-widest">
                  <BedDouble className="w-4 h-4" /> Pulang Rawat Inap
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Umum</label>
                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-3" value={riUmum} onChange={(e) => setRiUmum(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">BPJS</label>
                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-3" value={riBpjs} onChange={(e) => setRiBpjs(e.target.value)} />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
              >
                Simpan Data Harian
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
