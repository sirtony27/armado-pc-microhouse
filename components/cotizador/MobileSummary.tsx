'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, X, ShoppingBag } from 'lucide-react';
import { formatPrecio } from '@/lib/utils';
import { Componente, ModeloBase } from '@/types';

interface MobileSummaryProps {
    modeloSeleccionado: ModeloBase | null;
    componentesDetalle: { tipo: string; componente: Componente | undefined }[];
    total: number;
    remotePrices: Record<string, number>;
    getComponentIcon: (tipo: string) => React.ReactNode;
}

export default function MobileSummary({
    modeloSeleccionado,
    componentesDetalle,
    total,
    remotePrices,
    getComponentIcon,
}: MobileSummaryProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!modeloSeleccionado) return null;

    return (
        <>
            {/* Bottom Bar Fixed */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:hidden pb-safe">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total Estimado</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                            {formatPrecio(Math.ceil(total * 1.10))}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-lg active:scale-95 transition-transform"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Ver Detalle
                        <ChevronUp className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Drawer / Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
                        {/* Handle bar for dragging visual cue */}
                        <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900">Tu Configuración</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-5 space-y-4">
                            {/* Modelo Base */}
                            <div className="bg-gradient-to-r from-[#E02127] to-[#0D1A4B] rounded-xl p-4 text-white shadow-md">
                                <p className="text-xs opacity-80 uppercase tracking-wider font-semibold mb-1">Modelo Base</p>
                                <p className="text-lg font-bold">{modeloSeleccionado.nombre}</p>
                            </div>

                            {/* Lista de Componentes */}
                            <div className="space-y-2">
                                {componentesDetalle.map(({ tipo, componente }, index) => (
                                    <div
                                        key={tipo}
                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-[#E02127]">
                                            {getComponentIcon(tipo)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">
                                                {tipo === 'procesador' && 'Procesador'}
                                                {tipo === 'placamadre' && 'Placa Madre'}
                                                {tipo === 'ram' && 'Memoria RAM'}
                                                {tipo === 'almacenamiento' && 'Almacenamiento'}
                                                {tipo === 'gpu' && 'Gráfica'}
                                                {tipo === 'fuente' && 'Fuente'}
                                                {tipo === 'gabinete' && 'Gabinete'}
                                                {tipo === 'monitor' && 'Monitor'}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {componente ? `${componente.marca} ${componente.modelo}` : 'No seleccionado'}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#E02127]">
                                                {formatPrecio(Math.ceil((((componente ? (remotePrices[componente.id] ?? componente.precio) : 0) || 0) * 1.10)))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer with Total */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 pb-safe">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-slate-600">Total Final</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    {formatPrecio(Math.ceil(total * 1.10))}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 text-right">Incluye impuestos y descuentos aplicables</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
