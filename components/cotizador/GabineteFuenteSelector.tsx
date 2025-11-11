'use client';

import { componentes } from '@/data/componentes';
import { formatPrecio } from '@/lib/utils';
import { Check, Box, Zap, AlertCircle } from 'lucide-react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useMemo } from 'react';

export default function GabineteFuenteSelector() {
  const { componentesSeleccionados, cambiarComponente } = useCotizadorStore();

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
  const gabinetes = componentes.filter((c) => c.tipo === 'GABINETE');

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <div className="max-w-6xl mx-auto">
        {/* Advertencia de Potencia */}
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuentes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-slate-800">Fuente de Poder</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-semibold rounded-full border border-red-200">
                Requerido
              </span>
            </div>

            <div className="space-y-3">
              {fuentes.map((fuente) => {
                const potencia = parseInt(fuente.especificaciones.potencia?.replace('W', '') || '0');
                const esRecomendada = potencia >= potenciaRequerida;
                const esInsuficiente = potencia < potenciaRequerida;

                return (
                  <button
                    key={fuente.id}
                    disabled={esInsuficiente}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      componentesSeleccionados?.fuente === fuente.id
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg ring-2 ring-yellow-300'
                        : esInsuficiente
                        ? 'bg-slate-100 border border-slate-300 opacity-50 cursor-not-allowed'
                        : 'bg-white border-2 border-slate-200 hover:border-yellow-400 hover:shadow-md'
                    }`}
                    onClick={() => !esInsuficiente && cambiarComponente('FUENTE', fuente.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-bold text-sm ${
                            componentesSeleccionados?.fuente === fuente.id ? 'text-white' : 'text-slate-900'
                          }`}>
                            {fuente.marca} {fuente.modelo}
                          </p>
                          {esRecomendada && !esInsuficiente && componentesSeleccionados?.fuente !== fuente.id && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-semibold rounded-full">
                              Recomendada
                            </span>
                          )}
                          {esInsuficiente && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-semibold rounded-full">
                              Insuficiente
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mb-2 ${
                          componentesSeleccionados?.fuente === fuente.id ? 'text-white/90' : 'text-slate-600'
                        }`}>
                          {fuente.descripcion}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            componentesSeleccionados?.fuente === fuente.id
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {fuente.especificaciones.potencia}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            componentesSeleccionados?.fuente === fuente.id
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {fuente.especificaciones.certificacion}
                          </span>
                        </div>
                        <p className={`font-bold text-base ${
                          componentesSeleccionados?.fuente === fuente.id ? 'text-white' : 'text-yellow-600'
                        }`}>
                          {formatPrecio(fuente.precio)}
                        </p>
                      </div>
                      {componentesSeleccionados?.fuente === fuente.id && (
                        <div className="bg-white rounded-full p-1 shadow ml-3">
                          <Check className="h-4 w-4 text-yellow-600" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gabinetes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Gabinete</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-semibold rounded-full border border-red-200">
                Requerido
              </span>
            </div>

            <div className="space-y-3">
              {gabinetes.map((gabinete) => (
                <button
                  key={gabinete.id}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    componentesSeleccionados?.gabinete === gabinete.id
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg ring-2 ring-blue-300'
                      : 'bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                  onClick={() => cambiarComponente('GABINETE', gabinete.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-bold text-sm mb-1 ${
                        componentesSeleccionados?.gabinete === gabinete.id ? 'text-white' : 'text-slate-900'
                      }`}>
                        {gabinete.marca} {gabinete.modelo}
                      </p>
                      <p className={`text-xs mb-2 ${
                        componentesSeleccionados?.gabinete === gabinete.id ? 'text-white/90' : 'text-slate-600'
                      }`}>
                        {gabinete.descripcion}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          componentesSeleccionados?.gabinete === gabinete.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {gabinete.especificaciones.formato}
                        </span>
                        {gabinete.especificaciones.color && (
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            componentesSeleccionados?.gabinete === gabinete.id
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {gabinete.especificaciones.color}
                          </span>
                        )}
                      </div>
                      <p className={`font-bold text-base ${
                        componentesSeleccionados?.gabinete === gabinete.id ? 'text-white' : 'text-blue-600'
                      }`}>
                        {formatPrecio(gabinete.precio)}
                      </p>
                    </div>
                    {componentesSeleccionados?.gabinete === gabinete.id && (
                      <div className="bg-white rounded-full p-1 shadow ml-3">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
