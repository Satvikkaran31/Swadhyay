// Called "Pricing" in the navigation
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BookingModal from "../components/BookingModal";
import RazorpayButton from "../components/RazorpayButton";
import "../styles/Booking.css";

const PACKAGES = [
  {
    id: "discovery",
    icon: "✨",
    name: "Discovery Call",
    duration: "30 min · Free",
    tag: "Get started",
    description:
      "An introductory call to explore your goals and see if we are a good fit. No commitment required, just an honest conversation.",
    features: [
      "Understand your coaching needs",
      "Explore your challenges and goals",
      "Zero cost, zero pressure",
    ],
    initialSessionType: "one-on-one",
    featured: false,
  },
  {
    id: "one-on-one",
    icon: "🌱",
    name: "1:1 Coaching",
    duration: "60 min · Personal coaching",
    tag: "Most popular",
    description:
      "Focused one-on-one sessions tailored to your unique challenges and aspirations. Deep, personalised support at every step.",
    features: [
      "Customised coaching plan",
      "Goal tracking and accountability",
      "Actionable strategies for growth",
    ],
    initialSessionType: "one-on-one",
    featured: true,
  },
  {
    id: "eft",
    icon: "🌿",
    name: "EFT Session",
    duration: "60 min · Emotional Freedom Technique",
    tag: "Holistic healing",
    description:
      "Harness the power of EFT tapping to release emotional blocks and reduce stress. Experience lasting shifts in your patterns.",
    features: [
      "Release limiting beliefs",
      "Reduce stress and anxiety",
      "Shift emotional patterns deeply",
    ],
    initialSessionType: "eft",
    featured: false,
  },
];

const FAQS = [
  {
    q: "What happens in a coaching session?",
    a: "Each session is a focused, confidential conversation between you and Neha. We explore your current challenges, clarify your goals, and identify concrete next steps. Sessions are tailored entirely to you — no generic advice.",
  },
  {
    q: "How many sessions will I need?",
    a: "This varies by person and goal. Many clients see meaningful shifts after 3–6 sessions. We recommend starting with a Discovery Call so Neha can give you an honest assessment of what support would be most useful.",
  },
  {
    q: "What is EFT and how is it different from regular coaching?",
    a: "EFT (Emotional Freedom Technique) combines targeted coaching conversations with a gentle tapping practice on acupressure points. It can accelerate breakthroughs on emotional and mindset blocks that talk-based coaching alone may not reach.",
  },
  {
    q: "How do I pay for sessions?",
    a: "After your first session, Neha will quote a package or per-session fee based on your needs. You can then pay securely via the payment section below. For the Discovery Call, there is no fee.",
  },
];

export default function Booking() {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialSessionType, setInitialSessionType] = useState("one-on-one");
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const openModal = (sessionType) => {
    setInitialSessionType(sessionType);
    setModalOpen(true);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <>
      <div className="booking-page">
        <Navbar />

        {/* Hero */}
        <section className="booking-hero">
          <h1>Work with Neha</h1>
          <p>
            Personalised coaching to help you lead with clarity, grow with
            intention, and live with purpose.
          </p>
        </section>

        {/* Package Cards */}
        <div className="packages-grid">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card${pkg.featured ? " featured" : ""}`}
            >
              <span className="package-card-icon">{pkg.icon}</span>
              <span className="package-tag">{pkg.tag}</span>
              <h3>{pkg.name}</h3>
              <p className="package-duration">{pkg.duration}</p>
              <p className="package-description">{pkg.description}</p>
              <ul className="package-features">
                {pkg.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className="package-btn"
                onClick={() => openModal(pkg.initialSessionType)}
              >
                Book a Session
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {FAQS.map((item, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                aria-expanded={openFAQ === i}
              >
                {item.q}
                <span className={`faq-chevron${openFAQ === i ? " open" : ""}`}>
                  ▼
                </span>
              </button>
              <p className={`faq-answer${openFAQ === i ? " open" : ""}`}>
                {item.a}
              </p>
            </div>
          ))}
        </section>

        {/* Payment toggle */}
        <div className="pay-toggle-section">
          <button className="pay-toggle" onClick={() => setShowPay((v) => !v)}>
            {showPay ? "▲ Hide payment" : "↓ Already have a quoted amount? Pay here"}
          </button>

          {showPay && (
            <div className="pay-section">
              <h3>Pay for your session</h3>
              <>
                  <div className="form-group">
                    <label htmlFor="pay-amount" className="form-label">
                      Amount (₹)
                    </label>
                    <div className="input-wrapper">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="text"
                        id="pay-amount"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className="amount-input"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  <RazorpayButton
                    amount={amount}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                  <div className="security-info">
                    <div className="security-badge">
                      <svg
                        className="shield-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Secure Payment via Razorpay</span>
                    </div>
                  </div>
                </>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {modalOpen && (
        <BookingModal
          onClose={() => setModalOpen(false)}
          initialSessionType={initialSessionType}
        />
      )}
    </>
  );
}
