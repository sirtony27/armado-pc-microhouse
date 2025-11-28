'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AttractScreen from '@/components/kiosk/AttractScreen';
import Wizard from '@/components/kiosk/Wizard';
import { Sparkles, Grid, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'ATTRACT' | 'SELECTION' | 'WIZARD'>('ATTRACT');

  const handleStart = () => {
    setView('SELECTION');
  };

  const handleModeSelect = (mode: 'WIZARD' | 'CATALOG') => {
    if (mode === 'WIZARD') {
      setView('WIZARD');
    } else {
      router.push('/cotizar');
    }
  };

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

      {/* Mode Selection Screen */}
      {view === 'SELECTION' && (
        <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in duration-500 overflow-y-auto">
          <div className="max-w-4xl w-full space-y-8 md:space-y-12 text-center py-8">

            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                ¿CÓMO QUERÉS <span className="text-[#E02127]">EMPEZAR?</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium px-4">
                Elegí la opción que mejor se adapte a vos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* Option 1: Wizard */}
              <button
                onClick={() => handleModeSelect('WIZARD')}
                className="group relative bg-white p-6 md:p-8 rounded-3xl border-2 border-slate-100 shadow-xl hover:shadow-2xl hover:border-[#E02127] hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden w-full"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-24 h-24 md:w-32 md:h-32 text-[#E02127]" />
                </div>

                <div className="relative z-10 space-y-4 md:space-y-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-[#E02127] transition-colors duration-300">
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-[#E02127] group-hover:text-white transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Ayudame a elegir</h3>
                    <p className="text-sm md:text-base text-slate-500 leading-relaxed">
                      Respondé unas preguntas simples y te recomendamos la PC ideal para vos.
                    </p>
                  </div>

                  <div className="flex items-center text-[#E02127] font-bold text-sm md:text-base group-hover:translate-x-2 transition-transform">
                    COMENZAR ASISTENTE <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
              </button>

              {/* Option 2: Catalog */}
              <button
                onClick={() => handleModeSelect('CATALOG')}
                className="group relative bg-white p-6 md:p-8 rounded-3xl border-2 border-slate-100 shadow-xl hover:shadow-2xl hover:border-blue-600 hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden w-full"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Grid className="w-24 h-24 md:w-32 md:h-32 text-blue-600" />
                </div>

                <div className="relative z-10 space-y-4 md:space-y-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                    <Grid className="w-6 h-6 md:w-8 md:h-8 text-blue-600 group-hover:text-white transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Ver Catálogo</h3>
                    <p className="text-sm md:text-base text-slate-500 leading-relaxed">
                      Explorá todos nuestros modelos y personalizalos a tu gusto. Ideal si ya sabés lo que buscás.
                    </p>
                  </div>

                  <div className="flex items-center text-blue-600 font-bold text-sm md:text-base group-hover:translate-x-2 transition-transform">
                    IR AL CATÁLOGO <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Wizard Screen */}
      {view === 'WIZARD' && (
        <Wizard
          onComplete={handleWizardComplete}
          onCancel={() => setView('SELECTION')}
        />
      )}
    </main>
  );
}
