import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { RealtimeSignalSchema, type RealtimeSignal } from "../lib/schemas";

/** Keeps alert UI state local until SAFAR realtime signals are connected. */
export function useRealtimeChannel(tripId: string) {
  const [signals, setSignals] = useState<RealtimeSignal[]>([]);

  useEffect(() => {
    if (!tripId) return;
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on("broadcast", { event: "realtime_signal" }, (payload) => {
        const parsed = RealtimeSignalSchema.safeParse(payload.payload);
        if (parsed.success) setSignals((items) => [parsed.data, ...items].slice(0, 10));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { signals, dismissSignal: (index: number) => setSignals((items) => items.filter((_, i) => i !== index)) };
}
