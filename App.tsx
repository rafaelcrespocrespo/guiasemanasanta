
import React, { useState, useCallback } from 'react';
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
  ChevronRight,
  Clock,
  Navigation
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
  const [error, setError] = useState<{title: string, msg: string, detail?: string} | null>(null);

  const generateItinerary = useCallback(async () => {
    if (!vibe.trim()) {
      setError({ 
        title: "Falta tu preferencia", 
        msg: "Dinos qué tipo de ambiente buscas (ej: silencio, bandas de música, barrios lejanos...)." 
      });
      return;
    }

    setLoading(true);
    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingStep(LOADING_MESSAGES[msgIndex % LOADING_MESSAGES.length]);
      msgIndex++;
    }, 2800);
    
    setError(null);
    setResult(null);
    setSources([]);

    try {
      // Inicialización estrictamente según directrices
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Eres un experto cronista de la Semana Santa de Andalucía con acceso a información en tiempo real de 2025.
      Genera un itinerario único para la ciudad de ${city} el día ${day}.
      El usuario tiene estas preferencias: "${vibe}".
      
      OBJETIVO:
      1. Usa Google Search para encontrar los horarios y recorridos REALES de 2025.
      2. Crea un plan coherente con 4 momentos clave distribuidos a lo largo del día.
      3. Explica con detalle por qué cada recomendación encaja con su preferencia de "${vibe}".
      4. Responde EXCLUSIVAMENTE en formato JSON.`;

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
            required: ["city", "day", "plan_title", "itinerary", "extra_tips"]
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
      console.error(err);
      setError({
        title: "Error de Conexión",
        msg: "No hemos podido conectar con el servicio. Esto puede deberse a la configuración de la API_KEY o problemas de red.",
        detail: err.message
      });
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
    <div className="min-h-screen bg-[#fdfaf6] pb-12 overflow-x-hidden">
      {/* Header Ornamental Premium */}
      <header className="bg-[#4a0404] text-[#d4af37] pt-14 pb-48 px-6 rounded-b-[3.5rem] shadow-2xl relative border-b-[6px] border-[#d4af37]/40 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d4af37]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-60 h-60 bg-[#d4af37]/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-serif-cofrade font-extrabold mb-3 tracking-tight sm:text-6xl drop-shadow-md">Guía Cofrade Pro</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-6 bg-[#d4af37]/60"></div>
            <p className="text-[#f3e5ab] text-[10px] uppercase font-black tracking-[0.5em] opacity-80">Andalucía · 2025</p>
            <div className="h-px w-6 bg-[#d4af37]/60"></div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto -mt-40 px-5 space-y-8 relative z-20">
        {/* Panel de Configuración */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> Ciudad
              </label>
              <div className="relative group">
                <select 
                  value={city} 
                  onChange={e => setCity(e.target.value as City)} 
                  className="w-full bg-[#fdfaf6] border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all text-sm shadow-sm"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] rotate-90 pointer-events-none opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                <Calendar className="w-3.5 h-3.5 text-[#d4af37]" /> Jornada
              </label>
              <div className="relative group">
                <select 
                  value={day} 
                  onChange={e => setDay(e.target.value as HolyDay)} 
                  className="w-full bg-[#fdfaf6] border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all text-sm shadow-sm"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] rotate-90 pointer-events-none opacity-50" />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> ¿Qué buscas hoy?
            </label>
            <textarea 
              value={vibe} 
              onChange={e => setVibe(e.target.value)} 
              placeholder="Ej: Silencio, mucha música, calles estrechas, barrios populares, evitar bullas..." 
              className="w-full bg-[#fdfaf6] border border-slate-100 rounded-[1.8rem] py-5 px-6 min-h-[120px] text-slate-700 resize-none outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition-all text-[15px] shadow-inner font-medium placeholder-slate-300" 
            />
          </div>

          <button 
            onClick={generateItinerary} 
            disabled={loading} 
            className="w-full bg-[#4a0404] disabled:bg-slate-200 text-[#d4af37] font-black py-6 rounded-[1.8rem] shadow-[0_10px_20px_-5px_rgba(74,4,4,0.4)] active:scale-[0.97] transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Navigation className="w-5 h-5" />}
            <span className="text-lg tracking-tight uppercase font-serif-cofrade font-bold">Planificar Itinerario</span>
          </button>
        </section>

        {/* Estado de Carga */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-12 flex flex-col items-center justify-center space-y-6 shadow-xl border border-white fade-in text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
              <Music2 className="absolute inset-0 m-auto w-6 h-6 text-[#d4af37] animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-serif-cofrade font-bold text-[#4a0404] italic">{loadingStep}</p>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando con programas oficiales</p>
            </div>
          </div>
        )}

        {/* Gestión de Errores */}
        {error && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-l-[6px] border-red-500 fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif-cofrade text-xl font-bold text-slate-900">{error.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{error.msg}</p>
                {error.detail && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl text-[10px] font-mono text-slate-400 break-all border border-slate-100">
                    Debug: {error.detail}
                  </div>
                )}
                <button 
                  onClick={() => setError(null)} 
                  className="text-[10px] font-black uppercase text-[#d4af37] border-b-2 border-[#d4af37]/20 pb-0.5 mt-2 transition-all hover:border-[#d4af37]"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resultados del Itinerario */}
        {result && (
          <div className="space-y-8 fade-in pb-12">
            <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#4a0404] via-[#d4af37] to-[#4a0404]"></div>
              
              <div className="mb-14 text-center">
                <h2 className="text-4xl font-serif-cofrade font-extrabold text-[#4a0404] mb-4 leading-tight uppercase tracking-tight">{result.plan_title}</h2>
                <div className="flex items-center justify-center gap-3">
                   <div className="px-4 py-1.5 bg-[#fcf9f4] rounded-full border border-[#d4af37]/20 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-[#d4af37]" />
                      <span className="text-[10px] font-black text-[#4a0404] uppercase tracking-wider">{result.city}</span>
                   </div>
                   <div className="px-4 py-1.5 bg-[#fcf9f4] rounded-full border border-[#d4af37]/20 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#d4af37]" />
                      <span className="text-[10px] font-black text-[#4a0404] uppercase tracking-wider">{result.day}</span>
                   </div>
                </div>
              </div>

              {/* Timeline Itinerary */}
              <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[#d4af37]/40 before:to-transparent">
                {result.itinerary.map((item, i) => (
                  <div key={i} className="relative pl-14 group transition-all">
                    <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center z-10 shadow-[0_4px_10px_rgba(212,175,55,0.25)] group-hover:scale-110 transition-transform">
                      <span className="text-[#4a0404] font-black text-xs">{i + 1}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-black text-[10px] bg-[#4a0404] px-4 py-1.5 rounded-full border border-[#d4af37]/30 uppercase tracking-tighter inline-flex items-center gap-2 shadow-sm">
                          <Clock className="w-3 h-3" /> {item.hour}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-2xl font-serif-cofrade font-bold text-slate-900 uppercase leading-none">{item.brotherhood}</h3>
                        <div className="flex items-start gap-2 text-[#d4af37] text-[12px] font-bold uppercase tracking-wide">
                          <Navigation className="w-3.5 h-3.5 mt-0.5" /> 
                          <span className="border-b border-[#d4af37]/20 pb-0.5">{item.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 bg-[#fcf9f4] p-6 rounded-[2rem] border-l-[5px] border-[#d4af37] shadow-inner relative">
                        <p className="italic text-slate-700 text-[16px] leading-relaxed font-serif-cofrade">"{item.vibe_reason}"</p>
                        <div className="absolute top-2 right-4 text-[#d4af37] opacity-10 font-serif text-5xl">“</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra Tips Box */}
              {result.extra_tips && (
                <div className="mt-14 p-8 bg-[#4a0404]/5 rounded-[2.5rem] border border-[#d4af37]/10 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2"><Sparkles className="w-4 h-4 text-[#d4af37]/30" /></div>
                   <p className="text-[15px] text-slate-700 italic leading-relaxed font-serif-cofrade">{result.extra_tips}</p>
                </div>
              )}

              {/* Fuentes del Grounding */}
              {sources.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-50">
                  <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest mb-4">Información verificada 2025</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[9px] bg-slate-50 text-slate-500 px-4 py-2 rounded-full hover:bg-[#d4af37]/10 hover:text-[#4a0404] transition-all flex items-center gap-2 border border-slate-100 shadow-sm"
                      >
                        {s.title || "Fuente oficial"} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Compartir WhatsApp */}
            <button 
              onClick={shareWhatsApp} 
              className="w-full bg-[#25d366] text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 shadow-[0_15px_30px_-10px_rgba(37,211,102,0.4)] active:scale-[0.96] transition-all text-xl tracking-tight border-b-4 border-[#128c7e] group"
            >
              <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" /> 
              ENVIAR POR WHATSAPP
            </button>
          </div>
        )}
      </main>

      <footer className="text-center pt-12 pb-16 opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#4a0404]">Guía Cofrade Pro · MMXV</p>
      </footer>
    </div>
  );
};

export default App;
