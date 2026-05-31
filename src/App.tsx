import { Component, type ErrorInfo, lazy, type ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { PreferenceForm } from "./components/PreferenceForm";
import { RealtimeAlert } from "./components/RealtimeAlert";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { useOfflineCache } from "./hooks/useOfflineCache";
import { useRealtimeChannel } from "./hooks/useRealtimeChannel";
import { useTripPlanner } from "./hooks/useTripPlanner";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
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

/** Renders the TripMind single-page app shell and wires auth, alerts, cache, and planning. */
export default function App() {
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState("Plan");
  const planner = useTripPlanner();
  const cache = useOfflineCache();
  const realtime = useRealtimeChannel(planner.tripId);
  const { cachedItinerary, isFromCache, save } = cache;
  const { itinerary, setItinerary } = planner;

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!itinerary && cachedItinerary) setItinerary(cachedItinerary);
  }, [cachedItinerary, itinerary, setItinerary]);

  useEffect(() => {
    if (itinerary) save(itinerary);
  }, [itinerary, save]);

  const signIn = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAuthMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable sign-in.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setAuthMessage(error ? error.message : "Magic link sent. Check your inbox.");
  }, [email]);

  const submitPreferences = useCallback(async (preferences: PreferencesInput) => {
    if (!session) {
      setAuthMessage("Sign in with magic link before planning your trip.");
      return;
    }
    const response = await planner.plan(preferences);
    await fetch("/api/context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`
      },
      body: JSON.stringify(preferences)
    });
    if (response.trip_id) planner.setTripId(response.trip_id);
    setTab("Trips");
  }, [planner, session]);

  return (
    <ErrorBoundary>
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to planner</a>
      <header className="topbar">
        <div>
          <p>India travel planner</p>
          <h1>TripMind</h1>
        </div>
        <div className="auth-panel" aria-live="polite">
          {session ? (
            <>
              <span>{session.user.email}</span>
              <button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="button" onClick={signIn} disabled={!email && isSupabaseConfigured}>Magic link</button>
            </>
          )}
          {authMessage ? <small>{authMessage}</small> : null}
        </div>
      </header>

      <main id="main" className="main-grid">
        <section className={tab === "Plan" ? "panel visible" : "panel"}>
          <PreferenceForm
            disabled={!session}
            disabledReason={!session ? "Sign in with magic link to generate and save your itinerary." : ""}
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
              <p>Sign in, choose your preferences, and TripMind will plan a train-first India route.</p>
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

        <section className={tab === "Profile" ? "panel visible" : "panel profile-panel"}>
          <h2>Profile</h2>
          <p>{session ? "Your Supabase session is active." : "Use magic link sign-in to save trips and preferences."}</p>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Mobile sections">
        {["Plan", "Trips", "Alerts", "Profile"].map((item) => (
          <button type="button" className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <footer>
        <span>TripMind plans with Supabase realtime and Gemini reasoning.</span>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
