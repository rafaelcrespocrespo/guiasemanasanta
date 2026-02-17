
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MapPin, 
  Compass, 
  Clock, 
  Loader2, 
  Share2, 
  Sparkles, 
  AlertCircle,
  ChevronRight,
  Music2,
  Users2,
  Volume2,
  Info
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
  "Abriendo el programa de mano...",
  "Buscando el mejor balcón en la calle Sierpes...",
  "Siguiendo el rastro del incienso...",
  "Calculando la llegada a Carrera Oficial...",
  "Afinando las cornetas y tambores..."
];

const App: React.FC = () => {
  const [city, setCity] = useState<City>('Sevilla');
  const [day, setDay] = useState<HolyDay>('Domingo de Ramos');
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<{title: string, msg: string, debug?: string} | null>(null);

  // Intentar obtener la API Key de forma segura
  const getApiKey = () => {
    try {
      // @ts-ignore
      return process.env.API_KEY || '';
    } catch (e) {
      return '';
    }
  };

  const generateItinerary = useCallback(async () => {
    if (!vibe.trim()) {
      setError({ title: "Falta tu preferencia", msg: "¿Qué te apetece ver? Escribe algo como 'barrios', 'silencio' o 'muchas bandas'." });
      return;
    }

    const apiKey = getApiKey();
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      setError({ 
        title: "Llave de San Pedro no encontrada", 
        msg: "La aplicación no detecta tu API_KEY de Netlify.",
        debug: "Asegúrate de: 1. Crear la variable API_KEY en Netlify. 2. Si subes la carpeta a mano, la clave puede no funcionar. Es recomendable conectar GitHub."
      });
      return;
    }

    setLoading(true);
    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingStep(LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length]);
      msgIndex++;
    }, 2500);
    
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Actúa como el cronista oficial de la Semana Santa. 
      Genera un itinerario para la ciudad de ${city} el día ${day}.
      Preferencia del usuario: "${vibe}".
      
      REGLAS:
      1. Usa Google Search para obtener datos REALES de 2025 (horarios y calles).
      2. Crea un plan con 4 momentos (Mañana, Tarde, Noche, Madrugada/Recogida).
      3. Sé extremadamente preciso con los nombres de las calles y plazas.
      4. Explica por qué ese lugar es perfecto para lo que busca el usuario.
      5. Responde exclusivamente en JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING },
              day: { type: Type.STRING },
              plan_title: { type: Type.STRING },
              itinerary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hour: { type: Type.STRING },
                    brotherhood: { type: Type.STRING },
                    location: { type: Type.STRING },
                    vibe_reason: { type: Type.STRING }
                  },
                  required: ["hour", "brotherhood", "location", "vibe_reason"]
                }
              },
              extra_tips: { type: Type.STRING }
            },
            required: ["city", "day", "plan_title", "itinerary"]
          }
        }
      });

      clearInterval(interval);
      if (!response.text) throw new Error("No hay datos");
      const data = JSON.parse(response.text) as ItineraryResponse;
      setResult(data);
    } catch (err: any) {
      clearInterval(interval);
      setError({ 
        title: "Corte en la Cofradía", 
        msg: "Hubo un error al conectar con los servicios de Google. Revisa tu conexión o la validez de tu API Key.",
        debug: err.message
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [city, day, vibe]);

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `*📿 Mi Itinerario: ${result.plan_title}*\n_${result.city} - ${result.day}_\n\n` + 
      result.itinerary.map(i => `📍 *${i.hour}*: ${i.brotherhood}\n   _${i.location}_`).join('\n\n') +
      `\n\n_Generado por Guía Cofrade Pro_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] pb-12 overflow-x-hidden selection:bg-[#5c0b0b] selection:text-[#d4af37]">
      {/* Header Estilo Talla Barroca */}
      <header className="bg-[#4a0404] text-[#d4af37] pt-16 pb-32 px-6 rounded-b-[4.5rem] shadow-2xl relative border-b-4 border-[#d4af37]/20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-serif-cofrade font-bold mb-3 tracking-tight drop-shadow-lg">Guía Cofrade Pro</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-[#d4af37]/40"></div>
            <p className="text-[#f3e5ab]/60 text-[10px] uppercase font-black tracking-[0.5em]">Andalucía 2025</p>
            <div className="h-px w-12 bg-[#d4af37]/40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto -mt-24 px-4 space-y-6 relative z-20">
        {/* Panel de Control */}
        <section className="bg-white/95 backdrop-blur-md rounded-[3rem] p-8 shadow-2xl border border-white/20">
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <MapPin className="w-3 h-3" /> Ciudad
              </label>
              <select 
                value={city} 
                onChange={e => setCity(e.target.value as City)} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none focus:border-[#d4af37]/40 transition-all appearance-none shadow-sm cursor-pointer"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Clock className="w-3 h-3" /> Jornada
              </label>
              <select 
                value={day} 
                onChange={e => setDay(e.target.value as HolyDay)} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none focus:border-[#d4af37]/40 transition-all appearance-none shadow-sm cursor-pointer"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
              <Sparkles className="w-3 h-3" /> Preferencias del día
            </label>
            <div className="relative group">
              <textarea 
                value={vibe} 
                onChange={e => setVibe(e.target.value)}
                placeholder="Ej: Ver cofradías de barrio, escuchar cornetas, evitar aglomeraciones..." 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 px-6 min-h-[130px] text-slate-700 resize-none outline-none focus:border-[#d4af37]/40 transition-all shadow-inner group-hover:border-slate-200"
              />
              <div className="absolute right-4 bottom-4 flex gap-3 opacity-20 group-focus-within:opacity-40 transition-opacity">
                <Music2 className="w-5 h-5 text-[#4a0404]" />
                <Users2 className="w-5 h-5 text-[#4a0404]" />
              </div>
            </div>
          </div>

          <button 
            onClick={generateItinerary}
            disabled={loading}
            className="w-full bg-[#4a0404] disabled:bg-slate-300 text-[#d4af37] font-black py-6 rounded-[2rem] shadow-xl active:scale-[0.96] transition-all flex items-center justify-center gap-4 border-2 border-[#d4af37]/20"
          >
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Compass className="w-7 h-7" />}
            <span className="text-xl tracking-tight uppercase">Trazar Itinerario</span>
          </button>
        </section>

        {/* Pantalla de Carga */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-16 flex flex-col items-center justify-center space-y-8 shadow-xl border border-white fade-in">
            <div className="relative">
              <div className="w-20 h-20 border-[6px] border-[#d4af37]/10 border-t-[#4a0404] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#d4af37] animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-serif-cofrade font-bold text-[#4a0404] italic">{loadingStep}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Consultando archivos 2025</p>
            </div>
          </div>
        )}

        {/* Error y Soporte */}
        {error && (
          <div className="bg-red-50 text-red-900 p-8 rounded-[2.5rem] border border-red-100 flex flex-col gap-4 shadow-xl fade-in">
            <div className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] text-red-700">
              <AlertCircle className="w-7 h-7" /> {error.title}
            </div>
            <p className="text-sm leading-relaxed font-medium opacity-90">{error.msg}</p>
            {error.debug && (
              <div className="mt-4 p-5 bg-white/60 rounded-2xl border border-red-200/50">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-red-800 uppercase">
                  <Info className="w-3.5 h-3.5" /> Ayuda Técnica
                </div>
                <p className="text-[11px] leading-relaxed text-red-800 italic">{error.debug}</p>
              </div>
            )}
          </div>
        )}

        {/* El Resultado: El "Programa de Mano" */}
        {result && (
          <div className="space-y-8 fade-in pb-16">
            <div className="bg-white rounded-[4rem] p-10 shadow-2xl border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37]"></div>
              
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-serif-cofrade font-bold text-[#4a0404] mb-3 leading-tight">{result.plan_title}</h2>
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
                  <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-widest">{city} · {day}</span>
                </div>
              </div>

              <div className="space-y-16 relative">
                {/* Línea del tiempo ornamental */}
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent"></div>
                
                {result.itinerary.map((item, i) => (
                  <div key={i} className="relative pl-14 group">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center z-10 shadow-md group-hover:scale-110 transition-transform">
                      <span className="text-[#4a0404] font-black text-[10px]">{i + 1}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-black text-[11px] bg-[#4a0404] px-4 py-1.5 rounded-full border border-[#d4af37]/30 uppercase tracking-tighter shadow-sm">
                          {item.hour}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-serif-cofrade font-bold text-slate-900 uppercase leading-none tracking-tight pt-1">
                        {item.brotherhood}
                      </h3>
                      
                      <div className="flex items-start gap-2 text-[#d4af37] text-[11px] font-black uppercase tracking-widest">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-[-1px]" /> 
                        <span className="leading-relaxed border-b border-[#d4af37]/20 pb-0.5">{item.location}</span>
                      </div>
                      
                      <div className="mt-5 bg-[#fdfaf6] p-6 rounded-[2rem] border-l-4 border-[#d4af37] relative overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                          <Music2 className="w-12 h-12" />
                        </div>
                        <p className="italic text-slate-600 text-[15px] leading-relaxed relative z-10">
                          "{item.vibe_reason}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.extra_tips && (
                <div className="mt-20 p-8 bg-[#4a0404]/5 rounded-[2.5rem] border border-[#d4af37]/10 relative">
                   <div className="absolute -top-4 left-10 bg-white px-4 py-1 rounded-full border border-slate-100 flex items-center gap-2">
                     <Sparkles className="w-3 h-3 text-[#d4af37]" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nota del Experto</span>
                   </div>
                   <p className="text-sm text-slate-700 italic leading-relaxed text-center font-medium">
                     {result.extra_tips}
                   </p>
                </div>
              )}
            </div>

            <button 
              onClick={shareWhatsApp}
              className="w-full bg-[#25d366] text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-2xl active:scale-[0.96] transition-all text-xl tracking-tight border-b-4 border-[#128c7e]"
            >
              <Share2 className="w-7 h-7" /> COMPARTIR POR WHATSAPP
            </button>
          </div>
        )}
      </main>

      <footer className="text-center pt-10 pb-16 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#4a0404]">Guía Cofrade Pro · IA Cofrade 2025</p>
        <p className="text-[8px] mt-2 italic text-slate-400">Diseñado para la pasión de Andalucía</p>
      </footer>
    </div>
  );
};

export default App;
