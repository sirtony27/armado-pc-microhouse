'use client';

import { useState, useMemo } from 'react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { modelosBase } from '@/data/modelos';
import { componentes } from '@/data/componentes';
import { formatPrecio } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Download, Share2, Check, Cpu, HardDrive, MemoryStick, MonitorUp } from 'lucide-react';

export default function CotizarPage() {
  const { modeloSeleccionado, componentesSeleccionados, setModeloBase, cambiarComponente } = useCotizadorStore();
  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  const handleSeleccionarModelo = (modelo: typeof modelosBase[0]) => {
    setModeloBase(modelo);
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

  // Navegación del carrusel
  const nextModel = () => {
    const nextIndex = (currentModelIndex + 1) % modelosBase.length;
    setCurrentModelIndex(nextIndex);
    handleSeleccionarModelo(modelosBase[nextIndex]);
  };

  const prevModel = () => {
    const prevIndex = (currentModelIndex - 1 + modelosBase.length) % modelosBase.length;
    setCurrentModelIndex(prevIndex);
    handleSeleccionarModelo(modelosBase[prevIndex]);
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
      case 'ram': return <MemoryStick className="h-3 w-3" />;
      case 'almacenamiento': return <HardDrive className="h-3 w-3" />;
      case 'gpu': return <MonitorUp className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Panel Lateral Izquierdo - Resumen */}
      <div className="w-80 bg-white/95 backdrop-blur-sm shadow-xl border-r border-slate-200/50 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-base font-bold text-white">MicroHouse</h2>
          <p className="text-[10px] text-blue-100 mt-0.5">Cotizador PC Personalizado</p>
        </div>

        {/* Resumen de Componentes */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Tu Configuración</h3>
          
          {modeloSeleccionado ? (
            <>
              <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-sm">
                <p className="text-[11px] font-semibold text-white">{modeloSeleccionado.nombre}</p>
              </div>

              <div className="space-y-1.5 mb-3">
                {componentesDetalle.map(({ tipo, componente }) => (
                  <div key={tipo} className="bg-slate-50/70 rounded-md px-2.5 py-1.5 border border-slate-200/50">
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

              {/* Subtotal */}
              <div className="border-t border-slate-200 pt-2 space-y-1 mt-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-800">{formatPrecio(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-600">IVA (21%)</span>
                  <span className="font-medium text-slate-800">{formatPrecio(iva)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-slate-300 pt-1.5 mt-1.5">
                  <span className="text-slate-900">TOTAL</span>
                  <span className="text-blue-600">{formatPrecio(total)}</span>
                </div>
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

        {/* Botones de Acción */}
        <div className="p-3 border-t border-slate-200/50 space-y-1.5 bg-slate-50/50">
          <button
            onClick={handleDescargarPDF}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow text-[11px] font-medium"
          >
            <Download className="h-3 w-3" />
            Descargar PDF
          </button>
          <button
            onClick={handleCompartirWhatsApp}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow text-[11px] font-medium"
          >
            <Share2 className="h-3 w-3" />
            Enviar WhatsApp
          </button>
        </div>
      </div>

      {/* Área Principal - Carrusel de Modelos y Mejoras */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Carrusel de Modelos - Parte Superior */}
        <div className="flex flex-col items-center justify-center px-6 py-4" style={{ height: '40vh' }}>
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              Elegí tu PC Ideal
            </h1>
            <p className="text-slate-600 text-[11px]">Navegá entre los modelos base</p>
          </div>

          {/* Carrusel */}
          <div className="relative w-full max-w-lg">
            {/* Flecha Izquierda */}
            <button
              onClick={prevModel}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-slate-200/50"
            >
              <ChevronLeft className="h-4 w-4 text-slate-700" />
            </button>

            {/* Card del Modelo */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-5 text-center border border-slate-200/50">
              <div className="mb-2.5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🖥️</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {modelosBase[currentModelIndex].nombre}
              </h2>
              <p className="text-slate-600 mb-2.5 max-w-sm mx-auto text-[10px] leading-relaxed">
                {modelosBase[currentModelIndex].descripcion}
              </p>

              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {modelosBase[currentModelIndex].usoRecomendado.map((uso) => (
                  <span
                    key={uso}
                    className="px-2 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[9px] font-medium border border-blue-200/50"
                  >
                    {uso}
                  </span>
                ))}
              </div>

              <div className="mb-3 px-3 py-2 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200/50">
                <p className="text-[9px] text-slate-500 uppercase font-medium tracking-wide mb-0.5">Precio desde</p>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {formatPrecio(modelosBase[currentModelIndex].precioBase)}
                </p>
              </div>

              <button
                onClick={() => handleSeleccionarModelo(modelosBase[currentModelIndex])}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-[11px] font-semibold shadow-md hover:shadow-lg"
              >
                Seleccionar Modelo
              </button>
            </div>

            {/* Flecha Derecha */}
            <button
              onClick={nextModel}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-10 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-slate-200/50"
            >
              <ChevronRight className="h-4 w-4 text-slate-700" />
            </button>
          </div>

          {/* Indicadores */}
          <div className="flex gap-1.5 mt-3">
            {modelosBase.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentModelIndex(index);
                  handleSeleccionarModelo(modelosBase[index]);
                }}
                className={`h-1 rounded-full transition-all ${
                  index === currentModelIndex
                    ? 'w-5 bg-gradient-to-r from-blue-600 to-indigo-600'
                    : 'w-1 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mejoras Posibles - Parte Inferior */}
        <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200/50 px-4 py-3 overflow-y-auto shadow-inner" style={{ height: '60vh' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
            <h2 className="text-sm font-bold text-slate-800">Personalizá tu Configuración</h2>
          </div>
          
          {modeloSeleccionado ? (
            <div className="space-y-3">
              {/* Categoría: Procesador */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Cpu className="h-3.5 w-3.5 text-blue-600" />
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Procesador</h3>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1.5">
                  {componentes
                    .filter((c) => c.tipo === 'CPU')
                    .slice(0, 7)
                    .map((comp) => (
                      <button
                        key={comp.id}
                        className={`relative p-2 rounded-lg text-left transition-all group ${
                          componentesSeleccionados?.procesador === comp.id
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md scale-[1.02]'
                            : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => cambiarComponente('CPU', comp.id)}
                      >
                        {componentesSeleccionados?.procesador === comp.id && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow">
                            <Check className="h-2.5 w-2.5 text-blue-600" />
                          </div>
                        )}
                        <p className={`font-semibold text-[10px] truncate leading-tight ${
                          componentesSeleccionados?.procesador === comp.id ? 'text-white' : 'text-slate-800'
                        }`}>
                          {comp.marca}
                        </p>
                        <p className={`text-[10px] truncate ${
                          componentesSeleccionados?.procesador === comp.id ? 'text-white/90' : 'text-slate-900 font-medium'
                        }`}>
                          {comp.modelo}
                        </p>
                        <p className={`text-[9px] mt-0.5 ${
                          componentesSeleccionados?.procesador === comp.id ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {comp.especificaciones.cores}c
                        </p>
                        <p className={`font-bold text-[10px] mt-1 ${
                          componentesSeleccionados?.procesador === comp.id ? 'text-white' : 'text-blue-600'
                        }`}>
                          {formatPrecio(comp.precio)}
                        </p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Categoría: RAM */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MemoryStick className="h-3.5 w-3.5 text-purple-600" />
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Memoria RAM</h3>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1.5">
                  {componentes
                    .filter((c) => c.tipo === 'RAM')
                    .slice(0, 7)
                    .map((comp) => (
                      <button
                        key={comp.id}
                        className={`relative p-2 rounded-lg text-left transition-all ${
                          componentesSeleccionados?.ram === comp.id
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md scale-[1.02]'
                            : 'bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                        onClick={() => cambiarComponente('RAM', comp.id)}
                      >
                        {componentesSeleccionados?.ram === comp.id && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow">
                            <Check className="h-2.5 w-2.5 text-purple-600" />
                          </div>
                        )}
                        <p className={`font-semibold text-[10px] truncate leading-tight ${
                          componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-slate-800'
                        }`}>
                          {comp.marca}
                        </p>
                        <p className={`text-[10px] truncate ${
                          componentesSeleccionados?.ram === comp.id ? 'text-white/90' : 'text-slate-900 font-medium'
                        }`}>
                          {comp.modelo}
                        </p>
                        <p className={`text-[9px] mt-0.5 truncate ${
                          componentesSeleccionados?.ram === comp.id ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {comp.especificaciones.capacidad}
                        </p>
                        <p className={`font-bold text-[10px] mt-1 ${
                          componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-purple-600'
                        }`}>
                          {formatPrecio(comp.precio)}
                        </p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Categoría: Almacenamiento */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Almacenamiento</h3>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1.5">
                  {componentes
                    .filter((c) => c.tipo === 'ALMACENAMIENTO')
                    .slice(0, 7)
                    .map((comp) => (
                      <button
                        key={comp.id}
                        className={`relative p-2 rounded-lg text-left transition-all ${
                          componentesSeleccionados?.almacenamiento === comp.id
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md scale-[1.02]'
                            : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                        onClick={() => cambiarComponente('ALMACENAMIENTO', comp.id)}
                      >
                        {componentesSeleccionados?.almacenamiento === comp.id && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow">
                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                          </div>
                        )}
                        <p className={`font-semibold text-[10px] truncate leading-tight ${
                          componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-slate-800'
                        }`}>
                          {comp.marca}
                        </p>
                        <p className={`text-[10px] truncate ${
                          componentesSeleccionados?.almacenamiento === comp.id ? 'text-white/90' : 'text-slate-900 font-medium'
                        }`}>
                          {comp.modelo}
                        </p>
                        <p className={`text-[9px] mt-0.5 truncate ${
                          componentesSeleccionados?.almacenamiento === comp.id ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {comp.especificaciones.tipo} - {comp.especificaciones.capacidad}
                        </p>
                        <p className={`font-bold text-[10px] mt-1 ${
                          componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-emerald-600'
                        }`}>
                          {formatPrecio(comp.precio)}
                        </p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Categoría: GPU */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MonitorUp className="h-3.5 w-3.5 text-orange-600" />
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tarjeta Gráfica</h3>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1.5">
                  {componentes
                    .filter((c) => c.tipo === 'GPU')
                    .slice(0, 7)
                    .map((comp) => (
                      <button
                        key={comp.id}
                        className={`relative p-2 rounded-lg text-left transition-all ${
                          componentesSeleccionados?.gpu === comp.id
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-md scale-[1.02]'
                            : 'bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md'
                        }`}
                        onClick={() => cambiarComponente('GPU', comp.id)}
                      >
                        {componentesSeleccionados?.gpu === comp.id && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow">
                            <Check className="h-2.5 w-2.5 text-orange-600" />
                          </div>
                        )}
                        <p className={`font-semibold text-[10px] truncate leading-tight ${
                          componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-slate-800'
                        }`}>
                          {comp.marca}
                        </p>
                        <p className={`text-[10px] truncate ${
                          componentesSeleccionados?.gpu === comp.id ? 'text-white/90' : 'text-slate-900 font-medium'
                        }`}>
                          {comp.modelo}
                        </p>
                        <p className={`text-[9px] mt-0.5 ${
                          componentesSeleccionados?.gpu === comp.id ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {comp.especificaciones.vram}
                        </p>
                        <p className={`font-bold text-[10px] mt-1 ${
                          componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-orange-600'
                        }`}>
                          {formatPrecio(comp.precio)}
                        </p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mb-3 flex items-center justify-center">
                <Cpu className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-xs">Seleccioná un modelo para personalizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
