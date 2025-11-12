'use client';

import { PasoCotizador } from '@/types';
import { Check } from 'lucide-react';

interface StepperProps {
  pasoActual: PasoCotizador;
}

const pasos = [
  { id: 'modelo' as PasoCotizador, label: 'Modelo Base', numero: 1 },
  { id: 'mejoras' as PasoCotizador, label: 'Mejoras', numero: 2 },
  { id: 'gabinete' as PasoCotizador, label: 'Gabinete', numero: 3 },
  { id: 'fuente' as PasoCotizador, label: 'Fuente', numero: 4 },
  { id: 'resumen' as PasoCotizador, label: 'Resumen', numero: 5 },
];

export default function Stepper({ pasoActual }: StepperProps) {
  const pasoActualIndex = pasos.findIndex((p) => p.id === pasoActual);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {pasos.map((paso, index) => {
            const isCompleted = index < pasoActualIndex;
            const isCurrent = index === pasoActualIndex;
            const isUpcoming = index > pasoActualIndex;

            return (
              <div key={paso.id} className="flex items-center flex-1">
                {/* Círculo del paso */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : isCurrent
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-4 ring-blue-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{paso.numero}</span>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {paso.label}
                  </p>
                </div>

                {/* Línea conectora */}
                {index < pasos.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3 mt-[-24px]">
                    <div
                      className={`h-full transition-all ${
                        isCompleted
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'bg-slate-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
