'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatPrecio } from '@/lib/utils';
import { Download, Share2, Save } from 'lucide-react';

interface ResumenCotizacionProps {
  nombreModelo: string;
  componentesConPrecios: { tipo: string; nombre: string; precio: number }[];
  total: number;
}

export default function ResumenCotizacion({
  nombreModelo,
  componentesConPrecios,
  total,
}: ResumenCotizacionProps) {
  const subtotal = total;
  const iva = total * 0.21;
  const totalConIva = total + iva;

  const handleDescargarPDF = () => {
    alert('Funcionalidad de PDF en desarrollo');
  };

  const handleCompartirWhatsApp = () => {
    const mensaje = `🖥️ *Cotización PC - MicroHouse*\n\n*Modelo:* ${nombreModelo}\n*Total:* ${formatPrecio(totalConIva)}\n\n¡Consultá disponibilidad!`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleGuardar = () => {
    alert('Funcionalidad de guardar en desarrollo');
  };

  return (
    <div className="sticky top-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de Cotización</h2>
        
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Modelo Base</p>
          <p className="font-semibold text-gray-900">{nombreModelo}</p>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-gray-700">Componentes:</p>
          {componentesConPrecios.map((comp, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600">{comp.tipo}</span>
              <span className="font-medium text-gray-900">{formatPrecio(comp.precio)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatPrecio(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA (21%)</span>
            <span className="font-medium text-gray-900">{formatPrecio(iva)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
            <span className="text-gray-900">TOTAL</span>
            <span className="text-blue-600">{formatPrecio(totalConIva)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button variant="primary" className="w-full" onClick={handleGuardar}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cotización
          </Button>
          <Button variant="outline" className="w-full" onClick={handleDescargarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleCompartirWhatsApp}>
            <Share2 className="h-4 w-4 mr-2" />
            Enviar por WhatsApp
          </Button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Cotización válida por 7 días. Sujeto a disponibilidad de stock.
        </p>
      </Card>
    </div>
  );
}
