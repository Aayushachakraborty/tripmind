import { FormEvent, useCallback, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { sanitiseInput } from "../utils/validators";

type Props = {
  userEmail?: string;
};

/** Handles Supabase email/password auth so secured SAFAR API routes receive a JWT. */
export function AuthPanel({ userEmail }: Props) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const safeEmail = sanitiseInput(email);
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: safeEmail, password })
        : await supabase.auth.signUp({ email: safeEmail, password });
      if (result.error) throw result.error;
      setMessage(mode === "signup" ? "Account created. Check email confirmation if your Supabase project requires it." : "Signed in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }, [email, mode, password]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("safar:onboarding-complete");
      setMessage("Signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <section className="auth-panel" role="alert">
        <h2>Connect Supabase</h2>
        <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to use secured planning.</p>
      </section>
    );
  }

  if (userEmail) {
    return (
      <section className="auth-panel signed-in" aria-label="Signed in session">
        <div>
          <h2>Signed in</h2>
          <p>{userEmail}</p>
        </div>
        <button className="secondary-action" type="button" onClick={signOut} disabled={loading} aria-busy={loading}>
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div>
        <h2 id="auth-title">Sign in to plan</h2>
        <p>SAFAR protects planning, reel imports, saved trips, and analytics behind your Supabase session.</p>
      </div>
      <form className="auth-form" onSubmit={submit} aria-busy={loading}>
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
        </div>
        <div className="form-actions">
          <button className="primary-action compact" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button className="link-button" type="button" onClick={() => setMode((value) => value === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create account" : "Use existing account"}
          </button>
        </div>
      </form>
      {message ? <p className="success-text" role="status">{message}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}
    </section>
  );
}
