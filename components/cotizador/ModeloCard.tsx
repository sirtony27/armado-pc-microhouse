'use client';

import { ModeloBase } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatPrecio } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ModeloCardProps {
  modelo: ModeloBase;
  seleccionado: boolean;
  onSelect: (modelo: ModeloBase) => void;
}

export default function ModeloCard({ modelo, seleccionado, onSelect }: ModeloCardProps) {
  return (
    <Card
      hover
      className={`relative overflow-hidden p-6 cursor-pointer transition-all ${
        seleccionado ? 'ring-2 ring-blue-600 border-blue-600' : ''
      }`}
      onClick={() => onSelect(modelo)}
    >
      {seleccionado && (
        <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div className="mb-4">
        {modelo.imagenUrl && (
          <div className="mb-3 rounded-md overflow-hidden">
            <img src={modelo.imagenUrl} alt={modelo.nombre} loading="lazy" className="w-full h-28 object-cover" />
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-900">{modelo.nombre}</h3>
        <p className="mt-2 text-sm text-gray-600">{modelo.descripcion}</p>
      </div>
      
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500">Ideal para:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {modelo.usoRecomendado.map((uso) => (
            <span
              key={uso}
              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {uso}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mb-4 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">Desde</p>
        <p className="text-2xl font-bold text-gray-900">{formatPrecio(modelo.precioBase)}</p>
      </div>
      
      <Button
        variant={seleccionado ? 'primary' : 'outline'}
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(modelo);
        }}
      >
        {seleccionado ? 'Seleccionado' : 'Seleccionar'}
      </Button>
    </Card>
  );
}
