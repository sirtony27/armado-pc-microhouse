'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useModelosBase } from '@/lib/models';
import { useComponentes } from '@/lib/componentes';
import { formatPrecio } from '@/lib/utils';
import { useRemotePrices } from '@/lib/pricing';
import { ChevronLeft, ChevronRight, Check, Cpu, HardDrive, MemoryStick, MonitorUp, ChevronDown, Sparkles, ArrowRight, ArrowLeft, Box, Zap } from 'lucide-react';
import Stepper from '@/components/cotizador/Stepper';
import GabineteSelector from '@/components/cotizador/GabineteSelector';
import FuenteSelector from '@/components/cotizador/FuenteSelector';
import './animations.css';

export default function CotizarPage() {
  const { pasoActual, setPaso, modeloSeleccionado, componentesSeleccionados, setModeloBase, cambiarComponente } = useCotizadorStore();
  const modelosBase = useModelosBase();
  const componentes = useComponentes();
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mejorasExpanded, setMejorasExpanded] = useState(pasoActual === 'mejoras');
  const remotePrices = useRemotePrices(componentes);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleSeleccionarModelo = (modelo: typeof modelosBase[0]) => {
    setModeloBase(modelo); // Esto ya actualiza el paso automáticamente
  };

  // Validar si puede avanzar de paso
  const puedeAvanzar = useMemo(() => {
    if (pasoActual === 'modelo') return !!modeloSeleccionado;
    if (pasoActual === 'mejoras') return !!modeloSeleccionado;
    if (pasoActual === 'gabinete') {
      return !!componentesSeleccionados?.gabinete;
    }
    if (pasoActual === 'fuente') {
      return !!componentesSeleccionados?.fuente;
    }
    return true;
  }, [pasoActual, modeloSeleccionado, componentesSeleccionados]);

  const handleSiguiente = () => {
    if (pasoActual === 'modelo' && puedeAvanzar) setPaso('mejoras');
    else if (pasoActual === 'mejoras' && puedeAvanzar) setPaso('gabinete');
    else if (pasoActual === 'gabinete' && puedeAvanzar) setPaso('fuente');
    else if (pasoActual === 'fuente' && puedeAvanzar) setPaso('resumen');
  };

  const handleAnterior = () => {
    if (pasoActual === 'mejoras') setPaso('modelo');
    else if (pasoActual === 'gabinete') setPaso('mejoras');
    else if (pasoActual === 'fuente') setPaso('gabinete');
    else if (pasoActual === 'resumen') setPaso('fuente');
  };

  // Expandir mejoras automáticamente en el paso de mejoras
  useEffect(() => {
    if (pasoActual === 'mejoras') {
      setMejorasExpanded(true);
    }
  }, [pasoActual]);

  // Manejo de swipe para el carrusel
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextModel();
    } else if (isRightSwipe) {
      prevModel();
    }
  };

  // Calcular precio total
  const precioTotal = useMemo(() => {
    if (!componentesSeleccionados) return 0;
    const ids = Object.values(componentesSeleccionados);
    return componentes
      .filter((comp) => ids.includes(comp.id))
      .reduce((sum, comp) => sum + (remotePrices[comp.id] ?? comp.precio), 0);
  }, [componentesSeleccionados]);

  // Obtener componentes seleccionados con detalles
  const componentesDetalle = useMemo(() => {
    if (!componentesSeleccionados) return [];
    return Object.entries(componentesSeleccionados).map(([tipo, id]) => {
      const comp = componentes.find((c) => c.id === id);
      return {
        tipo,
        componente: comp,
      };
    });
  }, [componentesSeleccionados]);

  // Navegación del carrusel (solo cambia el índice, NO selecciona)
  const nextModel = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIndex = (currentModelIndex + 1) % modelosBase.length;
    setCurrentModelIndex(nextIndex);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevModel = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIndex = (currentModelIndex - 1 + modelosBase.length) % modelosBase.length;
    setCurrentModelIndex(prevIndex);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const total = precioTotal;

  const handleDescargarPDF = () => {
    alert('Funcionalidad de PDF en desarrollo');
  };

  const handleCompartirWhatsApp = () => {
    const mensaje = `🖥️ *Cotización PC - MicroHouse*\n\n*Modelo:* ${modeloSeleccionado?.nombre}\n*Total:* ${formatPrecio(total)}\n\n¡Consultá disponibilidad!`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const getComponentIcon = (tipo: string) => {
    switch (tipo) {
      case 'procesador': return <Cpu className="h-3 w-3" />;
      case 'placamadre': return <Cpu className="h-3 w-3" />;
      case 'ram': return <MemoryStick className="h-3 w-3" />;
      case 'almacenamiento': return <HardDrive className="h-3 w-3" />;
      case 'gpu': return <MonitorUp className="h-3 w-3" />;
      case 'fuente': return <Zap className="h-3 w-3" />;
      case 'gabinete': return <Box className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Stepper */}
      <Stepper pasoActual={pasoActual} />

      <div className="flex flex-1 overflow-hidden">
      {/* Panel Lateral Izquierdo - Resumen */}
      <div className="w-80 bg-white/95 backdrop-blur-sm shadow-xl border-r border-slate-200/50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-sm font-bold text-white">MicroHouse</h2>
          <p className="text-[9px] text-blue-100 mt-0.5">
            {pasoActual === 'modelo' && 'Paso 1: Elegí tu modelo base'}
            {pasoActual === 'mejoras' && 'Paso 2: Personalizá tu PC'}
            {pasoActual === 'gabinete' && 'Paso 3: Elegí tu Gabinete'}
            {pasoActual === 'fuente' && 'Paso 4: Elegí tu Fuente'}
            {pasoActual === 'resumen' && 'Resumen Final'}
          </p>
        </div>

        {/* Resumen de Componentes */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Tu Configuración</h3>
          
          {modeloSeleccionado ? (
            <>
              <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-sm animate-in slide-in-from-left duration-500">
                <p className="text-[11px] font-semibold text-white">{modeloSeleccionado.nombre}</p>
              </div>

              <div className="space-y-1.5">
                {componentesDetalle.map(({ tipo, componente }, index) => (
                  <div 
                    key={tipo} 
                    className="bg-slate-50/70 rounded-md px-2.5 py-1.5 border border-slate-200/50 hover:bg-slate-100 hover:scale-[1.02] transition-all duration-300 animate-in slide-in-from-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="text-blue-600">
                        {getComponentIcon(tipo)}
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-medium tracking-wide">
                        {tipo === 'procesador' && 'Procesador'}
                        {tipo === 'placamadre' && 'Placa Madre'}
                        {tipo === 'ram' && 'Memoria RAM'}
                        {tipo === 'almacenamiento' && 'Almacenamiento'}
                        {tipo === 'gpu' && 'GPU'}
                        {tipo === 'fuente' && 'Fuente'}
                        {tipo === 'gabinete' && 'Gabinete'}
                      </p>
                    </div>
                    <p className="font-medium text-slate-800 text-[11px] truncate leading-tight">
                      {componente?.marca} {componente?.modelo}
                    </p>
                    <p className="text-blue-600 font-semibold text-[11px] mt-0.5">
                      {formatPrecio((componente ? (remotePrices[componente.id] ?? componente.precio) : 0) || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Cpu className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-[10px]">Seleccioná un modelo para comenzar</p>
            </div>
          )}
        </div>

        {/* Resumen de Precios */}
        {modeloSeleccionado && (
          <div className="px-5 py-4 border-t border-slate-200/50 bg-gradient-to-br from-slate-50 to-blue-50/30 animate-in slide-in-from-bottom duration-700">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center hover:scale-105 transition-transform duration-200">
                <span className="text-sm font-bold text-slate-900">TOTAL</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  {formatPrecio(total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Área Principal - Carrusel de Modelos y Mejoras */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Paso 1: Carrusel de Modelos */}
        {pasoActual === 'modelo' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-hidden">
          <div className="text-center mb-6 animate-in fade-in slide-in-from-top duration-700">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Elegí tu PC Ideal
            </h1>
            <p className="text-slate-600 text-xs">Navegá entre los modelos base y encontrá el perfecto para vos</p>
          </div>

          {/* Carrusel Coverflow */}
          <div 
            className="relative w-full max-w-7xl h-[480px] flex items-center justify-center mb-4"
            style={{ perspective: '2500px', perspectiveOrigin: 'center' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Botones de navegación */}
            <button
              onClick={prevModel}
              disabled={isTransitioning}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:-translate-x-1 border-2 border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            >
              <ChevronLeft className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>

            <button
              onClick={nextModel}
              disabled={isTransitioning}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:translate-x-1 border-2 border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            >
              <ChevronRight className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            {/* Container de Cards */}
            <div className="relative w-full h-full flex items-center justify-center">
              {modelosBase.map((modelo, index) => {
                const position = index - currentModelIndex;
                const isVisible = Math.abs(position) <= 2;
                
                if (!isVisible) return null;
                
                return (
                  <div
                    key={modelo.id}
                    className={`absolute ${
                      position === 0 ? 'z-20' : 'z-0'
                    }`}
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
                    onClick={() => position === 0 && handleSeleccionarModelo(modelo)}
                  >
                    {/* Card del Modelo */}
                    <div 
                      className={`bg-white rounded-2xl p-6 text-center w-[360px] relative overflow-visible ${
                        position === 0 ? 'shadow-[0_0_0_3px_rgba(59,130,246,0.3),0_20px_60px_-10px_rgba(59,130,246,0.4)] animate-glow-pulse' : 'shadow-2xl'
                      }`}
                      style={{
                        cursor: position === 0 ? 'pointer' : 'default',
                      }}
                    >
                      <div className="mb-3">
                        <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg transition-all duration-700 ${
                          position === 0 ? 'animate-float scale-100' : 'scale-90 opacity-80'
                        }`}>
                          <span className="text-3xl">🖥️</span>
                        </div>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 mb-2">
                        {modelo.nombre}
                      </h2>
                      <p className="text-slate-600 mb-4 text-xs leading-relaxed px-2">
                        {modelo.descripcion}
                      </p>

                      {/* Resumen de componentes */}
                      <div className="mb-4 p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200/70 shadow-sm">
                        <h3 className="text-[9px] font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center justify-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                          Incluye
                          <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-left">
                          {modelo.componentes.procesador && (
                            <div className="flex items-start gap-1">
                              <Cpu className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[7px] text-slate-500 uppercase">Procesador</p>
                                <p className="text-[8px] font-semibold text-slate-800 leading-tight">
                                  {componentes.find(c => c.id === modelo.componentes.procesador)?.modelo || 'Incluido'}
                                </p>
                              </div>
                            </div>
                          )}
                          {modelo.componentes.ram && (
                            <div className="flex items-start gap-1">
                              <MemoryStick className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[7px] text-slate-500 uppercase">RAM</p>
                                <p className="text-[8px] font-semibold text-slate-800">
                                  {componentes.find(c => c.id === modelo.componentes.ram)?.especificaciones.capacidad || 'Incluido'}
                                </p>
                              </div>
                            </div>
                          )}
                          {modelo.componentes.almacenamiento && (
                            <div className="flex items-start gap-1">
                              <HardDrive className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[7px] text-slate-500 uppercase">Storage</p>
                                <p className="text-[8px] font-semibold text-slate-800">
                                  {componentes.find(c => c.id === modelo.componentes.almacenamiento)?.especificaciones.capacidad || 'Incluido'}
                                </p>
                              </div>
                            </div>
                          )}
                          {modelo.componentes.gpu && (
                            <div className="flex items-start gap-1">
                              <MonitorUp className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[7px] text-slate-500 uppercase">GPU</p>
                                <p className="text-[8px] font-semibold text-slate-800 leading-tight">
                                  {componentes.find(c => c.id === modelo.componentes.gpu)?.modelo || 'Incluida'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                        {modelo.usoRecomendado.map((uso) => (
                          <span
                            key={uso}
                            className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[9px] font-semibold border border-blue-200/70 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                          >
                            {uso}
                          </span>
                        ))}
                      </div>

                      <div className="mb-4 px-3 py-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200/50 shadow-sm">
                        <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Precio base desde</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrecio(modelo.precioBase)}
                        </p>
                        <p className="text-[8px] text-slate-500 mt-0.5">Sin gabinete ni fuente</p>
                      </div>

                      {position === 0 && (
                        <button
                          onClick={() => handleSeleccionarModelo(modelo)}
                          className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all text-xs font-bold shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-95 transform duration-200 relative overflow-hidden group"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            Seleccionar este Modelo
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex gap-2 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            {modelosBase.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentModelIndex(index);
                    setTimeout(() => setIsTransitioning(false), 800);
                  }
                }}
                disabled={isTransitioning}
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  index === currentModelIndex
                    ? 'w-10 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/50 scale-110'
                    : 'w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150 hover:shadow-md'
                }`}
                aria-label={`Ver modelo ${index + 1}`}
              />
            ))}
          </div>
        </div>
        )}

        {/* Paso 2: Mejoras Opcionales */}
        {pasoActual === 'mejoras' && (
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mejoras Opcionales - Colapsable */}
        <div className={`bg-white/95 backdrop-blur-sm border-t border-slate-200/50 shadow-xl transition-all duration-300 overflow-hidden ${
          mejorasExpanded ? 'flex-1' : 'flex-none'
        }`}>
          {/* Header Colapsable */}
          <button
            onClick={() => setMejorasExpanded(!mejorasExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-300 group flex-shrink-0 hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Sparkles className="h-3.5 w-3.5 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold text-slate-800">Mejoras Opcionales</h2>
                <p className="text-[10px] text-slate-500">Personalizá componentes individuales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!mejorasExpanded && modeloSeleccionado && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-semibold rounded-full border border-amber-200">
                  Toca para personalizar
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${
                  mejorasExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
          
          {/* Contenido Expandible */}
          {mejorasExpanded && modeloSeleccionado && (
            <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 animate-in fade-in slide-in-from-top-4 duration-500" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Categoría: RAM */}
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-lg p-3 border border-purple-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <MemoryStick className="h-4 w-4 text-purple-600" />
                    <h3 className="text-xs font-bold text-slate-800">Memoria RAM</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {componentes
                      .filter((c) => c.tipo === 'RAM')
                      .map((comp) => (
                        <button
                          key={comp.id}
                          className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${
                            componentesSeleccionados?.ram === comp.id
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg ring-2 ring-purple-300 scale-105'
                              : 'bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md'
                          }`}
                          onClick={() => cambiarComponente('RAM', comp.id)}
                        >
                          {componentesSeleccionados?.ram === comp.id && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                              <Check className="h-2.5 w-2.5 text-purple-600" />
                            </div>
                          )}
                          <p className={`font-semibold text-[10px] truncate ${
                            componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-slate-800'
                          }`}>
                            {comp.marca}
                          </p>
                          <p className={`text-[11px] truncate font-medium ${
                            componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-slate-900'
                          }`}>
                            {comp.modelo}
                          </p>
                          <p className={`text-[9px] mt-1 ${
                            componentesSeleccionados?.ram === comp.id ? 'text-white/90' : 'text-slate-600'
                          }`}>
                            {comp.especificaciones.capacidad}
                          </p>
                          <p className={`font-bold text-[11px] mt-1.5 ${
                            componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-purple-600'
                          }`}>
                            {formatPrecio(remotePrices[comp.id] ?? comp.precio)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Categoría: Almacenamiento */}
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-lg p-3 border border-emerald-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <HardDrive className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800">Almacenamiento</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {componentes
                      .filter((c) => c.tipo === 'ALMACENAMIENTO')
                      .map((comp) => (
                        <button
                          key={comp.id}
                          className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${
                            componentesSeleccionados?.almacenamiento === comp.id
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg ring-2 ring-emerald-300 scale-105'
                              : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md'
                          }`}
                          onClick={() => cambiarComponente('ALMACENAMIENTO', comp.id)}
                        >
                          {componentesSeleccionados?.almacenamiento === comp.id && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                              <Check className="h-2.5 w-2.5 text-emerald-600" />
                            </div>
                          )}
                          <p className={`font-semibold text-[10px] truncate ${
                            componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-slate-800'
                          }`}>
                            {comp.marca}
                          </p>
                          <p className={`text-[11px] truncate font-medium ${
                            componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-slate-900'
                          }`}>
                            {comp.modelo}
                          </p>
                          <p className={`text-[9px] mt-1 truncate ${
                            componentesSeleccionados?.almacenamiento === comp.id ? 'text-white/90' : 'text-slate-600'
                          }`}>
                            {comp.especificaciones.tipo} - {comp.especificaciones.capacidad}
                          </p>
                          <p className={`font-bold text-[11px] mt-1.5 ${
                            componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-emerald-600'
                          }`}>
                            {formatPrecio(remotePrices[comp.id] ?? comp.precio)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Categoría: GPU - Opcional */}
                <div className="bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-lg p-3 border border-orange-100 xl:col-span-2 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <MonitorUp className="h-4 w-4 text-orange-600" />
                    <h3 className="text-xs font-bold text-slate-800">Tarjeta Gráfica</h3>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded-full border border-amber-200">
                      Opcional - Mejora el rendimiento gráfico
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {componentes
                      .filter((c) => c.tipo === 'GPU')
                      .map((comp) => (
                        <button
                          key={comp.id}
                          className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${
                            componentesSeleccionados?.gpu === comp.id
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg ring-2 ring-orange-300 scale-105'
                              : 'bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md'
                          }`}
                          onClick={() => cambiarComponente('GPU', comp.id)}
                        >
                          {componentesSeleccionados?.gpu === comp.id && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                              <Check className="h-2.5 w-2.5 text-orange-600" />
                            </div>
                          )}
                          <p className={`font-semibold text-[10px] truncate ${
                            componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-slate-800'
                          }`}>
                            {comp.marca}
                          </p>
                          <p className={`text-[11px] truncate font-medium ${
                            componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-slate-900'
                          }`}>
                            {comp.modelo}
                          </p>
                          <p className={`text-[9px] mt-1 ${
                            componentesSeleccionados?.gpu === comp.id ? 'text-white/90' : 'text-slate-600'
                          }`}>
                            {comp.especificaciones.vram}
                          </p>
                          <p className={`font-bold text-[11px] mt-1.5 ${
                            componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-orange-600'
                          }`}>
                            {formatPrecio(remotePrices[comp.id] ?? comp.precio)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mensaje cuando no hay modelo seleccionado */}
          {mejorasExpanded && !modeloSeleccionado && (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl mb-2 flex items-center justify-center">
                <Cpu className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-[10px] text-center">Primero seleccioná un modelo base para poder personalizarlo</p>
            </div>
          )}
        </div>
        </div>
        )}

        {/* Paso 3: Gabinete */}
        {pasoActual === 'gabinete' && <GabineteSelector />}

        {/* Paso 4: Fuente */}
        {pasoActual === 'fuente' && <FuenteSelector />}

        {/* Paso 5: Resumen */}
        {pasoActual === 'resumen' && (
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-6 animate-in fade-in slide-in-from-top duration-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-lg">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  ¡Configuración Lista!
                </h1>
                <p className="text-slate-600 text-sm">Tu PC personalizada está lista para ser armada</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda - Configuración */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Modelo Base */}
                  <div className="bg-white rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-left duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🖥️</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{modeloSeleccionado?.nombre}</h2>
                        <p className="text-xs text-slate-500">Modelo base seleccionado</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{modeloSeleccionado?.descripcion}</p>
                  </div>

                  {/* Componentes */}
                  <div className="bg-white rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-left duration-500 delay-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-blue-600" />
                      Componentes de tu PC
                    </h3>
                    
                    <div className="space-y-3">
                      {componentesDetalle.map(({ tipo, componente }, index) => (
                        <div 
                          key={tipo} 
                          className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all duration-300 border border-slate-100 hover:border-blue-200 hover:shadow-sm"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              {getComponentIcon(tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                                {tipo === 'procesador' && 'Procesador'}
                                {tipo === 'placaMadre' && 'Placa Madre'}
                                {tipo === 'ram' && 'Memoria RAM'}
                                {tipo === 'almacenamiento' && 'Almacenamiento'}
                                {tipo === 'gpu' && 'Tarjeta Gráfica'}
                                {tipo === 'fuente' && 'Fuente de Poder'}
                                {tipo === 'gabinete' && 'Gabinete'}
                              </p>
                              <p className="font-semibold text-slate-900 text-sm truncate">
                                {componente?.marca} {componente?.modelo}
                              </p>
                              {componente?.especificaciones && (
                                <p className="text-xs text-slate-500 truncate">
                                  {tipo === 'ram' && componente.especificaciones.capacidad}
                                  {tipo === 'almacenamiento' && `${componente.especificaciones.capacidad} ${componente.especificaciones.tipo}`}
                                  {tipo === 'gpu' && componente.especificaciones.vram}
                                  {tipo === 'fuente' && `${componente.especificaciones.potencia} ${componente.especificaciones.certificacion}`}
                                  {tipo === 'gabinete' && componente.especificaciones.formato}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600 text-sm">
                              {formatPrecio((componente ? (remotePrices[componente.id] ?? componente.precio) : 0) || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info Adicional */}
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left duration-500 delay-200">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <h4 className="font-bold text-green-900 text-sm">Garantía Incluida</h4>
                      </div>
                      <p className="text-xs text-green-700">12 meses de garantía en todos los componentes</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Box className="h-5 w-5 text-blue-600" />
                        <h4 className="font-bold text-blue-900 text-sm">Armado Profesional</h4>
                      </div>
                      <p className="text-xs text-blue-700">Probado y optimizado antes de entrega</p>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha - Resumen y Acciones */}
                <div className="space-y-4">
                  {/* Resumen de Precios */}
                  <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 animate-in fade-in slide-in-from-right duration-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Resumen de Compra</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-900">Total</span>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {formatPrecio(total)}
                          </p>
                          <p className="text-xs text-slate-500">Precio final</p>
                        </div>
                      </div>
                    </div>

                    {/* Opciones de pago */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border border-purple-200">
                      <p className="text-xs font-bold text-purple-900 mb-3 flex items-center gap-2">
                        💳 Opciones de pago
                      </p>
                      <div className="space-y-2">
                        {/* Contado / Débito / Transferencia - 25% OFF */}
                        <div className="bg-white rounded-lg p-2.5 border border-emerald-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-700 font-semibold">Contado / Débito / Transferencia</span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold">-25%</span>
                          </div>
                          <p className="text-base font-bold text-emerald-900 mt-1">
                            {formatPrecio(Math.ceil(total * 0.75))} <span className="text-[10px] font-normal">final</span>
                          </p>
                        </div>

                        {/* 1 cuota sin interés */}
                        <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-purple-700 font-semibold">1 cuota</span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">SIN INTERÉS</span>
                          </div>
                          <p className="text-base font-bold text-purple-900 mt-1">
                            {formatPrecio(Math.ceil(total))} <span className="text-xs font-normal">/única</span>
                          </p>
                        </div>

                        {/* 3 cuotas sin interés */}
                        <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-purple-700 font-semibold">3 cuotas</span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">SIN INTERÉS</span>
                          </div>
                          <p className="text-base font-bold text-purple-900 mt-1">
                            {formatPrecio(Math.ceil(total / 3))} <span className="text-xs font-normal">/mes</span>
                          </p>
                        </div>

                        {/* 6 cuotas sin interés */}
                        <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-purple-700 font-semibold">6 cuotas</span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">SIN INTERÉS</span>
                          </div>
                          <p className="text-base font-bold text-purple-900 mt-1">
                            {formatPrecio(Math.ceil(total / 6))} <span className="text-xs font-normal">/mes</span>
                          </p>
                        </div>
                      </div>

                      <p className="text-[9px] text-purple-600 mt-2 text-center">
                        Precios de cuotas sin interés provistos por el proveedor. Descuento aplicable solo en contado/débito/transferencia.
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-2">
                      <button
                        onClick={handleCompartirWhatsApp}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Consultar por WhatsApp
                      </button>

                      <button
                        onClick={handleDescargarPDF}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar Cotización PDF
                      </button>

                      <button
                        className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Compartir
                      </button>
                    </div>

                    {/* Nota legal */}
                    <p className="text-[10px] text-slate-500 mt-4 text-center">
                      Los precios están sujetos a disponibilidad de stock y pueden variar sin previo aviso.
                    </p>
                  </div>

                  {/* Banner de soporte */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white animate-in fade-in slide-in-from-right duration-500 delay-100">
                    <h4 className="font-bold text-lg mb-2">¿Necesitás ayuda?</h4>
                    <p className="text-sm text-blue-100 mb-4">
                      Nuestro equipo está disponible para asesorarte
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                        <span>Lun a Vie 9:00 - 18:00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                        <span>info@microhouse.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones de Navegación */}
      {pasoActual !== 'resumen' && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={handleAnterior}
              disabled={pasoActual === 'modelo'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                pasoActual === 'modelo'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:scale-105 active:scale-95 hover:-translate-x-1'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>

            <button
              onClick={handleSiguiente}
              disabled={!puedeAvanzar}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                puedeAvanzar
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-2xl hover:scale-110 active:scale-95 hover:translate-x-1'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {pasoActual === 'fuente' ? 'Ver Resumen' : 'Continuar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
