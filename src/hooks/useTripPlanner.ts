import { useCallback, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { ItinerarySchema, TripResponseSchema, type Itinerary, type PreferencesInput, type RealtimeSignal } from "../lib/schemas";

async function authHeaders(): Promise<HeadersInit> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase env is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in before planning a trip.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export function useTripPlanner() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [tripId, setTripId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");

  const plan = useCallback(async (prefs: PreferencesInput) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(prefs)
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Planning failed");
      const parsed = TripResponseSchema.parse(json);
      setItinerary(parsed.itinerary);
      setTripId(parsed.trip_id ?? "");
      setRequestId(parsed.request_id);
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Planning failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const replan = useCallback(
    async (signal: RealtimeSignal) => {
      if (!itinerary || !tripId) throw new Error("No active trip to replan.");
      setLoading(true);
      setError("");
      try {
        const before = itinerary;
        const response = await fetch("/api/replan", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify({ trip_id: tripId, signal, current_itinerary: itinerary })
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Replan failed");
        const next = ItinerarySchema.parse(json.itinerary);
        setItinerary(next);
        setRequestId(json.request_id ?? "");
        return { before, after: next };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Replan failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [itinerary, tripId]
  );

  return { itinerary, setItinerary, tripId, setTripId, loading, error, requestId, plan, replan };
}
