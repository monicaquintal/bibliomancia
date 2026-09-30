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
      marathons: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          starts_on: string | null;
          ends_on: string | null;
          target_books: number | null;
          catalog_key: string | null;
          cover_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          starts_on?: string | null;
          ends_on?: string | null;
          target_books?: number | null;
          catalog_key?: string | null;
          cover_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marathons"]["Insert"]>;
        Relationships: [];
      };
      marathon_entries: {
        Row: {
          marathon_id: string;
          library_entry_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          marathon_id: string;
          library_entry_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marathon_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "marathon_entries_marathon_id_fkey";
            columns: ["marathon_id"];
            isOneToOne: false;
            referencedRelation: "marathons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marathon_entries_library_entry_id_fkey";
            columns: ["library_entry_id"];
            isOneToOne: false;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      marathon_challenges: {
        Row: {
          id: string;
          marathon_id: string;
          user_id: string;
          title: string;
          position: number;
          library_entry_id: string | null;
          challenge_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          marathon_id: string;
          user_id: string;
          title: string;
          position?: number;
          library_entry_id?: string | null;
          challenge_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marathon_challenges"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "marathon_challenges_marathon_id_fkey";
            columns: ["marathon_id"];
            isOneToOne: false;
            referencedRelation: "marathons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marathon_challenges_library_entry_id_fkey";
            columns: ["library_entry_id"];
            isOneToOne: false;
            referencedRelation: "library_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["challenges"]["Insert"]>;
        Relationships: [];
      };
      catalog_marathons: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["catalog_marathons"]["Insert"]>;
        Relationships: [];
      };
      catalog_marathon_challenges: {
        Row: {
          catalog_marathon_id: string;
          challenge_id: string;
          position: number;
        };
        Insert: {
          catalog_marathon_id: string;
          challenge_id: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["catalog_marathon_challenges"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "catalog_marathon_challenges_catalog_marathon_id_fkey";
            columns: ["catalog_marathon_id"];
            isOneToOne: false;
            referencedRelation: "catalog_marathons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_marathon_challenges_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
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
