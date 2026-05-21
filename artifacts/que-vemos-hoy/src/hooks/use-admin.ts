import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentRow, NoteRow, ContentSection } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

const TMDB_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN;

const TMDB_HEADERS = {
  Authorization: `Bearer ${TMDB_TOKEN}`,
  accept: "application/json"
};

function isLatinScript(text: string): boolean {
  return /^[\u0000-\u024F\u1E00-\u1EFF\s\d\W]+$/.test(text);
}

function filterTmdb(item: any) {
  if (item.media_type !== "movie" && item.media_type !== "tv") return false;
  if (item.media_type === "tv" && item.origin_country?.includes("IN")) return false;
  if (item.media_type === "movie" && item.production_countries?.some((c: any) => c.iso_3166_1 === "IN")) return false;
  return true;
}

async function fetchPlatforms(tmdbId: number, mediaType: "movie" | "tv"): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers`,
      { headers: TMDB_HEADERS }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const ar = data.results?.AR;
    if (!ar) return [];
    const flatrate = ar.flatrate || [];
    const free = ar.free || [];
    const providers = [...flatrate, ...free];
    return providers.map((p: any) => p.provider_name).filter(Boolean);
  } catch {
    return [];
  }
}

function tmdbToContent(item: any, section: ContentSection, platforms: string[] = []): Omit<ContentRow, "id" | "created_at" | "updated_at"> {
  const originalTitle = item.original_title || item.original_name || null;
  const displayTitle = item.title || item.name;

  return {
    tmdb_id: item.id,
    media_type: item.media_type ?? "movie",
    section,
    title: displayTitle,
    original_title: originalTitle && !isLatinScript(originalTitle) ? originalTitle : null,
    overview: item.overview || null,
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    release_date: item.release_date || item.first_air_date || null,
    rating: item.vote_average ?? null,
    vote_count: item.vote_count ?? null,
    platforms,
    personal_review: null,
    visible: true,
    display_order: 0
  };
}

// Search

export function useTmdbSearch(query: string) {
  return useQuery({
    queryKey: ["tmdb", query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=es-419`,
        { headers: TMDB_HEADERS }
      );
      if (!res.ok) throw new Error("TMDB Search failed");
      const data = await res.json();
      return (data.results || []).filter(filterTmdb);
    },
    enabled: query.length >= 3 && !!TMDB_TOKEN
  });
}

// Sync from TMDB

export function useSyncFromTmdb() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function getExistingIds(): Promise<Set<number>> {
    const { data } = await supabase.from("content").select("tmdb_id");
    return new Set((data || []).map(c => c.tmdb_id));
  }

  const syncTrending = useMutation({
    mutationFn: async () => {
      const existingIds = await getExistingIds();
      const today = new Date().toISOString().split("T")[0];

      const res = await fetch(
        "https://api.themoviedb.org/3/trending/all/week?language=es-419",
        { headers: TMDB_HEADERS }
      );
      if (!res.ok) throw new Error("TMDB trending failed");
      const data = await res.json();

      const filtered = (data.results || []).filter((item: any) => {
        if (!filterTmdb(item)) return false;
        if (existingIds.has(item.id)) return false;
        if ((item.vote_count ?? 0) < 50) return false;
        if ((item.vote_average ?? 0) < 6) return false;
        const releaseDate = item.release_date || item.first_air_date || null;
        if (releaseDate && releaseDate > today) return false;
        return true;
      }).slice(0, 12);

      const items = await Promise.all(
        filtered.map(async (item: any) => {
          const platforms = await fetchPlatforms(item.id, item.media_type as "movie" | "tv");
          return tmdbToContent(item, "weekly", platforms);
        })
      );

      if (items.length === 0) return 0;
      const { error } = await supabase.from("content").insert(items);
      if (error) throw error;
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: `${count} títulos agregados a "Lo mejor esta semana"` });
    },
    onError: (e: Error) => toast({ title: "Error sync trending", description: e.message, variant: "destructive" })
  });

  const syncUpcoming = useMutation({
    mutationFn: async () => {
      const existingIds = await getExistingIds();
      const today = new Date().toISOString().split("T")[0];

      await supabase.from("content").delete().eq("section", "upcoming").lt("release_date", today);

      const [page1, page2, page3] = await Promise.all([
        fetch("https://api.themoviedb.org/3/movie/upcoming?language=es-419&page=1&region=AR", { headers: TMDB_HEADERS }).then(r => r.json()),
        fetch("https://api.themoviedb.org/3/movie/upcoming?language=es-419&page=2&region=AR", { headers: TMDB_HEADERS }).then(r => r.json()),
        fetch("https://api.themoviedb.org/3/movie/upcoming?language=es-419&page=3&region=AR", { headers: TMDB_HEADERS }).then(r => r.json()),
      ]);

      const all = [...(page1.results || []), ...(page2.results || []), ...(page3.results || [])];

      const filtered = all
        .filter((item: any) =>
          !existingIds.has(item.id) &&
          item.poster_path &&
          item.release_date &&
          item.release_date > today
        )
        .sort((a: any, b: any) => a.release_date.localeCompare(b.release_date))
        .slice(0, 20);

      const items = await Promise.all(
        filtered.map(async (item: any) => {
          const platforms = await fetchPlatforms(item.id, "movie");
          return {
            ...tmdbToContent(item, "upcoming", platforms),
            media_type: "movie" as const
          };
        })
      );

      if (items.length === 0) return 0;
      const { error } = await supabase.from("content").insert(items);
      if (error) throw error;
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: `${count} estrenos agregados a "Próximos estrenos"` });
    },
    onError: (e: Error) => toast({ title: "Error sync upcoming", description: e.message, variant: "destructive" })
  });

  return { syncTrending, syncUpcoming };
}

// Content mutations

export function useMutateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addContent = useMutation({
    mutationFn: async (content: Omit<ContentRow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("content").insert(content).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "Contenido agregado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const updateContent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentRow> }) => {
      const { data, error } = await supabase.from("content").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "Contenido actualizado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "Eliminado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  return { addContent, updateContent, deleteContent };
}

// Notes mutations

export function useMutateNotes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addNote = useMutation({
    mutationFn: async (note: Omit<NoteRow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("notes").insert(note).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "Nota publicada" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NoteRow> }) => {
      const { data, error } = await supabase.from("notes").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "Nota actualizada" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "Nota eliminada" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  return { addNote, updateNote, deleteNote };
}

// Batch order update — sin race conditions

export function useBatchUpdateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number; table: "content" | "notes" }[]) => {
      await Promise.all(
        updates.map(({ id, display_order, table }) =>
          supabase.from(table).update({ display_order }).eq("id", id)
        )
      );
    },
    onSuccess: (_, variables) => {
      const tables = new Set(variables.map(v => v.table));
      if (tables.has("content")) queryClient.invalidateQueries({ queryKey: ["content"] });
      if (tables.has("notes")) queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "Orden guardado" });
    },
    onError: (e: Error) => toast({ title: "Error al guardar orden", description: e.message, variant: "destructive" })
  });
}
