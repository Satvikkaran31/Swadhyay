import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import "../styles/Admin.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { credentials: "include", ...opts });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body?.error || res.statusText) as any;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function emptyLesson(): { id?: number; title: string; video_url: string; duration: string; is_preview: boolean; type: string; content: string } {
  return { title: "", video_url: "", duration: "", is_preview: false, type: "video", content: "" };
}

function emptyModule(): { id?: number; title: string; description: string; lessons: ReturnType<typeof emptyLesson>[] } {
  return { title: "", description: "", lessons: [emptyLesson()] };
}

function emptyCourse() {
  return {
    title: "", description: "", short_description: "", thumbnail_url: "",
    price: 0, is_published: false, series_id: null as number | null,
    level: "", language: "English",
    what_youll_learn: [] as string[], requirements: [] as string[],
    modules: [emptyModule()],
  };
}

type SeriesFeature = { icon: string; title: string; desc: string };
function emptyFeature(): SeriesFeature { return { icon: "", title: "", desc: "" }; }

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
  series: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  testimonials: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  instructor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  newsletter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
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

function ImageUploader({ value, onChange, label = "Thumbnail URL" }) {
  return (
    <div className="admin-form-group">
      <label>{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="https://…" />
      {value && <img src={value} alt="preview" style={{ marginTop: "0.5rem", maxHeight: 80, borderRadius: 6, objectFit: "cover" }} />}
    </div>
  );
}

function CourseEditor({ courseId, onSave, onCancel }) {
  const [form, setForm] = useState(emptyCourse());
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(new Set());
  const isDirty = useRef(false);
  const isNew = !courseId;

  useEffect(() => {
    apiFetch("/api/series").then(d => setSeriesList(Array.isArray(d) ? d : [])).catch(() => {});
    const handler = (e) => {
      if (!isDirty.current) return;
      e.preventDefault(); e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    isDirty.current = false;
    setShowCancelConfirm(false);
    setCollapsedModules(new Set());
    if (!courseId) { setForm(emptyCourse()); return; }
    apiFetch(`/api/courses/admin/${courseId}`).then(data => {
      setForm({
        ...emptyCourse(),
        ...data,
        short_description: data.short_description || "",
        level: data.level || "",
        language: data.language || "English",
        what_youll_learn: Array.isArray(data.what_youll_learn) ? data.what_youll_learn : [],
        requirements: Array.isArray(data.requirements) ? data.requirements : [],
        series_id: data.series_id || null,
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

  const addListItem = (field: string) => {
    isDirty.current = true;
    setForm(f => ({ ...f, [field]: [...(f[field] as string[]), ""] }));
  };
  const setListItem = (field: string, idx: number, val: string) => {
    isDirty.current = true;
    setForm(f => { const arr = [...(f[field] as string[])]; arr[idx] = val; return { ...f, [field]: arr }; });
  };
  const removeListItem = (field: string, idx: number) => {
    isDirty.current = true;
    setForm(f => ({ ...f, [field]: (f[field] as string[]).filter((_, i) => i !== idx) }));
  };

  const setModuleTitle = (mi: number, val: string) => {
    isDirty.current = true;
    setForm(f => { const mods = [...f.modules]; mods[mi] = { ...mods[mi], title: val }; return { ...f, modules: mods }; });
  };
  const setModuleField = (mi: number, field: string, val: string) => {
    isDirty.current = true;
    setForm(f => { const mods = [...f.modules]; mods[mi] = { ...mods[mi], [field]: val }; return { ...f, modules: mods }; });
  };
  const addModule = () => { isDirty.current = true; setForm(f => ({ ...f, modules: [...f.modules, emptyModule()] })); };
  const removeModule = (mi: number) => { isDirty.current = true; setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== mi) })); };
  const moveModule = (mi: number, dir: number) => {
    isDirty.current = true;
    setForm(f => {
      const mods = [...f.modules]; const ti = mi + dir;
      if (ti < 0 || ti >= mods.length) return f;
      [mods[mi], mods[ti]] = [mods[ti], mods[mi]];
      return { ...f, modules: mods };
    });
  };
  const toggleModuleCollapse = (mi: number) => {
    setCollapsedModules(prev => { const next = new Set(prev); if (next.has(mi)) next.delete(mi); else next.add(mi); return next; });
  };

  const setLessonField = (mi: number, li: number, field: string, val) => {
    isDirty.current = true;
    setForm(f => {
      const mods = [...f.modules];
      const lessons = [...mods[mi].lessons];
      lessons[li] = { ...lessons[li], [field]: val };
      mods[mi] = { ...mods[mi], lessons };
      return { ...f, modules: mods };
    });
  };
  const addLesson = (mi: number) => {
    isDirty.current = true;
    setForm(f => { const mods = [...f.modules]; mods[mi] = { ...mods[mi], lessons: [...mods[mi].lessons, emptyLesson()] }; return { ...f, modules: mods }; });
  };
  const removeLesson = (mi: number, li: number) => {
    isDirty.current = true;
    setForm(f => { const mods = [...f.modules]; mods[mi] = { ...mods[mi], lessons: mods[mi].lessons.filter((_, i) => i !== li) }; return { ...f, modules: mods }; });
  };
  const moveLesson = (mi: number, li: number, dir: number) => {
    isDirty.current = true;
    setForm(f => {
      const mods = [...f.modules]; const lessons = [...mods[mi].lessons]; const ti = li + dir;
      if (ti < 0 || ti >= lessons.length) return f;
      [lessons[li], lessons[ti]] = [lessons[ti], lessons[li]];
      mods[mi] = { ...mods[mi], lessons };
      return { ...f, modules: mods };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Course title is required"); return; }
    setSaving(true); setError("");
    try {
      let cid = courseId;
      if (isNew) {
        const created = await apiFetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, price: 0, is_published: false }),
        });
        cid = created.id;
      }
      await apiFetch(`/api/courses/${cid}/batch-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          short_description: form.short_description,
          thumbnail_url: form.thumbnail_url,
          price: Number(form.price) || 0,
          is_published: form.is_published,
          series_id: form.series_id || null,
          level: form.level || null,
          language: form.language || "English",
          what_youll_learn: form.what_youll_learn.filter((s: string) => s.trim()),
          requirements: form.requirements.filter((s: string) => s.trim()),
          modules: form.modules.map((mod, mi) => ({
            ...(mod.id ? { id: mod.id } : {}),
            title: mod.title,
            description: (mod as any).description || null,
            position: mi,
            lessons: mod.lessons.map((lesson, li) => ({
              ...(lesson.id ? { id: lesson.id } : {}),
              title: lesson.title,
              type: (lesson as any).type || "video",
              video_url: lesson.video_url || null,
              content: (lesson as any).content || null,
              duration: lesson.duration ? Number(lesson.duration) : null,
              position: li,
              is_preview: Boolean(lesson.is_preview),
            })),
          })),
        }),
      });
      isDirty.current = false;
      onSave();
    } catch (err: any) {
      setError(err?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty.current) { setShowCancelConfirm(true); return; }
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
              <button className="admin-btn-sm danger" onClick={() => { isDirty.current = false; setShowCancelConfirm(false); onCancel(); }}>Discard</button>
              <button className="admin-btn-sm" onClick={() => setShowCancelConfirm(false)}>Keep editing</button>
            </>
          ) : (
            <button className="admin-btn-secondary" onClick={handleCancel}>Cancel</button>
          )}
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Basic info */}
      <div className="admin-form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Course title" />
      </div>
      <div className="admin-form-group">
        <label>Short Description</label>
        <input value={form.short_description || ""} onChange={e => setField("short_description", e.target.value)} placeholder="One-line summary shown on cards" />
      </div>
      <div className="admin-form-group">
        <label>Full Description</label>
        <textarea value={form.description || ""} onChange={e => setField("description", e.target.value)} rows={3} placeholder="Detailed description…" />
      </div>

      <div className="admin-form-row">
        <ImageUploader value={form.thumbnail_url} onChange={v => setField("thumbnail_url", v)} />
        <div className="admin-form-group narrow">
          <label>Price (₹)</label>
          <input type="number" min="0"
            value={form.price === 0 ? "0" : form.price / 100}
            onChange={e => setField("price", Math.round(parseFloat(e.target.value || "0") * 100))}
            placeholder="0 = free"
          />
        </div>
      </div>

      <div className="admin-form-row">
        <div className="admin-form-group">
          <label>Series</label>
          <select value={form.series_id ?? ""} onChange={e => setField("series_id", e.target.value ? Number(e.target.value) : null)}>
            <option value="">— No series —</option>
            {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div className="admin-form-group">
          <label>Level</label>
          <select value={form.level || ""} onChange={e => setField("level", e.target.value)}>
            <option value="">— Select level —</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="all-levels">All Levels</option>
          </select>
        </div>
        <div className="admin-form-group narrow">
          <label>Language</label>
          <select value={form.language || "English"} onChange={e => setField("language", e.target.value)}>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Hinglish">Hinglish</option>
          </select>
        </div>
      </div>

      <div className="admin-form-group checkbox-group">
        <label>
          <input type="checkbox" checked={form.is_published} onChange={e => setField("is_published", e.target.checked)} />
          Published (visible to students)
        </label>
      </div>

      {/* What you'll learn */}
      <div className="admin-form-group">
        <label>What You'll Learn</label>
        {(form.what_youll_learn as string[]).map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <input value={item} onChange={e => setListItem("what_youll_learn", i, e.target.value)} placeholder="Learning outcome…" style={{ flex: 1 }} />
            <button className="admin-btn-sm danger" onClick={() => removeListItem("what_youll_learn", i)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-secondary sm" onClick={() => addListItem("what_youll_learn")}>+ Add item</button>
      </div>

      {/* Requirements */}
      <div className="admin-form-group">
        <label>Requirements</label>
        {(form.requirements as string[]).map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <input value={item} onChange={e => setListItem("requirements", i, e.target.value)} placeholder="Prerequisite…" style={{ flex: 1 }} />
            <button className="admin-btn-sm danger" onClick={() => removeListItem("requirements", i)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-secondary sm" onClick={() => addListItem("requirements")}>+ Add item</button>
      </div>

      {/* Modules */}
      <div className="admin-modules" style={{ marginTop: "1.75rem" }}>
        <div className="admin-modules-header">
          <h3>Modules</h3>
          <button className="admin-btn-secondary" onClick={addModule}>+ Add Module</button>
        </div>

        {form.modules.map((mod, mi) => {
          const isCollapsed = collapsedModules.has(mi);
          return (
            <div key={mi} className="admin-module-block">
              <div className="admin-module-header">
                <div className="admin-reorder-group">
                  <button className="admin-reorder-btn" onClick={() => moveModule(mi, -1)} disabled={mi === 0}>↑</button>
                  <button className="admin-reorder-btn" onClick={() => moveModule(mi, 1)} disabled={mi === form.modules.length - 1}>↓</button>
                </div>
                <span className="admin-module-num">{mi + 1}</span>
                <input
                  className="admin-module-title-input"
                  value={mod.title}
                  onChange={e => setModuleTitle(mi, e.target.value)}
                  placeholder={`Module ${mi + 1} title`}
                />
                <span className="admin-module-lesson-count">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
                <button className="admin-btn-sm" onClick={() => toggleModuleCollapse(mi)}>
                  {isCollapsed ? "▶ Expand" : "▼ Collapse"}
                </button>
                <button className="admin-btn-sm danger" onClick={() => removeModule(mi)}>Remove</button>
              </div>

              {!isCollapsed && (
                <div className="admin-lessons">
                  <div className="admin-form-group" style={{ marginBottom: "1rem" }}>
                    <label>Module Description (optional)</label>
                    <textarea
                      rows={2}
                      value={(mod as any).description || ""}
                      onChange={e => setModuleField(mi, "description", e.target.value)}
                      placeholder="Brief description of what this module covers…"
                    />
                  </div>
                  {mod.lessons.map((lesson, li) => (
                    <div key={li} className="admin-lesson-block">
                      <div className="admin-lesson-left">
                        <div className="admin-reorder-group vertical">
                          <button className="admin-reorder-btn" onClick={() => moveLesson(mi, li, -1)} disabled={li === 0}>↑</button>
                          <span className="admin-lesson-num">{li + 1}</span>
                          <button className="admin-reorder-btn" onClick={() => moveLesson(mi, li, 1)} disabled={li === mod.lessons.length - 1}>↓</button>
                        </div>
                      </div>
                      <div className="admin-lesson-body">
                        <div className="admin-form-row">
                          <div className="admin-form-group">
                            <label>Lesson Title</label>
                            <input value={lesson.title} onChange={e => setLessonField(mi, li, "title", e.target.value)} placeholder="Lesson title" />
                          </div>
                          <div className="admin-form-group narrow">
                            <label>Lesson Type</label>
                            <select
                              value={(lesson as any).type || "video"}
                              onChange={e => setLessonField(mi, li, "type", e.target.value)}
                            >
                              <option value="video">▷ Video</option>
                              <option value="text">☰ Text / Reading</option>
                            </select>
                          </div>
                          <div className="admin-form-group narrow">
                            <label>Duration (sec)</label>
                            <input type="number" min="0" value={lesson.duration || ""} onChange={e => setLessonField(mi, li, "duration", e.target.value)} placeholder="e.g. 360" />
                          </div>
                        </div>
                        {((lesson as any).type === "text") && (
                          <div className="admin-form-group">
                            <label>Content (Markdown)</label>
                            <textarea
                              rows={10}
                              value={(lesson as any).content || ""}
                              onChange={e => setLessonField(mi, li, "content", e.target.value)}
                              placeholder={"Write lesson content in Markdown…\n\n# Heading\nRegular paragraph text\n\n- Bullet point"}
                              style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13 }}
                            />
                          </div>
                        )}
                        {(!(lesson as any).type || (lesson as any).type === "video") && (
                          <div className="admin-form-group">
                            <label>Video URL (YouTube or Vimeo)</label>
                            <input value={lesson.video_url || ""} onChange={e => setLessonField(mi, li, "video_url", e.target.value)} placeholder="https://youtube.com/watch?v=…" />
                          </div>
                        )}
                        <div className="admin-lesson-footer">
                          <label className="admin-checkbox-label">
                            <input type="checkbox" checked={lesson.is_preview} onChange={e => setLessonField(mi, li, "is_preview", e.target.checked)} />
                            Free preview
                          </label>
                          <button className="admin-btn-sm danger" onClick={() => removeLesson(mi, li)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="admin-btn-secondary sm" onClick={() => addLesson(mi)}>+ Add Lesson</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="admin-save-row">
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create Course" : "Save Changes"}
        </button>
        {saving && <span style={{ fontSize: "0.85rem", color: "#888" }}>Saving all changes atomically…</span>}
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
          <div className="admin-stat-card">
            <span className="admin-stat-icon">📧</span>
            <p className="admin-stat-label">Newsletter Subscribers</p>
            <p className="admin-stat-value">{stats.newsletter_subscribers ?? "—"}</p>
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

// ── Series tab ────────────────────────────────────────────────────────────────

function emptySeries() {
  return { title: "", description: "", thumbnail_url: "", features: [] as SeriesFeature[], is_published: false, position: 0 };
}

function SeriesEditor({ seriesData, onSave, onCancel }) {
  const isNew = !seriesData?.id;
  const [form, setForm] = useState(seriesData ? { ...seriesData, features: Array.isArray(seriesData.features) ? seriesData.features : [] } : emptySeries());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setFeatureField = (i: number, field: keyof SeriesFeature, val: string) => {
    setForm(f => { const features = [...f.features]; features[i] = { ...features[i], [field]: val }; return { ...f, features }; });
  };
  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, emptyFeature()] }));
  const removeFeature = (i: number) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, position: Number(form.position) || 0 };
      if (isNew) {
        await apiFetch("/api/series", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/series/${seriesData.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      onSave();
    } catch (err: any) {
      setError(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>{isNew ? "New Series" : "Edit Series"}</h2>
        <button className="admin-btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-form-group">
        <label>Title *</label>
        <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Series title" />
      </div>
      <div className="admin-form-group">
        <label>Description</label>
        <textarea value={form.description || ""} onChange={e => setField("description", e.target.value)} rows={3} placeholder="What this series covers…" />
      </div>
      <div className="admin-form-row">
        <ImageUploader value={form.thumbnail_url} onChange={v => setField("thumbnail_url", v)} />
        <div className="admin-form-group narrow">
          <label>Position</label>
          <input type="number" min="0" value={form.position ?? 0} onChange={e => setField("position", e.target.value)} />
        </div>
      </div>
      <div className="admin-form-group checkbox-group">
        <label>
          <input type="checkbox" checked={form.is_published} onChange={e => setField("is_published", e.target.checked)} />
          Published
        </label>
      </div>
      <div className="admin-form-group" style={{ marginTop: "1.25rem" }}>
        <label>Features (shown on series detail page)</label>
        {form.features.map((feat, i) => (
          <div key={i} className="admin-feature-row">
            <input value={feat.icon} onChange={e => setFeatureField(i, "icon", e.target.value)} placeholder="Emoji or icon (e.g. 🎯)" style={{ width: 60 }} />
            <input value={feat.title} onChange={e => setFeatureField(i, "title", e.target.value)} placeholder="Feature title" style={{ flex: 1 }} />
            <input value={feat.desc} onChange={e => setFeatureField(i, "desc", e.target.value)} placeholder="Feature description" style={{ flex: 2 }} />
            <button className="admin-btn-sm danger" onClick={() => removeFeature(i)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-secondary sm" style={{ marginTop: "0.4rem" }} onClick={addFeature}>+ Add Feature</button>
      </div>
      <div className="admin-save-row">
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isNew ? "Create Series" : "Save Changes"}</button>
      </div>
    </div>
  );
}

function SeriesTab() {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch("/api/series/admin/all").then(d => setSeriesList(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/series/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  };

  if (view !== "list") {
    return (
      <SeriesEditor
        seriesData={view === "edit" ? editingItem : null}
        onSave={() => { load(); setView("list"); }}
        onCancel={() => setView("list")}
      />
    );
  }

  if (loading) return <div className="admin-empty">Loading series…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Series</h2>
        <button className="admin-btn-primary" onClick={() => { setEditingItem(null); setView("new"); }}>+ New Series</button>
      </div>
      {seriesList.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">📺</span>
          <p>No series yet.</p>
          <button className="admin-btn-primary" onClick={() => setView("new")}>Create your first series</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Courses</th><th>Position</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {seriesList.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.title}</td>
                <td>{s.course_count ?? 0}</td>
                <td>{s.position ?? 0}</td>
                <td>
                  <span className={`admin-badge ${s.is_published ? "admin-role" : "student-role"}`}>
                    {s.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    {deletingId === s.id ? (
                      <>
                        <span style={{ fontSize: "0.8rem", color: "#c00", fontWeight: 600 }}>Delete?</span>
                        <button className="admin-btn-sm danger" onClick={() => handleDelete(s.id)}>Yes</button>
                        <button className="admin-btn-sm" onClick={() => setDeletingId(null)}>No</button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn-sm" onClick={() => { setEditingItem(s); setView("edit"); }}>Edit</button>
                        <button className="admin-btn-sm danger" onClick={() => setDeletingId(s.id)}>Delete</button>
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

// ── Testimonials tab ──────────────────────────────────────────────────────────

function emptyTestimonial() {
  return { name: "", role: "", quote: "", avatar_url: "", is_published: true, position: 0 };
}

function TestimonialsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    apiFetch("/api/testimonials/admin/all").then(d => setItems(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startNew = () => setEditingItem({ ...emptyTestimonial() });
  const startEdit = (item) => setEditingItem({ ...item });
  const cancelEdit = () => setEditingItem(null);

  const handleSave = async () => {
    if (!editingItem.name?.trim() || !editingItem.quote?.trim()) { setError("Name and quote are required"); return; }
    setSaving(true); setError("");
    try {
      if (editingItem.id) {
        await apiFetch(`/api/testimonials/${editingItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingItem) });
      } else {
        await apiFetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingItem) });
      }
      setEditingItem(null);
      load();
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/testimonials/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  };

  const setField = (field, val) => setEditingItem(e => ({ ...e, [field]: val }));

  if (loading) return <div className="admin-empty">Loading testimonials…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Testimonials</h2>
        {!editingItem && <button className="admin-btn-primary" onClick={startNew}>+ New Testimonial</button>}
      </div>

      {editingItem && (
        <div className="admin-inline-editor">
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Name *</label>
              <input value={editingItem.name} onChange={e => setField("name", e.target.value)} placeholder="Student name" />
            </div>
            <div className="admin-form-group">
              <label>Role / Title</label>
              <input value={editingItem.role || ""} onChange={e => setField("role", e.target.value)} placeholder="e.g. Marketing Manager" />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Quote *</label>
            <textarea value={editingItem.quote} onChange={e => setField("quote", e.target.value)} rows={3} placeholder="What they said…" />
          </div>
          <div className="admin-form-row">
            <ImageUploader value={editingItem.avatar_url} onChange={v => setField("avatar_url", v)} label="Avatar URL" />
            <div className="admin-form-group narrow">
              <label>Position</label>
              <input type="number" min="0" value={editingItem.position ?? 0} onChange={e => setField("position", Number(e.target.value))} />
            </div>
          </div>
          <div className="admin-form-group checkbox-group">
            <label>
              <input type="checkbox" checked={editingItem.is_published} onChange={e => setField("is_published", e.target.checked)} />
              Published
            </label>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingItem.id ? "Save Changes" : "Create"}</button>
            <button className="admin-btn-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !editingItem ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">💬</span>
          <p>No testimonials yet.</p>
          <button className="admin-btn-primary" onClick={startNew}>Add first testimonial</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Role</th><th>Quote</th><th>Position</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {t.avatar_url && <img src={t.avatar_url} alt={t.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
                    {t.name}
                  </div>
                </td>
                <td style={{ color: "#888", fontSize: "0.85rem" }}>{t.role || "—"}</td>
                <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.quote}</td>
                <td>{t.position ?? 0}</td>
                <td>
                  <span className={`admin-badge ${t.is_published ? "admin-role" : "student-role"}`}>
                    {t.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    {deletingId === t.id ? (
                      <>
                        <span style={{ fontSize: "0.8rem", color: "#c00", fontWeight: 600 }}>Delete?</span>
                        <button className="admin-btn-sm danger" onClick={() => handleDelete(t.id)}>Yes</button>
                        <button className="admin-btn-sm" onClick={() => setDeletingId(null)}>No</button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn-sm" onClick={() => startEdit(t)}>Edit</button>
                        <button className="admin-btn-sm danger" onClick={() => setDeletingId(t.id)}>Delete</button>
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

// ── Instructor tab ────────────────────────────────────────────────────────────

function InstructorTab() {
  const [form, setForm] = useState({ name: "", title: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  useEffect(() => {
    apiFetch("/api/instructor").then(data => {
      if (data) setForm({ name: data.name || "", title: data.title || "", bio: data.bio || "", avatar_url: data.avatar_url || "" });
    }).finally(() => setLoading(false));
  }, []);

  const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setSaved(false); setError("");
    try {
      await apiFetch("/api/instructor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-empty">Loading instructor profile…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Instructor Profile</h2>
        {saved && <span style={{ fontSize: "0.85rem", color: "#22863a", fontWeight: 600 }}>✓ Saved</span>}
      </div>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-form-group">
        <label>Name *</label>
        <input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Your name" />
      </div>
      <div className="admin-form-group">
        <label>Title / Tagline</label>
        <input value={form.title || ""} onChange={e => setField("title", e.target.value)} placeholder="e.g. Executive Life Coach" />
      </div>
      <div className="admin-form-group">
        <label>Bio</label>
        <textarea value={form.bio || ""} onChange={e => setField("bio", e.target.value)} rows={5} placeholder="About you…" />
      </div>
      <ImageUploader value={form.avatar_url} onChange={v => setField("avatar_url", v)} label="Profile Photo URL" />
      {form.avatar_url && (
        <div style={{ marginBottom: "1rem" }}>
          <img src={form.avatar_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
        </div>
      )}
      <div className="admin-save-row">
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
      </div>
    </div>
  );
}

// ── Newsletter tab ────────────────────────────────────────────────────────────

function NewsletterTab() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/newsletter/subscribers")
      .then(d => setSubscribers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscribers.filter(s =>
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const csv = ["Email,Subscribed At", ...subscribers.map(s => `${s.email},${s.subscribed_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter_subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="admin-empty">Loading subscribers…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Newsletter Subscribers</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "#888" }}>{subscribers.length} total</span>
          {subscribers.length > 0 && (
            <button className="admin-btn-secondary" onClick={exportCSV}>↓ Export CSV</button>
          )}
        </div>
      </div>

      <div className="admin-list-toolbar">
        <input className="admin-search" placeholder="Search by email…" value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{filtered.length} of {subscribers.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">📧</span>
          <p>{search ? "No subscribers match your search." : "No subscribers yet."}</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>#</th><th>Email</th><th>Subscribed</th></tr></thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}>
                <td style={{ color: "#aaa", fontSize: "0.8rem" }}>{i + 1}</td>
                <td>{s.email}</td>
                <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#888" }}>{formatDateShort(s.subscribed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const navigateTo = (id: string) => {
    setSection(id);
    setCourseView("list");
    setArticleView("list");
    setSidebarOpen(false);
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
    return {
      overview: "Overview", users: "Users", sessions: "Sessions",
      series: "Series", instructor: "Instructor", newsletter: "Newsletter", testimonials: "Testimonials",
    }[section] || section;
  };

  if (false /* TODO: re-enable: !user || user.role !== "admin" */) return null;

  const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: ICONS.overview },
    { id: "courses", label: "Courses", icon: ICONS.courses },
    { id: "series", label: "Series", icon: ICONS.series },
    { id: "articles", label: "Articles", icon: ICONS.articles },
    { id: "users", label: "Users", icon: ICONS.users },
    { id: "sessions", label: "Sessions", icon: ICONS.sessions },
    { id: "instructor", label: "Instructor", icon: ICONS.instructor },
    { id: "testimonials", label: "Testimonials", icon: ICONS.testimonials },
    { id: "newsletter", label: "Newsletter", icon: ICONS.newsletter },
  ];

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">✦</span>
          <span className="admin-sidebar-name">Swadhyay</span>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item${section === item.id ? " active" : ""}`}
              onClick={() => navigateTo(item.id)}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="admin-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <span className="admin-topbar-breadcrumb">{getBreadcrumb()}</span>
          </div>
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

          {section === "series" && <SeriesTab />}

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
          {section === "instructor" && <InstructorTab />}
          {section === "testimonials" && <TestimonialsTab />}
          {section === "newsletter" && <NewsletterTab />}
        </main>
      </div>
    </div>
  );
}
