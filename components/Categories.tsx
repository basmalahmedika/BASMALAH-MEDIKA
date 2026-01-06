
import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Check, X, Download, Upload, Database, AlertTriangle, MonitorSmartphone } from 'lucide-react';
import { Category, TransactionType, Transaction, PatientDailyStat, BalanceItem, AppTheme } from '../types';

interface CategoriesProps {
  categories: Category[];
  transactions: Transaction[];
  patientStats: PatientDailyStat[];
  balanceItems: BalanceItem[];
  theme: AppTheme;
  onAdd: (name: string, type: TransactionType) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onImport: (data: any) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ 
  categories, transactions, patientStats, balanceItems, theme, onAdd, onUpdate, onDelete, onImport 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>('Income');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName, newType);
    setNewName('');
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    onUpdate(id, editName);
    setEditingId(null);
  };

  const exportBackup = () => {
    const backupData = {
      categories,
      transactions,
      patientStats,
      balanceItems,
      theme,
      exportedAt: new Date().toISOString(),
      version: "2.0"
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Full_Backup_BasmalahMedika_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (window.confirm("Peringatan: Mengimpor data akan menimpa seluruh data (Transaksi, Kategori, Neraca) di perangkat ini. Lanjutkan?")) {
            onImport(json);
            window.location.reload(); // Reload to apply all changes
          }
        } catch (err) {
          alert("File backup tidak valid!");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
              <MonitorSmartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sinkronisasi & Pindah Perangkat</h3>
              <p className="text-sm text-slate-500">Ekspor file JSON di perangkat lama, lalu Impor di perangkat baru untuk memindahkan semua data.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={exportBackup}
              className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Ekspor Seluruh Data
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg"
            >
              <Upload className="w-4 h-4" />
              Impor & Pulihkan
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategorySection 
          title="Kategori Pendapatan" 
          type="Income"
          categories={categories.filter(c => c.type === 'Income')}
          onDelete={onDelete}
          editingId={editingId}
          setEditingId={setEditingId}
          editName={editName}
          setEditName={setEditName}
          onUpdate={handleUpdate}
          newName={newName}
          setNewName={setNewName}
          newType={newType}
          setNewType={setNewType}
          onAdd={handleAdd}
        />
        <CategorySection 
          title="Kategori Pengeluaran" 
          type="Expense"
          categories={categories.filter(c => c.type === 'Expense')}
          onDelete={onDelete}
          editingId={editingId}
          setEditingId={setEditingId}
          editName={editName}
          setEditName={setEditName}
          onUpdate={handleUpdate}
          newName={newName}
          setNewName={setNewName}
          newType={newType}
          setNewType={setNewType}
          onAdd={handleAdd}
        />
      </div>
      
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-xs font-medium">Tips: Selalu lakukan backup setiap kali ada perubahan data besar untuk menghindari kehilangan data jika browser dibersihkan.</p>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  type: TransactionType;
  categories: Category[];
  onDelete: (id: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editName: string;
  setEditName: (n: string) => void;
  onUpdate: (id: string) => void;
  newName: string;
  setNewName: (n: string) => void;
  newType: TransactionType;
  setNewType: (t: TransactionType) => void;
  onAdd: () => void;
}

const CategorySection: React.FC<SectionProps> = ({ 
  title, type, categories, onDelete, editingId, setEditingId, editName, setEditName, onUpdate, newName, setNewName, newType, setNewType, onAdd 
}) => {
  return (
    <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold mb-6 flex items-center justify-between text-slate-800">
        {title}
        <span className="bg-slate-100 text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{categories.length} Item</span>
      </h3>
      
      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          placeholder="Nama kategori..."
          className="flex-1 bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-xl px-4 py-3 outline-none font-medium transition-all"
          value={type === newType ? newName : ''}
          onChange={(e) => { setNewName(e.target.value); setNewType(type); }}
        />
        <button onClick={onAdd} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"><Plus className="w-6 h-6" /></button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100">
            {editingId === cat.id ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input autoFocus className="flex-1 bg-white border-2 border-indigo-200 rounded-lg px-2 py-1 outline-none font-bold" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onUpdate(cat.id)} />
                <button onClick={() => onUpdate(cat.id)} className="text-emerald-600"><Check className="w-5 h-5" /></button>
                <button onClick={() => setEditingId(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <span className="font-bold text-slate-700">{cat.name}</span>
            )}
            {!editingId && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => {setEditingId(cat.id); setEditName(cat.name)}} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
