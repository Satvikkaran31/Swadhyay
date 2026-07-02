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

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch(`${API}/api/enrollments/mine`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <div className="main">
      <Navbar />
      <section className="my-learning-hero">
        <h1>My Learning</h1>
      </section>
      <div className="my-learning-page">

        {authLoading || loading ? (
          <div className="my-learning-status">Loading...</div>
        ) : !user ? (
          <div className="my-learning-status">
            <p>Please log in to see your enrolled courses.</p>
            <button className="my-learning-login-btn" onClick={() => login()}>Log in with Google</button>
          </div>
        ) : courses.length === 0 ? (
          <div className="my-learning-status">
            <p>You haven&apos;t enrolled in any courses yet.</p>
            <button className="my-learning-browse-btn" onClick={() => navigate("/courses")}>Browse Courses</button>
          </div>
        ) : (
          <div className="my-learning-grid">
            {courses.map(course => {
              const total = Number(course.total_lessons);
              const done = Number(course.completed_lessons);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div key={course.id} className="my-learning-card">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="my-learning-thumb" />
                  ) : (
                    <div className="my-learning-thumb-placeholder" />
                  )}
                  <div className="my-learning-card-body">
                    <h3>{course.title}</h3>
                    <div className="my-learning-progress">
                      <div className="my-learning-progress-bar">
                        <div className="my-learning-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span>{pct}% complete · {done}/{total} lessons</span>
                    </div>
                    <button
                      className="my-learning-continue-btn"
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
      <Footer />
    </div>
  );
}
