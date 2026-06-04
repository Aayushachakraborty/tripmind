import { Component, type ErrorInfo, lazy, type ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { CreatorWidget } from "./components/CreatorWidget";
import { DestinationHero, type SceneType } from "./components/DestinationHero";
import { GlobalControls } from "./components/GlobalControls";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { PreferenceForm } from "./components/PreferenceForm";
import { ReelImport } from "./components/ReelImport";
import { RealtimeAlert } from "./components/RealtimeAlert";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { WaitlistBanner } from "./components/WaitlistBanner";
import { useCurrencyRates, type CurrencyCode } from "./hooks/useCurrencyRates";
import { useOfflineCache } from "./hooks/useOfflineCache";
import { useRealtimeChannel } from "./hooks/useRealtimeChannel";
import { useReelImport } from "./hooks/useReelImport";
import { useTripPlanner } from "./hooks/useTripPlanner";
import { track } from "./lib/analytics";
import { strings, type LanguageCode } from "./i18n/strings";
import type { PreferencesInput } from "./lib/schemas";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./store/useAuthStore";

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
    console.error("SAFAR render error", error, info);
  }

  /** Renders either the app or the fallback error panel. */
  render() {
    if (this.state.error) {
      return (
        <main className="app-shell error-shell" role="alert">
          <section className="panel visible">
            <h1>SAFAR</h1>
            <p>Something went wrong while rendering. Refresh the page and try again.</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

/** Renders the SAFAR single-page app shell and wires alerts, cache, and planning. */
export default function App() {
  const [tab, setTab] = useState("Plan");
  const [activeScene, setActiveScene] = useState<SceneType>("mountains");
  const [language, setLanguage] = useState<LanguageCode>("EN");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [planningMode, setPlanningMode] = useState<"Manual" | "Reel">("Manual");
  const [importedPreferences, setImportedPreferences] = useState<PreferencesInput | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(() => localStorage.getItem("safar:onboarding-complete") === "true");
  const authUser = useAuthStore((state) => state.user);
  const setAuthSession = useAuthStore((state) => state.setSession);
  const setAuthLoading = useAuthStore((state) => state.setLoading);
  const planner = useTripPlanner();
  const reelImport = useReelImport();
  const rates = useCurrencyRates();
  const cache = useOfflineCache();
  const realtime = useRealtimeChannel(planner.tripId);
  const { cachedItinerary, isFromCache, save } = cache;
  const { itinerary, setItinerary } = planner;
  const widgetKey = new URLSearchParams(window.location.search).get("widget_key");
  const labels = strings[language];

  useEffect(() => {
    track("page_viewed", { page: "app" });
    setAuthLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session, data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session, session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, [setAuthLoading, setAuthSession]);

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

  useEffect(() => {
    if (reelImport.preferences) setImportedPreferences(reelImport.preferences);
  }, [reelImport.preferences]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem("safar:onboarding-complete", "true");
    setOnboardingComplete(true);
  }, []);

  const planWidgetDestination = useCallback((destination: string) => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 2);
    setImportedPreferences({
      destination,
      startDate: today.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      budgetPreset: "comfort",
      dietary: ["none"],
      pace: "balanced",
      interests: ["Culture", "Food"],
      groupType: "friends",
      transport: "mixed",
      accessibilityNeeds: ""
    });
    setPlanningMode("Manual");
    setTab("Plan");
  }, []);

  return (
    <ErrorBoundary>
    <div className="app-shell" dir={language === "AR" ? "rtl" : "ltr"}>
      <a href="#main" className="skip-link">Skip to planner</a>
      <div className="site-header" dir={language === "AR" ? "rtl" : "ltr"}>
        <strong>SAFAR</strong>
        <GlobalControls
          language={language}
          currency={currency}
          labels={{ language: labels.language, currency: labels.currency }}
          onLanguageChange={setLanguage}
          onCurrencyChange={setCurrency}
        />
      </div>
      <DestinationHero
        activeScene={activeScene}
        labels={labels}
        onSceneChange={setActiveScene}
        onSearch={(destination) => {
          const start = new Date();
          const end = new Date(start);
          end.setDate(start.getDate() + 4);
          setImportedPreferences({
            destination,
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            budgetPreset: "comfort",
            dietary: ["none"],
            pace: "balanced",
            interests: ["Culture", "Food", "Photography"],
            groupType: "couple",
            transport: "mixed",
            accessibilityNeeds: ""
          });
          setTab("Plan");
        }}
      />

      <main id="main" className="main-grid">
        {!authUser ? <WaitlistBanner /> : null}
        {authUser && !onboardingComplete ? (
          <section className="panel visible onboarding-panel">
            <OnboardingFlow onComplete={completeOnboarding} />
          </section>
        ) : null}
        {widgetKey ? <CreatorWidget widgetKey={widgetKey} onPlanThisTrip={planWidgetDestination} /> : null}

        <section className={tab === "Plan" ? "panel visible" : "panel"}>
          {!authUser ? (
            <AuthPanel />
          ) : (
            <>
              <AuthPanel userEmail={authUser.email} />
              <div className="mode-tabs" role="tablist" aria-label="Planner input mode">
                {["Manual", "Reel"].map((mode) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={planningMode === mode}
                    className={planningMode === mode ? "active" : ""}
                    key={mode}
                    onClick={() => setPlanningMode(mode as "Manual" | "Reel")}
                  >
                    {mode === "Manual" ? "Manual form" : "Import from Reel"}
                  </button>
                ))}
              </div>
              {planningMode === "Manual" ? (
                <PreferenceForm
                  loading={planner.loading}
                  onSubmit={submitPreferences}
                  initialValues={importedPreferences}
                  currency={currency}
                  rates={rates.data}
                />
              ) : (
                <ReelImport
                  loading={reelImport.loading}
                  error={reelImport.error}
                  preview={reelImport.data}
                  preferences={reelImport.preferences}
                  onExtract={reelImport.extractReel}
                  onConfirm={submitPreferences}
                  planning={planner.loading}
                />
              )}
            </>
          )}
          {planner.error ? <p className="error-text">{planner.error}</p> : null}
          {planner.requestId ? <p className="request-id">Request {planner.requestId}</p> : null}
        </section>

        <section className={tab === "Trips" ? "panel visible" : "panel"}>
          {planner.loading ? <SkeletonLoader /> : null}
          {planner.itinerary ? (
            <Suspense fallback={<SkeletonLoader />}>
              <ItineraryView itinerary={planner.itinerary} isFromCache={isFromCache} currency={currency} rates={rates.data} />
            </Suspense>
          ) : (
            <div className="empty-state">
              <h2>Your itinerary will appear here</h2>
              <p>Choose your preferences and SAFAR will plan a global route across flights, trains, stays, food, and events.</p>
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
        <span>SAFAR turns constraints into bookable global travel plans.</span>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
