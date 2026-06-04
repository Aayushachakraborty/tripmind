import { memo } from "react";
import type { Itinerary } from "../lib/schemas";
import { track } from "../lib/analytics";
import { convertFromInr, formatMoney, type CurrencyCode } from "../hooks/useCurrencyRates";
import { formatTrainClass } from "../utils/formatters";

/** Displays the recommended train-first route for an itinerary. */
function TrainCardComponent({ train, currency = "USD", rates }: { train: Itinerary["train"]; currency?: CurrencyCode; rates?: Record<CurrencyCode, number> }) {
  return (
    <article className="train-card">
      <div>
        <p>Train / flight route</p>
        <h3>{train.train_name} <span>#{train.train_number}</span></h3>
        <p>{train.from} to {train.to} · {train.duration}</p>
      </div>
      <div>
        <strong>{formatTrainClass(train.class)}</strong>
        <span>{formatMoney(convertFromInr(train.fare_inr, currency, rates), currency)}</span>
        <a
          href={train.irctc_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("train_clicked", { train_number: train.train_number })}
        >
          Book route
        </a>
      </div>
    </article>
  );
}

export const TrainCard = memo(TrainCardComponent);
