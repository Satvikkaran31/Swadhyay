import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { scroller } from "react-scroll";
import "../styles/Navbar.css";
import BookingModal from "./BookingModal";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useUser } from "../context/UserProvider";

// ── Interactive Eye ──────────────────────────────────────────────────────────
function InteractiveEye() {
  const containerRef = useRef(null);
  const pupilGroupRef = useRef(null);
  const rafRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const radius = 3.5;
      target.current = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    };

    const loop = () => {
      const lerp = 0.12;
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;
      if (pupilGroupRef.current) {
        pupilGroupRef.current.setAttribute(
          "transform",
          `translate(${current.current.x.toFixed(3)}, ${current.current.y.toFixed(3)})`
        );
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="header-eye" aria-hidden="true">
      <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer eye almond */}
        <path
          d="M2 14 C9 3, 35 3, 42 14 C35 25, 9 25, 2 14 Z"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.25"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Iris ring */}
        <circle cx="22" cy="14" r="6.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.25" fill="none" />
        {/* Pupil group — this moves */}
        <g ref={pupilGroupRef}>
          <circle cx="22" cy="14" r="3.5" fill="white" />
          <circle cx="23.4" cy="12.6" r="1" fill="rgba(0,0,0,0.35)" />
        </g>
      </svg>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useTriggerGoogleLogin(setUser);

  const closeMenu = () => setMenuOpen(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close on route change
  useEffect(() => { closeMenu(); }, [location.pathname]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const scrollTo = (sectionId) => {
    closeMenu();
    if (location.pathname === "/") {
      scroller.scrollTo(sectionId, { duration: 800, delay: 0, smooth: "easeInOutQuart", offset: -80 });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        scroller.scrollTo(hash, { duration: 800, delay: 0, smooth: "easeInOutQuart", offset: -80 });
        history.replaceState(null, null, window.location.pathname);
      }, 100);
    }
  }, [location.pathname, location.hash]);

  const handleSchedule = () => {
    closeMenu();
    if (!user) login(); else setShowModal(true);
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const navLinks = [
    { label: "About",     action: () => scrollTo("about-content") },
    { label: "Articles",  path: "/articles" },
    { label: "Courses",   path: "/courses" },
    { label: "Pricing",   path: "/booking" },
    { label: "Schedule",  action: handleSchedule },
    ...(user ? [{ label: "My Learning", path: "/my-learning" }] : []),
    ...(user?.role === "admin" ? [{ label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <>
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="header-inner">
          <button className="header-logo" onClick={() => scrollTo("main")}>
            Swadhyay
          </button>

          <div className="header-right">
            <InteractiveEye />

            <button
              className={`ham-btn${menuOpen ? " is-open" : ""}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span className="ham-line" />
              <span className="ham-line" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-screen overlay ──────────────────────────────────────────── */}
      <div className={`nav-overlay${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen ? "" : undefined}>
        <nav className="overlay-inner">

          <ul className="overlay-links">
            {navLinks.map((item, i) => (
              <li
                key={item.label}
                className="overlay-item"
                style={{ animationDelay: `${120 + i * 55}ms` }}
              >
                {item.path ? (
                  <Link to={item.path} className="overlay-link" onClick={closeMenu}>
                    {item.label}
                  </Link>
                ) : (
                  <button className="overlay-link" onClick={item.action}>
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Auth row */}
          <div className="overlay-footer">
            <div className="overlay-auth">
              {user ? (
                <>
                  <img
                    src={user.picture}
                    alt=""
                    className="overlay-avatar"
                    referrerPolicy="no-referrer"
                  />
                  <span className="overlay-username">{user.name.split(" ")[0]}</span>
                  <button className="overlay-meta-btn" onClick={handleLogout}>Log out</button>
                </>
              ) : (
                <button className="overlay-meta-btn" onClick={() => { login(); closeMenu(); }}>
                  Log in
                </button>
              )}
            </div>

            {/* Social links */}
            <div className="overlay-social">
              <a href="https://www.linkedin.com/company/swadhyay" target="_blank" rel="noreferrer" className="social-icon" aria-label="LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/swadhyay" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

        </nav>
      </div>

      {showModal && <BookingModal onClose={() => setShowModal(false)} />}
    </>
  );
}
