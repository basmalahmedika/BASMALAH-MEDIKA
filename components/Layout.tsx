
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Settings as SettingsIcon, 
  Image as ImageIcon, 
  Menu, 
  X, 
  LogOut,
  Hospital,
  BarChart3,
  PieChart,
  Palette
} from 'lucide-react';
import { AppTheme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  theme: AppTheme;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, theme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'daily-stats', label: 'Data Harian', icon: BarChart3 },
    { id: 'analytics', label: 'Analisa & Neraca', icon: PieChart },
    { id: 'categories', label: 'Kategori', icon: SettingsIcon },
    { id: 'settings', label: 'Tema Warna', icon: Palette },
    { id: 'ai-tool', label: 'AI Image Editor', icon: ImageIcon },
  ];

  // Map primary color to Tailwind class dynamically
  const primaryColorClass = `text-${theme.primary}`;
  const primaryBgClass = `bg-${theme.primary}`;
  const activeBgClass = `bg-${theme.secondary}`;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 h-20 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`p-2 ${primaryBgClass} rounded-lg shadow-lg shadow-emerald-100`}>
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight">Basmalah</span>
                <span className={`text-xs ${primaryColorClass} font-bold uppercase tracking-widest`}>Medika</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? `${activeBgClass} ${primaryColorClass} font-semibold` 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? primaryColorClass : 'text-slate-400 group-hover:text-slate-900'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold lg:text-2xl">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">Admin Basmalah</span>
              <span className="text-xs text-slate-400">Staff Keuangan & Data</span>
            </div>
            <div className={`w-10 h-10 rounded-full ${activeBgClass} flex items-center justify-center border border-slate-100 ${primaryColorClass} font-bold`}>
              BM
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </section>
      </main>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
