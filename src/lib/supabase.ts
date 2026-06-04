import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          user_id: string;
          destination: string;
          date_from: string;
          date_to: string;
          preferences_snapshot: unknown;
          preferences_hash: string;
          itinerary_data: unknown;
          source: "manual" | "reel_import";
          reel_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          date_from: string;
          date_to: string;
          preferences_snapshot: unknown;
          preferences_hash: string;
          itinerary_data: unknown;
          source?: "manual" | "reel_import";
          reel_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>;
      };
      users_profile: {
        Row: { id: string; full_name: string | null; phone: string | null; preferred_language: string; onboarding_complete: boolean; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; phone?: string | null; preferred_language?: string; onboarding_complete?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["users_profile"]["Insert"]>;
      };
      user_preferences: {
        Row: { id: string; user_id: string; dietary: string[]; pace: string; budget_per_day_inr: number; interests: string[]; group_type: string; home_city: string | null; accessibility_needs: string[]; updated_at: string };
        Insert: { id?: string; user_id: string; dietary?: string[]; pace?: string; budget_per_day_inr?: number; interests?: string[]; group_type?: string; home_city?: string | null; accessibility_needs?: string[]; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_preferences"]["Insert"]>;
      };
      itinerary_versions: {
        Row: { id: string; trip_id: string; version: number; changed_segments: unknown; trigger_signal: unknown; created_at: string };
        Insert: { id?: string; trip_id: string; version: number; changed_segments?: unknown; trigger_signal?: unknown; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["itinerary_versions"]["Insert"]>;
      };
      rate_limits: {
        Row: { id: string; user_id: string; endpoint: string; request_count: number; window_start: string };
        Insert: { id?: string; user_id: string; endpoint: string; request_count?: number; window_start?: string };
        Update: Partial<Database["public"]["Tables"]["rate_limits"]["Insert"]>;
      };
      analytics_events: {
        Row: { id: string; event_name: string; user_id: string | null; properties: unknown; session_id: string | null; created_at: string };
        Insert: { id?: string; event_name: string; user_id?: string | null; properties?: unknown; session_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
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
