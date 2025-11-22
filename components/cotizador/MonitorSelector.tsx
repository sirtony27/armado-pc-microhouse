'use client';

import { formatPrecio } from '@/lib/utils';
import { Check, Monitor as MonitorIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'
import { useRemotePrices } from '@/lib/pricing';

export default function MonitorSelector() {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [monitoresDb, setMonitoresDb] = useState<any[]>([])
  
  const [maxCardHeight, setMaxCardHeight] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { (async () => {
    try {
      const { data } = await supabase
        .from('componentes')
        .select('*')
        .eq('tipo','MONITOR')
        .throwOnError()
      setMonitoresDb((data as any) || [])
    } catch (err) {
      console.error('Error fetching monitores:', (err as any)?.message || err, err)
    }
  })() }, [])

  const monitores = monitoresDb;
  const remotePrices = useRemotePrices(monitores);

  const measureAndSetHeight = useCallback(() => {
    let maxHeight = 0;
    cardRefs.current.forEach(card => {
      if (card) {
        card.style.minHeight = 'auto';
        maxHeight = Math.max(maxHeight, card.scrollHeight);
      }
    });
    if (maxHeight > 0) {
      setMaxCardHeight(maxHeight);
    }
  }, []);

  useLayoutEffect(() => {
    if (monitores.length > 0) {
      measureAndSetHeight();
    }
    window.addEventListener('resize', measureAndSetHeight);
    return () => window.removeEventListener('resize', measureAndSetHeight);
  }, [monitores, measureAndSetHeight]);

  const nextMonitor = () => {
    if (isTransitioning || monitores.length === 0) return;
    setIsTransitioning(true);
    const nextIdx = (currentIndex + 1) % monitores.length;
    setCurrentIndex(nextIdx);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevMonitor = () => {
    if (isTransitioning || monitores.length === 0) return;
    setIsTransitioning(true);
    const prevIdx = (currentIndex - 1 + monitores.length) % monitores.length;
    setCurrentIndex(prevIdx);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-6 overflow-hidden">
      <div className="text-center mb-6 animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MonitorIcon className="h-7 w-7 text-[#E02127]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
            ¿Necesitás un Monitor?
          </h1>
        </div>
        <p className="text-slate-600 text-xs">Este paso es opcional. Podés agregar un monitor a tu configuración.</p>
      </div>

      <div className="relative w-full max-w-7xl" style={{ minHeight: maxCardHeight ? `${maxCardHeight + 40}px` : '520px' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="flex h-full items-center"
            style={{
              transform: `translateX(calc(50% - ${currentIndex * 320}px - 160px))`,
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {monitores.map((monitor, index) => {
              const isCurrent = index === currentIndex;
              return (
                <div
                  key={monitor.id}
                  className="w-[320px] flex-shrink-0 px-4"
                  onClick={() => {
                    if (!isCurrent) {
                      setCurrentIndex(index);
                    }
                  }}
                >
                  <div
                    ref={el => cardRefs.current[index] = el}
                    className={`bg-white rounded-2xl text-center relative transition-all duration-500 ease-in-out ${
                      isCurrent ? 'shadow-[0_0_0_3px_rgba(224,33,39,0.3),0_20px_60px_-10px_rgba(224,33,39,0.4)]' : 'shadow-2xl scale-80 opacity-60'
                    }`}
                    style={{ 
                      cursor: 'pointer',
                      minHeight: maxCardHeight ? `${maxCardHeight}px` : undefined,
                    }}
                  >
                    {(() => {
                      const raw = (monitor as any)?.imagen_url ?? (monitor as any)?.image_url ?? (monitor as any)?.imagenUrl ?? (monitor as any)?.imagen ?? '';
                      const base = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                      let src = '';
                      if (raw) {
                        if (/^https?:\/\//i.test(raw)) src = raw;
                        else if (/^\/?storage\/v1\/object\/public\//i.test(raw)) src = `${base.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`;
                        else src = `${base.replace(/\/$/, '')}/storage/v1/object/public/${raw.replace(/^\//, '')}`;
                      }
                      return src ? (
                        <div className={`mx-auto rounded-t-2xl overflow-hidden bg-white h-96`}>
                          <img src={src} alt={`${monitor.marca} ${monitor.modelo}`} loading="lazy" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`h-96 flex items-center justify-center`}>
                          <MonitorIcon className="h-16 w-16 text-slate-300" />
                        </div>
                      );
                    })()}
                    
                    <div className="p-4 space-y-2">
                      <h2 className="text-base font-bold text-slate-900 truncate h-6">
                        {monitor.marca} {monitor.modelo}
                      </h2>
                      <p className="text-2xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                        {formatPrecio(Math.ceil(((remotePrices[monitor.id] ?? monitor.precio) as number) * 1.10))}
                      </p>
                      <div className="pt-2">
                         <button
                          onClick={(e) => {
                            if (isCurrent) {
                              e.stopPropagation();
                              cambiarComponente('MONITOR', monitor.id);
                            }
                          }}
                          className={`w-full px-5 py-2.5 rounded-xl transition-all text-xs font-bold shadow-lg hover:shadow-xl active:scale-95 transform duration-200 relative overflow-hidden group ${
                            componentesSeleccionados?.monitor === monitor.id
                              ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white'
                              : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {componentesSeleccionados?.monitor === monitor.id ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Seleccionado
                              </>
                            ) : (
                              <>
                                Seleccionar
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={prevMonitor}
          disabled={isTransitioning}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-2 md:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-[#E02127]/30 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-[#E02127]" />
        </button>
        <button
          onClick={nextMonitor}
          disabled={isTransitioning}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-2 md:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-[#E02127]/30 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-[#E02127]" />
        </button>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
          {monitores.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              disabled={isTransitioning}
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                index === currentIndex
                  ? 'w-10 bg-gradient-to-r from-[#E02127] to-[#0D1A4B] shadow-lg'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Ver monitor ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
