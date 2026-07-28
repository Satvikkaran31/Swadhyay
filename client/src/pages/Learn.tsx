import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import "../styles/Learn.css";
import "../styles/Notes.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function toEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
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

  // Notes
  const [noteText, setNoteText] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current); }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate(`/courses/${slug}`);
  }, [authLoading, user]);

  // Load course + enrollment + progress; abort on slug change to prevent stale state
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      try {
        const r = await fetch(`${API}/api/courses/${slug}/learn`, { credentials: "include", signal });
        if (r.status === 401 || r.status === 403) { navigate(`/courses/${slug}`); return; }
        const data = await r.json();
        if (!data || data.error) { navigate("/courses"); return; }

        const pr = await fetch(`${API}/api/progress/${data.id}`, { credentials: "include", signal }).then(r => r.json());
        const completedSet = new Set<number>(pr.completed_lesson_ids ?? []);
        setCompletedIds(completedSet);
        setCourse(data);

        let resumeLesson = null;
        outer: for (const mod of data.modules ?? []) {
          for (const lesson of mod.lessons ?? []) {
            if (!completedSet.has(lesson.id)) { resumeLesson = lesson; break outer; }
          }
        }
        setActiveLesson(resumeLesson ?? data.modules?.[0]?.lessons?.[0] ?? null);
      } catch (err: any) {
        if (err.name !== "AbortError") setPageLoading(false);
        return;
      }
      setPageLoading(false);
    })();

    return () => controller.abort();
  }, [user, slug]);

  // Load resources when active lesson changes
  useEffect(() => {
    if (!activeLesson) return;
    fetch(`${API}/api/courses/lessons/${activeLesson.id}/resources`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]));
  }, [activeLesson]);

  // Load note when lesson changes
  useEffect(() => {
    if (!activeLesson || !user) return;
    setNoteText("");
    setNoteSaved(false);
    fetch(`${API}/api/notes/${activeLesson.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.content != null) setNoteText(d.content); })
      .catch(() => {});
  }, [activeLesson?.id]);

  const saveNote = useCallback(async () => {
    if (!activeLesson) return;
    setNoteSaving(true);
    try {
      await fetch(`${API}/api/notes/${activeLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: noteText }),
      });
      setNoteSaved(true);
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
      noteSaveTimer.current = setTimeout(() => setNoteSaved(false), 2000);
    } finally {
      setNoteSaving(false);
    }
  }, [activeLesson, noteText]);

  const markComplete = async () => {
    if (!activeLesson || completedIds.has(activeLesson.id)) return;
    try {
      const res = await fetch(`${API}/api/progress/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lesson_id: activeLesson.id }),
      });
      if (res.ok) {
        setCompletedIds(prev => new Set([...prev, activeLesson.id]));
      }
    } catch { /* network error — leave UI unchanged */ }
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
          <div className="learn-progress-track">
            <div className="learn-progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
          <span>{progressPct}%</span>
        </div>
        <button className="learn-sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}>
          {sidebarOpen ? "✕ Close" : "☰ Outline"}
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

          {/* Notes panel */}
          <div className="learn-notes-panel">
            <div
              className={`learn-notes-header${notesOpen ? " open" : ""}`}
              onClick={() => setNotesOpen(p => !p)}
            >
              <span>My Notes</span>
              <span className={`learn-notes-chevron${notesOpen ? " open" : ""}`}>▼</span>
            </div>
            {notesOpen && (
              <div className="learn-notes-body">
                <textarea
                  className="learn-notes-textarea"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Jot down your thoughts for this lesson…"
                />
                <div className="learn-notes-footer">
                  <span className="learn-notes-status">{noteSaved ? "Saved ✓" : ""}</span>
                  <button className="learn-notes-save-btn" onClick={saveNote} disabled={noteSaving}>
                    {noteSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Certificate banner when 100% complete */}
          {progressPct === 100 && (
            <div className="learn-cert-banner">
              <span>🎉 You've completed this course!</span>
              <Link to={`/courses/${slug}/certificate`} className="learn-cert-link">
                Get Certificate
              </Link>
            </div>
          )}
        </div>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="learn-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`learn-sidebar${sidebarOpen ? " open" : ""}`}>
            <div className="learn-sidebar-header">Course Content</div>
            {course.modules?.map(mod => (
              <div key={mod.id} className="learn-sidebar-module">
                <div className="learn-sidebar-module-title">{mod.title}</div>
                {mod.lessons?.map(lesson => (
                  <button
                    key={lesson.id}
                    className={`learn-sidebar-lesson ${activeLesson?.id === lesson.id ? "active" : ""} ${completedIds.has(lesson.id) ? "done" : ""}`}
                    onClick={() => {
                      setActiveLesson(lesson);
                      if (window.innerWidth <= 768) setSidebarOpen(false);
                    }}
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
      </div>
    </div>
  );
}
