import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";

/* ── service data ─────────────────────────────────────────────────── */
const SERVICES = [
  {
    label: "One-on-One",
    code: "PRIVATE · 1-ON-1 · 60 MIN",
    title: "One-on-one",
    sub: "coaching.",
    desc: "Guided reflection and emotional clarity, one conversation at a time — a private journey to lead with presence, purpose and empathy.",
    points: ["Deep, judgement-free reflection", "Personalised between-session practice", "Clarity on your values and direction", "Presence you can feel in the room"],
    panelBg: "#D9E8E0",
    short: "One-on-One",
    keywords: ["Self-awareness", "Emotional clarity", "Confident decisions", "Grounded presence"],
  },
  {
    label: "EFT",
    code: "EFT · TAPPING · 45 MIN",
    title: "Emotional freedom",
    sub: "technique.",
    desc: "A powerful tapping method to release stress, trauma and emotional blocks — restoring calm, focus and a sense of safety in the body.",
    points: ["Release stress and tension fast", "Calm anxiety and overwhelm", "Loosen self-sabotaging patterns", "Reset limiting beliefs"],
    panelBg: "#E4ECDD",
    short: "EFT",
    keywords: ["Stress & tension", "Anxiety", "Self-sabotage", "Limiting beliefs"],
  },
  {
    label: "Group",
    code: "GROUP · COHORT · 90 MIN",
    title: "Group",
    sub: "coaching.",
    desc: "Collaborative sessions that harness shared experience and collective wisdom — support, accountability and growth in a dynamic circle.",
    points: ["Shared, honest reflection", "Built-in peer accountability", "Guided group exercises", "Integration between sessions"],
    panelBg: "#EFE7D5",
    short: "Group",
    keywords: ["Shared reflection", "Peer accountability", "Group exercises", "Integration"],
  },
];

/* ── series data (design only — courses are loaded from the DB) ─────── */
type SeriesKey = "youth" | "leadership" | "board";
type HomeCourse = {
  slug: string; title: string; short_description: string | null; description: string | null;
  price: number; level: string | null; series_slug: string | null;
  total_lessons: number | null; total_duration: number | null;
};
const SERIES: Record<SeriesKey, { label: string; accent: string; desc: string; seriesSlug: string }> = {
  youth: {
    label: "Youth Series",
    accent: "#D8A33C",
    desc: "For young professionals ready to step into their best selves — with confidence, clarity and purpose.",
    seriesSlug: "swadhyay-youth-series",
  },
  leadership: {
    label: "Leadership & Board Series",
    accent: "#5FC8B8",
    desc: "For leaders and working professionals turning self-awareness into grounded, values-led leadership.",
    seriesSlug: "leadership-coaching",
  },
  board: {
    label: "Immersions & Retreats",
    accent: "#C27B54",
    desc: "Immersive retreats and facilitated off-sites for founding teams and boards — realigning vision, trust and hard decisions at the very top.",
    seriesSlug: "swadhyay-immersion",
  },
};

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function fmtPrice(p: number): string {
  return p === 0 ? "Free" : `₹${(p / 100).toLocaleString("en-IN")} + GST`;
}
function fmtDuration(sec: number | null): string {
  if (!sec) return "Self-paced";
  const h = sec / 3600;
  return h >= 1 ? `${Math.round(h * 10) / 10} hrs` : `${Math.round(sec / 60)} min`;
}

export default function Home() {
  const [svcIdx, setSvcIdx] = useState(0);
  const [series, setSeries] = useState<SeriesKey>("youth");
  const [allCourses, setAllCourses] = useState<HomeCourse[]>([]);
  const [testimonials, setTestimonials] = useState<{ name: string; role: string; quote: string }[]>([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const positionSlider = () => {
    const btn = tabRefs.current[svcIdx];
    const slider = sliderRef.current;
    if (!btn || !slider) return;
    slider.style.transform = `translateX(${btn.offsetLeft}px)`;
    slider.style.width = `${btn.offsetWidth}px`;
  };

  useEffect(() => {
    positionSlider();
  }, [svcIdx]);

  useEffect(() => {
    window.addEventListener("resize", positionSlider);
    return () => window.removeEventListener("resize", positionSlider);
  }, [svcIdx]);

  useEffect(() => {
    fetch(`${API}/api/testimonials`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length) setTestimonials(d); })
      .catch(() => {});
    fetch(`${API}/api/courses`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllCourses(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t0 = document.timeline?.currentTime ?? 0;
    let tries = 0;
    const arm = () => {
      const t1 = document.timeline?.currentTime ?? 0;
      if (t1 > t0) { document.body.classList.add("rv-go"); return; }
      if (++tries < 8) requestAnimationFrame(arm);
    };
    requestAnimationFrame(arm);
    return () => { document.body.classList.remove("rv-go"); };
  }, []);

  const svc = SERVICES[svcIdx];
  const ser = SERIES[series];
  const serCourses = allCourses.filter(c => c.series_slug === ser.seriesSlug);

  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="home-hero sw-page-pad">
        <div className="home-hero-orb" />
        <div className="home-hero-orb home-hero-orb--2" />
        <div className="home-hero-grid" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="rv mono-label mono-label--light" style={{ display: "block", marginBottom: 22, animationDelay: "0s" }}>
              a space for inner work
            </span>
            <h1 className="rv home-hero-h1" style={{ animationDelay: ".08s" }}>
              Coaching for self-mastery{" "}
              <span style={{ fontWeight: 500 }}>&amp; elevated leadership</span>
            </h1>
            <p className="rv home-hero-sub" style={{ animationDelay: ".16s" }}>
              A guided inner process for leaders, professionals and youngsters —
              lead with presence, clarity and empathy.
            </p>
            <div className="rv home-hero-ctas" style={{ animationDelay: ".24s" }}>
              <Link to="/booking" className="home-btn-primary">Book a session →</Link>
              <Link to="/series" className="home-btn-ghost">Explore courses</Link>
            </div>
            <div className="rv home-hero-stats" style={{ animationDelay: ".32s" }}>
              {[
                { val: "1000+", label: "Coaching hours" },
                { val: "PCC",   label: "& Team Coach" },
                { val: "380+",  label: "People guided" },
              ].map(s => (
                <div key={s.label}>
                  <div className="home-stat-val">{s.val}</div>
                  <div className="home-stat-label mono-label mono-label--muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rv home-hero-media" style={{ animationDelay: ".2s" }}>
            <div className="home-hero-disc" />
            <svg
              className="home-hero-viz"
              viewBox="0 0 520 520"
              role="img"
              aria-label="Concentric rings radiating from a glowing centre — a symbol of inner reflection and growth"
            >
              <defs>
                <radialGradient id="hvCore" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#B7F0E5" />
                  <stop offset="55%" stopColor="#5FC8B8" />
                  <stop offset="100%" stopColor="#2E8C78" />
                </radialGradient>
                <radialGradient id="hvGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(95,200,184,.45)" />
                  <stop offset="100%" stopColor="rgba(95,200,184,0)" />
                </radialGradient>
              </defs>

              {/* concentric ripple rings — expanding awareness */}
              <g fill="none" stroke="#5FC8B8">
                <circle cx="260" cy="260" r="232" strokeOpacity=".10" />
                <circle cx="260" cy="260" r="182" strokeOpacity=".16" />
                <circle cx="260" cy="260" r="132" strokeOpacity=".24" strokeDasharray="2 9" />
                <circle cx="260" cy="260" r="90"  strokeOpacity=".34" />
              </g>

              {/* nodes orbiting along the rings — the journey / practices */}
              <circle cx="260" cy="28" r="6" fill="#5FC8B8">
                <animateTransform attributeName="transform" type="rotate" from="0 260 260" to="360 260 260" dur="26s" repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="78" r="5" fill="#B7F0E5">
                <animateTransform attributeName="transform" type="rotate" from="360 260 260" to="0 260 260" dur="19s" repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="170" r="4" fill="#F6F2EA">
                <animateTransform attributeName="transform" type="rotate" from="0 260 260" to="360 260 260" dur="13s" repeatCount="indefinite" />
              </circle>

              {/* glowing core — the self / inner light */}
              <circle cx="260" cy="260" r="120" fill="url(#hvGlow)">
                <animate attributeName="r" values="112;126;112" dur="6s" repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="260" r="46" fill="url(#hvCore)">
                <animate attributeName="r" values="44;49;44" dur="6s" repeatCount="indefinite" />
              </circle>
              {/* spark motif inside the core */}
              <path
                d="M260 231 C264 251 269 256 289 260 C269 264 264 269 260 289 C256 269 251 264 231 260 C251 256 256 251 260 231 Z"
                fill="#F6F2EA"
                fillOpacity=".92"
              />
            </svg>

            <div className="hv-chip hv-chip--1"><i aria-hidden="true">✦</i>Presence</div>
            <div className="hv-chip hv-chip--2"><i aria-hidden="true">◇</i>Clarity</div>
            <div className="hv-chip hv-chip--3"><i aria-hidden="true">❍</i>Empathy</div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────── */}
      <div className="home-trust sw-page-pad">
        <div className="home-trust-inner">
          <span className="mono-label mono-label--muted">Trusted across</span>
          {["Jagriti Yatra", "Global Ethics Coaching", "Fortune 500 Leaders", "Delhi B-School"].map(n => (
            <span key={n} className="home-trust-name">{n}</span>
          ))}
        </div>
      </div>

      {/* ── PHILOSOPHY QUOTE ──────────────────────────────────────────── */}
      <section className="home-quote sw-page-pad">
        <div className="rv home-quote-inner">
          <span className="home-quote-mark" aria-hidden="true">✦</span>
          <blockquote className="home-quote-text">
            "Who looks outside, dreams. Who looks inside, awakens."
          </blockquote>
          <cite className="home-quote-cite mono-label">— Carl Jung</cite>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────── */}
      <section className="home-services sw-page-pad">
        <div className="home-services-inner">
          {/* header row */}
          <div className="rv home-svc-header">
            <div>
              <span className="mono-label" style={{ color: "#0E766B" }}>Ways to work together</span>
              <h2 className="home-svc-h2">Three ways to begin the inner work</h2>
            </div>
            {/* sliding tab selector */}
            <div className="home-svc-tabs" ref={wrapRef}>
              <div className="home-svc-slider" ref={sliderRef} />
              {SERVICES.map((s, i) => (
                <button
                  key={s.label}
                  ref={el => { tabRefs.current[i] = el; }}
                  className={`home-svc-tab${svcIdx === i ? " active" : ""}`}
                  onClick={() => setSvcIdx(i)}
                  aria-pressed={svcIdx === i}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* content card */}
          <div className="rv home-svc-card">
            {/* left: copy */}
            <div className="home-svc-copy">
              <div className="home-svc-badge">
                <span className="home-svc-dot" />
                <span className="home-svc-code">{svc.code}</span>
              </div>
              <h3 className="home-svc-title">
                {svc.title} <span style={{ color: "#A9B7AC" }}>{svc.sub}</span>
              </h3>
              <p className="home-svc-desc">{svc.desc}</p>
              <div className="home-svc-divider" />
              <div className="home-svc-points">
                {svc.points.map(p => (
                  <div key={p} className="home-svc-point">
                    <span className="home-svc-check">✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <Link to="/booking" className="home-svc-cta">Book a session →</Link>
            </div>

            {/* right: animated panel */}
            <div className="home-svc-panel" style={{ '--svc-bg': svc.panelBg } as React.CSSProperties}>
              <div className="home-svc-rings">
                <div className="home-svc-ring home-svc-ring-1" />
                <div className="home-svc-ring home-svc-ring-2" />
                <div className="home-svc-ring home-svc-ring-3" />
                <div className="home-svc-center">
                  <span>{svc.short}</span>
                </div>
                {svc.keywords.map((kw, i) => (
                  <div
                    key={kw}
                    className={`home-svc-chip home-svc-chip-${i}`}
                    style={{ animation: `${i % 2 === 0 ? "floaty" : "floaty2"} ${6.5 + i * 0.5}s ease-in-out infinite ${i * 0.2}s` }}
                  >
                    <span className="home-svc-chip-dot" />
                    {kw}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION PREVIEW ───────────────────────────────────────────── */}
      <section className="home-mission sw-page-pad">
        <div className="rv home-mission-card">
          <div className="home-mission-copy">
            <span className="mono-label" style={{ color: "#0E766B" }}>Our mission</span>
            <h2 className="home-mission-title">Self-study is the deepest work</h2>
            <p className="home-mission-body">
              Swadhyay — a Sanskrit word for self-study — is about deeply understanding oneself:
              our thoughts, beliefs, desires and behaviours. That self-awareness is the trait
              shared by the finest leaders, fostering compassion and empathy.
            </p>
            <Link to="/whoami" className="home-mission-cta">Read our story →</Link>
          </div>
          <div className="home-mission-visual" aria-hidden="true" />
        </div>
      </section>

      {/* ── COURSES ───────────────────────────────────────────────────── */}
      <section className="home-courses sw-page-pad">
        <div className="home-courses-inner">
          <div className="rv home-courses-head">
            <span className="mono-label" style={{ color: "#8FE0D4" }}>Learning</span>
            <h2 className="home-courses-h2">Three curated series, one journey inward</h2>
            <p className="home-courses-sub">
              Each course stands alone — together they form a complete path from self-discovery
              to grounded leadership.
            </p>
          </div>

          {/* series tab selector */}
          <div className="rv home-series-tabs">
            <div className="home-series-tab-wrap">
              {(["youth", "leadership", "board"] as SeriesKey[]).map(key => (
                <button
                  key={key}
                  className="home-series-tab"
                  style={{
                    color: series === key ? "#16362E" : "#CDD7CF",
                    background: series === key ? SERIES[key].accent : "transparent",
                    boxShadow: series === key ? "0 8px 22px -8px rgba(0,0,0,.5)" : "none",
                  }}
                  onClick={() => setSeries(key)}
                  aria-pressed={series === key}
                >
                  {SERIES[key].label}
                </button>
              ))}
            </div>
          </div>
          <p className="home-series-desc">{ser.desc}</p>

          {/* course cards */}
          <div className="home-course-grid">
            {serCourses.length === 0 ? (
              <div className="home-course-empty" style={{ gridColumn: "1 / -1", padding: "2.25rem", textAlign: "center", color: "#6b7280", background: "rgba(0,0,0,.04)", borderRadius: 16 }}>
                New courses in this series are on the way — check back soon.
              </div>
            ) : serCourses.map((c, i) => (
              <Link to={`/courses/${c.slug}`} key={c.slug} className="home-course-card lift">
                <div className="home-course-thumb">
                  <span
                    className="home-course-tag"
                    style={{ background: ser.accent, color: "#0C241C" }}
                  >
                    {c.price === 0 ? "FREE" : (c.level || "COURSE").toUpperCase()}
                  </span>
                  <span className="home-course-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="home-course-body">
                  <h3 className="home-course-title">{c.title}</h3>
                  <p className="home-course-desc">{c.short_description || c.description}</p>
                  <div className="home-course-meta">
                    <span>▷ {c.total_lessons || 0} lessons · {fmtDuration(c.total_duration)}</span>
                    <span style={{ color: ser.accent, fontWeight: 700 }}>{fmtPrice(c.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="rv home-courses-more">
            <Link to="/series" className="home-btn-primary">
              View full {ser.label} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ───────────────────────────────────────────────── */}
      {testimonials.length > 0 && (() => {
        const t = testimonials[testimonialIdx];
        return (
          <section className="home-testimonial sw-page-pad">
            <div className="rv home-testimonial-inner">
              <span className="mono-label" style={{ color: "#0E766B" }}>what people say</span>
              <p className="home-testimonial-quote">"{t.quote}"</p>
              <div className="home-testimonial-attr">
                <div className="home-testimonial-avatar" />
                <div>
                  <div className="home-testimonial-name">{t.name}</div>
                  <div className="home-testimonial-role">{t.role}</div>
                </div>
              </div>
              {testimonials.length > 1 && (
                <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      style={{
                        width: 8, height: 8, borderRadius: "50%", border: "none",
                        background: i === testimonialIdx ? "#0E766B" : "#C8C0B0",
                        cursor: "pointer", padding: 0, transition: "background 0.2s",
                      }}
                      aria-label={`View testimonial ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* ── BOOKING CTA ───────────────────────────────────────────────── */}
      <section className="home-cta-section sw-page-pad">
        <div className="rv home-cta-card">
          <div className="home-cta-glow" />
          <div className="home-cta-orb" />
          <div className="home-cta-copy">
            <span className="mono-label" style={{ color: "#5FC8B8" }}>let's begin this journey together</span>
            <h2 className="home-cta-h2">Start your journey</h2>
            <p className="home-cta-sub">
              Choose your session type and book instantly — the first conversation
              is where everything begins.
            </p>
            <div className="home-cta-btns">
              <Link to="/booking" className="home-btn-primary">Book a session →</Link>
              <Link to="/series" className="home-btn-outline">Browse free courses</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
