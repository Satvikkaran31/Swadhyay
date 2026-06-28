import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { scroller } from "react-scroll";
import "../styles/Navbar.css";
import "../styles/NavbarHamburger.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useUser } from "../context/UserProvider";

export default function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useTriggerGoogleLogin(setUser);

  const aboutRef = useRef(null);
  const learningRef = useRef(null);
  const profileRef = useRef(null);

  // ── Scroll: at top → pill visible, scrolled → transparent ─────────
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 24);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  // ── Mobile breakpoint ──────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Click-outside close ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) setAboutOpen(false);
      if (learningRef.current && !learningRef.current.contains(e.target)) setLearningOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Body scroll lock for mobile menu ──────────────────────────────
  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", mobileOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [mobileOpen]);

  // ── Close mobile on route change ──────────────────────────────────
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // ── Hash scroll ────────────────────────────────────────────────────
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        scroller.scrollTo(hash, { duration: 800, delay: 0, smooth: "easeInOutQuart", offset: -80 });
        history.replaceState(null, null, window.location.pathname);
      }, 100);
    }
  }, [location.pathname, location.hash]);

  const scrollTo = (sectionId) => {
    setMobileOpen(false);
    if (location.pathname === "/") {
      scroller.scrollTo(sectionId, { duration: 800, delay: 0, smooth: "easeInOutQuart", offset: -90 });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const closeAll = () => {
    setAboutOpen(false);
    setLearningOpen(false);
    setProfileOpen(false);
  };

  const isAboutActive = ["/contact-us", "/whoami"].some(p => location.pathname.startsWith(p));
  const isLearningActive = ["/articles", "/article/", "/courses", "/my-learning"].some(p =>
    location.pathname === p || location.pathname.startsWith(p)
  );
  const isPricingActive = location.pathname === "/booking";

  const handleSchedule = () => {
    setMobileOpen(false);
    if (!user) login(); else setShowModal(true);
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const aboutItems = [
    { label: "Our Mission",  action: () => scrollTo("about-goal") },
    { label: "About Neha",   action: () => scrollTo("about-content") },
    { label: "Contact Us",   path: "/contact-us" },
  ];

  const learningItems = [
    { label: "Articles",     path: "/articles" },
    { label: "Courses",      path: "/courses" },
    ...(user ? [{ label: "My Learning", path: "/my-learning" }] : []),
    { label: "Who Am I?",    path: "/whoami" },
  ];

  const Chevron = ({ open }) => (
    <svg className={`chevron${open ? " up" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <>
      {/* ── Pill wrapper ──────────────────────────────────────────── */}
      <nav className={`pill-nav${scrolled ? " scrolled" : ""}`}>

        {/* ── Desktop pill ────────────────────────────────────────── */}
        <div className="pill-inner desktop-pill">

          {/* Brand */}
          <button className="pill-brand" onClick={() => scrollTo("main")}>
            <svg width="18" height="18" viewBox="0 0 80 75" fill="currentColor">
              <path d="m31.83,52.52l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02z"/>
            </svg>
          </button>

          <span className="pill-sep" />

          {/* About */}
          <div className="pill-drop-wrap" ref={aboutRef}
            onMouseEnter={() => !isMobile && setAboutOpen(true)}
            onMouseLeave={() => !isMobile && setAboutOpen(false)}
          >
            <button
              className={`pill-item${isAboutActive ? " active" : ""}`}
              onClick={() => { setAboutOpen(v => !v); setLearningOpen(false); setProfileOpen(false); }}
            >
              About <Chevron open={aboutOpen} />
            </button>
            {aboutOpen && (
              <div className="pill-dropdown">
                {aboutItems.map((item, i) => (
                  <button key={i} className="pill-drop-item" onClick={() => { item.path ? navigate(item.path) : item.action(); closeAll(); }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <button className="pill-item" onClick={handleSchedule}>Schedule</button>

          {/* Learning */}
          <div className="pill-drop-wrap" ref={learningRef}
            onMouseEnter={() => !isMobile && setLearningOpen(true)}
            onMouseLeave={() => !isMobile && setLearningOpen(false)}
          >
            <button
              className={`pill-item${isLearningActive ? " active" : ""}`}
              onClick={() => { setLearningOpen(v => !v); setAboutOpen(false); setProfileOpen(false); }}
            >
              Learning <Chevron open={learningOpen} />
            </button>
            {learningOpen && (
              <div className="pill-dropdown">
                {learningItems.map((item, i) => (
                  <button key={i} className="pill-drop-item" onClick={() => { navigate(item.path); closeAll(); }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <Link className={`pill-item${isPricingActive ? " active" : ""}`} to="/booking" onClick={closeAll}>
            Pricing
          </Link>

          <span className="pill-sep" />

          {/* Auth */}
          {user?.picture ? (
            <div className="pill-drop-wrap" ref={profileRef}
              onMouseEnter={() => !isMobile && setProfileOpen(true)}
              onMouseLeave={() => !isMobile && setProfileOpen(false)}
            >
              <img
                src={user.picture} alt="Profile" className="pill-avatar"
                onClick={() => { setProfileOpen(v => !v); setAboutOpen(false); setLearningOpen(false); }}
                referrerPolicy="no-referrer"
              />
              {profileOpen && (
                <div className="pill-dropdown right">
                  <button className="pill-drop-item muted" disabled>{user.name.split(" ")[0]}</button>
                  {user.role === "admin" && (
                    <button className="pill-drop-item" onClick={() => { navigate("/admin"); closeAll(); }}>Admin</button>
                  )}
                  <button className="pill-drop-item" onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : (
            <LoginButton />
          )}
        </div>

        {/* ── Mobile pill ─────────────────────────────────────────── */}
        <div className="pill-inner mobile-pill">
          <button className="pill-brand" onClick={() => scrollTo("main")}>
            <svg width="18" height="18" viewBox="0 0 80 75" fill="currentColor">
              <path d="m31.83,52.52l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02z"/>
            </svg>
            <span className="pill-brand-name">Swadhyay</span>
          </button>
          {!mobileOpen && (
            <button className="pill-ham" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile overlay ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="mob-overlay" onClick={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <div className="mob-menu">
            <div className="mob-header">
              <button className="pill-brand" onClick={() => { scrollTo("main"); setMobileOpen(false); }}>
                <svg width="18" height="18" viewBox="0 0 80 75" fill="currentColor">
                  <path d="m31.83,52.52l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02z"/>
                </svg>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-secondary)" }}>Swadhyay</span>
              </button>
              <button className="mob-close" onClick={() => setMobileOpen(false)}>×</button>
            </div>
            <div className="mob-body">
              <p className="mob-section-label">About</p>
              {aboutItems.map((item, i) => (
                <button key={i} className="mob-link sub" onClick={() => { item.path ? navigate(item.path) : item.action(); }}>
                  {item.label}
                </button>
              ))}
              <button className="mob-link" onClick={handleSchedule}>Schedule</button>
              <p className="mob-section-label">Learning</p>
              {learningItems.map((item, i) => (
                <button key={i} className="mob-link sub" onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                  {item.label}
                </button>
              ))}
              <Link className="mob-link" to="/booking" onClick={() => setMobileOpen(false)}>Pricing</Link>
              {user ? (
                <div className="mob-auth">
                  <div className="mob-user">
                    <img src={user.picture} alt="" className="mob-avatar" referrerPolicy="no-referrer" />
                    <span>{user.name.split(" ")[0]}</span>
                  </div>
                  {user.role === "admin" && (
                    <button className="mob-link" onClick={() => { navigate("/admin"); setMobileOpen(false); }}>Admin Panel</button>
                  )}
                  <button className="mob-link logout" onClick={handleLogout}>Log out</button>
                </div>
              ) : (
                <div className="mob-auth">
                  <button className="mob-login-btn" onClick={() => { login(); setMobileOpen(false); }}>Log in with Google</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && <BookingModal onClose={() => setShowModal(false)} />}
    </>
  );
}
