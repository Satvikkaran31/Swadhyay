import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import "../styles/CourseDetail.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function toEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const login = useTriggerGoogleLogin(setUser);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [openModule, setOpenModule] = useState(0);
  const [previewLesson, setPreviewLesson] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/courses/${slug}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate("/courses"); return; }
        setCourse(data);
        setLoading(false);
        // Auto-open first module
        if (data.modules?.length > 0) setOpenModule(data.modules[0].id);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !course) return;
    fetch(`${API}/api/enrollments/check/${course.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setEnrolled(d.enrolled));
  }, [user, course]);

  const handleEnroll = async () => {
    if (!user) { login(); return; }
    if (enrolled) { navigate(`/courses/${slug}/learn`); return; }

    if (course.price === 0) {
      setEnrolling(true);
      const res = await fetch(`${API}/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ course_id: course.id }),
      });
      if (res.ok) { setEnrolled(true); navigate(`/courses/${slug}/learn`); }
      setEnrolling(false);
    } else {
      // Paid: trigger Razorpay, then enroll with payment_id
      navigate(`/courses/${slug}/checkout`);
    }
  };

  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  if (loading) return <div className="main"><Navbar /><div className="course-detail-loading">Loading...</div><Footer /></div>;
  if (!course) return null;

  return (
    <div className="main">
      <Navbar />
      <div className="course-detail-page">
        {/* Hero */}
        <div className="course-detail-hero">
          <div className="course-detail-hero-text">
            <h1>{course.title}</h1>
            {course.description && <p className="course-detail-desc">{course.description}</p>}
            <div className="course-detail-meta">
              <span>{totalLessons} lessons</span>
              <span>·</span>
              <span>{course.modules?.length || 0} modules</span>
            </div>
            <div className="course-detail-price-row">
              <span className="course-detail-price">
                {course.price === 0 ? "Free" : `₹${(course.price / 100).toLocaleString("en-IN")}`}
              </span>
              <button
                className="course-detail-enroll-btn"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? "Processing..." : enrolled ? "Continue Learning" : course.price === 0 ? "Enroll for Free" : "Enroll Now"}
              </button>
            </div>
          </div>
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt={course.title} className="course-detail-thumb" />
          )}
        </div>

        {/* Preview video */}
        {previewLesson && (
          <div className="course-detail-preview">
            <div className="course-detail-preview-header">
              <span>Preview: {previewLesson.title}</span>
              <button onClick={() => setPreviewLesson(null)}>✕</button>
            </div>
            <div className="course-detail-video-wrap">
              <iframe
                src={toEmbedUrl(previewLesson.video_url)}
                title={previewLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Syllabus */}
        <div className="course-detail-syllabus">
          <h2>Course Content</h2>
          {course.modules?.map((mod) => (
            <div key={mod.id} className="syllabus-module">
              <button
                className={`syllabus-module-header ${openModule === mod.id ? "open" : ""}`}
                onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
              >
                <span>{mod.title}</span>
                <span className="syllabus-module-count">{mod.lessons?.length || 0} lessons</span>
                <svg className={`syllabus-arrow ${openModule === mod.id ? "rotated" : ""}`} width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {openModule === mod.id && (
                <div className="syllabus-lessons">
                  {mod.lessons?.map((lesson) => (
                    <div key={lesson.id} className="syllabus-lesson">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span>{lesson.title}</span>
                      {lesson.duration && (
                        <span className="syllabus-duration">
                          {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                        </span>
                      )}
                      {lesson.is_preview && lesson.video_url && (
                        <button className="syllabus-preview-btn" onClick={() => setPreviewLesson(lesson)}>
                          Preview
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sticky enroll CTA */}
        <div className="course-detail-sticky-cta">
          <span className="course-detail-price">
            {course.price === 0 ? "Free" : `₹${(course.price / 100).toLocaleString("en-IN")}`}
          </span>
          <button className="course-detail-enroll-btn" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? "Processing..." : enrolled ? "Continue Learning" : "Enroll Now"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
