import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import "../styles/MyLearning.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function MyLearning() {
  const { user, setUser, loading: authLoading } = useUser();
  const login = useTriggerGoogleLogin(setUser);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // rv-go entrance animation
  useEffect(() => {
    const t0 = document.timeline?.currentTime ?? 0;
    requestAnimationFrame(() => {
      const t1 = document.timeline?.currentTime ?? 0;
      if (t1 > t0) { document.body.classList.add("rv-go"); return; }
      requestAnimationFrame(() => document.body.classList.add("rv-go"));
    });
    return () => { document.body.classList.remove("rv-go"); };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch(`${API}/api/enrollments/mine`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <>
      <Navbar />

      <section className="ml-hero sw-page-pad">
        <div className="rv ml-hero-inner">
          <span className="mono-label mono-label--light">your progress</span>
          <h1 className="ml-hero-h1">My Learning</h1>
          <p className="ml-hero-sub">Pick up where you left off.</p>
        </div>
      </section>

      <section className="ml-body sw-page-pad">
        <div className="ml-body-inner">
          {authLoading || loading ? (
            <div className="ml-status">
              <div className="ml-spinner" />
              <span>Loading…</span>
            </div>
          ) : !user ? (
            <div className="ml-status">
              <p>Log in to see your courses.</p>
              <button className="ml-card-btn" style={{ width: "auto", padding: "13px 28px" }} onClick={() => login()}>
                Log in with Google
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="ml-status">
              <p>No courses yet. Start learning something new.</p>
              <button className="ml-card-btn" style={{ width: "auto", padding: "13px 28px" }} onClick={() => navigate("/courses")}>
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="ml-grid">
              {courses.map(course => {
                const total = Number(course.total_lessons);
                const done = Number(course.completed_lessons);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={course.id} className="ml-card">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="ml-card-thumb"
                      />
                    ) : (
                      <div className="ml-card-thumb-placeholder" />
                    )}
                    <div className="ml-card-body">
                      <div className="ml-card-title">{course.title}</div>
                      <div>
                        <div className="ml-card-progress-track">
                          <div className="ml-card-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="ml-card-progress-label">
                          {pct}% complete · {done}/{total} lessons
                        </div>
                      </div>
                      <button
                        className="ml-card-btn"
                        onClick={() => navigate(`/courses/${course.slug}/learn`)}
                      >
                        {pct === 0 ? "Start Learning" : pct === 100 ? "Review Course" : "Continue"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
