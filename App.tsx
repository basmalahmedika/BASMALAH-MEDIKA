
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Categories } from './components/Categories';
import { ImageEditor } from './components/ImageEditor';
import { DailyStats } from './components/DailyStats';
import { Analytics } from './components/Analytics';
import { Category, Transaction, SummaryStats, PatientDailyStat } from './types';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories' | 'daily-stats' | 'ai-tool' | 'analytics'>(() => {
    const saved = localStorage.getItem('med_active_tab');
    return (saved as any) || 'dashboard';
  });
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('med_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('med_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [patientStats, setPatientStats] = useState<PatientDailyStat[]>(() => {
    const saved = localStorage.getItem('med_patient_stats');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('med_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('med_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('med_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('med_patient_stats', JSON.stringify(patientStats));
  }, [patientStats]);

  const stats: SummaryStats = useMemo(() => {
    const summary = transactions.reduce((acc, curr) => {
      if (curr.type === 'Income') {
        acc.totalIncome += curr.amount;
        if (curr.patientType === 'BPJS') acc.bpjsIncome += curr.amount;
        if (curr.patientType === 'Umum') acc.umumIncome += curr.amount;
      } else {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, netProfit: 0, bpjsIncome: 0, umumIncome: 0 });
    
    summary.netProfit = summary.totalIncome - summary.totalExpense;
    return summary;
  }, [transactions]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }, ...prev]);
  };

  const addBulkTransactions = (bulk: Omit<Transaction, 'id'>[]) => {
    const transactionsWithIds = bulk.map(t => ({
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setTransactions(prev => [...transactionsWithIds, ...prev]);
    alert(`${bulk.length} transaksi berhasil ditambahkan!`);
  };

  const updateTransaction = (id: string, updated: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...updated, id } : t));
  };

  const deleteTransaction = (id: string) => {
    if(window.confirm('Hapus transaksi ini?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addPatientStat = (s: Omit<PatientDailyStat, 'id'>) => {
    setPatientStats(prev => [{ ...s, id: Date.now().toString() }, ...prev]);
  };

  const deletePatientStat = (id: string) => {
    if(window.confirm('Hapus data statistik ini?')) {
      setPatientStats(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const addCategory = (name: string, type: 'Income' | 'Expense') => {
    setCategories(prev => [...prev, { id: Date.now().toString(), name, type }]);
  };

  const deleteCategory = (id: string) => {
    if(window.confirm('Hapus kategori ini?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const importAllData = (data: { transactions: Transaction[], categories: Category[], patientStats: PatientDailyStat[] }) => {
    if (data.categories) setCategories(data.categories);
    if (data.transactions) setTransactions(data.transactions);
    if (data.patientStats) setPatientStats(data.patientStats);
    alert('Data berhasil dipulihkan!');
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          stats={stats} 
          transactions={transactions} 
          patientStats={patientStats}
        />
      )}
      {activeTab === 'transactions' && (
        <Transactions 
          transactions={transactions} 
          categories={categories}
          onAdd={addTransaction}
          onBulkAdd={addBulkTransactions}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
        />
      )}
      {activeTab === 'daily-stats' && (
        <DailyStats 
          stats={patientStats}
          onAdd={addPatientStat}
          onDelete={deletePatientStat}
        />
      )}
      {activeTab === 'analytics' && (
        <Analytics 
          stats={stats}
          transactions={transactions}
          patientStats={patientStats}
        />
      )}
      {activeTab === 'categories' && (
        <Categories 
          categories={categories}
          transactions={transactions}
          patientStats={patientStats}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onImport={importAllData}
        />
      )}
      {activeTab === 'ai-tool' && <ImageEditor />}
    </Layout>
  );
};

export default App;
