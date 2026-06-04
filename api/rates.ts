import { z } from "zod";
import { edgeConfig, getUser, isResponse, json, logAudit, nodeRequest, requestId, sendNodeResponse } from "./_shared.js";

export const config = edgeConfig;

const RatesSchema = z.object({
  rates: z.record(z.number().positive())
});

const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.4,
  JPY: 156,
  AED: 3.67,
  SGD: 1.35,
  AUD: 1.51,
  CAD: 1.37,
  BRL: 5.25
};

async function handleRates(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({});

  const id = requestId();
  const started = Date.now();
  let userId: string | null = null;
  let statusCode = 500;
  try {
    const { user } = await getUser(req);
    userId = user.id;
    if (req.method !== "GET" && req.method !== "POST") {
      statusCode = 405;
      return json({ request_id: id, error: "Method not allowed" }, statusCode, { "X-Request-Id": id });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("https://api.frankfurter.app/latest?from=USD", { signal: controller.signal });
      if (!response.ok) throw new Error("Rates provider unavailable");
      const parsed = RatesSchema.parse(await response.json());
      statusCode = 200;
      return json({ request_id: id, base: "USD", rates: { ...fallbackRates, ...parsed.rates, USD: 1 } }, 200, {
        "X-Request-Id": id,
        "Cache-Control": "s-maxage=3600, max-age=3600"
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    if (isResponse(error)) {
      statusCode = error.status;
      return error;
    }
    statusCode = 200;
    return json({ request_id: id, base: "USD", rates: fallbackRates, fallback: true }, 200, {
      "X-Request-Id": id,
      "Cache-Control": "s-maxage=3600, max-age=3600"
    });
  } finally {
    await logAudit(req, userId, "rates", statusCode, Date.now() - started);
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handleRates(nodeRequest(req)));
}
