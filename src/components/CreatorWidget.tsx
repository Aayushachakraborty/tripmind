import { useEffect, useState } from "react";
import { ItinerarySchema, type Itinerary } from "../lib/schemas";
import { track } from "../lib/analytics";
import { formatINR } from "../utils/formatters";

type WidgetResponse = {
  widget: {
    widget_key: string;
    reel_url?: string | null;
    itinerary_count: number;
    earnings_inr: number;
  };
  itinerary: unknown;
};

type Props = {
  widgetKey: string;
  onPlanThisTrip: (destination: string) => void;
};

/** Embeddable creator itinerary preview loaded by widget_key. */
export function CreatorWidget({ widgetKey, onPlanThisTrip }: Props) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/widget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widget_key: widgetKey })
        });
        const json = await response.json() as WidgetResponse;
        if (!response.ok) throw new Error("widget failed");
        const parsed = json.itinerary ? ItinerarySchema.safeParse(json.itinerary) : null;
        if (active) setItinerary(parsed?.success ? parsed.data : null);
      } catch {
        if (active) setError("Unable to load this creator itinerary.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [widgetKey]);

  if (loading) return <section className="creator-widget panel visible" aria-busy="true"><p>Loading creator itinerary...</p></section>;

  return (
    <section className="creator-widget panel visible" aria-labelledby="creator-widget-title">
      <h2 id="creator-widget-title">Creator trip widget</h2>
      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {itinerary ? (
        <>
          <p className="eyebrow">{itinerary.destination}</p>
          <h3>{formatINR(itinerary.total_cost_inr)} estimated trip</h3>
          <div className="constraint-box">
            {itinerary.days.slice(0, 3).map((day) => <span key={day.day}>Day {day.day}: {day.city}</span>)}
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={() => {
              track("creator_widget_clicked", { widget_key: widgetKey, destination: itinerary.destination });
              onPlanThisTrip(itinerary.destination);
            }}
          >
            Plan this trip
          </button>
        </>
      ) : !error ? (
        <p>This creator has not published an itinerary yet.</p>
      ) : null}
    </section>
  );
}
