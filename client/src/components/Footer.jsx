import React from 'react';
import Link from 'react';
import '../styles/Footer.css'; // We will create this CSS file next

const Footer = () => {
 return (
  <footer className="footer-container" id="contact">
 <div className="footer-content">
  <div className="footer-section about">
 <h3 className="footer-logo">Swadhyay</h3>
 <p>
  A space for self-discovery and growth. We are dedicated to helping you unlock your potential and live a more authentic, fulfilling life.
 </p>
  </div>

  <div className="footer-section links">
 <h3>Quick Links</h3>
 <ul>
  <li><a href="/">Home</a></li>
  <li><a href="/courses">Courses</a></li>
  <li><a href="/articles">Articles</a></li>
  <li><a href="/booking">Booking</a></li>
 </ul>
  </div>

        {/* --- NEW CERTIFICATIONS SECTION --- */}
        <div className="footer-section certifications">
          <h3>Certifications</h3>
          <ul>
            <li>Professional Certified Coach </li>
            <li>Advanced Coaching - Coacharya</li>
            <li>EMCC Global Member</li>
            <li>Team Coaching - TPRG</li>
            <li>Asia Pacific Alliance of Coaches</li>
        
          </ul>
        </div>

  <div className="footer-section contact ">
<h3>Contact Us</h3>
 <ul>
 <li> nehasharma@swadhyay.com</li>
 <li><a href="https://www.linkedin.com/in/neha-sharma-00b69565?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" >Linkedin</a></li>
 <li> <a href="mailto:nehasharma@swadhyay.co" >Mail</a></li>
 </ul>
  </div>
 </div>
 <div className="footer-bottom">
  &copy; {new Date().getFullYear()} Swadhyay | All Rights Reserved
 </div>
  </footer>
 );
};

export default Footer;
