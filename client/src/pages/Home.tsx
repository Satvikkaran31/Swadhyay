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

/* ── series data ──────────────────────────────────────────────────── */
type SeriesKey = "youth" | "leadership" | "board";
const SERIES: Record<SeriesKey, {
  label: string; accent: string; desc: string;
  courses: { num: string; tag: string; title: string; desc: string; lessons: string; hrs: string; price: string }[];
}> = {
  youth: {
    label: "Youth Series",
    accent: "#D8A33C",
    desc: "For young professionals ready to step into their best selves — with confidence, clarity and purpose.",
    courses: [
      { num: "01", tag: "START HERE · FREE", title: "Who Am I?", desc: "A guided self-discovery journey to uncover your values, strengths and authentic identity.", lessons: "18 lessons", hrs: "4.5 hrs", price: "Free" },
      { num: "02", tag: "MOST POPULAR", title: "Your Best Interview Is Your Best Self", desc: "Land your dream role by showing up as your most authentic, grounded self.", lessons: "12 lessons", hrs: "3 hrs", price: "₹1,499" },
      { num: "03", tag: "BEGINNER", title: "Confidence & Clarity", desc: "Quiet the inner critic and build a steady, self-assured voice in any room.", lessons: "10 lessons", hrs: "2.5 hrs", price: "₹1,299" },
    ],
  },
  leadership: {
    label: "Leadership & Board Series",
    accent: "#5FC8B8",
    desc: "For leaders and working professionals turning self-awareness into grounded, values-led leadership.",
    courses: [
      { num: "01", tag: "CORE", title: "Leading From Within", desc: "Turn self-awareness into everyday leadership presence and steady, values-led decisions.", lessons: "15 lessons", hrs: "5 hrs", price: "₹2,999" },
      { num: "02", tag: "MOST POPULAR", title: "The Present Leader", desc: "Lead with attention and calm under pressure — presence as your competitive edge.", lessons: "14 lessons", hrs: "4 hrs", price: "₹2,499" },
      { num: "03", tag: "ADVANCED", title: "Difficult Conversations", desc: "Navigate conflict, feedback and hard calls with clarity, empathy and honesty.", lessons: "11 lessons", hrs: "3.5 hrs", price: "₹2,299" },
    ],
  },
  board: {
    label: "Board Retreat",
    accent: "#C27B54",
    desc: "Facilitated off-sites for founding teams and boards — realigning vision, trust and hard decisions at the very top.",
    courses: [
      { num: "01", tag: "FLAGSHIP", title: "The Annual Board Retreat", desc: "A two-day off-site to realign vision, trust and decision-making across the leadership team.", lessons: "2 days", hrs: "On-site", price: "On request" },
      { num: "02", tag: "INTENSIVE", title: "Founders in the Room", desc: "A facilitated reset for founding teams navigating scale, conflict and succession.", lessons: "1 day", hrs: "On-site", price: "On request" },
      { num: "03", tag: "ADVANCED", title: "Governance & Presence", desc: "Sharpen board dynamics, listening and hard-call clarity under real pressure.", lessons: "6 sessions", hrs: "12 hrs", price: "On request" },
    ],
  },
};

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Home() {
  const [svcIdx, setSvcIdx] = useState(0);
  const [series, setSeries] = useState<SeriesKey>("youth");
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

  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="home-hero sw-page-pad">
        <div className="home-hero-orb" />
        <div className="home-hero-inner">
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
              { val: "700+", label: "Coaching hours" },
              { val: "PCC",  label: "ICF certified" },
              { val: "380+", label: "People guided" },
            ].map(s => (
              <div key={s.label}>
                <div className="home-stat-val">{s.val}</div>
                <div className="home-stat-label mono-label mono-label--muted">{s.label}</div>
              </div>
            ))}
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
            <p className="home-mission-quote">
              "Who looks outside, dreams. Who looks inside, awakens."
            </p>
            <span className="mono-label" style={{ color: "#0E766B", display: "block", marginTop: 12 }}>— Carl Jung</span>
            <p className="home-mission-body">
              Swadhyay — a Sanskrit word for self-study — is about deeply understanding oneself:
              our thoughts, beliefs, desires and behaviours. That self-awareness is the trait
              shared by the finest leaders, fostering compassion and empathy.
            </p>
            <Link to="/whoami" className="home-mission-cta">Read our story →</Link>
          </div>
          <div className="home-mission-visual">
            <span className="home-mission-caption">image — reflection / mirror</span>
          </div>
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
                >
                  {SERIES[key].label}
                </button>
              ))}
            </div>
          </div>
          <p className="home-series-desc">{ser.desc}</p>

          {/* course cards */}
          <div className="home-course-grid">
            {ser.courses.map(c => (
              <Link to="/series" key={c.num} className="home-course-card lift">
                <div className="home-course-thumb">
                  <span
                    className="home-course-tag"
                    style={{ background: ser.accent, color: "#0C241C" }}
                  >
                    {c.tag}
                  </span>
                  <span className="home-course-num">{c.num}</span>
                </div>
                <div className="home-course-body">
                  <h3 className="home-course-title">{c.title}</h3>
                  <p className="home-course-desc">{c.desc}</p>
                  <div className="home-course-meta">
                    <span>▷ {c.lessons} · {c.hrs}</span>
                    <span style={{ color: ser.accent, fontWeight: 700 }}>{c.price}</span>
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

      <a
        href="https://wa.me/919810059991"
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        💬
      </a>
    </>
  );
}
