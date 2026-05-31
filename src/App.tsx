import { Component, type ErrorInfo, lazy, type ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import { PreferenceForm } from "./components/PreferenceForm";
import { RealtimeAlert } from "./components/RealtimeAlert";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { useOfflineCache } from "./hooks/useOfflineCache";
import { useRealtimeChannel } from "./hooks/useRealtimeChannel";
import { useTripPlanner } from "./hooks/useTripPlanner";
import type { PreferencesInput } from "./lib/schemas";

const ItineraryView = lazy(() => import("./components/ItineraryView"));

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

/** Catches render-time failures so the app shows a recoverable message instead of a blank page. */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  /** Stores the thrown render error in component state. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /** Logs render failures for browser diagnostics. */
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("TripMind render error", error, info);
  }

  /** Renders either the app or the fallback error panel. */
  render() {
    if (this.state.error) {
      return (
        <main className="app-shell error-shell" role="alert">
          <section className="panel visible">
            <h1>TripMind</h1>
            <p>Something went wrong while rendering. Refresh the page and try again.</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

/** Renders the TripMind single-page app shell and wires alerts, cache, and planning. */
export default function App() {
  const [tab, setTab] = useState("Plan");
  const planner = useTripPlanner();
  const cache = useOfflineCache();
  const realtime = useRealtimeChannel(planner.tripId);
  const { cachedItinerary, isFromCache, save } = cache;
  const { itinerary, setItinerary } = planner;

  useEffect(() => {
    if (!itinerary && cachedItinerary) setItinerary(cachedItinerary);
  }, [cachedItinerary, itinerary, setItinerary]);

  useEffect(() => {
    if (itinerary) save(itinerary);
  }, [itinerary, save]);

  const submitPreferences = useCallback(async (preferences: PreferencesInput) => {
    const response = await planner.plan(preferences);
    if (response.trip_id) planner.setTripId(response.trip_id);
    setTab("Trips");
  }, [planner]);

  return (
    <ErrorBoundary>
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to planner</a>
      <header className="topbar">
        <div className="hero-copy">
          <p>India travel planner</p>
          <h1>TripMind</h1>
          <span>Plan practical, train-first India trips from real constraints.</span>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="india-orbit">
            <svg className="india-map" viewBox="0 0 220 260" role="img">
              <path d="M100 10c23 10 37 24 43 43l22 4 5 25-17 18 12 21-18 17 5 29-22 20-8 38-21 24-20-26 1-37-18-14 11-24-25-15 17-24-16-23 22-11-2-29 22-11 7-45Z" />
              <path className="route-line" d="M90 58 C122 82 131 109 113 137 C96 163 103 190 128 215" />
            </svg>
            <span className="route-dot dot-north" />
            <span className="route-dot dot-west" />
            <span className="route-dot dot-south" />
          </div>
          <div className="floating-ticket ticket-one">
            <strong>Delhi</strong>
            <span>06:10 train</span>
          </div>
          <div className="floating-ticket ticket-two">
            <strong>Jaipur</strong>
            <span>Fort + food</span>
          </div>
          <div className="floating-ticket ticket-three">
            <strong>Kochi</strong>
            <span>Slow day</span>
          </div>
        </div>
      </header>

      <main id="main" className="main-grid">
        <section className={tab === "Plan" ? "panel visible" : "panel"}>
          <PreferenceForm
            loading={planner.loading}
            onSubmit={submitPreferences}
          />
          {planner.error ? <p className="error-text">{planner.error}</p> : null}
          {planner.requestId ? <p className="request-id">Request {planner.requestId}</p> : null}
        </section>

        <section className={tab === "Trips" ? "panel visible" : "panel"}>
          {planner.loading ? <SkeletonLoader /> : null}
          {planner.itinerary ? (
            <Suspense fallback={<SkeletonLoader />}>
              <ItineraryView itinerary={planner.itinerary} isFromCache={isFromCache} />
            </Suspense>
          ) : (
            <div className="empty-state">
              <h2>Your itinerary will appear here</h2>
              <p>Choose your preferences and TripMind will plan a train-first India route.</p>
            </div>
          )}
        </section>

        <aside className={tab === "Alerts" ? "panel visible" : "panel alerts-panel"}>
          {realtime.signals.length ? (
            realtime.signals.map((signal, index) => (
              <RealtimeAlert
                key={`${signal.type}-${index}`}
                signal={signal}
                onDismiss={() => realtime.dismissSignal(index)}
                onReplan={planner.replan}
              />
            ))
          ) : (
            <div className="empty-state">
              <h2>No live alerts</h2>
              <p>Weather, train, road, and attraction changes will appear here for active trips.</p>
            </div>
          )}
        </aside>

      </main>

      <nav className="bottom-nav" aria-label="Mobile sections">
        {["Plan", "Trips", "Alerts"].map((item) => (
          <button type="button" className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <footer>
        <span>TripMind turns constraints into bookable India travel plans.</span>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
