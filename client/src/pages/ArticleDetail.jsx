import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

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
            </div>
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
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/800x400/cccccc/ffffff?text=Image+Not+Found';
                    }}
                  />
                )}
                <div className="article-detail-text">
                  {article.content && article.content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </FadeInSection>
      <Footer />
    </div>
  );
}
