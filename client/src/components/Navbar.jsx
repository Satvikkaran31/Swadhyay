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

/**
 * Navbar Component - Responsive navigation with dropdowns and mobile menu
 * Features:
 * - Responsive design with desktop/mobile views
 * - Dropdown menus with hover (desktop) and click (mobile) support
 * - Smooth scrolling to sections
 * - User authentication integration
 * - Navbar shrinking effect on scroll
 * - Mobile-friendly touch handling
 */
export default function Navbar({ aboutRef }) {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  // Modal and dropdown states
  const [showModal, setShowModal] = useState(false); // Booking modal visibility
  const [dropdownOpen, setDropdownOpen] = useState(false); // User profile dropdown
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false); // About dropdown
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false); // Learning dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile hamburger menu
  
  // UI state
  const [shrink, setShrink] = useState(false); // Navbar shrink effect
  const [isClient, setIsClient] = useState(false); // Client-side rendering flag
  const [isMobile, setIsMobile] = useState(false); // Mobile device detection
  
  // =============================================================================
  // HOOKS AND REFS
  // =============================================================================
  
  // User context and navigation
  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();

  // Refs for dropdown click-outside detection
  const dropdownRef = useRef(null); // User profile dropdown
  const aboutDropdownRef = useRef(null); // About dropdown
  const learningDropdownRef = useRef(null); // Learning dropdown
  const mobileMenuRef = useRef(null); // Mobile menu
  
  // Navigation and scroll detection
  const location = useLocation();
  const observerRef = useRef(null); // Intersection observer for navbar shrink
  const login = useTriggerGoogleLogin(setUser);

  // =============================================================================
  // INITIALIZATION EFFECTS
  // =============================================================================
  
  /**
   * Set client-side flag to prevent hydration issues
   * This helps avoid SSR/CSR mismatches in Next.js applications
   */
  useEffect(() => {
    setIsClient(true);
  }, []);

  // =============================================================================
  // NAVIGATION HANDLERS
  // =============================================================================
  
  /**
   * Smooth scroll to a section by ID
   * Handles both same-page scrolling and cross-page navigation
   * @param {string} id - The element ID to scroll to
   */
  const scrollToSection = (id) => {
    if (location.pathname === "/") {
      // Same page: scroll directly to element
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Different page: navigate with hash
      navigate(`/#${id}`);
    }
    // Always close mobile menu after navigation
    setMobileMenuOpen(false);
  };

  // =============================================================================
  // MOBILE TOUCH HANDLING
  // =============================================================================
  
  /**
   * Enhanced touch handling to prevent stuck button states on mobile
   * This fixes the common issue where buttons remain in focus/active state
   * after being tapped on mobile devices
   */
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Remove any existing focus when touch starts
      // This prevents focus conflicts between touch and click events
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    };

    const handleTouchEnd = (e) => {
      // Force blur on touch end to prevent stuck focus states
      // Small timeout ensures the touch event completes before blur
      setTimeout(() => {
        const active = document.activeElement;
        if (active && (active.tagName === 'BUTTON' || active.tagName === 'A')) {
          active.blur();
        }
      }, 10);
    };

    // Add both touch events with passive flag for better performance
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // =============================================================================
  // DEVICE DETECTION
  // =============================================================================
  
  /**
   * Detect if device is mobile based on screen width
   * Updates isMobile state on window resize
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // =============================================================================
  // PROTECTED ROUTE HANDLERS
  // =============================================================================
  
  /**
   * Handle actions that require authentication
   * Shows login if user not authenticated, otherwise opens booking modal
   */
  const handleProtectedClick = (action) => {
    if (!user) {
      login(); // Trigger Google login
    } else {
      setShowModal(true); // Show booking modal
    }
    setMobileMenuOpen(false); // Close mobile menu
  };

  // =============================================================================
  // NAVBAR SHRINK EFFECT
  // =============================================================================
  
  /**
   * Navbar shrink effect based on scroll position
   * Uses Intersection Observer to detect when about section comes into view
   * Adjusts threshold based on device type for better UX
   */
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const screenWidth = window.innerWidth;
    const threshold = screenWidth < 768 ? 0.1 : 0.32; // Different thresholds for mobile/desktop

    if (location.pathname === "/" && aboutRef?.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          // Use requestAnimationFrame to batch DOM updates for better performance
          requestAnimationFrame(() => {
            setShrink(entry.isIntersecting);
          });
        },
        { threshold }
      );
      observerRef.current.observe(aboutRef.current);
    } else {
      setShrink(false); // Reset shrink state when not on home page
    }

    return () => observerRef.current?.disconnect();
  }, [aboutRef, location]);

  // =============================================================================
  // CLICK OUTSIDE HANDLING
  // =============================================================================
  
  /**
   * Close dropdowns and mobile menu when clicking outside
   * Handles multiple dropdown refs and mobile menu ref
   */
  useEffect(() => {
    function handleClickOutside(event) {
      // Close user profile dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      // Close about dropdown
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target)) {
        setAboutDropdownOpen(false);
      }
      // Close learning dropdown
      if (learningDropdownRef.current && !learningDropdownRef.current.contains(event.target)) {
        setLearningDropdownOpen(false);
      }
      // Close mobile menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // =============================================================================
  // ROUTE CHANGE EFFECTS
  // =============================================================================
  
  /**
   * Close mobile menu when route changes
   * Prevents menu from staying open during navigation
   */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * Handle hash-based navigation for smooth scrolling
   * Useful for direct links to sections (e.g., website.com/#about)
   */
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      // Use setTimeout to ensure DOM is ready after route change
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);

  // =============================================================================
  // BODY SCROLL MANAGEMENT
  // =============================================================================
  
  /**
   * Prevent body scroll when mobile menu is open
   * Uses class-based approach to avoid layout shift
   */
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [mobileMenuOpen]);

  // =============================================================================
  // AUTHENTICATION HANDLERS
  // =============================================================================
  
  /**
   * Handle user logout
   * Closes all dropdowns and mobile menu after logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  // =============================================================================
  // CONFIGURATION DATA
  // =============================================================================
  
  const isBookingPage = location.pathname === "/booking";

  // About dropdown menu items configuration
  const aboutDropdownItems = [
    { label: "Our Mission", onClick: () => scrollToSection("right-text") },
    { label: "About Us", onClick: () => scrollToSection("team") },
    { label: "Contact", onClick: () => scrollToSection("contact") }
  ];

  // Learning dropdown menu items configuration
  const learningDropdownItems = [
    { label: "Articles", onClick: () => console.log("Course Catalog") },
    { label: "Courses", onClick: () => console.log("Study Materials") },
    { label: "Who Am I?", onClick: () => console.log("Achievements") }
  ];

  // =============================================================================
  // DROPDOWN INTERACTION HANDLERS
  // =============================================================================
  
  /**
   * Handle dropdown item clicks
   * Executes the item's onClick function and closes all dropdowns
   */
  const handleDropdownItemClick = (item) => {
    item.onClick();
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
  };

  /**
   * Handle mobile menu item clicks
   * Executes the action and closes mobile menu
   */
  const handleMobileItemClick = (action) => {
    if (typeof action === 'function') {
      action();
    }
    setMobileMenuOpen(false);
  };

  // =============================================================================
  // DESKTOP DROPDOWN HANDLERS (Click-based)
  // =============================================================================
  
  /**
   * Handle About dropdown toggle
   * Only responds to clicks, prevents conflicts with hover on mobile
   */
  const handleAboutDropdown = (e) => {
    e.preventDefault();
    setAboutDropdownOpen(!aboutDropdownOpen);
    setLearningDropdownOpen(false); // Close other dropdown
  };

  /**
   * Handle Learning dropdown toggle
   * Only responds to clicks, prevents conflicts with hover on mobile
   */
  const handleLearningDropdown = (e) => {
    e.preventDefault();
    setLearningDropdownOpen(!learningDropdownOpen);
    setAboutDropdownOpen(false); // Close other dropdown
  };

  /**
   * Handle Profile dropdown toggle
   * Only responds to clicks, prevents conflicts with hover on mobile
   */
  const handleProfileDropdown = (e) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
  };

  // =============================================================================
  // DESKTOP HOVER HANDLERS (Mouse-based)
  // =============================================================================
  
  /**
   * Handle mouse enter for desktop hover effects
   * Only active on desktop devices to prevent conflicts with mobile touch
   */
  const handleMouseEnter = (dropdownType) => {
    if (!isMobile) {
      switch (dropdownType) {
        case 'about':
          setAboutDropdownOpen(true);
          setLearningDropdownOpen(false);
          break;
        case 'learning':
          setLearningDropdownOpen(true);
          setAboutDropdownOpen(false);
          break;
        case 'profile':
          setDropdownOpen(true);
          setAboutDropdownOpen(false);
          setLearningDropdownOpen(false);
          break;
      }
    }
  };

  /**
   * Handle mouse leave for desktop hover effects
   * Only active on desktop devices to prevent conflicts with mobile touch
   */
  const handleMouseLeave = (dropdownType) => {
    if (!isMobile) {
      switch (dropdownType) {
        case 'about':
          setAboutDropdownOpen(false);
          break;
        case 'learning':
          setLearningDropdownOpen(false);
          break;
        case 'profile':
          setDropdownOpen(false);
          break;
      }
    }
  };

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
            <div 
              className="nav-dropdown-wrapper" 
              ref={aboutDropdownRef}
              onMouseEnter={() => handleMouseEnter('about')}
              onMouseLeave={() => handleMouseLeave('about')}
            >
              <button 
                className={`nav-link-btn dropdown-trigger ${aboutDropdownOpen ? 'active' : ''}`}
                onClick={handleAboutDropdown}
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
            <div 
              className="nav-dropdown-wrapper" 
              ref={learningDropdownRef}
              onMouseEnter={() => handleMouseEnter('learning')}
              onMouseLeave={() => handleMouseLeave('learning')}
            >
              <button 
                className={`nav-link-btn dropdown-trigger ${learningDropdownOpen ? 'active' : ''}`}
                onClick={handleLearningDropdown}
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
              <div 
                className="nav-dropdown-wrapper pp" 
                ref={dropdownRef}
                onMouseEnter={() => handleMouseEnter('profile')}
                onMouseLeave={() => handleMouseLeave('profile')}
              >
                <img
                  src={user.picture}
                  alt="Profile"
                  className="profile-pic"
                  onClick={handleProfileDropdown}
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