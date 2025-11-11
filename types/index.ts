export type TipoComponente = 
  | 'CPU' 
  | 'GPU' 
  | 'RAM' 
  | 'ALMACENAMIENTO' 
  | 'PLACA_MADRE' 
  | 'FUENTE' 
  | 'GABINETE';

export interface Componente {
  id: string;
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
}

export interface ModeloBase {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  usoRecomendado: string[];
  imagenUrl: string;
  precioBase: number;
  componentes: {
    procesador: string;
    placaMadre: string;
    ram: string;
    almacenamiento: string;
    gpu: string;
    fuente: string;
    gabinete: string;
  };
}

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
