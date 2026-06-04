import { WidgetInputSchema } from "../src/lib/schemas.js";
import { sanitiseUnknown } from "../src/utils/validators.js";
import { adminClient, edgeConfig, json, logAudit, nodeRequest, requestId, sendNodeResponse } from "./_shared.js";

export const config = edgeConfig;

async function handleWidget(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  const started = Date.now();
  let statusCode = 500;
  try {
    if (req.method !== "POST") {
      statusCode = 405;
      return json({ request_id: id, error: "Method not allowed" }, statusCode, { "X-Request-Id": id });
    }
    const input = WidgetInputSchema.parse(sanitiseUnknown(await req.json()));
    const supabase = adminClient();
    const widget = await supabase
      .from("creator_widgets")
      .select("id,widget_key,reel_url,itinerary_count,earnings_inr,creator_user_id")
      .eq("widget_key", input.widget_key)
      .single();
    if (widget.error) {
      statusCode = 404;
      return json({ request_id: id, error: "Widget not found" }, statusCode, { "X-Request-Id": id });
    }
    await supabase
      .from("creator_widgets")
      .update({ itinerary_count: (widget.data.itinerary_count ?? 0) + 1 })
      .eq("id", widget.data.id);
    const latestTrip = await supabase
      .from("trips")
      .select("destination,itinerary_data,created_at")
      .eq("user_id", widget.data.creator_user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    statusCode = 200;
    return json({ request_id: id, widget: widget.data, itinerary: latestTrip.data?.itinerary_data ?? null }, 200, { "X-Request-Id": id });
  } catch {
    return json({ request_id: id, error: "Unable to load widget" }, statusCode, { "X-Request-Id": id });
  } finally {
    await logAudit(req, null, "widget", statusCode, Date.now() - started);
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handleWidget(nodeRequest(req)));
}
