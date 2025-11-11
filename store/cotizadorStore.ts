import { create } from 'zustand';
import { ModeloBase, Componente, TipoComponente } from '@/types';

interface CotizadorState {
  modeloSeleccionado: ModeloBase | null;
  componentesSeleccionados: Record<string, string>;
  setModeloBase: (modelo: ModeloBase) => void;
  cambiarComponente: (tipo: TipoComponente, componenteId: string) => void;
  calcularTotal: (componentes: Componente[]) => number;
  resetear: () => void;
}

export const useCotizadorStore = create<CotizadorState>((set, get) => ({
  modeloSeleccionado: null,
  componentesSeleccionados: {},

  setModeloBase: (modelo: ModeloBase) => {
    set({
      modeloSeleccionado: modelo,
      componentesSeleccionados: {
        procesador: modelo.componentes.procesador,
        placaMadre: modelo.componentes.placaMadre,
        ram: modelo.componentes.ram,
        almacenamiento: modelo.componentes.almacenamiento,
        gpu: modelo.componentes.gpu,
        fuente: modelo.componentes.fuente,
        gabinete: modelo.componentes.gabinete,
      },
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
    const ids = Object.values(componentesSeleccionados);
    const total = componentes
      .filter((comp) => ids.includes(comp.id))
      .reduce((sum, comp) => sum + comp.precio, 0);
    return total;
  },

  resetear: () => {
    set({
      modeloSeleccionado: null,
      componentesSeleccionados: {},
    });
  },
}));
