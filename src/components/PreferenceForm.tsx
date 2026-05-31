import { FormEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { BUDGET_PRESETS, DIETARY_OPTIONS, INDIAN_CITIES, INTEREST_OPTIONS, PACE_OPTIONS } from "../constants";
import type { PreferencesInput } from "../lib/schemas";
import { formatINR } from "../utils/formatters";
import { sanitiseInput } from "../utils/validators";

type Props = {
  loading: boolean;
  onSubmit: (preferences: PreferencesInput) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

/** Renders the trip preferences form with debounced destination selection. */
function PreferenceFormComponent({ loading, onSubmit }: Props) {
  const [destinationDraft, setDestinationDraft] = useState("Jaipur");
  const [destination, setDestination] = useState("Jaipur");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [budgetPreset, setBudgetPreset] = useState<PreferencesInput["budgetPreset"]>("comfort");
  const [dietary, setDietary] = useState<PreferencesInput["dietary"]>(["veg"]);
  const [pace, setPace] = useState<PreferencesInput["pace"]>("moderate");
  const [interests, setInterests] = useState<string[]>(["History", "Food", "Local markets"]);
  const [groupType, setGroupType] = useState<PreferencesInput["groupType"]>("couple");
  const [transport, setTransport] = useState<PreferencesInput["transport"]>("train");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const popularCities = useMemo(() => [...INDIAN_CITIES], []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDestination(sanitiseInput(destinationDraft)), 300);
    return () => window.clearTimeout(timer);
  }, [destinationDraft]);

  const toggleDiet = useCallback((id: PreferencesInput["dietary"][number]) => {
    setDietary((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return id === "jain" && !next.includes("veg") ? [...next, "veg"] : next;
    });
  }, []);

  const toggleInterest = useCallback((value: string) => {
    setInterests((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }, []);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const safeDestination = sanitiseInput(destinationDraft || destination);
    try {
      await onSubmit({
        destination: safeDestination,
        startDate,
        endDate,
        budgetPreset,
        dietary,
        pace,
        interests,
        groupType,
        transport,
        accessibilityNeeds: sanitiseInput(accessibilityNeeds)
      });
    } catch {
      // The parent hook renders the user-facing error state.
    }
  }, [accessibilityNeeds, budgetPreset, destination, destinationDraft, dietary, endDate, groupType, interests, onSubmit, pace, startDate, transport]);

  return (
    <form className="planner-form" onSubmit={submit} aria-busy={loading}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="destination">Destination</label>
          <input id="destination" value={destinationDraft} onChange={(event) => setDestinationDraft(event.target.value)} required minLength={2} />
        </div>
        <div className="city-pills full" aria-label="Popular Indian cities">
          {popularCities.map((city) => (
            <button
              className={destination === city ? "pill active" : "pill"}
              type="button"
              key={city}
              onClick={() => {
                setDestinationDraft(city);
                setDestination(city);
              }}
            >
              {city}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="startDate">Start date</label>
          <input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="endDate">End date</label>
          <input id="endDate" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} required />
        </div>
      </div>

      <section className="choice-section" aria-labelledby="budget-title">
        <h2 id="budget-title">Budget</h2>
        <div className="card-options">
          {BUDGET_PRESETS.map((preset) => (
            <button type="button" className={budgetPreset === preset.id ? "option-card active" : "option-card"} key={preset.id} onClick={() => setBudgetPreset(preset.id)}>
              <strong>{preset.label}</strong>
              <span>{formatINR(preset.dailyMin)} to {formatINR(preset.dailyMax)} / day</span>
            </button>
          ))}
        </div>
      </section>

      <section className="choice-section" aria-labelledby="diet-title">
        <h2 id="diet-title">Food</h2>
        <div className="toggle-row">
          {DIETARY_OPTIONS.map((option) => (
            <button
              type="button"
              className={dietary.includes(option.id) ? `diet-pill ${option.id} active` : `diet-pill ${option.id}`}
              key={option.id}
              onClick={() => toggleDiet(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="choice-section" aria-labelledby="pace-title">
        <h2 id="pace-title">Pace</h2>
        <div className="card-options">
          {PACE_OPTIONS.map((option) => (
            <button type="button" className={pace === option.id ? "option-card active" : "option-card"} key={option.id} onClick={() => setPace(option.id)}>
              <strong>{option.label}</strong>
              <span>{option.hindi}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="choice-section" aria-labelledby="interest-title">
        <h2 id="interest-title">Interests</h2>
        <div className="toggle-row">
          {INTEREST_OPTIONS.map((interest) => (
            <button type="button" className={interests.includes(interest) ? "pill active" : "pill"} key={interest} onClick={() => toggleInterest(interest)}>
              {interest}
            </button>
          ))}
        </div>
      </section>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="groupType">Group</label>
          <select id="groupType" value={groupType} onChange={(event) => setGroupType(event.target.value as PreferencesInput["groupType"])}>
            <option value="solo">Solo</option>
            <option value="couple">Couple</option>
            <option value="family">Family</option>
            <option value="friends">Friends</option>
            <option value="senior">Senior travellers</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="transport">Transport</label>
          <select id="transport" value={transport} onChange={(event) => setTransport(event.target.value as PreferencesInput["transport"])}>
            <option value="train">Train first</option>
            <option value="mixed">Mixed</option>
            <option value="flight">Flight</option>
            <option value="road">Road</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="accessibilityNeeds">Accessibility needs</label>
          <textarea id="accessibilityNeeds" value={accessibilityNeeds} onChange={(event) => setAccessibilityNeeds(event.target.value)} maxLength={300} rows={3} />
        </div>
      </div>

      <button className="primary-action" type="submit" disabled={loading || interests.length === 0} aria-busy={loading}>
        {loading ? "Planning..." : "Plan my trip"}
      </button>
    </form>
  );
}

export const PreferenceForm = memo(PreferenceFormComponent);
