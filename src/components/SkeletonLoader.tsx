import { memo } from "react";

/** Shows shimmer placeholders while itinerary content is loading. */
function SkeletonLoaderComponent() {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="Loading itinerary">
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
    </div>
  );
}

export const SkeletonLoader = memo(SkeletonLoaderComponent);
