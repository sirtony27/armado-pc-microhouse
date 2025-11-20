'use client';

import { componentes } from '@/data/componentes';
import { formatPrecio } from '@/lib/utils';
import { Check, Box, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'
import { useRemotePrices } from '@/lib/pricing';

export default function GabineteSelector() {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gabinetesDb, setGabinetesDb] = useState<any[]>([])
  const [vw, setVw] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => { const onResize = () => setVw(window.innerWidth); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
  const isMobile = vw < 768;
  const cardSpacing = isMobile ? 220 : 360;
  const centerScale = isMobile ? 0.98 : 1;
  const sideScale = isMobile ? 0.85 : 0.75;
  const tiltDeg = isMobile ? 10 : 18;
  useEffect(() => { (async () => {
    try {
      const { data } = await supabase
        .from('componentes')
        .select('*')
        .eq('tipo','GABINETE')
        .throwOnError()
      setGabinetesDb((data as any) || [])
    } catch (err) {
      console.error('Error fetching gabinetes:', (err as any)?.message || err, err)
    }
  })() }, [])

  const gabinetes = gabinetesDb;
  const remotePrices = useRemotePrices(gabinetes);

  const nextGabinete = () => {
    if (isTransitioning || gabinetes.length === 0) return;
    setIsTransitioning(true);
    const nextIdx = (currentIndex + 1) % gabinetes.length;
    setCurrentIndex(nextIdx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevGabinete = () => {
    if (isTransitioning || gabinetes.length === 0) return;
    setIsTransitioning(true);
    const prevIdx = (currentIndex - 1 + gabinetes.length) % gabinetes.length;
    setCurrentIndex(prevIdx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-hidden">
      <div className="text-center mb-6 animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Box className="h-7 w-7 text-[#E02127]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
            Elegí tu Gabinete
          </h1>
        </div>
        <p className="text-slate-600 text-xs">Seleccioná el gabinete que más te guste para tu PC</p>
      </div>

      <div 
        className="relative w-full max-w-7xl md:h-[480px] min-h-[360px] flex items-center justify-center mb-4"
        style={{ perspective: '2500px', perspectiveOrigin: 'center' }}
      >
        <button
          onClick={prevGabinete}
          disabled={isTransitioning}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-2 md:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-[#E02127]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-[#E02127] transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        <button
          onClick={nextGabinete}
          disabled={isTransitioning}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-2 md:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-[#E02127]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-[#E02127] transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center">
          {gabinetes.map((gabinete, index) => {
            const position = index - currentIndex;
            const isVisible = Math.abs(position) <= 2;
            
            if (!isVisible) return null;
            
            return (
              <div
                key={gabinete.id}
                className={`absolute ${position === 0 ? 'z-20' : 'z-0'}`}
                style={{
                  transform: `
                    translateX(${position * cardSpacing}px)
                    scale(${position === 0 ? centerScale : sideScale})
                    rotateY(${position * -tiltDeg}deg)
                  `,
                  opacity: position === 0 ? 1 : Math.max(0, 0.6 - Math.abs(position) * 0.2),
                  pointerEvents: position === 0 ? 'auto' : 'none',
                  transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: position !== 0 ? `blur(${Math.abs(position) * 2}px)` : 'blur(0px)',
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => position === 0 && cambiarComponente('GABINETE', gabinete.id)}
              >
                <div 
                  className={`bg-white rounded-2xl p-6 text-center w-[85vw] max-w-[360px] relative overflow-visible ${
                    position === 0 ? 'shadow-[0_0_0_3px_rgba(224,33,39,0.3),0_20px_60px_-10px_rgba(224,33,39,0.4)] animate-glow-pulse' : 'shadow-2xl'
                  }`}
                  style={{ cursor: position === 0 ? 'pointer' : 'default' }}
                >
                  {(() => {
                    const raw = (gabinete as any)?.imagen_url ?? (gabinete as any)?.image_url ?? (gabinete as any)?.imagenUrl ?? (gabinete as any)?.imagen ?? '';
                    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                    let src = '';
                    if (raw) {
                      if (/^https?:\/\//i.test(raw)) src = raw;
                      else if (/^\/?storage\/v1\/object\/public\//i.test(raw)) src = `${base.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`;
                      else src = `${base.replace(/\/$/, '')}/storage/v1/object/public/${raw.replace(/^\//, '')}`;
                    }
                    return src ? (
                      <div className={`mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg transition-all duration-700 bg-white border border-slate-200 ${
                        position === 0 ? 'animate-float scale-100' : 'scale-90 opacity-80'
                      }`} style={{ width: 'min(240px,70vw)', height: 'min(320px,60vh)' }}>
                        <img src={src} alt={`${gabinete.marca} ${gabinete.modelo}`} loading="lazy" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 bg-gradient-to-br from-[#E02127] to-[#0D1A4B] rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg transition-all duration-700 ${
                        position === 0 ? 'animate-float' : 'scale-90 opacity-80'
                      }`}>
                        <Box className="h-8 w-8 text-white" />
                      </div>
                    );
                  })()}

                  <h2 className="text-lg font-bold text-slate-900 mb-2">
                    {gabinete.marca}
                  </h2>
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {gabinete.modelo}
                  </p>
                  <p className="text-slate-600 text-xs mb-4 leading-relaxed px-2 line-clamp-2 min-h-[32px]">
                    {gabinete.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {gabinete.especificaciones.formato && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[9px] font-semibold border border-blue-200/70">
                        {gabinete.especificaciones.formato}
                      </span>
                    )}
                    {gabinete.especificaciones.color && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-semibold border border-indigo-200/70">
                        {gabinete.especificaciones.color}
                      </span>
                    )}
                    {gabinete.especificaciones.vidrio_lateral && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-semibold border border-emerald-200/70">
                        Vidrio lateral
                      </span>
                    )}
                    {gabinete.especificaciones.ventiladores_incluidos && (
                      <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-[9px] font-semibold border border-cyan-200/70">
                        {gabinete.especificaciones.ventiladores_incluidos} ventiladores
                      </span>
                    )}
                    {gabinete.especificaciones.puertos_frontales && (
                      <span className="px-2.5 py-1 bg-fuchsia-50 text-fuchsia-700 rounded-full text-[9px] font-semibold border border-fuchsia-200/70">
                        {gabinete.especificaciones.puertos_frontales}
                      </span>
                    )}
                    {gabinete.especificaciones.soporte_gpu && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-semibold border border-amber-200/70">
                        GPU {gabinete.especificaciones.soporte_gpu}
                      </span>
                    )}
                  </div>

                  <div className="mb-4 px-3 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50 shadow-sm">
                    <p className="text-2xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                      {formatPrecio(Math.ceil(((remotePrices[gabinete.id] ?? gabinete.precio) as number) * 1.10))}
                    </p>
                  </div>

                  {position === 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarComponente('GABINETE', gabinete.id);
                      }}
                      className={`w-full px-5 py-2.5 rounded-xl transition-all text-xs font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 relative overflow-hidden group ${
                        componentesSeleccionados?.gabinete === gabinete.id
                          ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white'
                          : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-blue-600 hover:to-indigo-600 hover:text-white'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {componentesSeleccionados?.gabinete === gabinete.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Seleccionado
                          </>
                        ) : (
                          <>
                            Seleccionar
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                          </>
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1.5 md:gap-2 mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
        {gabinetes.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentIndex(index);
                setTimeout(() => setIsTransitioning(false), 800);
              }
            }}
            disabled={isTransitioning}
            className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ease-out ${
              index === currentIndex
                ? 'w-8 md:w-10 bg-gradient-to-r from-[#E02127] to-[#0D1A4B] shadow-lg shadow-red-500/50 scale-110'
                : 'w-1.5 md:w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150 hover:shadow-md'
            }`}
            aria-label={`Ver gabinete ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

