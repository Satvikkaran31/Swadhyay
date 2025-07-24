import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserProvider';
import '../styles/Inquiry.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function Inquiry() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  // Pre-fill form data when user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
         
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/contact-us`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        if (!user) {
          setFormData({
            name: '',
            email: '',
            phone: '',
            message: ''
          });
        } else {
          setFormData(prev => ({
            ...prev,
            phone: '',
            message: ''
          }));
        }
      } else {
        throw new Error('Failed to send inquiry');
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='main-inquiry'>
    <Navbar />
    <section className="inquiry-section" id="inquiry">
      <div className="inquiry-container">
       
        
        <div className="inquiry-content">
             <div className="inquiry-header">
          <h2>Get in Touch</h2>
          <p>Have questions or want to learn more? Send us a message!</p>
        </div>
          <div className="inquiry-info">
            
            <div className="info-item">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
              </div>
              <div className="info-text">
                <h4>Location</h4>
                <p>Ready to connect from anywhere</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                </svg>
              </div>
              <div className="info-text">
                <h4>Quick Responses</h4>
                <p>We'll respond within 24 hours</p>
              </div>
            </div>

            <div className="info-item">
        <div className="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1.75a1 1 0 0 0-.5.13l-7 3.75a1 1 0 0 0-.5.87v6.5c0 6.16 6.2 9.28 7.53 9.86.3.13.64.13.94 0C13.8 22.28 20 19.16 20 13V6.5a1 1 0 0 0-.5-.87l-7-3.75a1 1 0 0 0-.5-.13z"/>
            </svg>
        </div>
        <div className="info-text">
            <h4>Your Privacy Matters</h4>
            <p>We keep your personal information safe and secure</p>
        </div>
</div>

          </div>

          <form className="inquiry-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number (optional)"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                placeholder="Tell us how we can help you..."
                rows="1"
                disabled={isSubmitting}
              />
            </div>
            <div className='inquiry-submit-button-wrapper'>
            <button 
              type="submit" 
              className={`inquiry-submit-btn ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Sending...
                </>
              ) : (
                'Contact Me'
              )}
            </button>
              </div>
            {submitStatus === 'success' && (
              <div className="submit-message success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
                Thank you! Your inquiry has been sent successfully. We'll get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="submit-message error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
                Sorry, there was an error sending your message. Please try again or contact us directly.
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
    <Footer />
    </div>
  );
};
