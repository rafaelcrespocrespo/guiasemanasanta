
import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
  ShieldCheck,
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
  const [error, setError] = useState<{title: string, msg: string, detail?: string, showDebug?: boolean} | null>(null);

  // Verificación ultra-detallada de la API KEY
  const apiStatus = useMemo(() => {
    const rawKey = process.env.API_KEY;
    const exists = !!rawKey && rawKey !== "undefined" && rawKey !== "null";
    const isValidFormat = exists && rawKey!.length > 20; // Las keys de Gemini suelen ser largas
    return { exists, isValidFormat, value: exists ? `${rawKey!.substring(0, 5)}...` : 'No detectada' };
  }, []);

  const generateItinerary = useCallback(async () => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
      setError({
        title: "Llave Maestra no Encontrada",
        msg: "La aplicación no puede 'leer' tu API_KEY. Aunque la hayas puesto en Netlify, el código actual no la recibe.",
        detail: `Estado actual: ${apiStatus.value}. Asegúrate de que el nombre sea exactamente API_KEY (en mayúsculas) en Netlify.`,
        showDebug: true
      });
      return;
    }

    if (!vibe.trim()) {
      setError({ 
        title: "Dinos qué te apetece", 
        msg: "Para crear tu ruta perfecta, necesitamos saber si buscas bulla, silencio, música, etc." 
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
      // Usamos la key limpia (sin espacios accidentales)
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      
      const prompt = `Actúa como un experto cronista y guía profesional de la Semana Santa. 
      Genera un itinerario para la ciudad de ${city} el día ${day}.
      Preferencia del usuario: "${vibe}".
      INSTRUCCIONES:
      1. Usa Google Search para obtener datos REALES de los recorridos de 2025.
      2. Crea un plan con 4 momentos destacados del día.
      3. Explica detalladamente por qué cada sitio es ideal según la preferencia "${vibe}".
      4. Responde estrictamente en formato JSON.`;

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
      setError({
        title: "Error de Conexión Cofrade",
        msg: "No hemos podido obtener los itinerarios oficiales. Comprueba tu conexión o la validez de tu clave.",
        detail: err.message,
        showDebug: true
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [city, day, vibe, apiStatus]);

  const shareWhatsApp = () => {
    if (!result) return;
    const text = `*📿 Mi Itinerario Cofrade: ${result.plan_title}*\n_${result.city} - ${result.day}_\n\n` + 
      result.itinerary.map(i => `📍 *${i.hour}*: ${i.brotherhood}\n   _${i.location}_`).join('\n\n') +
      `\n\n_Generado por Guía Cofrade Pro_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] pb-24 overflow-x-hidden">
      {/* Header Ornamental Premium */}
      <header className="bg-[#4a0404] text-[#d4af37] pt-16 pb-56 px-6 rounded-b-[4.5rem] shadow-2xl relative border-b-8 border-[#d4af37]/30">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-serif-cofrade font-black mb-4 tracking-tighter sm:text-7xl drop-shadow-2xl">Guía Cofrade Pro</h1>
          <div className="flex items-center justify-center gap-4 opacity-70">
            <div className="h-px w-10 bg-[#d4af37]"></div>
            <p className="text-[#f3e5ab] text-[11px] uppercase font-black tracking-[0.4em]">Andalucía · MMXXV</p>
            <div className="h-px w-10 bg-[#d4af37]"></div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto -mt-48 px-4 space-y-6 relative z-20">
        {/* Panel de Control */}
        <section className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> Ciudad
              </label>
              <div className="relative">
                <select 
                  value={city} 
                  onChange={e => setCity(e.target.value as City)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-4 font-bold text-slate-800 outline-none appearance-none text-sm shadow-sm focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] rotate-90 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-[#d4af37]" /> Jornada
              </label>
              <div className="relative">
                <select 
                  value={day} 
                  onChange={e => setDay(e.target.value as HolyDay)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-4 font-bold text-slate-800 outline-none appearance-none text-sm shadow-sm focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37] rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> ¿Qué ambiente buscas?
            </label>
            <textarea 
              value={vibe} 
              onChange={e => setVibe(e.target.value)} 
              placeholder="Ej: Silencio, bandas de música, calles estrechas, barrios populares..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 px-6 min-h-[120px] text-slate-700 resize-none outline-none focus:ring-4 focus:ring-[#d4af37]/10 transition-all text-base shadow-inner font-medium placeholder-slate-300" 
            />
          </div>

          <button 
            onClick={generateItinerary} 
            disabled={loading} 
            className="w-full bg-[#4a0404] disabled:bg-slate-300 text-[#d4af37] font-black py-6.5 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(74,4,4,0.5)] active:scale-[0.96] transition-all flex items-center justify-center gap-4 border-b-8 border-[#330303] active:border-b-0 touch-manipulation"
          >
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Navigation className="w-6 h-6" />}
            <span className="text-xl tracking-tight uppercase font-serif-cofrade font-bold">Generar Mi Ruta</span>
          </button>
        </section>

        {/* Carga */}
        {loading && (
          <div className="bg-white/95 rounded-[3.5rem] p-12 flex flex-col items-center justify-center space-y-6 shadow-2xl border border-white fade-in text-center animate-pulse">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-[#d4af37]/20 border-t-[#4a0404] rounded-full animate-spin"></div>
              <Music2 className="absolute inset-0 m-auto w-8 h-8 text-[#d4af37]" />
            </div>
            <p className="text-2xl font-serif-cofrade font-bold text-[#4a0404] italic px-6 leading-tight">{loadingStep}</p>
          </div>
        )}

        {/* Error y Diagnóstico */}
        {error && (
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border-l-[10px] border-red-600 fade-in relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div className="space-y-4 w-full">
                <h3 className="font-serif-cofrade text-2xl font-bold text-slate-900 leading-none">{error.title}</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">{error.msg}</p>
                
                {error.showDebug && (
                  <div className="bg-slate-950 rounded-2xl p-5 text-[11px] font-mono text-emerald-400 space-y-2 border border-slate-800 shadow-inner">
                    <p className="text-slate-500 mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
                       <ShieldCheck className="w-3 h-3" /> INFORME DE SISTEMA
                    </p>
                    <div className="grid grid-cols-[80px_1fr] gap-x-2">
                      <span className="text-slate-500">API_KEY:</span>
                      <span>{apiStatus.value}</span>
                      <span className="text-slate-500">FORMATO:</span>
                      <span>{apiStatus.isValidFormat ? 'VÁLIDO ✓' : 'CORTO/INVÁLIDO ✗'}</span>
                      <span className="text-slate-500">SDK ERROR:</span>
                      <span className="text-red-400 break-all">{error.detail}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button onClick={() => setError(null)} className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600 hover:bg-slate-200 transition-colors">Cerrar</button>
                  <a href="https://app.netlify.com" target="_blank" className="text-[10px] font-black uppercase text-[#d4af37] border-b-2 border-[#d4af37]/20 pb-0.5">Revisar Netlify</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        {result && (
          <div className="space-y-8 fade-in pb-12">
            <div className="bg-white rounded-[4.5rem] p-10 shadow-2xl border border-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37]"></div>
              
              <div className="mb-14 text-center">
                <h2 className="text-4xl font-serif-cofrade font-extrabold text-[#4a0404] mb-4 leading-tight uppercase tracking-tight">{result.plan_title}</h2>
                <div className="inline-flex items-center gap-3 px-8 py-2.5 bg-[#fcf9f4] rounded-full border border-[#d4af37]/20">
                  <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-[0.3em]">{result.city} · {result.day}</span>
                </div>
              </div>

              <div className="space-y-16 relative before:absolute before:left-[19px] before:top-10 before:bottom-10 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[#d4af37]/40 before:to-transparent">
                {result.itinerary.map((item, i) => (
                  <div key={i} className="relative pl-14 group">
                    <div className="absolute left-0 top-1 w-11 h-11 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center z-10 shadow-xl group-hover:scale-110 transition-transform">
                      <span className="text-[#4a0404] font-black text-sm">{i + 1}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <span className="text-white font-black text-[11px] bg-[#4a0404] px-6 py-2.5 rounded-full border border-[#d4af37]/40 uppercase tracking-tighter inline-flex items-center gap-2 shadow-lg">
                        <Clock className="w-4 h-4" /> {item.hour}
                      </span>
                      <h3 className="text-3xl font-serif-cofrade font-bold text-slate-900 uppercase leading-none tracking-tight">{item.brotherhood}</h3>
                      <div className="flex items-start gap-2 text-[#d4af37] text-[14px] font-black uppercase tracking-widest leading-relaxed">
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                        <span className="border-b-2 border-[#d4af37]/15 pb-0.5">{item.location}</span>
                      </div>
                      <div className="mt-5 bg-[#fcf9f4] p-7 rounded-[3rem] border-l-[10px] border-[#d4af37] shadow-inner relative">
                        <p className="italic text-slate-700 text-[18px] leading-relaxed font-serif-cofrade font-medium">"{item.vibe_reason}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.extra_tips && (
                <div className="mt-16 p-10 bg-[#4a0404]/5 rounded-[3.5rem] border border-[#d4af37]/15 text-center relative overflow-hidden">
                   <Info className="w-6 h-6 text-[#d4af37]/40 mx-auto mb-4" />
                   <p className="text-[17px] text-slate-800 italic leading-relaxed font-serif-cofrade font-semibold">{result.extra_tips}</p>
                </div>
              )}

              {sources.length > 0 && (
                <div className="mt-14 pt-10 border-t border-slate-100 flex flex-wrap justify-center gap-4">
                  {sources.map((s, idx) => (
                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase bg-slate-50 text-slate-400 px-6 py-3 rounded-full hover:bg-[#d4af37]/10 hover:text-[#4a0404] transition-all flex items-center gap-2 border border-slate-200 shadow-sm">
                      Programa Oficial <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button onClick={shareWhatsApp} className="w-full bg-[#25d366] text-white py-7 rounded-[3.5rem] font-black flex items-center justify-center gap-4 shadow-[0_25px_50px_-15px_rgba(37,211,102,0.5)] active:scale-[0.96] transition-all text-2xl tracking-tight border-b-8 border-[#128c7e] active:border-b-0 touch-manipulation">
              <Share2 className="w-8 h-8" /> COMPARTIR POR WHATSAPP
            </button>
          </div>
        )}
      </main>

      <footer className="text-center pt-20 pb-24 opacity-40">
        <p className="text-[12px] font-black uppercase tracking-[0.8em] text-[#4a0404]">Guía Cofrade Pro · MMXXV</p>
      </footer>
    </div>
  );
};

export default App;
