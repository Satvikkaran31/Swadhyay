import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/SeriesDetail.css';

function usePageSEO(title: string, description: string, path: string) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    const set = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); prop ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    set('description', description);
    set('og:title', title, true);
    set('og:description', description, true);
    set('og:url', `https://swadhyay.co${path}`, true);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', `https://swadhyay.co${path}`);
  }, [title, description, path]);
}

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', 'all-levels': 'All Levels',
};

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function SeriesSkeleton() {
  return (
    <div className="main">
      <Navbar />
      <div className="sd-hero">
        <div className="sd-hero-inner">
          <div className="sd-hero-left">
            <div className="sd-sk-line w30" style={{ marginBottom: '1rem' }} />
            <div className="sd-sk-line w70" style={{ height: '2.5rem', marginBottom: '1rem' }} />
            <div className="sd-sk-line w90" />
            <div className="sd-sk-line w60" style={{ marginTop: '0.5rem' }} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SeriesDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  usePageSEO(
    series ? `${series.title} — Swadhyay` : 'Course Series — Swadhyay',
    series?.description || 'Explore this curated series of courses designed for deep, structured learning.',
    `/series/${slug}`
  );

  useEffect(() => {
    fetch(`${API}/api/series/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(d => { setSeries(d); setLoading(false); })
      .catch(() => { navigate('/series'); });
  }, [slug]);

  if (loading) return <SeriesSkeleton />;
  if (!series) return null;

  const totalStudents = series.total_students ?? 0;
  const courseCount = series.courses?.length ?? 0;

  return (
    <div className="main">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="sd-hero">
        <div className="sd-hero-inner">

          {/* Left: copy */}
          <div className="sd-hero-left">
            <nav className="sd-breadcrumb">
              <Link to="/series">Series</Link>
              <span>›</span>
              <span>{series.title}</span>
            </nav>

            <span className="sd-eyebrow">Course Series</span>
            <h1 className="sd-hero-title">{series.title}</h1>

            {series.description && (
              <p className="sd-hero-desc">{series.description}</p>
            )}

            <div className="sd-hero-stats">
              <div className="sd-stat">
                <span className="sd-stat-num">{courseCount}</span>
                <span className="sd-stat-label">Course{courseCount !== 1 ? 's' : ''}</span>
              </div>
              {totalStudents > 0 && (
                <>
                  <div className="sd-stat-divider" />
                  <div className="sd-stat">
                    <span className="sd-stat-num">{totalStudents.toLocaleString('en-IN')}+</span>
                    <span className="sd-stat-label">Students</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: decorative rings */}
          <div className="sd-hero-right">
            <div className="sd-ring sd-ring-1" />
            <div className="sd-ring sd-ring-2" />
            <div className="sd-ring sd-ring-3" />
            <div className="sd-ring-center">
              <span className="sd-ring-num">{courseCount}</span>
              <span className="sd-ring-tag">COURSES</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <section className="sd-body">
        <div className="sd-body-inner">

          {/* Features */}
          {Array.isArray(series.features) && series.features.length > 0 && (
            <div className="sd-features">
              <h2 className="sd-section-title">What This Series Offers</h2>
              <div className="sd-features-grid">
                {series.features.map((f: any, i: number) => (
                  <div key={i} className="sd-feature-card">
                    {f.icon && <span className="sd-feature-icon">{f.icon}</span>}
                    <h3>{f.title}</h3>
                    {f.desc && <p>{f.desc}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {(!series.courses || series.courses.length === 0) ? (
            <div className="sd-no-courses">
              <p>Courses in this series are coming soon.</p>
              <Link to="/courses" className="sd-back-link">Browse all courses →</Link>
            </div>
          ) : (
            <>
              <h2 className="sd-section-title">Courses in This Series</h2>
              <div className="sd-courses-grid">
                {series.courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="sd-course-card"
                    onClick={() => navigate(`/courses/${course.slug}`)}
                  >
                    {/* Thumbnail */}
                    <div className="sd-thumb">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="sd-thumb-img"
                        />
                      ) : (
                        <div className="sd-thumb-placeholder">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                            <circle cx="12" cy="12" r="10"/>
                            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="sd-card-body">
                      <div className="sd-badge-row">
                        {course.level && course.level !== 'all-levels' && (
                          <span className="sd-badge">
                            {LEVEL_LABELS[course.level] ?? course.level}
                          </span>
                        )}
                        <span className="sd-badge sd-badge--price">
                          {course.price === 0
                            ? 'Free'
                            : `₹${(course.price / 100).toLocaleString('en-IN')}`}
                        </span>
                      </div>

                      <h3 className="sd-card-title">{course.title}</h3>

                      {(course.short_description || course.description) && (
                        <p className="sd-card-desc">
                          {course.short_description || course.description}
                        </p>
                      )}

                      <div className="sd-card-footer">
                        <Link
                          to={`/courses/${course.slug}`}
                          className="sd-view-link"
                          onClick={e => e.stopPropagation()}
                        >
                          View Course →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
