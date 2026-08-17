'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Place } from '@/lib/types';
import { MapPin, Search, Heart, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState(8);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setVisibleCount(4);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVisibleCount(window.innerWidth < 768 ? 4 : 8);
    }
  }, [search, category]);

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

  const categories = ['All', 'Cafe', 'Restoran', 'Wisata', 'Staycation', 'Mall', 'Lainnya'];

  const filteredPlaces = places.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(search.toLowerCase()) || 
                          (place.notes && place.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || place.category === category;
    
    return matchesSearch && matchesCategory;
  });

  const displayedPlaces = filteredPlaces.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlaces.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + (window.innerWidth < 768 ? 4 : 8));
    setTimeout(() => {
      window.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-30 bg-gray-100/85 backdrop-blur-2xl border-b border-gray-200/60 w-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
            Wishlist <Sparkles className="w-8 h-8 text-rose-500" />
          </h1>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            {/* Search Bar */}
            <div className="relative group w-full lg:max-w-md flex-shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search wishlist..."
                className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-gray-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Categories */}
            <div className="w-full overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
              <div className="flex gap-2 min-w-max">
                {categories.map((cat) => {
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="relative px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors outline-none"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="wishlist-category-pill"
                          className="absolute inset-0 bg-rose-500 rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                        {cat}
                      </span>
                      {!isActive && (
                        <div className="absolute inset-0 border border-gray-200 rounded-full bg-white/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative">
        {loading ? (
          <div className="text-center py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-6 bg-white/50 rounded-3xl border border-gray-100 max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[1.25rem] shadow-xl rotate-3 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 -rotate-3" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Wishlist Kosong</h3>
            <p className="text-gray-500 font-medium">Belum ada tempat impian yang cocok dengan pencarian atau filter Anda.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {displayedPlaces.map((place) => (
                <motion.div 
                  layout="position"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  key={place.id} 
                  className="group bg-white rounded-[2rem] shadow-[0_8px_20px_rgb(0,0,0,0.06)] border border-gray-200/60 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col hover:-translate-y-1 h-full"
                >
                  {/* Image Section (Only if exists) */}
                  {place.photos && place.photos.length > 0 && (
                    <div 
                      className="w-full aspect-[4/3] relative bg-gray-100 overflow-hidden cursor-pointer group/img"
                      onClick={() => setExpandedImage(place.photos![0])}
                    >
                      <img 
                        src={place.photos[0]} 
                        alt={place.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors duration-300" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-rose-600 shadow-lg">
                        {place.category}
                      </div>
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="text-xl font-extrabold text-gray-900 line-clamp-2 leading-tight min-h-[3.5rem]">{place.name}</h3>
                      {(!place.photos || place.photos.length === 0) && (
                        <span className="shrink-0 px-3.5 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider mt-1">
                          {place.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-sm text-gray-600 font-medium mb-5">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span className="truncate">Lat: {place.lat?.toFixed(3)}, Lng: {place.lng?.toFixed(3)}</span>
                    </div>

                    {place.notes ? (
                      <div className="mt-auto pt-5 border-t border-gray-100">
                        <p className="text-gray-600 text-[15px] italic line-clamp-3 leading-relaxed">"{place.notes}"</p>
                      </div>
                    ) : (
                      <div className="mt-auto"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="mt-12 mb-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-full font-bold shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:border-gray-300 hover:text-gray-900 transition-all active:scale-95 flex items-center gap-2"
            >
              Load More Places
            </button>
          </div>
        )}
      </div>

      {/* Image Modal (Lightbox) */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
