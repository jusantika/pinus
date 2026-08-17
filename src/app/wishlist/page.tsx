'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Place } from '@/lib/types';
import { MapPin, Search } from 'lucide-react';

export default function WishlistPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'wishlist')
        .order('created_at', { ascending: false });

      if (!error && data) setPlaces(data);
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  const categories = ['All', 'Cafe', 'Resto', 'Wisata', 'Staycation', 'Bioskop', 'Lainnya'];

  const filteredPlaces = places.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(search.toLowerCase()) || 
                          (place.notes && place.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || place.category === category;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-[#f8f9fa] pb-32">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 mt-6 tracking-tight">Wishlist</h1>

      {/* Search & Filter */}
      <div className="flex flex-col gap-5 mb-10 sticky top-4 z-20">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-rose-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search wishlist..."
            className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                category === cat 
                  ? 'bg-rose-500 text-white shadow-[0_8px_20px_rgba(244,63,94,0.25)] scale-105' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-100 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Wishlist Grid/List */}
      <div className="space-y-6 z-10 relative">
        {loading ? (
          <div className="text-center py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-20 px-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Wishlist kosong</h3>
            <p className="text-gray-500 font-medium">Tambahkan tempat yang ingin kalian kunjungi dari peta!</p>
          </div>
        ) : (
          filteredPlaces.map((place) => (
            <div key={place.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 group animate-in fade-in slide-in-from-bottom-4 duration-500">
              {place.photos && place.photos.length > 0 && (
                <div className="w-full h-56 relative bg-gray-100 overflow-hidden">
                  <img 
                    src={place.photos[0]} 
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-gray-900 shadow-lg">
                    {place.category}
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-extrabold text-gray-900 leading-tight tracking-tight">{place.name}</h3>
                  {(!place.photos || place.photos.length === 0) && (
                    <span className="text-[10px] uppercase tracking-wider bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full font-bold">
                      {place.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 mb-5 font-medium">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Lat: {place.lat?.toFixed(3)}, Lng: {place.lng?.toFixed(3)}</span>
                </div>

                {place.notes && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-gray-600 text-[15px] italic leading-relaxed">"{place.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
