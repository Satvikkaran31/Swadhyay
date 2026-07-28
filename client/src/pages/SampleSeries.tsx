import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/SamplePages.css";

const SERIES = {
  title: "Swadhyay Youth Series",
  subtitle: "For young professionals ready to step into their best selves",
  description:
    "A curated series for young professionals ready to step into their best selves — with confidence, clarity, and purpose. Each course stands alone, but together they form a complete journey inward.",
  stat: { courses: 3, students: 380, rating: 4.8 },
  courses: [
    {
      id: 1,
      slug: "who-am-i",
      title: "Who Am I?",
      short: "A guided self-discovery journey to uncover your values, strengths, and authentic identity.",
      level: "All Levels",
      lessons: 18,
      duration: "4.5 hrs",
      price: 0,
      badge: "Start here",
    },
    {
      id: 2,
      slug: "your-best-interview-is-your-best-self",
      title: "Your Best Interview Is Your Best Self",
      short: "Land your dream role by showing up as your most authentic, confident self.",
      level: "Beginner",
      lessons: 14,
      duration: "3.2 hrs",
      price: 0,
      badge: "Most popular",
    },
    {
      id: 3,
      slug: "leadership-presence",
      title: "Leadership Presence",
      short: "Command the room and lead with authenticity, clarity, and executive gravitas.",
      level: "Intermediate",
      lessons: 22,
      duration: "6 hrs",
      price: 199900,
      badge: null,
    },
  ],
};

export default function SampleSeries() {
  const navigate = useNavigate();

  return (
    <div className="main">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="ss-hero">
        <div className="ss-hero-inner">
          <nav className="ss-breadcrumb">
            <Link to="/courses">Courses</Link>
            <span>›</span>
            <span>{SERIES.title}</span>
          </nav>

          <p className="ss-hero-eyebrow">Course Series</p>
          <h1 className="ss-hero-title">{SERIES.title}</h1>
          <p className="ss-hero-subtitle">{SERIES.subtitle}</p>
          <p className="ss-hero-desc">{SERIES.description}</p>

          <div className="ss-hero-stats">
            <div className="ss-stat">
              <span className="ss-stat-num">{SERIES.stat.courses}</span>
              <span className="ss-stat-label">Courses</span>
            </div>
            <div className="ss-stat-divider" />
            <div className="ss-stat">
              <span className="ss-stat-num">{SERIES.stat.students}+</span>
              <span className="ss-stat-label">Students</span>
            </div>
            <div className="ss-stat-divider" />
            <div className="ss-stat">
              <span className="ss-stat-num">★ {SERIES.stat.rating}</span>
              <span className="ss-stat-label">Avg rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="ss-body">

        {/* What the series offers */}
        <section className="ss-offers">
          <h2>What This Series Offers</h2>
          <div className="ss-offers-grid">
            {[
              { icon: "🔍", title: "Deep Self-Awareness", desc: "Go beyond surface-level tips. Each course helps you understand yourself at a deeper level." },
              { icon: "🎯", title: "Practical Tools", desc: "Worksheets, frameworks, and guided exercises you can use the same day you watch." },
              { icon: "🌱", title: "Progressive Learning", desc: "Courses are sequenced — each one builds on the insights of the last." },
            ].map(o => (
              <div key={o.title} className="ss-offer-card">
                <span className="ss-offer-icon">{o.icon}</span>
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Courses in this series */}
        <section className="ss-courses">
          <h2>Courses in This Series</h2>
          <div className="ss-course-list">
            {SERIES.courses.map((course, idx) => (
              <div
                key={course.id}
                className="ss-course-card"
                onClick={() => navigate(`/courses/${course.slug}`)}
              >
                <div className="ss-course-num">{String(idx + 1).padStart(2, "0")}</div>

                <div className="ss-course-thumb">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
                  </svg>
                </div>

                <div className="ss-course-info">
                  <div className="ss-course-top">
                    <div className="ss-course-badges">
                      <span className="ss-badge">{course.level}</span>
                      {course.badge && <span className="ss-badge featured">{course.badge}</span>}
                    </div>
                  </div>
                  <h3>{course.title}</h3>
                  <p className="ss-course-short">{course.short}</p>
                  <div className="ss-course-meta">
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {course.lessons} lessons
                    </span>
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {course.duration}
                    </span>
                    <span className="ss-course-price">
                      {course.price === 0 ? "Free" : `₹${(course.price / 100).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                </div>

                <button
                  className="ss-view-btn"
                  onClick={e => { e.stopPropagation(); navigate(`/courses/${course.slug}`); }}
                >
                  View Course
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Instructor callout */}
        <section className="ss-instructor-cta">
          <div className="ss-instructor-cta-avatar">N</div>
          <div>
            <p className="ss-instructor-cta-name">Neha Verma</p>
            <p className="ss-instructor-cta-role">Executive & Life Coach · 25+ years</p>
            <p className="ss-instructor-cta-quote">
              "The Swadhyay Youth Series is my love letter to every young professional who is trying to figure out
              who they are beneath the résumé. These courses are where that journey starts."
            </p>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
