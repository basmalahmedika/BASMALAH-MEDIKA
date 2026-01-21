
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Categories } from './components/Categories';
import { ImageEditor } from './components/ImageEditor';
import { DailyStats } from './components/DailyStats';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Category, Transaction, SummaryStats, PatientDailyStat, BalanceItem, AppTheme } from './types';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS } from './constants';

const DEFAULT_THEME: AppTheme = {
  name: 'Emerald',
  primary: 'emerald-600',
  secondary: 'emerald-50',
  accent: 'emerald-700',
  bgLight: 'bg-emerald-50'
};

const App: React.FC = () => {
  const safeParse = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null || saved === 'undefined' || saved === '') return defaultValue;
      
      try {
        return JSON.parse(saved);
      } catch (parseError) {
        if (typeof defaultValue === 'string') {
          return saved;
        }
        throw parseError;
      }
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage:`, e);
      return defaultValue;
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories' | 'daily-stats' | 'ai-tool' | 'analytics' | 'settings'>(() => safeParse('med_active_tab', 'dashboard'));
  const [categories, setCategories] = useState<Category[]>(() => safeParse('med_categories', INITIAL_CATEGORIES));
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeParse('med_transactions', INITIAL_TRANSACTIONS));
  const [patientStats, setPatientStats] = useState<PatientDailyStat[]>(() => safeParse('med_patient_stats', []));
  const [balanceItems, setBalanceItems] = useState<BalanceItem[]>(() => safeParse('med_balance_items', [
    { id: 'b1', name: 'Kas & Bank', amount: 0, category: 'Asset' },
    { id: 'b2', name: 'Inventaris Medis', amount: 50000000, category: 'Asset' },
    { id: 'b3', name: 'Modal Awal', amount: 100000000, category: 'Equity' }
  ]));
  const [theme, setTheme] = useState<AppTheme>(() => safeParse('med_theme', DEFAULT_THEME));

  useEffect(() => { localStorage.setItem('med_active_tab', JSON.stringify(activeTab)); }, [activeTab]);
  useEffect(() => { localStorage.setItem('med_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('med_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('med_patient_stats', JSON.stringify(patientStats)); }, [patientStats]);
  useEffect(() => { localStorage.setItem('med_balance_items', JSON.stringify(balanceItems)); }, [balanceItems]);
  useEffect(() => { localStorage.setItem('med_theme', JSON.stringify(theme)); }, [theme]);

  // SMART STATS CALCULATION
  const stats: SummaryStats = useMemo(() => {
    const data = Array.isArray(transactions) ? transactions : [];
    const summary = data.reduce((acc, curr) => {
      if (!curr) return acc;
      
      if (curr.type === 'Income') {
        acc.totalIncome += (curr.amount || 0);
        
        // Logika Deteksi Pintar BPJS vs Umum
        // Mengecek apakah tipe pasien BPJS ATAU nama kategori mengandung 'bpjs' ATAU catatan mengandung 'bpjs'
        const isBPJS = curr.patientType === 'BPJS' || 
                       (curr.category || '').toLowerCase().includes('bpjs') || 
                       (curr.note || '').toLowerCase().includes('bpjs');
        
        const isUmum = curr.patientType === 'Umum' || (!isBPJS && curr.patientType !== 'None');

        if (isBPJS) {
          acc.bpjsIncome += (curr.amount || 0);
        } else if (isUmum) {
          acc.umumIncome += (curr.amount || 0);
        }
      } else {
        acc.totalExpense += (curr.amount || 0);
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, netProfit: 0, bpjsIncome: 0, umumIncome: 0 });
    
    summary.netProfit = summary.totalIncome - summary.totalExpense;
    return summary;
  }, [transactions]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) }, ...prev]);
  };
  const addBulkTransactions = (bulk: Omit<Transaction, 'id'>[]) => {
    const transactionsWithIds = bulk.map(t => ({ ...t, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) }));
    setTransactions(prev => [...transactionsWithIds, ...prev]);
  };
  const updateTransaction = (id: string, updated: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...updated, id } : t));
  };
  const deleteTransaction = (id: string) => {
    if(window.confirm('Hapus transaksi ini?')) setTransactions(prev => prev.filter(t => t.id !== id));
  };
  const addPatientStat = (s: Omit<PatientDailyStat, 'id'>) => {
    setPatientStats(prev => [{ ...s, id: Date.now().toString() }, ...prev]);
  };
  const deletePatientStat = (id: string) => {
    if(window.confirm('Hapus data statistik ini?')) setPatientStats(prev => prev.filter(s => s.id !== id));
  };
  const updateBalanceItem = (id: string, item: Partial<BalanceItem>) => {
    setBalanceItems(prev => prev.map(bi => bi.id === id ? { ...bi, ...item } : bi));
  };
  const addBalanceItem = (item: Omit<BalanceItem, 'id'>) => {
    setBalanceItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };
  const deleteBalanceItem = (id: string) => {
    if(window.confirm('Hapus item neraca ini?')) setBalanceItems(prev => prev.filter(bi => bi.id !== id));
  };
  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };
  const addCategory = (name: string, type: 'Income' | 'Expense') => {
    if (!name || !name.trim()) return;
    setCategories(prev => [...prev, { id: Date.now().toString(), name, type }]);
  };
  const deleteCategory = (id: string) => {
    if(window.confirm('Hapus kategori ini?')) setCategories(prev => prev.filter(c => c.id !== id));
  };
  const importAllData = (data: any) => {
    if (!data) return;
    if (data.categories) setCategories(data.categories);
    if (data.transactions) setTransactions(data.transactions);
    if (data.patientStats) setPatientStats(data.patientStats);
    if (data.balanceItems) setBalanceItems(data.balanceItems);
    if (data.theme) setTheme(data.theme);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} theme={theme}>
      {activeTab === 'dashboard' && <Dashboard stats={stats} transactions={transactions} patientStats={patientStats} balanceItems={balanceItems} theme={theme} />}
      {activeTab === 'transactions' && <Transactions transactions={transactions} categories={categories} onAdd={addTransaction} onBulkAdd={addBulkTransactions} onUpdate={updateTransaction} onDelete={deleteTransaction} theme={theme} />}
      {activeTab === 'daily-stats' && <DailyStats stats={patientStats} onAdd={addPatientStat} onDelete={deletePatientStat} theme={theme} />}
      {activeTab === 'analytics' && <Analytics stats={stats} transactions={transactions} patientStats={patientStats} balanceItems={balanceItems} onUpdateBalance={updateBalanceItem} onAddBalance={addBalanceItem} onDeleteBalance={deleteBalanceItem} onBulkAdd={addBulkTransactions} theme={theme} />}
      {activeTab === 'categories' && <Categories categories={categories} transactions={transactions} patientStats={patientStats} balanceItems={balanceItems} theme={theme} onAdd={addCategory} onUpdate={updateCategory} onDelete={deleteCategory} onImport={importAllData} />}
      {activeTab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
      {activeTab === 'ai-tool' && <ImageEditor />}
    </Layout>
  );
};

export default App;
