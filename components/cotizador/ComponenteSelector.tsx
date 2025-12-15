'use client';

import { Componente, TipoComponente } from '@/types';
import Card from '@/components/ui/Card';
import { formatPrecio } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ComponenteSelectorProps {
  tipo: TipoComponente;
  componentes: Componente[];
  seleccionadoId: string;
  onSelect: (componenteId: string) => void;
}

const tipoLabels: Record<TipoComponente, string> = {
  CPU: 'Procesador',
  GPU: 'Tarjeta Gráfica',
  RAM: 'Memoria RAM',
  ALMACENAMIENTO: 'Almacenamiento',
  PLACA_MADRE: 'Placa Madre',
  FUENTE: 'Fuente de Poder',
  GABINETE: 'Gabinete',
  MONITOR: 'Monitor',
  NOTEBOOK: 'Notebook',
};

export default function ComponenteSelector({
  tipo,
  componentes,
  seleccionadoId,
  onSelect,
}: ComponenteSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const componenteSeleccionado = componentes.find((c) => c.id === seleccionadoId);

  return (
    <div className="mb-4">
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{tipoLabels[tipo]}</h3>
            {componenteSeleccionado && (
              <div>
                <p className="font-semibold text-gray-900">
                  {componenteSeleccionado.marca} {componenteSeleccionado.modelo}
                </p>
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {formatPrecio(componenteSeleccionado.precio)}
                </p>
              </div>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''
              }`}
          />
        </button>

        {expanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="space-y-2">
              {componentes.map((componente) => (
                <button
                  key={componente.id}
                  onClick={() => {
                    onSelect(componente.id);
                    setExpanded(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${componente.id === seleccionadoId
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    {componente.imagenUrl && (
                      <div className="mr-3">
                        <img src={componente.imagenUrl} alt={`${componente.marca} ${componente.modelo}`} loading="lazy" className="w-12 h-12 rounded object-cover border" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {componente.marca} {componente.modelo}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{componente.descripcion}</p>

                      {/* Specs destacadas */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(componente.especificaciones)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span
                              key={key}
                              className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700"
                            >
                              {value}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <p className="font-bold text-gray-900">{formatPrecio(componente.precio)}</p>
                      {componente.id === seleccionadoId && (
                        <div className="mt-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
