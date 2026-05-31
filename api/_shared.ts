import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { ItinerarySchema, PreferencesInputSchema, RealtimeSignalSchema } from "../src/lib/schemas.js";
import type { Itinerary, PreferencesInput, RealtimeSignal } from "../src/lib/schemas.js";
import { sanitiseUnknown } from "../src/utils/validators.js";

declare const process: { env: Record<string, string | undefined> };

export const edgeConfig = { runtime: "edge" };

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

/** Serialises API data as JSON with standard CORS headers. */
export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...jsonHeaders, ...extraHeaders }
  });
}

/** Reads a required server environment variable or throws a clear error. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

/** Creates a Supabase service-role client for trusted serverless work. */
export function adminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false }
  });
}

/** Verifies the bearer JWT and returns the authenticated Supabase user. */
export async function getUser(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401, headers: jsonHeaders });
  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: jsonHeaders });
  }
  return { supabase, user: data.user };
}

/** Returns the authenticated user when a bearer token is present, otherwise guest mode. */
export async function getOptionalUser(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { supabase: null, user: null };
  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

/** Enforces a fixed-window per-user endpoint rate limit. */
export async function checkRateLimit(userId: string, endpoint: string): Promise<void> {
  const supabase = adminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60_000).toISOString();
  const { data } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (!data || new Date(data.window_start) < new Date(windowStart)) {
    await supabase.from("rate_limits").upsert({
      user_id: userId,
      endpoint,
      request_count: 1,
      window_start: now.toISOString()
    });
    return;
  }

  if (data.request_count >= 10) {
    throw new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
      status: 429,
      headers: jsonHeaders
    });
  }

  await supabase
    .from("rate_limits")
    .update({ request_count: data.request_count + 1 })
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
}

/** Produces a SHA-256 hash for cacheable request payloads. */
export async function sha256(input: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Generates a request id for logs, responses, and client diagnostics. */
export function requestId(): string {
  return crypto.randomUUID();
}

/** Parses and sanitises trip preference input for API use. */
export function parsePreferences(input: unknown): PreferencesInput {
  return PreferencesInputSchema.parse(sanitiseUnknown(input));
}

/** Parses and sanitises realtime signal input for API use. */
export function parseSignal(input: unknown): RealtimeSignal {
  return RealtimeSignalSchema.parse(sanitiseUnknown(input));
}

/** Extracts raw JSON from Gemini text responses. */
function extractJson(text: string): unknown {
  const clean = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(clean);
}

/** Calls Gemini and validates the resulting itinerary against the shared schema. */
export async function askGeminiForItinerary(prompt: string, timeoutMs = 15_000): Promise<Itinerary> {
  const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 3000,
      responseMimeType: "application/json"
    }
  });
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs);
  });
  try {
    const result = await Promise.race([model.generateContent(prompt), timeout]);
    return ItinerarySchema.parse(extractJson(result.response.text()));
  } finally {
    clearTimeout(timer!);
  }
}

/** Builds a fast, valid itinerary when the model provider is unavailable or slow. */
export function fallbackItinerary(preferences: PreferencesInput): Itinerary {
  const destination = preferences.destination;
  const date = preferences.startDate;
  const foodNote = preferences.dietary.includes("jain")
    ? "Jain food confirm kar lena: no onion, garlic, potato."
    : preferences.dietary.includes("halal")
      ? "Halal counter pe certification pooch lena."
      : "Local thali options easy mil jayenge.";

  return ItinerarySchema.parse({
    destination,
    total_cost_inr: preferences.budgetPreset === "budget" ? 4200 : preferences.budgetPreset === "premium" ? 12500 : 7600,
    scores: {
      overall: 88,
      budget: preferences.budgetPreset === "budget" ? 91 : 86,
      dietary: preferences.dietary.length ? 90 : 82,
      accessibility: preferences.accessibilityNeeds ? 84 : 88,
      interests: 89,
      pace: preferences.pace === "slow" ? 92 : 87
    },
    constraints: [
      "Train-first route keeps cost predictable and avoids airport transfer friction.",
      "Activities are grouped by area to reduce backtracking.",
      foodNote
    ],
    festival_warnings: [],
    warnings: preferences.accessibilityNeeds ? ["Call venues before arrival to confirm current lift/ramp access."] : [],
    train: {
      train_name: "Recommended Express",
      train_number: "12000",
      from: "Nearest major rail hub",
      to: destination,
      class: "CC",
      fare_inr: preferences.budgetPreset === "premium" ? 1800 : 900,
      duration: "4h 30m",
      irctc_url: "https://www.irctc.co.in/nget/train-search"
    },
    days: [
      {
        day: 1,
        date,
        title: `${destination} essentials`,
        city: destination,
        estimated_cost_inr: preferences.budgetPreset === "premium" ? 6500 : 3200,
        activities: [
          {
            id: "arrival-route",
            time: "09:00",
            title: "Arrive by train and settle near the centre",
            location: `${destination} railway/central area`,
            category: "Transport",
            description: "Keep the first stop close to the station or hotel so the day starts without transfer stress.",
            local_tip: "Station se prepaid cab ya app cab lo, bargaining mein time waste mat karo.",
            cost_inr: 600,
            duration_minutes: 60,
            dietary_tags: preferences.dietary,
            accessibility_notes: preferences.accessibilityNeeds || "Prefer step-free cab pickup if carrying luggage.",
            must_do: false
          },
          {
            id: "heritage-anchor",
            time: "11:00",
            title: `${destination} heritage walk`,
            location: `Old ${destination}`,
            category: preferences.interests[0] || "Culture",
            description: "Visit the main heritage cluster first while energy and light are good.",
            local_tip: "Subah jao, crowd kam rahega aur photos bhi better aayenge.",
            cost_inr: 800,
            duration_minutes: 150,
            dietary_tags: preferences.dietary,
            accessibility_notes: preferences.accessibilityNeeds || "",
            must_do: true,
            alt_if_closed: {
              title: "Local museum or market cluster",
              reason: "Good backup if the main monument is crowded or closed.",
              cost_inr: 500
            }
          },
          {
            id: "local-food",
            time: "14:00",
            title: "Constraint-safe local meal",
            location: `${destination} central market`,
            category: "Food",
            description: "Choose a well-reviewed local restaurant that can handle dietary requirements clearly.",
            local_tip: foodNote,
            cost_inr: preferences.budgetPreset === "premium" ? 1800 : 700,
            duration_minutes: 75,
            dietary_tags: preferences.dietary,
            accessibility_notes: preferences.accessibilityNeeds || "",
            must_do: true
          },
          {
            id: "evening-market",
            time: "17:00",
            title: "Evening market and easy return",
            location: `${destination} market area`,
            category: "Shopping",
            description: "End with a flexible market stop close to food and transport, then return before late traffic builds.",
            local_tip: "Cash chhutta rakhna, small shops UPI kabhi-kabhi fail kar dete hain.",
            cost_inr: 1100,
            duration_minutes: 120,
            dietary_tags: preferences.dietary,
            accessibility_notes: preferences.accessibilityNeeds || "",
            must_do: false
          }
        ]
      }
    ]
  });
}

export const SYSTEM_PROMPT = `You are TripMind, a production India travel-planning engine that solves real traveller constraints, not a generic sightseeing bot. Return only raw JSON matching the itinerary schema. All costs must be in INR and realistic for India. Respect dietary rules: jain means no onion, garlic, or potato; halal means halal-certified meat only. Prefer train-first routing and include one practical train suggestion. Build days that are bookable, sequenced by geography, paced realistically, and resilient to closures, weather, crowds, accessibility needs, and budget limits. Every activity must include a practical Hinglish local_tip. Put business-critical tradeoffs in constraints and warnings: cost pressure, risky transfers, festival/school-holiday crowding, accessibility gaps, dietary risk, and timing bottlenecks. Flag Diwali, Holi, Eid, Kumbh Mela, and Indian school holiday impacts when dates overlap or crowds are likely. Optimize for budget, dietary needs, accessibility, user interests, requested pace, and traveller confidence.`;
