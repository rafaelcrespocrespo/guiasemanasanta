
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MapPin, 
  Compass, 
  Loader2, 
  Share2, 
  Sparkles, 
  AlertCircle,
  Music2,
  ExternalLink,
  Calendar,
  Link as LinkIcon,
  Info,
  ChevronRight
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
  "Afinando las marchas procesionales...",
  "Esperando a que pida paso la cruz de guía..."
];

const App: React.FC = () => {
  const [city, setCity] = useState<City>('Sevilla');
  const [day, setDay] = useState<HolyDay>('Domingo de Ramos');
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<{title: string, msg: string, code?: string} | null>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      console.warn("Aviso: API_KEY no detectada.");
    }
  }, []);

  const generateItinerary = useCallback(async () => {
    if (!vibe.trim()) {
      setError({ 
        title: "Falta tu preferencia", 
        msg: "Por favor, cuéntanos qué buscas: ¿silencio?, ¿música?, ¿barrios?, ¿evitar bullas?" 
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
    setSources([]);

    try {
      const key = process.env.API_KEY;
      
      if (!key || key === "undefined" || key.length < 10) {
        throw new Error("ERR_NO_KEY");
      }

      const ai = new GoogleGenAI({ apiKey: key });
      
      const prompt = `Actúa como un experto historiador y cronista de la Semana Santa de Andalucía.
      Genera un itinerario optimizado para la ciudad de ${city} el día ${day}.
      Preferencia del usuario: "${vibe}".
      
      INSTRUCCIONES:
      1. Usa Google Search para encontrar itinerarios REALES de 2025.
      2. Plan de 4 momentos (Mañana/Salida, Tarde, Noche, Recogida).
      3. Explica por qué encaja con la preferencia del usuario.
      4. Responde estrictamente en JSON.`;

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
        const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        setSources(grounding.filter((c: any) => c.web).map((c: any) => c.web));
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error("Error completo:", err);
      
      if (err.message === "ERR_NO_KEY") {
        setError({
          title: "Clave No Detectada",
          msg: "Netlify no ha inyectado tu API_KEY correctamente.",
          code: "CONFIG_ERROR"
        });
      } else if (err.message?.includes('401') || err.message?.includes('API key not valid')) {
        setError({
          title: "Clave No Válida",
          msg: "La clave API configurada no es correcta.",
          code: "AUTH_ERROR"
        });
      } else {
        setError({
          title: "Corte en la Procesión",
          msg: "Hubo un problema al consultar los datos. Inténtalo de nuevo.",
          code: "NETWORK_ERROR"
        });
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [city, day, vibe]);

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `*📿 Mi Itinerario Cofrade: ${result.plan_title}*\n_${result.city} - ${result.day}_\n\n` + 
      result.itinerary.map(i => `📍 *${i.hour}*: ${i.brotherhood}\n   _${i.location}_`).join('\n\n') +
      `\n\n_Generado por Guía Cofrade Pro_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] pb-24 overflow-x-hidden selection:bg-[#4a0404] selection:text-[#d4af37]">
      <header className="bg-[#4a0404] text-[#d4af37] pt-16 pb-52 px-6 rounded-b-[5rem] shadow-2xl relative border-b-8 border-[#d4af37]/20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-serif-cofrade font-bold mb-4 tracking-tighter drop-shadow-2xl sm:text-7xl">Guía Cofrade Pro</h1>
          <div className="flex items-center justify-center gap-6 opacity-80">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4af37]"></div>
            <p className="text-[#f3e5ab] text-[10px] uppercase font-black tracking-[0.5em]">Andalucía 2025</p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4af37]"></div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto -mt-44 px-4 space-y-8 relative z-20">
        <section className="bg-white rounded-[3.5rem] p-10 shadow-[0_40px_100px_rgba(74,4,4,0.12)] border border-white/60">
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> Ciudad
              </label>
              <div className="relative">
                <select 
                  value={city} 
                  onChange={e => setCity(e.target.value as City)} 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4.5 px-4 font-bold text-slate-800 outline-none appearance-none transition-all"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Calendar className="w-3.5 h-3.5 text-[#d4af37]" /> Jornada
              </label>
              <div className="relative">
                <select 
                  value={day} 
                  onChange={e => setDay(e.target.value as HolyDay)} 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4.5 px-4 font-bold text-slate-800 outline-none appearance-none transition-all"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-10">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> ¿Qué buscas sentir hoy?
            </label>
            <textarea 
              value={vibe} 
              onChange={e => setVibe(e.target.value)} 
              placeholder="Ej: Palios con música, calles estrechas, evitar bullas..." 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] py-6 px-8 min-h-[130px] text-slate-700 resize-none outline-none focus:border-[#d4af37] transition-all shadow-inner" 
            />
          </div>

          <button 
            onClick={generateItinerary} 
            disabled={loading} 
            className="w-full bg-[#4a0404] disabled:bg-slate-300 text-[#d4af37] font-black py-7 rounded-[2.5rem] shadow-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-4 group"
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Compass className="w-8 h-8" />}
            <span className="text-xl tracking-tighter uppercase">Crear Itinerario 2025</span>
          </button>
        </section>

        {loading && (
          <div className="bg-white/80 backdrop-blur rounded-[3.5rem] p-20 flex flex-col items-center justify-center space-y-8 shadow-2xl border border-white fade-in">
            <div className="relative">
              <div className="w-24 h-24 border-[6px] border-[#d4af37]/10 border-t-[#4a0404] rounded-full animate-spin"></div>
              <Music2 className="absolute inset-0 m-auto w-8 h-8 text-[#d4af37] animate-pulse" />
            </div>
            <p className="text-2xl font-serif-cofrade font-bold text-[#4a0404] italic text-center leading-tight px-6">{loadingStep}</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-red-100 fade-in overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-serif-cofrade text-2xl font-bold text-slate-900">{error.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{error.msg}</p>
              
              {error.code === "CONFIG_ERROR" && (
                <div className="bg-slate-50 p-6 rounded-3xl text-left space-y-3 border border-slate-200">
                   <p className="text-[10px] font-black uppercase text-slate-400">Instrucciones:</p>
                   <p className="text-xs text-slate-700">
                     Revisa que <b>API_KEY</b> esté configurada en Netlify. 
                     Luego pulsa "Trigger deploy" {"->"} "Clear cache and deploy site".
                   </p>
                </div>
              )}
              
              <button 
                onClick={() => setError(null)} 
                className="text-xs font-black uppercase text-[#d4af37] border-b border-[#d4af37]/30 pb-1 mt-4"
              >
                Cerrar y Reintentar
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-10 fade-in pb-20">
            <div className="bg-white rounded-[4.5rem] p-12 shadow-[0_60px_120px_rgba(74,4,4,0.15)] border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37]"></div>
              
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-serif-cofrade font-bold text-[#4a0404] mb-4 leading-tight uppercase tracking-tight">{result.plan_title}</h2>
                <div className="inline-flex items-center gap-4 px-8 py-2.5 bg-[#fdfaf6] rounded-full border border-[#d4af37]/30 shadow-sm">
                  <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-[0.35em]">{city} · {day}</span>
                </div>
              </div>

              <div className="space-y-20 relative">
                <div className="absolute left-[23px] top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-[#d4af37]/40 to-transparent"></div>
                {result.itinerary.map((item, i) => (
                  <div key={i} className="relative pl-20 group">
                    <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center z-10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <span className="text-[#4a0404] font-black text-sm">{i + 1}</span>
                    </div>
                    <div className="space-y-5">
                      <span className="text-white font-black text-[11px] bg-[#4a0404] px-6 py-2 rounded-full border border-[#d4af37]/40 uppercase tracking-tighter inline-block shadow-md">
                        {item.hour}
                      </span>
                      <h3 className="text-3xl font-serif-cofrade font-bold text-slate-900 uppercase leading-none tracking-tight">{item.brotherhood}</h3>
                      <div className="flex items-start gap-3 text-[#d4af37] text-[13px] font-black uppercase tracking-widest leading-relaxed">
                        <MapPin className="w-5 h-5 flex-shrink-0" /> 
                        <span className="border-b-2 border-[#d4af37]/10 pb-1">{item.location}</span>
                      </div>
                      <div className="mt-6 bg-[#fcf9f4] p-8 rounded-[3.5rem] border-l-8 border-[#d4af37] shadow-inner relative overflow-hidden">
                        <p className="italic text-slate-600 text-[18px] leading-relaxed font-serif-cofrade">"{item.vibe_reason}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.extra_tips && (
                <div className="mt-20 p-10 bg-[#4a0404]/5 rounded-[3.5rem] border border-[#d4af37]/20 text-center">
                   <p className="text-lg text-slate-700 italic leading-relaxed font-serif-cofrade">{result.extra_tips}</p>
                </div>
              )}

              {sources.length > 0 && (
                <div className="mt-16 pt-10 border-t border-slate-100 flex flex-wrap justify-center gap-3">
                  {sources.map((s, idx) => (
                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-50 text-slate-500 px-5 py-2 rounded-full hover:bg-[#d4af37]/10 hover:text-[#4a0404] transition-all flex items-center gap-2 border border-slate-200">
                      {s.title || "Info oficial"} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button onClick={shareWhatsApp} className="w-full bg-[#25d366] text-white py-8 rounded-[3.5rem] font-black flex items-center justify-center gap-5 shadow-2xl active:scale-[0.96] transition-all text-2xl tracking-tight border-b-8 border-[#128c7e]">
              <Share2 className="w-8 h-8" /> ENVIAR PLAN POR WHATSAPP
            </button>
          </div>
        )}
      </main>

      <footer className="text-center pt-20 pb-24 opacity-30">
        <p className="text-[11px] font-black uppercase tracking-[0.8em] text-[#4a0404]">Guía Cofrade Pro 2025</p>
      </footer>
    </div>
  );
};

export default App;
