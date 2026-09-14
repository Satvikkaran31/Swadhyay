// Zoom integration — Server-to-Server OAuth (the current standard; JWT apps
// were deprecated by Zoom in 2023). Requires a "Server-to-Server OAuth" app in
// the Zoom Marketplace with the meeting:write:admin scope, and these env vars:
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
// If they are unset, isZoomConfigured() is false and callers surface a clear
// "not configured" message instead of failing cryptically.

interface CachedToken { token: string; expiresAt: number; }
let cached: CachedToken | null = null;

export function isZoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

async function getAccessToken(): Promise<string> {
  // Reuse the token until ~1 min before expiry (Zoom tokens live ~1 hour).
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const url =
    "https://zoom.us/oauth/token?grant_type=account_credentials" +
    `&account_id=${encodeURIComponent(process.env.ZOOM_ACCOUNT_ID as string)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Zoom auth failed (${resp.status}): ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

export interface ZoomMeeting { joinUrl: string; meetingId: string; }

/** Create a scheduled Zoom meeting on the coach's account; returns the join URL. */
export async function createZoomMeeting(opts: {
  topic: string;
  startISO: string;      // ISO 8601 start time
  durationMins: number;
  timezone?: string;     // IANA tz, e.g. "Asia/Kolkata"
  agenda?: string;
}): Promise<ZoomMeeting> {
  const token = await getAccessToken();
  const resp = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: opts.topic,
      type: 2, // scheduled meeting
      start_time: opts.startISO,
      duration: opts.durationMins,
      timezone: opts.timezone ?? "Asia/Kolkata",
      agenda: opts.agenda?.slice(0, 2000),
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 2,
        audio: "both",
      },
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Zoom meeting create failed (${resp.status}): ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as { id: number | string; join_url: string };
  return { joinUrl: data.join_url, meetingId: String(data.id) };
}

/** Best-effort cancellation of a Zoom meeting by id. */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  if (!isZoomConfigured() || !meetingId) return;
  try {
    const token = await getAccessToken();
    await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err: any) {
    console.error("Zoom meeting delete error:", err?.message);
  }
}
