export type MediaType = "movie" | "tv";
export type ContentSection = "hero" | "weekly" | "classic" | "upcoming";

export interface Database {
  public: {
    Tables: {
      content: {
        Row: {
          id: string;
          tmdb_id: number;
          media_type: MediaType;
          section: ContentSection;
          title: string;
          original_title: string | null;
          overview: string | null;
          poster_path: string | null;
          backdrop_path: string | null;
          release_date: string | null;
          rating: number | null;
          vote_count: number | null;
          platforms: string[] | null;
          personal_review: string | null;
          visible: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["content"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["content"]["Insert"]>;
      };
      notes: {
        Row: {
          id: string;
          title: string;
          body: string;
          excerpt: string | null;
          image_url: string | null;
          visible: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
      };
      comments: {
        Row: {
          id: string;
          content_id: string | null;
          note_id: string | null;
          author_name: string;
          body: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "created_at">;
        Update: never;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type ContentRow = Database["public"]["Tables"]["content"]["Row"];
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
