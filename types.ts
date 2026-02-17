
export type City = 
  | 'Sevilla' 
  | 'Málaga' 
  | 'Córdoba' 
  | 'Granada' 
  | 'Jaén' 
  | 'Almería' 
  | 'Huelva' 
  | 'Cádiz' 
  | 'Jerez de la Frontera';

export type HolyDay = 
  | 'Viernes de Dolores'
  | 'Sábado de Pasión'
  | 'Domingo de Ramos' 
  | 'Lunes Santo' 
  | 'Martes Santo' 
  | 'Miércoles Santo' 
  | 'Jueves Santo' 
  | 'Madrugá' 
  | 'Viernes Santo' 
  | 'Sábado Santo' 
  | 'Domingo de Resurrección';

export interface ItineraryItem {
  hour: string;
  brotherhood: string;
  location: string;
  vibe_reason: string;
  details?: string;
}

export interface ItineraryResponse {
  city: string;
  day: string;
  plan_title: string;
  itinerary: ItineraryItem[];
  extra_tips: string;
}
