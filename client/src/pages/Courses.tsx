import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Courses.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  "all-levels": "All Levels",
};

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/courses`).then(r => r.json()),
      fetch(`${API}/api/series`).then(r => r.json()),
    ])
      .then(([c, s]) => {
        setCourses(Array.isArray(c) ? c : []);
        setSeries(Array.isArray(s) ? s : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? courses.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.short_description?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    : courses;

  // Group courses by series_id
  const seriesMap = new Map<number, any[]>();
  const standalone: any[] = [];

  filtered.forEach(c => {
    if (c.series_id) {
      const arr = seriesMap.get(c.series_id) ?? [];
      arr.push(c);
      seriesMap.set(c.series_id, arr);
    } else {
      standalone.push(c);
    }
  });

  return (
    <div className="main">
      <Navbar />

      <section className="courses-hero">
        <h1>Courses & Series</h1>
        <p>Structured learning journeys crafted by Neha for lasting transformation</p>
        <div className="courses-search-wrap">
          <svg className="courses-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="courses-search"
            type="search"
            placeholder="Search courses…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="courses-search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
          )}
        </div>
      </section>

      <div className="courses-page">
        {loading ? (
          <div className="courses-loading">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="courses-empty">
            <p>Courses are coming soon. Check back shortly!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="courses-empty">
            <p>No courses match "<strong>{query}</strong>".</p>
            <button className="courses-clear-btn" onClick={() => setQuery("")}>Clear search</button>
          </div>
        ) : (
          <>
            {/* Series with their courses */}
            {series.map(s => {
              const sCourses = seriesMap.get(s.id) ?? [];
              return (
                <div key={s.id} className="courses-series-section">
                  <div className="courses-series-header">
                    <div className="courses-series-header-text">
                      <Link to={`/series/${s.slug}`} className="courses-series-title">{s.title}</Link>
                      {s.description && <p className="courses-series-desc">{s.description}</p>}
                    </div>
                    <Link to={`/series/${s.slug}`} className="courses-series-view-all">
                      View series →
                    </Link>
                  </div>

                  {sCourses.length === 0 ? (
                    <p className="courses-series-empty">Courses coming soon.</p>
                  ) : (
                    <div className="courses-grid">
                      {sCourses.map(course => (
                        <CourseCard key={course.id} course={course} onClick={() => navigate(`/courses/${course.slug}`)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Standalone courses */}
            {standalone.length > 0 && (
              <div className="courses-series-section">
                <div className="courses-series-header">
                  <div className="courses-series-header-text">
                    <span className="courses-series-title">Standalone Courses</span>
                  </div>
                </div>
                <div className="courses-grid">
                  {standalone.map(course => (
                    <CourseCard key={course.id} course={course} onClick={() => navigate(`/courses/${course.slug}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function CourseCard({ course, onClick }: { course: any; onClick: () => void }) {
  return (
    <div className="course-card" onClick={onClick}>
      {course.thumbnail_url ? (
        <img src={course.thumbnail_url} alt={course.title} className="course-card-thumb" />
      ) : (
        <div className="course-card-thumb-placeholder" />
      )}
      <div className="course-card-body">
        <div className="course-card-badges">
          {course.level && course.level !== "all-levels" && (
            <span className="course-card-badge">{LEVEL_LABELS[course.level] ?? course.level}</span>
          )}
        </div>
        <h3 className="course-card-title">{course.title}</h3>
        {(course.short_description || course.description) && (
          <p className="course-card-desc">{course.short_description || course.description}</p>
        )}
        {(course.total_lessons > 0 || course.total_duration > 0) && (
          <div className="course-card-meta">
            {course.total_lessons > 0 && (
              <span>{course.total_lessons} lesson{course.total_lessons !== 1 ? "s" : ""}</span>
            )}
            {course.total_duration > 0 && (
              <span>{Math.round(course.total_duration / 60)} min</span>
            )}
          </div>
        )}
        <div className="course-card-footer">
          <span className="course-card-price">
            {course.price === 0 ? "Free" : `₹${(course.price / 100).toLocaleString("en-IN")}`}
          </span>
          <button className="course-card-btn">View Course</button>
        </div>
      </div>
    </div>
  );
}
