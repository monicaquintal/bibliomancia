export type ReadingSessionStatus = "em_andamento" | "concluida" | "abandonada";
export type ReadingSessionFormat = "livro" | "ebook" | "audiobook";

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          google_volume_id: string;
          isbn_10: string | null;
          isbn_13: string | null;
          title: string;
          subtitle: string | null;
          authors: string[];
          publisher: string | null;
          published_date: string | null;
          published_year: number | null;
          description: string | null;
          page_count: number | null;
          language: string | null;
          thumbnail_url: string | null;
          raw_json: unknown | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          google_volume_id: string;
          isbn_10?: string | null;
          isbn_13?: string | null;
          title: string;
          subtitle?: string | null;
          authors?: string[];
          publisher?: string | null;
          published_date?: string | null;
          published_year?: number | null;
          description?: string | null;
          page_count?: number | null;
          language?: string | null;
          thumbnail_url?: string | null;
          raw_json?: unknown | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
        Relationships: [];
      };
      reading_statuses: {
        Row: {
          id: string;
          user_id: string | null;
          key: string;
          label: string;
          is_system: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          key: string;
          label: string;
          is_system?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_statuses"]["Insert"]>;
        Relationships: [];
      };
      library_entries: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          status_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          status_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["library_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "library_entries_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_entries_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "reading_statuses";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_sessions: {
        Row: {
          id: string;
          library_entry_id: string;
          user_id: string;
          sequence_number: number;
          status: ReadingSessionStatus;
          format: ReadingSessionFormat | null;
          started_at: string | null;
          finished_at: string | null;
          rating_half: number | null;
          rating: number | null;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          library_entry_id: string;
          user_id: string;
          sequence_number: number;
          status?: ReadingSessionStatus;
          format?: ReadingSessionFormat | null;
          started_at?: string | null;
          finished_at?: string | null;
          rating_half?: number | null;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_sessions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reading_sessions_library_entry_id_fkey";
            columns: ["library_entry_id"];
            isOneToOne: false;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_comments: {
        Row: {
          id: string;
          reading_session_id: string;
          user_id: string;
          body: string;
          progress_page: number | null;
          progress_percent: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reading_session_id: string;
          user_id: string;
          body: string;
          progress_page?: number | null;
          progress_percent?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_comments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reading_comments_reading_session_id_fkey";
            columns: ["reading_session_id"];
            isOneToOne: false;
            referencedRelation: "reading_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_goals: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          target_books: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          target_books: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_goals"]["Insert"]>;
        Relationships: [];
      };
      shelves: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shelves"]["Insert"]>;
        Relationships: [];
      };
      shelf_entries: {
        Row: {
          shelf_id: string;
          library_entry_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          shelf_id: string;
          library_entry_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shelf_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "shelf_entries_shelf_id_fkey";
            columns: ["shelf_id"];
            isOneToOne: false;
            referencedRelation: "shelves";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shelf_entries_library_entry_id_fkey";
            columns: ["library_entry_id"];
            isOneToOne: false;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
