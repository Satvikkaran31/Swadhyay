// Lightweight, privacy-respecting first-party analytics client.
//
// A random visitor_id is kept in localStorage to recognise a returning browser
// (no third-party cookies, no fingerprinting). Every event is beaconed to our
// own /api/analytics/track — fire-and-forget, so tracking never blocks the UI.

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const VID_KEY = "sw_vid";

export function getVisitorId(): string {
  try {
    let vid = localStorage.getItem(VID_KEY);
    if (!vid) {
      vid = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VID_KEY, vid);
    }
    return vid;
  } catch {
    // Private mode / storage blocked — fall back to an ephemeral per-load id.
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

type TrackMeta = { path?: string; course_id?: number };

export function track(eventType: string, meta: TrackMeta = {}): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const payload = {
      visitor_id: getVisitorId(),
      event_type: eventType,
      path: meta.path ?? window.location.pathname,
      course_id: meta.course_id,
      referrer: document.referrer || "",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    };
    const url = `${API}/api/analytics/track`;
    const body = JSON.stringify(payload);

    // sendBeacon survives page unloads and doesn't need CORS credentials; but it
    // can't carry the session cookie cross-origin, so prefer fetch(keepalive)
    // when the API is on a different origin (needed to resolve the logged-in user).
    const sameOrigin = API.startsWith(window.location.origin) || API.startsWith("/");
    if (sameOrigin && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body,
    }).catch(() => {});
  } catch {
    /* analytics must never throw into the app */
  }
}
