import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import "../styles/Learn.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function toEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null; // Unknown host — don't embed
}

export default function Learn() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUser();

  const [course, setCourse] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [activeLesson, setActiveLesson] = useState(null);
  const [resources, setResources] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate(`/courses/${slug}`);
  }, [authLoading, user]);

  // Load course + enrollment + progress in 2 parallel requests
  useEffect(() => {
    if (!user) return;

    const loadCourse = fetch(`${API}/api/courses/${slug}/learn`, { credentials: "include" })
      .then(r => {
        if (r.status === 401 || r.status === 403) { navigate(`/courses/${slug}`); return null; }
        return r.json();
      });

    loadCourse.then(async data => {
      if (!data || data.error) { navigate("/courses"); return; }

      // Load progress in parallel with setting course
      const pr = await fetch(`${API}/api/progress/${data.id}`, { credentials: "include" }).then(r => r.json());
      setCompletedIds(new Set(pr.completed_lesson_ids || []));

      setCourse(data);
      const firstLesson = data.modules?.[0]?.lessons?.[0];
      if (firstLesson) setActiveLesson(firstLesson);
      setPageLoading(false);
    }).catch(() => setPageLoading(false));
  }, [user, slug]);

  // Load resources when active lesson changes
  useEffect(() => {
    if (!activeLesson) return;
    fetch(`${API}/api/courses/lessons/${activeLesson.id}/resources`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]));
  }, [activeLesson]);

  const markComplete = async () => {
    if (!activeLesson || completedIds.has(activeLesson.id)) return;
    await fetch(`${API}/api/progress/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ lesson_id: activeLesson.id }),
    });
    setCompletedIds(prev => new Set([...prev, activeLesson.id]));
  };

  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const progressPct = totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  if (pageLoading || authLoading) {
    return <div className="learn-fullscreen-loader">Loading your course...</div>;
  }

  if (!course) return null;

  return (
    <div className="learn-layout">
      {/* Top bar */}
      <div className="learn-topbar">
        <button className="learn-back-btn" onClick={() => navigate(`/courses/${slug}`)}>
          ← Back
        </button>
        <span className="learn-course-title">{course.title}</span>
        <div className="learn-progress-pill">
          <div className="learn-progress-bar" style={{ width: `${progressPct}%` }} />
          <span>{progressPct}%</span>
        </div>
        <button className="learn-sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}>
          {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        </button>
      </div>

      <div className="learn-body">
        {/* Main content */}
        <div className="learn-main">
          {activeLesson?.video_url && toEmbedUrl(activeLesson.video_url) ? (
            <div className="learn-video-wrap">
              <iframe
                key={activeLesson.id}
                src={toEmbedUrl(activeLesson.video_url)}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="learn-no-video">No video for this lesson yet.</div>
          )}

          <div className="learn-lesson-info">
            <h2>{activeLesson?.title}</h2>
            <button
              className={`learn-complete-btn ${completedIds.has(activeLesson?.id) ? "completed" : ""}`}
              onClick={markComplete}
              disabled={!activeLesson || completedIds.has(activeLesson?.id)}
            >
              {completedIds.has(activeLesson?.id) ? "✓ Completed" : "Mark as Complete"}
            </button>
          </div>

          {resources.length > 0 && (
            <div className="learn-resources">
              <h3>Resources</h3>
              <ul>
                {resources.map(r => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="learn-sidebar">
            <div className="learn-sidebar-header">Course Content</div>
            {course.modules?.map(mod => (
              <div key={mod.id} className="learn-sidebar-module">
                <div className="learn-sidebar-module-title">{mod.title}</div>
                {mod.lessons?.map(lesson => (
                  <button
                    key={lesson.id}
                    className={`learn-sidebar-lesson ${activeLesson?.id === lesson.id ? "active" : ""} ${completedIds.has(lesson.id) ? "done" : ""}`}
                    onClick={() => setActiveLesson(lesson)}
                  >
                    <span className="learn-sidebar-check">
                      {completedIds.has(lesson.id) ? "✓" : "○"}
                    </span>
                    <span className="learn-sidebar-lesson-title">{lesson.title}</span>
                    {lesson.duration && (
                      <span className="learn-sidebar-duration">
                        {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
