import { memo, useEffect, useRef, useState } from "react";
import type { Itinerary } from "../lib/schemas";
import { track } from "../lib/analytics";
import { convertFromInr, formatMoney, type CurrencyCode } from "../hooks/useCurrencyRates";
import { formatDate } from "../utils/formatters";
import { ActivityCard } from "./ActivityCard";
import { ScoreDashboard } from "./ScoreDashboard";
import { TrainCard } from "./TrainCard";

/** Renders the full itinerary timeline, warnings, scores, and train recommendation. */
function ItineraryViewComponent({ itinerary, isFromCache, currency = "USD", rates }: { itinerary: Itinerary; isFromCache: boolean; currency?: CurrencyCode; rates?: Record<CurrencyCode, number> }) {
  const [warnings, setWarnings] = useState(itinerary.warnings);
  const [shareStatus, setShareStatus] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [itinerary]);

  async function shareItinerary() {
    const shareUrl = `${window.location.origin}${window.location.pathname}#trip=${encodeURIComponent(itinerary.destination)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `SAFAR ${itinerary.destination} itinerary`, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
      track("itinerary_shared", { trip_id: itinerary.id ?? "", destination: itinerary.destination });
      setShareStatus("Share link copied.");
    } catch {
      setShareStatus("Unable to share right now.");
    }
  }

  return (
    <section className="itinerary-view" aria-labelledby="itinerary-title">
      <header className="itinerary-header">
        <div>
          <p>{itinerary.destination}</p>
          <h2 id="itinerary-title" ref={titleRef} tabIndex={-1}>{formatMoney(convertFromInr(itinerary.total_cost_inr, currency, rates), currency)} estimated total</h2>
        </div>
        <div className="header-actions">
          {isFromCache ? <span className="offline-badge">Offline cache</span> : null}
          <button type="button" onClick={shareItinerary}>Share</button>
          <button type="button" onClick={() => window.print()}>Print</button>
        </div>
      </header>
      {shareStatus ? <p className="request-id" role="status">{shareStatus}</p> : null}

      <ScoreDashboard scores={itinerary.scores} />

      <div className="constraint-box">
        {itinerary.constraints.map((item) => <span key={item}>{item}</span>)}
      </div>

      <TrainCard train={itinerary.train} currency={currency} rates={rates} />

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
              <strong>{formatMoney(convertFromInr(day.estimated_cost_inr, currency, rates), currency)}</strong>
            </header>
            <div className="activity-list">
              {day.activities.map((activity) => <ActivityCard activity={activity} currency={currency} rates={rates} key={activity.id} />)}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export default memo(ItineraryViewComponent);
