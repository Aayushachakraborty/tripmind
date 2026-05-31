import { PreferencesInputSchema, type PreferencesInput } from "../lib/schemas.js";

/** Removes script tags, HTML tags, and javascript URLs from user-entered text. */
export function sanitiseInput(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/** Recursively sanitises any string values in a JSON-compatible structure. */
export function sanitiseUnknown<T>(input: T): T {
  if (typeof input === "string") return sanitiseInput(input) as T;
  if (Array.isArray(input)) return input.map((item) => sanitiseUnknown(item)) as T;
  if (input && typeof input === "object") {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, sanitiseUnknown(value)])) as T;
  }
  return input;
}

/** Validates and sanitises trip preference input from forms or API requests. */
export function validatePreferences(input: unknown): PreferencesInput {
  return PreferencesInputSchema.parse(sanitiseUnknown(input));
}
