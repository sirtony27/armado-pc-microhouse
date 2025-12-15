'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Cpu, HardDrive, Laptop, Check, PlusCircle } from 'lucide-react';
import { Componente } from '@/types';
import { formatPrecio } from '@/lib/utils';
import { usePresupuestoStore } from '@/store/presupuestoStore';

interface NotebookDetailsModalProps {
    notebook: Componente | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function NotebookDetailsModal({ notebook, isOpen, onClose }: NotebookDetailsModalProps) {
    const { addItem, items } = usePresupuestoStore();

    if (!notebook) return null;

    const isAdded = items.some(i => i.producto.id === notebook.id);
    const specs = notebook.especificaciones || {};

    const handleAddToBudget = () => {
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
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row relative">

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-500" />
                            </button>

                            {/* Image Section */}
                            <div className="w-full md:w-1/2 bg-slate-50 p-8 flex items-center justify-center">
                                <div className="relative w-full aspect-[4/3]">
                                    {notebook.imagenUrl ? (
                                        <Image
                                            src={notebook.imagenUrl}
                                            alt={notebook.modelo}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <Laptop className="w-32 h-32 text-slate-300 mx-auto" />
                                    )}
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                                <div className="mb-6">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{notebook.marca}</span>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 leading-tight">{notebook.modelo}</h2>
                                    <p className="text-slate-500 mt-2">{notebook.descripcion}</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                        <Cpu className="w-6 h-6 text-blue-500 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900">Procesador</h4>
                                            <p className="text-slate-600">{specs.cpu || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                        <div className="w-6 h-6 font-bold text-purple-500 text-center bg-purple-100 rounded flex items-center justify-center text-xs">Gb</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Memoria RAM</h4>
                                            <p className="text-slate-600">{specs.ram || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                        <HardDrive className="w-6 h-6 text-orange-500 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900">Almacenamiento</h4>
                                            <p className="text-slate-600">{specs.storage || 'No especificado'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                                    <div>
                                        <span className="text-sm text-slate-400 line-through font-medium block">
                                            {formatPrecio(Math.round(notebook.precio * 1.1))}
                                        </span>
                                        <span className="text-3xl font-black text-slate-900">
                                            {formatPrecio(notebook.precio)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={isAdded ? undefined : handleAddToBudget}
                                        disabled={isAdded}
                                        className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isAdded
                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                : 'bg-[#E02127] text-white shadow-xl shadow-red-500/30 hover:bg-red-700 hover:scale-105'
                                            }`}
                                    >
                                        {isAdded ? (
                                            <>
                                                <Check className="w-5 h-5" /> Agregado
                                            </>
                                        ) : (
                                            <>
                                                <PlusCircle className="w-5 h-5" /> Agregar al Presupuesto
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
