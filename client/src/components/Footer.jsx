import React from 'react';
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
            <li><a href="/our-mission">Our Mission</a></li>
            <li><a href="/courses">Courses</a></li>
            <li><a href="/articles">Articles</a></li>
            <li><a href="/booking">Booking</a></li>
          </ul>
        </div>

        <div className="footer-section contact-info">
          <h3>Contact Us</h3>
          <ul>
          <li><i className="fa fa-envelope"></i> contact@swadhyay.com</li>
          <li><i className="fa fa-phone"></i> +91 12345 67890</li>
          <li><i className="fa fa-map-marker"></i> Noida, Uttar Pradesh, India</li>
          </ul>
          <div className="socials">
            <a href="#"><i className="fa fa-linkedin"></i></a>
            <a href="#"><i className="fa fa-instagram"></i></a>
            <a href="#"><i className="fa fa-twitter"></i></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Swadhyay | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
