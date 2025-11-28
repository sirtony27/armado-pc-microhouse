'use client';

import { formatPrecio } from '@/lib/utils';
import { Check, Box, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';

import { Componente } from '@/types';

interface GabineteSelectorProps {
  gabinetes: Componente[];
}

export default function GabineteSelector({ gabinetes: gabinetesInitial }: GabineteSelectorProps) {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Removed height calculation logic for fluid layout

  const nextGabinete = () => {
    if (isTransitioning || gabinetes.length === 0) return;
    setIsTransitioning(true);
    const nextIdx = (currentIndex + 1) % gabinetes.length;
    setCurrentIndex(nextIdx);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevGabinete = () => {
    if (isTransitioning || gabinetes.length === 0) return;
    setIsTransitioning(true);
    const prevIdx = (currentIndex - 1 + gabinetes.length) % gabinetes.length;
    setCurrentIndex(prevIdx);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const gabinetes = useMemo(() => {
    return [...gabinetesInitial].sort((a, b) => {
      const pa = Number(a.precio ?? 0);
      const pb = Number(b.precio ?? 0);
      return pa - pb;
    });
  }, [gabinetesInitial]);

  return (
    <div className="flex-1 flex flex-col items-center px-[var(--space-sm)] py-[var(--space-xs)] overflow-hidden min-h-0 w-full">
      <div className="text-center mb-[var(--space-xs)] shrink-0 animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Box className="h-6 w-6 text-[#E02127]" />
          <h1 className="text-[var(--text-xl)] font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
            Elegí tu Gabinete
          </h1>
        </div>
        <p className="text-slate-600 text-[var(--text-xs)]">Seleccioná el gabinete que más te guste para tu PC</p>
      </div>

      <div className="relative w-full max-w-7xl flex-1 min-h-0 flex flex-col">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex h-full items-center"
            style={{
              '--card-width': 'min(45vh, 85vw)',
              transform: `translateX(calc(50% - (${currentIndex} + 0.5) * var(--card-width)))`,
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            } as React.CSSProperties}
          >
            {gabinetes.map((gabinete, index) => {
              const isCurrent = index === currentIndex;
              const specs = (gabinete as any)?.especificaciones || {};
              const incluyeFuente = Boolean(
                specs.incluye_fuente ||
                specs.incluyeFuente ||
                specs.fuenteIncluida ||
                specs.psuIncluida
              );
              const potenciaFuente = specs.potencia_fuente || specs.potenciaFuente || specs.potencia_fuente_w || specs.potencia_w || specs.potencia;
              return (
                <div
                  key={gabinete.id}
                  className="flex-shrink-0 px-4"
                  style={{ width: 'var(--card-width)' }}
                  onClick={() => {
                    if (!isCurrent) {
                      setCurrentIndex(index);
                    }
                  }}
                >
                  <div
                    className={`bg-white rounded-2xl text-center relative transition-all duration-500 ease-in-out overflow-hidden flex flex-col h-full ${isCurrent ? 'shadow-[0_0_0_3px_rgba(224,33,39,0.3),0_20px_60px_-10px_rgba(224,33,39,0.4)] ring-1 ring-[#E02127]/20' : 'shadow-2xl scale-80 opacity-60'
                      }`}
                    style={{
                      cursor: 'pointer',
                    }}
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
                        <div className="mx-auto rounded-t-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-white flex-1 min-h-0 w-full flex items-center justify-center p-4">
                          <img
                            src={src}
                            alt={`${gabinete.marca} ${gabinete.modelo}`}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-50">
                          <Box className="h-12 w-12 text-slate-300" />
                        </div>
                      );
                    })()}

                    <div className="p-[var(--space-sm)] space-y-[var(--space-xs)] text-left shrink-0 bg-white">
                      <h2 className="text-[var(--text-base)] font-bold text-slate-900 truncate h-6">
                        {gabinete.marca} {gabinete.modelo}
                      </h2>
                      <div className="flex flex-wrap gap-1">
                        {gabinete.especificaciones?.formato && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {gabinete.especificaciones.formato}
                          </span>
                        )}
                        {incluyeFuente && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Incluye fuente{potenciaFuente ? ` ${potenciaFuente}` : ''}
                          </span>
                        )}
                        {gabinete.especificaciones?.ventiladores_incluidos && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Fans: {gabinete.especificaciones.ventiladores_incluidos}
                          </span>
                        )}
                        {gabinete.especificaciones?.color && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {gabinete.especificaciones.color}
                          </span>
                        )}
                        {gabinete.especificaciones?.vidrio_lateral && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Vidrio lateral
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Contado / débito</p>
                          <p className="text-[var(--text-lg)] font-bold text-slate-900">
                            {formatPrecio(Math.ceil(Number(gabinete.precio ?? 0)))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">3 cuotas</p>
                          <p className="text-[var(--text-lg)] font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                            {formatPrecio(Math.ceil(Number(gabinete.precio ?? 0) * 1.10))}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            if (isCurrent) {
                              e.stopPropagation();
                              cambiarComponente('GABINETE', gabinete.id);
                            }
                          }}
                          className={`w-full px-5 py-2.5 rounded-xl transition-all text-xs font-bold shadow-lg hover:shadow-xl active:scale-95 transform duration-200 relative overflow-hidden group ${componentesSeleccionados?.gabinete === gabinete.id
                            ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white'
                            : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700'
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
          onClick={prevGabinete}
          disabled={isTransitioning}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-2 md:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-[#E02127]/30 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-[#E02127]" />
        </button>
        <button
          onClick={nextGabinete}
          disabled={isTransitioning}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-2 md:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-[#E02127]/30 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-[#E02127]" />
        </button>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
          {gabinetes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              disabled={isTransitioning}
              className={`h-2 rounded-full transition-all duration-500 ease-out ${index === currentIndex
                ? 'w-10 bg-gradient-to-r from-[#E02127] to-[#0D1A4B] shadow-lg'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              aria-label={`Ver gabinete ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

