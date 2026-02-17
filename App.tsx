
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MapPin, 
  Compass, 
  Clock, 
  Loader2, 
  Share2, 
  Sparkles, 
  AlertCircle,
  Music2,
  Users2,
  ChevronRight,
  ExternalLink,
  Calendar,
  Link as LinkIcon
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
  "Consultando recorridos oficiales 2025...",
  "Buscando el mejor sitio para ver la cofradía...",
  "Siguiendo el rastro del incienso y el azahar...",
  "Esperando a que pase el último tramo de nazarenos...",
  "Afinando las marchas procesionales..."
];

const App: React.FC = () => {
  const [city, setCity] = useState<City>('Sevilla');
  const [day, setDay] = useState<HolyDay>('Domingo de Ramos');
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  const generateItinerary = useCallback(async () => {
    if (!vibe.trim()) {
      setError({ title: "Falta tu preferencia", msg: "Dime qué buscas hoy: ¿silencio?, ¿música?, ¿barrios?, ¿bulla?" });
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
    setSources([]);

    try {
      // IMPORTANTE: Creamos la instancia justo antes de usarla para asegurar que lee la API_KEY inyectada
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      const prompt = `Actúa como un experto cronista de la Semana Santa andaluza. 
      Genera un itinerario para la ciudad de ${city} el día ${day}.
      El usuario busca este ambiente: "${vibe}".
      
      REQUISITOS:
      1. Usa Google Search para obtener horarios y recorridos REALES DE 2025.
      2. Diseña un plan con 4 momentos clave: Mañana/Salida, Tarde, Noche y Recogida.
      3. Sé muy específico con calles y plazas de ${city}.
      4. Explica detalladamente por qué cada punto encaja con su preferencia ("${vibe}").
      5. Responde con un JSON estructurado según el esquema.`;

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
      
      if (response.text) {
        const data = JSON.parse(response.text) as ItineraryResponse;
        setResult(data);
        
        // Extraemos las fuentes de información (Grounding)
        const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const webLinks = grounding.filter((c: any) => c.web).map((c: any) => c.web);
        setSources(webLinks);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      
      let errorTitle = "Corte en la Procesión";
      let errorMsg = "No hemos podido conectar con los datos de 2025. Revisa que tu API_KEY en Netlify sea correcta y vuelve a intentarlo.";
      
      if (err.message?.includes('401') || err.message?.includes('API_KEY')) {
        errorTitle = "Llave de San Pedro Errónea";
        errorMsg = "La API_KEY no es válida o no ha sido detectada. Asegúrate de haber guardado la variable en Netlify y de haber hecho un nuevo 'deploy'.";
      }

      setError({ title: errorTitle, msg: errorMsg });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [city, day, vibe]);

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `*📿 Mi Itinerario Cofrade: ${result.plan_title}*\n_${result.city} - ${result.day}_\n\n` + 
      result.itinerary.map(i => `📍 *${i.hour}*: ${i.brotherhood}\n   _${i.location}_`).join('\n\n') +
      `\n\n_Vía Guía Cofrade Pro 2025_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fcf9f4] pb-24 overflow-x-hidden selection:bg-[#4a0404] selection:text-[#d4af37]">
      {/* Header Estilo Tradicional */}
      <header className="bg-[#4a0404] text-[#d4af37] pt-16 pb-44 px-6 rounded-b-[5rem] shadow-2xl relative border-b-8 border-[#d4af37]/10">
        <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-serif-cofrade font-bold mb-4 tracking-tighter drop-shadow-2xl sm:text-6xl">Guía Cofrade Pro</h1>
          <div className="flex items-center justify-center gap-5 opacity-70">
            <div className="h-px w-10 bg-[#d4af37]"></div>
            <p className="text-[#f3e5ab] text-[11px] uppercase font-black tracking-[0.5em]">Andalucía 2025</p>
            <div className="h-px w-10 bg-[#d4af37]"></div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto -mt-36 px-4 space-y-8 relative z-20">
        {/* Formulario Principal */}
        <section className="bg-white/95 backdrop-blur-md rounded-[3.5rem] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white/60">
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> Ciudad
              </label>
              <select 
                value={city} 
                onChange={e => setCity(e.target.value as City)} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none focus:border-[#d4af37]/50 transition-all appearance-none"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Calendar className="w-3.5 h-3.5 text-[#d4af37]" /> Día
              </label>
              <select 
                value={day} 
                onChange={e => setDay(e.target.value as HolyDay)} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none focus:border-[#d4af37]/50 transition-all appearance-none"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-10">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> ¿Qué buscas hoy?
            </label>
            <textarea 
              value={vibe} 
              onChange={e => setVibe(e.target.value)}
              placeholder="Ej: Silencio, cornetas y tambores, evitar bulla, ver palios..." 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] py-6 px-8 min-h-[140px] text-slate-700 resize-none outline-none focus:border-[#d4af37]/50 transition-all shadow-inner"
            />
          </div>

          <button 
            onClick={generateItinerary}
            disabled={loading}
            className="w-full bg-[#4a0404] disabled:bg-slate-300 text-[#d4af37] font-black py-7 rounded-[2.5rem] shadow-2xl active:scale-[0.96] transition-all flex items-center justify-center gap-5 border-2 border-[#d4af37]/30 group"
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Compass className="w-8 h-8" />}
            <span className="text-xl tracking-tighter uppercase">Trazar Mi Ruta 2025</span>
          </button>
        </section>

        {/* Carga */}
        {loading && (
          <div className="bg-white/95 rounded-[4rem] p-20 flex flex-col items-center justify-center space-y-8 shadow-2xl border border-white fade-in">
            <div className="w-24 h-24 border-[8px] border-[#d4af37]/10 border-t-[#4a0404] rounded-full animate-spin"></div>
            <p className="text-2xl font-serif-cofrade font-bold text-[#4a0404] italic text-center leading-tight">{loadingStep}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-900 p-10 rounded-[4rem] border border-red-100 flex flex-col gap-4 shadow-xl fade-in text-center">
            <AlertCircle className="w-10 h-10 text-red-700 mx-auto" />
            <h3 className="font-black uppercase tracking-widest text-xs text-red-700">{error.title}</h3>
            <p className="text-sm font-medium">{error.msg}</p>
          </div>
        )}

        {/* Resultado: El Itinerario */}
        {result && (
          <div className="space-y-10 fade-in pb-20">
            <div className="bg-white rounded-[4.5rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.18)] border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37]"></div>
              
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-serif-cofrade font-bold text-[#4a0404] mb-4 leading-tight">{result.plan_title}</h2>
                <div className="inline-flex items-center gap-4 px-8 py-2 bg-[#fdfaf6] rounded-full border border-[#d4af37]/30 shadow-sm">
                  <span className="text-[12px] font-black text-[#d4af37] uppercase tracking-[0.3em]">{city} · {day}</span>
                </div>
              </div>

              <div className="space-y-20 relative">
                {/* Eje de la línea de tiempo */}
                <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#d4af37]/40 to-transparent"></div>
                
                {result.itinerary.map((item, i) => (
                  <div key={i} className="relative pl-20 group">
                    <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center z-10 shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-[#4a0404] font-black text-sm">{i + 1}</span>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <span className="text-white font-black text-[12px] bg-[#4a0404] px-6 py-2 rounded-full border border-[#d4af37]/40 uppercase tracking-tighter">
                          {item.hour}
                        </span>
                      </div>
                      
                      <h3 className="text-3xl font-serif-cofrade font-bold text-slate-900 uppercase leading-none tracking-tight">
                        {item.brotherhood}
                      </h3>
                      
                      <div className="flex items-start gap-3 text-[#d4af37] text-[13px] font-black uppercase tracking-widest">
                        <MapPin className="w-5 h-5 flex-shrink-0" /> 
                        <span className="border-b-2 border-[#d4af37]/20 pb-1">{item.location}</span>
                      </div>
                      
                      <div className="mt-6 bg-[#fcf9f4] p-8 rounded-[3rem] border-l-8 border-[#d4af37] shadow-inner">
                        <p className="italic text-slate-600 text-[17px] leading-relaxed font-serif-cofrade">
                          "{item.vibe_reason}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.extra_tips && (
                <div className="mt-20 p-10 bg-[#4a0404]/5 rounded-[3.5rem] border border-[#d4af37]/20 text-center">
                   <p className="text-lg text-slate-700 italic leading-relaxed font-serif-cofrade px-6">
                     {result.extra_tips}
                   </p>
                </div>
              )}

              {/* Fuentes de Grounding (Obligatorio) */}
              {sources.length > 0 && (
                <div className="mt-16 pt-10 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
                    <LinkIcon className="w-3 h-3" /> Datos contrastados con fuentes oficiales
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] bg-slate-50 text-slate-500 px-5 py-2 rounded-full hover:bg-[#d4af37]/10 hover:text-[#4a0404] transition-all flex items-center gap-2 border border-slate-200"
                      >
                        {s.title || "Info oficial"} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={shareWhatsApp}
              className="w-full bg-[#25d366] text-white py-8 rounded-[3rem] font-black flex items-center justify-center gap-5 shadow-2xl active:scale-[0.96] transition-all text-2xl tracking-tight border-b-8 border-[#128c7e]"
            >
              <Share2 className="w-8 h-8" /> COMPARTIR PLAN COFRADE
            </button>
          </div>
        )}
      </main>

      <footer className="text-center pt-20 pb-24 opacity-40">
        <p className="text-[12px] font-black uppercase tracking-[0.8em] text-[#4a0404]">Guía Cofrade Pro 2025</p>
      </footer>
    </div>
  );
};

export default App;
