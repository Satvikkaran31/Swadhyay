import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import RazorpayButton from "./RazorpayButton";
import { UserContext } from "../context/UserContext";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import { useUser } from "../context/UserProvider"; // Use the new context hook

export default function Navbar({ aboutRef }) {
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  
  // Updated: Use the new context with logout function
  const { user, setUser, logout } = useUser();
  
  const dropdownRef = useRef(null);
  const location = useLocation();
  const observerRef = useRef(null);
  const login = useTriggerGoogleLogin(setUser);

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
  const scrollTo = (id) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav className={`navbar ${shrink ? "shrink" : "expand"}`}>
        <div className="nav-container">
          {!shrink && <h1 className="nav-logo">Swadhyaya</h1>}

          <div className="nav-links">
            <button className="nav-link-btn" onClick={() => scrollTo("main")}>
              Home
            </button>

            <button className="nav-link-btn" onClick={() => scrollTo("right-text")}>
              About
            </button>

            <Link
              to="/booking"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  login();
                }
              }}
            >
              Payment
            </Link>

            <button className="nav-link-btn" onClick={handleProtectedClick}>
              Book
            </button>

            {user && user.picture ? (
              <div className="profile-wrapper" ref={dropdownRef}>
                <img
                  src={user.picture}
                  alt="Profile"
                  className="profile-pic"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  referrerPolicy="no-referrer"
                />
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <p className="user-name">{user.name}</p>
                    <button onClick={handleLogout} className="logout-btn">
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