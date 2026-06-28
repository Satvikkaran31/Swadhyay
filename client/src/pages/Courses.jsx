import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Courses.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then(r => r.json())
      .then(data => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="main">
      <Navbar />
      <div className="courses-page">
        <div className="courses-header">
          <h1>Courses</h1>
          <p>Deepen your practice with structured learning from Neha</p>
        </div>

        {loading ? (
          <div className="courses-loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="courses-empty">
            <p>Courses are coming soon. Check back shortly!</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div
                key={course.id}
                className="course-card"
                onClick={() => navigate(`/courses/${course.slug}`)}
              >
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="course-card-thumb" />
                ) : (
                  <div className="course-card-thumb-placeholder" />
                )}
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.title}</h3>
                  {course.description && (
                    <p className="course-card-desc">{course.description}</p>
                  )}
                  <div className="course-card-footer">
                    <span className="course-card-price">
                      {course.price === 0 ? "Free" : `₹${(course.price / 100).toLocaleString("en-IN")}`}
                    </span>
                    <button className="course-card-btn">View Course</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
