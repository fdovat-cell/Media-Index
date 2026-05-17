# Estado Técnico — Qué Vemos Hoy
> Documento de referencia para continuar el proyecto en cualquier momento o con otra IA.

---

## Stack completo

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS + Shadcn UI |
| Routing | Wouter |
| Estado/Fetch | TanStack Query (React Query) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email+contraseña) |
| Seguridad datos | Supabase RLS (Row Level Security) |
| API externa | TMDB (The Movie Database) |
| Deploy | Netlify (archivos estáticos) |
| Paquetes | pnpm workspaces (monorepo) |
| Node | v24, TypeScript 5.9 |

---

## Estructura de archivos

```
artifacts/que-vemos-hoy/
├── index.html                        ← entry point, tiene viewport meta
├── netlify.toml                      ← config de build de Netlify
├── vite.config.ts                    ← config Vite con fallbacks de PORT/BASE_PATH
├── supabase-schema.sql               ← SQL que se corrió en Supabase SQL Editor
└── src/
    ├── main.tsx                      ← root React, monta App
    ├── App.tsx                       ← Wouter Router: / → Home, /admin → Admin
    ├── index.css                     ← variables CSS globales (dark theme)
    ├── pages/
    │   ├── Home.tsx                  ← página pública (5 secciones + bottom nav)
    │   └── Admin.tsx                 ← panel admin (login + TMDB search + listas)
    ├── components/
    │   ├── DetailPopup.tsx           ← popup de detalle + sección de comentarios
    │   └── layout/
    │       └── PhoneLayout.tsx       ← wrapper mobile-first (max-w-430px centrado)
    ├── hooks/
    │   ├── use-data.ts               ← hooks de LECTURA: useContent, useNotes, useComments
    │   └── use-admin.ts              ← hooks de ESCRITURA + TMDB search
    ├── contexts/
    │   └── AuthContext.tsx           ← provee { session, isLoading } via Supabase Auth
    └── lib/
        ├── supabase.ts               ← crea el client de Supabase
        └── database.types.ts         ← tipos TypeScript de las 3 tablas
```

---

## Base de datos Supabase

### Tabla: `content` (películas y series)
```
id             uuid PK
tmdb_id        integer
media_type     "movie" | "tv"
section        "hero" | "weekly" | "classic" | "upcoming"
title          text          ← título en inglés (TMDB con language=en-US)
original_title text nullable ← título en idioma original (ej: coreano para Squid Game)
overview       text nullable ← sinopsis en inglés
poster_path    text nullable ← path relativo a https://image.tmdb.org/t/p/w500
backdrop_path  text nullable ← path relativo a https://image.tmdb.org/t/p/original
release_date   text nullable ← "YYYY-MM-DD"
rating         numeric       ← rating TMDB (0–10)
vote_count     integer
platforms      text[]        ← ["Netflix", "HBO"] etc (ingresado manualmente)
personal_review text nullable← comentario/reseña del dueño de la app
visible        boolean       ← true = visible para visitantes
display_order  integer       ← orden de aparición
created_at     timestamptz
updated_at     timestamptz
```

### Tabla: `notes` (lecturas / "Qué leemos hoy")
```
id             uuid PK
title          text
body           text          ← texto completo
excerpt        text nullable ← resumen corto (aparece en la tarjeta)
image_url      text nullable ← URL completa de imagen
visible        boolean
display_order  integer
created_at     timestamptz
updated_at     timestamptz
```

### Tabla: `comments` (comentarios de visitantes)
```
id          uuid PK
content_id  uuid nullable FK → content.id
note_id     uuid nullable FK → notes.id
author_name text
body        text
created_at  timestamptz
```

### RLS Policies
- **content / notes**: SELECT para todos (anon), INSERT/UPDATE/DELETE solo para authenticated
- **comments**: SELECT para todos, INSERT para todos (cualquier visitante puede comentar), no UPDATE/DELETE

---

## Variables de entorno (ya configuradas en Replit y hay que poner en Netlify)

```
VITE_SUPABASE_URL=https://nqdtvrgkzrnjojrwwqoy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XlNkBdOlkn2VNvt8cdsIQw_aGMvIyGN
VITE_TMDB_API_KEY=8850237f61f6ae4c4b0b5426a7b5cc83
VITE_TMDB_BEARER_TOKEN=eyJhbGciOiJIUzI1NiJ9... (token largo)
```

Nota: el prefijo VITE_ significa que quedan expuestas en el JS del browser. Esto es
intencional y seguro: el anon key de Supabase es público por diseño (la seguridad la dan
las RLS policies). TMDB es una API pública.

---

## Secciones de la app

| Sección visible | Tabla | Campo section | Descripción |
|-----------------|-------|---------------|-------------|
| Hero rotativo | content | 'hero' | Imagen grande con overlay, clic abre popup |
| Lo mejor esta semana | content | 'weekly' | Scroll horizontal de posters |
| Imperdibles | content | 'classic' | Scroll horizontal de posters |
| Qué leemos hoy | notes | — | Scroll horizontal de tarjetas |
| Próximos estrenos | content | 'upcoming' | Lista vertical con fecha |

---

## Flujo del admin (/admin)

1. Login con email+contraseña (Supabase Auth)
2. **Sync TMDB** → botones para auto-poblar "Lo mejor esta semana" (trending/week) y
   "Próximos estrenos" (movie/upcoming) desde TMDB → se guardan en Supabase
3. **Agregar manual** → buscar película/serie → click + → mini-form con reseña personal
   y plataforma → Guardar
4. **Agregar nota** → formulario con título, texto, resumen, imagen (URL), visibilidad
5. **Lista de contenido** → ver todo lo que hay, borrar lo que no se quiere mostrar
6. **Lista de notas** → ver y borrar notas

---

## Criterio de curaduría TMDB (filtros aplicados en el código)
- Excluye contenido de India (origin_country: IN / production_countries: IN)
- Para sync automático: excluye vote_count < 50 y vote_average < 6

---

## Deploy en Netlify

**netlify.toml** (en raíz del repo):
```toml
[build]
  base    = "artifacts/que-vemos-hoy"
  command = "pnpm install && pnpm run build"
  publish = "dist/public"

[build.environment]
  NODE_VERSION = "20"
  BASE_PATH    = "/"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

Pasos:
1. Subir código a GitHub (repo nuevo, vacío)
2. En Netlify: Add new site → Import from GitHub → elegir repo
3. Netlify detecta netlify.toml automáticamente
4. Agregar las 4 variables de entorno en Site settings → Environment variables
5. Deploy → URL lista en 2-3 minutos

---

## Lo que falta / pendiente
- [x] Sync automático de TMDB (trending + upcoming) con botones en admin
- [ ] Editar reseña/plataforma de un ítem ya guardado sin borrarlo
- [ ] Ocultar/mostrar ítem sin borrarlo (toggle visible)
- [ ] Subir imágenes reales a Supabase Storage (hoy las notas usan URL externa)
- [ ] Deploy real en Netlify (el usuario aún no lo hizo)
