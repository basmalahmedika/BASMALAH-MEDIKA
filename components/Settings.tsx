
import React from 'react';
import { Palette, CheckCircle2 } from 'lucide-react';
import { AppTheme } from '../types';

interface SettingsProps {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const THEMES: AppTheme[] = [
  { name: 'Emerald (Hijau)', primary: 'emerald-600', secondary: 'emerald-50', accent: 'emerald-700', bgLight: 'bg-emerald-50' },
  { name: 'Ocean (Biru)', primary: 'sky-600', secondary: 'sky-50', accent: 'sky-700', bgLight: 'bg-sky-50' },
  { name: 'Ruby (Merah)', primary: 'rose-600', secondary: 'rose-50', accent: 'rose-700', bgLight: 'bg-rose-50' },
  { name: 'Amethyst (Ungu)', primary: 'indigo-600', secondary: 'indigo-50', accent: 'indigo-700', bgLight: 'bg-indigo-50' },
  { name: 'Amber (Kuning)', primary: 'amber-600', secondary: 'amber-50', accent: 'amber-700', bgLight: 'bg-amber-50' },
];

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme }) => {
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className={`p-4 bg-${theme.secondary} rounded-2xl`}>
            <Palette className={`w-8 h-8 text-${theme.primary}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Pengaturan Tema Dashboard</h2>
            <p className="text-slate-500">Sesuaikan tampilan visual aplikasi sesuai identitas brand Klinik Basmalah Medika.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((t) => (
            <button
              key={t.name}
              onClick={() => setTheme(t)}
              className={`
                relative p-6 rounded-3xl border-2 transition-all text-left overflow-hidden
                ${theme.name === t.name 
                  ? `border-${t.primary} bg-${t.secondary}/30 shadow-lg` 
                  : 'border-slate-100 bg-white hover:border-slate-200'}
              `}
            >
              {theme.name === t.name && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className={`w-6 h-6 text-${t.primary}`} />
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${t.primary} shadow-lg`} />
                <span className="font-bold text-slate-800">{t.name}</span>
              </div>
              
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full w-2/3 bg-${t.primary}`} />
                </div>
                <div className="h-2 w-1/2 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full w-3/4 bg-${t.primary} opacity-50`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-2">Catatan Kustomisasi</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Warna tema yang Anda pilih akan diterapkan di seluruh navigasi, tombol utama, dan aksen visual dalam dashboard. 
          Ini memudahkan pembedaan sesi atau penyesuaian estetika bagi pengguna yang berbeda.
        </p>
      </div>
    </div>
  );
};
