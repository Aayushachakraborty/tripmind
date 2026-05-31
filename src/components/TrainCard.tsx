import { memo } from "react";
import type { Itinerary } from "../lib/schemas";
import { formatINR, formatTrainClass } from "../utils/formatters";

function TrainCardComponent({ train }: { train: Itinerary["train"] }) {
  return (
    <article className="train-card">
      <div>
        <p>Train-first route</p>
        <h3>{train.train_name} <span>#{train.train_number}</span></h3>
        <p>{train.from} to {train.to} · {train.duration}</p>
      </div>
      <div>
        <strong>{formatTrainClass(train.class)}</strong>
        <span>{formatINR(train.fare_inr)}</span>
        <a href={train.irctc_url} target="_blank" rel="noopener noreferrer">Book on IRCTC</a>
      </div>
    </article>
  );
}

export const TrainCard = memo(TrainCardComponent);
