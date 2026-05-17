import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentRow, NoteRow, ContentSection } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

const TMDB_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN;

export function useTmdbSearch(query: string) {
  return useQuery({
    queryKey: ["tmdb", query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=en-US`, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          accept: "application/json"
        }
      });
      if (!res.ok) throw new Error("TMDB Search failed");
      const data = await res.json();
      
      return (data.results || []).filter((item: any) => {
        if (item.media_type !== "movie" && item.media_type !== "tv") return false;
        if (item.media_type === "tv" && item.origin_country?.includes("IN")) return false;
        if (item.media_type === "movie" && item.production_countries?.some((c: any) => c.iso_3166_1 === "IN")) return false;
        return true;
      });
    },
    enabled: query.length >= 3 && !!TMDB_TOKEN
  });
}

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
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const updateContent = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<ContentRow> }) => {
      const { data, error } = await supabase.from("content").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "Contenido actualizado" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "Contenido eliminado" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  return { addContent, updateContent, deleteContent };
}

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
      toast({ title: "Nota agregada" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<NoteRow> }) => {
      const { data, error } = await supabase.from("notes").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "Nota actualizada" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
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
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  return { addNote, updateNote, deleteNote };
}