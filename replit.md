# Qué Vemos Hoy

App personal de curaduría de series, películas y textos. El dueño elige qué recomendar; los invitados lo disfrutan. Sin algoritmos — solo criterio.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — corre el API server (puerto 5000, no se usa en esta app)
- `pnpm --filter @workspace/que-vemos-hoy run dev` — corre el frontend (via workflow)
- `pnpm run typecheck` — typecheck completo

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Shadcn UI
- Base de datos: Supabase (PostgreSQL + Auth + RLS)
- Data: TMDB API (solo desde el admin)
- Routing: Wouter
- Deploy target: Netlify (archivos estáticos)

## Where things live

- Frontend: `artifacts/que-vemos-hoy/src/`
- Páginas: `src/pages/Home.tsx` (público) y `src/pages/Admin.tsx` (admin)
- Popup de detalle: `src/components/DetailPopup.tsx`
- Supabase client: `src/lib/supabase.ts`
- Tipos de DB: `src/lib/database.types.ts`
- Hooks de datos: `src/hooks/use-data.ts` (lectura) y `src/hooks/use-admin.ts` (escritura)
- Auth context: `src/contexts/AuthContext.tsx`
- Layout de celular: `src/components/layout/PhoneLayout.tsx`
- Schema SQL: `artifacts/que-vemos-hoy/supabase-schema.sql`

## Configuración inicial de Supabase (HACER UNA VEZ)

### 1. Crear las tablas
Ir a supabase.com → tu proyecto → SQL Editor → pegar y ejecutar el contenido de `supabase-schema.sql`

### 2. Crear tu cuenta de admin
Ir a Supabase → Authentication → Users → "Invite user" o "Add user"
Agregar tu email y contraseña. Ese email+contraseña es lo que usás en /admin para entrar.

### 3. Variables de entorno (para Netlify)
Al hacer deploy en Netlify, configurar estas variables en Site settings → Environment variables:
```
VITE_SUPABASE_URL=https://nqdtvrgkzrnjojrwwqoy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XlNkBdOlkn2VNvt8cdsIQw_aGMvIyGN
VITE_TMDB_API_KEY=8850237f61f6ae4c4b0b5426a7b5cc83
VITE_TMDB_BEARER_TOKEN=eyJhbGciOiJIUzI1NiJ9...
```

## Secciones de la app

| Sección | Tabla | Campo `section` |
|---------|-------|-----------------|
| Hero rotativo | content | 'hero' |
| Lo mejor esta semana | content | 'weekly' |
| Imperdibles | content | 'classic' |
| Próximos estrenos | content | 'upcoming' |
| Qué leemos hoy | notes | — |

## Criterio de curaduría (para el admin al agregar)
- Películas/series con +6 meses: mínimo 200 opiniones en TMDB, rating ≥ 6
- Estrenos recientes: mínimo 50 opiniones, rating ≥ 6
- Excluir mercado indio (filtrado automáticamente en búsqueda TMDB)

## Deploy a Netlify

1. Pushear el código a GitHub
2. En Netlify: New site → Import from GitHub → seleccionar repo
3. Build settings:
   - Base directory: `artifacts/que-vemos-hoy`
   - Build command: `pnpm run build`
   - Publish directory: `dist/public`
4. Agregar las variables de entorno (ver arriba)
5. Deploy

## User preferences

- Prioridad mobile: el front es mobile-first. Desktop muestra un "teléfono" centrado.
- No usar emojis en la UI.
- El admin es la fuente de verdad — todo se gestiona desde /admin.
- Los datos se actualizan en tiempo real sin redeploy (Supabase → frontend).

## Architecture decisions

- Supabase como único backend: evita un servidor propio y habilita updates sin redeploy.
- RLS de Supabase: los visitantes solo leen contenido visible; el admin (usuario autenticado) puede todo.
- TMDB solo en el admin: la API key no queda expuesta a visitantes, solo al admin logueado.
- Frontend estático en Netlify: costo cero, máximo rendimiento.
- Desktop = teléfono simulado: la app siempre se ve como móvil, sin breakpoints de desktop.

## Gotchas

- Antes de usar la app, correr el SQL schema en Supabase SQL Editor.
- Crear el usuario admin en Supabase Auth antes de intentar loguear en /admin.
- El anon key de Supabase es público por diseño (está en el frontend). La seguridad la dan las RLS policies.
- Para hacer deploy en Netlify: el base directory es `artifacts/que-vemos-hoy`, no la raíz del repo.
