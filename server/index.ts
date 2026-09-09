import "dotenv/config"; // must be first import — loads .env before any module reads process.env

import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";

import pool from "./utils/db.js";
import { runMigrations } from "./utils/migrations.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { ensureAuthenticated } from "./controllers/auth.js";
import { handleInquiry, inquiryLimiter } from "./controllers/Inquiry.js";
import { startReminderJob } from "./utils/reminderJob.js";
import { startAutomationJob } from "./utils/automationJob.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import seriesRoutes from "./routes/seriesRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import crmRoutes from "./routes/crmRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

const REQUIRED_ENV = [
  "SESSION_SECRET", "POSTGRES_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
  "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "ADMIN_EMAIL",
];
// Email (RESEND_API_KEY, MAIL_USER) is optional — if unset, sending is skipped
// gracefully (see utils/mailer.ts) so the app still deploys and runs.
if (!process.env.RESEND_API_KEY) {
  console.warn("WARN: RESEND_API_KEY not set — email sending is disabled (bookings/contact/CRM emails will be skipped).");
}
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PGStore = pgSession(session);

const allowed_origins = [
  "https://swadhyay-pa3f.onrender.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",
  "https://swadhyay.co",
  "https://www.swadhyay.co",
];
app.use(cors({ origin: allowed_origins, credentials: true }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // API origin the built frontend calls (VITE_API_BASE_URL). Allowed in connect-src
  // so cross-origin API/analytics calls aren't blocked when the site is served from
  // a custom domain. Configurable via CSP_CONNECT_SRC (space-separated origins).
  const apiConnect = process.env.CSP_CONNECT_SRC || "https://swadhyay-pa3f.onrender.com";
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' checkout.razorpay.com accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src www.youtube-nocookie.com www.youtube.com player.vimeo.com checkout.razorpay.com accounts.google.com",
    "frame-ancestors 'none'",
    `connect-src 'self' https://api.razorpay.com https://accounts.google.com ${apiConnect}`,
    "worker-src blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '));
  next();
});

// Razorpay webhook needs the raw body for HMAC verification — must be before bodyParser.json()
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRoutes);

app.use(bodyParser.json({ limit: '2mb' }));

// Block state-changing requests from absent or unrecognized origins (CSRF defense)
app.use((req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // RFC 8058 one-click List-Unsubscribe POSTs come from mail providers with no
  // browser Origin; they authenticate via the secret token, so exempt this path.
  if (req.path === '/api/crm/unsubscribe') return next();
  const origin = req.headers.origin;
  if (!origin || !allowed_origins.includes(origin)) {
    return _res.status(403).json({ error: 'Forbidden' });
  }
  next();
});
app.set('trust proxy', 1);

app.use(
  session({
    store: new PGStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/payment", ensureAuthenticated, paymentRoutes);
app.use("/api/calendar", ensureAuthenticated, calendarRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);
app.post("/api/contact-us", inquiryLimiter, handleInquiry);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/sitemap.xml", async (_req, res) => {
  try {
    const base = "https://swadhyay.co";
    const [courses, articles] = await Promise.all([
      pool.query("SELECT slug, updated_at FROM courses WHERE is_published = true"),
      pool.query("SELECT slug, updated_at FROM articles WHERE is_published = true"),
    ]);
    const staticUrls = ["/", "/courses", "/articles", "/booking", "/contact-us", "/whoami"];
    const urls = [
      ...staticUrls.map(p => `<url><loc>${base}${p}</loc></url>`),
      ...courses.rows.map(r => `<url><loc>${base}/courses/${r.slug}</loc><lastmod>${r.updated_at?.toISOString().split("T")[0] ?? ""}</lastmod></url>`),
      ...articles.rows.map(r => `<url><loc>${base}/article/${r.slug}</loc><lastmod>${r.updated_at?.toISOString().split("T")[0] ?? ""}</lastmod></url>`),
    ];
    res.header("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`);
  } catch {
    res.status(500).send("Failed to generate sitemap");
  }
});

app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("/{*any}", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

runMigrations().then(() => {
  startReminderJob();
  startAutomationJob();
  const PORT = parseInt(process.env.PORT ?? '5000', 10);
  const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}).catch(err => {
  console.error('FATAL: Migrations failed, refusing to start:', err.message);
  process.exit(1);
});
