/** Formats a number as Indian rupees without decimal places. */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

/** Formats an ISO date string for Indian English readers. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

/** Formats minutes as a compact hours/minutes duration string. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

/** Expands common Indian Railways class codes into readable labels. */
export function formatTrainClass(value: string): string {
  const map: Record<string, string> = {
    SL: "Sleeper",
    "3A": "AC 3 Tier",
    "2A": "AC 2 Tier",
    "1A": "AC First Class",
    CC: "Chair Car",
    EC: "Executive Chair Car"
  };
  return map[value.toUpperCase()] ?? value;
}
