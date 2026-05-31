import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTripPlanner } from "./useTripPlanner";

vi.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "token" } } })
    }
  }
}));

const itinerary = {
  destination: "Jaipur",
  total_cost_inr: 5000,
  scores: { overall: 90, budget: 90, dietary: 90, accessibility: 90, interests: 90, pace: 90 },
  constraints: [],
  festival_warnings: [],
  warnings: [],
  train: {
    train_name: "Ajmer Shatabdi",
    train_number: "12015",
    from: "Delhi",
    to: "Jaipur",
    class: "CC",
    fare_inr: 900,
    duration: "4 hr 30 min",
    irctc_url: "https://www.irctc.co.in/"
  },
  days: [
    {
      day: 1,
      date: "2026-06-10",
      title: "Pink City",
      city: "Jaipur",
      estimated_cost_inr: 2500,
      activities: [
        {
          id: "a1",
          time: "09:00",
          title: "Amber Fort",
          location: "Amber",
          category: "History",
          description: "Explore the fort.",
          local_tip: "Subah jaldi jaana, bheed kam milegi.",
          cost_inr: 500,
          duration_minutes: 120,
          dietary_tags: ["veg"],
          accessibility_notes: "Some ramps available.",
          must_do: true
        }
      ]
    }
  ]
};

const preferences = {
  destination: "Jaipur",
  startDate: "2026-06-10",
  endDate: "2026-06-12",
  budgetPreset: "comfort" as const,
  dietary: ["veg" as const],
  pace: "moderate" as const,
  interests: ["History"],
  groupType: "couple" as const,
  transport: "train" as const,
  accessibilityNeeds: ""
};

describe("useTripPlanner", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ request_id: "req_1", trip_id: "trip_1", itinerary })
    }));
  });

  it("plans a trip and stores itinerary state", async () => {
    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.plan(preferences);
    });

    expect(result.current.itinerary?.destination).toBe("Jaipur");
    expect(result.current.tripId).toBe("trip_1");
    expect(result.current.requestId).toBe("req_1");
  });
});
