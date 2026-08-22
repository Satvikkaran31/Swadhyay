import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

marked.setOptions({ breaks: true });

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function readingTime(content: string): number {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fall back to a prompt
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div className="art-share">
      <span className="art-share-label">Share:</span>
      <a
        className="art-share-btn"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <a
        className="art-share-btn"
        href={`https://wa.me/?text=${encodeURIComponent(title + ' – ' + url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <button className="art-share-btn" onClick={copy}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/articles/${slug}`)
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          setArticle({
            title: data.title,
            author: data.author || 'Neha',
            date: formatDate(data.published_at),
            imageUrl: data.thumbnail_url || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            slug: data.slug,
            tags: Array.isArray(data.tags) ? data.tags : [],
          });
        } else if (res.status === 404) {
          const staticArticle = articlesData.find(a => a.slug === slug);
          if (staticArticle) setArticle(staticArticle);
          else setNotFound(true);
        } else {
          const staticArticle = articlesData.find(a => a.slug === slug);
          if (staticArticle) setArticle(staticArticle);
          else setNotFound(true);
        }
      })
      .catch(() => {
        const staticArticle = articlesData.find(a => a.slug === slug);
        if (staticArticle) setArticle(staticArticle);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/articles/${slug}/related`)
      .then(r => r.json())
      .then(d => setRelated(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    const trigger = () => document.body.classList.add('rv-go');
    if ((document.timeline as any)?.currentTime) {
      trigger();
    } else {
      window.addEventListener('load', trigger, { once: true });
    }
    return () => window.removeEventListener('load', trigger);
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="art-empty" style={{ paddingTop: 200, paddingBottom: 120 }}>
          Loading…
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !article) {
    return (
      <>
        <Navbar />
        <div className="art-empty" style={{ paddingTop: 200, paddingBottom: 120 }}>
          <p style={{ marginBottom: 24 }}>Article not found.</p>
          <button
            onClick={() => navigate('/articles')}
            style={{
              background: '#12362B',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '13px 28px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ← Back to Articles
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const hasEmbedLink = article.link && !article.content;
  const mins = article.content ? readingTime(article.content) : null;

  return (
    <>
      <Navbar />

      <section className="art-detail-hero sw-page-pad">
        <div className="art-detail-hero-inner rv">
          <Link to="/articles" className="art-detail-back">← Back to articles</Link>

          {article.tags?.length > 0 && (
            <div className="art-detail-tags">
              {article.tags.map((t: string) => (
                <span key={t} className="art-card-tag">{t}</span>
              ))}
            </div>
          )}

          <h1 className="art-detail-title">{article.title}</h1>

          <div className="art-detail-meta">
            <span>By {article.author}</span>
            {article.date && <span>{article.date}</span>}
            {mins && <span>{mins} min read</span>}
          </div>
        </div>
      </section>

      <section className="art-detail-body sw-page-pad">
        <div className="art-detail-body-inner rv">
          {hasEmbedLink ? (
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: '70vh' }}>
              <iframe
                src={article.link}
                style={{
                  width: '100%',
                  maxWidth: 550,
                  height: '70vh',
                  border: '1px solid rgba(18,54,43,.12)',
                  borderRadius: 16,
                }}
                title={article.title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <>
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="art-detail-image"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.style.display = 'none';
                  }}
                />
              )}
              <div
                className="art-detail-prose"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    marked.parse(article.content || '') as string,
                  ),
                }}
              />
            </>
          )}

          <ShareButtons title={article.title} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="art-related sw-page-pad">
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <h2 className="art-related-h2">More to read</h2>
            <div className="art-related-grid">
              {related.map((a: any) => (
                <Link
                  key={a.slug}
                  to={`/article/${a.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="art-card">
                    {a.thumbnail_url ? (
                      <img
                        src={a.thumbnail_url}
                        alt={a.title}
                        className="art-card-img"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="art-card-img-placeholder" />
                    )}
                    <div className="art-card-body">
                      <h3 className="art-card-title">{a.title}</h3>
                      {a.excerpt && (
                        <p className="art-card-excerpt">{a.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer compact />
    </>
  );
}
