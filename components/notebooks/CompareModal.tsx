'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, PlusCircle, Trash2, Cpu, HardDrive } from 'lucide-react';
import Image from 'next/image';
import { useComparisonStore } from '@/store/comparisonStore';
import { usePresupuestoStore } from '@/store/presupuestoStore';
import { formatPrecio } from '@/lib/utils';
import { Componente } from '@/types';

export default function CompareModal() {
    const { items, isOpen, setIsOpen, removeItem } = useComparisonStore();
    const { addItem, items: budgetItems } = usePresupuestoStore();

    if (!isOpen) return null;

    const handleAddToBudget = (notebook: Componente) => {
        const specs = notebook.especificaciones || {};
        const specsSummary = [
            specs.cpu || specs.procesador,
            specs.ram && `${specs.ram} RAM`,
            specs.storage && `${specs.storage}`
        ].filter(Boolean).join(' / ');

        addItem({
            tipo: 'NOTEBOOK',
            producto: notebook,
            cantidad: 1,
            precioUnitario: notebook.precio,
            detalles: {
                specs: specsSummary
            }
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Comparador de Modelos</h2>
                                    <p className="text-slate-500 text-sm">Compara especificaciones técnicas lado a lado</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>

                            {/* Table Content */}
                            <div className="flex-1 overflow-auto p-6 bg-slate-50">
                                {items.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                        <p>No hay items seleccionados para comparar.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 min-w-[768px]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
                                        {items.map((notebook) => {
                                            const isAdded = budgetItems.some(i => i.producto.id === notebook.id);
                                            const specs = notebook.especificaciones || {};

                                            return (
                                                <div key={notebook.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => removeItem(notebook.id)}
                                                        className="self-end text-slate-400 hover:text-red-500 mb-2"
                                                        title="Quitar de comparación"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {/* Image */}
                                                    <div className="relative aspect-[4/3] mb-4">
                                                        {notebook.imagenUrl && (
                                                            <Image
                                                                src={notebook.imagenUrl}
                                                                alt={notebook.modelo}
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Title & Price */}
                                                    <div className="text-center mb-6">
                                                        <p className="text-xs font-bold text-slate-400 uppercase">{notebook.marca}</p>
                                                        <h3 className="font-bold text-slate-900 text-lg leading-tight h-12 overflow-hidden mb-2">{notebook.modelo}</h3>
                                                        <p className="text-2xl font-black text-slate-900">{formatPrecio(notebook.precio)}</p>
                                                    </div>

                                                    {/* Specs Grid */}
                                                    <div className="space-y-4 flex-1">
                                                        {/* CPU */}
                                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group/spec relative cursor-help">
                                                            <Cpu className="w-5 h-5 text-blue-500 shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 font-bold uppercase underline decoration-dotted">Procesador</p>
                                                                <p className="text-sm font-medium text-slate-900">{specs.cpu || '-'}</p>
                                                            </div>
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 invisible group-hover/spec:opacity-100 group-hover/spec:visible transition-all z-10 pointer-events-none">
                                                                El "cerebro" del equipo. Define la velocidad para abrir programas y tareas.
                                                            </div>
                                                        </div>

                                                        {/* RAM */}
                                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group/spec relative cursor-help">
                                                            <div className="w-5 h-5 flex items-center justify-center font-bold text-purple-500 text-xs bg-purple-100 rounded shrink-0">Gb</div>
                                                            <div>
                                                                <p className="text-xs text-slate-500 font-bold uppercase underline decoration-dotted">Memoria RAM</p>
                                                                <p className="text-sm font-medium text-slate-900">{specs.ram || '-'}</p>
                                                            </div>
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 invisible group-hover/spec:opacity-100 group-hover/spec:visible transition-all z-10 pointer-events-none">
                                                                Permite tener varias apps abiertas a la vez sin que se tilde.
                                                            </div>
                                                        </div>

                                                        {/* Storage */}
                                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group/spec relative cursor-help">
                                                            <HardDrive className="w-5 h-5 text-orange-500 shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 font-bold uppercase underline decoration-dotted">Almacenamiento</p>
                                                                <p className="text-sm font-medium text-slate-900">{specs.storage || '-'}</p>
                                                            </div>
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 invisible group-hover/spec:opacity-100 group-hover/spec:visible transition-all z-10 pointer-events-none">
                                                                Espacio para guardar tus fotos, documentos y programas.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action */}
                                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                                        <button
                                                            onClick={isAdded ? undefined : () => handleAddToBudget(notebook)}
                                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${isAdded
                                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                                : 'bg-[#E02127] text-white hover:bg-red-700'
                                                                }`}
                                                        >
                                                            {isAdded ? <><Check className="w-4 h-4" /> Agregado</> : <><PlusCircle className="w-4 h-4" /> Agregar</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
