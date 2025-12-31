
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Category, TransactionType } from '../types';

interface CategoriesProps {
  categories: Category[];
  onAdd: (name: string, type: TransactionType) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>('Income');

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
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
  );
};

interface SectionProps extends Omit<CategoriesProps, 'onAdd' | 'onUpdate'> {
  title: string;
  type: TransactionType;
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
    <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
        {title}
        <span className="bg-slate-50 text-slate-400 text-xs px-2 py-1 rounded-full font-bold">{categories.length}</span>
      </h3>
      
      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          placeholder="Nama kategori baru..."
          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={type === newType ? newName : ''}
          onChange={(e) => {
            setNewName(e.target.value);
            setNewType(type);
          }}
        />
        <button 
          onClick={onAdd}
          className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 transition-all">
            {editingId === cat.id ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input 
                  autoFocus
                  className="flex-1 bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none font-medium"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button onClick={() => onUpdate(cat.id)} className="text-emerald-600"><Check className="w-5 h-5" /></button>
                <button onClick={() => setEditingId(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <span className="font-semibold text-slate-700">{cat.name}</span>
            )}
            
            {!editingId && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditName(cat.name);
                  }}
                  className="p-2 text-slate-400 hover:text-indigo-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(cat.id)}
                  className="p-2 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
