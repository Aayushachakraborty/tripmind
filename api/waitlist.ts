import { WaitlistInputSchema } from "../src/lib/schemas.js";
import { sanitiseUnknown } from "../src/utils/validators.js";
import { adminClient, edgeConfig, json, logAudit, nodeRequest, requestId, sendNodeResponse } from "./_shared.js";

export const config = edgeConfig;

async function handleWaitlist(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  const started = Date.now();
  let statusCode = 500;
  try {
    if (req.method !== "POST") {
      statusCode = 405;
      return json({ request_id: id, error: "Method not allowed" }, statusCode, { "X-Request-Id": id });
    }
    const input = WaitlistInputSchema.parse(sanitiseUnknown(await req.json()));
    const { error } = await adminClient().from("waitlist").insert(input);
    if (error && error.code !== "23505") throw error;
    statusCode = 200;
    return json({ request_id: id, success: true }, 200, { "X-Request-Id": id });
  } catch {
    return json({ request_id: id, error: "Unable to join waitlist" }, statusCode, { "X-Request-Id": id });
  } finally {
    await logAudit(req, null, "waitlist", statusCode, Date.now() - started);
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handleWaitlist(nodeRequest(req)));
}
