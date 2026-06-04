export type GeminiJsonRequest<T> = {
  prompt: string;
  schemaName: string;
  parse: (value: unknown) => T;
};

/** Client-safe Gemini wrapper facade; actual model calls stay in authenticated serverless functions. */
export async function generateServerJson<T>({ prompt, schemaName, parse }: GeminiJsonRequest<T>): Promise<T> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, schemaName })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Gemini request failed");
  return parse(json);
}
