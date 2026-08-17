export interface Place {
  id: string;
  created_at: string;
  name: string;
  category: 'Cafe' | 'Restoran' | 'Wisata' | 'Staycation' | 'Mall' | 'Lainnya';
  status: 'visited' | 'wishlist';
  visited_date?: string;
  with_who?: string;
  notes?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  photos?: string[];
}
