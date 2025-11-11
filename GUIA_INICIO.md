# 🚀 Guía de Inicio - Sistema de Cotización MicroHouse

## ✅ Estado del Proyecto

**El proyecto está funcionando!** 🎉

- ✅ Servidor corriendo en: http://localhost:3000
- ✅ Página de cotización: http://localhost:3000/cotizar
- ✅ Componentes funcionando correctamente

## 📁 Estructura del Proyecto

```
armado-pc-microhouse/
├── app/
│   ├── cotizar/
│   │   └── page.tsx          # Página principal del cotizador
│   ├── layout.tsx             # Layout global con Navbar
│   └── page.tsx               # Página de inicio (landing)
├── components/
│   ├── cotizador/
│   │   ├── ModeloCard.tsx          # Tarjetas de modelos base
│   │   ├── ComponenteSelector.tsx  # Selector de componentes
│   │   └── ResumenCotizacion.tsx   # Panel de resumen
│   ├── ui/
│   │   ├── Button.tsx         # Componente botón
│   │   └── Card.tsx           # Componente tarjeta
│   └── Navbar.tsx             # Barra de navegación
├── data/
│   ├── componentes.ts         # Catálogo de componentes
│   └── modelos.ts             # Modelos base predefinidos
├── store/
│   └── cotizadorStore.ts      # Estado global (Zustand)
├── types/
│   └── index.ts               # Tipos TypeScript
├── lib/
│   └── utils.ts               # Utilidades (formateo, etc)
├── DESIGN.md                  # Documento de diseño completo
└── DATABASE_SCHEMA.md         # Esquema de base de datos
```

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1 - MVP (Completado)

- [x] Diseño UI/UX moderno con Tailwind CSS
- [x] 4 modelos base predefinidos (Básico, Oficina, Gamer, Profesional)
- [x] Selector de componentes por categoría
- [x] Cálculo de precio en tiempo real
- [x] Resumen de cotización con desglose
- [x] Navegación entre pasos (Modelo → Personalizar)
- [x] Compatibilidad básica (socket CPU-Placa Madre)
- [x] Responsive design

### 🔨 En Desarrollo

- [ ] Exportar a PDF
- [ ] Funcionalidad completa de WhatsApp
- [ ] Guardar cotizaciones en base de datos
- [ ] Sistema de usuarios
- [ ] Panel de administración

## 🎨 Cómo Usar la Aplicación

### 1. Página Principal (Landing)
- Muestra información de MicroHouse
- Botón para iniciar cotización
- Features y beneficios

### 2. Cotizador - Paso 1: Seleccionar Modelo Base
1. Navegá a http://localhost:3000/cotizar
2. Elegí uno de los 4 modelos disponibles:
   - **PC Básico**: $450,000 (Navegación, Office)
   - **PC Oficina**: $650,000 (Trabajo, Multitarea)
   - **PC Gamer**: $1,250,000 (Gaming 1080p/1440p)
   - **PC Profesional**: $1,850,000 (Edición, Renderizado)

### 3. Cotizador - Paso 2: Personalizar Componentes
- Click en cada categoría para expandir opciones
- Seleccioná el componente que prefieras
- El precio se actualiza automáticamente
- El panel derecho muestra el resumen en tiempo real

### 4. Acciones Disponibles
- **Guardar Cotización**: (En desarrollo)
- **Descargar PDF**: (En desarrollo)
- **Enviar por WhatsApp**: Abre WhatsApp con mensaje pre-formateado

## 💾 Datos Mock Incluidos

### Procesadores (CPUs)
- Intel Core i3-12100F - $95,000
- AMD Ryzen 5 5600 - $125,000
- AMD Ryzen 7 5700X - $185,000
- Intel Core i7-12700F - $285,000

### Tarjetas Gráficas (GPUs)
- Integrada - Gratis
- NVIDIA GTX 1650 4GB - $185,000
- NVIDIA RTX 4060 8GB - $385,000
- AMD RX 7700 XT 12GB - $485,000

### Memoria RAM
- 8GB DDR4 3200MHz - $28,000
- 16GB DDR4 3600MHz - $52,000
- 32GB DDR4 3600MHz - $98,000

### Almacenamiento
- SSD 240GB - $25,000
- NVMe 500GB - $45,000
- Samsung 980 PRO 1TB - $95,000

### Y más... (Placas madre, Fuentes, Gabinetes)

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor en http://localhost:3000

# Producción
npm run build        # Compila el proyecto
npm start            # Inicia servidor de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## 🔧 Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Estado**: Zustand
- **Iconos**: Lucide React
- **PDF**: jsPDF (integrado, pendiente implementar)
- **Base de Datos**: Supabase (configurado, pendiente conectar)

## 📋 Próximos Pasos Sugeridos

### Corto Plazo (1-2 días)
1. **Implementar generación de PDF**
   - Usar jsPDF para crear documento
   - Incluir logo, componentes, precios
   - Botón de descarga funcional

2. **Mejorar validación de compatibilidad**
   - Verificar consumo vs fuente de poder
   - Sugerir upgrade automático de fuente
   - Alertas de incompatibilidad

3. **Agregar más componentes**
   - Ampliar catálogo de productos
   - Agregar imágenes reales
   - Más opciones por categoría

### Mediano Plazo (1 semana)
4. **Conectar Supabase**
   - Implementar esquema de base de datos
   - Poblar con datos reales
   - CRUD de componentes

5. **Sistema de usuarios**
   - Autenticación con Supabase Auth
   - Guardar cotizaciones
   - Historial de cotizaciones

6. **Panel de administración**
   - Gestión de componentes
   - Actualización de precios
   - Ver estadísticas

### Largo Plazo (2-3 semanas)
7. **Funcionalidades avanzadas**
   - Comparador de componentes
   - Sistema de recomendaciones
   - Stock en tiempo real
   - Notificaciones de cambio de precio

8. **Optimizaciones**
   - SEO
   - Performance
   - Testing (Jest, Cypress)
   - Documentación API

## 🐛 Problemas Conocidos

- ⚠️ Advertencia de NODE_ENV no estándar (no afecta funcionalidad)
- 📸 Las imágenes de productos son placeholders
- 💾 Funciones de guardar/PDF/WhatsApp completo pendientes

## 📞 Contacto y Soporte

Para consultas sobre el desarrollo:
- Ver documentación en `DESIGN.md`
- Ver esquema de DB en `DATABASE_SCHEMA.md`

---

**Fecha de creación**: 11 de Noviembre, 2025
**Versión**: 1.0 MVP
**Estado**: ✅ Funcional
