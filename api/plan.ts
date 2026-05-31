import { json, getOptionalUser, checkRateLimit, sha256, parsePreferences, askGeminiForItinerary, fallbackItinerary, requestId, SYSTEM_PROMPT, edgeConfig } from "./_shared.js";

export const config = edgeConfig;

/** Handles guest-first itinerary generation with saved-trip caching for signed-in users. */
export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, { "X-Request-Id": id });
    const { supabase, user } = await getOptionalUser(req);
    if (user) await checkRateLimit(user.id, "plan");
    const body = await req.json();
    const preferences = parsePreferences(body);
    const preferencesHash = await sha256(preferences);

    const cached = user
      ? await supabase
          .from("trips")
          .select("id,data")
          .eq("user_id", user.id)
          .eq("preferences_hash", preferencesHash)
          .maybeSingle()
      : { data: null };

    if (cached.data?.data) {
      return json(
        { request_id: id, trip_id: cached.data.id, itinerary: cached.data.data },
        200,
        { "X-Request-Id": id, "X-TripMind-Cache": "hit" }
      );
    }

    const prompt = `${SYSTEM_PROMPT}

Preferences JSON:
${JSON.stringify(preferences)}

Return JSON with keys: destination, total_cost_inr, scores, constraints, festival_warnings, warnings, train, days. Each day must include activities with id, time, title, location, category, description, local_tip, cost_inr, duration_minutes, dietary_tags, accessibility_notes, must_do, and optional alt_if_closed.`;

    const itinerary = await Promise.race([
      askGeminiForItinerary(prompt, 8_000).catch(() => fallbackItinerary(preferences)),
      new Promise<ReturnType<typeof fallbackItinerary>>((resolve) => setTimeout(() => resolve(fallbackItinerary(preferences)), 9_000))
    ]);
    if (!user) return json({ request_id: id, itinerary }, 200, { "X-Request-Id": id });

    const saved = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        destination: preferences.destination,
        preferences_hash: preferencesHash,
        data: itinerary
      })
      .select("id")
      .single();
    if (saved.error) throw saved.error;
    return json({ request_id: id, trip_id: saved.data.id, itinerary }, 200, { "X-Request-Id": id });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Unable to plan trip";
    return json({ request_id: id, error: message }, 500, { "X-Request-Id": id });
  }
}
