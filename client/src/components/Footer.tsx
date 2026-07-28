import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    try {
      const res = await fetch(`${API}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'done' : 'error');
      if (res.ok) setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="footer-container" id="contact">
      <div className="footer-content">
        <div className="footer-section about">
          <h3 className="footer-logo">Swadhyay</h3>
          <p>
            A space for self-discovery and growth. We are dedicated to helping you unlock your potential and live a more authentic, fulfilling life.
          </p>
        </div>

        <div className="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/courses">Courses</a></li>
            <li><a href="/articles">Articles</a></li>
            <li><a href="/booking">Booking</a></li>
          </ul>
        </div>

        <div className="footer-section certifications">
          <h3>Certifications</h3>
          <ul>
            <li>Professional Certified Coach</li>
            <li>Advanced Coaching - Coacharya</li>
            <li>EMCC Global Member</li>
            <li>Team Coaching - TPRG</li>
            <li>Asia Pacific Alliance of Coaches</li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3>Contact Us</h3>
          <ul>
            <li>nehasharma@swadhyay.co</li>
            <li><a href="https://www.linkedin.com/in/neha-sharma-00b69565?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">LinkedIn</a></li>
            <li><a href="mailto:nehasharma@swadhyay.co">Mail</a></li>
            <li><Link to="/contact-us">Contact</Link></li>
          </ul>
        </div>
      </div>

      {/* Newsletter */}
      <div className="footer-newsletter">
        <p className="footer-newsletter-label">Stay in the loop — insights on leadership, EFT, and coaching.</p>
        {status === 'done' ? (
          <p className="footer-newsletter-success">You're subscribed! Welcome aboard.</p>
        ) : (
          <form className="footer-newsletter-form" onSubmit={subscribe}>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={status === 'sending'}
              className="footer-newsletter-input"
            />
            <button type="submit" disabled={status === 'sending'} className="footer-newsletter-btn">
              {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
            {status === 'error' && <span className="footer-newsletter-error">Something went wrong. Try again.</span>}
          </form>
        )}
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Swadhyay | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
