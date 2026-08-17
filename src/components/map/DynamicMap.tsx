'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';
import { Place } from '@/lib/types';
import LocationModal from './LocationModal';
import { Search, MapPin, Navigation, Bookmark, CornerUpRight, X, Maximize2 } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom SVG markers
const createCustomMarker = (colorHex: string) => {
  return L.divIcon({
    className: 'bg-transparent border-none', // Strips Leaflet's default div-icon styles
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorHex}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.25));">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
      </svg>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const searchIcon = createCustomMarker('#3b82f6'); // blue-500
const visitedIcon = createCustomMarker('#f43f5e'); // rose-500
const wishlistIcon = createCustomMarker('#10b981'); // emerald-500

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controller to fly to specific coordinates with optional Y offset
function MapController({ center, offsetY = 0 }: { center: [number, number] | null, offsetY?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.closePopup();
      
      let targetCenter = L.latLng(center[0], center[1]);
      
      if (offsetY !== 0) {
        const zoom = map.getZoom() > 14 ? map.getZoom() : 15;
        const targetPoint = map.project(targetCenter, zoom);
        targetPoint.y += offsetY; 
        targetCenter = map.unproject(targetPoint, zoom);
      }
      
      map.flyTo(targetCenter, 15, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [center, map, offsetY]);
  return null;
}

export default function DynamicMap() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [initialCenter, setInitialCenter] = useState<[number, number]>([-6.200000, 106.816666]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{lat: number, lng: number, name: string, address?: string, type?: string} | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const fetchPlaces = async () => {
    const { data, error } = await supabase.from('places').select('*');
    if (!error && data) setPlaces(data);
  };

  useEffect(() => {
    fetchPlaces();
    
    // Geolocation on load
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setInitialCenter(coords);
          setMapCenter(coords);
          setIsMapReady(true);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setIsMapReady(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsMapReady(true);
    }
  }, []);

  const handleMapClick = async (lat: number, lng: number) => {
    // Instead of directly opening the modal, let's reverse geocode the clicked location
    // and show the info card, simulating Google Maps behavior.
    setSearchedLocation(null);
    setIsReverseGeocoding(true);
    setMapCenter([lat, lng]);
    
    // We can immediately show a loading state for the card
    setSearchedLocation({ lat, lng, name: 'Loading...', address: 'Mengambil informasi lokasi...', type: 'Location' });
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      
      if (data && !data.error) {
        let shortName = data.name || (data.address && (data.address.amenity || data.address.shop || data.address.building || data.address.road || data.address.suburb)) || data.display_name.split(',')[0];
        
        setSearchedLocation({ 
          lat, 
          lng, 
          name: shortName,
          address: data.display_name,
          type: data.type ? data.type.replace(/_/g, ' ') : 'Location'
        });
      } else {
        // Fallback if no data
        setSearchedLocation({ lat, lng, name: 'Lokasi Terpilih', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, type: 'Coordinate' });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setSearchedLocation({ lat, lng, name: 'Lokasi Terpilih', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, type: 'Coordinate' });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      let queryWords = searchQuery.trim().split(/\s+/);
      let data = null;
      let usedFallback = false;
      let currentQuery = searchQuery.trim();

      while (queryWords.length > 0) {
        currentQuery = queryWords.join(' ');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentQuery)}&countrycodes=id&addressdetails=1&limit=1`);
        const result = await res.json();

        if (result && result.length > 0) {
          data = result;
          break;
        }

        // If not found, drop the last word and try again
        queryWords.pop();
        usedFallback = true;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        let shortName = result.name || result.display_name.split(',')[0];
        
        setMapCenter([lat, lon]);
        setSearchedLocation({ 
          lat, 
          lng: lon, 
          name: shortName,
          address: result.display_name,
          type: result.type ? result.type.replace(/_/g, ' ') : 'Location'
        });

        if (usedFallback) {
          alert(`Lokasi sangat spesifik tidak ditemukan. Menampilkan hasil terdekat untuk wilayah: "${currentQuery}"`);
        }
      } else {
        alert('Lokasi tidak ditemukan sama sekali. Coba kata kunci yang lebih umum.');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const panToCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      });
    }
  };

  return (
    <div className="absolute inset-0 z-0 bg-[#f8f9fa]">
      {/* Floating Search Bar (Awwwards Style) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 transition-colors ${searching ? 'text-blue-500 animate-pulse' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-4 bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
            placeholder="Cari lokasi baru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="button"
            onClick={panToCurrentLocation}
            className="absolute inset-y-0 right-2 flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Lokasi saya saat ini"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </form>
      </div>

      {!isMapReady && (
        <div className="absolute inset-0 z-[2000] bg-[#f8f9fa] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 shadow-sm"></div>
          <p className="text-gray-600 font-medium animate-pulse">Menemukan lokasimu...</p>
        </div>
      )}

      {isMapReady && (
        <MapContainer 
          center={initialCenter}
          zoom={15} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
        <MapController center={mapCenter} offsetY={searchedLocation ? 160 : 0} />
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        <MapEvents onMapClick={handleMapClick} />

        {searchedLocation && (
          <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={searchIcon} />
        )}

        {places.map((place) => (
          place.lat && place.lng ? (
            <Marker 
              key={place.id} 
              position={[place.lat, place.lng]}
              icon={place.status === 'visited' ? visitedIcon : wishlistIcon}
              eventHandlers={{
                click: () => {
                  if (searchedLocation) setSearchedLocation(null);
                }
              }}
            >
              <Popup className="premium-popup" autoPanPaddingTopLeft={[20, 120]} autoPanPaddingBottomRight={[20, 120]}>
                <div className="flex flex-col font-sans bg-white pb-2">
                  {place.photos && place.photos.length > 0 ? (
                    <div className="w-full h-40 relative bg-gray-900">
                      <img 
                        src={place.photos[0]} 
                        alt={place.name} 
                        className="w-full h-full object-cover opacity-90"
                      />
                      <a 
                        href={place.photos[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-xl text-white hover:bg-black/80 transition-all shadow-lg hover:scale-105"
                        title="Lihat foto penuh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </a>
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-gray-900 shadow-sm uppercase tracking-wider">
                        {place.category}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-16 bg-gradient-to-br from-blue-500 to-indigo-600 relative flex items-center justify-between px-3">
                       <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-white shadow-sm uppercase tracking-wider">
                        {place.category}
                      </div>
                    </div>
                  )}

                  <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
                    <h3 className="font-extrabold text-lg text-gray-900 leading-tight tracking-tight">{place.name}</h3>
                    
                    <div className="flex flex-col gap-3">
                      {place.visited_date && place.status === 'visited' && (
                        <p className="text-[13px] text-gray-600 m-0 leading-snug">
                          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shadow-sm mr-2 align-middle"></span>
                          <span className="font-semibold text-gray-800">{new Date(place.visited_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {place.with_who && <span> &bull; bersama <span className="font-bold text-gray-900">{place.with_who}</span></span>}
                        </p>
                      )}
                      
                      {place.status === 'wishlist' && (
                        <p className="text-[13px] text-emerald-600 font-bold m-0 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span> 
                          Wishlist
                        </p>
                      )}

                      {place.notes && (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner mt-1">
                          <p className="text-[12px] text-gray-700 m-0 italic leading-relaxed">
                            "{place.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
        </MapContainer>
      )}

      {/* Google Maps Style Location Card */}
      {searchedLocation && (
        <div className="absolute bottom-[110px] left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[360px] bg-white rounded-2xl shadow-xl overflow-hidden font-sans border border-gray-100 transform transition-all duration-300">
          {/* Top Image Area */}
          <div className="h-32 bg-gray-200 relative w-full">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" 
              alt={searchedLocation.name} 
              className="w-full h-full object-cover"
            />
            {/* Close Button */}
            <button 
              onClick={() => setSearchedLocation(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 flex gap-3">
            {/* Info Area */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[17px] text-gray-900 leading-tight mb-1 truncate">
                {searchedLocation.name}
              </h3>
              
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[13px] text-gray-700">4.3</span>
                <div className="flex text-[#fbbc04] text-[13px] tracking-tighter">
                  ★★★★<span className="text-gray-300">★</span>
                </div>
                <span className="text-[13px] text-gray-500 ml-1">(401)</span>
              </div>
              
              <p className="text-[14px] text-gray-600 mb-0.5 capitalize truncate">
                {searchedLocation.type}
              </p>
              <p className="text-[14px] text-[#188038] font-normal">
                Open 24 hours
              </p>
            </div>
            
            {/* Actions Area */}
            <div className="flex gap-2 items-center flex-shrink-0 self-start mt-1">
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${searchedLocation.lat},${searchedLocation.lng}`)}
                disabled={isReverseGeocoding}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isReverseGeocoding ? 'bg-gray-100 text-gray-400' : 'bg-[#e4f2fd] text-[#1a73e8] hover:bg-[#d4e9fc]'}`}
                title="Directions"
              >
                <CornerUpRight className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setSelectedCoords({ lat: searchedLocation.lat, lng: searchedLocation.lng })}
                disabled={isReverseGeocoding}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isReverseGeocoding ? 'bg-gray-100 text-gray-400' : 'bg-[#e4f2fd] text-[#1a73e8] hover:bg-[#d4e9fc]'}`}
                title="Save to List"
              >
                <Bookmark className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedCoords && (
        <LocationModal 
          lat={selectedCoords.lat}
          lng={selectedCoords.lng}
          onClose={() => setSelectedCoords(null)}
          onSuccess={fetchPlaces}
        />
      )}
    </div>
  );
}
