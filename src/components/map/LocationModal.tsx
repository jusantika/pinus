'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { Place } from '@/lib/types';
import { X, Image as ImageIcon, MapPin, ChevronDown } from 'lucide-react';

interface LocationModalProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LocationModal({ lat, lng, onClose, onSuccess }: LocationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cafe' as Place['category'],
    status: 'visited' as Place['status'],
    visited_date: '',
    with_who: '',
    notes: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = '';

      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('memory-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('memory-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      const { error: dbError } = await supabase.from('places').insert([{
        ...formData,
        visited_date: formData.visited_date || null,
        lat,
        lng,
        photos: photoUrl ? [photoUrl] : [],
      }]);

      if (dbError) throw dbError;

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Close modal when clicking on the background overlay
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center transition-all duration-300 animate-in fade-in"
      onClick={handleBackgroundClick}
    >
      <div 
        className="bg-white w-full sm:max-w-md rounded-3xl max-h-[85dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 p-6 z-10 flex justify-between items-start rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pin Lokasi</h2>
            <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {showSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center min-h-[300px] animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Tersimpan!</h3>
            <p className="text-gray-500 text-center font-medium">Lokasi berhasil ditambahkan ke daftar memori kalian.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto pb-8">
            <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Tempat</label>
              <input 
                required
                type="text" 
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl p-4 text-gray-900 font-medium text-lg outline-none ring-0 focus:ring-4 ring-blue-500/10 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Misal: Kopi Kenangan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kategori</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl p-4 pr-10 text-gray-900 font-medium outline-none ring-0 focus:ring-4 ring-blue-500/10 transition-all appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as Place['category']})}
                  >
                    <option value="Cafe">Cafe</option>
                    <option value="Restoran">Restoran</option>
                    <option value="Wisata">Wisata</option>
                    <option value="Staycation">Staycation</option>
                    <option value="Mall">Mall</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <div className="flex bg-gray-50 p-1.5 rounded-2xl h-[56px]">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'visited'})}
                    className={`flex-1 rounded-xl text-sm font-bold transition-all cursor-pointer ${formData.status === 'visited' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Visited
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'wishlist'})}
                    className={`flex-1 rounded-xl text-sm font-bold transition-all cursor-pointer ${formData.status === 'wishlist' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Wishlist
                  </button>
                </div>
              </div>
            </div>

            {formData.status === 'visited' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tanggal</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl p-4 text-gray-900 font-medium outline-none ring-0 focus:ring-4 ring-blue-500/10 transition-all"
                    value={formData.visited_date}
                    onChange={(e) => setFormData({...formData, visited_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bersama</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl p-4 text-gray-900 font-medium outline-none ring-0 focus:ring-4 ring-blue-500/10 transition-all"
                    value={formData.with_who}
                    onChange={(e) => setFormData({...formData, with_who: e.target.value})}
                    placeholder="Misal: Ayang"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Catatan</label>
              <textarea 
                rows={3}
                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl p-4 text-gray-900 font-medium outline-none ring-0 focus:ring-4 ring-blue-500/10 transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Tulis kenangan atau review di sini..."
              />
            </div>

            {formData.status === 'visited' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Foto Kenangan</label>
                <div className="relative overflow-hidden bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-2xl p-4 transition-colors group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none text-gray-500 group-hover:text-blue-600 transition-colors">
                    <ImageIcon className="w-8 h-8" />
                    <span className="font-semibold text-sm">
                      {photo ? photo.name : 'Pilih atau drop foto di sini'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : 'Simpan Lokasi'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>,
    document.body
  );
}
