import { useCallback, useEffect, useState } from "react";
import { ItinerarySchema, type Itinerary } from "../lib/schemas";

const CACHE_KEY = "tripmind:last-itinerary";

export function useOfflineCache() {
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedItinerary, setCachedItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    const value = localStorage.getItem(CACHE_KEY);
    if (!value) return;
    const parsed = ItinerarySchema.safeParse(JSON.parse(value));
    if (parsed.success) {
      setCachedItinerary(parsed.data);
      setIsFromCache(true);
    }
  }, []);

  const save = useCallback((itinerary: Itinerary) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(itinerary));
    setCachedItinerary(itinerary);
    setIsFromCache(false);
  }, []);

  return { cachedItinerary, isFromCache, save };
}
