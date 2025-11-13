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
                    <div className="flex items-center gap-2">
                      {componente?.imagenUrl ? (
                        <img
                          src={componente.imagenUrl}
                          alt={`${componente?.marca || ''} ${componente?.modelo || ''}`}
                          loading="lazy"
                          className="w-6 h-6 rounded object-cover border border-slate-200"
                        />
                      ) : null}
                      <p className="font-medium text-slate-800 text-[11px] truncate leading-tight">
                        {componente?.marca} {componente?.modelo}
                      </p>
                    </div>
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
                        scale(${position === 0 ? 0.9 : 0.75})
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
                        {modelo.imagenUrl ? (
                          <div
                            className={`mx-auto mb-3 rounded-xl overflow-hidden shadow-lg transition-all duration-700 ${
                              position === 0 ? 'animate-float scale-100' : 'scale-90 opacity-80'
                            }`}
                            style={{ width: 220, height: 120 }}
                          >
                            <img
                              src={modelo.imagenUrl}
                              alt={modelo.nombre}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg transition-all duration-700 ${
                            position === 0 ? 'animate-float scale-100' : 'scale-90 opacity-80'
                          }`}>
                            <span className="text-3xl">🖥️</span>
                          </div>
                        )}
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 mb-2">
                        {modelo.nombre}
                      </h2>
                      <p className="text-slate-600 mb-4 text-xs leading-relaxed px-2">
