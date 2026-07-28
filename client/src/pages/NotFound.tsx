import { Link } from "react-router-dom";
import "../styles/NotFound.css";

export default function NotFound() {
  return (
    <div className="nf-page">
      <div className="nf-inner">
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page not found</h1>
        <p className="nf-desc">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="nf-links">
          <Link to="/" className="nf-btn-primary">Go home</Link>
          <Link to="/courses" className="nf-btn-secondary">Browse courses</Link>
        </div>
      </div>
    </div>
  );
}
