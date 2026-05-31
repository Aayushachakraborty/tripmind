import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { ItinerarySchema, PreferencesInputSchema, RealtimeSignalSchema } from "../src/lib/schemas";
import type { Itinerary, PreferencesInput, RealtimeSignal } from "../src/lib/schemas";

declare const process: { env: Record<string, string | undefined> };

export const edgeConfig = { runtime: "edge" };

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...jsonHeaders, ...extraHeaders }
  });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function adminClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false }
  });
}

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

export async function sha256(input: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function requestId(): string {
  return crypto.randomUUID();
}

export function parsePreferences(input: unknown): PreferencesInput {
  return PreferencesInputSchema.parse(input);
}

export function parseSignal(input: unknown): RealtimeSignal {
  return RealtimeSignalSchema.parse(input);
}

function extractJson(text: string): unknown {
  const clean = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(clean);
}

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

export const SYSTEM_PROMPT = `You are TripMind, a production India travel-planning engine. Return only raw JSON matching the itinerary schema. All costs must be in INR. Respect dietary rules: jain means no onion, garlic, or potato; halal means halal-certified meat only. Prefer train-first routing and include one practical train suggestion. Every activity must include a Hinglish local_tip. Flag Diwali, Holi, Eid, Kumbh Mela, and Indian school holiday impacts when dates overlap or crowds are likely. Optimize for budget, dietary needs, accessibility, user interests, and requested pace.`;
