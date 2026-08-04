import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import "../styles/Navbar.css";

export default function Navbar({ aboutRef }: { aboutRef?: unknown }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, setUser, logout, loading } = useUser();
  const login = useTriggerGoogleLogin(setUser, location.pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Frosted-on-scroll
  useEffect(() => {
    const update = () =>
      document.body.classList.toggle("nav-scrolled", (window.scrollY || 0) > 12);
    window.addEventListener("scroll", update, { passive: true });
    update();
    const t = setTimeout(update, 60);
    return () => { window.removeEventListener("scroll", update); clearTimeout(t); };
  }, []);

  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

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

  const userLinks = [
    { label: "Dashboard",   to: "/dashboard" },
    { label: "My Learning", to: "/my-learning" },
    { label: "My Sessions", to: "/my-sessions" },
  ];

  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* ── Desktop: single unified pill ── */}
      <div className="nav-desktop">
        <div className="nav-unified-pill">
          {/* Logo */}
          <Link to="/" className="navlogo">Swadhyay</Link>

          {/* Divider */}
          <div className="nav-divider" />

          {/* Links */}
          <nav className="navpill-links">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`navlink${l.active ? " active" : ""}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <Link to="/booking" className="nav-cta">Book a session</Link>

          {/* Admin shortcut — only for admins */}
          {!loading && isAdmin && (
            <Link to="/admin" className="nav-admin-btn">⚙ Admin</Link>
          )}

          {/* Divider */}
          <div className="nav-divider" />

          {/* User section */}
          {!loading && (
            <div className="nav-user-wrap" ref={userMenuRef}>
              {user ? (
                <>
                  <button
                    className="nav-user-pill"
                    onClick={() => setUserMenuOpen(o => !o)}
                    aria-label="User menu"
                  >
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="nav-user-avatar" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="nav-user-initials">{user.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                    <svg className={`nav-user-chevron${userMenuOpen ? " open" : ""}`} width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="nav-user-dropdown">
                      <div className="nav-user-dropdown-header">
                        {user.picture ? (
                          <img src={user.picture} alt={user.name} className="nav-dd-avatar" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="nav-dd-initials">{user.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                        <div>
                          <div className="nav-dd-name">{user.name}</div>
                          <div className="nav-dd-email">{user.email}</div>
                        </div>
                      </div>
                      <div className="nav-dd-divider" />
                      {isAdmin && (
                        <Link to="/admin" className="nav-dd-link nav-dd-admin" onClick={() => setUserMenuOpen(false)}>
                          ⚙ Admin Panel
                        </Link>
                      )}
                      {userLinks.map(l => (
                        <Link key={l.to} to={l.to} className="nav-dd-link" onClick={() => setUserMenuOpen(false)}>
                          {l.label}
                        </Link>
                      ))}
                      <div className="nav-dd-divider" />
                      <button className="nav-dd-logout" onClick={() => { setUserMenuOpen(false); logout(); }}>
                        Log out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button className="nav-login-btn" onClick={() => login()}>Log in</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="nav-mobile">
        <div className="nav-mobile-bar">
          <Link to="/" className="nav-mobile-logo" onClick={() => setMenuOpen(false)}>Swadhyay</Link>
          <div className="nav-mobile-bar-right">
            {!loading && user && (
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="nav-mobile-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <span className="nav-mobile-avatar nav-mobile-initials">{user.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </Link>
            )}
            <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="nav-mobile-dropdown">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`nav-mobile-link${l.active ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link to="/booking" className="nav-mobile-cta" onClick={() => setMenuOpen(false)}>Book a session →</Link>
            <div className="nav-mobile-divider" />
            {!loading && (
              user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="nav-mobile-link nav-mobile-admin" onClick={() => setMenuOpen(false)}>⚙ Admin Panel</Link>
                  )}
                  {userLinks.map(l => (
                    <Link key={l.to} to={l.to} className="nav-mobile-link" onClick={() => setMenuOpen(false)}>{l.label}</Link>
                  ))}
                  <button className="nav-mobile-logout" onClick={() => { setMenuOpen(false); logout(); }}>Log out</button>
                </>
              ) : (
                <button className="nav-mobile-login" onClick={() => { setMenuOpen(false); login(); }}>Log in with Google</button>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
