'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Place } from '@/lib/types';
import { MapPin, Calendar, Users, Search, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimelinePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('status', 'visited')
        .order('visited_date', { ascending: false });

      if (!error && data) setPlaces(data);
      setLoading(false);
    };

    fetchTimeline();
  }, []);

  const categories = ['All', 'Cafe', 'Resto', 'Wisata', 'Staycation', 'Bioskop', 'Lainnya'];

  const filteredPlaces = places.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(search.toLowerCase()) || 
                          (place.notes && place.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || place.category === category;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 min-h-screen bg-[#f8f9fa] pb-32">
      
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-30 pt-8 pb-4 bg-[#f8f9fa]/85 backdrop-blur-2xl -mx-6 px-6 shadow-[0_10px_30px_-10px_rgba(248,249,250,1)]">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Memories</h1>

        <div className="flex flex-col gap-6">
          {/* Search Bar */}
          <div className="relative group max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Search memories..."
              className="w-full pl-12 pr-4 py-4 bg-white/60 border border-gray-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Categories */}
          <div className="relative -mx-6 px-6 md:mx-0 md:px-0">
            {/* Scroll hint gradient for mobile only */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#f8f9fa] to-transparent pointer-events-none md:hidden z-10" />
            
            <div className="flex md:flex-wrap gap-2.5 overflow-x-auto md:overflow-visible pb-2 scrollbar-hide">
              {categories.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="relative px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors outline-none flex-shrink-0"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="category-pill"
                        className="absolute inset-0 bg-gray-900 rounded-full"
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

      {/* Timeline List */}
      <div className="mt-8 space-y-8 relative">
        {loading ? (
          <div className="text-center py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-6 bg-white/50 rounded-3xl border border-gray-100"
          >
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Memori Kosong</h3>
            <p className="text-gray-500 font-medium">Belum ada memori yang cocok dengan pencarian atau filter Anda.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredPlaces.map((place) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={place.id} 
                className="group relative bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/60 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500 flex flex-col md:flex-row"
              >
                {/* Image Section */}
                {place.photos && place.photos.length > 0 ? (
                  <div className="w-full md:w-[40%] md:max-w-sm h-[280px] md:h-auto relative bg-gray-100 overflow-hidden flex-shrink-0">
                    <img 
                      src={place.photos[0]} 
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-gray-900 shadow-lg md:hidden">
                      {place.category}
                    </div>
                  </div>
                ) : (
                  <div className="w-full md:w-[30%] md:max-w-xs h-32 md:h-auto bg-gray-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 flex-shrink-0">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                
                {/* Content Section */}
                <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
                  <div className="flex justify-between items-start mb-2 md:mb-4">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight mb-2">{place.name}</h3>
                      <div className="hidden md:inline-block text-xs uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-bold mb-4">
                        {place.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 mb-5 font-medium">
                    {place.visited_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{new Date(place.visited_date).toLocaleDateString('id-ID', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</span>
                      </div>
                    )}
                    {place.with_who && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{place.with_who}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 truncate">Lat: {place.lat?.toFixed(3)}, Lng: {place.lng?.toFixed(3)}</span>
                    </div>
                  </div>

                  {place.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-gray-600 text-[15px] italic leading-relaxed">"{place.notes}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
