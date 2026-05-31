import { json, getUser, checkRateLimit, parsePreferences, requestId, edgeConfig, nodeRequest, sendNodeResponse } from "./_shared.js";

export const config = edgeConfig;

/** Handles authenticated preference persistence for future trip context. */
async function handleContext(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  try {
    const { supabase, user } = await getUser(req);
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, { "X-Request-Id": id });
    await checkRateLimit(user.id, "context");
    const preferences = parsePreferences(await req.json());
    const { error } = await supabase.from("preferences").upsert({
      user_id: user.id,
      data: preferences,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return json({ request_id: id, saved: true }, 200, { "X-Request-Id": id });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Unable to save context";
    return json({ request_id: id, error: message }, 500, { "X-Request-Id": id });
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handleContext(nodeRequest(req)));
}
