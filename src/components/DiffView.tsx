import { memo, useMemo } from "react";
import type { Itinerary } from "../lib/schemas";

function DiffViewComponent({ before, after }: { before: Itinerary; after: Itinerary }) {
  const oldActivities = useMemo(() => before.days.flatMap((day) => day.activities).slice(0, 4), [before]);
  const newActivities = useMemo(() => after.days.flatMap((day) => day.activities).slice(0, 4), [after]);

  return (
    <div className="diff-view" aria-label="Replan comparison">
      <div className="diff-old">
        <h4>Before</h4>
        {oldActivities.map((activity) => <p key={activity.id}>{activity.time} · {activity.title}</p>)}
      </div>
      <div className="diff-new">
        <h4>After</h4>
        {newActivities.map((activity) => <p key={activity.id}>{activity.time} · {activity.title}</p>)}
      </div>
    </div>
  );
}

export const DiffView = memo(DiffViewComponent);
