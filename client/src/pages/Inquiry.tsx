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
    linkedin_url: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

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

  // rv-go entrance animation
  useEffect(() => {
    const t0 = document.timeline?.currentTime ?? 0;
    let tries = 0;
    const arm = () => {
      const t1 = document.timeline?.currentTime ?? 0;
      if (t1 > t0) { document.body.classList.add('rv-go'); return; }
      if (++tries < 8) requestAnimationFrame(arm);
    };
    requestAnimationFrame(arm);
    return () => { document.body.classList.remove('rv-go'); };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/contact-us`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        if (!user) {
          setFormData({ name: '', email: '', phone: '', linkedin_url: '', message: '' });
        } else {
          setFormData(prev => ({ ...prev, phone: '', linkedin_url: '', message: '' }));
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
    <>
      <Navbar />

      {/* Dark hero */}
      <section className="inq-hero sw-page-pad">
        <div className="rv inq-hero-inner">
          <span className="mono-label mono-label--light">reach out</span>
          <h1 className="inq-hero-h1">Get in touch</h1>
          <p className="inq-hero-sub">
            Questions, feedback, or just want to say hello — we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Cream body – 2-col */}
      <section className="inq-body sw-page-pad">
        <div className="inq-grid">

          {/* Left: info cards */}
          <div className="inq-left rv">
            <div className="inq-info-card">
              <span className="inq-info-icon">◎</span>
              <div>
                <div className="inq-info-title">Online sessions</div>
                <div className="inq-info-text">Connect from anywhere in the world</div>
              </div>
            </div>
            <div className="inq-info-card">
              <span className="inq-info-icon">✉</span>
              <div>
                <div className="inq-info-title">Quick responses</div>
                <div className="inq-info-text">We reply within 24 hours</div>
              </div>
            </div>
            <div className="inq-info-card">
              <span className="inq-info-icon">◈</span>
              <div>
                <div className="inq-info-title">Your privacy</div>
                <div className="inq-info-text">Everything you share stays confidential</div>
              </div>
            </div>
          </div>

          {/* Right: form card */}
          <div className="rv inq-form-wrap">
            <form className="inq-form" onSubmit={handleSubmit}>
              <h2 className="inq-form-title">Send a message</h2>

              <div className="inq-form-group">
                <label className="inq-label" htmlFor="name">Full Name *</label>
                <input
                  className="inq-input"
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

              <div className="inq-form-group">
                <label className="inq-label" htmlFor="email">Email Address *</label>
                <input
                  className="inq-input"
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  pattern="^[\w\.-]+@[\w\.-]+\.\w{2,}$"
                  required
                  placeholder="Enter your email address"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>

              <div className="inq-form-group">
                <label className="inq-label" htmlFor="phone">Phone Number</label>
                <input
                  className="inq-input"
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number (optional)"
                  disabled={isSubmitting}
                  maxLength={15}
                  pattern="[0-9+ -]{7,15}"
                  title="Phone number can include digits, spaces, dashes, or +"
                />
              </div>

              <div className="inq-form-group">
                <label className="inq-label" htmlFor="linkedin_url">LinkedIn Profile <span style={{ fontWeight: 400, color: "#999" }}>(optional)</span></label>
                <input
                  className="inq-input"
                  type="url"
                  id="linkedin_url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourname"
                  disabled={isSubmitting}
                  maxLength={300}
                />
              </div>

              <div className="inq-form-group">
                <label className="inq-label" htmlFor="message">Message *</label>
                <textarea
                  className="inq-textarea"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  minLength={10}
                  maxLength={1000}
                  disabled={isSubmitting}
                />
              </div>

              {submitStatus === 'success' && (
                <div className="inq-success">
                  <span>✓</span>
                  Thank you! We'll be in touch within 24 hours.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="inq-error-msg">
                  <span>!</span>
                  Please fill in all required fields, or try again if you already did.
                </div>
              )}

              <button
                type="submit"
                className="inq-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </div>

        </div>
      </section>

      <Footer compact />
    </>
  );
}
