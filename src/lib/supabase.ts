import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          user_id: string;
          destination: string;
          preferences_hash: string;
          data: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          preferences_hash: string;
          data: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>;
      };
      preferences: {
        Row: { user_id: string; data: unknown; updated_at: string };
        Insert: { user_id: string; data: unknown; updated_at?: string };
        Update: { data?: unknown; updated_at?: string };
      };
      itinerary_versions: {
        Row: { trip_id: string; version: number; data: unknown };
        Insert: { trip_id: string; version: number; data: unknown };
        Update: { data?: unknown };
      };
      rate_limits: {
        Row: { user_id: string; endpoint: string; request_count: number; window_start: string };
        Insert: { user_id: string; endpoint: string; request_count?: number; window_start?: string };
        Update: { request_count?: number; window_start?: string };
      };
    };
  };
};

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || "https://example.supabase.co",
  supabaseAnonKey || "local-dev-anon-key"
);
