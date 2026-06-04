import { json, getUser, checkRateLimit, sha256, parsePreferences, askGeminiForItinerary, fallbackItinerary, requestId, SYSTEM_PROMPT, edgeConfig, nodeRequest, sendNodeResponse, logAudit, logAnalytics, isResponse } from "./_shared.js";

export const config = edgeConfig;

/** Handles guest-first itinerary generation with saved-trip caching for signed-in users. */
async function handlePlan(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  const started = Date.now();
  let userId: string | null = null;
  let statusCode = 500;
  try {
    const { supabase, user } = await getUser(req);
    userId = user.id;
    if (req.method !== "POST") {
      statusCode = 405;
      return json({ request_id: id, error: "Method not allowed" }, statusCode, { "X-Request-Id": id });
    }
    await checkRateLimit(user.id, "plan");
    const body = await req.json();
    const preferences = parsePreferences(body);
    const source = preferences.source ?? "manual";
    const preferencesHash = await sha256(preferences);

    const cached = await supabase
          .from("trips")
          .select("id,itinerary_data")
          .eq("user_id", user.id)
          .eq("preferences_hash", preferencesHash)
          .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ;

    if (cached.data?.itinerary_data) {
      statusCode = 200;
      return json(
        { request_id: id, trip_id: cached.data.id, itinerary: cached.data.itinerary_data },
        200,
        { "X-Request-Id": id, "X-Cache": "hit" }
      );
    }

    const prompt = `${SYSTEM_PROMPT}

Preferences JSON:
${JSON.stringify(preferences)}

Return JSON with keys: destination, total_cost_inr, scores, constraints, festival_warnings, warnings, train, days. Each day must include activities with id, time, title, location, category, description, local_tip, cost_inr, duration_minutes, dietary_tags, accessibility_notes, must_do, and optional alt_if_closed.`;

    const itinerary = await askGeminiForItinerary(prompt, 15_000).catch(() => fallbackItinerary(preferences));

    const saved = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        destination: preferences.destination,
        date_from: preferences.startDate,
        date_to: preferences.endDate,
        preferences_snapshot: preferences,
        preferences_hash: preferencesHash,
        itinerary_data: itinerary,
        source,
        reel_url: preferences.reelUrl
      })
      .select("id")
      .single();
    if (saved.error) throw saved.error;
    await logAnalytics(user.id, "trip_planned", {
      destination: preferences.destination,
      budget: preferences.budgetPreset,
      dietary: preferences.dietary,
      days: itinerary.days.length,
      source
    });
    statusCode = 200;
    return json({ request_id: id, trip_id: saved.data.id, itinerary }, 200, { "X-Request-Id": id, "X-Cache": "miss" });
  } catch (error) {
    if (isResponse(error)) {
      statusCode = error.status;
      return error;
    }
    return json({ request_id: id, error: "Unable to plan trip" }, statusCode, { "X-Request-Id": id });
  } finally {
    await logAudit(req, userId, "plan", statusCode, Date.now() - started);
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handlePlan(nodeRequest(req)));
}
