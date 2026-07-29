import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Pricing.css";

const PLANS = [
  {
    name: "Single Session",
    price: "₹3,500",
    unit: "/ session",
    featured: false,
    desc: "One private coaching conversation, whenever you need it.",
    cta: "Book a session",
    features: ["60-minute 1-on-1 session", "Held privately over Zoom", "Personalised reflection notes", "Free 30-min discovery call"],
  },
  {
    name: "Journey (6 sessions)",
    price: "₹18,000",
    unit: "/ 6 sessions",
    featured: true,
    desc: "A committed arc of change — our most transformative option.",
    cta: "Start the journey",
    features: ["Six 60-minute sessions", "Save ₹3,000 vs. single", "Between-session practices", "WhatsApp support throughout", "Free discovery call"],
  },
  {
    name: "EFT Session",
    price: "₹2,800",
    unit: "/ session",
    featured: false,
    desc: "Guided tapping to release stress, anxiety and blocks.",
    cta: "Book EFT session",
    features: ["45-minute guided session", "Held privately over Zoom", "Take-home tapping sequence", "Free 30-min discovery call"],
  },
];

const FAQS = [
  { q: "How do I know which option is right for me?", a: "Start with the free discovery call. We'll talk through where you are and what you're hoping for, and I'll recommend the path that fits — no pressure to commit." },
  { q: "Are sessions online or in person?", a: "All sessions are held privately over Zoom, so you can join from anywhere. A calendar invite with the link arrives as soon as you book." },
  { q: "What is your cancellation policy?", a: "Life happens. Reschedule or cancel up to 24 hours before your session at no charge. Within 24 hours, the session is counted as held." },
  { q: "Can I combine courses with coaching?", a: "Absolutely — many clients pair a self-paced course with one-on-one sessions. The all-access bundle also includes monthly live group calls." },
];

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState(0);

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

  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="pr-hero sw-page-pad">
        <div className="pr-hero-orb" />
        <div className="rv pr-hero-inner">
          <span className="mono-label mono-label--light" style={{ display: "block", marginBottom: 8 }}>
            simple, honest pricing
          </span>
          <h1 className="pr-hero-h1">Invest in your inner work</h1>
          <p className="pr-hero-sub">
            Pay per session, or commit to a journey. No hidden fees — every plan
            includes a free discovery call.
          </p>
        </div>
      </section>

      {/* ── PLANS ─────────────────────────────────────────────────────── */}
      <section className="pr-plans sw-page-pad">
        <div className="rv pr-plans-grid">
          {PLANS.map(p => (
            <div key={p.name} className={`pr-plan-card lift${p.featured ? " pr-plan-featured" : ""}`}>
              {p.featured && <span className="pr-plan-badge">MOST CHOSEN</span>}
              <div className="pr-plan-name" style={{ color: p.featured ? "#8FE0D4" : "#0E766B" }}>
                {p.name}
              </div>
              <div className="pr-plan-price-row">
                <span className="pr-plan-price" style={{ color: p.featured ? "#F4F1E9" : "#12362B" }}>
                  {p.price}
                </span>
                <span className="pr-plan-unit" style={{ color: p.featured ? "#8FA394" : "#6B7A6F" }}>
                  {p.unit}
                </span>
              </div>
              <p className="pr-plan-desc" style={{ color: p.featured ? "#B9C6BC" : "#4A4E44" }}>
                {p.desc}
              </p>
              <Link
                to="/booking"
                className="pr-plan-cta"
                style={{
                  background: p.featured ? "#5FC8B8" : "#12362B",
                  color: p.featured ? "#0C241C" : "#FFF",
                }}
              >
                {p.cta}
              </Link>
              <div className="pr-plan-rule" style={{ background: p.featured ? "rgba(255,255,255,.14)" : "rgba(18,54,43,.1)" }} />
              <div className="pr-plan-features">
                {p.features.map(f => (
                  <div key={f} className="pr-plan-feature">
                    <span className="pr-plan-check" style={{ color: p.featured ? "#8FE0D4" : "#0E9C8A" }}>✓</span>
                    <span style={{ color: p.featured ? "#DDE4DC" : "#2A362D" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="rv pr-note">All prices in INR · GST included · Sessions held online via Zoom</p>
      </section>

      {/* ── COURSES NOTE ──────────────────────────────────────────────── */}
      <section className="pr-courses sw-page-pad">
        <div className="rv pr-courses-grid">
          <div className="pr-courses-light">
            <span className="pr-courses-kicker" style={{ color: "#0E766B" }}>Self-paced courses</span>
            <h3 className="pr-courses-title" style={{ color: "#12362B" }}>Buy any course individually</h3>
            <p className="pr-courses-desc" style={{ color: "#4A4E44" }}>
              Courses range from <strong>Free</strong> to <strong>₹2,999</strong>.
              Lifetime access, learn at your own pace.
            </p>
            <Link to="/series" className="pr-courses-link" style={{ color: "#0E766B" }}>
              Browse courses →
            </Link>
          </div>
          <div className="pr-courses-dark">
            <span className="pr-courses-kicker" style={{ color: "#8FE0D4" }}>All-access bundle</span>
            <h3 className="pr-courses-title" style={{ color: "#F4F1E9" }}>Both series + monthly group calls</h3>
            <p className="pr-courses-desc" style={{ color: "#B9C6BC" }}>
              Every course in the Youth and Leadership series, plus live monthly group coaching — <strong style={{ color: "#F4F1E9" }}>₹7,999/yr</strong>.
            </p>
            <Link to="/booking" className="pr-courses-link" style={{ color: "#8FE0D4" }}>
              Get all-access →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="pr-faq sw-page-pad">
        <div className="rv pr-faq-inner">
          <h2 className="pr-faq-h2">Questions, answered</h2>
          <div className="pr-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className="pr-faq-item">
                <button
                  className="pr-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span
                    className="pr-faq-arrow"
                    style={{
                      color: openFaq === i ? "#0E766B" : "#9AB0A6",
                      transform: openFaq === i ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >›</span>
                </button>
                <div
                  className="pr-faq-body"
                  style={{ maxHeight: openFaq === i ? "200px" : "0", opacity: openFaq === i ? 1 : 0 }}
                >
                  <p className="pr-faq-a">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer compact />
      <a href="https://wa.me/919810059991" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">💬</a>
    </>
  );
}
