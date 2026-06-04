import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { ReelDataSchema } from "../src/lib/schemas.js";
import { sanitiseUnknown } from "../src/utils/validators.js";
import { checkRateLimit, edgeConfig, getUser, isResponse, json, logAnalytics, logAudit, nodeRequest, requireEnv, requestId, sendNodeResponse } from "./_shared.js";

declare const process: { env: Record<string, string | undefined> };

export const config = edgeConfig;

const ExtractBodySchema = z.object({
  url: z.string().url()
});

const GEMINI_PROMPT = `Extract destination, specific places mentioned, travel vibe, estimated trip duration, and suggested budget from this travel video caption.
Return JSON: { destination, places[], vibe, days, keywords[], suggested_budget_inr }`;

type Platform = "instagram" | "youtube";

function detectPlatform(value: string): Platform | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "instagram.com" && /^\/reel\/[^/]+\/?/i.test(url.pathname)) return "instagram";
    if ((host === "youtube.com" || host === "youtu.be") && (/^\/shorts\/[^/]+\/?/i.test(url.pathname) || host === "youtu.be")) return "youtube";
    return null;
  } catch {
    return null;
  }
}

function extractJson(text: string): unknown {
  const clean = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(clean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) return String((item as { name: unknown }).name);
      if (item && typeof item === "object" && "username" in item) return String((item as { username: unknown }).username);
      return "";
    })
    .filter(Boolean);
}

function hashtagWords(caption: string): string[] {
  return unique(Array.from(caption.matchAll(/#([\p{L}\p{N}_]+)/gu)).map((match) => match[1]));
}

function readString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normaliseScraperItem(item: unknown) {
  const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const caption = readString(record, ["caption", "text", "description", "title", "alt"]);
  const location = readString(record, ["locationName", "location", "venueName"]);
  const imageUrl = readString(record, ["displayUrl", "thumbnailUrl", "thumbnail", "imageUrl"]);
  const mentionedPlaces = unique([...toStringArray(record.taggedPlaces), ...toStringArray(record.mentions)]);
  const hashtags = unique([...toStringArray(record.hashtags), ...hashtagWords(caption)]);
  return { caption, hashtags, location, mentionedPlaces, imageUrl };
}

async function fetchVideo(url: string, platform: Platform) {
  const token = process.env.APIFY_API_KEY || requireEnv("APIFY_API_TOKEN");
  const actor = platform === "instagram" ? "apify~instagram-scraper" : "streamers~youtube-shorts-scraper";
  const payload = platform === "instagram"
    ? { directUrls: [url], resultsLimit: 1, resultsType: "posts", searchType: "hashtag" }
    : { startUrls: [{ url }], maxResults: 1 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("Scraper request failed");
    const items = await response.json();
    if (!Array.isArray(items) || !items.length) throw new Error("No public video data found");
    return normaliseScraperItem(items[0]);
  } finally {
    clearTimeout(timer);
  }
}

async function imagePartFromUrl(url: string) {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const buffer = await response.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buffer));
    const base64 = btoa(String.fromCharCode(...bytes));
    return { inlineData: { data: base64, mimeType } };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function extractWithGemini(caption: string, hashtags: string[], location: string, imageUrl: string) {
  const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 900,
      responseMimeType: "application/json"
    }
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const prompt = `${GEMINI_PROMPT}

Caption:
${caption || "No caption available"}

Hashtags:
${hashtags.join(", ") || "None"}

Location:
${location || "None"}`;
    const imagePart = await imagePartFromUrl(imageUrl);
    const result = imagePart
      ? await model.generateContent([prompt, imagePart], { signal: controller.signal } as never)
      : await model.generateContent(prompt, { signal: controller.signal } as never);
    return ReelDataSchema.pick({
      destination: true,
      places: true,
      vibe: true,
      days: true,
      keywords: true,
      suggested_budget_inr: true
    }).parse(extractJson(result.response.text()));
  } finally {
    clearTimeout(timer);
  }
}

async function handleExtractReel(req: Request): Promise<Response> {
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
    await checkRateLimit(user.id, "extract-reel", 5, 60 * 60_000);
    const body = ExtractBodySchema.parse(sanitiseUnknown(await req.json()));
    const platform = detectPlatform(body.url);
    if (!platform) {
      statusCode = 400;
      return json({ request_id: id, error: "Use a valid Instagram Reel or YouTube Shorts URL." }, statusCode, { "X-Request-Id": id });
    }

    const pending = await supabase.from("reel_imports").insert({
      user_id: user.id,
      reel_url: body.url,
      platform,
      status: "pending"
    }).select("id").single();
    if (pending.error) throw pending.error;

    const video = await fetchVideo(body.url, platform);
    const modelData = await extractWithGemini(video.caption, video.hashtags, video.location, video.imageUrl);
    const extracted = ReelDataSchema.parse({
      ...modelData,
      places: unique([...modelData.places, ...video.mentionedPlaces]),
      keywords: unique([...modelData.keywords, ...video.hashtags]),
      caption: video.caption,
      hashtags: video.hashtags,
      location: video.location || undefined,
      platform
    });

    await supabase.from("reel_imports").update({
      extracted_data: extracted,
      status: "success"
    }).eq("id", pending.data.id).eq("user_id", user.id);
    await logAnalytics(user.id, "reel_imported", { platform, destination: extracted.destination });

    statusCode = 200;
    return json(extracted, 200, { "X-Request-Id": id });
  } catch (error) {
    if (isResponse(error)) {
      statusCode = error.status;
      return error;
    }
    return json({ request_id: id, error: "Unable to extract video" }, statusCode, { "X-Request-Id": id });
  } finally {
    await logAudit(req, userId, "extract-reel", statusCode, Date.now() - started);
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await sendNodeResponse(res, await handleExtractReel(nodeRequest(req)));
}
