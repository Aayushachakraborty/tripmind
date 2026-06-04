export const DESTINATION_SUGGESTIONS = [
  "Swiss Alps",
  "Bali",
  "Tokyo",
  "Marrakech",
  "Santorini",
  "Patagonia",
  "New York",
  "Dubai",
  "Cape Town",
  "Kyoto",
  "Lisbon",
  "Reykjavik",
  "Banff",
  "Maldives",
  "Barcelona",
  "Queenstown",
  "Petra",
  "Rio de Janeiro",
  "Seoul",
  "Istanbul"
] as const;

export const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", color: "#15803d" },
  { id: "vegan", label: "Vegan", color: "#0f766e" },
  { id: "halal", label: "Halal", color: "#0f766e" },
  { id: "gluten_free", label: "Gluten-free", color: "#b45309" },
  { id: "kosher", label: "Kosher", color: "#4338ca" },
  { id: "none", label: "No preference", color: "#78716c" }
] as const;

export const BUDGET_PRESETS = [
  { id: "backpacker", label: "Backpacker", dailyMinUsd: 45, dailyMaxUsd: 95 },
  { id: "comfort", label: "Comfort", dailyMinUsd: 120, dailyMaxUsd: 260 },
  { id: "luxury", label: "Luxury", dailyMinUsd: 350, dailyMaxUsd: 900 }
] as const;

export const PACE_OPTIONS = [
  { id: "relaxed", label: "Relaxed", hint: "Slow mornings" },
  { id: "balanced", label: "Balanced", hint: "Room to breathe" },
  { id: "packed", label: "Packed", hint: "See more each day" }
] as const;

export const INTEREST_OPTIONS = [
  "Culture",
  "Food",
  "Adventure",
  "Nightlife",
  "Nature",
  "Wellness",
  "Photography",
  "Shopping"
] as const;
