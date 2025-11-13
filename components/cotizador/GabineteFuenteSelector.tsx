'use client';

import { componentes } from '@/data/componentes';
import { formatPrecio } from '@/lib/utils';
import { Check, Box, Zap, AlertCircle, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'

export default function GabineteFuenteSelector() {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();
  
  const [currentGabineteIndex, setCurrentGabineteIndex] = useState(0);
  const [currentFuenteIndex, setCurrentFuenteIndex] = useState(0);
  const [isGabineteTransitioning, setIsGabineteTransitioning] = useState(false);
  const [isFuenteTransitioning, setIsFuenteTransitioning] = useState(false);

  // Calcular potencia requerida
  const potenciaRequerida = useMemo(() => {
    let watts = 0;
    const ids = Object.values(componentesSeleccionados);
    
    componentes
      .filter((c) => ids.includes(c.id))
      .forEach((comp) => {
        if (comp.compatibilidad?.consumoWatts) {
          watts += comp.compatibilidad.consumoWatts;
        }
      });

    // Agregar margen de seguridad del 30%
    return Math.ceil(watts * 1.3);
  }, [componentesSeleccionados]);

  const fuentes = componentes.filter((c) => c.tipo === 'FUENTE');
  const [gabinetesDb, setGabinetesDb] = useState<any[]>([])
  useEffect(() => { (async () => {
    try {
      const { data } = await supabase
        .from('componentes')
        .select('id,marca,modelo,descripcion,especificaciones,sku')
        .eq('tipo','GABINETE')
        .throwOnError()
      setGabinetesDb((data as any) || [])
    } catch (err) {
      console.error('Error fetching gabinetes:', (err as any)?.message || err, err)
    }
  })() }, [])
  const gabinetes = gabinetesDb;

  // Navegación del carrusel de gabinetes
  const nextGabinete = () => {
    if (isGabineteTransitioning || gabinetes.length === 0) return;
    setIsGabineteTransitioning(true);
    const nextIndex = (currentGabineteIndex + 1) % gabinetes.length;
    setCurrentGabineteIndex(nextIndex);
    setTimeout(() => setIsGabineteTransitioning(false), 800);
  };

  const prevGabinete = () => {
    if (isGabineteTransitioning || gabinetes.length === 0) return;
    setIsGabineteTransitioning(true);
    const prevIndex = (currentGabineteIndex - 1 + gabinetes.length) % gabinetes.length;
    setCurrentGabineteIndex(prevIndex);
    setTimeout(() => setIsGabineteTransitioning(false), 800);
  };

  // Navegación del carrusel de fuentes
  const nextFuente = () => {
    if (isFuenteTransitioning) return;
    setIsFuenteTransitioning(true);
    const nextIndex = (currentFuenteIndex + 1) % fuentes.length;
    setCurrentFuenteIndex(nextIndex);
    setTimeout(() => setIsFuenteTransitioning(false), 800);
  };

  const prevFuente = () => {
    if (isFuenteTransitioning) return;
    setIsFuenteTransitioning(true);
    const prevIndex = (currentFuenteIndex - 1 + fuentes.length) % fuentes.length;
    setCurrentFuenteIndex(prevIndex);
    setTimeout(() => setIsFuenteTransitioning(false), 800);
  };

  return (
    <div className="h-full overflow-hidden px-6 py-6 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        {/* Advertencia de Potencia */}
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl shadow-sm animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">
                Potencia Recomendada
              </h3>
              <p className="text-xs text-amber-800">
                Tu configuración requiere al menos <span className="font-bold">{potenciaRequerida}W</span>.
                Te recomendamos una fuente de al menos <span className="font-bold">{Math.ceil(potenciaRequerida / 50) * 50}W</span> para mayor estabilidad.
              </p>
            </div>
          </div>
        </div>

        {/* Carruseles */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Carrusel de Gabinetes */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Box className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gabinete
                </h2>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-[9px] font-semibold rounded-full border border-red-200">
                  Requerido
                </span>
              </div>
              <p className="text-slate-600 text-xs">Elegí el gabinete para tu PC</p>
            </div>

            <div 
              className="relative flex-1 flex items-center justify-center"
              style={{ perspective: '2000px', perspectiveOrigin: 'center' }}
            >
              <button
                onClick={prevGabinete}
                disabled={isGabineteTransitioning}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              >
                <ChevronLeft className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>

              <button
                onClick={nextGabinete}
                disabled={isGabineteTransitioning}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              >
                <ChevronRight className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                {gabinetes.map((gabinete, index) => {
                  const position = index - currentGabineteIndex;
                  const isVisible = Math.abs(position) <= 1;
                  
                  if (!isVisible) return null;
                  
                  return (
                    <div
                      key={gabinete.id}
                      className={`absolute ${position === 0 ? 'z-20' : 'z-0'}`}
                      style={{
                        transform: `
                          translateX(${position * 380}px)
                          scale(${position === 0 ? 1 : 0.8})
                          rotateY(${position * -15}deg)
                        `,
                        opacity: position === 0 ? 1 : 0.5,
                        pointerEvents: position === 0 ? 'auto' : 'none',
                        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: position !== 0 ? `blur(${Math.abs(position) * 2}px)` : 'blur(0px)',
                        transformStyle: 'preserve-3d',
                      }}
                      onClick={() => position === 0 && cambiarComponente('GABINETE', gabinete.id)}
                    >
                      <div 
                        className={`bg-white rounded-2xl p-6 text-center w-[360px] relative ${
                          position === 0 ? 'shadow-[0_0_0_3px_rgba(59,130,246,0.3),0_15px_50px_-10px_rgba(59,130,246,0.4)] animate-glow-pulse' : 'shadow-xl'
                        }`}
                        style={{ cursor: position === 0 ? 'pointer' : 'default' }}
                      >
                        <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transition-all duration-700 ${
                          position === 0 ? 'animate-float' : 'scale-90 opacity-80'
                        }`}>
                          <Box className="h-8 w-8 text-white" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {gabinete.marca}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 mb-3">
                          {gabinete.modelo}
                        </p>
                        <p className="text-slate-600 text-xs mb-4 leading-relaxed px-2 line-clamp-2">
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
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {formatPrecio(gabinete.precio)}
                          </p>
                        </div>

                        {position === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarComponente('GABINETE', gabinete.id);
                            }}
                            className={`w-full px-5 py-2.5 rounded-xl transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 relative overflow-hidden group ${
                              componentesSeleccionados?.gabinete === gabinete.id
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-blue-600 hover:to-indigo-600 hover:text-white'
                            }`}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              {componentesSeleccionados?.gabinete === gabinete.id ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Seleccionado
                                </>
                              ) : (
                                <>
                                  Seleccionar
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
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

            <div className="flex gap-2 justify-center mt-2">
              {gabinetes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isGabineteTransitioning) {
                      setIsGabineteTransitioning(true);
                      setCurrentGabineteIndex(index);
                      setTimeout(() => setIsGabineteTransitioning(false), 800);
                    }
                  }}
                  disabled={isGabineteTransitioning}
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${
                    index === currentGabineteIndex
                      ? 'w-10 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/50 scale-110'
                      : 'w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Carrusel de Fuentes */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="h-6 w-6 text-amber-600" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Fuente de Poder
                </h2>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-[9px] font-semibold rounded-full border border-red-200">
                  Requerido
                </span>
              </div>
              <p className="text-slate-600 text-xs">Elegí la fuente para tu PC (mínimo {Math.ceil(potenciaRequerida / 50) * 50}W)</p>
            </div>

            <div 
              className="relative flex-1 flex items-center justify-center"
              style={{ perspective: '2000px', perspectiveOrigin: 'center' }}
            >
              <button
                onClick={prevFuente}
                disabled={isFuenteTransitioning}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-amber-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              >
                <ChevronLeft className="h-5 w-5 text-amber-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>

              <button
                onClick={nextFuente}
                disabled={isFuenteTransitioning}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-amber-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              >
                <ChevronRight className="h-5 w-5 text-amber-600 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                {fuentes.map((fuente, index) => {
                  const position = index - currentFuenteIndex;
                  const isVisible = Math.abs(position) <= 1;
                  const potencia = parseInt(fuente.especificaciones.potencia?.replace('W', '') || '0');
                  const esRecomendada = potencia >= potenciaRequerida;
                  const esInsuficiente = potencia < potenciaRequerida;
                  
                  if (!isVisible) return null;
                  
                  return (
                    <div
                      key={fuente.id}
                      className={`absolute ${position === 0 ? 'z-20' : 'z-0'}`}
                      style={{
                        transform: `
                          translateX(${position * 380}px)
                          scale(${position === 0 ? 1 : 0.8})
                          rotateY(${position * -15}deg)
                        `,
                        opacity: position === 0 ? 1 : 0.5,
                        pointerEvents: position === 0 && !esInsuficiente ? 'auto' : 'none',
                        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: position !== 0 ? `blur(${Math.abs(position) * 2}px)` : 'blur(0px)',
                        transformStyle: 'preserve-3d',
                      }}
                      onClick={() => position === 0 && !esInsuficiente && cambiarComponente('FUENTE', fuente.id)}
                    >
                      <div 
                        className={`bg-white rounded-2xl p-6 text-center w-[360px] relative ${
                          position === 0 && !esInsuficiente
                            ? 'shadow-[0_0_0_3px_rgba(251,191,36,0.3),0_15px_50px_-10px_rgba(251,191,36,0.4)] animate-glow-pulse'
                            : esInsuficiente && position === 0
                            ? 'shadow-xl opacity-60 border-2 border-red-300'
                            : 'shadow-xl'
                        }`}
                        style={{ cursor: position === 0 && !esInsuficiente ? 'pointer' : 'default' }}
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

                        <div className={`w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transition-all duration-700 ${
                          position === 0 && !esInsuficiente ? 'animate-float' : 'scale-90 opacity-80'
                        }`}>
                          <Zap className="h-8 w-8 text-white" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {fuente.marca}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 mb-3">
                          {fuente.modelo}
                        </p>
                        <p className="text-slate-600 text-xs mb-4 leading-relaxed px-2 line-clamp-2">
                          {fuente.descripcion}
                        </p>

                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-semibold border border-amber-200/70">
                            {fuente.especificaciones.potencia}
                          </span>
                          <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-[9px] font-semibold border border-orange-200/70">
                            {fuente.especificaciones.certificacion}
                          </span>
                        </div>

                        <div className="mb-4 px-3 py-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200/50 shadow-sm">
                          <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {formatPrecio(fuente.precio)}
                          </p>
                        </div>

                        {position === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!esInsuficiente) cambiarComponente('FUENTE', fuente.id);
                            }}
                            disabled={esInsuficiente}
                            className={`w-full px-5 py-2.5 rounded-xl transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 relative overflow-hidden group ${
                              esInsuficiente
                                ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-600 cursor-not-allowed'
                                : componentesSeleccionados?.fuente === fuente.id
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-amber-600 hover:to-orange-600 hover:text-white'
                            }`}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              {esInsuficiente ? (
                                <>
                                  <AlertCircle className="h-4 w-4" />
                                  No Compatible
                                </>
                              ) : componentesSeleccionados?.fuente === fuente.id ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Seleccionada
                                </>
                              ) : (
                                <>
                                  Seleccionar
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
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

            <div className="flex gap-2 justify-center mt-2">
              {fuentes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isFuenteTransitioning) {
                      setIsFuenteTransitioning(true);
                      setCurrentFuenteIndex(index);
                      setTimeout(() => setIsFuenteTransitioning(false), 800);
                    }
                  }}
                  disabled={isFuenteTransitioning}
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${
                    index === currentFuenteIndex
                      ? 'w-10 bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-500/50 scale-110'
                      : 'w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
