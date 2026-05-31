import { useCallback, useEffect, useState } from "react";
import { ItinerarySchema, type Itinerary } from "../lib/schemas";

const CACHE_KEY = "tripmind:last-itinerary";

/** Persists and restores the latest itinerary from localStorage for offline viewing. */
export function useOfflineCache() {
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedItinerary, setCachedItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    try {
      const value = localStorage.getItem(CACHE_KEY);
      if (!value) return;
      const parsed = ItinerarySchema.safeParse(JSON.parse(value));
      if (parsed.success) {
        setCachedItinerary(parsed.data);
        setIsFromCache(true);
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  const save = useCallback((itinerary: Itinerary) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(itinerary));
    setCachedItinerary(itinerary);
    setIsFromCache(false);
  }, []);

  return { cachedItinerary, isFromCache, save };
}
