import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import nehaPortrait from "../assets/profilepicture.webp";
import "../styles/WhoAmI.css";

const VALUES = [
  { num: "01", title: "Presence", desc: "Leading from attention and calm, not reaction — showing up fully in every room." },
  { num: "02", title: "Clarity", desc: "Knowing your values and letting them guide steady, confident decisions." },
  { num: "03", title: "Empathy", desc: "Understanding yourself deeply so you can truly understand and serve others." },
];

const CREDENTIALS = ["ICF PCC", "Senior Mentor, Jagriti Yatra", "EFT Practitioner"];

export default function WhoAmI() {
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
      <section className="wa-hero sw-page-pad">
        <div className="wa-hero-orb" />
        <div className="wa-hero-grid">
          <div className="rv">
            <span className="mono-label mono-label--light" style={{ display: "block", marginBottom: 10 }}>
              the meaning behind the name
            </span>
            <h1 className="wa-hero-h1">
              Swadhyay means <span style={{ fontStyle: "italic", color: "#8FE0D4" }}>self-study</span>
            </h1>
            <p className="wa-hero-sub">
              A Sanskrit word for the practice of looking inward — of understanding your own
              thoughts, beliefs, desires and behaviours. It is the quiet foundation beneath
              every great leader.
            </p>
          </div>
          <div className="rv wa-hero-rings-wrap">
            <div className="wa-hero-ring wa-ring-1" />
            <div className="wa-hero-ring wa-ring-2" />
            <div className="wa-hero-ring wa-ring-3" />
            <div className="wa-hero-center">
              <span>स्व</span>
            </div>
            <div className="wa-chip wa-chip-1" style={{ animation: "floaty 7s ease-in-out infinite" }}>
              <span className="wa-chip-dot" />reflection
            </div>
            <div className="wa-chip wa-chip-2" style={{ animation: "floaty 6.5s ease-in-out infinite .8s" }}>
              <span className="wa-chip-dot" />awareness
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ───────────────────────────────────────────────────── */}
      <section className="wa-mission sw-page-pad">
        <div className="rv wa-mission-grid">
          <div>
            <span className="mono-label" style={{ color: "#0E766B" }}>Our mission</span>
            <p className="wa-mission-quote">
              "Who looks outside, dreams. Who looks inside, awakens."
            </p>
            <span className="mono-label" style={{ display: "block", marginTop: 12, color: "#0E766B" }}>
              — Carl Jung
            </span>
            <p className="wa-mission-body">
              Self-awareness is the trait shared by the finest leaders. It fosters compassion,
              deepens empathy, and turns knowledge into wisdom. Swadhyay exists to guide that
              inward journey — for leaders, professionals and young people ready to grow.
            </p>
          </div>
          <div className="wa-mission-visual" aria-hidden="true" />
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────────── */}
      <section className="wa-values sw-page-pad">
        <div className="rv wa-values-inner">
          <h2 className="wa-values-h2">What guides the work</h2>
          <div className="wa-values-grid">
            {VALUES.map(v => (
              <div key={v.num} className="wa-value-card lift">
                <div className="wa-value-num">{v.num}</div>
                <h3 className="wa-value-title">{v.title}</h3>
                <p className="wa-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT NEHA ────────────────────────────────────────────────── */}
      <section className="wa-neha sw-page-pad">
        <div className="wa-neha-orb" />
        <div className="rv wa-neha-grid">
          <div className="wa-neha-portrait-wrap">
            <div className="wa-portrait-ring" />
            <div className="wa-portrait-img">
              <img src={nehaPortrait} alt="Neha Sharma" className="wa-portrait-photo" loading="lazy" />
            </div>
            <div className="wa-portrait-badge" style={{ animation: "floaty 7s ease-in-out infinite" }}>
              <div className="wa-badge-title">PCC · ICF Certified</div>
              <div className="wa-badge-sub">700+ coaching hours</div>
            </div>
          </div>
          <div className="wa-neha-copy">
            <span className="mono-label" style={{ color: "#8FE0D4" }}>Meet your coach</span>
            <h2 className="wa-neha-h2">Neha Sharma</h2>
            <div className="wa-credentials">
              {CREDENTIALS.map(c => (
                <span key={c} className="wa-cred">
                  <span className="wa-cred-dot" />{c}
                </span>
              ))}
            </div>
            <p className="wa-neha-bio">
              Neha is an ICF PCC-certified coach and Senior Mentor at Jagriti Yatra, with over
              700 hours guiding leaders, professionals and young people through deep, reflective
              change. Her work blends proven coaching frameworks with the ancient practice of
              swadhyay — self-study.
            </p>
            <blockquote className="wa-blockquote">
              "Leadership begins within — presence, clarity and empathy are not techniques to
              perform, but qualities to uncover."
            </blockquote>
            <div className="wa-stats">
              <div>
                <div className="wa-stat-val">380+</div>
                <div className="wa-stat-label">people guided</div>
              </div>
              <div className="wa-stat-divider" />
              <div>
                <div className="wa-stat-val">25 yrs</div>
                <div className="wa-stat-label">of practice</div>
              </div>
              <div className="wa-stat-divider" />
              <div>
                <div className="wa-stat-val">700+</div>
                <div className="wa-stat-label">coaching hours</div>
              </div>
            </div>
            <Link to="/booking" className="wa-cta">Book a session with Neha →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="wa-cta-section sw-page-pad">
        <div className="rv wa-cta-card">
          <div className="wa-cta-orb" />
          <div className="wa-cta-copy">
            <span className="mono-label" style={{ color: "#5FC8B8" }}>let's begin this journey together</span>
            <h2 className="wa-cta-h2">Start your inner work</h2>
            <p className="wa-cta-sub">
              The first conversation is where everything begins. Book a session, or explore
              the courses at your own pace.
            </p>
            <div className="wa-cta-btns">
              <Link to="/booking" className="home-btn-primary">Book a session →</Link>
              <Link to="/series" className="home-btn-outline">Explore courses</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
