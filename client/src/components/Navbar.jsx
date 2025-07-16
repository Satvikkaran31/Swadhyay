import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import RazorpayButton from "./RazorpayButton";
import { UserContext } from "../context/UserProvider";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useUser } from "../context/UserProvider"; // Use the new context hook
import { useNavigate } from "react-router-dom";

export default function Navbar({ aboutRef }) {
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  
  // Updated: Use the new context with logout function
  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();

  const dropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const learningDropdownRef = useRef(null);
  const location = useLocation();
  const observerRef = useRef(null);
  const login = useTriggerGoogleLogin(setUser);

  const scrollToSection = (id) => {
    if (location.pathname === "/") {
      // We're on home page, scroll directly
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // We're on a different page, navigate to home with hash
      navigate(`/#${id}`);
    }
  };

  const handleProtectedClick = (action) => {
    if (!user) {
      login();
    } else {
      setShowModal(true);
    }
  };

  // Navbar shrink effect on scroll to About
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const screenWidth = window.innerWidth;
    const threshold = screenWidth < 768 ? 0.1 : 0.2;

    if (location.pathname === "/" && aboutRef?.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => setShrink(entry.isIntersecting),
        { threshold }
      );
      observerRef.current.observe(aboutRef.current);
    } else {
      setShrink(false);
    }

    return () => observerRef.current?.disconnect();
  }, [aboutRef, location]);

  // Close dropdown on outside click
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Updated: Simplified logout using context method
  const handleLogout = async () => {
    try {
      await logout(); // This handles backend logout + local state clearing
      setDropdownOpen(false);
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  // Smooth scroll to section by ID
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
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

  return (
    <>
      <nav className={`navbar ${shrink ? "shrink" : "expand"} ${isBookingPage ? "booking-bg" : ""}`}>
        <div className="nav-container">
          {!shrink && <button className="nav-logo" onClick={()=> scrollToSection("main")}>Swadhyay</button>}

          <div className="nav-links">
            <button className="nav-link-btn" onClick={() => scrollToSection("main")}>
              Home
            </button>
            <button className="nav-link-btn" onClick={handleProtectedClick}>
              Session
            </button>
            {/* About Dropdown */}
            <div className="nav-dropdown-wrapper" ref={aboutDropdownRef}>
              <button 
                className={`nav-link-btn dropdown-trigger ${aboutDropdownOpen ? 'active' : ''}`}
                onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
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

            

            {/* Learning Dropdown */}
            <div className="nav-dropdown-wrapper" ref={learningDropdownRef}>
              <button 
                className={`nav-link-btn dropdown-trigger ${learningDropdownOpen ? 'active' : ''}`}
                onClick={() => {
                  if (!user) {
                    login();
                  } else {
                    setLearningDropdownOpen(!learningDropdownOpen);
                  }
                }}
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

            {user && user.picture ? (
  <div className="nav-dropdown-wrapper" ref={dropdownRef}>
    <img
      src={user.picture}
      alt="Profile"
      className="profile-pic"
      onClick={() => setDropdownOpen(!dropdownOpen)}
      referrerPolicy="no-referrer"
    />
              {dropdownOpen && (
                <div className="nav-dropdown-menu">
                  <button
                    className="nav-dropdown-item"
                    disabled
                    style={{ fontWeight: "bold", cursor: "default" }}
                  >
                    {user.name}
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
              <LoginButton />
            )}
          </div>
        </div>
      </nav>

      {showModal && <BookingModal onClose={() => setShowModal(false)} />}
    </>
  );
}