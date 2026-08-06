# PizKTruck

Menús digitales para food trucks. Un solo restaurante = un slug = dos vistas (menú y pedido).

## Estructura

```
pizktruck/
├── menu.html          → QR 2: catálogo, sin carrito. Uso: menu.html?slug=tacos-el-primo
├── pedido.html        → QR 1: catálogo + carrito + WhatsApp. Uso: pedido.html?slug=tacos-el-primo
├── css/styles.css     → estilos compartidos, personalizables por restaurante
├── js/
│   ├── supabase-config.js  → AQUÍ VAN TUS CREDENCIALES (ver abajo)
│   └── catalogo.js         → lógica compartida de menu.html y pedido.html
├── admin/
│   ├── index.html     → login del panel admin
│   ├── panel.html      → gestión de restaurantes, categorías y platillos
│   ├── css/admin.css
│   └── js/admin.js
└── pizktruck_schema.sql (fuera de esta carpeta) → ejecutar una sola vez en Supabase
```

## Paso 1 — Conectar Supabase

1. Abre `js/supabase-config.js`.
2. Reemplaza `TU_PROJECT_URL_AQUI` y `TU_ANON_KEY_AQUI` con los datos de tu proyecto:
   Supabase → tu proyecto → Settings → API → "Project URL" y "anon public".
3. La clave anon es segura de exponer en el frontend — nunca uses la `service_role` aquí.

## Paso 2 — Crear tu usuario admin

El panel admin usa Supabase Auth. Crea tu propio usuario:
Supabase → Authentication → Users → Add user → tu email y una contraseña.
Ese es el único usuario que puede entrar a `/admin`.

## Paso 3 — Correr el proyecto localmente

Como es HTML/JS puro, no hay build ni npm install. En VS Code:
1. Instala la extensión "Live Server".
2. Click derecho en `menu.html` → "Open with Live Server".
3. Agrega `?slug=algo` a la URL para ver un restaurante (tienes que crearlo primero desde el admin).

## Paso 4 — Crear tu primer restaurante

1. Abre `admin/index.html` con Live Server, inicia sesión con tu usuario admin.
2. Crea un restaurante (nombre, slug, whatsapp).
3. Agrégale categorías y platillos.
4. Visita `menu.html?slug=el-slug-que-pusiste` para verlo en vivo.

## Paso 5 — Deploy gratis

Sube esta carpeta a GitHub y conéctala a Vercel o Netlify (plan gratuito).
El deploy se actualiza solo cada vez que subes cambios.

## Los dos QR por restaurante

- QR 1 → `tudominio.com/pedido.html?slug=tacos-el-primo`
- QR 2 → `tudominio.com/menu.html?slug=tacos-el-primo`

Genera los QR con cualquier generador gratuito (ej. qr-code-generator.com) apuntando a estas URLs.
