import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/SamplePages.css";

const COURSE = {
  title: "Who Am I?",
  tagline: "A guided self-discovery journey to uncover your values, strengths, and authentic identity.",
  description:
    "This course takes you through a structured self-assessment process — combining reflective exercises, coaching frameworks, and Neha's signature methodology — to help you understand who you truly are beneath the roles you play. Ideal for anyone at a crossroads or seeking deeper clarity.",
  series: { title: "Swadhyay Youth Series", slug: "swadhyay-youth-series" },
  level: "All Levels",
  language: "English",
  price: 0,
  stats: { rating: 4.9, reviews: 31, students: 124, lessons: 18, duration: "4.5 hrs" },
  whatYoullLearn: [
    "Identify your core values and non-negotiables",
    "Understand your dominant thinking patterns",
    "Recognise the masks you wear in different roles",
    "Build a personal mission statement",
    "Navigate life transitions with clarity and confidence",
    "Move from external validation to internal authority",
  ],
  requirements: [
    "No prior coaching or self-help background needed",
    "A journal or notebook is helpful but not required",
    "An openness to honest self-reflection",
  ],
  modules: [
    {
      id: 1, title: "Foundation: The Question Beneath All Questions",
      lessons: [
        { id: 1, title: "Welcome & What to Expect", duration: "5:12", preview: true },
        { id: 2, title: "Why We Lose Ourselves", duration: "11:34" },
        { id: 3, title: "The Roles We Play vs. Who We Are", duration: "14:22" },
      ],
    },
    {
      id: 2, title: "Values, Beliefs & Identity",
      lessons: [
        { id: 4, title: "Mapping Your Core Values", duration: "18:05" },
        { id: 5, title: "The Belief Audit", duration: "22:14" },
        { id: 6, title: "How Your History Shapes Your Identity", duration: "16:40" },
        { id: 7, title: "Guided Exercise: The Values Hierarchy", duration: "9:33" },
      ],
    },
    {
      id: 3, title: "Strengths, Shadows & Authentic Expression",
      lessons: [
        { id: 8, title: "Your Unique Strengths Inventory", duration: "15:27" },
        { id: 9, title: "Owning Your Shadows", duration: "20:11" },
        { id: 10, title: "Authentic Expression vs. Performance", duration: "13:58" },
      ],
    },
    {
      id: 4, title: "Living From Your Core",
      lessons: [
        { id: 11, title: "Writing Your Personal Mission Statement", duration: "12:44" },
        { id: 12, title: "Decision-Making From the Inside Out", duration: "17:30" },
        { id: 13, title: "Integration & Next Steps", duration: "8:19" },
      ],
    },
  ],
  reviews: [
    { id: 1, name: "Priya Sharma", initials: "PS", rating: 5, date: "Dec 2024", text: "This course completely changed how I see myself. Neha's approach is so warm and direct — I finally feel grounded in who I am." },
    { id: 2, name: "Arjun Kapoor", initials: "AK", rating: 5, date: "Jan 2025", text: "I did this during a career transition and it gave me exactly the clarity I needed. The values exercise alone was worth it." },
    { id: 3, name: "Meera Nair", initials: "MN", rating: 4, date: "Feb 2025", text: "Deep, honest, and practical. I appreciated that it wasn't just theory — every module had something I could actually do." },
  ],
};

function Stars({ n, size = "1rem" }: { n: number; size?: string }) {
  return (
    <span className="sc-stars" style={{ fontSize: size }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

export default function SampleCourse() {
  const [openMod, setOpenMod] = useState<number | null>(1);
  const total = COURSE.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="main">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="sc-hero">
        <div className="sc-hero-inner">
          <nav className="sc-breadcrumb">
            <Link to="/courses">Courses</Link>
            <span>›</span>
            <Link to={`/series/${COURSE.series.slug}`}>{COURSE.series.title}</Link>
            <span>›</span>
            <span>{COURSE.title}</span>
          </nav>

          <div className="sc-hero-badges">
            <span className="sc-badge">{COURSE.level}</span>
            <span className="sc-badge lang">{COURSE.language}</span>
          </div>

          <h1 className="sc-hero-title">{COURSE.title}</h1>
          <p className="sc-hero-tagline">{COURSE.tagline}</p>

          <div className="sc-hero-rating">
            <span className="sc-rating-num">{COURSE.stats.rating}</span>
            <Stars n={5} size="0.95rem" />
            <span className="sc-rating-count">({COURSE.stats.reviews} reviews)</span>
            <span className="sc-dot">·</span>
            <span>{COURSE.stats.students} students</span>
          </div>

          <div className="sc-hero-meta">
            <span>{total} lessons</span>
            <span className="sc-dot">·</span>
            <span>{COURSE.stats.duration} total</span>
            <span className="sc-dot">·</span>
            <span>{COURSE.modules.length} modules</span>
          </div>

          <p className="sc-hero-instructor">By <strong>Neha Verma</strong> · Executive & Life Coach</p>
        </div>

        {/* Floating CTA card */}
        <div className="sc-hero-card">
          <div className="sc-card-thumb">
            <div className="sc-card-thumb-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
              </svg>
              <span>Preview available</span>
            </div>
          </div>
          <div className="sc-card-body">
            <div className="sc-card-price">
              {COURSE.price === 0 ? <span className="sc-free">Free</span> : `₹${COURSE.price.toLocaleString("en-IN")}`}
            </div>
            <button className="sc-enroll-btn">Enroll for Free</button>
            <p className="sc-card-note">Full lifetime access · Certificate on completion</p>
            <ul className="sc-card-includes">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
                {COURSE.stats.duration} on-demand video
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Worksheets & exercises
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
                Access on all devices
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="sc-body">

        {/* ── Stats bar ──────────────────────────────────────── */}
        <div className="sc-stats-bar">
          {[
            { label: "Rating", value: `${COURSE.stats.rating} ★` },
            { label: "Students", value: COURSE.stats.students },
            { label: "Lessons", value: total },
            { label: "Duration", value: COURSE.stats.duration },
          ].map(s => (
            <div key={s.label} className="sc-stat">
              <span className="sc-stat-value">{s.value}</span>
              <span className="sc-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── What You'll Learn ──────────────────────────────── */}
        <section className="sc-learn-box">
          <h2>What You'll Learn</h2>
          <ul className="sc-learn-grid">
            {COURSE.whatYoullLearn.map((item, i) => (
              <li key={i}>
                <span className="sc-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ── About the instructor ───────────────────────────── */}
        <section className="sc-instructor">
          <h2>Your Instructor</h2>
          <div className="sc-instructor-card">
            <div className="sc-instructor-avatar">N</div>
            <div className="sc-instructor-info">
              <h3>Neha Verma</h3>
              <p className="sc-instructor-title">Executive & Life Coach · 25+ years of experience</p>
              <div className="sc-instructor-stats">
                <span>★ 4.9 instructor rating</span>
                <span>·</span>
                <span>400+ students</span>
                <span>·</span>
                <span>5 courses</span>
              </div>
              <p className="sc-instructor-bio">
                Neha is a certified executive and life coach who has worked with leaders, young professionals,
                and organisations across India. Her coaching integrates evidence-based practices with deep
                human presence — helping clients move from clarity of mind to clarity of self.
              </p>
            </div>
          </div>
        </section>

        {/* ── Requirements ──────────────────────────────────── */}
        <section className="sc-requirements">
          <h2>Requirements</h2>
          <ul className="sc-req-list">
            {COURSE.requirements.map((item, i) => (
              <li key={i}><span>·</span>{item}</li>
            ))}
          </ul>
        </section>

        {/* ── Curriculum ────────────────────────────────────── */}
        <section className="sc-curriculum">
          <div className="sc-curriculum-header">
            <h2>Course Content</h2>
            <span className="sc-curriculum-meta">{COURSE.modules.length} modules · {total} lessons · {COURSE.stats.duration}</span>
          </div>
          {COURSE.modules.map(mod => (
            <div key={mod.id} className="sc-module">
              <button
                className={`sc-module-header ${openMod === mod.id ? "open" : ""}`}
                onClick={() => setOpenMod(openMod === mod.id ? null : mod.id)}
              >
                <svg className={`sc-chevron ${openMod === mod.id ? "rotated" : ""}`} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="sc-module-title">{mod.title}</span>
                <span className="sc-module-count">{mod.lessons.length} lessons</span>
              </button>
              {openMod === mod.id && (
                <div className="sc-lessons">
                  {mod.lessons.map(lesson => (
                    <div key={lesson.id} className="sc-lesson">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span className="sc-lesson-title">{lesson.title}</span>
                      {lesson.preview && <span className="sc-preview-chip">Preview</span>}
                      <span className="sc-lesson-dur">{lesson.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ── Reviews ───────────────────────────────────────── */}
        <section className="sc-reviews">
          <div className="sc-reviews-header">
            <h2>Student Reviews</h2>
            <div className="sc-reviews-avg">
              <span className="sc-avg-num">{COURSE.stats.rating}</span>
              <Stars n={5} />
              <span className="sc-avg-count">({COURSE.stats.reviews})</span>
            </div>
          </div>
          <div className="sc-review-list">
            {COURSE.reviews.map(r => (
              <div key={r.id} className="sc-review-card">
                <div className="sc-review-avatar">{r.initials}</div>
                <div className="sc-review-body">
                  <div className="sc-review-meta">
                    <span className="sc-review-name">{r.name}</span>
                    <Stars n={r.rating} size="0.85rem" />
                    <span className="sc-review-date">{r.date}</span>
                  </div>
                  <p>{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ── Sticky bottom CTA ─────────────────────────────── */}
      <div className="sc-sticky-cta">
        <span className="sc-sticky-title">{COURSE.title}</span>
        <div className="sc-sticky-right">
          <span className="sc-sticky-price">Free</span>
          <button className="sc-enroll-btn sm">Enroll for Free</button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
