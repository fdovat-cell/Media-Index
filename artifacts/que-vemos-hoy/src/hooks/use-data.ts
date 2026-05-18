import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentRow, NoteRow, CommentRow, ContentSection } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

export function useContent(section?: ContentSection, isAdmin = false) {
  return useQuery({
    queryKey: ["content", section, isAdmin],
    queryFn: async () => {
      let query = supabase.from("content").select("*");

      if (section) {
        query = query.eq("section", section);
      }

      if (!isAdmin) {
        query = query.eq("visible", true);
      }

      if (section === "upcoming" && !isAdmin) {
        const today = new Date().toISOString().split("T")[0];
        query = query.gte("release_date", today);
      }

      query = query.order("display_order");

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentRow[];
    },
  });
}

export function useAllContent() {
  return useQuery({
    queryKey: ["content", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content").select("*").order("section").order("display_order");
      if (error) throw error;
      return data as ContentRow[];
    },
  });
}

export function useNotes(isAdmin = false) {
  return useQuery({
    queryKey: ["notes", isAdmin],
    queryFn: async () => {
      let query = supabase.from("notes").select("*");
      if (!isAdmin) {
        query = query.eq("visible", true);
      }
      query = query.order("display_order");

      const { data, error } = await query;
      if (error) throw error;
      return data as NoteRow[];
    },
  });
}

export function useComments(contentId?: string, noteId?: string) {
  return useQuery({
    queryKey: ["comments", contentId, noteId],
    queryFn: async () => {
      let query = supabase.from("comments").select("*").order("created_at", { ascending: true });

      if (contentId) {
        query = query.eq("content_id", contentId);
      } else if (noteId) {
        query = query.eq("note_id", noteId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommentRow[];
    },
    enabled: !!contentId || !!noteId,
  });
}

export function useRatings(contentId?: string) {
  return useQuery({
    queryKey: ["ratings", contentId],
    queryFn: async () => {
      if (!contentId) return { average: 0, count: 0 };
      const { data, error } = await supabase
        .from("ratings")
        .select("score")
        .eq("content_id", contentId);
      if (error) throw error;
      if (!data || data.length === 0) return { average: 0, count: 0 };
      const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length;
      return { average: Math.round(avg * 10) / 10, count: data.length };
    },
    enabled: !!contentId,
  });
}

export function useMutateRatings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addRating = useMutation({
    mutationFn: async ({ contentId, score }: { contentId: string; score: number }) => {
      const { error } = await supabase.from("ratings").insert({ content_id: contentId, score });
      if (error) throw error;
    },
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ["ratings", contentId] });
      toast({ title: "¡Gracias por tu valoración!" });
    },
    onError: () => {
      toast({ title: "Error al guardar la valoración", variant: "destructive" });
    }
  });

  return { addRating };
}

export function useMutateComments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addComment = useMutation({
    mutationFn: async (newComment: Omit<CommentRow, "id" | "created_at">) => {
      const { data, error } = await supabase.from("comments").insert(newComment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast({ title: "Comentario agregado", description: "Tu comentario se publicó con éxito." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return { addComment };
}
