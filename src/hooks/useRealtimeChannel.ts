import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { RealtimeSignalSchema, type RealtimeSignal } from "../lib/schemas";

export function useRealtimeChannel(tripId: string) {
  const [signals, setSignals] = useState<RealtimeSignal[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    if (!tripId) return undefined;
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on("broadcast", { event: "weather_update" }, ({ payload }) => addSignal(payload))
      .on("broadcast", { event: "train_delay" }, ({ payload }) => addSignal(payload))
      .on("broadcast", { event: "road_closure" }, ({ payload }) => addSignal(payload))
      .on("broadcast", { event: "poi_closed" }, ({ payload }) => addSignal(payload))
      .subscribe();

    function addSignal(payload: unknown) {
      const parsed = RealtimeSignalSchema.safeParse(payload);
      if (parsed.success) setSignals((current) => [parsed.data, ...current].slice(0, 5));
    }

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { signals, dismissSignal: (index: number) => setSignals((items) => items.filter((_, i) => i !== index)) };
}
