import React, { useState, useCallback } from 'react';
import { 
  MapPin, 
  Loader2, 
  Share2, 
  Sparkles, 
  AlertCircle,
  Music2,
  ExternalLink,
  Calendar,
  ChevronRight,
  Clock,
  Navigation,
  ScrollText,
  Info,
  BookOpen
} from 'lucide-react';
import { City, HolyDay, ItineraryResponse } from './types';

const CITIES: City[] = [
  'Sevilla', 'Málaga', 'Granada', 'Córdoba', 'Jerez de la Frontera', 
  'Cádiz', 'Huelva', 'Jaén', 'Almería'
];

const DAYS: HolyDay[] = [
  'Viernes de Dolores', 'Sábado de Pasión', 'Domingo de Ramos', 
  'Lunes Santo', 'Martes Santo', 'Miércoles Santo', 
  'Jueves Santo', 'Madrugá', 'Viernes Santo', 
  'Sábado Santo', 'Domingo de Resurrección'
];

const LOADING_MESSAGES = [
  "Abriendo el programa de mano oficial...",
  "Consultando recorridos reales de 2025...",
  "Buscando el mejor sitio según tu preferencia...",
  "Siguiendo el rastro del incienso y el azahar...",
  "Afinando las marchas procesionales...",
  "Esperando la venia en Campana..."
];

const App: React.FC = () => {
  const [city, setCity] = useState<City>('Sevilla');
  const [day, setDay] = useState<HolyDay>('Domingo de Ramos');
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [sources, setSources] = useState<{uri: string, title: string}[]>([]);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  const generateItinerary = useCallback(async () => {
    if (!vibe.trim()) {
      setError({ 
        title: "Dinos qué buscas", 
        msg: "Por favor, describe qué ambiente te apetece para que el experto pueda planificar tu ruta." 
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSources([]);

    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingStep(LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length]);
      msgIndex++;
    }, 2800);

    try {
      const response = await fetch("/.netlify/functions/generateItinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city, day, vibe }),
      });

      if (!response.ok) {
        throw new Error("Error en la función del servidor");
      }

      const data = await response.json();
      setResult(data);

    } catch (err: any) {
      console.error("Detalle del error:", err);
      setError({
        title: "Fallo en la Estación de Penitencia",
        msg: err.message || "Error al contactar con el servidor."
      });
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStep('');
    }
  }, [city, day, vibe]);

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `*📿 Mi Itinerario Cofrade: ${result.plan_title}*\n_${result.city} - ${result.day}_\n\n` + 
      result.itinerary.map(i => `📍 *${i.hour}*: ${i.brotherhood}\n   _${i.location}_`).join('\n\n') +
      `\n\n_Plan creado con Guía Cofrade Pro_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] pb-24 selection:bg-[#4a0404]/10">
      {/* TODO tu JSX exactamente igual que lo tenías */}
    </div>
  );
};

export default App;
