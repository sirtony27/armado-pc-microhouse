import { ModeloBase } from '@/types';

export const modelosBase: ModeloBase[] = [
  {
    id: 'modelo-basico',
    nombre: 'PC Básico',
    slug: 'basico',
    descripcion: 'Ideal para navegación web, ofimática y multimedia básico',
    usoRecomendado: ['Navegación', 'Office', 'Multimedia'],
    imagenUrl: '/images/modelo-basico.jpg',
    precioBase: 350000, // Sin fuente ni gabinete
    componentes: {
      procesador: 'cpu-1', // Intel i3-12100F
      placaMadre: 'mb-2', // MSI B660M
      ram: 'ram-1', // 8GB DDR4
      almacenamiento: 'storage-1', // SSD 240GB
    },
  },
  {
    id: 'modelo-oficina',
    nombre: 'PC Oficina',
    slug: 'oficina',
    descripcion: 'Perfecto para trabajo profesional, multitarea y videoconferencias',
    usoRecomendado: ['Trabajo', 'Multitarea', 'Videoconferencia'],
    imagenUrl: '/images/modelo-oficina.jpg',
    precioBase: 520000, // Sin fuente ni gabinete
    componentes: {
      procesador: 'cpu-2', // Ryzen 5 5600
      placaMadre: 'mb-1', // Gigabyte B550M
      ram: 'ram-2', // 16GB DDR4
      almacenamiento: 'storage-2', // NVMe 500GB
    },
  },
  {
    id: 'modelo-gamer',
    nombre: 'PC Gamer',
    slug: 'gamer',
    descripcion: 'Configuración óptima para gaming en 1080p y 1440p con altos FPS',
    usoRecomendado: ['Gaming', 'Streaming', 'Creación de Contenido'],
    imagenUrl: '/images/modelo-gamer.jpg',
    precioBase: 1050000, // Sin fuente ni gabinete
    componentes: {
      procesador: 'cpu-2', // Ryzen 5 5600
      placaMadre: 'mb-1', // Gigabyte B550M
      ram: 'ram-2', // 16GB DDR4
      almacenamiento: 'storage-2', // NVMe 500GB
      gpu: 'gpu-3', // RTX 4060 (incluida en gamer)
    },
  },
  {
    id: 'modelo-profesional',
    nombre: 'PC Profesional',
    slug: 'profesional',
    descripcion: 'Para edición de video, renderizado 3D y tareas profesionales exigentes',
    usoRecomendado: ['Edición de Video', 'Renderizado', 'Diseño 3D', 'CAD'],
    imagenUrl: '/images/modelo-profesional.jpg',
    precioBase: 1600000, // Sin fuente ni gabinete
    componentes: {
      procesador: 'cpu-4', // Intel i7-12700F
      placaMadre: 'mb-2', // MSI B660M
      ram: 'ram-3', // 32GB DDR4
      almacenamiento: 'storage-3', // Samsung 980 PRO 1TB
      gpu: 'gpu-4', // RX 7700 XT (incluida en profesional)
    },
  },
];
