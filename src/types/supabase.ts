export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          source: string | null;
          language: string;
          is_public: boolean;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          source?: string | null;
          language?: string;
          is_public?: boolean;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          source?: string | null;
          language?: string;
          is_public?: boolean;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      typing_sessions: {
        Row: {
          id: string;
          user_id: string;
          article_id: string | null;
          wpm: number | null;
          accuracy: number | null;
          duration_seconds: number | null;
          total_chars: number | null;
          correct_chars: number | null;
          incorrect_chars: number | null;
          backspace_count: number | null;
          keystrokes: Json | null;
          error_heatmap: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id?: string | null;
          wpm?: number | null;
          accuracy?: number | null;
          duration_seconds?: number | null;
          total_chars?: number | null;
          correct_chars?: number | null;
          incorrect_chars?: number | null;
          backspace_count?: number | null;
          keystrokes?: Json | null;
          error_heatmap?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_id?: string | null;
          wpm?: number | null;
          accuracy?: number | null;
          duration_seconds?: number | null;
          total_chars?: number | null;
          correct_chars?: number | null;
          incorrect_chars?: number | null;
          backspace_count?: number | null;
          keystrokes?: Json | null;
          error_heatmap?: Json | null;
          created_at?: string;
        };
      };
      dict_cache: {
        Row: {
          word: string;
          phonetic: string | null;
          meanings: Json | null;
          fetched_at: string;
        };
        Insert: {
          word: string;
          phonetic?: string | null;
          meanings?: Json | null;
          fetched_at?: string;
        };
        Update: {
          word?: string;
          phonetic?: string | null;
          meanings?: Json | null;
          fetched_at?: string;
        };
      };
    };
    Functions: {};
  };
}
