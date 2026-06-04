import { useCallback } from "react";
import { track } from "../lib/analytics";

export function useAnalytics() {
  return useCallback((event: string, properties: Record<string, unknown> = {}) => {
    track(event, properties);
  }, []);
}
