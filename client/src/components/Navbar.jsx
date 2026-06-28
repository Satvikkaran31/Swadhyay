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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const learningDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const login = useTriggerGoogleLogin(setUser);

  // ── Scroll-to-section helper ───────────────────────────────────────────────
  const handleScrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      scroller.scrollTo(sectionId, { duration: 800, delay: 0, smooth: "easeInOutQuart", offset: -90 });
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

  // ── Mobile detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Scroll detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Click-outside close ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(e.target)) setAboutDropdownOpen(false);
      if (learningDropdownRef.current && !learningDropdownRef.current.contains(e.target)) setLearningDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [mobileMenuOpen]);

  // ── Active path helpers ────────────────────────────────────────────────────
  const isAboutActive = ["/contact-us", "/whoami"].some(p => location.pathname.startsWith(p));
  const isLearningActive = ["/articles", "/article/", "/courses", "/my-learning"].some(p =>
    location.pathname === p || location.pathname.startsWith(p)
  );
  const isPricingActive = location.pathname === "/booking";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProtectedClick = () => {
    if (!user) { login(); } else { setShowModal(true); }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const aboutDropdownItems = [
    { label: "Our Mission", sectionId: "about-goal" },
    { label: "About Neha", sectionId: "about-content" },
    { label: "Contact Us", path: "/contact-us" },
  ];

  const learningDropdownItems = [
    { label: "Articles", path: "/articles" },
    { label: "Courses", path: "/courses" },
    ...(user ? [{ label: "My Learning", path: "/my-learning" }] : []),
    { label: "Who Am I?", path: "/whoami" },
  ];

  const handleDropdownItemClick = (item) => {
    if (item.path) navigate(item.path);
    else if (item.sectionId) handleScrollToSection(item.sectionId);
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
  };

  const closeDropdowns = () => {
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
    setDropdownOpen(false);
  };

  const ChevronIcon = ({ open }) => (
    <svg
      className={`pill-chevron ${open ? "rotated" : ""}`}
      width="11" height="11" viewBox="0 0 12 12" fill="none"
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <nav className="navbar-pill-wrap">

        {/* ── Desktop pill ─────────────────────────────────────────── */}
        <div className={`nav-pill desktop-pill ${scrolled ? "scrolled" : "at-top"}`}>

          {/* Brand mark */}
          <button
            className="pill-brand"
            onClick={() => handleScrollToSection("main")}
            aria-label="Home"
          >
            <svg width="20" height="20" viewBox="0 0 80 75" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="m31.83,52.51667l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82l0,0zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02l0,0z" />
            </svg>
          </button>

          <div className="pill-divider" />

          {/* About dropdown */}
          <div
            className="pill-dropdown-wrap"
            ref={aboutDropdownRef}
            onMouseEnter={() => !isMobile && setAboutDropdownOpen(true)}
            onMouseLeave={() => !isMobile && setAboutDropdownOpen(false)}
          >
            <button
              className={`pill-item ${isAboutActive ? "active" : ""}`}
              onClick={() => { setAboutDropdownOpen(v => !v); setLearningDropdownOpen(false); setDropdownOpen(false); }}
            >
              About <ChevronIcon open={aboutDropdownOpen} />
            </button>
            {aboutDropdownOpen && (
              <div className="pill-dropdown">
                {aboutDropdownItems.map((item, i) => (
                  <button key={i} className="pill-dropdown-item" onClick={() => handleDropdownItemClick(item)}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <button className="pill-item" onClick={handleProtectedClick}>
            Schedule
          </button>

          {/* Learning dropdown */}
          <div
            className="pill-dropdown-wrap"
            ref={learningDropdownRef}
            onMouseEnter={() => !isMobile && setLearningDropdownOpen(true)}
            onMouseLeave={() => !isMobile && setLearningDropdownOpen(false)}
          >
            <button
              className={`pill-item ${isLearningActive ? "active" : ""}`}
              onClick={() => { setLearningDropdownOpen(v => !v); setAboutDropdownOpen(false); setDropdownOpen(false); }}
            >
              Learning <ChevronIcon open={learningDropdownOpen} />
            </button>
            {learningDropdownOpen && (
              <div className="pill-dropdown">
                {learningDropdownItems.map((item, i) => (
                  <button key={i} className="pill-dropdown-item" onClick={() => handleDropdownItemClick({ path: item.path })}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <Link className={`pill-item ${isPricingActive ? "active" : ""}`} to="/booking" onClick={closeDropdowns}>
            Pricing
          </Link>

          <div className="pill-divider" />

          {/* Auth */}
          {user?.picture ? (
            <div
              className="pill-dropdown-wrap"
              ref={dropdownRef}
              onMouseEnter={() => !isMobile && setDropdownOpen(true)}
              onMouseLeave={() => !isMobile && setDropdownOpen(false)}
            >
              <img
                src={user.picture}
                alt="Profile"
                className="pill-avatar"
                onClick={() => { setDropdownOpen(v => !v); setAboutDropdownOpen(false); setLearningDropdownOpen(false); }}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="sync"
              />
              {dropdownOpen && (
                <div className="pill-dropdown right">
                  <button className="pill-dropdown-item label" disabled>{user.name.split(" ")[0]}</button>
                  {user.role === "admin" && (
                    <button className="pill-dropdown-item" onClick={() => { navigate("/admin"); setDropdownOpen(false); }}>
                      Admin Panel
                    </button>
                  )}
                  <button className="pill-dropdown-item" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <LoginButton className="pill-login" />
          )}
        </div>

        {/* ── Mobile pill ──────────────────────────────────────────── */}
        <div className={`nav-pill mobile-pill ${scrolled ? "scrolled" : "at-top"}`}>
          <button className="pill-brand" onClick={() => handleScrollToSection("main")} aria-label="Home">
            <svg width="18" height="18" viewBox="0 0 80 75" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="m31.83,52.51667l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82l0,0zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02l0,0z" />
            </svg>
            <span className="pill-brand-text">Swadhyay</span>
          </button>

          {!mobileMenuOpen && (
            <button
              className="pill-hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile full-screen menu ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          ref={mobileMenuRef}
          onClick={(e) => { if (e.target === e.currentTarget) setMobileMenuOpen(false); }}
        >
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <button className="pill-brand" onClick={() => { handleScrollToSection("main"); setMobileMenuOpen(false); }}>
                <svg width="20" height="20" viewBox="0 0 80 75" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="m31.83,52.51667l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82l0,0zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02l0,0z" />
                </svg>
                <span style={{ fontFamily: "var(--font-primary)", fontWeight: 600, fontSize: "1rem", color: "var(--text-secondary)" }}>Swadhyay</span>
              </button>
              <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">×</button>
            </div>

            <div className="mobile-menu-content">
              <div className="mobile-menu-section">
                <div className="mobile-menu-section-title">About</div>
                {aboutDropdownItems.map((item, i) => (
                  <button key={i} className="mobile-menu-subitem" onClick={() => handleDropdownItemClick(item)}>
                    {item.label}
                  </button>
                ))}
              </div>

              <button className="mobile-menu-item" onClick={() => { handleProtectedClick(); }}>Schedule</button>

              <div className="mobile-menu-section">
                <div className="mobile-menu-section-title">Learning</div>
                {learningDropdownItems.map((item, i) => (
                  <button key={i} className="mobile-menu-subitem" onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}>
                    {item.label}
                  </button>
                ))}
              </div>

              <Link className="mobile-menu-item" to="/booking" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>

              {user?.picture ? (
                <div className="mobile-menu-user">
                  <div className="mobile-user-info">
                    <img src={user.picture} alt="Profile" className="mobile-profile-pic" referrerPolicy="no-referrer" loading="eager" decoding="sync" />
                    <span className="mobile-user-name">{user.name.split(" ")[0]}</span>
                  </div>
                  {user.role === "admin" && (
                    <button className="mobile-menu-item" onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>Admin Panel</button>
                  )}
                  <button className="mobile-menu-item logout-item" onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <div className="mobile-menu-auth">
                  <button className="mobile-login-btn" onClick={() => { login(); setMobileMenuOpen(false); }}>Login</button>
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
