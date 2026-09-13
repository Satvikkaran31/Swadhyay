import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/NotFound.css";

export default function NotFound() {
  // Give the soft-404 a real title and tell crawlers not to index it, so
  // non-existent URLs don't leak into search results. Cleaned up on unmount.
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Page not found — Swadhyay";
    const robots = document.createElement("meta");
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, follow");
    document.head.appendChild(robots);
    return () => {
      document.title = prevTitle;
      robots.remove();
    };
  }, []);

  return (
    <div className="nf-page">
      <Navbar />
      <div className="nf-orb" />
      <div className="nf-inner rv">
        <span className="nf-eyebrow">404</span>
        <h1 className="nf-title">Page not found</h1>
        <p className="nf-desc">The page you're looking for doesn't exist or may have been moved.</p>
        <div className="nf-links">
          <Link to="/" className="nf-btn-primary">← Go home</Link>
          <Link to="/courses" className="nf-btn-ghost">Browse courses</Link>
        </div>
      </div>
    </div>
  );
}
