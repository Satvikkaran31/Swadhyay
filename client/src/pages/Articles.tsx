import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
    imageUrl: a.thumbnail_url || '',
    date: a.published_at
      ? new Date(a.published_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '',
    author: a.author || 'Neha',
    content: a.content || '',
    tags: Array.isArray(a.tags) ? a.tags : [],
    readMins: readingTime(a.content || ''),
  };
}

const ArticleCard = ({ article }: { article: any }) => {
  return (
    <Link to={`/article/${article.slug}`} className="art-card">
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="art-card-img"
          onError={(e: any) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.nextSibling && (e.target.nextSibling.style.display = 'block');
          }}
        />
      ) : (
        <div className="art-card-img-placeholder" />
      )}
      <div className="art-card-body">
        {article.tags?.length > 0 && (
          <div className="art-card-tags">
            {article.tags.slice(0, 3).map((t: string) => (
              <span key={t} className="art-card-tag">{t}</span>
            ))}
          </div>
        )}
        <h3 className="art-card-title">{article.title}</h3>
        <p className="art-card-excerpt">{article.excerpt}</p>
        <div className="art-card-footer">
          <span className="art-card-read-time">{article.readMins} min read</span>
          <span className="art-card-date">{article.date}</span>
        </div>
      </div>
    </Link>
  );
};

export default function Articles() {
  const [articles, setArticles] = useState<any[] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/articles`)
      .then(res => res.json())
      .then(data => {
        setArticles(
          Array.isArray(data) && data.length > 0
            ? data.map(normaliseApiArticle)
            : articlesData,
        );
      })
      .catch(() => setArticles(articlesData));
  }, []);

  useEffect(() => {
    const trigger = () => document.body.classList.add('rv-go');
    if ((document.timeline as any)?.currentTime) {
      trigger();
    } else {
      window.addEventListener('load', trigger, { once: true });
    }
    return () => window.removeEventListener('load', trigger);
  }, []);

  const allTags = Array.from(
    new Set((articles ?? []).flatMap((a: any) => a.tags ?? [])),
  );

  const displayed = activeTag
    ? (articles ?? []).filter((a: any) => a.tags?.includes(activeTag))
    : (articles ?? articlesData);

  return (
    <>
      <Navbar />

      <section className="art-hero sw-page-pad">
        <div className="rv art-hero-inner">
          <span className="mono-label mono-label--light">from my desk</span>
          <h1 className="art-hero-h1">Thoughts &amp; Reflections</h1>
          <p className="art-hero-sub">
            A collection of ideas on growth, leadership, and the examined life.
          </p>
        </div>
      </section>

      <section className="art-body sw-page-pad">
        <div className="art-body-inner">
          {allTags.length > 0 && (
            <div className="art-filter-row">
              <button
                className={`art-filter-btn${!activeTag ? ' active' : ''}`}
                onClick={() => setActiveTag(null)}
                aria-pressed={!activeTag}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`art-filter-btn${activeTag === tag ? ' active' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  aria-pressed={activeTag === tag}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {articles === null ? (
            <div className="art-empty">Loading articles…</div>
          ) : displayed.length === 0 ? (
            <div className="art-empty">No articles in this category yet.</div>
          ) : (
            <div className="art-grid">
              {displayed.map((article: any) => (
                <ArticleCard key={article.id ?? article.slug} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
