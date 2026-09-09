/**
 * Demo mock layer — ONLY loaded in the offline preview build (VITE_DEMO).
 *
 * Intercepts every `${API}/api/...` request (both window.fetch and axios) and
 * answers it from baked-in fixtures, so the whole app can be clicked through
 * from a single static index.html with no server, database, or API keys.
 *
 * Real actions (login, payment, saving) are stubbed to succeed or fail
 * gracefully — this build is for reviewing look & content, not live use.
 */
import axios from "axios";
import fx from "./fixtures.json";

// A logged-in admin so every page — including gated ones (My Learning, the
// video player, the CRM/analytics dashboard) — renders populated.
const AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' rx='40' fill='#0E766B'/><text x='50%' y='54%' font-family='sans-serif' font-size='30' fill='#fff' text-anchor='middle' dominant-baseline='middle'>DR</text></svg>`
  );

const demoUser = {
  id: 1,
  google_id: "demo-reviewer",
  name: "Demo Reviewer",
  email: "reviewer@swadhyay.co",
  picture: AVATAR,
  role: "admin",
  verified: true,
  linkedin_url: "https://www.linkedin.com/in/demo",
};

const F: any = fx;

function pathOf(url: string): string | null {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return null;
  }
}

function parseBody(body: any): any {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

type Result = { status: number; body: any };

/** Resolve one API request to a canned response. */
function resolve(method: string, path: string, body: any): Result {
  const seg = path.split("/").filter(Boolean); // e.g. ["api","courses","slug"]
  const p = (s: string) => path === s;
  const ok = (b: any, status = 200): Result => ({ status, body: b });

  // ---- Auth ----------------------------------------------------------------
  if (p("/api/auth/me")) return ok({ success: true, user: demoUser });
  if (path === "/api/auth/logout" || path === "/api/auth/google")
    return ok({ success: true, user: demoUser });

  // ---- Courses -------------------------------------------------------------
  if (p("/api/courses")) return ok(F.courses);
  if (p("/api/courses/admin/all")) return ok(F.courses);
  if (path.startsWith("/api/courses/admin/")) {
    const id = Number(seg[3]);
    const slug = Object.keys(F.courseDetail).find(
      (s) => F.courseDetail[s].id === id
    );
    return ok(slug ? F.courseDetail[slug] : {});
  }
  // /api/courses/lessons/:id/resources  and /api/courses/lessons/:id
  if (seg[1] === "courses" && seg[2] === "lessons") return ok([]);
  if (seg[1] === "courses" && seg[3] === "learn")
    return ok(F.learn[seg[2]] ?? { error: "Course not found" }, F.learn[seg[2]] ? 200 : 404);
  if (seg[1] === "courses" && seg[3] === "certificate") return ok(F.certificate);
  if (seg[1] === "courses" && seg[3] === "reviews") {
    if (method === "POST") {
      const b = parseBody(body);
      return ok(
        { id: Date.now(), rating: b.rating, body: b.body ?? null, created_at: new Date().toISOString() },
        201
      );
    }
    return ok(F.reviews[seg[2]] ?? []);
  }
  if (seg[1] === "courses" && seg.length === 3 && method === "GET")
    return ok(F.courseDetail[seg[2]] ?? { error: "Course not found" }, F.courseDetail[seg[2]] ? 200 : 404);

  // ---- Enrollments ---------------------------------------------------------
  if (p("/api/enrollments/mine")) return ok(F.enrollmentsMine);
  if (path.startsWith("/api/enrollments/check/")) return ok({ enrolled: false });
  if (p("/api/enrollments") && method === "POST") return ok({ success: true }, 201);

  // ---- Testimonials --------------------------------------------------------
  if (p("/api/testimonials") || p("/api/testimonials/admin/all")) return ok(F.testimonials);

  // ---- Articles ------------------------------------------------------------
  if (p("/api/articles") || p("/api/articles/admin/all")) return ok(F.articles);
  if (p("/api/articles/admin/stats"))
    return ok({
      total_enrollments: 47,
      revenue: 0,
      total_courses: F.courses.length,
      published_articles: F.articles.length,
      newsletter_subscribers: 214,
      total: F.articles.length,
      published: F.articles.length,
      drafts: 0,
      total_views: 8421,
    });
  if (seg[1] === "articles" && seg[3] === "related") return ok(F.related[seg[2]] ?? []);
  if (seg[1] === "articles" && seg.length === 3)
    return ok(F.articleDetail[seg[2]] ?? { error: "Not found" }, F.articleDetail[seg[2]] ? 200 : 404);

  // ---- Series --------------------------------------------------------------
  if (p("/api/series") || p("/api/series/admin/all")) return ok(F.series);
  if (seg[1] === "series" && seg.length === 3)
    return ok(F.seriesDetail[seg[2]] ?? { error: "Not found" }, F.seriesDetail[seg[2]] ? 200 : 404);

  // ---- Instructor ----------------------------------------------------------
  if (p("/api/instructor")) return ok(F.instructor);

  // ---- Calendar / booking / availability -----------------------------------
  if (p("/api/calendar/my-sessions")) return ok(F.mySessions);
  if (p("/api/calendar/upcoming"))
    return ok({
      bookings: [
        { id: 101, title: "1:1 Coaching — Priya Sharma", start: "2026-09-02T11:00:00Z", attendees: ["priya.s@example.com"], meetLink: "https://meet.google.com/demo-abc-defg" },
        { id: 102, title: "EFT Tapping — Arjun Mehta", start: "2026-09-05T14:30:00Z", attendees: ["arjun.m@example.com"], meetLink: "https://meet.google.com/demo-hij-klmn" },
        { id: 103, title: "1:1 Coaching — Kavya Rao", start: "2026-09-09T09:30:00Z", attendees: ["kavya.rao@example.com"], meetLink: "https://meet.google.com/demo-opq-rstu" },
      ],
    });
  if (path.startsWith("/api/availability"))
    return ok({ slots: ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM", "6:00 PM"] });
  if (p("/api/calendar/book"))
    return ok({ meetLink: "https://meet.google.com/demo-xyz-1234" });
  if (path.startsWith("/api/calendar/bookings/")) return ok({ success: true });

  // ---- Progress & notes ----------------------------------------------------
  if (path.startsWith("/api/progress/complete")) return ok({ ok: true });
  if (path.startsWith("/api/progress/")) return ok({ completed_lesson_ids: [] });
  if (path.startsWith("/api/notes/")) {
    if (method === "PUT" || method === "POST") return ok({ success: true });
    return ok({ content: null });
  }

  // ---- Analytics & CRM (admin) ---------------------------------------------
  if (path.startsWith("/api/analytics/overview")) return ok(F.analytics);
  if (path.startsWith("/api/analytics/track")) return ok({}, 200);
  if (p("/api/crm/leads")) return ok(F.crmLeads);
  if (p("/api/crm/stats")) return ok(F.crmStats);
  if (p("/api/crm/templates")) return ok([]);
  if (p("/api/crm/logs")) return ok([]);
  if (p("/api/crm/automations")) return ok([]);

  // ---- Users / newsletter --------------------------------------------------
  if (p("/api/users")) return ok([demoUser]);
  if (p("/api/newsletter/subscribers")) return ok([]);

  // ---- Contact -------------------------------------------------------------
  if (p("/api/contact-us")) return ok({ success: true });

  // ---- Payments (disabled in preview) --------------------------------------
  if (path.startsWith("/api/payment/"))
    return ok({ error: "Payments are disabled in this preview build." }, 400);

  // ---- Fallback: succeed for writes, empty for reads -----------------------
  if (method === "GET") return ok([]);
  return ok({ success: true });
}

let installed = false;

export function installDemoMock() {
  if (installed) return;
  installed = true;

  // --- fetch ---------------------------------------------------------------
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: any, init?: any): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
        ? input.url
        : String(input);
    const path = pathOf(url);
    if (path && path.startsWith("/api/")) {
      const method = (
        init?.method ||
        (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      let body = init?.body;
      if (input instanceof Request && body == null) {
        try {
          body = await input.clone().text();
        } catch {
          /* no body */
        }
      }
      const r = resolve(method, path, body);
      return new Response(JSON.stringify(r.body), {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return origFetch(input, init);
  };

  // --- axios (used by login/booking helpers) -------------------------------
  axios.defaults.adapter = async (config: any) => {
    const url = (config.baseURL || "") + (config.url || "");
    const path = pathOf(url);
    if (path && path.startsWith("/api/")) {
      const method = (config.method || "get").toUpperCase();
      const r = resolve(method, path, config.data);
      if (r.status >= 400) {
        throw new axios.AxiosError(
          r.body?.error || "Request failed",
          "ERR_BAD_REQUEST",
          config,
          {},
          { data: r.body, status: r.status, statusText: "Error", headers: {}, config } as any
        );
      }
      return { data: r.body, status: r.status, statusText: "OK", headers: {}, config, request: {} };
    }
    throw new axios.AxiosError("Network is disabled in the preview build.", "ERR_NETWORK", config);
  };

  // --- sendBeacon (analytics) → swallow ------------------------------------
  try {
    navigator.sendBeacon = () => true;
  } catch {
    /* readonly in some browsers */
  }

  // eslint-disable-next-line no-console
  console.info("%c[Swadhyay preview] Offline demo mode — data is mocked, actions are stubbed.", "color:#0E766B");
}
