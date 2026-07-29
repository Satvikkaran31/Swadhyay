import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BookingModal from "../components/BookingModal";
import RazorpayButton from "../components/RazorpayButton";
import "../styles/Booking.css";

const SESSION_TYPES = [
  {
    id: "discovery",
    name: "Discovery Call",
    desc: "An introductory call to explore your goals and see if we're a good fit. No commitment required.",
    price: "Free",
    length: "30 min",
    sessionType: "one-on-one",
  },
  {
    id: "one-on-one",
    name: "1-on-1 Coaching",
    desc: "Guided reflection and emotional clarity, one conversation at a time — a private journey.",
    price: "₹3,500",
    length: "60 min",
    sessionType: "one-on-one",
  },
  {
    id: "eft",
    name: "EFT Session",
    desc: "Guided tapping to release stress, anxiety and blocks. Restores calm and a sense of safety.",
    price: "₹2,800",
    length: "45 min",
    sessionType: "eft",
  },
];

const FAQS = [
  { q: "What happens in a coaching session?", a: "Each session is a focused, confidential conversation between you and Neha. We explore your current challenges, clarify your goals, and identify concrete next steps. Sessions are tailored entirely to you — no generic advice." },
  { q: "How many sessions will I need?", a: "This varies by person and goal. Many clients see meaningful shifts after 3–6 sessions. We recommend starting with a Discovery Call so Neha can give you an honest assessment of what support would be most useful." },
  { q: "What is EFT and how is it different from coaching?", a: "EFT (Emotional Freedom Technique) combines targeted coaching conversations with a gentle tapping practice on acupressure points. It can accelerate breakthroughs on emotional and mindset blocks that talk-based coaching alone may not reach." },
  { q: "Are sessions online or in person?", a: "All sessions are held privately over Zoom, so you can join from anywhere. A calendar invite with the link arrives as soon as you book." },
];

export default function Booking() {
  const [selectedType, setSelectedType] = useState("one-on-one");
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const currentType = SESSION_TYPES.find(t => t.id === selectedType) ?? SESSION_TYPES[1];

  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="bk-hero sw-page-pad">
        <div className="bk-hero-orb" />
        <div className="bk-hero-grid">
          <div className="rv">
            <span className="mono-label mono-label--light" style={{ display: "block", marginBottom: 8 }}>
              the first conversation
            </span>
            <h1 className="bk-hero-h1">Book a session</h1>
            <p className="bk-hero-sub">
              Choose a session type, pick a time that works, and you're set.
              Every session is held privately, online.
            </p>
          </div>
          <div className="rv bk-hero-calendar-wrap">
            <div className="bk-hero-ring bk-ring-1" />
            <div className="bk-hero-ring bk-ring-2" />
            <div className="bk-hero-cal">
              <div className="bk-cal-header">JULY 2026</div>
              <div className="bk-cal-body">
                <span className="bk-cal-day-num">22</span>
                <span className="bk-cal-day-name">Tuesday</span>
              </div>
            </div>
            <div className="bk-chip bk-chip-1" style={{ animation: "floaty 7s ease-in-out infinite" }}>
              <span className="bk-chip-dot" />10:30 AM
            </div>
            <div className="bk-chip bk-chip-2" style={{ animation: "floaty 6.5s ease-in-out infinite .8s" }}>
              <span className="bk-chip-dot" />on Zoom
            </div>
          </div>
        </div>
      </section>

      {/* ── SESSION TYPE SELECTOR ─────────────────────────────────────── */}
      <section className="bk-body sw-page-pad">
        <div className="bk-body-inner">
          <div className="rv bk-flow-card">
            <div className="bk-flow-header">
              <h2 className="bk-flow-h2">Choose your session</h2>
            </div>
            <div className="bk-session-list">
              {SESSION_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`bk-session-row${selectedType === t.id ? " active" : ""}`}
                  onClick={() => setSelectedType(t.id)}
                >
                  <div className="bk-session-copy">
                    <div className="bk-session-name">{t.name}</div>
                    <div className="bk-session-desc">{t.desc}</div>
                  </div>
                  <div className="bk-session-meta">
                    <div className="bk-session-price">{t.price}</div>
                    <div className="bk-session-length">{t.length}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="bk-flow-actions">
              <button
                className="home-btn-primary"
                style={{ fontSize: 17, padding: "18px 38px" }}
                onClick={() => setModalOpen(true)}
              >
                Book — {currentType.name} →
              </button>
              <span className="bk-zoom-note">All sessions held privately on Zoom · IST</span>
            </div>
          </div>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          <div className="rv bk-faq">
            <h2 className="bk-faq-h2">Questions, answered</h2>
            <div className="bk-faq-list">
              {FAQS.map((f, i) => (
                <div key={i} className="bk-faq-item">
                  <button className="bk-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    <span>{f.q}</span>
                    <span
                      className="bk-faq-arrow"
                      style={{
                        color: openFaq === i ? "#0E766B" : "#9AB0A6",
                        transform: openFaq === i ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >›</span>
                  </button>
                  <div className="bk-faq-body" style={{ maxHeight: openFaq === i ? "200px" : "0", opacity: openFaq === i ? 1 : 0 }}>
                    <p className="bk-faq-a">{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PAYMENT ───────────────────────────────────────────────── */}
          <div className="rv bk-pay-section">
            <button className="bk-pay-toggle" onClick={() => setShowPay(v => !v)}>
              {showPay ? "▲ Hide payment" : "↓ Already have a quoted amount? Pay here"}
            </button>
            {showPay && (
              <div className="bk-pay-card">
                <h3 className="bk-pay-title">Pay for your session</h3>
                <div className="bk-pay-row">
                  <label className="bk-pay-label" htmlFor="pay-amount">Amount (₹)</label>
                  <div className="bk-pay-input-wrap">
                    <span className="bk-pay-symbol">₹</span>
                    <input
                      id="pay-amount"
                      type="text"
                      className="bk-pay-input"
                      value={amount}
                      onChange={e => { if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value); }}
                      placeholder="0.00"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                <RazorpayButton amount={amount} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
                <div className="bk-pay-secure">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Secure payment via Razorpay</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <a href="https://wa.me/919810059991" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">💬</a>

      {modalOpen && (
        <BookingModal
          onClose={() => setModalOpen(false)}
          initialSessionType={currentType.sessionType}
        />
      )}
    </>
  );
}
