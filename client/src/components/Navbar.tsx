import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar({ aboutRef }: { aboutRef?: unknown }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Frosted-on-scroll: toggle body.nav-scrolled at scrollY > 12
  useEffect(() => {
    const update = () =>
      document.body.classList.toggle("nav-scrolled", (window.scrollY || 0) > 12);
    window.addEventListener("scroll", update, { passive: true });
    update();
    const t = setTimeout(update, 60);
    return () => { window.removeEventListener("scroll", update); clearTimeout(t); };
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const p = location.pathname;
  const isActive = (paths: string[]) =>
    paths.some(path => path === "/" ? p === "/" : p === path || p.startsWith(path + "/"));

  const links = [
    { label: "Home",     to: "/",        active: isActive(["/"]) },
    { label: "About",    to: "/whoami",  active: isActive(["/whoami"]) },
    { label: "Schedule", to: "/booking", active: isActive(["/booking"]) },
    { label: "Learning", to: "/series",  active: isActive(["/series", "/courses"]) },
    { label: "Pricing",  to: "/pricing", active: isActive(["/pricing"]) },
  ];

  return (
    <>
      {/* ── Desktop: two-pill ── */}
      <div className="nav-desktop">
        <div className="nav-container">
          <Link to="/" className="navlogo">Swadhyay</Link>
          <div className="navpill">
            <nav className="navpill-links">
              {links.map(l => (
                <Link key={l.to} to={l.to} className={`navlink${l.active ? " active" : ""}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link to="/booking" className="nav-cta">Book a session</Link>
          </div>
        </div>
      </div>

      {/* ── Mobile: frosted bar + dropdown ── */}
      <div className="nav-mobile">
        <div className="nav-mobile-bar">
          <Link to="/" className="nav-mobile-logo" onClick={() => setMenuOpen(false)}>Swadhyay</Link>
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="nav-mobile-dropdown">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-mobile-link${l.active ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/booking" className="nav-mobile-cta" onClick={() => setMenuOpen(false)}>
              Book a session →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
