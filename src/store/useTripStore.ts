import { create } from "zustand";
import type { Itinerary } from "../lib/schemas";

type TripState = {
  tripId: string;
  itinerary: Itinerary | null;
  requestId: string;
  setTrip: (tripId: string, itinerary: Itinerary | null) => void;
  setRequestId: (requestId: string) => void;
};

export const useTripStore = create<TripState>((set) => ({
  tripId: "",
  itinerary: null,
  requestId: "",
  setTrip: (tripId, itinerary) => set({ tripId, itinerary }),
  setRequestId: (requestId) => set({ requestId })
}));
