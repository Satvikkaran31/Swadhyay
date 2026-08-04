import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "../styles/Learn.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function renderMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  return DOMPurify.sanitize(marked.parse(md) as string);
}

function toEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function Learn() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUser();

  const isAdmin = user?.role === "admin";
  const [course, setCourse] = useState<any>(null);
  const [completedIds, setCompletedIds] = useState(new Set<number>());
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const [noteText, setNoteText] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLessonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => () => { if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current); }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate(`/courses/${slug}`);
  }, [authLoading, user]);

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

  useEffect(() => {
    if (!activeLesson) return;
    fetch(`${API}/api/courses/lessons/${activeLesson.id}/resources`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]));
  }, [activeLesson]);

  useEffect(() => {
    if (activeLessonRef.current) {
      activeLessonRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeLesson?.id]);

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
      if (res.ok) setCompletedIds(prev => new Set([...prev, activeLesson.id]));
    } catch { /* leave UI unchanged */ }
  };

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const progressPct = totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  const allLessons = course?.modules?.flatMap((m: any) => m.lessons ?? []) ?? [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === activeLesson?.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const goNext = async () => {
    await markComplete();
    if (nextLesson) setActiveLesson(nextLesson);
  };

  if (pageLoading || authLoading) {
    return (
      <div className="lms-loader">
        <div className="lms-loader-ring" />
        <span>Loading your course…</span>
      </div>
    );
  }

  if (!course) return null;

  const embedUrl = toEmbedUrl(activeLesson?.video_url);
  const isCompleted = completedIds.has(activeLesson?.id);

  return (
    <div className="lms-layout">

      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <header className="lms-topbar">
        <button className="lms-back-btn" onClick={() => navigate(`/courses/${slug}`)}>
          ← Back
        </button>
        <span className="lms-course-title">{course.title}</span>
        <div className="lms-topbar-right">
          <div className="lms-progress-wrap">
            <div className="lms-progress-track">
              <div className="lms-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="lms-progress-pct">{progressPct}%</span>
          </div>
          {isAdmin && (
            <a href="/admin" className="lms-admin-btn">⚙ Edit</a>
          )}
          <button
            className="lms-outline-btn"
            onClick={() => setSidebarOpen(p => !p)}
            aria-label="Toggle outline"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      <div className="lms-body">

        {/* ── MAIN ────────────────────────────────────────────────── */}
        <div className="lms-main">

          {/* Video lesson */}
          {activeLesson?.type !== 'text' && (
            embedUrl ? (
              <div className="lms-video-wrap">
                <iframe
                  key={activeLesson.id}
                  src={embedUrl}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="lms-no-video">
                <span>No video for this lesson yet.</span>
              </div>
            )
          )}

          {/* Text / reading lesson */}
          {activeLesson?.type === 'text' && (
            <div className="lms-text-lesson">
              {activeLesson.content ? (
                <div
                  className="lms-text-prose"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(activeLesson.content) }}
                />
              ) : (
                <div className="lms-no-video">
                  <span>No content for this lesson yet.</span>
                </div>
              )}
            </div>
          )}

          {/* Lesson info bar */}
          <div className="lms-lesson-bar">
            <div className="lms-lesson-bar-left">
              <span className="lms-lesson-eyebrow">
                Lesson {currentIdx + 1} of {allLessons.length}
              </span>
              <h2 className="lms-lesson-title">{activeLesson?.title}</h2>
              <span className={`lms-lesson-type-badge lms-lesson-type-${activeLesson?.type ?? 'video'}`}>
                {activeLesson?.type === 'text' ? '☰ Reading' : '▷ Video'}
              </span>
            </div>
            <button
              className={`lms-complete-btn${isCompleted ? " done" : ""}`}
              onClick={markComplete}
              disabled={!activeLesson || isCompleted}
            >
              {isCompleted ? "✓ Completed" : "Mark complete"}
            </button>
          </div>

          {/* Prev / Next navigation */}
          <div className="lms-nav-row">
            <button
              className="lms-nav-btn lms-nav-prev"
              onClick={() => prevLesson && setActiveLesson(prevLesson)}
              disabled={!prevLesson}
            >
              ← Previous
            </button>
            <div className="lms-nav-center-info">
              <span className="lms-nav-position">{currentIdx + 1} / {allLessons.length}</span>
            </div>
            <button
              className={`lms-nav-btn lms-nav-next${!nextLesson ? " disabled" : ""}`}
              onClick={goNext}
              disabled={!nextLesson}
            >
              {isCompleted ? "Next →" : "Complete & Next →"}
            </button>
          </div>

          {/* Resources */}
          {resources.length > 0 && (
            <div className="lms-resources">
              <h3 className="lms-resources-title">Resources</h3>
              <ul className="lms-resources-list">
                {resources.map((r: any) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="lms-resource-link">
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

          {/* Notes */}
          <div className="lms-notes">
            <button
              className={`lms-notes-toggle${notesOpen ? " open" : ""}`}
              onClick={() => setNotesOpen(p => !p)}
            >
              <span>My Notes</span>
              <span className="lms-notes-chevron" style={{ transform: notesOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
            </button>
            {notesOpen && (
              <div className="lms-notes-body">
                <textarea
                  className="lms-notes-textarea"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Jot down your thoughts for this lesson…"
                />
                <div className="lms-notes-footer">
                  <span className="lms-notes-saved">{noteSaved ? "Saved ✓" : ""}</span>
                  <button className="lms-notes-save" onClick={saveNote} disabled={noteSaving}>
                    {noteSaving ? "Saving…" : "Save note"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Certificate banner */}
          {progressPct === 100 && (
            <div className="lms-cert-banner">
              <div>
                <div className="lms-cert-title">You've completed this course</div>
                <div className="lms-cert-sub">Your certificate is ready to download.</div>
              </div>
              <Link to={`/courses/${slug}/certificate`} className="lms-cert-btn">
                Get Certificate →
              </Link>
            </div>
          )}
        </div>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="lms-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ───────────────────────────────────────────── */}
        <aside className={`lms-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="lms-sidebar-head">
            <span className="lms-sidebar-label">Course content</span>
            <span className="lms-sidebar-progress-text">{completedIds.size}/{totalLessons} complete</span>
          </div>
          <div className="lms-sidebar-track">
            <div className="lms-sidebar-track-fill" style={{ width: `${progressPct}%` }} />
          </div>
          {course.modules?.map((mod: any, mi: number) => (
            <div key={mod.id} className="lms-module">
              <div className="lms-module-title">
                <span className="lms-module-num">{String(mi + 1).padStart(2, "0")}</span>
                <div className="lms-module-title-text">
                  <span>{mod.title}</span>
                  {mod.description && <span className="lms-module-desc">{mod.description}</span>}
                </div>
              </div>
              {mod.lessons?.map((lesson: any) => {
                const done = completedIds.has(lesson.id);
                const active = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    ref={active ? activeLessonRef : null}
                    className={`lms-lesson-btn${active ? " active" : ""}${done ? " done" : ""}`}
                    onClick={() => {
                      setActiveLesson(lesson);
                      if (window.innerWidth <= 768) setSidebarOpen(false);
                    }}
                  >
                    <span className={`lms-check${done ? " checked" : ""}`}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className="lms-lesson-type-icon">
                      {lesson.type === 'text' ? '☰' : '▷'}
                    </span>
                    <span className="lms-lesson-name">{lesson.title}</span>
                    {lesson.duration && (
                      <span className="lms-lesson-dur">
                        {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
