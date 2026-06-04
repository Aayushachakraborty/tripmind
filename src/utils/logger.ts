const sensitiveKeys = new Set(["password", "token", "authorization", "access_token", "refresh_token", "secret", "api_key"]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sensitiveKeys.has(key.toLowerCase()) ? "[redacted]" : redact(item)])
    );
  }
  return value;
}

export function logInfo(message: string, details: Record<string, unknown> = {}) {
  console.info(message, redact(details));
}

export function logError(message: string, details: Record<string, unknown> = {}) {
  console.error(message, redact(details));
}
