import React, { useEffect, useRef, useState, useContext } from "react";
import {HashLink} from "react-router-hash-link";
import { Link,useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import BookingModal from "./BookingModal";
import LoginButton from "./LoginButton";
import RazorpayButton from "./RazorpayButton";
import { UserContext } from "../context/UserContext";
import { useTriggerGoogleLogin } from "../utils/googleLoginHelper";
import axios from "axios";

export default function Navbar({aboutRef}) {
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shrink, setShrink] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const observerRef = useRef(null);
  const login = useTriggerGoogleLogin(setUser)

  const handleProtectedClick = (action)=>{
    if(!user){
      login();
    }else{
      setShowModal(true);
    }
  }
  // Observe the about section
    useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    const screenWidth = window.innerWidth;
    const threshold = screenWidth < 768 ? 0.1 : 0.2; 

    if (location.pathname === "/" && aboutRef?.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => setShrink(entry.isIntersecting),
        { threshold: threshold }
      );
      observerRef.current.observe(aboutRef.current);
    } else {
      setShrink(false); 
    }

    return () => observerRef.current?.disconnect();
  }, [aboutRef, location]);


  // Close dropdown when clicking outside
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
    // Destroy session on the backend
    await axios.post("http://localhost:5000/api/auth/logout", {}, {
      withCredentials: true, // Make sure cookie is sent
    });
  } catch (err) {
    console.error("Error during logout:", err);
  }

  // Clear frontend state
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  setUser(null);
  setDropdownOpen(false);
};



  return (
    <>
    <nav
  className={`navbar ${shrink ? "shrink" : "expand"}`}>

        <div className="nav-container">
          {!shrink && <h1 className="nav-logo">Swadhyaya</h1>}

          <div className="nav-links">
            <HashLink smooth to="/#main">Home</HashLink>
            <HashLink smooth to="/#right-text">About</HashLink>
            <Link to='/booking' onClick={(e)=>{
              if(!user){e.preventDefault(); login()}}}>
              Payment
              </Link>
            <button className="nav-link-btn" onClick={() => handleProtectedClick()}>
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
