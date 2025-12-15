'use client';

import { usePresupuestoStore } from '@/store/presupuestoStore';
import { formatPrecio } from '@/lib/utils';
import { Trash2, FileText, ChevronRight, Calculator, X } from 'lucide-react';
import { useState } from 'react';

interface BudgetSidebarProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function BudgetSidebar({ isOpen: controlledIsOpen, setIsOpen: controlledSetIsOpen }: BudgetSidebarProps = {}) {
    const { items, removeItem, updateQuantity, totalEstimado } = usePresupuestoStore();
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? controlledSetIsOpen! : setInternalIsOpen;

    // If empty and closed, don't show anything (or show a small floating button)
    if (items.length === 0 && !isOpen) {
        return null;
    }

    const total = totalEstimado();

    return (
        <>
            {/* Floating Toggle Button (Visible when closed or on mobile) */}
            {!isOpen && items.length > 0 && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-[#E02127] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-bottom duration-500 flex items-center gap-2"
                >
                    <div className="relative">
                        <Calculator className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 bg-white text-[#E02127] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#E02127]">
                            {items.length}
                        </span>
                    </div>
                    <span className="font-bold hidden md:inline">Ver Presupuesto</span>
                </button>
            )}

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Panel */}
            <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Calculator className="w-6 h-6 text-[#E02127]" />
                        <div>
                            <h2 className="font-bold text-lg leading-none">Tu Presupuesto</h2>
                            <p className="text-xs text-slate-400 mt-1">{items.length} items agregados</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* CSS Scrollbar Hide Utility */}
                <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 hide-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 opacity-60">
                            <Calculator className="w-16 h-16 mb-4 text-slate-300" />
                            <p className="text-lg font-medium">No hay items</p>
                            <p className="text-sm">Agregá notebooks o PCs para armar tu cotización.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3 animate-in slide-in-from-right duration-300">
                                {/* Image Thumb */}
                                <div className="w-16 h-16 bg-slate-50 rounded-lg shrink-0 p-2 flex items-center justify-center border border-slate-100">
                                    {item.producto?.imagenUrl ? (
                                        <img src={item.producto.imagenUrl} className="w-full h-full object-contain" alt="" />
                                    ) : (
                                        <div className="text-slate-300 font-bold text-xs">IMG</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">
                                                {item.tipo === 'PC_ARMADA' ? (item.detalles?.modeloNombre || 'PC Armada') : (item.producto.modelo || 'Producto')}
                                            </h4>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{item.detalles?.specs}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-2 py-1">
                                            <button
                                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold"
                                                onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                            >
                                                -
                                            </button>
                                            <span className="text-xs font-bold text-slate-900 w-4 text-center">{item.cantidad}</span>
                                            <button
                                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold"
                                                onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="font-bold text-[#E02127] text-sm">
                                            {formatPrecio(item.precioUnitario * item.cantidad)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer actions */}
                <div className="p-5 bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Estimado</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrecio(total)}</span>
                    </div>

                    <button
                        className="w-full bg-[#E02127] text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={items.length === 0}
                        onClick={async () => {
                            const { generateBudgetPDF } = await import('@/lib/pdfGenerator');
                            generateBudgetPDF(items);
                        }}
                    >
                        <FileText className="w-5 h-5" />
                        GENERAR COTIZACIÓN
                    </button>
                </div>

            </div>
        </>
    );
}
