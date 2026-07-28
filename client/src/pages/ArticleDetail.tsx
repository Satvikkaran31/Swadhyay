import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

marked.setOptions({ breaks: true });

function readingTime(content: string): number {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="share-buttons">
      <span className="share-label">Share:</span>
      <a className="share-btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a className="share-btn" href={`https://wa.me/?text=${encodeURIComponent(title + ' – ' + url)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <button className="share-btn" onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>
    </div>
  );
}

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/articles/${slug}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          // Normalise API shape to match what the render expects
          setArticle({
            title: data.title,
            author: data.author || 'Neha',
            date: formatDate(data.published_at),
            imageUrl: data.thumbnail_url || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            slug: data.slug,
          });
        } else if (res.status === 404) {
          // Fall back to static data
          const staticArticle = articlesData.find(a => a.slug === slug);
          if (staticArticle) {
            setArticle(staticArticle);
          } else {
            setNotFound(true);
          }
        } else {
          // Server error — fall back to static
          const staticArticle = articlesData.find(a => a.slug === slug);
          if (staticArticle) setArticle(staticArticle);
          else setNotFound(true);
        }
      })
      .catch(() => {
        // Network error — fall back to static
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

  if (loading) {
    return (
      <div className="main">
        <Navbar />
        <div className="article-detail-container">
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            Loading…
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="main">
        <Navbar />
        <div className="article-detail-container">
          <div className="article-not-found">
            <h2>Article not found</h2>
            <button onClick={() => navigate('/articles')} className="back-btn">
              ← Back to Articles
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasEmbedLink = article.link && !article.content;

  return (
    <div className="main">
      <Navbar />
      <FadeInSection>
        <div className="article-detail-container">
          <div className="article-detail-header">
            <button onClick={() => navigate('/articles')} className="back-btn">
              ← Back to Articles
            </button>
            <h1 className="article-detail-title">{article.title}</h1>
            <div className="article-detail-meta">
              <span className="article-author">By {article.author}</span>
              <span className="article-date">{article.date}</span>
              {article.content && (
                <span className="article-read-time">{readingTime(article.content)} min read</span>
              )}
            </div>
            <ShareButtons title={article.title} />
          </div>

          <div className="article-detail-content">
            {hasEmbedLink ? (
              <div className="article-embed-container">
                <iframe
                  src={article.link}
                  className="article-embed-iframe"
                  title={article.title}
                  frameBorder="0"
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
                    className="article-detail-image"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.onerror = null;
                      img.src = 'https://placehold.co/800x400/cccccc/ffffff?text=Image+Not+Found';
                    }}
                  />
                )}
                <div
                  className="article-detail-text"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(article.content || '') as string)
                  }}
                />
              </>
            )}
          </div>

          {related.length > 0 && (
            <div className="related-articles">
              <h3 className="related-articles-title">You might also like</h3>
              <div className="related-articles-grid">
                {related.map((a: any) => (
                  <Link key={a.slug} to={`/article/${a.slug}`} className="related-article-card">
                    {a.thumbnail_url && (
                      <img src={a.thumbnail_url} alt={a.title} className="related-article-thumb" />
                    )}
                    <div className="related-article-info">
                      <h4>{a.title}</h4>
                      {a.excerpt && <p>{a.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeInSection>
      <Footer />
    </div>
  );
}
