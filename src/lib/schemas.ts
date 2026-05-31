import { z } from "zod";

export const ActivitySchema = z.object({
  id: z.string().min(1),
  time: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  local_tip: z.string().min(1),
  cost_inr: z.number().int().nonnegative(),
  duration_minutes: z.number().int().positive(),
  dietary_tags: z.array(z.string()).default([]),
  accessibility_notes: z.string().default(""),
  must_do: z.boolean().default(false),
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
  festival_warnings: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  train: TrainSuggestionSchema,
  days: z.array(DaySchema).min(1)
});

export const TripResponseSchema = z.object({
  request_id: z.string(),
  trip_id: z.string().optional(),
  itinerary: ItinerarySchema
});

export const PreferencesInputSchema = z.object({
  destination: z.string().min(2).max(80),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budgetPreset: z.enum(["budget", "comfort", "premium"]),
  dietary: z.array(z.enum(["veg", "jain", "halal", "egg", "nonveg"])).default([]),
  pace: z.enum(["slow", "moderate", "fast"]),
  interests: z.array(z.string()).min(1).max(10),
  groupType: z.enum(["solo", "couple", "family", "friends", "senior"]),
  transport: z.enum(["train", "mixed", "flight", "road"]),
  accessibilityNeeds: z.string().max(300).optional()
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
export type PreferencesInput = z.infer<typeof PreferencesInputSchema>;
export type RealtimeSignal = z.infer<typeof RealtimeSignalSchema>;
