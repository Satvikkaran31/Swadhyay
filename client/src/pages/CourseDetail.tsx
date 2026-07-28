import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useRazorpay } from "../hooks/useRazorpay";
import "../styles/CourseDetail.css";
import "../styles/Reviews.css";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate",
  advanced: "Advanced", "all-levels": "All Levels",
};

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function toEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function Stars({ rating, size = "0.9rem" }: { rating: number; size?: string }) {
  const full = Math.round(rating);
  return (
    <span className="cd-stars" style={{ fontSize: size }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

function CourseSkeleton() {
  return (
    <div className="main">
      <Navbar />
      <div className="cd-hero cd-hero-skeleton">
        <div className="cd-hero-inner">
          <div className="cd-hero-left">
            <div className="cd-sk-line w40" style={{ marginBottom: "1rem" }} />
            <div className="cd-sk-line w80" style={{ height: "2.5rem", marginBottom: "1rem" }} />
            <div className="cd-sk-line w95" />
            <div className="cd-sk-line w75" style={{ marginTop: "0.4rem" }} />
            <div className="cd-sk-line w50" style={{ marginTop: "1rem" }} />
          </div>
          <div className="cd-cta-card cd-cta-card-skeleton">
            <div className="cd-sk-block" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const login = useTriggerGoogleLogin(setUser);
  const { initiatePayment } = useRazorpay();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [instructor, setInstructor] = useState<any>(null);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState(0);

  const loadReviews = () => {
    if (!slug) return;
    fetch(`${API}/api/courses/${slug}/reviews`)
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => { if (course) loadReviews(); }, [course?.id]);

  // Fetch instructor profile
  useEffect(() => {
    fetch(`${API}/api/instructor`)
      .then(r => r.json())
      .then(d => { if (d?.name) setInstructor(d); })
      .catch(() => {});
  }, []);

  const submitReview = async () => {
    if (!reviewRating) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch(`${API}/api/courses/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: reviewRating, body: reviewText }),
      });
      if (res.ok) {
        setReviewRating(0);
        setReviewText("");
        loadReviews();
      } else {
        const err = await res.json().catch(() => ({}));
        setReviewError(err.error || "Could not submit review. Please try again.");
      }
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/api/courses/${slug}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate("/courses"); return; }
        setCourse(data);
        setLoading(false);
        if (data.modules?.length > 0) setOpenModule(data.modules[0].id);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user || !course) return;
    setEnrolled(false);
    fetch(`${API}/api/enrollments/check/${course.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setEnrolled(Boolean(d.enrolled)))
      .catch(() => {});
  }, [user?.id, course?.id]);

  const enrollFree = async () => {
    setEnrolling(true);
    setPaymentError(null);
    try {
      const res = await fetch(`${API}/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ course_id: course.id }),
      });
      if (!res.ok) throw new Error("Enrollment failed");
      navigate(`/courses/${slug}/learn`);
    } catch {
      setPaymentError("Could not enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const enrollPaid = async () => {
    setEnrolling(true);
    setPaymentError(null);
    await initiatePayment({
      amount: course.price,
      description: course.title,
      user,
      metadata: { course_id: course.id },
      onSuccess: (result) => {
        if (result.enrolled) {
          navigate(`/courses/${slug}/learn`);
        } else if (result.error === "enrollment_failed") {
          setPaymentError(result.message);
        }
        setEnrolling(false);
      },
      onFailure: (message) => {
        if (message) setPaymentError(message);
        setEnrolling(false);
      },
      onDismiss: () => { setEnrolling(false); },
    });
  };

  const handleEnrollClick = () => {
    setPaymentError(null);
    if (!user) { login(); return; }
    if (enrolled) { navigate(`/courses/${slug}/learn`); return; }
    if (course.price === 0) { enrollFree(); } else { enrollPaid(); }
  };

  const enrollLabel = () => {
    if (enrolling) return "Processing…";
    if (enrolled) return "Continue Learning →";
    if (course?.price === 0) return "Enroll for Free";
    return `Enroll — ₹${(course.price / 100).toLocaleString("en-IN")}`;
  };

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) ?? 0;
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  if (loading) return <CourseSkeleton />;
  if (!course) return null;

  const priceLabel = course.price === 0
    ? <span className="cd-price-free">Free</span>
    : <span>₹{(course.price / 100).toLocaleString("en-IN")}</span>;

  return (
    <div className="main">
      <Navbar />

      {/* ── Full-bleed dark hero ──────────────────────────────── */}
      <div className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-left">
            {/* Breadcrumb */}
            <nav className="cd-breadcrumb">
              <Link to="/courses">Courses</Link>
              {course.series && (
                <>
                  <span>›</span>
                  <Link to={`/series/${course.series.slug}`}>{course.series.title}</Link>
                </>
              )}
              <span>›</span>
              <span>{course.title}</span>
            </nav>

            {/* Badges */}
            <div className="cd-badges">
              {course.level && (
                <span className="cd-badge">{LEVEL_LABELS[course.level] ?? course.level}</span>
              )}
              {course.language && course.language !== "English" && (
                <span className="cd-badge lang">{course.language}</span>
              )}
            </div>

            <h1 className="cd-hero-title">{course.title}</h1>
            {(course.short_description || course.description) && (
              <p className="cd-hero-desc">{course.short_description || course.description}</p>
            )}

            {/* Rating row */}
            {avgRating !== null && (
              <div className="cd-hero-rating">
                <span className="cd-rating-num">{avgRating.toFixed(1)}</span>
                <Stars rating={avgRating} />
                <span className="cd-rating-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                {course.enrollment_count > 0 && (
                  <>
                    <span className="cd-dot">·</span>
                    <span>{course.enrollment_count.toLocaleString("en-IN")} student{course.enrollment_count !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="cd-hero-meta">
              {totalLessons > 0 && <span>{totalLessons} lessons</span>}
              {course.total_duration > 0 && (
                <>
                  <span className="cd-dot">·</span>
                  <span>{fmtDuration(course.total_duration)}</span>
                </>
              )}
              {course.modules?.length > 0 && (
                <>
                  <span className="cd-dot">·</span>
                  <span>{course.modules.length} module{course.modules.length !== 1 ? "s" : ""}</span>
                </>
              )}
            </div>

            {instructor && (
              <p className="cd-instructor-line">
                By <strong>{instructor.name}</strong>
                {instructor.title && <span className="cd-instructor-role"> · {instructor.title}</span>}
              </p>
            )}
          </div>

          {/* Floating CTA card */}
          <div className="cd-cta-card">
            <div className="cd-cta-thumb">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} />
              ) : (
                <div className="cd-cta-thumb-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="cd-cta-body">
              <div className="cd-cta-price">{priceLabel}</div>
              <button
                className="cd-enroll-btn"
                onClick={handleEnrollClick}
                disabled={enrolling}
              >
                {enrollLabel()}
              </button>
              {paymentError && <p className="cd-payment-error">{paymentError}</p>}
              <p className="cd-cta-note">Full lifetime access · Certificate on completion</p>
              <ul className="cd-cta-includes">
                {course.total_duration > 0 && (
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {fmtDuration(course.total_duration)} on-demand video
                  </li>
                )}
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Worksheets & exercises
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
                  Access on all devices
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Preview video ──────────────────────────────────────── */}
      {previewLesson && (
        <div className="cd-preview-wrap">
          <div className="cd-preview-bar">
            <span>Preview: {previewLesson.title}</span>
            <button onClick={() => setPreviewLesson(null)}>✕ Close</button>
          </div>
          <div className="cd-video-ratio">
            <iframe
              src={toEmbedUrl(previewLesson.video_url) ?? ""}
              title={previewLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="cd-body">

        {/* Stats bar */}
        {(avgRating !== null || course.enrollment_count > 0 || totalLessons > 0 || course.total_duration > 0) && (
          <div className="cd-stats-bar">
            {avgRating !== null && (
              <div className="cd-stat">
                <span className="cd-stat-val">{avgRating.toFixed(1)} <Stars rating={avgRating} size="0.85rem" /></span>
                <span className="cd-stat-lbl">Rating</span>
              </div>
            )}
            {course.enrollment_count > 0 && (
              <div className="cd-stat">
                <span className="cd-stat-val">{course.enrollment_count.toLocaleString("en-IN")}</span>
                <span className="cd-stat-lbl">Students</span>
              </div>
            )}
            {totalLessons > 0 && (
              <div className="cd-stat">
                <span className="cd-stat-val">{totalLessons}</span>
                <span className="cd-stat-lbl">Lessons</span>
              </div>
            )}
            {course.total_duration > 0 && (
              <div className="cd-stat">
                <span className="cd-stat-val">{fmtDuration(course.total_duration)}</span>
                <span className="cd-stat-lbl">Duration</span>
              </div>
            )}
          </div>
        )}

        {/* What You'll Learn */}
        {Array.isArray(course.what_youll_learn) && course.what_youll_learn.length > 0 && (
          <section className="cd-learn-box">
            <h2>What You'll Learn</h2>
            <ul className="cd-learn-grid">
              {course.what_youll_learn.map((item: string, i: number) => (
                <li key={i}><span className="cd-check">✓</span>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Requirements */}
        {Array.isArray(course.requirements) && course.requirements.length > 0 && (
          <section className="cd-requirements">
            <h2>Requirements</h2>
            <ul className="cd-req-list">
              {course.requirements.map((item: string, i: number) => (
                <li key={i}><span>·</span>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Instructor */}
        {instructor && (
          <section className="cd-instructor-section">
            <h2>Your Instructor</h2>
            <div className="cd-instructor-card">
              {instructor.avatar_url ? (
                <img src={instructor.avatar_url} alt={instructor.name} className="cd-instructor-avatar" />
              ) : (
                <div className="cd-instructor-avatar cd-instructor-avatar-initials">
                  {instructor.name[0]}
                </div>
              )}
              <div className="cd-instructor-info">
                <h3>{instructor.name}</h3>
                {instructor.title && <p className="cd-instructor-title">{instructor.title}</p>}
                {reviews.length > 0 && (
                  <div className="cd-instructor-stats">
                    <span>★ {avgRating?.toFixed(1)} instructor rating</span>
                    {course.enrollment_count > 0 && (
                      <>
                        <span>·</span>
                        <span>{course.enrollment_count.toLocaleString("en-IN")} student{course.enrollment_count !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                )}
                {instructor.bio && <p className="cd-instructor-bio">{instructor.bio}</p>}
              </div>
            </div>
          </section>
        )}

        {/* Curriculum */}
        <section className="cd-curriculum">
          <div className="cd-curriculum-header">
            <h2>Course Content</h2>
            <span className="cd-curriculum-meta">
              {course.modules?.length} module{course.modules?.length !== 1 ? "s" : ""} · {totalLessons} lessons
              {course.total_duration > 0 && ` · ${fmtDuration(course.total_duration)}`}
            </span>
          </div>
          {course.modules?.map((mod: any) => (
            <div key={mod.id} className="cd-module">
              <button
                className={`cd-module-header ${openModule === mod.id ? "open" : ""}`}
                onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
              >
                <svg
                  className={`cd-chevron ${openModule === mod.id ? "rotated" : ""}`}
                  width="14" height="14" viewBox="0 0 12 12" fill="none"
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="cd-module-title">{mod.title}</span>
                <span className="cd-module-count">{mod.lessons?.length ?? 0} lessons</span>
              </button>
              {openModule === mod.id && (
                <div className="cd-lessons">
                  {mod.lessons?.map((lesson: any) => (
                    <div key={lesson.id} className="cd-lesson">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span className="cd-lesson-title">{lesson.title}</span>
                      {lesson.is_preview && lesson.video_url && (
                        <button className="cd-preview-chip" onClick={() => setPreviewLesson(lesson)}>
                          Preview
                        </button>
                      )}
                      {lesson.duration && (
                        <span className="cd-lesson-dur">
                          {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Reviews */}
        <section className="cd-reviews">
          <div className="cd-reviews-header">
            <h2>Student Reviews</h2>
            {reviews.length > 0 && avgRating !== null && (
              <div className="cd-reviews-avg">
                <span className="cd-avg-num">{avgRating.toFixed(1)}</span>
                <Stars rating={avgRating} />
                <span className="cd-avg-count">({reviews.length})</span>
              </div>
            )}
          </div>

          {enrolled && user && (
            <div className="review-form">
              <h3>Leave a review</h3>
              <div className="star-picker">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className={n <= (hoverStar || reviewRating) ? "active" : ""}
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setReviewRating(n)}
                    type="button"
                  >★</button>
                ))}
              </div>
              <textarea
                placeholder="Share your experience (optional)"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                rows={3}
              />
              <button
                className="review-submit-btn"
                onClick={submitReview}
                disabled={!reviewRating || reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting…" : "Submit Review"}
              </button>
              {reviewError && <p style={{ color: "#c00", fontSize: "0.85rem", marginTop: "0.5rem" }}>{reviewError}</p>}
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="cd-reviews-empty">No reviews yet. Be the first!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((r: any) => (
                <div key={r.id} className="review-card">
                  {r.picture
                    ? <img src={r.picture} alt={r.name} className="review-avatar" referrerPolicy="no-referrer" />
                    : <div className="review-avatar-placeholder">{(r.name || "?")[0]}</div>
                  }
                  <div className="review-body">
                    <div className="review-meta">
                      <span className="review-name">{r.name}</span>
                      <span className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      <span className="review-date">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                    {r.body && <p className="review-text">{r.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── Sticky bottom bar ─────────────────────────────────── */}
      <div className="cd-sticky-bar">
        <span className="cd-sticky-title">{course.title}</span>
        <div className="cd-sticky-right">
          <span className="cd-sticky-price">{priceLabel}</span>
          <button className="cd-enroll-btn sm" onClick={handleEnrollClick} disabled={enrolling}>
            {enrollLabel()}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
