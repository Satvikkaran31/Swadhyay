// Shared video-embed helper.
//
// Videos are hosted on YouTube. We normalise any of the URL shapes an admin
// might paste (watch, youtu.be short link, /embed, /shorts, /live) into a
// privacy-enhanced embed URL (youtube-nocookie.com) so no tracking cookies are
// set until the viewer actually plays the video. Vimeo is kept as a fallback
// for any legacy lessons.

// YouTube video IDs are always 11 URL-safe base64 characters.
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

function parseYouTubeId(u: URL): string | null {
  const host = u.hostname.replace(/^(www|m|music)\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return YT_ID.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v") ?? "";
      return YT_ID.test(id) ? id : null;
    }
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    if (m && YT_ID.test(m[1])) return m[1];
  }

  return null;
}

// Accepts a raw start-time (`t` or `start`) value like "90" or "90s" and
// returns whole seconds, or null if it isn't a positive number.
function parseStartSeconds(raw: string | null): number | null {
  if (!raw) return null;
  const secs = parseInt(raw, 10);
  return Number.isFinite(secs) && secs > 0 ? secs : null;
}

/**
 * Convert a YouTube (or legacy Vimeo) URL into an iframe-embeddable URL.
 * Returns null for empty input or an unsupported/unparseable URL.
 */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }

  const ytId = parseYouTubeId(u);
  if (ytId) {
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    const start = parseStartSeconds(u.searchParams.get("start") ?? u.searchParams.get("t"));
    if (start) params.set("start", String(start));
    return `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`;
  }

  const host = u.hostname.replace(/^www\./, "");
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }

  return null;
}
