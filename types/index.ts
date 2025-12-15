export type TipoComponente =
  | 'CPU'
  | 'GPU'
  | 'RAM'
  | 'ALMACENAMIENTO'
  | 'PLACA_MADRE'
  | 'FUENTE'
  | 'GABINETE'
  | 'MONITOR'
  | 'NOTEBOOK';

export interface Componente {
  id: string;
  sku?: string;
  tipo: TipoComponente;
  marca: string;
  modelo: string;
  descripcion: string;
  precio: number;
  precioAnterior?: number;
  descuentoPorcentaje?: number;
  stock: number;
  disponible: boolean;
  imagenUrl: string;
  especificaciones: Record<string, any>;
  compatibilidad?: {
    sockets?: string[];
    formatos?: string[];
    potenciaMinima?: number;
    consumoWatts?: number;
  };
  ultima_actualizacion?: string;
}

export interface ModeloBase {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  usoRecomendado: string[];
  imagenUrl: string;
  precioBase: number;
  numeroComprobante?: string; // Campo opcional para referencia externa / comprobante
  componentes: {
    procesador: string;
    placaMadre: string;
    ram: string;
    almacenamiento: string;
    gpu?: string; // GPU es opcional en el modelo base
    gabinete?: string;
    fuente?: string;
  };
}

export type PasoCotizador = 'modelo' | 'mejoras' | 'gabinete' | 'fuente' | 'monitor' | 'resumen';

export interface Cotizacion {
  id: string;
  modeloBaseId: string;
  nombrePersonalizado?: string;
  componentesSeleccionados: {
    procesador: string;
    placaMadre: string;
    ram: string;
    almacenamiento: string;
    gpu: string;
    fuente: string;
    gabinete: string;
  };
  precioTotal: number;
  fecha: Date;
}

export interface ComponenteConPrecio extends Componente {
  esDefault: boolean;
}

export interface ItemPresupuesto {
  id: string; // Unique ID for the item in the list
  tipo: 'PC_ARMADA' | 'NOTEBOOK' | 'COMPONENTE';
  producto: Componente | any; // Componente for Notebook/Componente, or custom object for PC
  cantidad: number;
  precioUnitario: number;
  detalles?: {
    specs?: string; // Summary of specs for display
    modeloNombre?: string; // For PCs
  };
}
