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
  crm: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 11h-6M20 8l3 3-3 3" />
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
        body: JSON.stringify({ is_published: !c.is_published }),
      });
      onRefresh();
    } catch {
      alert("Failed to update publish status. Please try again.");
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
              <th>LinkedIn</th>
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
                <td style={{ fontSize: "0.8rem" }}>
                  {u.linkedin_url ? (
                    <a href={u.linkedin_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#0A66C2", textDecoration: "none", fontWeight: 500 }}>
                      View ↗
                    </a>
                  ) : (
                    <span style={{ color: "#ccc" }}>—</span>
                  )}
                </td>
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

// ── CRM tab ───────────────────────────────────────────────────────────────────

const CRM_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;
const CRM_SOURCES  = ['inquiry', 'newsletter', 'manual'] as const;
const CRM_CATS     = ['welcome', 'follow-up', 'promotional', 'nurture', 'general'] as const;

const STATUS_COLORS: Record<string, string> = {
  new: 'crm-status-new', contacted: 'crm-status-contacted',
  qualified: 'crm-status-qualified', converted: 'crm-status-converted', lost: 'crm-status-lost',
};

function emptyLeadForm() {
  return { name: '', email: '', phone: '', linkedin_url: '', source: 'manual', status: 'new', notes: '', tags: [] as string[] };
}
function emptyTemplateForm() {
  return { name: '', subject: '', body: '', category: 'general' };
}

// ── Leads Panel ────────────────────────────────────────────────────────────

function LeadsPanel() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyLeadForm());
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sendModal, setSendModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sendTemplateId, setSendTemplateId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterSource !== 'all') params.set('source', filterSource);
    if (search.trim()) params.set('search', search.trim());
    apiFetch(`/api/crm/leads?${params}`).then(d => setLeads(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };

  useEffect(load, [filterStatus, filterSource]);

  const handleSearch = (e) => { if (e.key === 'Enter') load(); };

  const toggleSelect = (id: number) => setSelected(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const toggleAll = () => setSelected(prev => prev.size === leads.length ? new Set() : new Set(leads.map(l => l.id)));

  const handleAddSave = async () => {
    if (!addForm.name.trim() || !addForm.email.trim()) { setAddError('Name and email are required'); return; }
    setAddSaving(true); setAddError('');
    try {
      await apiFetch('/api/crm/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm),
      });
      setShowAddForm(false); setAddForm(emptyLeadForm()); load();
    } catch (err: any) { setAddError(err.message || 'Failed to save'); }
    finally { setAddSaving(false); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/crm/leads/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/crm/leads/${id}`, { method: 'DELETE' });
    setDeletingId(null); load();
  };

  const openSendModal = async () => {
    if (!selected.size) return;
    setSendResult(null); setSendTemplateId('');
    const tmpl = await apiFetch('/api/crm/templates').catch(() => []);
    setTemplates(Array.isArray(tmpl) ? tmpl : []);
    setSendModal(true);
  };

  const handleSend = async () => {
    if (!sendTemplateId) return;
    setSending(true); setSendResult(null);
    try {
      const res = await apiFetch('/api/crm/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: Array.from(selected), template_id: Number(sendTemplateId) }),
      });
      setSendResult(`Sent: ${res.sent}, Failed: ${res.failed}`);
      setSelected(new Set());
      load();
    } catch (err: any) { setSendResult(`Error: ${err.message}`); }
    finally { setSending(false); }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Leads</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {selected.size > 0 && (
            <button className="admin-btn-primary" onClick={openSendModal}>
              Send Email ({selected.size})
            </button>
          )}
          <button className="admin-btn-primary" onClick={() => { setShowAddForm(true); setAddForm(emptyLeadForm()); }}>
            + Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-list-toolbar crm-toolbar">
        <input
          className="admin-search"
          placeholder="Search name or email… (Enter)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
        <select className="crm-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="crm-filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="all">All sources</option>
          {CRM_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="admin-btn-secondary" onClick={load} style={{ whiteSpace: 'nowrap' }}>Refresh</button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="admin-inline-editor">
          {addError && <div className="admin-error">{addError}</div>}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Name *</label>
              <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="admin-form-group">
              <label>Email *</label>
              <input value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Phone</label>
              <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <div className="admin-form-group">
              <label>LinkedIn URL</label>
              <input value={addForm.linkedin_url} onChange={e => setAddForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/…" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group narrow">
              <label>Source</label>
              <select value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}>
                {CRM_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-form-group narrow">
              <label>Status</label>
              <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}>
                {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Notes</label>
              <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Context notes…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="admin-btn-primary" onClick={handleAddSave} disabled={addSaving}>{addSaving ? 'Saving…' : 'Add Lead'}</button>
            <button className="admin-btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Leads table */}
      {loading ? (
        <div className="admin-empty">Loading leads…</div>
      ) : leads.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">👥</span>
          <p>No leads yet. Inquiries and newsletter signups auto-appear here.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={toggleAll} checked={selected.size === leads.length && leads.length > 0} /></th>
              <th>Name</th>
              <th>Email</th>
              <th>Source</th>
              <th>Status</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className={`${selected.has(lead.id) ? 'crm-row-selected' : ''}${lead.unsubscribed ? ' crm-row-unsub' : ''}`}>
                <td><input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} /></td>
                <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {lead.name}
                  {lead.unsubscribed && <span className="crm-unsub-badge" title={`Unsubscribed ${lead.unsubscribed_at ? new Date(lead.unsubscribed_at).toLocaleDateString() : ''}`}>unsub</span>}
                </td>
                <td style={{ color: '#666', fontSize: '0.85rem' }}>{lead.email}</td>
                <td><span className={`crm-source-badge crm-source-${lead.source}`}>{lead.source}</span></td>
                <td>
                  <select
                    className={`crm-status-select ${STATUS_COLORS[lead.status]}`}
                    value={lead.status}
                    onChange={e => handleStatusChange(lead.id, e.target.value)}
                  >
                    {CRM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#888' }}>
                  {formatDateShort(lead.created_at)}
                </td>
                <td>
                  <div className="admin-actions">
                    {deletingId === lead.id ? (
                      <>
                        <span style={{ fontSize: '0.8rem', color: '#c00', fontWeight: 600 }}>Delete?</span>
                        <button className="admin-btn-sm danger" onClick={() => handleDelete(lead.id)}>Yes</button>
                        <button className="admin-btn-sm" onClick={() => setDeletingId(null)}>No</button>
                      </>
                    ) : (
                      <>
                        {lead.linkedin_url && (
                          <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="admin-btn-sm">Li</a>
                        )}
                        <button className="admin-btn-sm danger" onClick={() => setDeletingId(lead.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Send email modal */}
      {sendModal && (
        <div className="crm-modal-overlay" onClick={() => !sending && setSendModal(false)}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <h3>Send Email to {selected.size} lead{selected.size !== 1 ? 's' : ''}</h3>
            <div className="admin-form-group" style={{ marginTop: '1rem' }}>
              <label>Choose Template</label>
              <select value={sendTemplateId} onChange={e => setSendTemplateId(e.target.value)}>
                <option value="">— Select template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>)}
              </select>
            </div>
            {sendResult && (
              <div className={`admin-${sendResult.startsWith('Error') ? 'error' : 'success-banner'}`} style={{ marginTop: '0.75rem' }}>
                {sendResult}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button className="admin-btn-primary" onClick={handleSend} disabled={sending || !sendTemplateId}>
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button className="admin-btn-secondary" onClick={() => setSendModal(false)} disabled={sending}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Templates Panel ────────────────────────────────────────────────────────

const TEMPLATE_VARS = ['{{name}}', '{{first_name}}', '{{email}}', '{{phone}}', '{{booking_link}}', '{{courses_link}}', '{{course_name}}', '{{unsubscribe_link}}'];

function TemplatesPanel() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState(emptyTemplateForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const load = () => {
    setLoading(true);
    apiFetch('/api/crm/templates').then(d => setTemplates(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startNew = () => { setEditing(null); setForm(emptyTemplateForm()); setPreview(null); setError(''); setShowEditor(true); };
  const startEdit = (t) => { setEditing(t); setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category }); setPreview(null); setError(''); setShowEditor(true); };
  const cancelEdit = () => { setEditing(null); setForm(emptyTemplateForm()); setPreview(null); setShowEditor(false); };

  const insertVar = (v: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end   = el.selectionEnd ?? start;
    const newVal = el.value.slice(0, start) + v + el.value.slice(end);
    setForm(f => ({ ...f, body: newVal }));
    setTimeout(() => { el.focus(); el.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError('Name, subject and body are required'); return;
    }
    setSaving(true); setError('');
    try {
      if (editing?.id) {
        await apiFetch(`/api/crm/templates/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/crm/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      }
      cancelEdit(); load();
    } catch (err: any) { setError(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/crm/templates/${id}`, { method: 'DELETE' });
    setDeletingId(null); load();
  };

  const loadPreview = async (id: number) => {
    setLoadingPreview(true); setPreview(null);
    try {
      const p = await apiFetch(`/api/crm/templates/${id}/preview`);
      setPreview(p);
    } catch {}
    finally { setLoadingPreview(false); }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Email Templates</h2>
        {!showEditor && <button className="admin-btn-primary" onClick={startNew}>+ New Template</button>}
      </div>

      {/* Editor */}
      {showEditor && (
        <div className="crm-template-editor">
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Template Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Welcome – New Lead" />
            </div>
            <div className="admin-form-group narrow">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CRM_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-group">
            <label>Subject Line *</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Hi {{first_name}}, welcome to Swadhyay!" />
          </div>
          <div className="admin-form-group">
            <label>Body (HTML)</label>
            <div className="crm-var-palette">
              {TEMPLATE_VARS.map(v => (
                <button key={v} className="crm-var-chip" onClick={() => insertVar(v)} type="button">{v}</button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              rows={16}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder={'<p>Hi {{first_name}},</p>\n<p>Welcome to Swadhyay!</p>'}
              className="crm-body-editor"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing?.id ? 'Save Changes' : 'Create Template'}</button>
            {editing?.id && (
              <button className="admin-btn-secondary" onClick={() => loadPreview(editing.id)} disabled={loadingPreview}>
                {loadingPreview ? 'Loading…' : 'Preview'}
              </button>
            )}
            <button className="admin-btn-secondary" onClick={cancelEdit}>Cancel</button>
          </div>

          {preview && (
            <div className="crm-preview-panel">
              <div className="crm-preview-subject"><strong>Subject:</strong> {preview.subject}</div>
              <iframe
                className="crm-preview-frame"
                srcDoc={preview.body}
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          )}
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && !showEditor ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">✉️</span>
          <p>No templates yet. The default 4 templates are seeded on first server start.</p>
        </div>
      ) : (
        !showEditor && (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Category</th><th>Subject</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td><span className={`crm-cat-badge crm-cat-${t.category}`}>{t.category}</span></td>
                  <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#666' }}>{t.subject}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#888' }}>{formatDateShort(t.updated_at)}</td>
                  <td>
                    <div className="admin-actions">
                      {deletingId === t.id ? (
                        <>
                          <span style={{ fontSize: '0.8rem', color: '#c00', fontWeight: 600 }}>Delete?</span>
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
        )
      )}
    </div>
  );
}

// ── History Panel ──────────────────────────────────────────────────────────

function HistoryPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/crm/logs').then(d => setLogs(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-empty">Loading email history…</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Email History</h2>
        <span style={{ fontSize: '0.85rem', color: '#888' }}>{logs.length} records (last 300)</span>
      </div>

      {logs.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">📋</span>
          <p>No emails sent yet.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>To</th>
              <th>Template</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Opens</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 500 }}>{log.to_name || log.to_email}</div>
                  {log.to_name && <div style={{ color: '#888', fontSize: '0.78rem' }}>{log.to_email}</div>}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {log.template_name ? (
                    <><span className={`crm-cat-badge crm-cat-${log.category}`}>{log.category}</span> {log.template_name}</>
                  ) : '—'}
                </td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#555' }}>
                  {log.subject}
                </td>
                <td>
                  <span className={`crm-log-status crm-log-${log.status}`}>{log.status}</span>
                  {log.error_msg && <div className="crm-log-error">{log.error_msg}</div>}
                </td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', textAlign: 'center' }}>
                  {log.open_count > 0 ? (
                    <span className="crm-open-badge" title={`First opened ${log.opened_at ? new Date(log.opened_at).toLocaleString() : ''}`}>
                      👁 {log.open_count}
                    </span>
                  ) : <span style={{ color: '#bbb' }}>—</span>}
                </td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#888' }}>
                  {formatDate(log.sent_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Automations Panel ──────────────────────────────────────────────────────

const AUTO_SOURCES = ['any', 'inquiry', 'newsletter', 'manual', 'booking'] as const;

function emptyAutoForm() {
  return { name: '', trigger_source: '', delay_hours: 0, template_id: '', is_active: true };
}

function AutomationsPanel() {
  const [autos, setAutos] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyAutoForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/crm/automations'),
      apiFetch('/api/crm/templates'),
    ]).then(([a, t]) => {
      setAutos(Array.isArray(a) ? a : []);
      setTemplates(Array.isArray(t) ? t : []);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startNew = () => { setEditing(null); setForm(emptyAutoForm()); setError(''); setShowForm(true); };
  const startEdit = (a) => {
    setEditing(a);
    setForm({ name: a.name, trigger_source: a.trigger_source || '', delay_hours: a.delay_hours, template_id: String(a.template_id || ''), is_active: a.is_active });
    setError(''); setShowForm(true);
  };
  const cancel = () => { setEditing(null); setForm(emptyAutoForm()); setShowForm(false); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.template_id) { setError('Name and template are required'); return; }
    setSaving(true); setError('');
    const payload = { ...form, trigger_source: form.trigger_source || null, template_id: Number(form.template_id), delay_hours: Number(form.delay_hours) };
    try {
      if (editing?.id) {
        await apiFetch(`/api/crm/automations/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/crm/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      cancel(); load();
    } catch (err: any) { setError(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/crm/automations/${id}`, { method: 'DELETE' });
    setDeletingId(null); load();
  };

  const toggleActive = async (auto: any) => {
    await apiFetch(`/api/crm/automations/${auto.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...auto, is_active: !auto.is_active }),
    });
    load();
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2>Email Automations</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#888' }}>
            Rules that auto-send emails when a new lead enters the system.
          </p>
        </div>
        {!showForm && <button className="admin-btn-primary" onClick={startNew}>+ New Rule</button>}
      </div>

      {showForm && (
        <div className="admin-inline-editor">
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Rule Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Welcome inquiry leads" />
            </div>
            <div className="admin-form-group narrow">
              <label>Trigger Source</label>
              <select value={form.trigger_source} onChange={e => setForm(f => ({ ...f, trigger_source: e.target.value }))}>
                <option value="">Any source</option>
                {AUTO_SOURCES.filter(s => s !== 'any').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group narrow">
              <label>Delay (hours after lead created)</label>
              <input type="number" min={0} value={form.delay_hours} onChange={e => setForm(f => ({ ...f, delay_hours: Number(e.target.value) }))} />
            </div>
            <div className="admin-form-group">
              <label>Email Template *</label>
              <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}>
                <option value="">— Select template —</option>
                {templates.map(t => <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>)}
              </select>
            </div>
            <div className="admin-form-group narrow" style={{ justifyContent: 'flex-end' }}>
              <label>Active</label>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 18, height: 18, marginTop: 6 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing?.id ? 'Save Changes' : 'Create Rule'}</button>
            <button className="admin-btn-secondary" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="admin-empty">Loading…</div> : autos.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">⚡</span>
          <p>No automation rules yet. Create one to auto-email new leads.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Trigger</th>
              <th>Delay</th>
              <th>Template</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {autos.map(auto => (
              <tr key={auto.id} style={{ opacity: auto.is_active ? 1 : 0.55 }}>
                <td style={{ fontWeight: 500 }}>{auto.name}</td>
                <td><span className={`crm-source-badge crm-source-${auto.trigger_source || 'manual'}`}>{auto.trigger_source || 'any'}</span></td>
                <td style={{ fontSize: '0.82rem', color: '#666' }}>
                  {auto.delay_hours === 0 ? 'Immediately' : `After ${auto.delay_hours}h`}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {auto.template_name ? (
                    <><span className={`crm-cat-badge crm-cat-${auto.template_category}`}>{auto.template_category}</span> {auto.template_name}</>
                  ) : <span style={{ color: '#c00' }}>Template deleted</span>}
                </td>
                <td>
                  <button
                    className={`crm-toggle-btn${auto.is_active ? ' on' : ''}`}
                    onClick={() => toggleActive(auto)}
                    title={auto.is_active ? 'Click to pause' : 'Click to activate'}
                  >
                    {auto.is_active ? 'On' : 'Off'}
                  </button>
                </td>
                <td>
                  <div className="admin-actions">
                    {deletingId === auto.id ? (
                      <>
                        <span style={{ fontSize: '0.8rem', color: '#c00', fontWeight: 600 }}>Delete?</span>
                        <button className="admin-btn-sm danger" onClick={() => handleDelete(auto.id)}>Yes</button>
                        <button className="admin-btn-sm" onClick={() => setDeletingId(null)}>No</button>
                      </>
                    ) : (
                      <>
                        <button className="admin-btn-sm" onClick={() => startEdit(auto)}>Edit</button>
                        <button className="admin-btn-sm danger" onClick={() => setDeletingId(auto.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="crm-auto-note">
        <strong>How it works:</strong> When a new lead enters the CRM (via inquiry, newsletter signup, booking, or manual add), matching active rules schedule an email to send after the configured delay. Unsubscribed leads are automatically skipped.
      </div>
    </div>
  );
}

// ── CRM Stats bar ──────────────────────────────────────────────────────────

function CRMStatsBar() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    apiFetch('/api/crm/stats').then(d => setStats(d)).catch(() => {});
  }, []);

  if (!stats) return null;
  const l = stats.leads || {};
  const e = stats.emails || {};

  return (
    <div className="crm-stats-bar">
      {[
        { label: 'Total', val: l.total_count, cls: '' },
        { label: 'New', val: l.new_count, cls: 'crm-status-new' },
        { label: 'Contacted', val: l.contacted_count, cls: 'crm-status-contacted' },
        { label: 'Qualified', val: l.qualified_count, cls: 'crm-status-qualified' },
        { label: 'Converted', val: l.converted_count, cls: 'crm-status-converted' },
        { label: 'Lost', val: l.lost_count, cls: 'crm-status-lost' },
        { label: 'Unsubscribed', val: l.unsubscribed_count, cls: '' },
        { label: 'Emails Sent', val: e.emails_sent, cls: '' },
        { label: 'Failed', val: e.emails_failed, cls: '' },
      ].map(({ label, val, cls }) => (
        <div key={label} className={`crm-stat-chip ${cls}`}>
          <span className="crm-stat-val">{val ?? 0}</span>
          <span className="crm-stat-lbl">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── CRM Tab (wrapper) ──────────────────────────────────────────────────────

function CRMTab() {
  const [subTab, setSubTab] = useState<'leads' | 'templates' | 'automations' | 'history'>('leads');

  const tabs: Array<{ key: typeof subTab; label: string }> = [
    { key: 'leads',       label: 'Leads' },
    { key: 'templates',   label: 'Templates' },
    { key: 'automations', label: 'Automations' },
    { key: 'history',     label: 'History' },
  ];

  return (
    <div>
      <CRMStatsBar />
      <div className="crm-subnav">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`crm-subnav-btn${subTab === key ? ' active' : ''}`}
            onClick={() => setSubTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {subTab === 'leads'       && <LeadsPanel />}
      {subTab === 'templates'   && <TemplatesPanel />}
      {subTab === 'automations' && <AutomationsPanel />}
      {subTab === 'history'     && <HistoryPanel />}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { user, loading } = useUser();
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
    if (loading) return;
    if (!user || user.role !== "admin") navigate("/");
  }, [user, loading]);

  const loadCourses = () =>
    apiFetch("/api/courses/admin/all").then(d => setCourses(Array.isArray(d) ? d : []));

  const loadArticles = () =>
    apiFetch("/api/articles/admin/all").then(d => setArticles(Array.isArray(d) ? d : []));

  useEffect(() => {
    if (user?.role === "admin") {
      loadCourses();
      loadArticles();
    }
  }, [user?.role]);

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
      crm: "CRM",
    }[section] || section;
  };

  if (loading) return null;
  if (!user || user.role !== "admin") return null;

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
    { id: "crm", label: "CRM", icon: ICONS.crm },
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
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="admin-user-avatar" style={{ borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            ) : (
              <div className="admin-user-avatar">{(user?.name ?? "A")[0].toUpperCase()}</div>
            )}
            <span className="admin-user-name">{user?.name ?? ""}</span>
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
          {section === "crm" && <CRMTab />}
        </main>
      </div>
    </div>
  );
}
