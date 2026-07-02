import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import "../styles/Admin.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { credentials: "include", ...opts });
  return res.json();
}

function emptyLesson() {
  return { title: "", video_url: "", duration: "", is_preview: false };
}

function emptyModule() {
  return { title: "", lessons: [emptyLesson()] };
}

function emptyCourse() {
  return { title: "", description: "", thumbnail_url: "", price: 0, is_published: false, modules: [emptyModule()] };
}

function emptyArticle() {
  return { title: "", excerpt: "", content: "", thumbnail_url: "", author: "Neha", is_published: false };
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Course sub-components ─────────────────────────────────────────────────────

function CourseList({ courses, onSelect, onNew, onDelete }) {
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Courses</h2>
        <button className="admin-btn-primary" onClick={onNew}>+ New Course</button>
      </div>
      {courses.length === 0 ? (
        <p className="admin-empty">No courses yet. Create your first one!</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Price</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.price === 0 ? "Free" : `₹${(c.price / 100).toLocaleString("en-IN")}`}</td>
                <td>
                  <span className={`admin-badge ${c.is_published ? "published" : "draft"}`}>
                    {c.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="admin-actions">
                  <button className="admin-btn-sm" onClick={() => onSelect(c.id)}>Edit</button>
                  <button className="admin-btn-sm danger" onClick={() => onDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CourseEditor({ courseId, onSave, onCancel }) {
  const [form, setForm] = useState(emptyCourse());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDirty = useRef(false);
  const isNew = !courseId;

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    isDirty.current = false;
    if (!courseId) { setForm(emptyCourse()); return; }
    apiFetch(`/api/courses/admin/${courseId}`).then(data => {
      setForm({
        ...data,
        modules: (data.modules || []).map(m => ({
          ...m,
          lessons: (m.lessons || []).map(l => ({
            ...l,
            duration: l.duration ? String(l.duration) : "",
          })),
        })),
      });
    });
  }, [courseId]);

  const setField = (field, val) => { isDirty.current = true; setForm(f => ({ ...f, [field]: val })); };

  const setModuleTitle = (mi, val) => {
    isDirty.current = true;
    setForm(f => { const mods = [...f.modules]; mods[mi] = { ...mods[mi], title: val }; return { ...f, modules: mods }; });
  };

  const addModule = () => {
    isDirty.current = true;
    setForm(f => ({ ...f, modules: [...f.modules, emptyModule()] }));
  };

  const removeModule = (mi) => {
    isDirty.current = true;
    setForm(f => { const mods = f.modules.filter((_, i) => i !== mi); return { ...f, modules: mods }; });
  };

  const setLessonField = (mi, li, field, val) => {
    isDirty.current = true;
    setForm(f => {
      const mods = [...f.modules];
      const lessons = [...mods[mi].lessons];
      lessons[li] = { ...lessons[li], [field]: val };
      mods[mi] = { ...mods[mi], lessons };
      return { ...f, modules: mods };
    });
  };

  const addLesson = (mi) => {
    isDirty.current = true;
    setForm(f => {
      const mods = [...f.modules];
      mods[mi] = { ...mods[mi], lessons: [...mods[mi].lessons, emptyLesson()] };
      return { ...f, modules: mods };
    });
  };

  const removeLesson = (mi, li) => {
    isDirty.current = true;
    setForm(f => {
      const mods = [...f.modules];
      mods[mi] = { ...mods[mi], lessons: mods[mi].lessons.filter((_, i) => i !== li) };
      return { ...f, modules: mods };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Course title is required"); return; }
    setSaving(true); setError("");

    try {
      let savedCourse;
      if (isNew) {
        savedCourse = await apiFetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            thumbnail_url: form.thumbnail_url,
            price: Number(form.price) || 0,
            is_published: form.is_published,
          }),
        });
      } else {
        savedCourse = await apiFetch(`/api/courses/${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            thumbnail_url: form.thumbnail_url,
            price: Number(form.price) || 0,
            is_published: form.is_published,
          }),
        });
      }

      const cid = savedCourse.id;

      for (let mi = 0; mi < form.modules.length; mi++) {
        const mod = form.modules[mi];
        let savedMod;

        if (mod.id) {
          await apiFetch(`/api/courses/modules/${mod.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: mod.title, position: mi }),
          });
          savedMod = { id: mod.id };
        } else {
          savedMod = await apiFetch("/api/courses/modules/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_id: cid, title: mod.title, position: mi }),
          });
        }

        for (let li = 0; li < mod.lessons.length; li++) {
          const lesson = mod.lessons[li];
          const lessonPayload = {
            title: lesson.title,
            video_url: lesson.video_url || null,
            duration: lesson.duration ? Number(lesson.duration) : null,
            position: li,
            is_preview: Boolean(lesson.is_preview),
          };

          if (lesson.id) {
            await apiFetch(`/api/courses/lessons/${lesson.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(lessonPayload),
            });
          } else {
            await apiFetch("/api/courses/lessons/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ module_id: savedMod.id, ...lessonPayload }),
            });
          }
        }
      }

      isDirty.current = false;
      onSave();
    } catch (err) {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>{isNew ? "New Course" : "Edit Course"}</h2>
        <button className="admin-btn-secondary" onClick={() => {
          if (isDirty.current && !confirm("You have unsaved changes. Discard them?")) return;
          isDirty.current = false;
          onCancel();
        }}>Cancel</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Course title" />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea value={form.description || ""} onChange={e => setField("description", e.target.value)} rows={3} placeholder="What students will learn..." />
      </div>
      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>Thumbnail URL</label>
          <input value={form.thumbnail_url || ""} onChange={e => setField("thumbnail_url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="admin-form-group narrow">
          <label>Price (₹)</label>
          <input type="number" min="0" value={form.price === 0 ? "0" : form.price / 100} onChange={e => setField("price", Math.round(parseFloat(e.target.value || 0) * 100))} placeholder="0 = free" />
        </div>
      </div>
      <div className="admin-form-group checkbox-group">
        <label>
          <input type="checkbox" checked={form.is_published} onChange={e => setField("is_published", e.target.checked)} />
          Published (visible to students)
        </label>
      </div>

      <div className="admin-modules">
        <div className="admin-modules-header">
          <h3>Modules</h3>
          <button className="admin-btn-secondary" onClick={addModule}>+ Add Module</button>
        </div>

        {form.modules.map((mod, mi) => (
          <div key={mi} className="admin-module-block">
            <div className="admin-module-header">
              <input
                className="admin-module-title-input"
                value={mod.title}
                onChange={e => setModuleTitle(mi, e.target.value)}
                placeholder={`Module ${mi + 1} title`}
              />
              <button className="admin-btn-sm danger" onClick={() => removeModule(mi)}>Remove Module</button>
            </div>

            <div className="admin-lessons">
              {mod.lessons.map((lesson, li) => (
                <div key={li} className="admin-lesson-block">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Lesson Title</label>
                      <input value={lesson.title} onChange={e => setLessonField(mi, li, "title", e.target.value)} placeholder="Lesson title" />
                    </div>
                    <div className="admin-form-group">
                      <label>Video URL (YouTube / Vimeo)</label>
                      <input value={lesson.video_url || ""} onChange={e => setLessonField(mi, li, "video_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                    </div>
                    <div className="admin-form-group narrow">
                      <label>Duration (sec)</label>
                      <input type="number" min="0" value={lesson.duration || ""} onChange={e => setLessonField(mi, li, "duration", e.target.value)} placeholder="e.g. 360" />
                    </div>
                  </div>
                  <div className="admin-lesson-footer">
                    <label className="admin-checkbox-label">
                      <input type="checkbox" checked={lesson.is_preview} onChange={e => setLessonField(mi, li, "is_preview", e.target.checked)} />
                      Free preview
                    </label>
                    <button className="admin-btn-sm danger" onClick={() => removeLesson(mi, li)}>Remove</button>
                  </div>
                </div>
              ))}
              <button className="admin-btn-secondary sm" onClick={() => addLesson(mi)}>+ Add Lesson</button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-save-row">
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isNew ? "Create Course" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Article sub-components ────────────────────────────────────────────────────

function ArticleList({ articles, onSelect, onNew, onDelete }) {
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Articles</h2>
        <button className="admin-btn-primary" onClick={onNew}>+ New Article</button>
      </div>
      {articles.length === 0 ? (
        <p className="admin-empty">No articles yet. Write your first one!</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Published?</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {articles.map(a => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>
                  <span className={`admin-badge ${a.is_published ? "published" : "draft"}`}>
                    {a.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#888" }}>
                  {formatDate(a.published_at || a.created_at)}
                </td>
                <td className="admin-actions">
                  <button className="admin-btn-sm" onClick={() => onSelect(a)}>Edit</button>
                  <button className="admin-btn-sm danger" onClick={() => onDelete(a.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ArticleEditor({ article, onSave, onCancel }) {
  const isNew = !article?.id;
  const [form, setForm] = useState(article ? { ...article } : emptyArticle());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");

    try {
      if (isNew) {
        await apiFetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch(`/api/articles/${article.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      onSave();
    } catch (err) {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>{isNew ? "New Article" : "Edit Article"}</h2>
        <button className="admin-btn-secondary" onClick={onCancel}>Cancel</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Article title" />
      </div>
      <div className="admin-form-group">
        <label>Excerpt</label>
        <textarea value={form.excerpt || ""} onChange={e => setField("excerpt", e.target.value)} rows={2} placeholder="Short summary shown on the articles page..." />
      </div>
      <div className="admin-form-group">
        <label>Content</label>
        <textarea value={form.content || ""} onChange={e => setField("content", e.target.value)} rows={10} placeholder="Supports paragraphs separated by blank lines..." />
      </div>
      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>Thumbnail URL</label>
          <input value={form.thumbnail_url || ""} onChange={e => setField("thumbnail_url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="admin-form-group narrow">
          <label>Author</label>
          <input value={form.author || "Neha"} onChange={e => setField("author", e.target.value)} placeholder="Neha" />
        </div>
      </div>
      <div className="admin-form-group checkbox-group">
        <label>
          <input type="checkbox" checked={form.is_published} onChange={e => setField("is_published", e.target.checked)} />
          Published (visible to readers)
        </label>
      </div>

      <div className="admin-save-row">
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : isNew ? "Create Article" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsError, setSessionsError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/articles/admin/stats"),
      apiFetch("/api/calendar/upcoming"),
    ]).then(([statsData, sessionsData]) => {
      setStats(statsData);
      if (sessionsData?.bookings) {
        setSessions(sessionsData.bookings);
      } else {
        setSessionsError("Could not load upcoming sessions.");
      }
    }).catch(() => {
      setSessionsError("Could not load data.");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-empty">Loading overview…</div>;

  return (
    <div>
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <p className="admin-stat-label">Total Enrollments</p>
            <p className="admin-stat-value">{stats.total_enrollments ?? "—"}</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">Revenue</p>
            <p className="admin-stat-value">
              {stats.revenue != null
                ? `₹${(stats.revenue / 100).toLocaleString("en-IN")}`
                : "—"}
            </p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">Courses</p>
            <p className="admin-stat-value">{stats.total_courses ?? "—"}</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">Published Articles</p>
            <p className="admin-stat-value">{stats.published_articles ?? "—"}</p>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Upcoming Sessions</h2>
        </div>

        {sessionsError ? (
          <p className="admin-empty" style={{ color: "#c00" }}>
            {sessionsError}
            <br />
            <span style={{ fontWeight: 400, fontSize: "0.82rem", color: "#888" }}>
              Ensure the Google Calendar integration is authorised.
            </span>
          </p>
        ) : sessions.length === 0 ? (
          <p className="admin-empty">No upcoming sessions in the next 2 weeks.</p>
        ) : (
          <div className="admin-sessions-list">
            {sessions.map((s) => (
              <div key={s.id} className="admin-session-item">
                <div className="admin-session-info">
                  <h4>{s.title || "Untitled event"}</h4>
                  <p>{formatDate(s.start)}</p>
                  {s.attendees?.length > 0 && (
                    <p>{s.attendees.join(", ")}</p>
                  )}
                </div>
                {s.meetLink && (
                  <a
                    href={s.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-session-link"
                  >
                    Join Meet →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sessions tab ──────────────────────────────────────────────────────────────

function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/calendar/upcoming")
      .then((data) => {
        if (data?.bookings) setSessions(data.bookings);
        else setError("Could not load sessions.");
      })
      .catch(() => setError("Could not load sessions."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-empty">Loading sessions…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Upcoming Sessions (next 2 weeks)</h2>
      </div>

      {error ? (
        <p className="admin-empty" style={{ color: "#c00" }}>
          {error}
          <br />
          <span style={{ fontWeight: 400, fontSize: "0.82rem", color: "#888" }}>
            Ensure the Google Calendar integration is authorised in the server environment.
          </span>
        </p>
      ) : sessions.length === 0 ? (
        <p className="admin-empty">No upcoming sessions found.</p>
      ) : (
        <div className="admin-sessions-list">
          {sessions.map((s) => (
            <div key={s.id} className="admin-session-item">
              <div className="admin-session-info">
                <h4>{s.title || "Untitled event"}</h4>
                <p>{formatDate(s.start)} → {formatDate(s.end)}</p>
                {s.attendees?.length > 0 && <p>{s.attendees.join(", ")}</p>}
              </div>
              {s.meetLink && (
                <a
                  href={s.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-session-link"
                >
                  Join Meet →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { user, loading: authLoading } = useUser();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");

  // Courses state
  const [courses, setCourses] = useState([]);
  const [courseView, setCourseView] = useState("list");
  const [editingCourseId, setEditingCourseId] = useState(null);

  // Articles state
  const [articles, setArticles] = useState([]);
  const [articleView, setArticleView] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, authLoading]);

  const loadCourses = () => {
    apiFetch("/api/courses/admin/all").then(data => setCourses(Array.isArray(data) ? data : []));
  };

  const loadArticles = () => {
    apiFetch("/api/articles/admin/all").then(data => setArticles(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadCourses();
      loadArticles();
    }
  }, [user]);

  const handleDeleteCourse = async (id) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    await apiFetch(`/api/courses/${id}`, { method: "DELETE" });
    loadCourses();
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    await apiFetch(`/api/articles/${id}`, { method: "DELETE" });
    loadArticles();
  };

  if (authLoading) return <div className="admin-loader">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <button className="admin-back-home" onClick={() => navigate("/")}>← Swadhyay</button>
        <span className="admin-topbar-title">Admin Dashboard</span>
        <span className="admin-topbar-user">{user.name}</span>
      </div>

      {/* Tab navigation */}
      <nav className="admin-tabs">
        {[
          { id: "overview", label: "Overview" },
          { id: "courses", label: "Courses" },
          { id: "articles", label: "Articles" },
          { id: "sessions", label: "Sessions" },
        ].map(t => (
          <button
            key={t.id}
            className={`admin-tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="admin-content">
        {/* Overview Tab */}
        {tab === "overview" && <OverviewTab />}

        {/* Courses Tab */}
        {tab === "courses" && (
          <>
            {courseView === "list" && (
              <CourseList
                courses={courses}
                onNew={() => { setEditingCourseId(null); setCourseView("new"); }}
                onSelect={(id) => { setEditingCourseId(id); setCourseView("edit"); }}
                onDelete={handleDeleteCourse}
              />
            )}
            {(courseView === "new" || courseView === "edit") && (
              <CourseEditor
                courseId={courseView === "edit" ? editingCourseId : null}
                onSave={() => { loadCourses(); setCourseView("list"); }}
                onCancel={() => setCourseView("list")}
              />
            )}
          </>
        )}

        {/* Articles Tab */}
        {tab === "articles" && (
          <>
            {articleView === "list" && (
              <ArticleList
                articles={articles}
                onNew={() => { setEditingArticle(null); setArticleView("new"); }}
                onSelect={(a) => { setEditingArticle(a); setArticleView("edit"); }}
                onDelete={handleDeleteArticle}
              />
            )}
            {(articleView === "new" || articleView === "edit") && (
              <ArticleEditor
                article={articleView === "edit" ? editingArticle : null}
                onSave={() => { loadArticles(); setArticleView("list"); }}
                onCancel={() => setArticleView("list")}
              />
            )}
          </>
        )}

        {/* Sessions Tab */}
        {tab === "sessions" && <SessionsTab />}
      </div>
    </div>
  );
}
