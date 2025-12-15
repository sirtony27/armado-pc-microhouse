import { create } from 'zustand';
import { ModeloBase, Componente, TipoComponente, PasoCotizador } from '@/types';

interface CotizadorState {
  pasoActual: PasoCotizador;
  modeloSeleccionado: ModeloBase | null;
  componentesSeleccionados: Record<string, string | null>;
  setPaso: (paso: PasoCotizador) => void;
  setModeloBase: (modelo: ModeloBase) => void;
  cambiarComponente: (tipo: TipoComponente, componenteId: string) => void;
  calcularTotal: (componentes: Componente[]) => number;
  resetear: () => void;
}

export const useCotizadorStore = create<CotizadorState>((set, get) => ({
  pasoActual: 'modelo',
  modeloSeleccionado: null,
  componentesSeleccionados: {},

  setPaso: (paso: PasoCotizador) => {
    set({ pasoActual: paso });
  },

  setModeloBase: (modelo: ModeloBase) => {
    set({
      modeloSeleccionado: modelo,
      componentesSeleccionados: {
        procesador: modelo.componentes.procesador,
        placaMadre: modelo.componentes.placaMadre,
        ram: modelo.componentes.ram,
        almacenamiento: modelo.componentes.almacenamiento,
        gabinete: null,
        fuente: null,
        monitor: null,
        ...(modelo.componentes.gpu && { gpu: modelo.componentes.gpu }),
      },
      pasoActual: 'mejoras',
    });
  },

  cambiarComponente: (tipo: TipoComponente, componenteId: string) => {
    const tipoMap: Record<TipoComponente, string> = {
      'CPU': 'procesador',
      'PLACA_MADRE': 'placaMadre',
      'RAM': 'ram',
      'ALMACENAMIENTO': 'almacenamiento',
      'GPU': 'gpu',
      'FUENTE': 'fuente',
      'GABINETE': 'gabinete',
      'MONITOR': 'monitor',
      'NOTEBOOK': '', // Not used here
    };

    const tipoKey = tipoMap[tipo];
    set((state) => ({
      componentesSeleccionados: {
        ...state.componentesSeleccionados,
        [tipoKey]: componenteId,
      },
    }));
  },

  calcularTotal: (componentes: Componente[]) => {
    const { componentesSeleccionados } = get();
    const ids = Object.values(componentesSeleccionados).filter(Boolean) as string[];
    const total = componentes
      .filter((comp) => ids.includes(comp.id))
      .reduce((sum, comp) => sum + comp.precio, 0);
    return total;
  },

  resetear: () => {
    set({
      pasoActual: 'modelo',
      modeloSeleccionado: null,
      componentesSeleccionados: {},
    });
  },
}));
