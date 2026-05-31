import { memo, useEffect, useRef, useState } from "react";
import type { Itinerary } from "../lib/schemas";
import { formatDate, formatINR } from "../utils/formatters";
import { ActivityCard } from "./ActivityCard";
import { ScoreDashboard } from "./ScoreDashboard";
import { TrainCard } from "./TrainCard";

/** Renders the full itinerary timeline, warnings, scores, and train recommendation. */
function ItineraryViewComponent({ itinerary, isFromCache }: { itinerary: Itinerary; isFromCache: boolean }) {
  const [warnings, setWarnings] = useState(itinerary.warnings);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [itinerary]);

  return (
    <section className="itinerary-view" aria-labelledby="itinerary-title">
      <header className="itinerary-header">
        <div>
          <p>{itinerary.destination}</p>
          <h2 id="itinerary-title" ref={titleRef} tabIndex={-1}>{formatINR(itinerary.total_cost_inr)} estimated total</h2>
        </div>
        <div className="header-actions">
          {isFromCache ? <span className="offline-badge">Offline cache</span> : null}
          <button type="button" onClick={() => window.print()}>Print</button>
        </div>
      </header>

      <ScoreDashboard scores={itinerary.scores} />

      <div className="constraint-box">
        {itinerary.constraints.map((item) => <span key={item}>{item}</span>)}
      </div>

      <TrainCard train={itinerary.train} />

      <div className="festival-row">
        {itinerary.festival_warnings.map((warning) => <span className="festival-badge" key={warning}>{warning}</span>)}
      </div>

      {warnings.map((warning) => (
        <div className="warning-alert" key={warning} role="alert" aria-live="polite">
          <span>{warning}</span>
          <button type="button" onClick={() => setWarnings((items) => items.filter((item) => item !== warning))}>Dismiss</button>
        </div>
      ))}

      <div className="timeline">
        {itinerary.days.map((day) => (
          <section className="day-section" key={`${day.day}-${day.date}`}>
            <div className="timeline-dot" />
            <header>
              <span className="date-chip">Day {day.day} · {formatDate(day.date)}</span>
              <h3>{day.title}</h3>
              <p>{day.city}</p>
              <strong>{formatINR(day.estimated_cost_inr)}</strong>
            </header>
            <div className="activity-list">
              {day.activities.map((activity) => <ActivityCard activity={activity} key={activity.id} />)}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export default memo(ItineraryViewComponent);
