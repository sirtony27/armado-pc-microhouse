# 🖥️ Sistema de Cotización MicroHouse

Bienvenido al repositorio del Sistema de Cotización de PCs de MicroHouse. Este proyecto es una aplicación web moderna construida con **Next.js 14**, diseñada para ofrecer una experiencia de usuario premium en la personalización y cotización de computadoras.

## 🚀 Características Principales

### 🛒 Modo Kiosk & Cotizador Web
- **Wizard Interactivo**: Un flujo paso a paso (Modelo → Mejoras → Gabinete/Fuente → Resumen) que guía al usuario.
- **Selección Inteligente**: Algoritmos que sugieren fuentes de poder basadas en el consumo y GPUs acordes al presupuesto.
- **Animaciones Premium**: Interfaz fluida con transiciones, efectos de hover y feedback visual constante.
- **Carrusel Coverflow**: Visualización 3D de modelos base para una selección atractiva.

### 🔧 Panel de Administración
- **Gestión de Productos**: ABM completo de componentes con precios, stock y especificaciones.
- **Actualización de Precios**: Herramientas para modificar precios rápidamente.
- **Seguridad**: Autenticación protegida para el acceso al panel.

### 📄 Funcionalidades Extra
- **Generación de PDF**: Descarga de presupuestos profesionales en formato A5.
- **Integración con WhatsApp**: Envío directo de cotizaciones pre-formateadas.
- **Diseño Responsive**: Optimizado para móviles, tablets y escritorio.

## 🛠️ Stack Tecnológico

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://react.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Iconos)
- **Estado**: [Zustand](https://github.com/pmndrs/zustand)
- **Base de Datos / Storage**: [Supabase](https://supabase.com/)
- **Despliegue**: [Vercel](https://vercel.com/)

## 📂 Estructura del Proyecto

```bash
armado-pc-microhouse/
├── app/
│   ├── admin/            # Panel de administración
│   ├── cotizar/          # Lógica del cotizador (Wizard)
│   └── page.tsx          # Landing page
├── components/
│   ├── admin/            # Componentes del panel admin
│   ├── cotizador/        # Componentes del wizard (Selectores, Resumen)
│   └── kiosk/            # Componentes específicos del modo Kiosk
├── data/                 # Datos estáticos y definiciones
├── docs/                 # Documentación técnica detallada
├── lib/                  # Utilidades y hooks
├── store/                # Estado global (Zustand)
└── types/                # Definiciones de TypeScript
```

## 📖 Documentación Técnica

Para detalles profundos sobre la arquitectura y diseño, consulta la carpeta `docs/`:

- [**Esquema de Base de Datos**](docs/DATABASE_SCHEMA.md): Tablas, relaciones y políticas RLS.
- [**Diseño del Sistema**](docs/DESIGN.md): Flujos de usuario, wireframes y decisiones de arquitectura.

## ⚡ Guía de Inicio Rápido

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repo>
    cd armado-pc-microhouse
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env.local` con las credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
    ```

4.  **Correr el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔧 Personalización

### Modificar Precios y Productos
- **Vía Admin**: Accede a `/admin` para gestionar el catálogo visualmente.
- **Vía Código**: Los modelos base se definen en `data/modelos.ts` y la lógica de precios externos en `lib/pricing.ts`.

### Ajustar UI
- **Estilos Globales**: `app/globals.css`
- **Animaciones**: `app/cotizar/animations.css`
- **Configuración Tailwind**: `tailwind.config.ts`

## 📦 Despliegue

Este proyecto está optimizado para **Vercel**.
1.  Conecta tu repositorio de GitHub a Vercel.
2.  Configura las variables de entorno en el dashboard de Vercel.
3.  ¡Deploy automático con cada push a `main`!

---
**MicroHouse** - Sistema de Cotización Inteligente
