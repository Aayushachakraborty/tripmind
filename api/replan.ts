import { ItinerarySchema } from "../src/lib/schemas";
import { json, getUser, checkRateLimit, parseSignal, askGeminiForItinerary, requestId, SYSTEM_PROMPT, edgeConfig } from "./_shared";

export const config = edgeConfig;

/** Handles authenticated itinerary patching after realtime disruption signals. */
export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  try {
    const { supabase, user } = await getUser(req);
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, { "X-Request-Id": id });
    await checkRateLimit(user.id, "replan");
    const body = await req.json();
    const tripId = String(body.trip_id ?? "");
    const signal = parseSignal(body.signal);
    const currentItinerary = ItinerarySchema.parse(body.current_itinerary);
    if (!tripId) return json({ request_id: id, error: "trip_id is required" }, 400, { "X-Request-Id": id });

    const trip = await supabase.from("trips").select("id").eq("id", tripId).eq("user_id", user.id).single();
    if (trip.error) return json({ request_id: id, error: "Trip not found" }, 404, { "X-Request-Id": id });

    const prompt = `${SYSTEM_PROMPT}

Replan only the affected segments. Preserve all unaffected days and activities exactly where possible.
Signal JSON:
${JSON.stringify(signal)}

Current itinerary JSON:
${JSON.stringify(currentItinerary)}

Return the full updated itinerary JSON with the same schema.`;

    const itinerary = await askGeminiForItinerary(prompt);
    const latest = await supabase
      .from("itinerary_versions")
      .select("version")
      .eq("trip_id", tripId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (latest.data?.version ?? 0) + 1;
    await supabase.from("itinerary_versions").insert({ trip_id: tripId, version, data: itinerary });
    await supabase.from("trips").update({ data: itinerary }).eq("id", tripId).eq("user_id", user.id);

    return json({ request_id: id, trip_id: tripId, version, itinerary }, 200, { "X-Request-Id": id });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Unable to replan trip";
    return json({ request_id: id, error: message }, 500, { "X-Request-Id": id });
  }
}
