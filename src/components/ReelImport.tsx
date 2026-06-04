import { FormEvent, useCallback, useState } from "react";
import type { PreferencesInput } from "../lib/schemas";

type ReelPreview = {
  destination: string;
  places: string[];
  vibe: string;
  days: number;
  keywords: string[];
};

type Props = {
  loading: boolean;
  error: string;
  preview: ReelPreview | null;
  preferences: PreferencesInput | null;
  onExtract: (url: string) => Promise<unknown>;
  onConfirm: (preferences: PreferencesInput) => Promise<void>;
  planning: boolean;
};

/** Lets travellers import a travel video and turn the extracted context into a SAFAR plan. */
export function ReelImport({ loading, error, preview, preferences, onExtract, onConfirm, planning }: Props) {
  const [url, setUrl] = useState("");
  const [clipboardError, setClipboardError] = useState("");

  const pasteFromClipboard = useCallback(async () => {
    setClipboardError("");
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      setClipboardError("Clipboard permission was blocked. Paste the Reel URL manually.");
    }
  }, []);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      try {
        await onExtract(url);
      } catch {
        // Hook-owned error state is rendered below.
      }
    },
    [onExtract, url]
  );

  const confirm = useCallback(async () => {
    if (!preferences) return;
    try {
      await onConfirm(preferences);
    } catch {
      // The planner hook renders its own error in App.
    }
  }, [onConfirm, preferences]);

  return (
    <div className="reel-import">
      <form className="reel-url-row" onSubmit={submit} aria-busy={loading}>
        <div className="field">
          <label htmlFor="reel-url">Instagram Reel URL</label>
          <input
            id="reel-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            required
          />
        </div>
        <button className="secondary-action" type="button" onClick={pasteFromClipboard} disabled={loading || planning}>
          Paste
        </button>
        <button className="primary-action compact" type="submit" disabled={loading || planning || !url.trim()} aria-busy={loading}>
          {loading ? "Extracting..." : "Extract"}
        </button>
      </form>

      {clipboardError ? <p className="error-text">{clipboardError}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {preview ? (
        <section className="reel-preview" aria-labelledby="reel-preview-title">
          <h2 id="reel-preview-title">Reel preview</h2>
          <div className="preview-row">
            <span className="preview-label">Destination</span>
            <span className="pill active">{preview.destination}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Places</span>
            <div className="toggle-row">
              {preview.places.length ? preview.places.map((place) => <span className="pill" key={place}>{place}</span>) : <span className="pill">Not specified</span>}
            </div>
          </div>
          <div className="preview-row">
            <span className="preview-label">Vibe</span>
            <span className="pill">{preview.vibe}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Duration</span>
            <span className="pill">{preview.days} day{preview.days === 1 ? "" : "s"}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Keywords</span>
            <div className="toggle-row">
              {preview.keywords.slice(0, 8).map((keyword) => <span className="pill" key={keyword}>{keyword}</span>)}
            </div>
          </div>
          <button className="primary-action" type="button" disabled={!preferences || planning} onClick={confirm}>
            {planning ? "Planning..." : "Confirm and plan"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
