export const INDIAN_CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Jaipur",
  "Ahmedabad",
  "Varanasi",
  "Goa",
  "Kochi",
  "Mysuru",
  "Udaipur",
  "Agra",
  "Amritsar",
  "Rishikesh",
  "Darjeeling",
  "Shillong",
  "Leh"
] as const;

export const DIETARY_OPTIONS = [
  { id: "veg", label: "Veg", color: "#15803d" },
  { id: "jain", label: "Jain", color: "#b45309" },
  { id: "halal", label: "Halal", color: "#0f766e" },
  { id: "egg", label: "Egg", color: "#ca8a04" },
  { id: "nonveg", label: "Non-veg", color: "#b91c1c" }
] as const;

export const BUDGET_PRESETS = [
  { id: "budget", label: "Budget", dailyMin: 1500, dailyMax: 3000 },
  { id: "comfort", label: "Comfort", dailyMin: 3500, dailyMax: 7000 },
  { id: "premium", label: "Premium", dailyMin: 9000, dailyMax: 18000 }
] as const;

export const PACE_OPTIONS = [
  { id: "slow", label: "Slow", hindi: "Aaram se" },
  { id: "moderate", label: "Moderate", hindi: "Theek-thaak" },
  { id: "fast", label: "Fast", hindi: "Tez raftaar" }
] as const;

export const INTEREST_OPTIONS = [
  "History",
  "Food",
  "Nature",
  "Shopping",
  "Spiritual",
  "Beaches",
  "Adventure",
  "Museums",
  "Nightlife",
  "Local markets"
] as const;
