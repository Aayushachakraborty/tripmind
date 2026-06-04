import { z } from "zod";

export const ActivitySchema = z.object({
  id: z.string().min(1),
  time: z.string().min(1),
  title: z.string().min(1),
  name: z.string().min(1).optional(),
  location: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  local_tip: z.string().min(1),
  cost_inr: z.number().int().nonnegative(),
  duration_minutes: z.number().int().positive(),
  dietary_tags: z.array(z.string()).default([]),
  dietary_options: z.array(z.string()).optional(),
  accessibility_notes: z.string().default(""),
  must_do: z.boolean().default(false),
  is_must_do: z.boolean().optional(),
  alt_if_closed: z
    .object({
      title: z.string(),
      reason: z.string(),
      cost_inr: z.number().int().nonnegative()
    })
    .optional()
});

export const DaySchema = z.object({
  day: z.number().int().positive(),
  date: z.string().min(1),
  title: z.string().min(1),
  city: z.string().min(1),
  estimated_cost_inr: z.number().int().nonnegative(),
  activities: z.array(ActivitySchema).min(1)
});

export const TrainSuggestionSchema = z.object({
  train_name: z.string().min(1),
  train_number: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  class: z.string().min(1),
  fare_inr: z.number().int().nonnegative(),
  duration: z.string().min(1),
  irctc_url: z.string().url()
});

export const ItinerarySchema = z.object({
  id: z.string().optional(),
  destination: z.string().min(1),
  total_cost_inr: z.number().int().nonnegative(),
  scores: z.object({
    overall: z.number().min(0).max(100),
    budget: z.number().min(0).max(100),
    dietary: z.number().min(0).max(100),
    accessibility: z.number().min(0).max(100),
    interests: z.number().min(0).max(100),
    pace: z.number().min(0).max(100)
  }),
  constraints: z.array(z.string()).default([]),
  constraint_explainer: z.array(z.object({
    constraint: z.string(),
    status: z.string(),
    explanation: z.string()
  })).optional(),
  festival_warnings: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  train: TrainSuggestionSchema,
  train_suggestion: TrainSuggestionSchema.optional(),
  preference_match_score: z.object({
    overall: z.number().min(0).max(100),
    budget: z.number().min(0).max(100),
    dietary: z.number().min(0).max(100),
    accessibility: z.number().min(0).max(100),
    interests: z.number().min(0).max(100),
    pace: z.number().min(0).max(100)
  }).optional(),
  days: z.array(DaySchema).min(1)
});

export const TripResponseSchema = z.object({
  request_id: z.string(),
  trip_id: z.string().optional(),
  itinerary: ItinerarySchema
});

export const ReelDataSchema = z.object({
  destination: z.string().min(1),
  places: z.array(z.string()).default([]),
  vibe: z.string().min(1),
  days: z.number().int().positive().max(30).default(3),
  keywords: z.array(z.string()).default([]),
  suggested_budget_inr: z.number().int().positive().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  location: z.string().optional(),
  platform: z.enum(["instagram", "youtube"]).optional()
});

export const PreferencesInputSchema = z.object({
  destination: z.string().min(2).max(80),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budgetPreset: z.enum(["backpacker", "comfort", "luxury", "budget", "premium"]),
  dietary: z.array(z.enum(["vegetarian", "vegan", "halal", "gluten_free", "kosher", "none", "veg", "jain", "egg", "nonveg"])).default([]),
  pace: z.enum(["relaxed", "balanced", "packed", "slow", "moderate", "fast"]),
  interests: z.array(z.string()).min(1).max(10),
  groupType: z.enum(["solo", "couple", "family", "friends", "senior"]),
  transport: z.enum(["train", "mixed", "flight", "road"]),
  accessibilityNeeds: z.string().max(300).optional(),
  source: z.enum(["manual", "reel_import"]).optional(),
  reelUrl: z.string().url().optional()
});

export const ContextInputSchema = z.object({
  profile: z.object({
    full_name: z.string().max(120).optional(),
    phone: z.string().max(30).optional(),
    preferred_language: z.string().max(12).default("en"),
    onboarding_complete: z.boolean().default(false)
  }).default({}),
  preferences: z.object({
    dietary: z.array(z.enum(["vegetarian", "vegan", "halal", "gluten_free", "kosher", "none", "veg", "jain", "egg", "nonveg"])).default([]),
    pace: z.enum(["relaxed", "balanced", "packed", "slow", "moderate", "fast"]).default("balanced"),
    budget_per_day_inr: z.number().int().min(500).max(100000).default(3500),
    interests: z.array(z.string()).max(10).default([]),
    group_type: z.enum(["solo", "couple", "family", "friends", "senior"]).default("couple"),
    home_city: z.string().max(80).optional(),
    accessibility_needs: z.array(z.string()).max(10).default([])
  }).default({})
});

export const WaitlistInputSchema = z.object({
  email: z.string().email().max(160),
  phone: z.string().max(30).optional(),
  source: z.string().max(80).optional()
});

export const WidgetInputSchema = z.object({
  widget_key: z.string().min(1).max(120)
});

export const AnalyticsEventSchema = z.object({
  event_name: z.enum([
    "page_viewed",
    "trip_planned",
    "reel_imported",
    "replan_triggered",
    "itinerary_shared",
    "hotel_clicked",
    "train_clicked",
    "waitlist_joined",
    "creator_widget_clicked",
    "activity_impression"
  ]),
  properties: z.record(z.unknown()).default({}),
  session_id: z.string().max(120).optional()
});

export const RealtimeSignalSchema = z.object({
  type: z.enum(["weather_update", "train_delay", "road_closure", "poi_closed"]),
  description: z.string().min(1).max(500),
  day: z.number().int().positive().optional(),
  activity_id: z.string().optional()
});

export type Activity = z.infer<typeof ActivitySchema>;
export type DayPlan = z.infer<typeof DaySchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
export type TripResponse = z.infer<typeof TripResponseSchema>;
export type ReelData = z.infer<typeof ReelDataSchema>;
export type PreferencesInput = z.infer<typeof PreferencesInputSchema>;
export type ContextInput = z.infer<typeof ContextInputSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type RealtimeSignal = z.infer<typeof RealtimeSignalSchema>;
