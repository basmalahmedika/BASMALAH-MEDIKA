
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Categories } from './components/Categories';
import { ImageEditor } from './components/ImageEditor';
import { DailyStats } from './components/DailyStats';
import { Category, Transaction, SummaryStats, PatientDailyStat } from './types';
import { INITIAL_CATEGORIES, INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'categories' | 'daily-stats' | 'ai-tool'>('dashboard');
  
  // Data State - Persistence via LocalStorage
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
    localStorage.setItem('med_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('med_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('med_patient_stats', JSON.stringify(patientStats));
  }, [patientStats]);

  // Derived Stats
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

  // Handlers
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: Date.now().toString() }, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addPatientStat = (s: Omit<PatientDailyStat, 'id'>) => {
    setPatientStats(prev => [{ ...s, id: Date.now().toString() }, ...prev]);
  };

  const deletePatientStat = (id: string) => {
    setPatientStats(prev => prev.filter(s => s.id !== id));
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const addCategory = (name: string, type: 'Income' | 'Expense') => {
    setCategories(prev => [...prev, { id: Date.now().toString(), name, type }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
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
      {activeTab === 'categories' && (
        <Categories 
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      )}
      {activeTab === 'ai-tool' && <ImageEditor />}
    </Layout>
  );
};

export default App;
