import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ItinerarySchema, TripResponseSchema, type Itinerary, type PreferencesInput, type RealtimeSignal } from "../lib/schemas";
import type { TripResponse } from "../lib/schemas";

const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { ...jsonHeaders, Authorization: `Bearer ${token}` } : jsonHeaders;
}

/** Manages SAFAR plan and replan API calls plus itinerary request state. */
export function useTripPlanner() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [tripId, setTripId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");

  const planMutation = useMutation({
    mutationFn: async (prefs: PreferencesInput): Promise<TripResponse> => {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(prefs)
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Planning failed");
      return TripResponseSchema.parse(json);
    },
    onMutate: () => {
      setError("");
    },
    onSuccess: (parsed) => {
      setItinerary(parsed.itinerary);
      setTripId(parsed.trip_id ?? "");
      setRequestId(parsed.request_id);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Planning failed";
      setError(message);
    }
  });

  const replanMutation = useMutation({
    mutationFn: async (signal: RealtimeSignal): Promise<{ before: Itinerary; after: Itinerary }> => {
      if (!itinerary || !tripId) throw new Error("No active trip to replan.");
      const before = itinerary;
      const response = await fetch("/api/replan", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ trip_id: tripId, signal, current_itinerary: itinerary })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Replan failed");
      return { before, after: ItinerarySchema.parse(json.itinerary), requestId: String(json.request_id ?? "") } as { before: Itinerary; after: Itinerary; requestId: string };
    },
    onMutate: () => {
      setError("");
    },
    onSuccess: (result) => {
      setItinerary(result.after);
      setRequestId("requestId" in result ? String(result.requestId) : "");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Replan failed";
      setError(message);
    }
  });

  const plan = useCallback((prefs: PreferencesInput) => planMutation.mutateAsync(prefs), [planMutation]);
  const replan = useCallback((signal: RealtimeSignal) => replanMutation.mutateAsync(signal), [replanMutation]);
  const loading = planMutation.isPending || replanMutation.isPending;

  return { itinerary, setItinerary, tripId, setTripId, loading, error, requestId, plan, replan };
}
