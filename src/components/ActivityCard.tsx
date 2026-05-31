import { memo, useState } from "react";
import type { Activity } from "../lib/schemas";
import { formatDuration, formatINR } from "../utils/formatters";

/** Displays a single itinerary activity with cost, dietary, and backup details. */
function ActivityCardComponent({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="activity-card">
      <div className="activity-head">
        <span className="category-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 2 4 6v6c0 5.2 3.4 8.7 8 10 4.6-1.3 8-4.8 8-10V6l-8-4Zm0 3.1 5 2.5V12c0 3.4-1.8 5.8-5 7-3.2-1.2-5-3.6-5-7V7.6l5-2.5Z" />
          </svg>
        </span>
        <div>
          <p className="activity-time">{activity.time} · {activity.category}</p>
          <h4>{activity.title}</h4>
          <p>{activity.location}</p>
        </div>
        {activity.must_do ? <span className="must-do">Must-do</span> : null}
      </div>
      <p>{activity.description}</p>
      <p className="local-tip">{activity.local_tip}</p>
      <div className="activity-meta">
        <span>{formatINR(activity.cost_inr)}</span>
        <span>{formatDuration(activity.duration_minutes)}</span>
      </div>
      <div className="toggle-row">
        {activity.dietary_tags.map((tag) => (
          <span className={`diet-pill ${tag}`} key={tag}>{tag}</span>
        ))}
      </div>
      {activity.accessibility_notes ? <p className="access-note">{activity.accessibility_notes}</p> : null}
      {activity.alt_if_closed ? (
        <div className="alt-box">
          <button className="link-button" type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Hide backup" : "Show backup"}
          </button>
          {open ? (
            <div>
              <strong>{activity.alt_if_closed.title}</strong>
              <p>{activity.alt_if_closed.reason}</p>
              <span>{formatINR(activity.alt_if_closed.cost_inr)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export const ActivityCard = memo(ActivityCardComponent);
