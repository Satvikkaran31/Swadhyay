import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/SeriesListing.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function SkeletonCard() {
  return (
    <div className="sl-card skeleton">
      <div className="sl-card-thumb sk-block" />
      <div className="sl-card-body">
        <div className="sk-line w60" />
        <div className="sk-line w90" style={{ marginTop: "0.5rem" }} />
        <div className="sk-line w75" style={{ marginTop: "0.25rem" }} />
        <div className="sk-line w40" style={{ marginTop: "1rem" }} />
      </div>
    </div>
  );
}

export default function SeriesListing() {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/series`)
      .then(r => r.json())
      .then(d => { setSeries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="main">
      <Navbar />

      <div className="sl-hero">
        <div className="sl-hero-inner">
          <p className="sl-hero-eyebrow">Structured Learning</p>
          <h1 className="sl-hero-title">Course Series</h1>
          <p className="sl-hero-sub">
            Curated journeys designed by Neha — each series takes you deeper than a single course ever could.
          </p>
        </div>
      </div>

      <div className="sl-body">
        {loading ? (
          <div className="sl-grid">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : series.length === 0 ? (
          <div className="sl-empty">
            <p>Series are coming soon. Check back shortly!</p>
            <Link to="/courses" className="sl-empty-link">Browse individual courses →</Link>
          </div>
        ) : (
          <div className="sl-grid">
            {series.map(s => (
              <Link
                key={s.id}
                to={`/series/${s.slug}`}
                className="sl-card"
              >
                {s.thumbnail_url ? (
                  <img src={s.thumbnail_url} alt={s.title} className="sl-card-thumb" />
                ) : (
                  <div className="sl-card-thumb-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35">
                      <rect x="2" y="3" width="20" height="4" rx="1" />
                      <rect x="2" y="10" width="20" height="4" rx="1" />
                      <rect x="2" y="17" width="20" height="4" rx="1" />
                    </svg>
                  </div>
                )}
                <div className="sl-card-body">
                  <h2 className="sl-card-title">{s.title}</h2>
                  {s.description && (
                    <p className="sl-card-desc">{s.description}</p>
                  )}
                  <div className="sl-card-footer">
                    <span className="sl-course-count">
                      {s.course_count ?? 0} course{s.course_count !== 1 ? "s" : ""}
                    </span>
                    <span className="sl-card-btn">View Series →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
