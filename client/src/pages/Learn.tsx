import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import { marked } from "marked";
import DOMPurify from "dompurify";
import toast from "react-hot-toast";
import { toEmbedUrl } from "../utils/videoEmbed";
import "../styles/Learn.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function renderMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  return DOMPurify.sanitize(marked.parse(md) as string);
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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [sidebarTab, setSidebarTab] = useState<"content" | "notes">("content");
  const [openModules, setOpenModules] = useState(new Set<number>());
  const [pageLoading, setPageLoading] = useState(true);

  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLessonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => () => { if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current); }, []);

  // ── Course-completion flow (review → book a 1-on-1) ──
  const [showComplete, setShowComplete] = useState(false);
  const [completeStep, setCompleteStep] = useState<"review" | "booking">("review");
  const [cmpRating, setCmpRating] = useState(0);
  const [cmpHoverStar, setCmpHoverStar] = useState(0);
  const [cmpTakeaway, setCmpTakeaway] = useState("");
  const [cmpImprove, setCmpImprove] = useState("");
  const [cmpSubmitting, setCmpSubmitting] = useState(false);
  const completePromptedRef = useRef(false);

  const completeKey = course ? `sw-course-complete-${course.id}` : "";
  const dismissComplete = () => {
    try { if (completeKey) localStorage.setItem(completeKey, "1"); } catch { /* storage blocked */ }
    setShowComplete(false);
  };

  const submitCompletionReview = async () => {
    if (!cmpRating) return;
    setCmpSubmitting(true);
    const body = [
      cmpTakeaway.trim() && `Biggest takeaway: ${cmpTakeaway.trim()}`,
      cmpImprove.trim() && `Could be improved: ${cmpImprove.trim()}`,
    ].filter(Boolean).join("\n\n");
    try {
      const res = await fetch(`${API}/api/courses/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: cmpRating, body }),
      });
      // A prior review (409/400) shouldn't block the flow — thank them and move on.
      if (!res.ok && res.status >= 500) throw new Error("server");
      toast.success("Thanks for your feedback!");
      setCompleteStep("booking");
    } catch {
      toast.error("Couldn't save your review, but you can still book a session.");
      setCompleteStep("booking");
    } finally {
      setCmpSubmitting(false);
    }
  };

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
            if (!completedSet.has(lesson.id)) {
              resumeLesson = lesson;
              break outer;
            }
          }
        }
        const fallbackLesson = data.modules?.[0]?.lessons?.[0] ?? null;
        setActiveLesson(resumeLesson ?? fallbackLesson);
        setOpenModules(new Set((data.modules ?? []).map((m: any) => m.id)));
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
    const ctrl = new AbortController();
    fetch(`${API}/api/notes/${activeLesson.id}`, { credentials: "include", signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (d.content != null) setNoteText(d.content); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [activeLesson?.id]);

  const saveNote = useCallback(async () => {
    if (!activeLesson) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`${API}/api/notes/${activeLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: noteText }),
      });
      if (!res.ok) throw new Error("save failed");
      setNoteSaved(true);
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
      noteSaveTimer.current = setTimeout(() => setNoteSaved(false), 2500);
    } catch {
      toast.error("Couldn't save your note. Please try again.");
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
      else throw new Error("progress failed");
    } catch {
      toast.error("Couldn't save your progress. Please try again.");
    }
  };

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const progressPct = totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  // When the course reaches 100%, prompt for a review + a 1-on-1 — once per
  // course (tracked in localStorage so revisiting a done course won't nag).
  useEffect(() => {
    if (!course || totalLessons === 0 || progressPct < 100) return;
    if (completePromptedRef.current) return;
    let seen = false;
    try { seen = !!localStorage.getItem(`sw-course-complete-${course.id}`); } catch { /* storage blocked */ }
    if (seen) return;
    completePromptedRef.current = true;
    setCompleteStep("review");
    setShowComplete(true);
  }, [progressPct, course, totalLessons]);

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
  const isVideo = activeLesson?.type !== "text";

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
            <a href="/admin" className="lms-admin-btn" aria-label="Open admin">⚙</a>
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
      <div className={`lms-body${sidebarOpen ? "" : " sidebar-closed"}`}>

        {/* ── MAIN ────────────────────────────────────────────────── */}
        <div className="lms-main">

          {/* Lesson title header — always visible, confirms which lesson is active */}
          {activeLesson && (
            <div className="lms-lesson-header">
              <div className="lms-lesson-header-type">
                {activeLesson.type === "text" ? "Reading" : "Video"}
              </div>
              <div className="lms-lesson-header-title">{activeLesson.title}</div>
            </div>
          )}

          {/* Video lesson */}
          {isVideo && (
            embedUrl ? (
              <div className="lms-video-wrap">
                <iframe
                  key={activeLesson.id}
                  src={embedUrl}
                  title={activeLesson.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="lms-no-video">
                <div className="lms-no-video-inner">
                  <div className="lms-no-video-icon">▷</div>
                  <span>Video coming soon</span>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem", opacity: 0.65, maxWidth: 340, lineHeight: 1.5 }}>
                    This lesson is being prepared — the content will be added shortly.
                  </p>
                </div>
              </div>
            )
          )}

          {/* Text / reading lesson */}
          {!isVideo && (
            <div className="lms-text-area">
              {activeLesson?.content ? (
                <div
                  className="lms-text-prose"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(activeLesson.content) }}
                />
              ) : (
                <div className="lms-no-video">
                  <div className="lms-no-video-inner">
                    <div className="lms-no-video-icon">☰</div>
                    <span>Content coming soon</span>
                    <p style={{ margin: "8px 0 0", fontSize: "0.85rem", opacity: 0.65, maxWidth: 340, lineHeight: 1.5 }}>
                      This lesson is being prepared — the content will be added shortly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Certificate strip (100% completion) */}
          {progressPct === 100 && (
            <div className="lms-cert-strip">
              <span>🎓 You've completed this course</span>
              <Link to={`/courses/${slug}/certificate`} className="lms-cert-strip-btn">
                Get Certificate →
              </Link>
            </div>
          )}

          {/* ── Control strip ─────────────────────────────────── */}
          <div className="lms-strip">
            <button
              className="lms-strip-prev"
              onClick={() => prevLesson && setActiveLesson(prevLesson)}
              disabled={!prevLesson}
              aria-label="Previous lesson"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="lms-strip-prev-label">Prev</span>
            </button>

            <div className="lms-strip-center">
              <span className="lms-strip-pos">{currentIdx + 1} / {allLessons.length}</span>
              <span className="lms-strip-sep">·</span>
              <span className="lms-strip-type-icon">
                {activeLesson?.type === "text" ? "☰" : "▷"}
              </span>
              <span className="lms-strip-title">{activeLesson?.title}</span>
            </div>

            <button
              className={`lms-strip-done${isCompleted ? " checked" : ""}`}
              onClick={markComplete}
              disabled={!activeLesson || isCompleted}
            >
              {isCompleted ? "✓ Done" : "Done"}
            </button>

            <button
              className="lms-strip-next"
              onClick={goNext}
              disabled={!nextLesson}
              aria-label="Next lesson"
            >
              <span className="lms-strip-next-label">Next</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Resources row */}
          {resources.length > 0 && (
            <div className="lms-resources-row">
              <span className="lms-resources-label">Resources</span>
              {resources.map((r: any) => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="lms-resource-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {r.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Mobile backdrop — hidden on desktop via CSS media query */}
        {sidebarOpen && (
          <div className="lms-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ───────────────────────────────────────── */}
        <aside className={`lms-sidebar${sidebarOpen ? " open" : ""}`}>

          {/* Tab bar + progress */}
          <div className="lms-sidebar-header">
            <div className="lms-sidebar-tabs">
              <button
                className={`lms-stab${sidebarTab === "content" ? " active" : ""}`}
                onClick={() => setSidebarTab("content")}
                aria-pressed={sidebarTab === "content"}
              >
                Lessons
              </button>
              <button
                className={`lms-stab${sidebarTab === "notes" ? " active" : ""}`}
                onClick={() => setSidebarTab("notes")}
                aria-pressed={sidebarTab === "notes"}
              >
                Notes
              </button>
            </div>
            <div className="lms-sidebar-prog">
              <div className="lms-sidebar-track">
                <div className="lms-sidebar-track-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="lms-sidebar-prog-text">{completedIds.size}/{totalLessons}</span>
            </div>
          </div>

          {/* Content tab — module/lesson accordion */}
          {sidebarTab === "content" && (
            <div className="lms-sidebar-content">
              {course.modules?.map((mod: any, mi: number) => {
                const isOpen = openModules.has(mod.id);
                const modDone = (mod.lessons ?? []).filter((l: any) => completedIds.has(l.id)).length;
                const modTotal = mod.lessons?.length ?? 0;
                const modAllDone = modDone === modTotal && modTotal > 0;
                return (
                  <div key={mod.id} className={`lms-module${isOpen ? " open" : ""}`}>
                    {/* Module header — clickable accordion */}
                    <button
                      className="lms-module-header"
                      aria-expanded={isOpen}
                      onClick={() => setOpenModules(prev => {
                        const next = new Set(prev);
                        isOpen ? next.delete(mod.id) : next.add(mod.id);
                        return next;
                      })}
                    >
                      <div className="lms-module-header-left">
                        <span className={`lms-module-done-ring${modAllDone ? " done" : ""}`}>
                          {modAllDone ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <span>{String(mi + 1)}</span>
                          )}
                        </span>
                        <div className="lms-module-header-text">
                          <span className="lms-module-header-title">{mod.title}</span>
                          <span className="lms-module-header-meta">
                            {modDone}/{modTotal} complete
                          </span>
                        </div>
                      </div>
                      <svg
                        className="lms-module-chevron"
                        width="16" height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>

                    {/* Lesson list — slides open/closed */}
                    <div
                      className="lms-module-lessons-wrap"
                      style={{ maxHeight: isOpen ? `${modTotal * 96 + 8}px` : "0" }}
                    >
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
                            {/* Left: completion indicator */}
                            <span className={`lms-lesson-check${done ? " done" : ""}${active && !done ? " active" : ""}`}>
                              {done ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : null}
                            </span>

                            {/* Middle: type icon + title */}
                            <div className="lms-lesson-body">
                              <div className="lms-lesson-row">
                                <span className="lms-lesson-type-icon">
                                  {lesson.type === "text" ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="3" y1="6" x2="21" y2="6"/>
                                      <line x1="3" y1="12" x2="21" y2="12"/>
                                      <line x1="3" y1="18" x2="15" y2="18"/>
                                    </svg>
                                  ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                      <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                  )}
                                </span>
                                <span className="lms-lesson-name">{lesson.title}</span>
                              </div>
                              {lesson.duration && (
                                <span className="lms-lesson-dur">
                                  {Math.floor(lesson.duration / 60)}m {String(lesson.duration % 60).padStart(2, "0")}s
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes tab */}
          {sidebarTab === "notes" && (
            <div className="lms-notes-panel">
              <div className="lms-notes-panel-header">
                <span>Notes — {activeLesson?.title}</span>
                {noteSaved && <span className="lms-notes-saved-badge">Saved ✓</span>}
              </div>
              <textarea
                className="lms-notes-textarea"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Jot down your thoughts, questions, or key takeaways for this lesson…"
              />
              <button
                className="lms-notes-save-btn"
                onClick={saveNote}
                disabled={noteSaving}
              >
                {noteSaving ? "Saving…" : "Save note"}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ── Course-completion modal: review → book a 1-on-1 ── */}
      {showComplete && (
        <div className="lms-cmp-overlay" role="dialog" aria-modal="true" aria-label="Course complete">
          <div className="lms-cmp-modal">
            {completeStep === "review" ? (
              <>
                <div className="lms-cmp-badge">🎉</div>
                <h2 className="lms-cmp-title">You finished {course.title}!</h2>
                <p className="lms-cmp-sub">Congratulations. Before you go — how was it? Your feedback helps others and shapes what comes next.</p>

                <div className="lms-cmp-field">
                  <label className="lms-cmp-label">How would you rate this course?</label>
                  <div className="lms-cmp-stars" role="radiogroup" aria-label="Course rating">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`lms-cmp-star${n <= (cmpHoverStar || cmpRating) ? " on" : ""}`}
                        onMouseEnter={() => setCmpHoverStar(n)}
                        onMouseLeave={() => setCmpHoverStar(0)}
                        onClick={() => setCmpRating(n)}
                        aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                        aria-pressed={cmpRating === n}
                      >★</button>
                    ))}
                  </div>
                </div>

                <div className="lms-cmp-field">
                  <label className="lms-cmp-label" htmlFor="cmp-takeaway">What's your biggest takeaway?</label>
                  <textarea
                    id="cmp-takeaway"
                    className="lms-cmp-textarea"
                    value={cmpTakeaway}
                    onChange={e => setCmpTakeaway(e.target.value)}
                    placeholder="One thing you'll carry forward…"
                    rows={2}
                  />
                </div>

                <div className="lms-cmp-field">
                  <label className="lms-cmp-label" htmlFor="cmp-improve">Anything we could improve? <span className="lms-cmp-optional">(optional)</span></label>
                  <textarea
                    id="cmp-improve"
                    className="lms-cmp-textarea"
                    value={cmpImprove}
                    onChange={e => setCmpImprove(e.target.value)}
                    placeholder="Be honest — it helps."
                    rows={2}
                  />
                </div>

                <div className="lms-cmp-actions">
                  <button className="lms-cmp-skip" onClick={() => setCompleteStep("booking")}>Skip</button>
                  <button className="lms-cmp-primary" onClick={submitCompletionReview} disabled={!cmpRating || cmpSubmitting}>
                    {cmpSubmitting ? "Submitting…" : "Submit review"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="lms-cmp-badge">🌱</div>
                <h2 className="lms-cmp-title">Want to go deeper?</h2>
                <p className="lms-cmp-sub">
                  A course plants the seed — a 1-on-1 with Neha helps you apply it to your own situation.
                  Book a private session to turn what you've learned into real change.
                </p>
                <div className="lms-cmp-actions lms-cmp-actions-book">
                  <button className="lms-cmp-skip" onClick={dismissComplete}>Maybe later</button>
                  <button className="lms-cmp-primary" onClick={() => { dismissComplete(); navigate("/booking"); }}>
                    Book a 1-on-1 →
                  </button>
                </div>
                {progressPct === 100 && (
                  <Link to={`/courses/${slug}/certificate`} className="lms-cmp-cert-link" onClick={dismissComplete}>
                    🎓 Get your certificate
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
