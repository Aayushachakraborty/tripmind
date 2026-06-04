import { supabase } from "./supabase";

type PendingEvent = {
  event_name: string;
  properties: Record<string, unknown>;
  session_id: string;
};

const SESSION_KEY = "safar:analytics-session";
let queue: PendingEvent[] = [];
let timer: number | undefined;

function sessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

async function flush() {
  const batch = queue;
  queue = [];
  timer = undefined;
  if (!batch.length) return;
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await (supabase as any).from("analytics_events").insert(
      batch.map((event) => ({
        ...event,
        user_id: userId
      }))
    );
  } catch {
    // Analytics is fire-and-forget by design.
  }
}

export function track(event: string, properties: Record<string, unknown> = {}) {
  try {
    queue.push({
      event_name: event,
      properties,
      session_id: sessionId()
    });
    if (timer === undefined) timer = window.setTimeout(flush, 5_000);
  } catch {
    // Never throw from instrumentation.
  }
}
