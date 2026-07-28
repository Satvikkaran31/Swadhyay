import { useState, useEffect } from 'react';
import '../styles/Testimonials.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Testimonial {
  id: number;
  name: string;
  role?: string;
  quote: string;
  avatar_url?: string;
}

export default function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch(`${API}/api/testimonials`)
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section className="testimonials-section">
      <h2>What clients say</h2>
      <p className="testimonials-subtitle">Real results from real people</p>
      <div className="testimonials-grid">
        {items.map(t => (
          <div key={t.id} className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">{t.quote}</p>
            <div className="testimonial-author">
              {t.avatar_url
                ? <img src={t.avatar_url} alt={t.name} className="testimonial-avatar" />
                : <div className="testimonial-avatar-placeholder">{t.name[0]}</div>
              }
              <div className="testimonial-author-info">
                <strong>{t.name}</strong>
                {t.role && <span>{t.role}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
