'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, ArrowRight } from 'lucide-react';
import { useComparisonStore } from '@/store/comparisonStore';
import Image from 'next/image';

export default function CompareFloatingBar() {
    const { items, removeItem, clear, setIsOpen } = useComparisonStore();

    if (items.length === 0) return null;

    return (
        <AnimatePresence>
            {items.length > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
                >
                    <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-white/10">
                        {/* Items Preview */}
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {items.map(item => (
                                    <div key={item.id} className="relative w-10 h-10 rounded-full bg-white border-2 border-slate-800 overflow-hidden shrink-0">
                                        {item.imagenUrl ? (
                                            <Image src={item.imagenUrl} alt={item.modelo} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200" />
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">{items.length} seleccionados</span>
                                <button onClick={clear} className="text-xs text-slate-400 hover:text-white text-left underline">Limpiar</button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => setIsOpen(true)}
                            className="bg-[#E02127] hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                            <Scale className="w-4 h-4" /> Comparar <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
