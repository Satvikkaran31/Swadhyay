import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "../context/UserProvider";
import "../styles/Dashboard.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function memberSince(iso: string | undefined) {
  if (!iso) return "recently";
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function sessionStatus(s: any): "upcoming" | "past" | "cancelled" {
  if (s.cancelled_at) return "cancelled";
  return new Date(s.session_start) > new Date() ? "upcoming" : "past";
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useUser();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

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
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/enrollments/mine`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setCourses(Array.isArray(d) ? d : []); setLoadingCourses(false); })
      .catch(() => setLoadingCourses(false));

    fetch(`${API}/api/calendar/my-sessions`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d : []); setLoadingSessions(false); })
      .catch(() => setLoadingSessions(false));
  }, [user]);

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="dash-loading">
          <div className="dash-spinner" />
        </div>
      </>
    );
  }

  if (!user) return null;

  const completedCourses = courses.filter(c => {
    const total = Number(c.total_lessons);
    const done = Number(c.completed_lessons);
    return total > 0 && done >= total;
  });
  const inProgressCourses = courses.filter(c => {
    const total = Number(c.total_lessons);
    const done = Number(c.completed_lessons);
    return done > 0 && done < total;
  });
  const notStarted = courses.filter(c => Number(c.completed_lessons) === 0);

  const totalLessonsCompleted = courses.reduce((sum, c) => sum + Number(c.completed_lessons || 0), 0);
  const upcomingSessions = sessions.filter(s => sessionStatus(s) === "upcoming");
  const pastSessions = sessions.filter(s => sessionStatus(s) === "past");

  const continueList = [...inProgressCourses, ...notStarted];

  return (
    <>
      <Navbar />

      {/* ── Hero / Profile ── */}
      <section className="dash-hero sw-page-pad">
        <div className="rv dash-hero-inner">
          <div className="dash-avatar-wrap">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="dash-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="dash-avatar-fallback">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
          <div className="dash-hero-info">
            <span className="mono-label mono-label--light">your space</span>
            <h1 className="dash-hero-name">{user.name}</h1>
            <p className="dash-hero-email">{user.email}</p>
            <div className="dash-hero-meta">
              <span className={`dash-role-badge ${user.role === "admin" ? "dash-role-admin" : ""}`}>
                {user.role === "admin" ? "Admin" : "Learner"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="dash-stats-row sw-page-pad">
        <div className="dash-stats-grid">
          <div className="dash-stat-card">
            <span className="dash-stat-number">{courses.length}</span>
            <span className="dash-stat-label">Courses Enrolled</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-number">{totalLessonsCompleted}</span>
            <span className="dash-stat-label">Lessons Completed</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-number">{completedCourses.length}</span>
            <span className="dash-stat-label">Courses Finished</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-number">{upcomingSessions.length}</span>
            <span className="dash-stat-label">Upcoming Sessions</span>
          </div>
        </div>
      </section>

      <section className="dash-body sw-page-pad">
        <div className="dash-body-inner">

          {/* ── Continue Learning ── */}
          <div className="dash-section">
            <div className="dash-section-hd">
              <h2 className="dash-section-title">
                {continueList.length > 0 ? "Continue Learning" : "Your Courses"}
              </h2>
              {courses.length > 0 && (
                <Link to="/my-learning" className="dash-section-link">View all →</Link>
              )}
            </div>

            {loadingCourses ? (
              <div className="dash-section-loading"><div className="dash-spinner" /></div>
            ) : continueList.length === 0 && completedCourses.length === 0 ? (
              <div className="dash-empty">
                <p className="dash-empty-text">No courses yet. Pick something that speaks to you.</p>
                <Link to="/courses" className="dash-empty-cta">Browse Courses</Link>
              </div>
            ) : (
              <div className="dash-course-grid">
                {continueList.map(course => {
                  const total = Number(course.total_lessons);
                  const done = Number(course.completed_lessons);
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={course.id} className="dash-course-card">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="dash-course-thumb" />
                      ) : (
                        <div className="dash-course-thumb-placeholder" />
                      )}
                      <div className="dash-course-body">
                        <div className="dash-course-title">{course.title}</div>
                        <div className="dash-course-progress-wrap">
                          <div className="dash-course-progress-track">
                            <div className="dash-course-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="dash-course-progress-label">{pct}% · {done}/{total} lessons</span>
                        </div>
                        <button
                          className="dash-course-btn"
                          onClick={() => navigate(`/courses/${course.slug}/learn`)}
                        >
                          {pct === 0 ? "Start Learning" : "Continue"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {completedCourses.length > 0 && (
              <>
                <h3 className="dash-subsection-title">Completed</h3>
                <div className="dash-course-grid">
                  {completedCourses.map(course => (
                    <div key={course.id} className="dash-course-card dash-course-done">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="dash-course-thumb" />
                      ) : (
                        <div className="dash-course-thumb-placeholder" />
                      )}
                      <div className="dash-course-body">
                        <div className="dash-done-badge">✓ Completed</div>
                        <div className="dash-course-title">{course.title}</div>
                        <div className="dash-course-actions">
                          <button
                            className="dash-course-btn dash-course-btn--ghost"
                            onClick={() => navigate(`/courses/${course.slug}/learn`)}
                          >
                            Review
                          </button>
                          <Link
                            to={`/courses/${course.slug}/certificate`}
                            className="dash-cert-link"
                          >
                            Get Certificate
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Sessions ── */}
          <div className="dash-section">
            <div className="dash-section-hd">
              <h2 className="dash-section-title">Coaching Sessions</h2>
              <Link to="/my-sessions" className="dash-section-link">View all →</Link>
            </div>

            {loadingSessions ? (
              <div className="dash-section-loading"><div className="dash-spinner" /></div>
            ) : sessions.length === 0 ? (
              <div className="dash-empty">
                <p className="dash-empty-text">No sessions booked yet.</p>
                <Link to="/booking" className="dash-empty-cta">Book a Session</Link>
              </div>
            ) : (
              <div className="dash-sessions-list">
                {upcomingSessions.length > 0 && (
                  <>
                    <p className="dash-sessions-sublabel">Upcoming</p>
                    {upcomingSessions.map(s => (
                      <div key={s.id} className="dash-session-row dash-session-upcoming">
                        <div className="dash-session-dot dash-session-dot--upcoming" />
                        <div className="dash-session-info">
                          <span className="dash-session-type">{s.session_type}</span>
                          <span className="dash-session-time">{formatDateTime(s.session_start)}</span>
                        </div>
                        {s.meet_link && (
                          <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className="dash-session-join">
                            Join →
                          </a>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {pastSessions.length > 0 && (
                  <>
                    <p className="dash-sessions-sublabel">Past</p>
                    {pastSessions.slice(0, 3).map(s => (
                      <div key={s.id} className="dash-session-row dash-session-past">
                        <div className="dash-session-dot" />
                        <div className="dash-session-info">
                          <span className="dash-session-type">{s.session_type}</span>
                          <span className="dash-session-time">{formatDateTime(s.session_start)}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Quick Links ── */}
          <div className="dash-section">
            <h2 className="dash-section-title">Quick Links</h2>
            <div className="dash-quick-grid">
              <Link to="/courses" className="dash-quick-card">
                <span className="dash-quick-icon">◈</span>
                <span className="dash-quick-label">Browse Courses</span>
              </Link>
              <Link to="/booking" className="dash-quick-card">
                <span className="dash-quick-icon">◷</span>
                <span className="dash-quick-label">Book a Session</span>
              </Link>
              <Link to="/articles" className="dash-quick-card">
                <span className="dash-quick-icon">◎</span>
                <span className="dash-quick-label">Read Articles</span>
              </Link>
              <button className="dash-quick-card dash-quick-logout" onClick={logout}>
                <span className="dash-quick-icon">⊗</span>
                <span className="dash-quick-label">Log Out</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
