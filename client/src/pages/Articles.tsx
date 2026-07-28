import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function readingTime(content: string): number {
  const words = (content ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function normaliseApiArticle(a: any) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    imageUrl: a.thumbnail_url || 'https://placehold.co/600x400/cccccc/ffffff?text=Article',
    date: a.published_at ? new Date(a.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    author: a.author || 'Neha',
    content: a.content || '',
    tags: Array.isArray(a.tags) ? a.tags : [],
    readMins: readingTime(a.content || ''),
  };
}

const ArticleCard = ({ article }: { article: any }) => {
  const navigate = useNavigate();
  return (
    <div className="article-card" onClick={() => navigate(`/article/${article.slug}`)}>
      <img
        src={article.imageUrl}
        alt={article.title}
        className="article-image"
        onError={(e: any) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'; }}
      />
      <div className="article-content">
        {article.tags?.length > 0 && (
          <div className="article-tags">
            {article.tags.slice(0, 3).map((t: string) => <span key={t} className="article-tag">{t}</span>)}
          </div>
        )}
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="article-footer">
          <span className="article-read-time">{article.readMins} min read</span>
          <div className="article-meta">
            <span>{article.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Articles() {
  const [articles, setArticles] = useState<any[] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/articles`)
      .then(res => res.json())
      .then(data => {
        setArticles(Array.isArray(data) && data.length > 0
          ? data.map(normaliseApiArticle)
          : articlesData);
      })
      .catch(() => setArticles(articlesData));
  }, []);

  const allTags = Array.from(new Set((articles ?? []).flatMap((a: any) => a.tags ?? [])));
  const displayed = activeTag
    ? (articles ?? []).filter((a: any) => a.tags?.includes(activeTag))
    : (articles ?? articlesData);

  return (
    <div className="main">
      <Navbar />
      <FadeInSection>
        <section className="articles-section">
          <header className="articles-header">
            <h1>From My Desk</h1>
            <p>A collection of thoughts on leadership, growth, and self-discovery.</p>
          </header>

          {allTags.length > 0 && (
            <div className="articles-tag-filter">
              <button
                className={`filter-tag${!activeTag ? ' active' : ''}`}
                onClick={() => setActiveTag(null)}
              >All</button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`filter-tag${activeTag === tag ? ' active' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >{tag}</button>
              ))}
            </div>
          )}

          {articles === null ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>Loading articles…</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>No articles in this category yet.</div>
          ) : (
            <div className="articles-grid">
              {displayed.map((article: any) => (
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
