import { Link } from 'react-router-dom';
import '../styles/Footer.css';

interface FooterProps {
  compact?: boolean; // slim 2-row variant for detail pages
}

export default function Footer({ compact = false }: FooterProps) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="footer-compact sw-page-pad">
        <div className="footer-compact-inner">
          <span className="footer-logo-text">Swadhyay</span>
          <div className="footer-compact-links">
            <Link to="/whoami">About</Link>
            <Link to="/series">Learning</Link>
            <Link to="/booking">Schedule</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </div>
        <div className="footer-bottom-row">
          <span>© {year} Swadhyay. All rights reserved.</span>
          <span>PCC · ICF Certified · Senior Mentor at Jagriti Yatra</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer sw-page-pad">
      <div className="footer-cols">
        <div className="footer-brand">
          <span className="footer-logo-text">Swadhyay</span>
          <p>Coaching for self-mastery and elevated leadership. A space for inner work.</p>
        </div>
        <div className="footer-col">
          <div className="footer-col-head">Explore</div>
          <div className="footer-col-links">
            <Link to="/whoami">About</Link>
            <Link to="/booking">Schedule</Link>
            <Link to="/series">Learning</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact-us">Contact</Link>
          </div>
        </div>
        <div className="footer-col">
          <div className="footer-col-head">Coaching</div>
          <div className="footer-col-links">
            <Link to="/booking">One-on-One</Link>
            <Link to="/booking">EFT</Link>
            <Link to="/booking">Group</Link>
            <Link to="/booking">Book a session</Link>
          </div>
        </div>
        <div className="footer-col">
          <div className="footer-col-head">Connect</div>
          <div className="footer-col-links">
            <a href="https://www.linkedin.com/in/neha-sharma-00b69565" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="mailto:nehasharma@swadhyay.co">Email</a>
            <a href="https://wa.me/919810059991" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom-row">
        <span>© {year} Swadhyay. All rights reserved.</span>
        <span>PCC · ICF Certified · Senior Mentor at Jagriti Yatra</span>
      </div>
    </footer>
  );
}
