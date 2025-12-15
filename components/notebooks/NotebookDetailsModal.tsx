'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Cpu, HardDrive, Laptop, Check, PlusCircle, Sparkles, LayoutGrid } from 'lucide-react';
import { Componente } from '@/types';
import { formatPrecio } from '@/lib/utils';
import { usePresupuestoStore } from '@/store/presupuestoStore';

interface NotebookDetailsModalProps {
    notebook: Componente | null;
    allNotebooks: Componente[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (n: Componente) => void;
}

export default function NotebookDetailsModal({ notebook, allNotebooks, isOpen, onClose, onSelect }: NotebookDetailsModalProps) {
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
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-slate-100 rounded-full text-slate-500 transition-colors backdrop-blur-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Left Side: Image + Similar Pdtcs */}
                            <div className="w-full md:w-5/12 bg-slate-50 flex flex-col items-center justify-between p-6 relative border-r border-slate-100">
                                {/* Smart Badge (Modal Version - Floating on Image) */}
                                {(() => {
                                    const usage = specs.usage || specs.uso;
                                    if (usage) {
                                        return (
                                            <div className={`absolute top-6 left-6 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm z-10 ${usage === 'Gamer' ? 'bg-[#E02127] text-white' :
                                                    usage === 'Diseño' ? 'bg-purple-600 text-white' :
                                                        usage === 'Empresarial' ? 'bg-blue-600 text-white' :
                                                            usage === 'Estudiantes' ? 'bg-emerald-500 text-white' :
                                                                'bg-slate-500 text-white' // Hogar/Oficina default
                                                }`}>
                                                {usage}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <div className="relative w-full aspect-[4/3] flex items-center justify-center mb-6">
                                    <Image
                                        src={notebook.imagenUrl || '/placeholder.png'}
                                        alt={notebook.modelo}
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                {/* Similar Products (Moved here to save space on right) */}
                                <div className="w-full">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">También te podría interesar</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {allNotebooks
                                            .filter(n => n.id !== notebook.id && n.disponible && (n.marca === notebook.marca || (n.precio >= notebook.precio * 0.8 && n.precio <= notebook.precio * 1.2)))
                                            .sort(() => Math.random() - 0.5)
                                            .slice(0, 2)
                                            .map(similar => (
                                                <div key={similar.id} onClick={() => onSelect(similar)} className="bg-white p-2 rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex items-center gap-2 group/similar">
                                                    <div className="relative w-10 h-10 shrink-0">
                                                        <Image src={similar.imagenUrl || '/placeholder.png'} alt={similar.modelo} fill className="object-contain" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-900 truncate leading-tight group-hover/similar:text-blue-600">{similar.modelo}</p>
                                                        <p className="text-[10px] font-medium text-slate-500">{formatPrecio(similar.precio)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Specs & Actions */}
                            <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col overflow-y-auto bg-white">
                                <div className="mb-6">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{notebook.marca}</span>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{notebook.modelo}</h2>
                                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">{notebook.descripcion}</p>
                                </div>

                                {/* Specs Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                        <Cpu className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-0.5">Procesador</h4>
                                            <p className="text-slate-700 text-xs font-medium leading-tight">{specs.cpu || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-5 h-5 font-bold text-purple-600 text-center bg-purple-100 rounded flex items-center justify-center text-[10px] shrink-0">Gb</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-0.5">Memoria RAM</h4>
                                            <p className="text-slate-700 text-xs font-medium leading-tight">{specs.ram || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                        <HardDrive className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-0.5">Almacenamiento</h4>
                                            <p className="text-slate-700 text-xs font-medium leading-tight">{specs.storage || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                        <Laptop className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-0.5">Pantalla</h4>
                                            <p className="text-slate-700 text-xs font-medium leading-tight">{specs.screen || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    {specs.gpu && (
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                            <Sparkles className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-0.5">Gráficos</h4>
                                                <p className="text-slate-700 text-xs font-medium leading-tight">{specs.gpu}</p>
                                            </div>
                                        </div>
                                    )}
                                    {specs.os && (
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                            <LayoutGrid className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-0.5">Sistema Operativo</h4>
                                                <p className="text-slate-700 text-xs font-medium leading-tight">{specs.os}</p>
                                            </div>
                                        </div>
                                    )}
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
