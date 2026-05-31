import { useCallback, useState } from "react";
import { ItinerarySchema, TripResponseSchema, type Itinerary, type PreferencesInput, type RealtimeSignal } from "../lib/schemas";

const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

/** Manages TripMind plan and replan API calls plus itinerary request state. */
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
        headers: jsonHeaders,
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
          headers: jsonHeaders,
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
