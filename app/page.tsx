'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AttractScreen from '@/components/kiosk/AttractScreen';
import Wizard from '@/components/kiosk/Wizard';
import { Sparkles, Grid, ArrowRight, Laptop, Monitor } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'ATTRACT' | 'SELECTION' | 'WIZARD'>('ATTRACT');

  const handleStart = () => {
    setView('SELECTION');
  };

  const handleModeSelect = (mode: 'DESKTOP' | 'NOTEBOOK') => {
    if (mode === 'DESKTOP') {
      // For Desktop, we offer Choice: Wizard or Catalog?
      // For now, let's keep the sub-selection logic inline or redirect
      // The previous logic had a sub-menu. Let's incorporate that.
      // Actually, per plan, "Armar PC" -> Current PC Wizard Flow
      // "Notebooks" -> New Notebook Flow
      // Let's make "Armar PC" go to a sub-selection (Wizard vs Catalog) IF needed, 
      // or just direct to Wizard if that's the main path.
      // The user wants "Armar PC de Escritorio" vs "Cotizar Notebooks".
      // Let's implement a sub-state for Desktop to choose Wizard vs Catalog (existing logic).
      setView('WIZARD'); // Re-using existing Wizard flow as default for "Armar PC" button?
      // Wait, the previous code had 'WIZARD' vs 'CATALOG'.
      // Let's keep the split clear:
      // Option 1: PC
      // Option 2: Notebooks
    } else {
      router.push('/notebooks');
    }
  };

  // Logic for Desktop "Sub-selection" (Wizard vs Catalog)
  const [desktopMode, setDesktopMode] = useState<'NONE' | 'SELECTING'>('NONE');

  const handleDesktopUndo = () => setDesktopMode('NONE');

  const handleWizardComplete = (recommendedModelSlug: string, gpuParam?: string, caseParam?: string, budgetParam?: string) => {
    let url = `/cotizar?model=${recommendedModelSlug}&step=resumen`;
    if (gpuParam) url += `&gpu=${gpuParam}`;
    if (caseParam) url += `&case=${caseParam}`;
    if (budgetParam) url += `&budget=${budgetParam}`;
    router.push(url);
  };

  return (
    <main className="min-h-screen bg-slate-900 overflow-hidden relative">
      {/* Attract Screen Overlay */}
      {view === 'ATTRACT' && (
        <AttractScreen onStart={handleStart} />
      )}

      {/* Main Mode Selection Screen (PC vs Notebook) */}
      {view === 'SELECTION' && desktopMode === 'NONE' && (
        <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in duration-500 overflow-y-auto">
          <div className="max-w-5xl w-full space-y-8 md:space-y-12 text-center py-8">

            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                ¿QUÉ ESTÁS <span className="text-[#E02127]">BUSCANDO?</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium px-4">
                Seleccioná una categoría para comenzar tu presupuesto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-auto md:h-[50vh] items-stretch">

              {/* Option 1: Desktop PC */}
              <button
                onClick={() => setDesktopMode('SELECTING')}
                className="group relative bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(224,33,39,0.3)] hover:border-[#E02127] hover:-translate-y-2 transition-all duration-500 text-left overflow-hidden w-full flex flex-col"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                  <Monitor className="w-64 h-64 text-[#E02127]" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-3xl flex items-center justify-center group-hover:bg-[#E02127] transition-colors duration-500 mb-6 md:mb-auto">
                    <Monitor className="w-8 h-8 md:w-10 md:h-10 text-[#E02127] group-hover:text-white transition-colors" />
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-3 group-hover:text-[#E02127] transition-colors">PC de Escritorio</h3>
                    <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-sm">
                      Armado a medida, workstations y gaming de alto rendimiento.
                    </p>

                    <div className="mt-8 flex items-center text-[#E02127] font-bold text-base md:text-lg tracking-wide group-hover:translate-x-2 transition-transform">
                      ARMAR MI PC <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Notebooks */}
              <button
                onClick={() => router.push('/notebooks')}
                className="group relative bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] hover:border-blue-600 hover:-translate-y-2 transition-all duration-500 text-left overflow-hidden w-full flex flex-col"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
                  <Laptop className="w-64 h-64 text-blue-600" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500 mb-6 md:mb-auto">
                    <Laptop className="w-8 h-8 md:w-10 md:h-10 text-blue-600 group-hover:text-white transition-colors" />
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Notebooks</h3>
                    <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-sm">
                      Equipos portátiles para empresas, hogar y estudiantes.
                    </p>

                    <div className="mt-8 flex items-center text-blue-600 font-bold text-base md:text-lg tracking-wide group-hover:translate-x-2 transition-transform">
                      VER CATÁLOGO <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Desktop Sub-Selection (Wizard vs Catalog) - Reusing previous logic */}
      {view === 'SELECTION' && desktopMode === 'SELECTING' && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 animate-in slide-in-from-right duration-300">
          <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
            <button onClick={handleDesktopUndo} className="flex items-center text-slate-400 hover:text-slate-800 font-bold transition-colors">
              <ArrowRight className="w-5 h-5 mr-2 rotate-180" /> Volver
            </button>
          </div>

          <div className="max-w-4xl w-full space-y-8 md:space-y-12 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Armado de <span className="text-[#E02127]">PC</span></h2>
              <p className="text-lg text-slate-500">¿Cómo preferís armar tu equipo?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setView('WIZARD')}
                className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl hover:border-[#jE02127] hover:shadow-2xl hover:-translate-y-1 transition-all group text-left"
              >
                <Sparkles className="w-10 h-10 text-[#E02127] mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Asistente Interactivo</h3>
                <p className="text-slate-500 text-sm mb-4">Respondé unas preguntas y te recomendamos lo mejor.</p>
                <span className="text-[#E02127] font-bold text-sm flex items-center">COMENZAR <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></span>
              </button>

              <button
                onClick={() => router.push('/cotizar')}
                className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl hover:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all group text-left"
              >
                <Grid className="w-10 h-10 text-slate-800 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Catálogo Manual</h3>
                <p className="text-slate-500 text-sm mb-4">Elegí un modelo base y personalizalo a tu gusto.</p>
                <span className="text-slate-800 font-bold text-sm flex items-center">VER MODELOS <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Screen (Desktop) */}
      {view === 'WIZARD' && (
        <Wizard
          onComplete={handleWizardComplete}
          onCancel={() => {
            setView('SELECTION');
            setDesktopMode('SELECTING'); // Go back to sub-selection
          }}
        />
      )}
    </main>
  );
}
