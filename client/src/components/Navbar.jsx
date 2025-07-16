import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import "../styles/NavbarHamburger.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import RazorpayButton from "./RazorpayButton";
import { UserContext } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useUser } from "../context/UserProvider";
import { useNavigate } from "react-router-dom";

export default function Navbar({ aboutRef }) {
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();

  const dropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const learningDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const observerRef = useRef(null);
  const login = useTriggerGoogleLogin(setUser);

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToSection = (id) => {
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${id}`);
    }
    // Close mobile menu after navigation
    setMobileMenuOpen(false);
  };

  const handleProtectedClick = (action) => {
    if (!user) {
      login();
    } else {
      setShowModal(true);
    }
    setMobileMenuOpen(false);
  };

  // Navbar shrink effect on scroll to About
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const screenWidth = window.innerWidth;
    const threshold = screenWidth < 768 ? 0.1 : 0.32;

    if (location.pathname === "/" && aboutRef?.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          // Use requestAnimationFrame to batch DOM updates
          requestAnimationFrame(() => {
            setShrink(entry.isIntersecting);
          });
        },
        { threshold }
      );
      observerRef.current.observe(aboutRef.current);
    } else {
      setShrink(false);
    }

    return () => observerRef.current?.disconnect();
  }, [aboutRef, location]);

  // Close dropdowns and mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target)) {
        setAboutDropdownOpen(false);
      }
      if (learningDropdownRef.current && !learningDropdownRef.current.contains(event.target)) {
        setLearningDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    // Use class-based approach to prevent layout shift
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  // Smooth scroll to section by ID
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);

  const isBookingPage = location.pathname === "/booking";

  // About dropdown items
  const aboutDropdownItems = [
    { label: "Our Mission", onClick: () => scrollToSection("right-text") },
    { label: "About Us", onClick: () => scrollToSection("team") },
    { label: "Contact", onClick: () => scrollToSection("contact") }
  ];

  // Learning dropdown items
  const learningDropdownItems = [
    { label: "Articles", onClick: () => console.log("Course Catalog") },
    { label: "Courses", onClick: () => console.log("Study Materials") },
    { label: "Who Am I?", onClick: () => console.log("Achievements") }
  ];

  const handleDropdownItemClick = (item) => {
    item.onClick();
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
  };

  const handleMobileItemClick = (action) => {
    if (typeof action === 'function') {
      action();
    }
    setMobileMenuOpen(false);
  };

  // Determine if we should show mobile or desktop nav
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <>
      <nav className={`navbar ${shrink ? "shrink" : "expand"} ${isBookingPage ? "booking-bg" : ""}`}>
        <div className="nav-container">
          {/* Logo - always show when not shrunk */}
          {!shrink && (
            <button className="nav-logo" onClick={() => scrollToSection("main")}>
              Swadhyay
            </button>
          )}

          {/* Desktop Navigation */}
          <div className="nav-links desktop-nav">
            <button className="nav-link-btn" onClick={() => scrollToSection("main")}>
              Home
            </button>

            {/* About Dropdown */}
            <div className="nav-dropdown-wrapper" ref={aboutDropdownRef}   onMouseEnter={() => setAboutDropdownOpen(true)}
          onMouseLeave={() => setAboutDropdownOpen(false)}>
              <button 
                className={`nav-link-btn dropdown-trigger ${aboutDropdownOpen ? 'active' : ''}`}
              >
                About
                <svg 
                  className={`dropdown-arrow ${aboutDropdownOpen ? 'rotated' : ''}`}
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {aboutDropdownOpen && (
                <div className="nav-dropdown-menu">
                  {aboutDropdownItems.map((item, index) => (
                    <button
                      key={index}
                      className="nav-dropdown-item"
                      onClick={() => handleDropdownItemClick(item)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="nav-link-btn" onClick={handleProtectedClick}>
              Schedule
            </button>

            {/* Learning Dropdown */}
            <div className="nav-dropdown-wrapper" ref={learningDropdownRef}   onMouseEnter={() => setLearningDropdownOpen(true)}
            onMouseLeave={() => setLearningDropdownOpen(false)}>
              <button 
                className={`nav-link-btn dropdown-trigger ${learningDropdownOpen ? 'active' : ''}`}
               
              >
                Learning
                <svg 
                  className={`dropdown-arrow ${learningDropdownOpen ? 'rotated' : ''}`}
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {learningDropdownOpen && user && (
                <div className="nav-dropdown-menu">
                  {learningDropdownItems.map((item, index) => (
                    <button
                      key={index}
                      className="nav-dropdown-item"
                      onClick={() => handleDropdownItemClick(item)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link className="nav-link-btn"
              to="/booking"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  login();
                }
              }}
            >
              Pricing   
            </Link> 

            {/* User Profile or Login */}
            {user && user.picture ? (
              <div className="nav-dropdown-wrapper pp" ref={dropdownRef}  onMouseLeave={() => setDropdownOpen(false)}>
                <img
                  src={user.picture}
                  alt="Profile"
                  className="profile-pic"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="sync"
                />
                {dropdownOpen && (
                  <div className="nav-dropdown-menu pp">
                    <button
                      className="nav-dropdown-item"
                      disabled
                      style={{ fontWeight: "bold", cursor: "default" }}
                    >
                      {user.name.split(" ")[0]}
                    </button>
                    <button
                      className="nav-dropdown-item"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <LoginButton className="loginbutton" />
            )}
          </div>

          {/* Mobile Hamburger Button - Always reserve space */}
          <div className="mobile-nav">
            {!mobileMenuOpen && (
              <button 
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" ref={mobileMenuRef}>
            <div className="mobile-menu">
              <div className="mobile-menu-header">
                <button className="nav-logo mobile-logo" onClick={() => scrollToSection("main")}>
                  Swadhyay
                </button>
                <button 
                  className="mobile-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close mobile menu"
                >
                  ×
                </button>
              </div>

              <div className="mobile-menu-content">
                <button className="mobile-menu-item" onClick={() => scrollToSection("main")}>
                  Home
                </button>

                {/* About Section */}
                <div className="mobile-menu-section">
                  <div className="mobile-menu-section-title">About</div>
                  {aboutDropdownItems.map((item, index) => (
                    <button
                      key={index}
                      className="mobile-menu-subitem"
                      onClick={() => handleMobileItemClick(item.onClick)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <button className="mobile-menu-item" onClick={() => handleMobileItemClick(handleProtectedClick)}>
                  Schedule
                </button>

                {/* Learning Section */}
                {user && (
                  <div className="mobile-menu-section">
                    <div className="mobile-menu-section-title">Learning</div>
                    {learningDropdownItems.map((item, index) => (
                      <button
                        key={index}
                        className="mobile-menu-subitem"
                        onClick={() => handleMobileItemClick(item.onClick)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                <Link 
                  className="mobile-menu-item"
                  to="/booking"
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      login();
                    }
                    setMobileMenuOpen(false);
                  }}
                >
                  Pricing
                </Link>

                {/* User Section */}
                {user && user.picture ? (
                  <div className="mobile-menu-user">
                    <div className="mobile-user-info">
                      <img
                        src={user.picture}
                        alt="Profile"
                        className="mobile-profile-pic"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="sync"
                      />
                      <span className="mobile-user-name">{user.name.split(" ")[0]}</span>
                    </div>
                    <button className="mobile-menu-item logout-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="mobile-menu-auth">
                    <button className="mobile-login-btn" onClick={() => handleMobileItemClick(login)}>
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {showModal && <BookingModal onClose={() => setShowModal(false)} />}
    </>
  );
}