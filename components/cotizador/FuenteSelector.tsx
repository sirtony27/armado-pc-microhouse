'use client';

import { formatPrecio } from '@/lib/utils';
import { Check, Zap, ChevronLeft, ChevronRight, ArrowRight, AlertCircle } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useMemo, useState } from 'react';
import { Componente } from '@/types';

interface FuenteSelectorProps {
  fuentes: Componente[];
}

export default function FuenteSelector({ fuentes }: FuenteSelectorProps) {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();

  /* Sort by Price */
  const sortedFuentes = useMemo(() => {
    return [...fuentes].sort((a, b) => (a.precio || 0) - (b.precio || 0));
  }, [fuentes]);

  // Use sortedFuentes instead of fuentes for navigation and display
  const currentFuentes = sortedFuentes;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);




  const nextFuente = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIdx = (currentIndex + 1) % currentFuentes.length;
    setCurrentIndex(nextIdx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevFuente = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIdx = (currentIndex - 1 + currentFuentes.length) % currentFuentes.length;
    setCurrentIndex(prevIdx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-[var(--space-md)] py-[var(--space-md)] overflow-hidden">
      <div className="text-center mb-[var(--space-md)] animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-7 w-7 text-amber-600" />
          <h1 className="text-[var(--text-2xl)] font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Elegí tu Fuente de Poder
          </h1>
        </div>
        <p className="text-slate-600 text-[var(--text-xs)]">Seleccioná la fuente adecuada para tu configuración</p>
      </div>

      <div
        className="relative w-full max-w-7xl h-[480px] flex items-center justify-center mb-4"
        style={{ perspective: '2500px', perspectiveOrigin: 'center' }}
      >
        <button
          onClick={prevFuente}
          disabled={isTransitioning}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-amber-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
        >
          <ChevronLeft className="h-5 w-5 text-amber-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        <button
          onClick={nextFuente}
          disabled={isTransitioning}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-amber-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
        >
          <ChevronRight className="h-5 w-5 text-amber-600 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center" style={{ '--card-width': 'min(360px, 85vw)' } as React.CSSProperties}>
          {currentFuentes.map((fuente, index) => {
            const position = index - currentIndex;
            const isVisible = Math.abs(position) <= 2;
            // Placeholder for compatibility logic, can be enhanced later
            const esInsuficiente = false;
            const esRecomendada = false;

            if (!isVisible) return null;

            return (
              <div
                key={fuente.id}
                className={`absolute ${position === 0 ? 'z-20' : 'z-0'}`}
                style={{
                  transform: `
                    translateX(calc(${position} * var(--card-width)))
                    scale(${position === 0 ? 1 : 0.75})
                    rotateY(${position * -18}deg)
                  `,
                  opacity: position === 0 ? 1 : Math.max(0, 0.6 - Math.abs(position) * 0.2),
                  pointerEvents: position === 0 && !esInsuficiente ? 'auto' : 'none',
                  transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: position !== 0 ? `blur(${Math.abs(position) * 2}px)` : 'blur(0px)',
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => position === 0 && !esInsuficiente && cambiarComponente('FUENTE', fuente.id)}
              >
                <div
                  className={`bg-white rounded-2xl p-6 text-center relative overflow-visible ${position === 0 && !esInsuficiente
                    ? 'shadow-[0_0_0_3px_rgba(251,191,36,0.3),0_20px_60px_-10px_rgba(251,191,36,0.4)] animate-glow-pulse'
                    : esInsuficiente && position === 0
                      ? 'shadow-xl opacity-60 border-2 border-red-300'
                      : 'shadow-2xl'
                    }`}
                  style={{
                    cursor: position === 0 && !esInsuficiente ? 'pointer' : 'default',
                    width: 'var(--card-width)'
                  }}
                >
                  {esInsuficiente && position === 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      Insuficiente
                    </div>
                  )}
                  {esRecomendada && !esInsuficiente && position === 0 && componentesSeleccionados?.fuente !== fuente.id && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      Recomendada
                    </div>
                  )}

                  <div className={`w-32 h-32 mx-auto mb-3 flex items-center justify-center transition-all duration-700 ${position === 0 && !esInsuficiente ? 'animate-float' : 'scale-90 opacity-80'
                    }`}>
                    {fuente.imagenUrl ? (
                      <img
                        src={fuente.imagenUrl}
                        alt={`${fuente.marca} ${fuente.modelo}`}
                        className="w-full h-full object-contain drop-shadow-xl"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-[var(--text-lg)] font-bold text-slate-900 mb-2">
                    {fuente.marca}
                  </h2>
                  <p className="text-[var(--text-sm)] font-semibold text-slate-700 mb-3">
                    {fuente.modelo}
                  </p>
                  <p className="text-slate-600 text-[var(--text-xs)] mb-4 leading-relaxed px-2 line-clamp-2 min-h-[32px]">
                    {fuente.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-semibold border border-amber-200/70">
                      {fuente.especificaciones?.power || fuente.especificaciones?.potencia || 'Potencia N/D'}
                    </span>
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-[9px] font-semibold border border-orange-200/70">
                      {fuente.especificaciones?.certification || fuente.especificaciones?.certificacion || 'Certificación N/D'}
                    </span>
                  </div>

                  <div className="mb-4 px-3 py-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200/50 shadow-sm">
                    <p className="text-[var(--text-2xl)] font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {formatPrecio(Math.ceil((fuente.precio ?? 0) * 1.10))}
                    </p>
                  </div>

                  {position === 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!esInsuficiente) cambiarComponente('FUENTE', fuente.id);
                      }}
                      disabled={esInsuficiente}
                      className={`w-full px-5 py-2.5 rounded-xl transition-all text-xs font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 relative overflow-hidden group ${esInsuficiente
                        ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-600 cursor-not-allowed'
                        : componentesSeleccionados?.fuente === fuente.id
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                          : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-amber-600 hover:to-orange-600 hover:text-white'
                        }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {esInsuficiente ? (
                          <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            No Compatible
                          </>
                        ) : componentesSeleccionados?.fuente === fuente.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Seleccionada
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

      <div className="flex gap-2 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
        {currentFuentes.map((_, index) => (
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
            className={`h-2 rounded-full transition-all duration-500 ease-out ${index === currentIndex
              ? 'w-10 bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-500/50 scale-110'
              : 'w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150 hover:shadow-md'
              }`}
            aria-label={`Ver fuente ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
