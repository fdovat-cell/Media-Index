import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentRow, NoteRow, CommentRow, ContentSection } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

// --- Content ---

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

// --- Notes ---

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

// --- Comments ---

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
        return []; // Require one or the other
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CommentRow[];
    },
    enabled: !!contentId || !!noteId,
  });
}

// --- Mutations ---

export function useMutateComments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addComment = useMutation({
    mutationFn: async (newComment: Omit<CommentRow, "id" | "created_at">) => {
      const { data, error } = await supabase.from("comments").insert(newComment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast({ title: "Comentario agregado", description: "Tu comentario se publicó con éxito." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return { addComment };
}
