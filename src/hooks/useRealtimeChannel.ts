import { useState } from "react";
import type { RealtimeSignal } from "../lib/schemas";

/** Keeps alert UI state local so TripMind never ships login/auth code to the browser. */
export function useRealtimeChannel(tripId: string) {
  const [signals, setSignals] = useState<RealtimeSignal[]>([]);
  void tripId;

  return { signals, dismissSignal: (index: number) => setSignals((items) => items.filter((_, i) => i !== index)) };
}
