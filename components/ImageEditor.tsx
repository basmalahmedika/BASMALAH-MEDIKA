
import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Wand2, RefreshCw, Download, Image as ImageIcon } from 'lucide-react';
import { editImageWithGemini } from '../services/gemini';

export const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt.trim()) return;
    setIsProcessing(true);
    const result = await editImageWithGemini(image, prompt);
    if (result) {
      setEditedImage(result);
    } else {
      alert("Gagal mengedit gambar. Pastikan API Key valid dan format gambar didukung.");
    }
    setIsProcessing(false);
  };

  const reset = () => {
    setImage(null);
    setEditedImage(null);
    setPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
            <h2 className="text-2xl font-bold tracking-tight">AI Document Editor</h2>
          </div>
          <p className="text-slate-500 font-medium">Gunakan kekuatan AI untuk mengedit foto kwitansi, dokumen medis, atau filter secara instan.</p>
        </div>

        <div className="p-8 space-y-8">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="p-5 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="mt-6 font-bold text-xl">Unggah Dokumen atau Foto</h3>
              <p className="text-slate-400 mt-2">Seret file ke sini atau klik untuk memilih</p>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Original</span>
                <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
                  <img src={image} alt="Original" className="w-full h-full object-contain" />
                  <button 
                    onClick={reset}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-xl text-rose-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Hasil AI</span>
                <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center relative">
                  {editedImage ? (
                    <img src={editedImage} alt="Edited" className="w-full h-full object-contain" />
                  ) : isProcessing ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="font-bold text-indigo-600 animate-pulse">Gemini sedang bekerja...</p>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Berikan instruksi di bawah untuk melihat keajaiban</p>
                    </div>
                  )}
                  {editedImage && (
                    <a 
                      href={editedImage} 
                      download="edited-by-gemini.png"
                      className="absolute bottom-4 right-4 bg-emerald-600 text-white p-3 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all"
                    >
                      <Download className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {image && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-600 block">Apa yang ingin Anda ubah?</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Contoh: 'Tambahkan filter retro', 'Hapus watermark', 'Pertajam tulisan'"
                  className="flex-1 bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl px-6 py-4 outline-none font-medium transition-all"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                />
                <button 
                  onClick={handleEdit}
                  disabled={isProcessing || !prompt.trim()}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
                >
                  <Wand2 className="w-6 h-6" />
                  PROSES AI
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {['Add retro filter', 'Enhance clarity', 'Remove background', 'Make it black and white'].map(p => (
                  <button 
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
