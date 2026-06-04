import { FormEvent, useCallback, useState } from "react";
import { track } from "../lib/analytics";
import { sanitiseInput } from "../utils/validators";

/** Collects logged-out demand without requiring a Supabase session. */
export function WaitlistBanner() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitiseInput(email), phone: sanitiseInput(phone), source: "homepage" })
      });
      if (!response.ok) throw new Error("waitlist failed");
      track("waitlist_joined", { source: "homepage" });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [email, phone]);

  return (
    <section className="waitlist-banner" aria-labelledby="waitlist-title">
      <div>
        <h2 id="waitlist-title">Join SAFAR early access</h2>
        <p>Get notified when authenticated trip saving, creator widgets, and live disruption alerts open for your account.</p>
      </div>
      <form className="waitlist-form" onSubmit={submit}>
        <label htmlFor="waitlist-email" className="sr-only">Email</label>
        <input id="waitlist-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        <label htmlFor="waitlist-phone" className="sr-only">Phone</label>
        <input id="waitlist-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone optional" />
        <button type="submit" className="primary-action compact" disabled={status === "saving"} aria-busy={status === "saving"}>
          {status === "saving" ? "Joining..." : "Join"}
        </button>
      </form>
      {status === "saved" ? <p className="success-text" role="status">You are on the list.</p> : null}
      {status === "error" ? <p className="error-text" role="alert">Unable to join right now.</p> : null}
    </section>
  );
}
