import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Normalise an API article to match the shape ArticleCard expects
function normaliseApiArticle(a) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    imageUrl: a.thumbnail_url || 'https://placehold.co/600x400/cccccc/ffffff?text=Article',
    date: a.published_at ? new Date(a.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    author: a.author || 'Neha',
    content: a.content,
  };
}

// Article Card Component
const ArticleCard = ({ article }) => {
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate(`/article/${article.slug}`);
  };

  return (
    <div className="article-card">
      <img
        src={article.imageUrl}
        alt={article.title}
        className="article-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';
        }}
      />
      <div className="article-content">
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="article-footer">
          <button onClick={handleReadMore} className="read-more-btn">
            Read More
          </button>
          <div className="article-meta">
            <span>{article.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Articles component
export default function Articles() {
  const [articles, setArticles] = useState(null); // null = loading
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/articles`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data.map(normaliseApiArticle));
        } else {
          // Empty array or non-array: fall back to static
          setArticles(articlesData);
        }
      })
      .catch(() => {
        setArticles(articlesData);
        setError(true);
      });
  }, []);

  const displayArticles = articles ?? articlesData;

  return (
    <div className="main">
      <Navbar />
      <FadeInSection>
        <section className="articles-section">
          <header className="articles-header">
            <h1>From My Desk</h1>
            <p>A collection of thoughts on leadership, growth, and self-discovery.</p>
          </header>
          {articles === null ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
              Loading articles…
            </div>
          ) : (
            <div className="articles-grid">
              {displayArticles.map(article => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))}
            </div>
          )}
        </section>
      </FadeInSection>
      <Footer />
    </div>
  );
}
