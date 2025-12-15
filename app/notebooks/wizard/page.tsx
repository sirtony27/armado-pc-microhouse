'use client';
import { useState, useMemo } from 'react';
import { useComponentes } from '@/lib/componentes';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, Sparkles, Laptop, Wallet, Briefcase, GraduationCap, Gamepad2, PenTool } from 'lucide-react';
import Image from 'next/image';
import { usePresupuestoStore } from '@/store/presupuestoStore';
import { formatPrecio } from '@/lib/utils';
import BudgetSidebar from '@/components/notebooks/BudgetSidebar';

// Step 1: Usage Types
const USAGE_OPTIONS = [
    { id: 'Hogar/Oficina', label: 'Hogar y Oficina', icon: Laptop, desc: 'Navegación, streaming, Office.' },
    { id: 'Estudiantes', label: 'Estudiantes', icon: GraduationCap, desc: 'Zoom, Word, batería duradera.' },
    { id: 'Diseño', label: 'Diseño & Creatividad', icon: PenTool, desc: 'Adobe, edición de video, colores reales.' },
    { id: 'Gamer', label: 'Gaming', icon: Gamepad2, desc: 'Juegos AAA, altos FPS, gráficas potentes.' },
    { id: 'Empresarial', label: 'Empresarial', icon: Briefcase, desc: 'Multitarea, seguridad, portabilidad.' },
];

export default function NotebookWizardPage() {
    const router = useRouter();
    const allComponents = useComponentes();
    const { items, addItem, removeItem, updateQuantity, totalEstimado } = usePresupuestoStore();
    const [step, setStep] = useState(1);
    const [selectedUsage, setSelectedUsage] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initial Filter: Get only notebooks
    const notebooks = useMemo(() => allComponents.filter(c => c.tipo === 'NOTEBOOK'), [allComponents]);

    // Matching Logic
    const recommendedNotebooks = useMemo(() => {
        if (!selectedUsage) return [];
        return notebooks.filter(nb => {
            const nbUsage = nb.especificaciones?.usage;
            // Direct match
            if (nbUsage === selectedUsage) return true;
            // Fallback: If no usage defined, maybe price/specs heuristics? 
            // For now, let's rely on the tag we just standardized.
            return false;
        });
    }, [notebooks, selectedUsage]);

    const handleNext = () => {
        if (selectedUsage) setStep(2);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-[#0f172a] text-white py-6">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="text-yellow-400" />
                            Asistente de Notebooks
                        </h1>
                        <p className="text-slate-400 text-sm">Encontremos tu equipo ideal en segundos.</p>
                    </div>
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
                        Salir
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 relative">

                {/* Progress */}
                <div className="max-w-2xl mx-auto mb-10">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-500 mb-2">
                        <span className={step >= 1 ? 'text-[#E02127]' : ''}>1. ¿Para qué la usarás?</span>
                        <span className={step >= 2 ? 'text-[#E02127]' : ''}>2. Recomendaciones</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#E02127] transition-all duration-500 ease-out"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        />
                    </div>
                </div>

                {/* Step 1: Usage Selection */}
                {step === 1 && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-center text-slate-800 mb-8">
                            Seleccioná el uso principal
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {USAGE_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedUsage(option.id)}
                                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${selectedUsage === option.id
                                        ? 'border-[#E02127] bg-white shadow-lg scale-[1.02]'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${selectedUsage === option.id ? 'bg-red-50 text-[#E02127]' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <option.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className={`font-bold mb-1 ${selectedUsage === option.id ? 'text-[#E02127]' : 'text-slate-800'}`}>
                                        {option.label}
                                    </h3>
                                    <p className="text-xs text-slate-500">{option.desc}</p>

                                    {selectedUsage === option.id && (
                                        <div className="absolute top-4 right-4 text-[#E02127]">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={handleNext}
                                disabled={!selectedUsage}
                                className={`px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all ${selectedUsage
                                    ? 'bg-[#E02127] text-white shadow-lg hover:bg-red-700 hover:scale-105'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Ver Recomendaciones <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Recommendations */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <ChevronLeft className="w-6 h-6 text-slate-600" />
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Encontramos {recommendedNotebooks.length} equipos para vos
                            </h2>
                        </div>

                        {recommendedNotebooks.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                <Laptop className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">No hay coincidencias exactas</h3>
                                <p className="text-slate-500">No encontramos notebooks etiquetadas para este uso específico.</p>
                                <button onClick={() => router.push('/notebooks')} className="mt-4 text-[#E02127] font-bold hover:underline">
                                    Ver catálogo completo
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommendedNotebooks.map((nb) => {
                                    const inBudget = items.find(i => i.id === nb.id);
                                    return (
                                        <div key={nb.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                                            {/* Image */}
                                            <div className="aspect-[4/3] relative bg-slate-100 p-6 flex items-center justify-center">
                                                {nb.imagenUrl ? (
                                                    <Image src={nb.imagenUrl} alt={nb.modelo} width={400} height={300} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <Laptop className="w-20 h-20 text-slate-300" />
                                                )}
                                                {/* Badge */}
                                                <div className="absolute top-4 left-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                                    Recomendada
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="mb-4">
                                                    <p className="text-xs font-bold text-[#E02127] tracking-wider mb-1">{nb.marca.toUpperCase()}</p>
                                                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{nb.modelo}</h3>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {nb.especificaciones?.cpu && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{nb.especificaciones.cpu}</span>}
                                                        {nb.especificaciones?.ram && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{nb.especificaciones.ram}</span>}
                                                        {nb.especificaciones?.storage && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{nb.especificaciones.storage}</span>}
                                                    </div>
                                                </div>

                                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <div>
                                                        <span className="text-2xl font-bold text-slate-900">{formatPrecio(nb.precio)}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            addItem({
                                                                tipo: 'NOTEBOOK',
                                                                producto: nb,
                                                                cantidad: 1,
                                                                precioUnitario: nb.precio,
                                                                detalles: { specs: nb.descripcion }
                                                            });
                                                            setIsSidebarOpen(true);
                                                        }}
                                                        className="bg-[#E02127] text-white p-3 rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                                                        title="Agregar al presupuesto"
                                                    >
                                                        {inBudget ? <Check className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <BudgetSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </div>
    );
}
