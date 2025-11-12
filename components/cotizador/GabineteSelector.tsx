'use client';

import { componentes } from '@/data/componentes';
import { formatPrecio } from '@/lib/utils';
import { Check, Box, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useState } from 'react';
import { useRemotePrices } from '@/lib/pricing';

export default function GabineteSelector() {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const gabinetes = componentes.filter((c) => c.tipo === 'GABINETE');
  const remotePrices = useRemotePrices(componentes);

  const nextGabinete = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIdx = (currentIndex + 1) % gabinetes.length;
    setCurrentIndex(nextIdx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevGabinete = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIdx = (currentIndex - 1 + gabinetes.length) % gabinetes.length;
    setCurrentIndex(prevIdx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-hidden">
      <div className="text-center mb-6 animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Box className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Elegí tu Gabinete
          </h1>
        </div>
        <p className="text-slate-600 text-xs">Seleccioná el gabinete que más te guste para tu PC</p>
      </div>

      <div 
        className="relative w-full max-w-7xl h-[480px] flex items-center justify-center mb-4"
        style={{ perspective: '2500px', perspectiveOrigin: 'center' }}
      >
        <button
          onClick={prevGabinete}
          disabled={isTransitioning}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
        >
          <ChevronLeft className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        <button
          onClick={nextGabinete}
          disabled={isTransitioning}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
        >
          <ChevronRight className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:translate-x-0.5" />
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
                    translateX(${position * 360}px)
                    scale(${position === 0 ? 1 : 0.75})
                    rotateY(${position * -18}deg)
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
                  className={`bg-white rounded-2xl p-6 text-center w-[360px] relative overflow-visible ${
                    position === 0 ? 'shadow-[0_0_0_3px_rgba(59,130,246,0.3),0_20px_60px_-10px_rgba(59,130,246,0.4)] animate-glow-pulse' : 'shadow-2xl'
                  }`}
                  style={{ cursor: position === 0 ? 'pointer' : 'default' }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg transition-all duration-700 ${
                    position === 0 ? 'animate-float' : 'scale-90 opacity-80'
                  }`}>
                    <Box className="h-8 w-8 text-white" />
                  </div>

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
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[9px] font-semibold border border-blue-200/70">
                      {gabinete.especificaciones.formato}
                    </span>
                    {gabinete.especificaciones.color && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-semibold border border-indigo-200/70">
                        {gabinete.especificaciones.color}
                      </span>
                    )}
                  </div>

                  <div className="mb-4 px-3 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50 shadow-sm">
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {formatPrecio(remotePrices[gabinete.id] ?? gabinete.precio)}
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
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
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

      <div className="flex gap-2 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
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
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              index === currentIndex
                ? 'w-10 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/50 scale-110'
                : 'w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150 hover:shadow-md'
            }`}
            aria-label={`Ver gabinete ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
