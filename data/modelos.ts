import { ModeloBase } from '@/types';

export const modelosBase: ModeloBase[] = [
  {
    id: 'modelo-basico',
    nombre: 'PC Básico',
    slug: 'basico',
    descripcion: 'Ideal para navegación web, ofimática y multimedia básico',
    usoRecomendado: ['Navegación', 'Office', 'Multimedia'],
    imagenUrl: '/images/modelo-basico.jpg',
    precioBase: 450000,
    componentes: {
      procesador: 'cpu-1', // Intel i3-12100F
      placaMadre: 'mb-2', // MSI B660M
      ram: 'ram-1', // 8GB DDR4
      almacenamiento: 'storage-1', // SSD 240GB
      gpu: 'gpu-1', // Integrada
      fuente: 'psu-1', // 500W
      gabinete: 'case-1', // Sentey básico
    },
  },
  {
    id: 'modelo-oficina',
    nombre: 'PC Oficina',
    slug: 'oficina',
    descripcion: 'Perfecto para trabajo profesional, multitarea y videoconferencias',
    usoRecomendado: ['Trabajo', 'Multitarea', 'Videoconferencia'],
    imagenUrl: '/images/modelo-oficina.jpg',
    precioBase: 650000,
    componentes: {
      procesador: 'cpu-2', // Ryzen 5 5600
      placaMadre: 'mb-1', // Gigabyte B550M
      ram: 'ram-2', // 16GB DDR4
      almacenamiento: 'storage-2', // NVMe 500GB
      gpu: 'gpu-1', // Integrada
      fuente: 'psu-1', // 500W
      gabinete: 'case-2', // Cooler Master
    },
  },
  {
    id: 'modelo-gamer',
    nombre: 'PC Gamer',
    slug: 'gamer',
    descripcion: 'Configuración óptima para gaming en 1080p y 1440p con altos FPS',
    usoRecomendado: ['Gaming', 'Streaming', 'Creación de Contenido'],
    imagenUrl: '/images/modelo-gamer.jpg',
    precioBase: 1250000,
    componentes: {
      procesador: 'cpu-2', // Ryzen 5 5600
      placaMadre: 'mb-1', // Gigabyte B550M
      ram: 'ram-2', // 16GB DDR4
      almacenamiento: 'storage-2', // NVMe 500GB
      gpu: 'gpu-3', // RTX 4060
      fuente: 'psu-2', // 650W Bronze
      gabinete: 'case-2', // Cooler Master
    },
  },
  {
    id: 'modelo-profesional',
    nombre: 'PC Profesional',
    slug: 'profesional',
    descripcion: 'Para edición de video, renderizado 3D y tareas profesionales exigentes',
    usoRecomendado: ['Edición de Video', 'Renderizado', 'Diseño 3D', 'CAD'],
    imagenUrl: '/images/modelo-profesional.jpg',
    precioBase: 1850000,
    componentes: {
      procesador: 'cpu-4', // Intel i7-12700F
      placaMadre: 'mb-2', // MSI B660M
      ram: 'ram-3', // 32GB DDR4
      almacenamiento: 'storage-3', // Samsung 980 PRO 1TB
      gpu: 'gpu-4', // RX 7700 XT
      fuente: 'psu-3', // 750W Gold
      gabinete: 'case-3', // NZXT H510
    },
  },
];
