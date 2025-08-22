import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import { articlesData } from '../utils/articlesData';
import '../styles/Articles.css';

export default function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const article = articlesData.find(a => a.slug === slug);
  
  if (!article) {
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
                ></iframe>
              </div>
            ) : (
              <>
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="article-detail-image"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src='https://placehold.co/800x400/cccccc/ffffff?text=Image+Not+Found'; 
                  }} 
                />
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