import React, { useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import RazorpayButton from "./RazorpayButton";
import { UserContext } from "../context/UserContext";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import axios from "axios";

// 🌐 Use environment-aware API base
const apiBase = import.meta.env.PROD
  ? "https://swadhyay-pa3f.onrender.com"
  : "http://localhost:5000";

export default function Navbar({ aboutRef }) {
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const { user, setUser } = useContext(UserContext);
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

  const handleLogout = async () => {
    try {
      await axios.post(`${apiBase}/api/auth/logout`, {}, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("Error during logout:", err);
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
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
