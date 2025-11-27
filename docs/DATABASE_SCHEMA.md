# Esquema de Base de Datos - Sistema de Cotización PC

## 📊 Diagrama de Relaciones

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ modelos_base │       │ componentes  │       │ cotizaciones │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ nombre       │       │ tipo         │       │ usuario_id   │
│ descripcion  │──┐    │ marca        │   ┌──│ modelo_id    │
│ precio_base  │  │    │ modelo       │   │  │ fecha        │
│ imagen_url   │  │    │ precio       │   │  │ precio_total │
│ activo       │  │    │ stock        │   │  │ estado       │
│ created_at   │  │    │ specs (JSON) │   │  │ validez      │
└──────────────┘  │    │ created_at   │   │  │ created_at   │
                  │    └──────────────┘   │  └──────────────┘
                  │                       │         │
                  │    ┌──────────────┐   │         │
                  └───→│config_modelo │   │         │
                       ├──────────────┤   │         │
                       │ modelo_id    │───┘         │
                       │ procesador_id│             │
                       │ placa_id     │             │
                       │ ram_id       │             │
                       │ storage_id   │             │
                       │ gpu_id       │             │
                       │ fuente_id    │             │
                       │ gabinete_id  │             │
                       └──────────────┘             │
                                                    │
                       ┌──────────────┐             │
                       │cotizacion_det│←────────────┘
                       ├──────────────┤
                       │ cotizacion_id│
                       │ componente_id│
                       │ tipo         │
                       │ precio       │
                       └──────────────┘
```

## 📋 Tablas Detalladas

### 1. modelos_base
Modelos predefinidos de PC (Básico, Oficina, Gamer, Profesional)

```sql
CREATE TABLE modelos_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  uso_recomendado TEXT[],
  imagen_url VARCHAR(500),
  precio_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_modelos_slug ON modelos_base(slug);
CREATE INDEX idx_modelos_activo ON modelos_base(activo);
```

**Ejemplo de datos:**
```json
{
  "id": "uuid-1234",
  "nombre": "PC Gamer",
  "slug": "pc-gamer",
  "descripcion": "Configuración óptima para gaming en 1080p y 1440p",
  "uso_recomendado": ["gaming", "streaming", "edicion-basica"],
  "imagen_url": "/images/modelos/gamer.jpg",
  "precio_base": 850000,
  "orden": 3,
  "activo": true
}
```

### 2. componentes
Catálogo de todos los componentes disponibles

```sql
CREATE TYPE tipo_componente AS ENUM (
  'CPU', 'GPU', 'RAM', 'ALMACENAMIENTO', 
  'PLACA_MADRE', 'FUENTE', 'GABINETE', 'COOLER'
);

CREATE TABLE componentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo tipo_componente NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  precio_anterior DECIMAL(10,2),
  descuento_porcentaje INT DEFAULT 0,
  stock INT DEFAULT 0,
  disponible BOOLEAN DEFAULT true,
  imagen_url VARCHAR(500),
  imagenes_adicionales TEXT[],
  especificaciones JSONB NOT NULL,
  compatibilidad JSONB,
  destacado BOOLEAN DEFAULT false,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_componentes_tipo ON componentes(tipo);
CREATE INDEX idx_componentes_marca ON componentes(marca);
CREATE INDEX idx_componentes_disponible ON componentes(disponible);
CREATE INDEX idx_componentes_specs ON componentes USING GIN (especificaciones);
```

**Ejemplo CPU:**
```json
{
  "id": "uuid-cpu-1",
  "tipo": "CPU",
  "marca": "AMD",
  "modelo": "Ryzen 5 5600",
  "precio": 125000,
  "stock": 15,
  "imagen_url": "/images/cpu/ryzen-5-5600.jpg",
  "especificaciones": {
    "cores": 6,
    "threads": 12,
    "frecuencia_base": "3.5 GHz",
    "frecuencia_turbo": "4.4 GHz",
    "tdp": "65W",
    "socket": "AM4",
    "cache": "32MB L3"
  },
  "compatibilidad": {
    "sockets": ["AM4"],
    "memoria_max": "128GB",
    "pcie_lanes": 24
  }
}
```

**Ejemplo GPU:**
```json
{
  "id": "uuid-gpu-1",
  "tipo": "GPU",
  "marca": "NVIDIA",
  "modelo": "RTX 4060 8GB",
  "precio": 385000,
  "especificaciones": {
    "vram": "8GB GDDR6",
    "bus": "128-bit",
    "cuda_cores": 3072,
    "boost_clock": "2460 MHz",
    "tdp": "115W",
    "conectores": ["HDMI 2.1", "DisplayPort 1.4a"],
    "pcie": "4.0 x8"
  },
  "compatibilidad": {
    "fuente_minima": 450,
    "conectores_requeridos": ["1x 8-pin"]
  }
}
```

### 3. configuracion_modelo
Configuración por defecto de cada modelo base

```sql
CREATE TABLE configuracion_modelo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modelo_id UUID REFERENCES modelos_base(id) ON DELETE CASCADE,
  procesador_id UUID REFERENCES componentes(id),
  placa_madre_id UUID REFERENCES componentes(id),
  ram_id UUID REFERENCES componentes(id),
  almacenamiento_id UUID REFERENCES componentes(id),
  gpu_id UUID REFERENCES componentes(id),
  fuente_id UUID REFERENCES componentes(id),
  gabinete_id UUID REFERENCES componentes(id),
  cooler_id UUID REFERENCES componentes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(modelo_id)
);

-- Índices
CREATE INDEX idx_config_modelo ON configuracion_modelo(modelo_id);
```

### 4. usuarios (opcional, para guardar cotizaciones)
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(200),
  telefono VARCHAR(50),
  auth_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_auth ON usuarios(auth_id);
```

### 5. cotizaciones
Cotizaciones generadas por usuarios

```sql
CREATE TYPE estado_cotizacion AS ENUM (
  'borrador', 'guardada', 'enviada', 'convertida', 'expirada'
);

CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) UNIQUE NOT NULL, -- Código corto para compartir
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  modelo_base_id UUID REFERENCES modelos_base(id),
  nombre_personalizado VARCHAR(200),
  precio_total DECIMAL(10,2) NOT NULL,
  estado estado_cotizacion DEFAULT 'borrador',
  validez_hasta DATE,
  notas TEXT,
  metadata JSONB, -- Info adicional (IP, navegador, etc)
  compartida BOOLEAN DEFAULT false,
  vista_contador INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cotizaciones_usuario ON cotizaciones(usuario_id);
CREATE INDEX idx_cotizaciones_codigo ON cotizaciones(codigo);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_fecha ON cotizaciones(created_at DESC);
```

### 6. cotizacion_detalle
Componentes específicos de cada cotización

```sql
CREATE TABLE cotizacion_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  componente_id UUID REFERENCES componentes(id),
  tipo tipo_componente NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(200) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  cantidad INT DEFAULT 1,
  precio_total DECIMAL(10,2) NOT NULL,
  especificaciones_snapshot JSONB, -- Copia de specs al momento de cotizar
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_detalle_cotizacion ON cotizacion_detalle(cotizacion_id);
CREATE INDEX idx_detalle_componente ON cotizacion_detalle(componente_id);
```

### 7. precios_historico (opcional, para tracking)
```sql
CREATE TABLE precios_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  componente_id UUID REFERENCES componentes(id) ON DELETE CASCADE,
  precio DECIMAL(10,2) NOT NULL,
  stock INT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_historico_componente ON precios_historico(componente_id, fecha);
```

## 🔧 Funciones Útiles

### Calcular precio total de una cotización
```sql
CREATE OR REPLACE FUNCTION calcular_precio_cotizacion(cotizacion_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
  SELECT COALESCE(SUM(precio_total), 0)
  FROM cotizacion_detalle
  WHERE cotizacion_id = cotizacion_uuid;
$$ LANGUAGE sql;
```

### Generar código único para cotización
```sql
CREATE OR REPLACE FUNCTION generar_codigo_cotizacion()
RETURNS VARCHAR(20) AS $$
DECLARE
  codigo VARCHAR(20);
  existe BOOLEAN;
BEGIN
  LOOP
    codigo := 'COT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM cotizaciones WHERE codigo = codigo) INTO existe;
    EXIT WHEN NOT existe;
  END LOOP;
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;
```

### Verificar compatibilidad de componentes
```sql
CREATE OR REPLACE FUNCTION verificar_compatibilidad(
  cpu_id UUID,
  placa_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  cpu_socket VARCHAR;
  placa_socket VARCHAR;
BEGIN
  SELECT especificaciones->>'socket' INTO cpu_socket
  FROM componentes WHERE id = cpu_id;
  
  SELECT especificaciones->>'socket' INTO placa_socket
  FROM componentes WHERE id = placa_id;
  
  RETURN cpu_socket = placa_socket;
END;
$$ LANGUAGE plpgsql;
```

## 🌱 Seeds Iniciales

### Modelos Base
```sql
INSERT INTO modelos_base (nombre, slug, descripcion, uso_recomendado, precio_base, orden) VALUES
  ('PC Básico', 'basico', 'Ideal para tareas diarias, navegación y ofimática básica', 
   ARRAY['navegacion', 'office', 'multimedia'], 450000, 1),
  
  ('PC Oficina', 'oficina', 'Perfecto para trabajo profesional y multitarea', 
   ARRAY['office', 'trabajo', 'videoconferencia'], 650000, 2),
  
  ('PC Gamer', 'gamer', 'Configuración gaming 1080p/1440p con alto rendimiento', 
   ARRAY['gaming', 'streaming', 'creacion'], 1250000, 3),
  
  ('PC Profesional', 'profesional', 'Para edición de video, renderizado y tareas pesadas', 
   ARRAY['edicion', 'renderizado', 'diseño', 'modelado-3d'], 1850000, 4);
```

## 🔐 Row Level Security (RLS) - Supabase

```sql
-- Habilitar RLS
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_detalle ENABLE ROW LEVEL SECURITY;

-- Políticas para cotizaciones
CREATE POLICY "Usuarios pueden ver sus propias cotizaciones"
  ON cotizaciones FOR SELECT
  USING (auth.uid() = usuario_id OR usuario_id IS NULL);

CREATE POLICY "Usuarios pueden crear cotizaciones"
  ON cotizaciones FOR INSERT
  WITH CHECK (auth.uid() = usuario_id OR usuario_id IS NULL);

CREATE POLICY "Usuarios pueden actualizar sus cotizaciones"
  ON cotizaciones FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Políticas para detalles
CREATE POLICY "Usuarios pueden ver detalles de sus cotizaciones"
  ON cotizacion_detalle FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cotizaciones 
      WHERE id = cotizacion_id 
      AND (auth.uid() = usuario_id OR usuario_id IS NULL)
    )
  );

-- Todos pueden ver componentes y modelos (sin autenticación)
ALTER TABLE componentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Componentes públicos" ON componentes FOR SELECT USING (disponible = true);

ALTER TABLE modelos_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modelos públicos" ON modelos_base FOR SELECT USING (activo = true);
```

## 📊 Vistas Útiles

### Vista de cotizaciones completas
```sql
CREATE VIEW vista_cotizaciones_completas AS
SELECT 
  c.id,
  c.codigo,
  c.nombre_personalizado,
  c.precio_total,
  c.estado,
  c.created_at,
  mb.nombre as modelo_base,
  u.email as usuario_email,
  u.nombre as usuario_nombre,
  json_agg(
    json_build_object(
      'tipo', cd.tipo,
      'marca', cd.marca,
      'modelo', cd.modelo,
      'precio', cd.precio_total
    )
  ) as componentes
FROM cotizaciones c
LEFT JOIN modelos_base mb ON c.modelo_base_id = mb.id
LEFT JOIN usuarios u ON c.usuario_id = u.id
LEFT JOIN cotizacion_detalle cd ON c.id = cd.cotizacion_id
GROUP BY c.id, mb.nombre, u.email, u.nombre;
```

### Vista de componentes más usados
```sql
CREATE VIEW componentes_populares AS
SELECT 
  c.tipo,
  c.marca,
  c.modelo,
  c.precio,
  COUNT(cd.id) as veces_usado,
  SUM(cd.precio_total) as valor_total_vendido
FROM componentes c
LEFT JOIN cotizacion_detalle cd ON c.id = cd.componente_id
GROUP BY c.id, c.tipo, c.marca, c.modelo, c.precio
ORDER BY veces_usado DESC;
```

## 🚀 Próximos Pasos

1. **Crear tablas en Supabase**
   - Ejecutar scripts SQL
   - Configurar RLS
   - Crear índices

2. **Poblar datos iniciales**
   - Insertar modelos base
   - Agregar catálogo de componentes
   - Configurar relaciones

3. **Crear API TypeScript**
   - Tipos generados desde DB
   - Funciones de Supabase
   - Validaciones

---

**Nota**: Este esquema está optimizado para Supabase pero es compatible con PostgreSQL estándar.

## 🧩 Migración nueva: campos número de comprobante y SKU

```sql
-- Agregar campo número de comprobante opcional a modelos_base
ALTER TABLE modelos_base ADD COLUMN IF NOT EXISTS numero_comprobante VARCHAR(50);

-- Agregar SKU y número de comprobante opcional a componentes (si no existen)
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE componentes ADD COLUMN IF NOT EXISTS numero_comprobante VARCHAR(50);

-- Índice para búsqueda rápida por SKU
CREATE INDEX IF NOT EXISTS idx_componentes_sku ON componentes(sku);



-- Capturar SKU en detalle de cotización (opcional, si se desea conservarlo en el snapshot)
ALTER TABLE IF EXISTS cotizacion_detalle ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Si quieres incluir número_comprobante también en componentes históricos (opcional)
ALTER TABLE IF EXISTS precios_historico ADD COLUMN IF NOT EXISTS numero_comprobante VARCHAR(50);
-- Crear tabla precios_historico si no existe (para luego agregar el campo)
CREATE TABLE IF NOT EXISTS precios_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  componente_id UUID REFERENCES componentes(id) ON DELETE CASCADE,
  precio DECIMAL(10,2) NOT NULL,
  stock INT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_comprobante VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Notas de implementación
- Ejecutar estos comandos en el SQL editor de Supabase.
- Actualizar RLS si el nuevo campo necesita restricciones (normalmente no es necesario).
- Frontend ya preparado para `numero_comprobante` en modelos y componentes; asegúrate de refrescar tipos si usas generación automática.

