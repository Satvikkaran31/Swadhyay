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

function formatDateShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────

const ICONS = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  courses: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  articles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  sessions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

// ── Course sub-components ─────────────────────────────────────────────────────

function CourseList({ courses, onNew, onSelect, onDelete, onRefresh }) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (c) => {
    setTogglingId(c.id);
    try {
      await apiFetch(`/api/courses/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, is_published: !c.is_published }),
      });
      onRefresh();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Courses</h2>
        <button className="admin-btn-primary" onClick={onNew}>+ New Course</button>
      </div>

      <div className="admin-list-toolbar">
        <input
          className="admin-search"
          placeholder="Search courses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{filtered.length} of {courses.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">📚</span>
          <p>{search ? "No courses match your search." : "No courses yet."}</p>
          {!search && <button className="admin-btn-primary" onClick={onNew}>Create your first course</button>}
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500, maxWidth: 280 }}>{c.title}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {c.price === 0 ? "Free" : `₹${(c.price / 100).toLocaleString("en-IN")}`}
                </td>
                <td>
                  <button
                    className={`admin-publish-toggle ${c.is_published ? "published" : "draft"}`}
                    onClick={() => handleToggle(c)}
                    disabled={togglingId === c.id}
                  >
                    {togglingId === c.id ? "…" : c.is_published ? "✓ Published" : "Draft"}
                  </button>
                </td>
                <td>
                  <div className="admin-actions">
                    {deletingId === c.id ? (
                      <>
                        <span style={{ fontSize: "0.8rem", color: "#c00", fontWeight: 600 }}>Delete?</span>
                        <button
                          className="admin-btn-sm danger"
                          onClick={() => { onDelete(c.id); setDeletingId(null); }}
                        >
                          Yes
                        </button>
                        <button className="admin-btn-sm" onClick={() => setDeletingId(null)}>No</button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn-sm" onClick={() => onSelect(c.id)}>Edit</button>
                        <button className="admin-btn-sm danger" onClick={() => setDeletingId(c.id)}>Delete</button>
                      </>
                    )}
                  </div>
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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
    setShowCancelConfirm(false);
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

  const handleCancel = () => {
    if (isDirty.current) {
      setShowCancelConfirm(true);
      return;
    }
    onCancel();
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>{isNew ? "New Course" : "Edit Course"}</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {showCancelConfirm ? (
            <>
              <span style={{ fontSize: "0.85rem", color: "#666" }}>Discard changes?</span>
              <button
                className="admin-btn-sm danger"
                onClick={() => { isDirty.current = false; setShowCancelConfirm(false); onCancel(); }}
              >
                Discard
              </button>
              <button className="admin-btn-sm" onClick={() => setShowCancelConfirm(false)}>Keep editing</button>
            </>
          ) : (
            <button className="admin-btn-secondary" onClick={handleCancel}>Cancel</button>
          )}
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Course title" />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea value={form.description || ""} onChange={e => setField("description", e.target.value)} rows={3} placeholder="What students will learn…" />
      </div>
      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>Thumbnail URL</label>
          <input value={form.thumbnail_url || ""} onChange={e => setField("thumbnail_url", e.target.value)} placeholder="https://…" />
        </div>
        <div className="admin-form-group narrow">
          <label>Price (₹)</label>
          <input
            type="number"
            min="0"
            value={form.price === 0 ? "0" : form.price / 100}
            onChange={e => setField("price", Math.round(parseFloat(e.target.value || 0) * 100))}
            placeholder="0 = free"
          />
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
                      <input value={lesson.video_url || ""} onChange={e => setLessonField(mi, li, "video_url", e.target.value)} placeholder="https://youtube.com/watch?v=…" />
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
          {saving ? "Saving…" : isNew ? "Create Course" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Article sub-components ────────────────────────────────────────────────────

function ArticleList({ articles, onNew, onSelect, onDelete, onRefresh }) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (a) => {
    setTogglingId(a.id);
    try {
      await apiFetch(`/api/articles/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...a, is_published: !a.is_published }),
      });
      onRefresh();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Articles</h2>
        <button className="admin-btn-primary" onClick={onNew}>+ New Article</button>
      </div>

      <div className="admin-list-toolbar">
        <input
          className="admin-search"
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{filtered.length} of {articles.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">✍️</span>
          <p>{search ? "No articles match your search." : "No articles yet."}</p>
          {!search && <button className="admin-btn-primary" onClick={onNew}>Write your first article</button>}
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500, maxWidth: 300 }}>{a.title}</td>
                <td>
                  <button
                    className={`admin-publish-toggle ${a.is_published ? "published" : "draft"}`}
                    onClick={() => handleToggle(a)}
                    disabled={togglingId === a.id}
                  >
                    {togglingId === a.id ? "…" : a.is_published ? "✓ Published" : "Draft"}
                  </button>
                </td>
                <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#888" }}>
                  {formatDateShort(a.published_at || a.created_at)}
                </td>
                <td>
                  <div className="admin-actions">
                    {deletingId === a.id ? (
                      <>
                        <span style={{ fontSize: "0.8rem", color: "#c00", fontWeight: 600 }}>Delete?</span>
                        <button
                          className="admin-btn-sm danger"
                          onClick={() => { onDelete(a.id); setDeletingId(null); }}
                        >
                          Yes
                        </button>
                        <button className="admin-btn-sm" onClick={() => setDeletingId(null)}>No</button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn-sm" onClick={() => onSelect(a)}>Edit</button>
                        <button className="admin-btn-sm danger" onClick={() => setDeletingId(a.id)}>Delete</button>
                      </>
                    )}
                  </div>
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
        <textarea value={form.excerpt || ""} onChange={e => setField("excerpt", e.target.value)} rows={2} placeholder="Short summary shown on the articles page…" />
      </div>
      <div className="admin-form-group">
        <label>Content</label>
        <textarea value={form.content || ""} onChange={e => setField("content", e.target.value)} rows={10} placeholder="Supports paragraphs separated by blank lines…" />
      </div>
      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>Thumbnail URL</label>
          <input value={form.thumbnail_url || ""} onChange={e => setField("thumbnail_url", e.target.value)} placeholder="https://…" />
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
          {saving ? "Saving…" : isNew ? "Create Article" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    apiFetch("/api/users")
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setError("Could not load users.");
        }
      })
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  }, []);

  const toggleRole = async (u) => {
    setUpdatingId(u.id);
    const newRole = u.role === "admin" ? "student" : "admin";
    try {
      const updated = await apiFetch(`/api/users/${u.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (updated?.id) {
        setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: updated.role } : usr));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-empty">Loading users…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Users</h2>
        <span style={{ fontSize: "0.85rem", color: "#888" }}>{users.length} total</span>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-list-toolbar">
        <input
          className="admin-search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{filtered.length} of {users.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">👥</span>
          <p>{search ? "No users match your search." : "No users found."}</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {u.picture ? (
                      <img src={u.picture} alt={u.name} className="admin-user-row-avatar" />
                    ) : (
                      <span className="admin-user-row-avatar">
                        {(u.name ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                    <span style={{ fontWeight: 500 }}>{u.name ?? "—"}</span>
                  </div>
                </td>
                <td style={{ color: "#666", fontSize: "0.85rem" }}>{u.email}</td>
                <td>
                  <span className={`admin-badge ${u.role === "admin" ? "admin-role" : "student-role"}`}>
                    {u.role ?? "student"}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#888" }}>
                  {formatDateShort(u.created_at)}
                </td>
                <td>
                  <button
                    className={`admin-btn-sm ${u.role === "admin" ? "" : ""}`}
                    disabled={updatingId === u.id}
                    onClick={() => toggleRole(u)}
                  >
                    {updatingId === u.id
                      ? "…"
                      : u.role === "admin"
                        ? "Make Student"
                        : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
    ])
      .then(([statsData, sessionsData]) => {
        setStats(statsData);
        if (sessionsData?.bookings) {
          setSessions(sessionsData.bookings);
        } else {
          setSessionsError("Could not load upcoming sessions.");
        }
      })
      .catch(() => setSessionsError("Could not load data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-empty">Loading overview…</div>;

  return (
    <div>
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-icon">📈</span>
            <p className="admin-stat-label">Total Enrollments</p>
            <p className="admin-stat-value">{stats.total_enrollments ?? "—"}</p>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">💰</span>
            <p className="admin-stat-label">Revenue</p>
            <p className="admin-stat-value">
              {stats.revenue != null ? `₹${(stats.revenue / 100).toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">📚</span>
            <p className="admin-stat-label">Courses</p>
            <p className="admin-stat-value">{stats.total_courses ?? "—"}</p>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-icon">✍️</span>
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
            {sessions.map(s => (
              <div key={s.id} className="admin-session-item">
                <div className="admin-session-info">
                  <h4>{s.title || "Untitled event"}</h4>
                  <p>{formatDate(s.start)}</p>
                  {s.attendees?.length > 0 && <p>{s.attendees.join(", ")}</p>}
                </div>
                {s.meetLink && (
                  <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="admin-session-link">
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
      .then(data => {
        if (data?.bookings) setSessions(data.bookings);
        else setError("Could not load sessions. Ensure the Google Calendar integration is authorised.");
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
            Check the server environment for the Google Calendar credentials.
          </span>
        </p>
      ) : sessions.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">📅</span>
          <p>No upcoming sessions found.</p>
        </div>
      ) : (
        <div className="admin-sessions-list">
          {sessions.map(s => (
            <div key={s.id} className="admin-session-item">
              <div className="admin-session-info">
                <h4>{s.title || "Untitled event"}</h4>
                <p>{formatDate(s.start)} → {formatDate(s.end)}</p>
                {s.attendees?.length > 0 && <p>{s.attendees.join(", ")}</p>}
              </div>
              {s.meetLink && (
                <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="admin-session-link">
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
  const { user } = useUser();
  const navigate = useNavigate();

  const [section, setSection] = useState("overview");
  const [courseView, setCourseView] = useState("list");
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [articleView, setArticleView] = useState("list");
  const [editingArticle, setEditingArticle] = useState(null);
  const [courses, setCourses] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (false /* TODO: re-enable: !user || user.role !== "admin" */) {
      navigate("/");
    }
  }, [user]);

  const loadCourses = () =>
    apiFetch("/api/courses/admin/all").then(d => setCourses(Array.isArray(d) ? d : []));

  const loadArticles = () =>
    apiFetch("/api/articles/admin/all").then(d => setArticles(Array.isArray(d) ? d : []));

  useEffect(() => {
    loadCourses();
    loadArticles();
  }, []);

  const handleDeleteCourse = async (id) => {
    await apiFetch(`/api/courses/${id}`, { method: "DELETE" });
    loadCourses();
  };

  const handleDeleteArticle = async (id) => {
    await apiFetch(`/api/articles/${id}`, { method: "DELETE" });
    loadArticles();
  };

  const getBreadcrumb = () => {
    if (section === "courses") {
      if (courseView === "new") return "Courses › New Course";
      if (courseView === "edit") return "Courses › Edit";
      return "Courses";
    }
    if (section === "articles") {
      if (articleView === "new") return "Articles › New Article";
      if (articleView === "edit") return "Articles › Edit";
      return "Articles";
    }
    return { overview: "Overview", users: "Users", sessions: "Sessions" }[section] || section;
  };

  if (false /* TODO: re-enable: !user || user.role !== "admin" */) return null;

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">✦</span>
          <span className="admin-sidebar-name">Swadhyay</span>
        </div>

        <nav className="admin-sidebar-nav">
          {[
            { id: "overview", label: "Overview", icon: ICONS.overview },
            { id: "courses", label: "Courses", icon: ICONS.courses },
            { id: "articles", label: "Articles", icon: ICONS.articles },
            { id: "users", label: "Users", icon: ICONS.users },
            { id: "sessions", label: "Sessions", icon: ICONS.sessions },
          ].map(item => (
            <button
              key={item.id}
              className={`admin-nav-item${section === item.id ? " active" : ""}`}
              onClick={() => {
                setSection(item.id);
                setCourseView("list");
                setArticleView("list");
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-back" onClick={() => navigate("/")}>
            ← Back to site
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar-breadcrumb">{getBreadcrumb()}</span>
          <div className="admin-topbar-user">
            <div className="admin-user-avatar">{(user?.name ?? "G")[0].toUpperCase()}</div>
            <span className="admin-user-name">{user?.name ?? "Guest"}</span>
          </div>
        </header>

        <main className="admin-content">
          {section === "overview" && <OverviewTab />}

          {section === "courses" && (
            courseView === "list" ? (
              <CourseList
                courses={courses}
                onNew={() => { setEditingCourseId(null); setCourseView("new"); }}
                onSelect={id => { setEditingCourseId(id); setCourseView("edit"); }}
                onDelete={handleDeleteCourse}
                onRefresh={loadCourses}
              />
            ) : (
              <CourseEditor
                courseId={courseView === "edit" ? editingCourseId : null}
                onSave={() => { loadCourses(); setCourseView("list"); }}
                onCancel={() => setCourseView("list")}
              />
            )
          )}

          {section === "articles" && (
            articleView === "list" ? (
              <ArticleList
                articles={articles}
                onNew={() => { setEditingArticle(null); setArticleView("new"); }}
                onSelect={a => { setEditingArticle(a); setArticleView("edit"); }}
                onDelete={handleDeleteArticle}
                onRefresh={loadArticles}
              />
            ) : (
              <ArticleEditor
                article={articleView === "edit" ? editingArticle : null}
                onSave={() => { loadArticles(); setArticleView("list"); }}
                onCancel={() => setArticleView("list")}
              />
            )
          )}

          {section === "users" && <UsersTab />}
          {section === "sessions" && <SessionsTab />}
        </main>
      </div>
    </div>
  );
}
