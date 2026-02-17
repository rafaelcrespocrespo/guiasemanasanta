
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
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

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
      // Usamos directamente la API_KEY sin comprobaciones que puedan fallar en el build
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const prompt = `Actúa como un experto historiador y cronista de la Semana Santa de Andalucía.
      Genera un itinerario optimizado para la ciudad de ${city} el día ${day}.
      Preferencia del usuario: "${vibe}".
      
      INSTRUCCIONES:
      1. Usa Google Search para encontrar itinerarios REALES y actualizados.
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
      console.error(err);
      setError({
        title: "Error de Conexión",
        msg: "No se ha podido conectar con el servicio. Verifica que la API_KEY esté bien configurada en Netlify y que tengas conexión a internet."
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
    <div className="min-h-screen bg-[#fdfaf6] pb-24 overflow-x-hidden">
      <header className="bg-[#4a0404] text-[#d4af37] pt-16 pb-52 px-6 rounded-b-[4rem] shadow-2xl relative border-b-4 border-[#d4af37]/30">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-serif-cofrade font-bold mb-4 tracking-tighter sm:text-6xl">Guía Cofrade Pro</h1>
          <p className="text-[#f3e5ab] text-[10px] uppercase font-black tracking-[0.4em] opacity-70">Andalucía · 2025</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto -mt-44 px-4 space-y-6 relative z-20">
        <section className="bg-white rounded-[3rem] p-8 shadow-xl border border-white/50">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MapPin className="w-3 h-3 text-[#d4af37]" /> Ciudad
              </label>
              <div className="relative">
                <select 
                  value={city} 
                  onChange={e => setCity(e.target.value as City)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none appearance-none text-sm"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Calendar className="w-3 h-3 text-[#d4af37]" /> Día
              </label>
              <div className="relative">
                <select 
                  value={day} 
                  onChange={e => setDay(e.target.value as HolyDay)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none appearance-none text-sm"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mb-8">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Sparkles className="w-3 h-3 text-[#d4af37]" /> ¿Qué buscas hoy?
            </label>
            <textarea 
              value={vibe} 
              onChange={e => setVibe(e.target.value)} 
              placeholder="Ej: Silencio, música de cornetas, evitar bullas, barrios..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 px-6 min-h-[110px] text-slate-700 resize-none outline-none focus:ring-2 focus:ring-[#d4af37]/20 transition-all text-sm shadow-inner" 
            />
          </div>

          <button 
            onClick={generateItinerary} 
            disabled={loading} 
            className="w-full bg-[#4a0404] disabled:bg-slate-300 text-[#d4af37] font-black py-6 rounded-[2rem] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Compass className="w-6 h-6" />}
            <span className="text-lg tracking-tight uppercase">Generar Itinerario 2025</span>
          </button>
        </section>

        {loading && (
          <div className="bg-white/90 backdrop-blur rounded-[3rem] p-12 flex flex-col items-center justify-center space-y-6 shadow-xl border border-white fade-in text-center">
            <div className="w-16 h-16 border-4 border-[#d4af37]/10 border-t-[#4a0404] rounded-full animate-spin"></div>
            <p className="text-xl font-serif-cofrade font-bold text-[#4a0404] italic px-4">{loadingStep}</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-red-50 fade-in text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-serif-cofrade text-xl font-bold text-slate-900">{error.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{error.msg}</p>
            <button onClick={() => setError(null)} className="text-[10px] font-black uppercase text-[#d4af37] border-b border-[#d4af37]/30 pb-0.5">Cerrar</button>
          </div>
        )}

        {result && (
          <div className="space-y-8 fade-in pb-12">
            <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37]"></div>
              
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-serif-cofrade font-bold text-[#4a0404] mb-3 leading-tight uppercase tracking-tight">{result.plan_title}</h2>
                <div className="inline-flex items-center gap-3 px-6 py-1.5 bg-[#fdfaf6] rounded-full border border-[#d4af37]/20">
                  <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em]">{city} · {day}</span>
                </div>
              </div>

              <div className="space-y-12 relative">
                <div className="absolute left-[20px] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent"></div>
                {result.itinerary.map((item, i) => (
                  <div key={i} className="relative pl-14 group">
                    <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border border-[#d4af37] flex items-center justify-center z-10 shadow-md">
                      <span className="text-[#4a0404] font-black text-xs">{i + 1}</span>
                    </div>
                    <div className="space-y-3">
                      <span className="text-white font-black text-[9px] bg-[#4a0404] px-4 py-1.5 rounded-full border border-[#d4af37]/30 uppercase tracking-tighter inline-block shadow-sm">
                        {item.hour}
                      </span>
                      <h3 className="text-2xl font-serif-cofrade font-bold text-slate-900 uppercase leading-none">{item.brotherhood}</h3>
                      <div className="flex items-start gap-2 text-[#d4af37] text-[11px] font-black uppercase tracking-wider leading-relaxed">
                        <MapPin className="w-4 h-4 flex-shrink-0" /> 
                        <span className="border-b border-[#d4af37]/10 pb-0.5">{item.location}</span>
                      </div>
                      <div className="mt-4 bg-[#fcf9f4] p-6 rounded-[2rem] border-l-4 border-[#d4af37] shadow-inner">
                        <p className="italic text-slate-600 text-[15px] leading-relaxed font-serif-cofrade">"{item.vibe_reason}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.extra_tips && (
                <div className="mt-12 p-8 bg-[#4a0404]/5 rounded-[2.5rem] border border-[#d4af37]/10 text-center text-[14px] text-slate-700 italic font-serif-cofrade">
                   {result.extra_tips}
                </div>
              )}

              {sources.length > 0 && (
                <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap justify-center gap-2">
                  {sources.map((s, idx) => (
                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-slate-50 text-slate-400 px-4 py-1.5 rounded-full hover:bg-[#d4af37]/10 hover:text-[#4a0404] transition-all flex items-center gap-2 border border-slate-100">
                      Fuente <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button onClick={shareWhatsApp} className="w-full bg-[#25d366] text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 shadow-xl active:scale-[0.96] transition-all text-xl tracking-tight border-b-4 border-[#128c7e]">
              <Share2 className="w-6 h-6" /> COMPARTIR POR WHATSAPP
            </button>
          </div>
        )}
      </main>

      <footer className="text-center pt-12 pb-16 opacity-20 text-[9px] font-black uppercase tracking-[0.6em] text-[#4a0404]">
        Guía Cofrade Pro · 2025
      </footer>
    </div>
  );
};

export default App;
