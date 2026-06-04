import { FormEvent, useCallback, useState } from "react";
import { INTEREST_OPTIONS } from "../constants";
import { supabase } from "../lib/supabase";
import { sanitiseInput } from "../utils/validators";

type Props = {
  onComplete: () => void;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

/** Four-step authenticated onboarding that persists profile and travel context. */
export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [homeCity, setHomeCity] = useState("Delhi");
  const [language, setLanguage] = useState("en");
  const [dietary, setDietary] = useState<string[]>(["veg"]);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [interests, setInterests] = useState<string[]>(["Food", "Local markets"]);
  const [pace, setPace] = useState<"slow" | "moderate" | "fast">("moderate");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = useCallback((interest: string) => {
    setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest].slice(0, 10));
  }, []);

  const toggleDietary = useCallback((item: string) => {
    setDietary((current) => {
      const next = current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
      return item === "jain" && !next.includes("veg") ? [...next, "veg"] : next;
    });
  }, []);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (step < 4) {
      setStep((value) => value + 1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/context", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          profile: {
            full_name: sanitiseInput(fullName),
            phone: sanitiseInput(phone),
            preferred_language: language,
            onboarding_complete: true
          },
          preferences: {
            dietary,
            pace,
            budget_per_day_inr: 3500,
            interests,
            group_type: "couple",
            home_city: sanitiseInput(homeCity),
            accessibility_needs: accessibilityNeeds.split(",").map(sanitiseInput).filter(Boolean)
          }
        })
      });
      if (!response.ok) throw new Error("context failed");
      onComplete();
    } catch {
      setError("Unable to save onboarding. Check your session and try again.");
    } finally {
      setSaving(false);
    }
  }, [accessibilityNeeds, dietary, fullName, homeCity, interests, language, onComplete, pace, phone, step]);

  return (
    <section className="onboarding-flow" aria-labelledby="onboarding-title">
      <h2 id="onboarding-title">Set up your SAFAR profile</h2>
      <form onSubmit={submit} className="planner-form" aria-busy={saving}>
        {step === 1 ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="onboarding-name">Full name</label>
              <input id="onboarding-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="onboarding-phone">Phone</label>
              <input id="onboarding-phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="onboarding-city">Home city</label>
              <input id="onboarding-city" value={homeCity} onChange={(event) => setHomeCity(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="onboarding-language">Language</label>
              <select id="onboarding-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <>
            <div className="toggle-row" aria-label="Dietary preferences">
              {["veg", "jain", "halal", "egg", "nonveg"].map((item) => (
                <button type="button" key={item} className={dietary.includes(item) ? `diet-pill ${item} active` : `diet-pill ${item}`} onClick={() => toggleDietary(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="onboarding-access">Accessibility needs</label>
              <textarea id="onboarding-access" value={accessibilityNeeds} onChange={(event) => setAccessibilityNeeds(event.target.value)} rows={3} placeholder="Comma-separated needs" />
            </div>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <div className="toggle-row" aria-label="Interest preferences">
              {INTEREST_OPTIONS.map((interest) => (
                <button type="button" key={interest} className={interests.includes(interest) ? "pill active" : "pill"} onClick={() => toggleInterest(interest)}>
                  {interest}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="onboarding-pace">Pace</label>
              <select id="onboarding-pace" value={pace} onChange={(event) => setPace(event.target.value as typeof pace)}>
                <option value="slow">Slow</option>
                <option value="moderate">Moderate</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </>
        ) : null}
        {error ? <p className="error-text" role="alert">{error}</p> : null}
        <div className="form-actions">
          {step > 1 ? <button className="secondary-action" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : null}
          <button className="primary-action compact" type="submit" disabled={saving || (step === 4 && interests.length === 0)} aria-busy={saving}>
            {step < 4 ? "Next" : saving ? "Saving..." : "Complete onboarding"}
          </button>
        </div>
      </form>
    </section>
  );
}
