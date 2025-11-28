'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Briefcase, PenTool, ChevronRight, Check, ArrowLeft, Cpu, MonitorUp, Box, ChevronLeft } from 'lucide-react';
import { useComponentes } from '@/lib/componentes';

import { formatPrecio } from '@/lib/utils';
import { Componente } from '@/types';

interface WizardProps {
    onComplete: (recommendedModelSlug: string, gpuParam?: string, caseParam?: string, budgetParam?: string) => void;
    onCancel: () => void;
}

type UsageType = 'GAMING' | 'OFFICE' | 'DESIGN';
type BudgetLevel = 'ENTRY' | 'MID' | 'HIGH' | 'ULTRA';

export default function Wizard({ onComplete, onCancel }: WizardProps) {
    const [step, setStep] = useState(1);
    const [usage, setUsage] = useState<UsageType | null>(null);
    const [budget, setBudget] = useState<BudgetLevel | null>(null);
    const [gpuPreference, setGpuPreference] = useState<'INTEGRATED' | 'DEDICATED' | null>(null);

    // Cabinet Carousel State
    const componentes = useComponentes();
    const gabinetes = useMemo(() => componentes.filter(c => c.tipo === 'GABINETE' && c.disponible), [componentes]);

    const sortedGabinetes = useMemo(() => {
        return [...gabinetes].sort((a, b) => {
            const pa = Number(a.precio ?? 0);
            const pb = Number(b.precio ?? 0);
            return pa - pb;
        });
    }, [gabinetes]);

    const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    const handleUsageSelect = (selected: UsageType) => {
        setUsage(selected);
        setStep(2);
    };

    const handleBudgetSelect = (selected: BudgetLevel) => {
        setBudget(selected);
        // If usage is OFFICE, skip GPU selection and go to Case
        if (usage === 'OFFICE') {
            setGpuPreference('INTEGRATED'); // Default for office
            setStep(4); // Skip to Case
        } else {
            setStep(3); // Go to GPU
        }
    };

    const handleGpuSelect = (selected: 'INTEGRATED' | 'DEDICATED') => {
        setGpuPreference(selected);
        setStep(4); // Go to Case
    };

    const handleCaseSelect = (caseId: string) => {
        setSelectedCaseId(caseId);
        finishWizard(caseId);
    };

    const finishWizard = (finalCaseId: string) => {
        // Logic to determine model based on usage + budget
        let recommendedSlug = '';

        if (usage === 'GAMING') {
            if (budget === 'ENTRY') recommendedSlug = 'gamer-bronze-r3';
            else if (budget === 'MID') recommendedSlug = 'gamer-silver-r5';
            else if (budget === 'HIGH') recommendedSlug = 'gamer-gold-r5';
            else recommendedSlug = 'gamer-platinum-r7';
        } else if (usage === 'OFFICE') {
            if (budget === 'ENTRY') recommendedSlug = 'hogar-estudio-i3';
            else recommendedSlug = 'oficina-hogar-i5';
        } else if (usage === 'DESIGN') {
            recommendedSlug = 'gamer-creator-r7';
        }

        if (!recommendedSlug) recommendedSlug = 'gamer-silver-r5';

        // Pass preferences as query params
        const gpuParam = gpuPreference === 'DEDICATED' ? 'dedicated' : 'integrated';

        // We pass the specific case ID now
        onComplete(recommendedSlug, gpuParam, finalCaseId, budget || 'MID');
    };

    // Carousel Logic
    const nextGabinete = () => {
        if (isTransitioning || sortedGabinetes.length === 0) return;
        setIsTransitioning(true);
        const nextIdx = (currentCaseIndex + 1) % sortedGabinetes.length;
        setCurrentCaseIndex(nextIdx);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const prevGabinete = () => {
        if (isTransitioning || sortedGabinetes.length === 0) return;
        setIsTransitioning(true);
        const prevIdx = (currentCaseIndex - 1 + sortedGabinetes.length) % sortedGabinetes.length;
        setCurrentCaseIndex(prevIdx);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between shadow-sm">
                <button
                    onClick={step === 1 ? onCancel : () => setStep(step - 1)}
                    className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {step === 1 ? 'Volver al inicio' : 'Volver atrás'}
                </button>
                <div className="flex gap-2">
                    <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-[#E02127]' : 'bg-slate-200'}`} />
                    <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-[#E02127]' : 'bg-slate-200'}`} />
                    {usage !== 'OFFICE' && (
                        <div className={`h-2 w-12 rounded-full transition-colors ${step >= 3 ? 'bg-[#E02127]' : 'bg-slate-200'}`} />
                    )}
                    <div className={`h-2 w-12 rounded-full transition-colors ${step >= 4 ? 'bg-[#E02127]' : 'bg-slate-200'}`} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-[2vh] max-w-5xl mx-auto w-full overflow-y-auto overflow-x-hidden custom-scrollbar">

                {step === 1 && (
                    <div className="w-full flex flex-col gap-[var(--space-lg)] animate-in fade-in slide-in-from-right duration-500 py-[var(--space-sm)]">
                        <div className="text-center space-y-[var(--space-xs)]">
                            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black text-slate-900 leading-tight">¿Para qué vas a usar la PC?</h2>
                            <p className="text-[var(--text-lg)] text-slate-700 font-medium">Elegí la opción que mejor te describa.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-[2vh]">
                            <OptionCard
                                icon={<Gamepad2 className="w-8 h-8 md:w-12 md:h-12 text-purple-500" />}
                                title="Gaming"
                                description="Jugar a todo: LoL, Valorant, Warzone, AAA."
                                onClick={() => handleUsageSelect('GAMING')}
                            />
                            <OptionCard
                                icon={<Briefcase className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />}
                                title="Oficina / Estudio"
                                description="Word, Excel, Navegación, Clases virtuales."
                                onClick={() => handleUsageSelect('OFFICE')}
                            />
                            <OptionCard
                                icon={<PenTool className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />}
                                title="Diseño / Edición"
                                description="Photoshop, Premiere, Renderizado 3D."
                                onClick={() => handleUsageSelect('DESIGN')}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="w-full flex flex-col gap-[var(--space-lg)] animate-in fade-in slide-in-from-right duration-500 py-[var(--space-sm)]">
                        <div className="text-center space-y-[var(--space-xs)]">
                            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black text-slate-900 leading-tight">¿Qué nivel de rendimiento buscás?</h2>
                            <p className="text-[var(--text-base)] text-slate-700 font-medium">Esto nos ayuda a ajustar el presupuesto.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2vh]">
                            {usage === 'GAMING' ? (
                                <>
                                    <OptionCard
                                        icon={<div className="text-2xl font-bold text-amber-700">🥉</div>}
                                        title="Entrada (Bronze)"
                                        description="Juegos livianos, eSports en calidad media."
                                        onClick={() => handleBudgetSelect('ENTRY')}
                                    />
                                    <OptionCard
                                        icon={<div className="text-2xl font-bold text-slate-400">🥈</div>}
                                        title="Medio (Silver)"
                                        description="La mayoría de juegos en 1080p Calidad Alta."
                                        onClick={() => handleBudgetSelect('MID')}
                                    />
                                    <OptionCard
                                        icon={<div className="text-2xl font-bold text-amber-400">🥇</div>}
                                        title="Alto (Gold)"
                                        description="Juegos pesados, Streaming, 144Hz."
                                        onClick={() => handleBudgetSelect('HIGH')}
                                    />
                                    <OptionCard
                                        icon={<div className="text-2xl font-bold text-cyan-400">💎</div>}
                                        title="Ultra (Platinum)"
                                        description="Máximo rendimiento, 4K, sin compromisos."
                                        onClick={() => handleBudgetSelect('ULTRA')}
                                    />
                                </>
                            ) : usage === 'OFFICE' ? (
                                <>
                                    <OptionCard
                                        icon={<div className="text-2xl font-bold text-slate-500">🏠</div>}
                                        title="Hogar / Básico"
                                        description="Navegación, YouTube, Tareas escolares."
                                        onClick={() => handleBudgetSelect('ENTRY')}
                                    />
                                    <OptionCard
                                        icon={<div className="text-2xl font-bold text-blue-500">💼</div>}
                                        title="Profesional"
                                        description="Multitarea intensiva, muchas pestañas, Office pesado."
                                        onClick={() => handleBudgetSelect('HIGH')} // Maps to i5
                                    />
                                </>
                            ) : (
                                // Design usually implies high performance, maybe just one step or simplified
                                <div className="col-span-full flex justify-center">
                                    <OptionCard
                                        icon={<Cpu className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />}
                                        title="Workstation Creator"
                                        description="Procesador potente y mucha RAM para renderizar."
                                        onClick={() => handleBudgetSelect('HIGH')} // Maps to Creator R7
                                        className="max-w-md w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && usage !== 'OFFICE' && (
                    <div className="w-full flex flex-col gap-[var(--space-lg)] animate-in fade-in slide-in-from-right duration-500 py-[var(--space-sm)]">
                        <div className="text-center space-y-[var(--space-xs)]">
                            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black text-slate-900 leading-tight">¿Querés una Placa de Video Dedicada?</h2>
                            <p className="text-[var(--text-base)] text-slate-700 font-medium">Para mayor rendimiento en juegos y renderizado.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[2vh] max-w-3xl mx-auto w-full">
                            <OptionCard
                                icon={<Cpu className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />}
                                title="Gráficos Integrados"
                                description="Suficiente para juegos livianos y uso general. Más económico."
                                onClick={() => handleGpuSelect('INTEGRATED')}
                            />
                            <OptionCard
                                icon={<MonitorUp className="w-8 h-8 md:w-12 md:h-12 text-purple-600" />}
                                title="Placa Dedicada (Recomendado)"
                                description="Máximo rendimiento para juegos AAA y trabajo pesado."
                                onClick={() => handleGpuSelect('DEDICATED')}
                                className="border-purple-200 bg-purple-50/30"
                            />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-right duration-500 h-full justify-center">
                        <div className="text-center space-y-[var(--space-xs)] mb-[var(--space-md)] shrink-0">
                            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black text-slate-900 leading-tight">Elegí tu Gabinete</h2>
                            <p className="text-[var(--text-base)] text-slate-700 font-medium">Deslizá para ver las opciones disponibles.</p>
                        </div>

                        {/* Carousel */}
                        <div className="relative w-full max-w-[95vw] md:max-w-[1400px] h-[75vh] shrink-0 mx-auto">
                            {sortedGabinetes.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-slate-500 animate-pulse">Cargando gabinetes...</div>
                            ) : (
                                <>
                                    <button
                                        onClick={prevGabinete}
                                        disabled={isTransitioning}
                                        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-md rounded-full p-2 md:p-4 shadow-2xl hover:scale-110 hover:bg-[#E02127] hover:text-white transition-all duration-300 group border border-slate-200"
                                    >
                                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-slate-700 group-hover:text-white" />
                                    </button>

                                    <div className="absolute inset-0 overflow-hidden">
                                        <div
                                            className="flex h-full items-center"
                                            style={{
                                                '--card-width': 'min(42vh, 85vw)',
                                                transform: `translateX(calc(50% - (${currentCaseIndex} + 0.5) * var(--card-width)))`,
                                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                            } as React.CSSProperties}
                                        >
                                            {sortedGabinetes.map((gabinete, index) => {
                                                const isCurrent = index === currentCaseIndex;
                                                const price = gabinete.precio ?? 0;
                                                const specs = (gabinete as any)?.especificaciones || {};
                                                const incluyeFuente = Boolean(
                                                    specs.incluyeFuente ||
                                                    specs.incluye_fuente ||
                                                    specs.fuenteIncluida ||
                                                    specs.psuIncluida ||
                                                    specs.psu_incluida
                                                );

                                                return (
                                                    <div
                                                        key={gabinete.id}
                                                        className="flex-shrink-0 px-4"
                                                        style={{ width: 'var(--card-width)' }}
                                                    >
                                                        <div className={`
                                                            bg-white rounded-[2vh] overflow-hidden flex flex-col h-[90%] transition-all duration-500 ease-in-out
                                                            ${isCurrent ? 'shadow-[0_0_0_3px_rgba(224,33,39,0.3),0_20px_60px_-10px_rgba(224,33,39,0.4)] ring-1 ring-[#E02127]/20 scale-100 opacity-100' : 'shadow-2xl scale-90 opacity-60 blur-[1px] grayscale-[0.5]'}
                                                        `}>
                                                            {/* Image Area */}
                                                            <div className="h-[35%] bg-gradient-to-b from-slate-50 to-white p-4 flex items-center justify-center relative group">
                                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                                {gabinete.imagenUrl ? (
                                                                    <img
                                                                        src={gabinete.imagenUrl}
                                                                        alt={gabinete.modelo}
                                                                        className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
                                                                    />
                                                                ) : (
                                                                    <Box className="w-24 h-24 md:w-32 md:h-32 text-slate-200" />
                                                                )}

                                                                {/* PSU Badge */}
                                                                {incluyeFuente && (
                                                                    <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-green-100/90 backdrop-blur px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold text-green-700 shadow-sm border border-green-200 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                                        CON FUENTE
                                                                    </div>
                                                                )}

                                                                {/* Brand Badge */}
                                                                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/90 backdrop-blur px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold text-slate-500 shadow-sm border border-slate-100">
                                                                    {gabinete.marca}
                                                                </div>
                                                            </div>

                                                            {/* Content Area */}
                                                            <div className="p-[var(--space-sm)] flex-1 flex flex-col justify-between bg-white relative">
                                                                <div>
                                                                    <h3 className="font-black text-slate-900 text-base md:text-xl mb-1 leading-tight line-clamp-2">{gabinete.modelo}</h3>
                                                                    <div className="flex items-center gap-2 flex-wrap mt-1">
                                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">ATX</span>
                                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Vidrio Templado</span>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                                    <div className="flex items-end justify-between mb-2">
                                                                        <div>
                                                                            <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-0.5">Precio de Lista</p>
                                                                            <p className="text-[#E02127] font-black text-lg md:text-2xl tracking-tight">{formatPrecio(price)}</p>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleCaseSelect(gabinete.id)}
                                                                        className="w-full bg-slate-900 text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-[#E02127] transition-all duration-300 shadow-lg hover:shadow-red-500/30 active:scale-95 flex items-center justify-center gap-2 group/btn"
                                                                    >
                                                                        Seleccionar
                                                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={nextGabinete}
                                        disabled={isTransitioning}
                                        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-md rounded-full p-2 md:p-4 shadow-2xl hover:scale-110 hover:bg-[#E02127] hover:text-white transition-all duration-300 group border border-slate-200"
                                    >
                                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-slate-700 group-hover:text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div >
                )
                }

            </div >
        </div >
    );
}

function OptionCard({ icon, title, description, onClick, className = '' }: any) {
    return (
        <button
            onClick={onClick}
            className={`bg-white p-[var(--space-md)] rounded-2xl border-2 border-slate-100 shadow-lg hover:shadow-2xl hover:border-[#E02127] hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col gap-[var(--space-sm)] w-full ${className}`}
        >
            <div className="p-[var(--space-xs)] bg-slate-50 rounded-xl w-fit group-hover:bg-red-50 transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-[var(--text-lg)] md:text-[var(--text-xl)] font-bold !text-slate-800 group-hover:text-[#E02127] transition-colors">{title}</h3>
                <p className="text-[var(--text-sm)] md:text-[var(--text-base)] !text-slate-600 font-medium mt-1 md:mt-2 leading-relaxed">{description}</p>
            </div>
        </button>
    );
}
