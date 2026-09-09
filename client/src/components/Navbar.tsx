import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import "../styles/Navbar.css";

// Brand glyph — the mark used on the previous (GitHub) iteration of the site.
function LogoMark() {
  return (
    <svg className="navlogo-mark" viewBox="0 0 80 75" fill="currentColor" aria-hidden="true">
      <path d="m31.83,52.51667l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82l0,0zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02l0,0z"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Navbar({ aboutRef }: { aboutRef?: unknown }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, setUser, logout, loading } = useUser();
  const login = useTriggerGoogleLogin(setUser, location.pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("sw-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("sw-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark(d => !d);

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
          <Link to="/" className="navlogo"><LogoMark />Swadhyay</Link>

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

          {/* Theme toggle */}
          <button
            className="nav-theme-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

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
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
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
          <Link to="/" className="nav-mobile-logo" onClick={() => setMenuOpen(false)}><LogoMark />Swadhyay</Link>
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
            <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
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
            <div className="nav-mobile-theme-row">
              <span className="nav-mobile-theme-label">{isDark ? "Dark mode" : "Light mode"}</span>
              <button className="nav-mobile-theme-toggle" onClick={toggleTheme}>
                {isDark ? <SunIcon /> : <MoonIcon />}
                {isDark ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
