# Sistema de Cotización de PC - Diseño y Flujo

## 📋 Visión General

Sistema web para cotización de PCs personalizadas basado en modelos base predefinidos, permitiendo personalización de componentes con actualización de precio en tiempo real.

## 🎨 Diseño Visual (basado en boceto.png)

### Estructura de la Página

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER / NAVBAR                           │
│  [Logo MicroHouse]  [Inicio] [Modelos] [Contacto]          │
└─────────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────┐
│  │         SELECTOR DE MODELOS BASE                      │
│  │  [Básico] [Oficina] [Gamer] [Profesional]           │
│  └──────────────────────────────────────────────────────┘
│
│  ┌──────────────────┬─────────────────────────────────┐
│  │                  │                                   │
│  │  COMPONENTES     │   RESUMEN DE COTIZACIÓN          │
│  │  PERSONALIZABLES │                                   │
│  │                  │   Modelo: [Gamer]                │
│  │  □ Procesador    │   Total: $XXX,XXX                │
│  │  □ Placa Madre   │                                   │
│  │  □ RAM           │   [Descargar PDF]                │
│  │  □ Almacenamiento│   [Enviar WhatsApp]              │
│  │  □ GPU           │                                   │
│  │  □ Fuente        │                                   │
│  │  □ Gabinete      │                                   │
│  │                  │                                   │
│  └──────────────────┴─────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Usuario

### 1. Entrada al Sistema
```
Usuario ingresa → Ve página principal → Selecciona modelo base
```

### 2. Selección de Modelo Base
**Modelos disponibles:**
- **Básico** (Uso diario, navegación)
- **Oficina** (Trabajo, productividad)
- **Gamer** (Gaming 1080p/1440p)
- **Profesional** (Edición, renderizado)

**Cada modelo incluye:**
- Imagen representativa
- Especificaciones base
- Precio inicial
- Uso recomendado

### 3. Personalización de Componentes

```
Modelo Base Seleccionado
    ↓
Usuario ve componentes incluidos
    ↓
Puede cambiar cada componente:
    - Ver opciones disponibles
    - Comparar especificaciones
    - Ver diferencia de precio
    ↓
Precio total se actualiza automáticamente
```

**Componentes personalizables:**
1. **Procesador (CPU)**
   - Opciones: Intel i3/i5/i7/i9, AMD Ryzen 3/5/7/9
   - Muestra: Modelo, cores, threads, frecuencia, precio

2. **Placa Madre**
   - Opciones según socket del CPU
   - Muestra: Chipset, formato, conectividad, precio

3. **Memoria RAM**
   - Opciones: 8GB, 16GB, 32GB, 64GB
   - Muestra: Capacidad, velocidad, latencia, precio

4. **Almacenamiento**
   - Opciones: SSD, HDD, NVMe
   - Muestra: Tipo, capacidad, velocidad, precio

5. **Tarjeta Gráfica (GPU)**
   - Opciones: NVIDIA, AMD, Integrada
   - Muestra: Modelo, VRAM, rendimiento, precio

6. **Fuente de Poder**
   - Opciones según consumo total
   - Muestra: Potencia, certificación, modular/no, precio

7. **Gabinete**
   - Opciones: Formato, diseño
   - Muestra: Tamaño, ventilación, estética, precio

### 4. Visualización del Precio

**Panel de Resumen (fijo en pantalla):**
```
┌────────────────────────┐
│  RESUMEN COTIZACIÓN    │
├────────────────────────┤
│ Modelo: Gamer          │
│                        │
│ Componentes:           │
│ • CPU: $XXX            │
│ • GPU: $XXX            │
│ • RAM: $XXX            │
│ • etc...               │
│                        │
│ Subtotal: $XXX,XXX     │
│ IVA (21%): $XX,XXX     │
│ ─────────────────      │
│ TOTAL: $XXX,XXX        │
│                        │
│ [💾 Guardar]          │
│ [📄 PDF]              │
│ [📱 WhatsApp]         │
└────────────────────────┘
```

### 5. Finalización

**Opciones de acción:**

1. **Guardar cotización** (requiere registro/login)
   - Se guarda en base de datos
   - Usuario puede recuperarla después

2. **Descargar PDF**
   - Genera documento con:
     - Logo y datos de MicroHouse
     - Detalles completos de componentes
     - Precios desglosados
     - Fecha de cotización
     - Validez (7-15 días)

3. **Enviar por WhatsApp**
   - Mensaje preformateado con:
     - Link a la cotización
     - Resumen de componentes
     - Precio total
     - Contacto de MicroHouse

## 💾 Estructura de Datos

### Modelo Base
```typescript
interface ModeloBase {
  id: string;
  nombre: string; // "Básico", "Oficina", "Gamer", "Profesional"
  descripcion: string;
  usoRecomendado: string[];
  imagenUrl: string;
  componentesDefault: {
    procesadorId: string;
    placaMadreId: string;
    ramId: string;
    almacenamientoId: string;
    gpuId: string;
    fuenteId: string;
    gabineteId: string;
  };
  precioBase: number;
}
```

### Componente
```typescript
interface Componente {
  id: string;
  tipo: 'CPU' | 'GPU' | 'RAM' | 'ALMACENAMIENTO' | 'PLACA_MADRE' | 'FUENTE' | 'GABINETE';
  marca: string;
  modelo: string;
  especificaciones: Record<string, any>;
  precio: number;
  stock: boolean;
  imagenUrl: string;
  compatibilidad?: {
    sockets?: string[];
    formatos?: string[];
    potenciaMinima?: number;
  };
}
```

### Cotización
```typescript
interface Cotizacion {
  id: string;
  usuarioId?: string;
  fecha: Date;
  modeloBaseId: string;
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
  estado: 'borrador' | 'enviada' | 'convertida';
  validezHasta: Date;
}
```

## 🎯 Funcionalidades Clave

### 1. Actualización de Precio en Tiempo Real
- Calcular automáticamente cuando cambia un componente
- Validar compatibilidad entre componentes
- Sugerir actualizaciones necesarias (ej: fuente más potente)

### 2. Validación de Compatibilidad
- Socket CPU-Placa Madre
- Consumo total vs capacidad de fuente
- Formato de placa vs gabinete
- Velocidad RAM compatible con placa

### 3. Comparador de Componentes
- Ver hasta 3 opciones lado a lado
- Destacar diferencias clave
- Mostrar impacto en precio total

### 4. Sistema de Recomendaciones
- Sugerir upgrades relevantes
- Detectar cuellos de botella
- Mostrar alternativas similares más económicas

### 5. Persistencia de Cotizaciones
- Guardar sin registro (sessionStorage)
- Guardar con cuenta (base de datos)
- Compartir con link único

## 📱 Responsive Design

### Desktop (>1024px)
- Panel lateral de resumen fijo
- Grid de componentes 2-3 columnas
- Modales para comparar componentes

### Tablet (768px - 1024px)
- Resumen colapsable en parte superior
- Grid de componentes 2 columnas
- Sheets para selección de componentes

### Mobile (<768px)
- Resumen flotante (bottom sheet)
- Lista vertical de componentes
- Full-screen para selección

## 🎨 Paleta de Colores (Sugerida)

```css
:root {
  /* Primarios */
  --primary: #2563eb;     /* Azul principal */
  --secondary: #7c3aed;   /* Púrpura para acentos */
  
  /* Neutros */
  --bg-light: #f8fafc;
  --bg-dark: #0f172a;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  
  /* Estado */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  
  /* Componentes */
  --card-bg: #ffffff;
  --border: #e2e8f0;
  --hover: #f1f5f9;
}
```

## 🔐 Consideraciones de Seguridad

1. **Validación de precios server-side**
2. **Prevenir manipulación de precios en frontend**
3. **Rate limiting en generación de PDFs**
4. **Sanitización de inputs**
5. **CORS configurado correctamente**

## 📊 Métricas a Trackear

1. Modelo base más seleccionado
2. Componentes más personalizados
3. Rango de precios más común
4. Tasa de conversión (cotización → compra)
5. Componentes más populares por categoría
6. Tiempo promedio en configurador
7. Abandonos en qué paso

## 🚀 Fases de Desarrollo

### Fase 1: MVP (2-3 semanas)
- [ ] Diseño UI/UX completo
- [ ] 4 modelos base predefinidos
- [ ] Selector de componentes básico
- [ ] Cálculo de precio en tiempo real
- [ ] Resumen de cotización
- [ ] Exportar a PDF

### Fase 2: Mejoras (2 semanas)
- [ ] Sistema de usuarios
- [ ] Guardar cotizaciones
- [ ] Compartir por WhatsApp
- [ ] Validación de compatibilidad
- [ ] Sistema de recomendaciones

### Fase 3: Avanzado (2-3 semanas)
- [ ] Comparador de componentes
- [ ] Filtros avanzados
- [ ] Stock en tiempo real
- [ ] Panel de administración
- [ ] Analytics y métricas

### Fase 4: Optimización (1-2 semanas)
- [ ] Optimización de rendimiento
- [ ] SEO
- [ ] Testing completo
- [ ] Documentación

## 🛠️ Stack Tecnológico Propuesto

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Estilos**: Tailwind CSS
- **UI Components**: shadcn/ui o Radix UI
- **Estado**: Zustand o Context API
- **Formularios**: React Hook Form + Zod
- **PDF**: react-pdf o jsPDF

### Backend
- **API**: Next.js API Routes
- **Base de Datos**: Supabase (ya integrado)
- **ORM**: Prisma (opcional)
- **Auth**: NextAuth.js o Supabase Auth

### Servicios
- **Hosting**: Vercel
- **Storage**: Supabase Storage (imágenes)
- **Email**: Resend o SendGrid
- **Analytics**: Vercel Analytics

## 📝 Próximos Pasos

1. **Definir catálogo de componentes inicial**
   - Listar 5-10 opciones por categoría
   - Obtener precios actuales del mercado
   - Conseguir imágenes de productos

2. **Configurar base de datos**
   - Crear esquema en Supabase
   - Migrar datos de componentes
   - Configurar relaciones

3. **Desarrollar componentes React**
   - CardModeloBase
   - SelectorComponente
   - ResumenCotizacion
   - ComparadorComponentes

4. **Implementar lógica de negocio**
   - Cálculo de precios
   - Validación de compatibilidad
   - Generación de PDFs

5. **Testing y refinamiento**
   - Pruebas de usuario
   - Ajustes de UX
   - Optimización de performance

---

**Fecha**: 11 de Noviembre, 2025
**Versión**: 1.0
**Estado**: Diseño Inicial
