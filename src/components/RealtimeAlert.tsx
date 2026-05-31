import { memo, useState } from "react";
import type { Itinerary, RealtimeSignal } from "../lib/schemas";
import { DiffView } from "./DiffView";

type Props = {
  signal: RealtimeSignal;
  onDismiss: () => void;
  onReplan: (signal: RealtimeSignal) => Promise<{ before: Itinerary; after: Itinerary }>;
};

function RealtimeAlertComponent({ signal, onDismiss, onReplan }: Props) {
  const [diff, setDiff] = useState<{ before: Itinerary; after: Itinerary } | null>(null);
  const [loading, setLoading] = useState(false);

  async function runReplan() {
    setLoading(true);
    try {
      setDiff(await onReplan(signal));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="realtime-alert" role="alert">
      <div>
        <strong>{signal.type.replace("_", " ")}</strong>
        <p>{signal.description}</p>
      </div>
      <div className="alert-actions">
        <button type="button" onClick={runReplan} disabled={loading} aria-busy={loading}>
          {loading ? "Replanning..." : "Replan"}
        </button>
        <button type="button" onClick={onDismiss}>Dismiss</button>
      </div>
      {diff ? <DiffView before={diff.before} after={diff.after} /> : null}
    </section>
  );
}

export const RealtimeAlert = memo(RealtimeAlertComponent);
