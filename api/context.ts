import { json, getUser, checkRateLimit, parseContext, requestId, edgeConfig, nodeRequest, sendNodeResponse, logAudit, logAnalytics, isResponse } from "./_shared.js";

export const config = edgeConfig;

/** Handles authenticated preference persistence for future trip context. */
async function handleContext(req: Request): Promise<Response> {
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
    await checkRateLimit(user.id, "context");
    const input = parseContext(await req.json());
    const profile = {
      id: user.id,
      full_name: input.profile.full_name,
      phone: input.profile.phone,
      preferred_language: input.profile.preferred_language,
      onboarding_complete: input.profile.onboarding_complete
    };
    const profileResult = await supabase.from("users_profile").upsert(profile);
    if (profileResult.error) throw profileResult.error;

    const preferencesResult = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      ...input.preferences
    });
    if (preferencesResult.error) throw preferencesResult.error;
    await logAnalytics(user.id, "page_viewed", { page: "context_saved" });
    statusCode = 200;
    return json({ request_id: id, saved: true }, 200, { "X-Request-Id": id });
  } catch (error) {
    if (isResponse(error)) {
      statusCode = error.status;
      return error;
    }
    return json({ request_id: id, error: "Unable to save context" }, statusCode, { "X-Request-Id": id });
  } finally {
    await logAudit(req, userId, "context", statusCode, Date.now() - started);
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handleContext(nodeRequest(req)));
}
