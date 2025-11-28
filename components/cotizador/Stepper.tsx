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
  { id: 'fuente' as PasoCotizador, label: 'Fuente (Opcional)', numero: 4 },
  { id: 'monitor' as PasoCotizador, label: 'Monitor (Opcional)', numero: 5 },
  { id: 'resumen' as PasoCotizador, label: 'Resumen', numero: 6 },
];

export default function Stepper({ pasoActual }: StepperProps) {
  const pasoActualIndex = pasos.findIndex((p) => p.id === pasoActual);

  return (
    <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-1 md:py-2">
      <div className="max-w-4xl mx-auto overflow-x-auto">
        <div className="flex items-center justify-start md:justify-between gap-4">
          {pasos.map((paso, index) => {
            const isCompleted = index < pasoActualIndex;
            const isCurrent = index === pasoActualIndex;
            const isUpcoming = index > pasoActualIndex;

            return (
              <div key={paso.id} className="flex items-center flex-none md:flex-1">
                {/* Círculo del paso */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCompleted
                        ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white shadow-md'
                        : isCurrent
                          ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white shadow-lg ring-2 md:ring-4 ring-blue-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{paso.numero}</span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 md:mt-1 text-[9px] md:text-[10px] font-medium whitespace-nowrap truncate max-w-[80px] md:max-w-none ${isCurrent
                        ? 'text-[#E02127]'
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
                  <div className="flex-1 h-0.5 mx-2 md:mx-3 mt-[-18px] md:mt-[-24px]">
                    <div
                      className={`h-full transition-all ${isCompleted
                          ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B]'
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

