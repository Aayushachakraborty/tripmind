import { memo } from "react";

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
