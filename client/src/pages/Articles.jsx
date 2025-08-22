import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

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
          e.target.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'; 
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

// Article List Component
const ArticleList = () => {
  return (
    <section className="articles-section">
      <header className="articles-header">
        <h1>From My Desk</h1>
        <p>A collection of thoughts on leadership, growth, and self-discovery.</p>
      </header>
      <div className="articles-grid">
        {articlesData.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};

// Main Articles List Component
export default function Articles() {
  return (
    <div className="main">
      <Navbar />
      <FadeInSection>
        <ArticleList />
      </FadeInSection>
      <Footer />
    </div>
  );
}