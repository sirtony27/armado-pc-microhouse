'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { modelosBase } from '@/data/modelos';
import { componentes } from '@/data/componentes';
import { formatPrecio } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Cpu, HardDrive, MemoryStick, MonitorUp, ChevronDown, Sparkles, ArrowRight, ArrowLeft, Box, Zap } from 'lucide-react';
import Stepper from '@/components/cotizador/Stepper';
import GabineteFuenteSelector from '@/components/cotizador/GabineteFuenteSelector';
import './animations.css';

export default function CotizarPage() {
  const { pasoActual, setPaso, modeloSeleccionado, componentesSeleccionados, setModeloBase, cambiarComponente } = useCotizadorStore();
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [mejorasExpanded, setMejorasExpanded] = useState(pasoActual === 'mejoras');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleSeleccionarModelo = (modelo: typeof modelosBase[0]) => {
    setModeloBase(modelo); // Esto ya actualiza el paso automáticamente
  };

  // Validar si puede avanzar de paso
  const puedeAvanzar = useMemo(() => {
    if (pasoActual === 'modelo') return !!modeloSeleccionado;
    if (pasoActual === 'mejoras') return !!modeloSeleccionado;
    if (pasoActual === 'gabinete-fuente') {
      return !!(componentesSeleccionados?.gabinete && componentesSeleccionados?.fuente);
    }
    return true;
  }, [pasoActual, modeloSeleccionado, componentesSeleccionados]);

  const handleSiguiente = () => {
    if (pasoActual === 'modelo' && puedeAvanzar) setPaso('mejoras');
    else if (pasoActual === 'mejoras' && puedeAvanzar) setPaso('gabinete-fuente');
    else if (pasoActual === 'gabinete-fuente' && puedeAvanzar) setPaso('resumen');
  };

  const handleAnterior = () => {
    if (pasoActual === 'mejoras') setPaso('modelo');
    else if (pasoActual === 'gabinete-fuente') setPaso('mejoras');
    else if (pasoActual === 'resumen') setPaso('gabinete-fuente');
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
      .reduce((sum, comp) => sum + comp.precio, 0);
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
    const nextIndex = (currentModelIndex + 1) % modelosBase.length;
    setCurrentModelIndex(nextIndex);
  };

  const prevModel = () => {
    const prevIndex = (currentModelIndex - 1 + modelosBase.length) % modelosBase.length;
    setCurrentModelIndex(prevIndex);
  };

  const subtotal = precioTotal;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

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
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-base font-bold text-white">MicroHouse</h2>
          <p className="text-[10px] text-blue-100 mt-0.5">
            {pasoActual === 'modelo' && 'Paso 1: Elegí tu modelo base'}
            {pasoActual === 'mejoras' && 'Paso 2: Personalizá tu PC'}
            {pasoActual === 'gabinete-fuente' && 'Paso 3: Gabinete y Fuente'}
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
                      {formatPrecio(componente?.precio || 0)}
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
              <div className="flex justify-between text-xs hover:scale-105 transition-transform duration-200">
                <span className="text-slate-600 font-medium">Subtotal</span>
                <span className="font-semibold text-slate-800">{formatPrecio(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs hover:scale-105 transition-transform duration-200">
                <span className="text-slate-600 font-medium">IVA (21%)</span>
                <span className="font-semibold text-slate-800">{formatPrecio(iva)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-300 hover:scale-105 transition-transform duration-200">
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Elegí tu PC Ideal
            </h1>
            <p className="text-slate-600 text-sm">Navegá entre los modelos base</p>
          </div>

          {/* Carrusel Coverflow */}
          <div 
            className="relative w-full max-w-6xl h-[550px] flex items-center justify-center perspective-[2000px]"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Botones de navegación */}
            <button
              onClick={prevModel}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-2xl transition-all hover:scale-125 active:scale-95 hover:-translate-x-1 border border-slate-200/50 duration-300"
            >
              <ChevronLeft className="h-6 w-6 text-slate-700" />
            </button>

            <button
              onClick={nextModel}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-2xl transition-all hover:scale-125 active:scale-95 hover:translate-x-1 border border-slate-200/50 duration-300"
            >
              <ChevronRight className="h-6 w-6 text-slate-700" />
            </button>

            {/* Container de Cards */}
            <div className="relative w-full h-full flex items-center justify-center">
              {[-1, 0, 1].map((offset) => {
                const index = (currentModelIndex + offset + modelosBase.length) % modelosBase.length;
                const modelo = modelosBase[index];
                
                return (
                  <div
                    key={`${index}-${offset}`}
                    className={`absolute transition-all duration-700 ease-out cursor-pointer ${
                      offset === 0 ? 'z-10' : 'z-0'
                    }`}
                    style={{
                      transform: `
                        translateX(${offset * 380}px)
                        scale(${offset === 0 ? 1 : 0.75})
                        rotateY(${offset * -15}deg)
                      `,
                      opacity: offset === 0 ? 1 : 0.4,
                      pointerEvents: offset === 0 ? 'auto' : 'none',
                    }}
                    onClick={() => offset === 0 && handleSeleccionarModelo(modelo)}
                  >
                    {/* Card del Modelo */}
                    <div 
                      className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border border-slate-200/50 w-[420px] ${
                        offset === 0 ? 'animate-glow' : ''
                      }`}
                    >
                      <div className="mb-4">
                        <div className={`w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transition-all ${
                          offset === 0 ? 'animate-float' : ''
                        }`}>
                          <span className="text-4xl">🖥️</span>
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {modelo.nombre}
                      </h2>
                      <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                        {modelo.descripcion}
                      </p>

                      {/* Resumen de componentes */}
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Incluye:</h3>
                        <div className="grid grid-cols-2 gap-2 text-left">
                          {modelo.componentes.procesador && (
                            <div className="flex items-start gap-1.5">
                              <Cpu className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[8px] text-slate-500 uppercase">Procesador</p>
                                <p className="text-[9px] font-semibold text-slate-800 leading-tight">
                                  {componentes.find(c => c.id === modelo.componentes.procesador)?.modelo || 'Incluido'}
                                </p>
                              </div>
                            </div>
                          )}
                          {modelo.componentes.ram && (
                            <div className="flex items-start gap-1.5">
                              <MemoryStick className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[8px] text-slate-500 uppercase">RAM</p>
                                <p className="text-[9px] font-semibold text-slate-800">
                                  {componentes.find(c => c.id === modelo.componentes.ram)?.especificaciones.capacidad || 'Incluido'}
                                </p>
                              </div>
                            </div>
                          )}
                          {modelo.componentes.almacenamiento && (
                            <div className="flex items-start gap-1.5">
                              <HardDrive className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[8px] text-slate-500 uppercase">Storage</p>
                                <p className="text-[9px] font-semibold text-slate-800">
                                  {componentes.find(c => c.id === modelo.componentes.almacenamiento)?.especificaciones.capacidad || 'Incluido'}
                                </p>
                              </div>
                            </div>
                          )}
                          {modelo.componentes.gpu && (
                            <div className="flex items-start gap-1.5">
                              <MonitorUp className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[8px] text-slate-500 uppercase">GPU</p>
                                <p className="text-[9px] font-semibold text-slate-800 leading-tight">
                                  {componentes.find(c => c.id === modelo.componentes.gpu)?.modelo || 'Incluida'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {modelo.usoRecomendado.map((uso) => (
                          <span
                            key={uso}
                            className="px-2 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[9px] font-medium border border-blue-200/50"
                          >
                            {uso}
                          </span>
                        ))}
                      </div>

                      <div className="mb-4 px-3 py-2 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200/50">
                        <p className="text-[9px] text-slate-500 uppercase font-medium tracking-wide mb-0.5">Precio base</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {formatPrecio(modelo.precioBase)}
                        </p>
                        <p className="text-[8px] text-slate-400 mt-0.5">Sin gabinete ni fuente</p>
                      </div>

                      {offset === 0 && (
                        <button
                          onClick={() => handleSeleccionarModelo(modelo)}
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transform duration-200 ripple"
                        >
                          Seleccionar este Modelo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex gap-2 mt-6">
            {modelosBase.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentModelIndex(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentModelIndex
                    ? 'w-8 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg'
                    : 'w-2 bg-slate-300 hover:bg-slate-400 hover:scale-150'
                }`}
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
                            {formatPrecio(comp.precio)}
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
                            {formatPrecio(comp.precio)}
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
                            {formatPrecio(comp.precio)}
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

        {/* Paso 3: Gabinete y Fuente */}
        {pasoActual === 'gabinete-fuente' && <GabineteFuenteSelector />}

        {/* Paso 4: Resumen */}
        {pasoActual === 'resumen' && (
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-slate-900 mb-6">Resumen de tu Configuración</h1>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  {modeloSeleccionado?.nombre}
                </h2>
                
                <div className="space-y-3">
                  {componentesDetalle.map(({ tipo, componente }) => (
                    <div key={tipo} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        {getComponentIcon(tipo)}
                        <div>
                          <p className="text-xs text-slate-500 uppercase">
                            {tipo === 'procesador' && 'Procesador'}
                            {tipo === 'placamadre' && 'Placa Madre'}
                            {tipo === 'ram' && 'Memoria RAM'}
                            {tipo === 'almacenamiento' && 'Almacenamiento'}
                            {tipo === 'gpu' && 'GPU'}
                            {tipo === 'fuente' && 'Fuente'}
                            {tipo === 'gabinete' && 'Gabinete'}
                          </p>
                          <p className="font-medium text-slate-900">
                            {componente?.marca} {componente?.modelo}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-blue-600">
                        {formatPrecio(componente?.precio || 0)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t-2 border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold">{formatPrecio(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">IVA (21%)</span>
                      <span className="font-semibold">{formatPrecio(iva)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2">
                      <span>TOTAL</span>
                      <span className="text-blue-600">{formatPrecio(total)}</span>
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
              {pasoActual === 'gabinete-fuente' ? 'Ver Resumen' : 'Continuar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
