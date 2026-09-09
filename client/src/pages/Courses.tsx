import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Courses.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* ── Per-series design metadata (visual only — courses come from the DB) ──── */
type SeriesKey = "youth" | "leadership" | "board";

type ApiCourse = {
  slug: string; title: string; short_description: string | null; description: string | null;
  price: number; level: string | null; series_slug: string | null;
  total_lessons: number | null; total_duration: number | null;
};

const SERIES_META: Record<SeriesKey, {
  label: string; kicker: string; title: string; desc: string;
  seriesSlug: string; accent: string; accentSoft: string; accentText: string;
  band: string; bandSoft: string; pillars: { t: string; d: string }[];
}> = {
  youth: {
    label: "Youth Series",
    kicker: "Youth Series",
    title: "For young people finding their footing",
    desc: "Step into your best self with confidence, clarity and purpose — built for students and young professionals at the start of their journey.",
    seriesSlug: "swadhyay-youth-series",
    accent: "#C1852B", accentSoft: "#F4EAD6", accentText: "#8A5E1C",
    band: "#3A2C12", bandSoft: "#5A431C",
    pillars: [
      { t: "Start free", d: "Begin with 'Who Am I?' at no cost — no commitment, just a first honest look inward." },
      { t: "Built for beginnings", d: "Language, pace and prompts designed for students and first jobs, not boardrooms." },
      { t: "Reflection, not lecture", d: "Every lesson ends in a practice you actually do — journaling, exercises, small experiments." },
    ],
  },
  leadership: {
    label: "Leadership & Board",
    kicker: "Leadership & Board Series",
    title: "For leaders turning awareness into action",
    desc: "Turn self-awareness into grounded, values-led leadership — for managers, founders and working professionals ready to lead from within.",
    seriesSlug: "leadership-coaching",
    accent: "#0E766B", accentSoft: "#E7F1EC", accentText: "#0E766B",
    band: "#0C241C", bandSoft: "#16362E",
    pillars: [
      { t: "Depth over hacks", d: "Grounded frameworks for real leadership — presence and clarity, not surface tactics." },
      { t: "For working leaders", d: "Built around the pressures managers and founders actually face day to day." },
      { t: "Pairs with coaching", d: "Combine any course with one-on-one sessions for a fully personal path." },
    ],
  },
  board: {
    label: "Immersions & Retreats",
    kicker: "Immersions & Retreats",
    title: "For boards and founding teams at the top",
    desc: "Immersive retreats and facilitated off-sites that realign vision, trust and hard decisions — for boards, founders and senior leadership teams.",
    seriesSlug: "swadhyay-immersion",
    accent: "#B4653B", accentSoft: "#F3E6DD", accentText: "#9A5A38",
    band: "#2E1B10", bandSoft: "#4A2E1C",
    pillars: [
      { t: "Built for the top", d: "Designed for boards and founding teams — governance-grade depth, not individual training." },
      { t: "Facilitated, in person", d: "Structured off-sites led by Neha, blending reflection with hard strategic conversations." },
      { t: "Outcomes, not slides", d: "Every retreat ends in shared commitments the room actually owns and acts on." },
    ],
  },
};

const SERIES_ORDER: SeriesKey[] = ["youth", "leadership", "board"];

function fmtPrice(p: number): string {
  return p === 0 ? "Free" : `₹${(p / 100).toLocaleString("en-IN")} + GST`;
}
function fmtDuration(sec: number | null): string {
  if (!sec) return "Self-paced";
  const h = sec / 3600;
  return h >= 1 ? `${(Math.round(h * 10) / 10)} hrs` : `${Math.round(sec / 60)} min`;
}

export default function Courses() {
  const [activeSeries, setActiveSeries] = useState<SeriesKey>("youth");
  const [allCourses, setAllCourses] = useState<ApiCourse[]>([]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllCourses(d); })
      .catch(() => {});
  }, []);

  const positionSlider = () => {
    const i = SERIES_ORDER.indexOf(activeSeries);
    const btn = tabRefs.current[i];
    const slider = sliderRef.current;
    if (!btn || !slider) return;
    slider.style.transform = `translateX(${btn.offsetLeft}px)`;
    slider.style.width = `${btn.offsetWidth}px`;
    slider.style.background = SERIES_META[activeSeries].accent;
  };

  useEffect(() => { positionSlider(); }, [activeSeries]);
  useEffect(() => {
    window.addEventListener("resize", positionSlider);
    return () => window.removeEventListener("resize", positionSlider);
  }, [activeSeries]);

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

  const meta = SERIES_META[activeSeries];
  const courses = allCourses.filter(c => c.series_slug === meta.seriesSlug);
  const totalSecs = courses.reduce((s, c) => s + (c.total_duration || 0), 0);

  return (
    <>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="ser-hero sw-page-pad">
        <div className="ser-hero-orb" />
        <div className="ser-hero-grid">
          <div className="rv">
            <span className="mono-label mono-label--light" style={{ display: "block", marginBottom: 10 }}>
              learn at your own pace
            </span>
            <h1 className="ser-hero-h1">Three series, one journey inward</h1>
            <p className="ser-hero-sub">
              Each course stands alone — together they form a complete path from
              self-discovery to grounded leadership.
            </p>
          </div>
          <div className="rv ser-hero-rings-wrap">
            <div className="ser-hero-ring ser-ring-1" />
            <div className="ser-hero-ring ser-ring-2" />
            <div className="ser-hero-ring ser-ring-3" />
            <div className="ser-hero-center">
              <span className="ser-hero-num">3</span>
              <span className="ser-hero-tag">SERIES</span>
            </div>
            {[
              { label: "Youth", delay: "0s", pos: "top:12%;right:2%", dot: "#8FE0D4" },
              { label: "Leadership", delay: ".8s", pos: "bottom:12%;left:0", dot: "#8FE0D4" },
              { label: "Board", delay: "1.4s", pos: "bottom:2%;right:14%", dot: "#E7B394" },
            ].map(chip => (
              <div
                key={chip.label}
                className="ser-chip"
                style={{ animation: `floaty 7s ease-in-out infinite ${chip.delay}`, ...Object.fromEntries(chip.pos.split(";").map(p => { const [k, v] = p.trim().split(":"); return [k.trim(), v.trim()]; })) }}
              >
                <span className="ser-chip-dot" style={{ background: chip.dot }} />
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERIES SWITCH ───────────────────────────────────────────── */}
      <section className="ser-body sw-page-pad">
        <div className="ser-body-inner">
          {/* tab selector */}
          <div className="rv ser-tab-row">
            <div className="ser-tabs-wrap">
              <div className="ser-tab-inner">
                <div className="ser-slider" ref={sliderRef} />
                {SERIES_ORDER.map((key, i) => (
                  <button
                    key={key}
                    ref={el => { tabRefs.current[i] = el; }}
                    className={`ser-tab${activeSeries === key ? " active" : ""}`}
                    onClick={() => setActiveSeries(key)}
                  >
                    {SERIES_META[key].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* series header */}
          <div className="rv ser-header-grid">
            <div>
              <span className="mono-label" style={{ color: "#0E766B" }}>{meta.kicker}</span>
              <h2 className="ser-series-h2">{meta.title}</h2>
              <p className="ser-series-desc">{meta.desc}</p>
              <div className="ser-chips">
                {[`${courses.length} ${courses.length === 1 ? "course" : "courses"}`, `${fmtDuration(totalSecs)} of learning`, "Self-paced"].map(c => (
                  <span key={c} className="ser-info-chip" style={{ color: meta.accentText, background: meta.accentSoft }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="ser-thumb" aria-hidden="true" />
          </div>

          {/* course grid — real courses from the catalogue */}
          <div className="ser-course-grid">
            {courses.length === 0 ? (
              <div className="ser-course-empty" style={{ gridColumn: "1 / -1", padding: "2.5rem", textAlign: "center", color: "var(--fg-mid, #6b7280)", background: meta.accentSoft, borderRadius: 16 }}>
                New courses in this series are on the way — check back soon.
              </div>
            ) : courses.map((c, i) => (
              <Link key={c.slug} to={`/courses/${c.slug}`} className="ser-course-card lift">
                <div className="ser-course-thumb">
                  <span className="ser-course-tag" style={{ background: meta.accent }}>
                    {c.price === 0 ? "FREE" : (c.level || "COURSE").toUpperCase()}
                  </span>
                  <span className="ser-course-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="ser-course-body">
                  <h3 className="ser-course-title">{c.title}</h3>
                  <p className="ser-course-desc">{c.short_description || c.description}</p>
                  <div className="ser-course-meta">
                    <span>▷ {c.total_lessons || 0} lessons · {fmtDuration(c.total_duration)}</span>
                    <span style={{ color: meta.accentText, fontWeight: 700 }}>{fmtPrice(c.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE BAND ──────────────────────────────────────────────── */}
      <section
        className="ser-band sw-page-pad"
        style={{ background: `linear-gradient(160deg,${meta.bandSoft} 0%,${meta.band} 70%)` }}
      >
        <div className="rv ser-band-inner">
          <span className="mono-label" style={{ color: "rgba(255,255,255,.7)" }}>Why this series</span>
          <div className="ser-pillars">
            {meta.pillars.map(p => (
              <div key={p.t} className="ser-pillar">
                <h3 className="ser-pillar-title">{p.t}</h3>
                <p className="ser-pillar-desc">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="ser-cta-section sw-page-pad">
        <div className="rv ser-cta-card">
          <div className="ser-cta-orb" />
          <div className="ser-cta-copy">
            <h2 className="ser-cta-h2">Prefer a personal path?</h2>
            <p className="ser-cta-sub">
              Pair any course with one-on-one coaching, or start with a single conversation.
            </p>
            <div className="ser-cta-btns">
              <Link to="/booking" className="home-btn-primary">Book a session →</Link>
              <Link to="/pricing" className="home-btn-outline">See pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
