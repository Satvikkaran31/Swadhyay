
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FadeInSection from '../components/FadeInSection';
import '../styles/Articles.css'; 



const articlesData = [
  {
    id: 1,
    title: "The Trinity - Taking a cue for career building.",
    excerpt: "A deep dive into the phases of career building and how to navigate them effectively.",
    imageUrl: "https://media.licdn.com/dms/image/v2/C5112AQEuwLmSDtE6cA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1568619915877?e=1758153600&v=beta&t=bfunM1Usz-cWPHFq85fOELXJsqZt5JOwKX87udqD1pA",
    author: "Jane Doe",
    date: "July 15, 2025",
    link:null,
    content: `Why do we say “Building your Career” – What do we really mean here? Can we really build it? is it a conscious process or accidental? does it go through phases? and what is eventually “THE GOAL or PURPOSE” of this career journey we undertake.

These are certain fundamental questions which most of us don’t find easy to answer or may be don’t give it a conscious thought.

Apart from the financial aspect, what do we seek from it?– Is it a sense of fulfillment, discovering our capabilities, learning new skills, growth, showcasing our talent, wealth or just the JOY in the process of creating something.

We can take analogies from the field of cricket and entertainment as relating to them is easier. Also careers of public figures are for everyone to see.

Cricket runs through various formats – For a 20-20 we need a different kind of a player but for a test match we need a different temperament altogether, while for one day the ask can be completely different. The same player can play differently in an IPL match and in the WORLD Cup the emotion can be completely different. While one may ball well in all formats but playing for the country can add emotion, more responsibility or fear to the player’s experience. Sometimes the coach or captain is making a huge difference to team performance. Here Tendulkar is a living example of a great cricketer but not a “Great Captain”.

Looking at the entertainment industry as well, the format we choose for creative expression can be writing, directing, performing or anything but the platform can be – bollywood or a theatre group or a dance troupe or a you tube or even netflix now. Some are even building it through tiktok these days! while what platform we choose can vary but the process of going through this journey does reflect a pattern.

This Pattern is what we call as the TRILOGY or TRINITY of Career building –Watching closely everyone’s career goes through a phase of “Creation, Maintenance, Dissolution and Rediscovery”. However long or successful one’s career may be but a few fundamentals do remain consistent. The time in each zone may vary but the cycle to it does seem imperative. A few pointers at every stage can enhance or enrich this experience. The time period of these patterns could vary from profession, to platforms, to person but if one can identify the same in their respective journey the transition to the next phase can also be much easier.

The Creation Phase: This is the phase when we begin the process of Career Building – We are willing to learn, willing to experiment, all enthusiasm, very open to be being guided – basically we are all raring to set the tuning of this journey. At this stage “Looking for the right mentors, anchors or taking inspiration can be most fruitful". If you find people you can look up to at this stage it adds to the experience. E.g. an actor can be very fortunate if s/he gets to work with a great but demanding director in the early stage of their careers. It helps in setting a benchmark for ourselves, inspiring us and enhances this phase of learning and experimenting in this period. It would be ideal to have more than one such person identified at this stage. These will be people we can turn to for advice, be our guides in managing different situations and challenges and keep us on the right track. Choose your mentors consciously as you are most vulnerable in this phase. Do variety of different projects at this stage as the more you do, the better you will understand your strengths. ASK questions & continue to ASK -"Don’t Hesitate – You are learning” – TRY & TRY- “Don’t hesitate you are learning". Don’t say no to new experiences, new projects and opportunities of working with different people. After all you are learning. You are discovering your own self and starting to know your real liking, motivations and challenges in this period so make the most of it. Mostly the life stage also supports this phase to focus on this process of laying the foundation.MS Dhoni’s professional journey as a raw talent to being the Indian Captain relates to this phase and he comes to mind most while thinking through the pattern.

Stage of Maintenance: This is a good phase to be in as Now - we are most comfortable being us.We have established a certain identity, defined our capabilities and built our credibility and set a clear direction to ourselves. During this phase we may also have added other dimensions to life which will evolve our priorities and engagements as well. While we have to continue to sustain and better our versions during this phase it is equally important to “Expand our zone of influence and have a stronger outreach in this phase”. Focus on understanding wider contexts, establishing broader networks and looking beyond our function to the overall organization or even the Sector or even beyond. Build your insights on influences/disruptions during this phase. Dhoni helped Indian cricket reach heights, provided stability and stay put as a guide, captain expanding his own influence across the Cricket board, took up IPL captain-ship and tested all formats during this time.

The phase of Dissolution and Rediscovery go Hand in hand: What we have created, built and established can only be dissolved while rediscovering and that’s the reason why these two phases go hand in hand. Dissolution could result through age, an industry disruption or having a different internal need altogether for us to find fulfillment in our work. Seasoned players turn into coaches, CEO’s turn into mentors, investors, guides or assume a much wider cause altogether (e.g. Many respected industry veterans like Nandan Nilekani; Pramath Sinha, Pramod Bhasin, Ashish Dhawan, Amit Chandra and many others have assumed a much wider role in this period. Reinventing ourselves, finding a bigger dimension or giving back to our sectors or nation all is achievable in this phase. Again Dhoni came as a living example -he knew when to slowly start distancing from some format to continue working as a team member and his return from World Cup to the Indian Army training camp just enhances the beauty of his transition and rediscovery.

Whatever the phase we are in, towards the end of this whole journey how we PLAY “TRULY DOES MATTER”. Given this journey is also our OPPORTUNITY of touching lives in many ways at whichever phase, lets decide not to MISS IT in our Early career itself!. There are many with us on this journey so know that we are not on it ALONE and also know that’s why “THE END PURPOSE DOES MATTER’”.`
  },
  {
    id: 2,
    title: "Systematic coaching and facilitation towards effective boards.",
    excerpt: "How Board coaching and facilitation can be a great first step towards systemic change and impact.",
    imageUrl: "https://placehold.co/600x400/C8C4BE/1A2B3C?text=Career+Transitions",
    author: "John Smith",
    date: "4yrs ago",
    link: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:6770350543677218816?compact=1"
  },
  {
    id: 3,
    title: "Evolving and appraising boards in current times - Desirable or a Necesseity?",
    excerpt: "How Boards could add value truly came to the forefront during this pandemic and even more so for the Impact sector.",
    imageUrl: "https://placehold.co/600x400/B0B5AD/1A2B3C?text=Self-Coaching",
    author: "Emily White",
    date: "4yrs ago",
    link: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:6736898223044091904?compact=1"
  }
];

// --- Components ---

const Modal = ({ article, onClose }) => {
    if (!article) return null;

    // Determine if the article content should be an embedded link
    const hasEmbedLink = article.link && !article.content;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{article.title}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {hasEmbedLink ? (
                        <iframe
                            src={article.link}
                            className="modal-iframe"
                            title={article.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <>
                            <img src={article.imageUrl} alt={article.title} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'; }} />
                            <div className="article-text">
                                {article.content.split('\n\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const ArticleCard = ({ article, onReadMore }) => {
  return (
    <div className="article-card">
      <img src={article.imageUrl} alt={article.title} className="article-image" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'; }} />
      <div className="article-content">
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="article-footer">
          <button onClick={() => onReadMore(article)} className="read-more-btn">Read More</button>
          <div className="article-meta">
            <span>{article.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArticleList = ({ onReadMore }) => {
  return (
    <section className="articles-section">
      <header className="articles-header">
        <h1>From My Desk</h1>
        <p>A collection of thoughts on leadership, growth, and self-discovery.</p>
      </header>
      <div className="articles-grid">
        {articlesData.map(article => (
          <ArticleCard key={article.id} article={article} onReadMore={onReadMore} />
        ))}
      </div>
    </section>
  );
};



// --- Main App Component ---

export default function Articles() {
    const [selectedArticle, setSelectedArticle] = useState(null);

   useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedArticle]);



  const handleReadMore = (article) => {
    setSelectedArticle(article);
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };
  return (
    <div className="main">
      <Navbar  />
      <FadeInSection>
      <ArticleList onReadMore={handleReadMore} />
      </FadeInSection>
      <Modal article={selectedArticle} onClose={handleCloseModal} />
      <Footer />
    </div>
  );
}
