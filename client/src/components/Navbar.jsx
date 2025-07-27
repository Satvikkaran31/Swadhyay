import  { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Link as ScrollLink, scroller } from "react-scroll";
import "../styles/Navbar.css";
import "../styles/NavbarHamburger.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useUser } from "../context/UserProvider";



export default function Navbar({ aboutRef }) { 
  // =============================================================================
  // STATE MANAGEMENT 
  // =============================================================================
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // =============================================================================
  // HOOKS AND REFS 
  // =============================================================================
  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const learningDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const observerRef = useRef(null);
  const login = useTriggerGoogleLogin(setUser);

  // =============================================================================
  // INITIALIZATION EFFECTS 
  // =============================================================================
  useEffect(() => {
    setIsClient(true);
  }, []);

  // =============================================================================
  // NAVIGATION HANDLERS 
  // =============================================================================
  /**
  
   * @param {string} sectionId - The ID of the section to scroll to on the home page.
   */
  const handleScrollToSection = (sectionId) => {
    setMobileMenuOpen(false); 
    if (location.pathname === "/") {
      // If on the home page, scroll smoothly
      scroller.scrollTo(sectionId, {
        duration: 800,
        delay: 0,
        smooth: 'easeInOutQuart',
        offset: -90, // Adjust for your fixed navbar height
      });
    } else {
      // If not on the home page, navigate to the home page and then scroll
      navigate(`/#${sectionId}`);
    }
  };
  
  // This effect handles scrolling when a user lands on the page with a hash
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        scroller.scrollTo(hash, {
          duration: 800,
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: -80,
        });
        // Clean the URL hash after scrolling
        history.replaceState(null, null, window.location.pathname);
      }, 100); // Delay to ensure the page has rendered
    }
  }, [location.pathname, location.hash]); // Depend on pathname as well

  // =============================================================================
  // ALL OTHER EFFECTS AND HANDLERS 
  // =============================================================================

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    };
    const handleTouchEnd = (e) => {
      setTimeout(() => {
        const active = document.activeElement;
        if (active && (active.tagName === 'BUTTON' || active.tagName === 'A')) {
          active.blur();
        }
      }, 10);
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleProtectedClick = () => {
    if (!user) {
      login();
    } else {
      setShowModal(true);
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shrinkThreshold = 150;
      const expandThreshold = 100;
      if (shrink) {
        if (currentScrollY < expandThreshold) {
          setShrink(false);
        }
      } else {
        if (currentScrollY > shrinkThreshold) {
          setShrink(true);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shrink]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target)) setAboutDropdownOpen(false);
      if (learningDropdownRef.current && !learningDropdownRef.current.contains(event.target)) setLearningDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) setMobileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  useEffect(() => {
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

  const isBookingPage = location.pathname !== "/";

  const aboutDropdownItems = [
    { label: "Our Mission", sectionId: "about-goal" },
    { label: "About Neha", sectionId: "about-content" },
    { label: "Contact Us", path:"/contact-us" },
  ];

  const learningDropdownItems = [
    { label: "Articles", path: "/articles" },
    { label: "Courses", path: "/courses" },
    { label: "Who Am I?", path: "/whoami" }
  ];

  const handleDropdownItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.sectionId) {
      handleScrollToSection(item.sectionId);
    }
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
  };

  const handleMobileItemClick = (action) => {
    if (typeof action === 'function') {
      action();
    }
    setMobileMenuOpen(false);
  };
  
  const handleAboutDropdown = (e) => {
    e.preventDefault();
    setAboutDropdownOpen(!aboutDropdownOpen);
    setLearningDropdownOpen(false);
  };

  const handleLearningDropdown = (e) => {
    e.preventDefault();
    setLearningDropdownOpen(!learningDropdownOpen);
    setAboutDropdownOpen(false);
  };

  const handleProfileDropdown = (e) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
    setAboutDropdownOpen(false);
    setLearningDropdownOpen(false);
  };

  const handleMouseEnter = (dropdownType) => {
    if (!isMobile) {
      switch (dropdownType) {
        case 'about': setAboutDropdownOpen(true); setLearningDropdownOpen(false); break;
        case 'learning': setLearningDropdownOpen(true); setAboutDropdownOpen(false); break;
        case 'profile': setDropdownOpen(true); setAboutDropdownOpen(false); setLearningDropdownOpen(false); break;
        default: break;
      }
    }
  };

  const handleMouseLeave = (dropdownType) => {
    if (!isMobile) {
      switch (dropdownType) {
        case 'about': setAboutDropdownOpen(false); break;
        case 'learning': setLearningDropdownOpen(false); break;
        case 'profile': setDropdownOpen(false); break;
        default: break;
      }
    }
  };

  const scrollLinkProps = {
    spy: true,
    smooth: true,
    offset: -80,
    duration: 500,
    className: "nav-link-btn",
    activeClass: "active",
    onClick: () => setMobileMenuOpen(false),
  };

 
  return (
    <>
       <nav className={`navbar ${shrink ? "shrink" : "expand"} ${isBookingPage ? "booking-bg" : ""}`}>
    <div className="nav-container">
     {!shrink && (
        
      <button className="nav-logo" onClick={() => handleScrollToSection("main")}>
              <svg width="50" height="50" viewBox="0 0 80 75" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="m31.83,52.51667l4.91,-3.63l0.87,1.13c2.22,2.87 4.64,5.02 7.26,6.44c2.59,1.4 5.41,2.1 8.45,2.1c2.82,0 5.44,-0.7 7.87,-2.08c2.49,-1.42 4.79,-3.57 6.92,-6.44l0.92,-1.24l12.76,10.64l-1.07,1.13c-3.49,3.67 -7.01,6.44 -10.56,8.29c-3.62,1.89 -7.28,2.83 -10.97,2.83c-5.51,0 -10.6,-1.45 -15.26,-4.36c-4.6,-2.87 -8.76,-7.15 -12.47,-12.84l-0.75,-1.15l1.12,-0.82l0,0zm24.21,-14.83l8.88,9.03l-9.95,9.75l-10.07,-10.34l10.15,-9.46l0.99,1.02l0,0z"/>
              </svg>
       <span className="logo-text">Swadhyay</span>
      </button>
     )}

          <div className="nav-links desktop-nav">
             <button className="nav-link-btn" onClick={() => handleScrollToSection("main")}>
            Home
            </button>
            
            <div className="nav-dropdown-wrapper" ref={aboutDropdownRef} onMouseEnter={() => handleMouseEnter('about')} onMouseLeave={() => handleMouseLeave('about')}>
              <button className={`nav-link-btn dropdown-trigger ${aboutDropdownOpen ? 'active' : ''}`} onClick={handleAboutDropdown}>
                About
                <svg className={`dropdown-arrow ${aboutDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {aboutDropdownOpen && (
                <div className="nav-dropdown-menu">
                  {aboutDropdownItems.map((item, index) => (
                    <button key={index} className="nav-dropdown-item" onClick={() => handleDropdownItemClick(item)} >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="nav-link-btn" onClick={handleProtectedClick}>Schedule</button>

            <div className="nav-dropdown-wrapper" ref={learningDropdownRef} onMouseEnter={() => handleMouseEnter('learning')} onMouseLeave={() => handleMouseLeave('learning')}>
              <button className={`nav-link-btn dropdown-trigger ${learningDropdownOpen ? 'active' : ''}`} onClick={handleLearningDropdown}>
                Learning
                <svg className={`dropdown-arrow ${learningDropdownOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {learningDropdownOpen && (
                <div className="nav-dropdown-menu">
                  {learningDropdownItems.map((item, index) => (
                    <button key={index} className="nav-dropdown-item" onClick={() => handleDropdownItemClick({ path: item.path })}>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link className="nav-link-btn" to="/booking" onClick={(e) => { if (!user) { e.preventDefault(); login(); } }}>
              Pricing
            </Link>

            {user && user.picture ? (
              <div className="nav-dropdown-wrapper pp" ref={dropdownRef} onMouseEnter={() => handleMouseEnter('profile')} onMouseLeave={() => handleMouseLeave('profile')}>
                <img src={user.picture} alt="Profile" className="profile-pic" onClick={handleProfileDropdown} referrerPolicy="no-referrer" loading="eager" decoding="sync" />
                {dropdownOpen && (
                  <div className="nav-dropdown-menu pp">
                    <button className="nav-dropdown-item" disabled style={{ fontWeight: "bold", cursor: "default" }}>{user.name.split(" ")[0]}</button>
                    <button className="nav-dropdown-item" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <LoginButton className="loginbutton" />
            )}
          </div>

          <div className="mobile-nav">
            {!mobileMenuOpen && (
              <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open mobile menu">
                <span className="hamburger-line"></span><span className="hamburger-line"></span><span className="hamburger-line"></span>
              </button>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" ref={mobileMenuRef}>
            <div className="mobile-menu">
              <div className="mobile-menu-header">
                 <button className="nav-link-btn" onClick={() => handleScrollToSection("main")}>
                  Home
                </button>
            
                <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close mobile menu">×</button>
                
              </div>

              <div className="mobile-menu-content">
                
                <div className="mobile-menu-section">
                  <div className="mobile-menu-section-title">About</div>
                  {aboutDropdownItems.map((item, index) => (
                    <button key={index} className="mobile-menu-subitem" onClick={() => handleDropdownItemClick(item)} >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <button className="mobile-menu-item" onClick={() => handleMobileItemClick(handleProtectedClick)}>Schedule</button>
                
                  <div className="mobile-menu-section">
                    <div className="mobile-menu-section-title">Learning</div>
                    {learningDropdownItems.map((item, index) => (
                      <button key={index} className="mobile-menu-subitem" onClick={() => navigate(item.path)}>{item.label}</button>
                    ))}
                  </div>
                
                <Link className="mobile-menu-item" to="/booking" onClick={(e) => { if (!user) { e.preventDefault(); login(); } setMobileMenuOpen(false); }}>Pricing</Link>
                {user && user.picture ? (
                  <div className="mobile-menu-user">
                    <div className="mobile-user-info">
                      <img src={user.picture} alt="Profile" className="mobile-profile-pic" referrerPolicy="no-referrer" loading="eager" decoding="sync" />
                      <span className="mobile-user-name">{user.name.split(" ")[0]}</span>
                    </div>
                    <button className="mobile-menu-item logout-item" onClick={handleLogout}>Logout</button>
                  </div>
                ) : (
                  <div className="mobile-menu-auth">
                    <button className="mobile-login-btn" onClick={() => handleMobileItemClick(login)}>Login</button>
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
