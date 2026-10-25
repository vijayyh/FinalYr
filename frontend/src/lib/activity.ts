// Per-browser activity log that powers the dashboard. Stored in localStorage, so it is a
// convenience only: every read/write is guarded and the app works the same without it.

export type ActivityType = "ats" | "cover-letter" | "interview" | "resume" | "linkedin" | "skill-gap";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  /** Normalised 0–100 score when the tool produces one. */
  score?: number;
  at: number;
}

const KEY = "resumepro_activity_v1";
const MAX_ITEMS = 100;
export const ACTIVITY_EVENT = "resumepro:activity";

export function getActivity(): Activity[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.type === "string" && typeof a.at === "number") : [];
  } catch {
    return [];
  }
}

export function recordActivity(entry: { type: ActivityType; title: string; score?: number }) {
  try {
    const score = typeof entry.score === "number" && Number.isFinite(entry.score)
      ? Math.max(0, Math.min(100, Math.round(entry.score)))
      : undefined;
    const item: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: entry.type,
      title: entry.title.slice(0, 120),
      score,
      at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify([item, ...getActivity()].slice(0, MAX_ITEMS)));
    window.dispatchEvent(new Event(ACTIVITY_EVENT));
  } catch {
    // Storage unavailable (private mode, blocked) — the dashboard just shows an empty state.
  }
}

// ── React binding (useSyncExternalStore needs a stable snapshot, so cache by raw string) ──
let cachedRaw: string | null = null;
let cachedList: Activity[] = [];
const EMPTY: Activity[] = [];

export function activitySnapshot(): Activity[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = getActivity();
  }
  return cachedList;
}

export const activityServerSnapshot = () => EMPTY;

export function subscribeActivity(onChange: () => void) {
  window.addEventListener(ACTIVITY_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ACTIVITY_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function clearActivity() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(ACTIVITY_EVENT));
  } catch {}
}
