-- ============================================================
-- QUÉ VEMOS HOY — Supabase Schema
-- Paste this entire script in Supabase SQL Editor and run it
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE: content  (movies, series, upcoming)
-- ─────────────────────────────────────────────
create table if not exists public.content (
  id             uuid primary key default uuid_generate_v4(),
  tmdb_id        integer not null,
  media_type     text not null check (media_type in ('movie', 'tv')),
  section        text not null check (section in ('hero', 'weekly', 'classic', 'upcoming')),
  title          text not null,
  original_title text,
  overview       text,
  poster_path    text,
  backdrop_path  text,
  release_date   text,
  rating         numeric(3,1),
  vote_count     integer,
  platforms      text[],
  personal_review text,
  visible        boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- TABLE: notes  ("Qué leemos hoy")
-- ─────────────────────────────────────────────
create table if not exists public.notes (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  body          text not null,
  excerpt       text,
  image_url     text,
  visible       boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- TABLE: comments
-- ─────────────────────────────────────────────
create table if not exists public.comments (
  id          uuid primary key default uuid_generate_v4(),
  content_id  uuid references public.content(id) on delete cascade,
  note_id     uuid references public.notes(id) on delete cascade,
  author_name text not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint one_parent check (
    (content_id is not null)::int + (note_id is not null)::int = 1
  )
);

-- ─────────────────────────────────────────────
-- Auto-update updated_at
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger content_updated_at
  before update on public.content
  for each row execute function public.handle_updated_at();

create or replace trigger notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.content  enable row level security;
alter table public.notes    enable row level security;
alter table public.comments enable row level security;

-- content: public read (visible only), admin full access
create policy "Public can read visible content"
  on public.content for select
  using (visible = true);

create policy "Admins can manage content"
  on public.content for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- notes: public read (visible only), admin full access
create policy "Public can read visible notes"
  on public.notes for select
  using (visible = true);

create policy "Admins can manage notes"
  on public.notes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- comments: public read & insert, admin delete
create policy "Public can read comments"
  on public.comments for select
  using (true);

create policy "Anyone can add a comment"
  on public.comments for insert
  with check (true);

create policy "Admins can delete comments"
  on public.comments for delete
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index if not exists idx_content_section  on public.content(section, display_order);
create index if not exists idx_content_visible  on public.content(visible);
create index if not exists idx_notes_order      on public.notes(display_order);
create index if not exists idx_comments_content on public.comments(content_id);
create index if not exists idx_comments_note    on public.comments(note_id);
