-- PizKTruck — Esquema inicial de Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase

-- ============================================
-- TABLA: restaurantes (raíz de todo, incluye personalización)
-- ============================================
create table restaurantes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- usado en la URL: /menu/tacos-el-primo
  nombre text not null,
  whatsapp_numero text not null,          -- formato: 13051234567 (con código de país, sin +)
  color_primario text default '#D85A30',  -- personalización visual
  color_secundario text default '#1D9E75',
  logo_url text,
  banner_url text,
  descripcion_corta text,
  activo boolean default true,            -- para pausar un cliente sin borrar sus datos
  creado_en timestamptz default now()
);

-- ============================================
-- TABLA: categorias (entradas, hamburguesas, pizzas, etc.)
-- ============================================
create table categorias (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid references restaurantes(id) on delete cascade not null,
  nombre text not null,
  orden int default 0,                    -- controla el orden de aparición
  creado_en timestamptz default now()
);

-- ============================================
-- TABLA: platillos
-- ============================================
create table platillos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  foto_url text,
  disponible boolean default true,        -- clave: se refleja igual en QR 1 y QR 2
  orden int default 0,
  creado_en timestamptz default now()
);

-- ============================================
-- SEGURIDAD (Row Level Security)
-- Lectura: pública (cualquiera con el link ve el menú, sin login)
-- Escritura: solo tu usuario admin autenticado
-- ============================================
alter table restaurantes enable row level security;
alter table categorias enable row level security;
alter table platillos enable row level security;

-- Lectura pública solo de restaurantes activos
create policy "lectura publica restaurantes"
  on restaurantes for select
  using (activo = true);

create policy "lectura publica categorias"
  on categorias for select
  using (true);

create policy "lectura publica platillos"
  on platillos for select
  using (true);

-- Escritura solo para usuarios autenticados (tu cuenta admin)
create policy "admin escribe restaurantes"
  on restaurantes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin escribe categorias"
  on categorias for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin escribe platillos"
  on platillos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- STORAGE: bucket para fotos (logos, banners, platillos)
-- Crear manualmente en Supabase > Storage > New bucket: "pizktruck-media" (público)
-- ============================================
