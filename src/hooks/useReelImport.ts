import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ReelDataSchema, type PreferencesInput, type ReelData } from "../lib/schemas";

const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { ...jsonHeaders, Authorization: `Bearer ${token}` } : jsonHeaders;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function reelDataToPreferences(data: ReelData, reelUrl: string): PreferencesInput {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(data.days, 1));
  const interests = Array.from(new Set([...data.places, data.vibe, ...data.keywords]))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);

  return {
    destination: data.destination,
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    budgetPreset: "comfort",
    dietary: ["none"],
    pace: data.vibe.toLowerCase().includes("slow") ? "relaxed" : data.vibe.toLowerCase().includes("fast") ? "packed" : "balanced",
    interests: interests.length ? interests : ["Food", "Local markets"],
    groupType: "friends",
    transport: "mixed",
    accessibilityNeeds: "",
    source: "reel_import",
    reelUrl
  };
}

/** Extracts planner-ready travel preferences from an Instagram Reel URL. */
export function useReelImport() {
  const [data, setData] = useState<ReelData | null>(null);
  const [preferences, setPreferences] = useState<PreferencesInput | null>(null);
  const [error, setError] = useState("");

  const extractMutation = useMutation({
    mutationFn: async (url: string): Promise<ReelData> => {
      const response = await fetch("/api/extract-reel", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ url })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Reel extraction failed");
      return ReelDataSchema.parse(json);
    },
    onMutate: () => {
      setError("");
    },
    onSuccess: (parsed, url) => {
      setData(parsed);
      setPreferences(reelDataToPreferences(parsed, url));
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Reel extraction failed";
      setError(message);
    }
  });

  const extractReel = useCallback((url: string): Promise<ReelData> => extractMutation.mutateAsync(url), [extractMutation]);

  return {
    destination: data?.destination ?? "",
    places: data?.places ?? [],
    vibe: data?.vibe ?? "",
    days: data?.days ?? 0,
    keywords: data?.keywords ?? [],
    data,
    preferences,
    loading: extractMutation.isPending,
    error,
    extractReel
  };
}
