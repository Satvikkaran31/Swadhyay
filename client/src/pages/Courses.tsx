import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Courses.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* ── Per-series design metadata ───────────────────────────────────── */
type SeriesKey = "youth" | "leadership" | "board";

const SERIES_META: Record<SeriesKey, {
  label: string; kicker: string; title: string; desc: string;
  count: string; hours: string; accent: string; accentSoft: string;
  accentText: string; band: string; bandSoft: string;
  pillars: { t: string; d: string }[];
  staticCourses: { num: string; tag: string; title: string; desc: string; lessons: string; hrs: string; price: string }[];
}> = {
  youth: {
    label: "Youth Series",
    kicker: "Youth Series",
    title: "For young people finding their footing",
    desc: "Step into your best self with confidence, clarity and purpose — built for students and young professionals at the start of their journey.",
    count: "3", hours: "10 hrs",
    accent: "#C1852B", accentSoft: "#F4EAD6", accentText: "#8A5E1C",
    band: "#3A2C12", bandSoft: "#5A431C",
    pillars: [
      { t: "Start free", d: "Begin with 'Who Am I?' at no cost — no commitment, just a first honest look inward." },
      { t: "Built for beginnings", d: "Language, pace and prompts designed for students and first jobs, not boardrooms." },
      { t: "Reflection, not lecture", d: "Every lesson ends in a practice you actually do — journaling, exercises, small experiments." },
    ],
    staticCourses: [
      { num: "01", tag: "START HERE · FREE", title: "Who Am I?", desc: "A guided self-discovery journey to uncover your values, strengths and authentic identity.", lessons: "18 lessons", hrs: "4.5 hrs", price: "Free" },
      { num: "02", tag: "MOST POPULAR", title: "Your Best Interview Is Your Best Self", desc: "Land your dream role by showing up as your most authentic, grounded self.", lessons: "12 lessons", hrs: "3 hrs", price: "₹1,499" },
      { num: "03", tag: "BEGINNER", title: "Confidence & Clarity", desc: "Quiet the inner critic and build a steady, self-assured voice in any room.", lessons: "10 lessons", hrs: "2.5 hrs", price: "₹1,299" },
    ],
  },
  leadership: {
    label: "Leadership & Board",
    kicker: "Leadership & Board Series",
    title: "For leaders turning awareness into action",
    desc: "Turn self-awareness into grounded, values-led leadership — for managers, founders and working professionals ready to lead from within.",
    count: "3", hours: "12.5 hrs",
    accent: "#0E766B", accentSoft: "#E7F1EC", accentText: "#0E766B",
    band: "#0C241C", bandSoft: "#16362E",
    pillars: [
      { t: "Depth over hacks", d: "Grounded frameworks for real leadership — presence and clarity, not surface tactics." },
      { t: "For working leaders", d: "Built around the pressures managers and founders actually face day to day." },
      { t: "Pairs with coaching", d: "Combine any course with one-on-one sessions for a fully personal path." },
    ],
    staticCourses: [
      { num: "01", tag: "CORE", title: "Leading From Within", desc: "Turn self-awareness into everyday leadership presence and steady, values-led decisions.", lessons: "15 lessons", hrs: "5 hrs", price: "₹2,999" },
      { num: "02", tag: "MOST POPULAR", title: "The Present Leader", desc: "Lead with attention and calm under pressure — presence as your competitive edge.", lessons: "14 lessons", hrs: "4 hrs", price: "₹2,499" },
      { num: "03", tag: "ADVANCED", title: "Difficult Conversations", desc: "Navigate conflict, feedback and hard calls with clarity, empathy and honesty.", lessons: "11 lessons", hrs: "3.5 hrs", price: "₹2,299" },
    ],
  },
  board: {
    label: "Board Retreat",
    kicker: "Board Retreat",
    title: "For boards and founding teams at the top",
    desc: "Facilitated off-sites that realign vision, trust and hard decisions — for boards, founders and senior leadership teams.",
    count: "3", hours: "By design",
    accent: "#B4653B", accentSoft: "#F3E6DD", accentText: "#9A5A38",
    band: "#2E1B10", bandSoft: "#4A2E1C",
    pillars: [
      { t: "Built for the top", d: "Designed for boards and founding teams — governance-grade depth, not individual training." },
      { t: "Facilitated, in person", d: "Structured off-sites led by Neha, blending reflection with hard strategic conversations." },
      { t: "Outcomes, not slides", d: "Every retreat ends in shared commitments the room actually owns and acts on." },
    ],
    staticCourses: [
      { num: "01", tag: "FLAGSHIP", title: "The Annual Board Retreat", desc: "A two-day off-site to realign vision, trust and decision-making across the leadership team.", lessons: "2 days", hrs: "On-site", price: "On request" },
      { num: "02", tag: "INTENSIVE", title: "Founders in the Room", desc: "A facilitated reset for founding teams navigating scale, conflict and succession.", lessons: "1 day", hrs: "On-site", price: "On request" },
      { num: "03", tag: "ADVANCED", title: "Governance & Presence", desc: "Sharpen board dynamics, listening and hard-call clarity under real pressure.", lessons: "6 sessions", hrs: "12 hrs", price: "On request" },
    ],
  },
};

const SERIES_ORDER: SeriesKey[] = ["youth", "leadership", "board"];

export default function Courses() {
  const [activeSeries, setActiveSeries] = useState<SeriesKey>("youth");
  const [apiCourses, setApiCourses] = useState<any[]>([]);
  const navigate = useNavigate();

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

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
    fetch(`${API}/api/courses`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setApiCourses(d);
    }).catch(() => {});
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

  const meta = SERIES_META[activeSeries];
  const courses = meta.staticCourses;

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
                {[`${meta.count} courses`, `${meta.hours} of learning`, "Self-paced"].map(c => (
                  <span key={c} className="ser-info-chip" style={{ color: meta.accentText, background: meta.accentSoft }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="ser-thumb">
              <span className="ser-thumb-caption">image — {meta.title}</span>
            </div>
          </div>

          {/* course grid */}
          <div className="ser-course-grid">
            {courses.map(c => (
              <div key={c.num} className="ser-course-card lift" onClick={() => navigate("/courses/" + c.title.toLowerCase().replace(/\s+/g, "-"))}>
                <div className="ser-course-thumb">
                  <span className="ser-course-tag" style={{ background: meta.accent }}>
                    {c.tag}
                  </span>
                  <span className="ser-course-num">{c.num}</span>
                </div>
                <div className="ser-course-body">
                  <h3 className="ser-course-title">{c.title}</h3>
                  <p className="ser-course-desc">{c.desc}</p>
                  <div className="ser-course-meta">
                    <span>▷ {c.lessons} · {c.hrs}</span>
                    <span style={{ color: meta.accentText, fontWeight: 700 }}>{c.price}</span>
                  </div>
                </div>
              </div>
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
      <a href="https://wa.me/919810059991" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">💬</a>
    </>
  );
}
