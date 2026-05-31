import { memo, useState } from "react";
import type { Itinerary } from "../lib/schemas";

const labels: Record<keyof Itinerary["scores"], string> = {
  overall: "Overall",
  budget: "Budget",
  dietary: "Dietary",
  accessibility: "Access",
  interests: "Interests",
  pace: "Pace"
};

function ScoreDashboardComponent({ scores }: { scores: Itinerary["scores"] }) {
  const [active, setActive] = useState<string>("");

  return (
    <section className="score-dashboard" aria-label="Trip quality scores">
      {(Object.keys(labels) as Array<keyof Itinerary["scores"]>).map((key) => (
        <button
          aria-expanded={active === key}
          className="score-row"
          type="button"
          key={key}
          onClick={() => setActive(active === key ? "" : key)}
        >
          <span>{labels[key]}</span>
          <span className="score-track" aria-hidden="true">
            <span className="score-fill" style={{ width: `${scores[key]}%` }} />
          </span>
          <strong>{scores[key]}</strong>
          {active === key ? <em>{labels[key]} fit is scored from 0 to 100.</em> : null}
        </button>
      ))}
    </section>
  );
}

export const ScoreDashboard = memo(ScoreDashboardComponent);
