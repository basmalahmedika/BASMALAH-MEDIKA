
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
  Palette,
  ChevronRight
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

  const primaryColorClass = `text-${theme.primary}`;
  const primaryBgClass = `bg-${theme.primary}`;
  const activeBgClass = `bg-${theme.secondary}`;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar - Menghilangkan Teks/Nama Menu */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out
        lg:translate-x-0 w-20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Sidebar */}
          <div className="flex items-center justify-center h-20 border-b border-slate-100 shrink-0">
            <div className={`p-2.5 ${primaryBgClass} rounded-xl shadow-lg shadow-emerald-100`}>
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute right-4">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation - Hanya Ikon */}
          <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto">
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
                    w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? `${activeBgClass} ${primaryColorClass}` 
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                  title={item.label} 
                >
                  <Icon className={`w-6 h-6 shrink-0 ${isActive ? primaryColorClass : 'group-hover:text-slate-900'}`} />
                  
                  {isActive && (
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full ${primaryBgClass}`} />
                  )}
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-3 border-t border-slate-100">
            <button className="flex items-center justify-center w-full p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group relative" title="Keluar">
              <LogOut className="w-6 h-6 shrink-0" />
              <div className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Keluar
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-20">
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
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Basmalah Medika</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Finance Management</span>
            </div>
            <div className={`w-10 h-10 rounded-full ${activeBgClass} flex items-center justify-center border border-slate-100 ${primaryColorClass} font-bold shadow-sm`}>
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
