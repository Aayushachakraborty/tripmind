import { PreferencesInputSchema, type PreferencesInput } from "../lib/schemas";

export function sanitiseInput(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function validatePreferences(input: unknown): PreferencesInput {
  const parsed = PreferencesInputSchema.parse(input);
  return {
    ...parsed,
    destination: sanitiseInput(parsed.destination),
    accessibilityNeeds: parsed.accessibilityNeeds ? sanitiseInput(parsed.accessibilityNeeds) : ""
  };
}
