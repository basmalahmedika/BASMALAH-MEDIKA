
import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Check, X, Download, Upload, MonitorSmartphone, AlertCircle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { Category, TransactionType, Transaction, PatientDailyStat, BalanceItem, AppTheme } from '../types';
import * as XLSX from 'xlsx';

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
  const categoryImportRef = useRef<HTMLInputElement>(null);

  const exportBackupXLSX = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), "Transactions");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categories), "Categories");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientStats), "DailyStats");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(balanceItems), "BalanceItems");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([theme]), "Settings");
    XLSX.writeFile(wb, `Full_Backup_Basmalah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportXLSX = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!window.confirm("Tindakan ini akan MENIMPA SELURUH DATA aplikasi. Lanjutkan?")) {
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const getSheetData = (name: string) => {
            const sheet = workbook.Sheets[name];
            return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
          };
          onImport({
            transactions: getSheetData("Transactions"),
            categories: getSheetData("Categories"),
            patientStats: getSheetData("DailyStats"),
            balanceItems: getSheetData("BalanceItems"),
            theme: getSheetData("Settings")[0]
          });
          alert("Data berhasil dipulihkan!");
          window.location.reload(); 
        } catch (err) { alert("Format file salah."); }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const exportCategoriesOnly = () => {
    const data = categories.map(c => ({ Nama: c.name, Tipe: c.type === 'Income' ? 'Pendapatan' : 'Pengeluaran' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kategori");
    XLSX.writeFile(wb, `Daftar_Kategori_Medika.xlsx`);
  };

  const handleCategoryImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const name = row.Nama || row.name;
          const type = (row.Tipe === 'Pendapatan' || row.type === 'Income') ? 'Income' : 'Expense';
          if (name) onAdd(name, type);
        });
        alert(`Berhasil mengimpor ${data.length} kategori.`);
      } catch (err) { alert('Gagal mengimpor kategori.'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white/20 backdrop-blur-md rounded-3xl"><MonitorSmartphone className="w-10 h-10 text-white" /></div>
            <div>
              <h3 className="text-2xl font-black mb-1">Backup & Restore (Excel)</h3>
              <p className="text-indigo-100 text-sm max-w-md">Cadangkan atau pulihkan seluruh basis data sistem.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={exportBackupXLSX} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-xl active:scale-95"><Download className="w-5 h-5" /> UNDUH BACKUP (.XLSX)</button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-950 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95"><Upload className="w-5 h-5" /> RESTORE DARI EXCEL</button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleImportXLSX} />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-200">
         <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-3">
           <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
           Manajemen Khusus Kategori
         </h4>
         <div className="flex gap-2">
            <button onClick={exportCategoriesOnly} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all flex items-center gap-2"><Download className="w-4 h-4"/> Ekspor XLSX</button>
            <button onClick={() => categoryImportRef.current?.click()} className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all flex items-center gap-2"><Upload className="w-4 h-4"/> Impor Massal</button>
            <input type="file" ref={categoryImportRef} className="hidden" accept=".xlsx" onChange={handleCategoryImport} />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryList title="Kategori Pendapatan" type="Income" categories={categories.filter(c => c.type === 'Income')} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} editingId={editingId} setEditingId={setEditingId} editName={editName} setEditName={setEditName} newName={newName} setNewName={setNewName} />
        <CategoryList title="Kategori Pengeluaran" type="Expense" categories={categories.filter(c => c.type === 'Expense')} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} editingId={editingId} setEditingId={setEditingId} editName={editName} setEditName={setEditName} newName={newName} setNewName={setNewName} />
      </div>
    </div>
  );
};

const CategoryList: React.FC<any> = ({ title, type, categories, onAdd, onUpdate, onDelete, editingId, setEditingId, editName, setEditName, newName, setNewName }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest">{title}</h3>
      <div className="flex gap-2 mb-8">
        <input type="text" placeholder="Tambah kategori baru..." className="flex-1 bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold transition-all" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button onClick={() => { onAdd(newName, type); setNewName(''); }} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"><Plus className="w-6 h-6" /></button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {categories.map((cat: any) => (
          <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
            {editingId === cat.id ? (
              <input autoFocus className="flex-1 bg-white border-b-2 border-indigo-500 font-bold outline-none" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => { onUpdate(cat.id, editName); setEditingId(null); }} />
            ) : ( <span className="font-bold text-slate-700">{cat.name}</span> )}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => onDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
