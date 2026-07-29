import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useRazorpay } from "../hooks/useRazorpay";
import "../styles/CourseDetail.css";

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

function CourseSkeleton() {
  return (
    <>
      <Navbar />
      <div className="cd-hero cd-hero-skeleton sw-page-pad" style={{ minHeight: "60vh" }}>
        <div className="cd-hero-grid">
          <div>
            <div className="cd-sk-line w40" style={{ marginBottom: 16 }} />
            <div className="cd-sk-line w80" style={{ height: 40, marginBottom: 16 }} />
            <div className="cd-sk-line w95" />
            <div className="cd-sk-line w75" style={{ marginTop: 8 }} />
            <div className="cd-sk-line w50" style={{ marginTop: 16 }} />
          </div>
        </div>
      </div>
    </>
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

  useEffect(() => {
    const t0 = document.timeline?.currentTime ?? 0;
    let tries = 0;
    const arm = () => {
      const t1 = document.timeline?.currentTime ?? 0;
      if (t1 > t0) { document.body.classList.add("rv-go"); return; }
      if (++tries < 8) requestAnimationFrame(arm);
    };
    requestAnimationFrame(arm);
    return () => { document.body.classList.remove("rv-go"); };
  }, []);

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
    if (course?.price === 0) return "Enroll for free →";
    return `Enroll — ₹${(course.price / 100).toLocaleString("en-IN")} →`;
  };

  const totalLessons = course?.modules?.reduce(
    (acc: number, m: any) => acc + (m.lessons?.length || 0), 0
  ) ?? 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  if (loading) return <CourseSkeleton />;
  if (!course) return null;

  const isFree = course.price === 0;
  const priceDisplay = isFree ? "Free" : `₹${(course.price / 100).toLocaleString("en-IN")}`;

  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="cd-hero sw-page-pad">
        <div className="cd-hero-orb" />
        <div className="cd-hero-grid">
          <div className="rv">
            <Link to="/courses" className="cd-back-link">
              ← {course.series?.title || "Courses"}
            </Link>
            <div className="cd-hero-badges">
              <span className="cd-badge-primary">
                {isFree ? "START HERE · FREE" : (course.level?.toUpperCase() ?? "COURSE")}
              </span>
              <span className="cd-badge-ghost">SELF-PACED</span>
            </div>
            <h1 className="cd-hero-h1">{course.title}</h1>
            <p className="cd-hero-desc">
              {course.short_description || course.description}
            </p>
            <div className="cd-hero-stats">
              {totalLessons > 0 && (
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-icon">▷</span>
                  {totalLessons} lessons
                </div>
              )}
              {course.total_duration > 0 && (
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-icon">◷</span>
                  {fmtDuration(course.total_duration)}
                </div>
              )}
              {avgRating !== null && (
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-icon">★</span>
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </div>
              )}
            </div>
          </div>

          <div className="rv cd-hero-rings-wrap">
            <div className="cd-hero-ring-glow" />
            <div className="cd-hero-ring cd-ring-1" />
            <div className="cd-hero-ring cd-ring-2" />
            <div className="cd-hero-play">▶</div>
            <div className="cd-chip cd-chip-1" style={{ animation: "floaty 7s ease-in-out infinite" }}>
              <span className="cd-chip-dot" />
              {course.modules?.length || 0} modules
            </div>
            <div className="cd-chip cd-chip-2" style={{ animation: "floaty 6.5s ease-in-out infinite .8s" }}>
              <span className="cd-chip-dot" />
              {priceDisplay}
            </div>
          </div>
        </div>
      </section>

      {/* ── Preview video ──────────────────────────────────────────────── */}
      {previewLesson && (
        <div className="cd-preview-wrap sw-page-pad">
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

      {/* ── BODY SPLIT ─────────────────────────────────────────────────── */}
      <section className="cd-body-split sw-page-pad">
        <div className="cd-split-grid">

          {/* LEFT */}
          <div className="rv cd-left-col">

            {/* Outcomes */}
            {Array.isArray(course.what_youll_learn) && course.what_youll_learn.length > 0 && (
              <div className="cd-outcomes">
                <h2 className="cd-section-h2">What you'll discover</h2>
                {course.description && (
                  <p className="cd-section-p">{course.description}</p>
                )}
                <div className="cd-outcomes-grid">
                  {course.what_youll_learn.map((o: string, i: number) => (
                    <div key={i} className="cd-outcome-card">
                      <span className="cd-outcome-check">✓</span>
                      <span className="cd-outcome-text">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {Array.isArray(course.requirements) && course.requirements.length > 0 && (
              <div className="cd-requirements-new">
                <h2 className="cd-section-h2">Requirements</h2>
                <ul className="cd-req-list">
                  {course.requirements.map((item: string, i: number) => (
                    <li key={i}>
                      <span className="cd-req-dot">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Curriculum */}
            {course.modules?.length > 0 && (
              <div className="cd-curriculum-new">
                <h2 className="cd-section-h2">Course curriculum</h2>
                <p className="cd-curriculum-meta-row">
                  {course.modules.length} module{course.modules.length !== 1 ? "s" : ""} · {totalLessons} lessons
                  {course.total_duration > 0 && ` · ${fmtDuration(course.total_duration)}`}
                </p>
                <div className="cd-modules-list">
                  {course.modules.map((mod: any, i: number) => {
                    const isOpen = openModule === mod.id;
                    const num = String(i + 1).padStart(2, "0");
                    return (
                      <div key={mod.id} className="cd-mod">
                        <button
                          className="cd-mod-header"
                          onClick={() => setOpenModule(isOpen ? null : mod.id)}
                        >
                          <span className="cd-mod-num">{num}</span>
                          <div style={{ flex: 1 }}>
                            <div className="cd-mod-title">{mod.title}</div>
                            <div className="cd-mod-meta-text">
                              {mod.lessons?.length ?? 0} lesson{mod.lessons?.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <span
                            className="cd-mod-arrow"
                            style={{
                              color: isOpen ? "#0E766B" : "#9AB0A6",
                              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          >›</span>
                        </button>
                        <div
                          className="cd-mod-lessons"
                          style={{
                            maxHeight: isOpen ? `${(mod.lessons?.length || 0) * 60 + 20}px` : "0",
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — sticky enroll card */}
          <div className="rv cd-right-col">
            <div className="cd-enroll-card">
              <div className="cd-enroll-thumb">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} />
                ) : (
                  <>
                    <span className="cd-enroll-thumb-label">{course.title}</span>
                    <div className="cd-enroll-thumb-play">▶</div>
                  </>
                )}
              </div>
              <div className="cd-enroll-body">
                <div className="cd-enroll-price-row">
                  {isFree ? (
                    <>
                      <span className="cd-enroll-price">Free</span>
                      <span className="cd-enroll-was">₹1,499</span>
                    </>
                  ) : (
                    <span className="cd-enroll-price">{priceDisplay}</span>
                  )}
                </div>
                <p className="cd-enroll-tagline">
                  {isFree ? "The perfect place to begin your inner work." : "Lifetime access · Certificate on completion"}
                </p>
                <button
                  className="cd-enroll-primary"
                  onClick={handleEnrollClick}
                  disabled={enrolling}
                >
                  {enrollLabel()}
                </button>
                <Link to="/booking" className="cd-enroll-secondary">
                  Book 1-on-1 instead
                </Link>
                {paymentError && <p className="cd-payment-error">{paymentError}</p>}
                <div className="cd-enroll-divider" />
                <div className="cd-enroll-includes">
                  {totalLessons > 0 && (
                    <div className="cd-enroll-include">
                      <span className="cd-enroll-include-icon">▷</span>
                      {totalLessons} on-demand lessons
                    </div>
                  )}
                  <div className="cd-enroll-include">
                    <span className="cd-enroll-include-icon">❏</span>
                    Guided reflection workbook (PDF)
                  </div>
                  <div className="cd-enroll-include">
                    <span className="cd-enroll-include-icon">∞</span>
                    Lifetime access, learn at your pace
                  </div>
                  <div className="cd-enroll-include">
                    <span className="cd-enroll-include-icon">✎</span>
                    Prompts & exercises for each module
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS / REVIEWS ─────────────────────────────────────── */}
      <section className="cd-testimonials sw-page-pad">
        <div className="rv cd-testimonials-inner">
          <span className="mono-label">From learners</span>
          <h2 className="cd-testimonials-h2">Quietly, something shifts</h2>

          {enrolled && user && (
            <div className="cd-review-form">
              <h3>Leave a review</h3>
              <div className="cd-star-picker">
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
                className="cd-review-submit"
                onClick={submitReview}
                disabled={!reviewRating || reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting…" : "Submit Review"}
              </button>
              {reviewError && <p className="cd-review-error">{reviewError}</p>}
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="cd-reviews-empty">No reviews yet. Be the first!</p>
          ) : (
            <div className="cd-reviews-grid">
              {reviews.map((r: any) => (
                <div key={r.id} className="cd-review-card">
                  <div className="cd-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  {r.body && <p className="cd-review-quote">"{r.body}"</p>}
                  <div className="cd-review-author">
                    {r.picture
                      ? <img src={r.picture} alt={r.name} className="cd-review-avatar-img" referrerPolicy="no-referrer" />
                      : <div className="cd-review-avatar-placeholder">{(r.name || "?")[0]}</div>
                    }
                    <div>
                      <div className="cd-review-name">{r.name}</div>
                      <div className="cd-review-date">{new Date(r.created_at).toLocaleDateString("en-IN")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── INSTRUCTOR BAND ────────────────────────────────────────────── */}
      {instructor && (
        <section className="cd-instructor-band sw-page-pad">
          <div className="cd-instructor-band-orb" />
          <div className="rv cd-instructor-band-grid">
            <div className="cd-instructor-portrait">
              {instructor.avatar_url && (
                <img src={instructor.avatar_url} alt={instructor.name} />
              )}
              <span className="cd-instructor-portrait-label">portrait — {instructor.name}</span>
            </div>
            <div>
              <span className="mono-label mono-label--light">Your guide</span>
              <h2 className="cd-instructor-band-name">{instructor.name}</h2>
              <p className="cd-instructor-band-bio">
                {instructor.bio || instructor.title}
              </p>
              <Link to="/whoami" className="cd-instructor-band-link">
                More about {instructor.name} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── STICKY BAR ─────────────────────────────────────────────────── */}
      <div className="cd-sticky-bar">
        <span className="cd-sticky-title">{course.title}</span>
        <div className="cd-sticky-right">
          <span className="cd-sticky-price">{priceDisplay}</span>
          <button className="cd-sticky-cta" onClick={handleEnrollClick} disabled={enrolling}>
            {enrolled
              ? "Continue Learning →"
              : isFree
                ? "Enroll free →"
                : `₹${(course.price / 100).toLocaleString("en-IN")} — Enroll →`}
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}
