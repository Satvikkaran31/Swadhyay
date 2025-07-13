import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import cardSwipe from "../assets/card_swipe_animation.lottie";
import RazorpayButton from "../components/RazorpayButton";
import "../styles/Booking.css";

export default function Booking() {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <>
      
      <div className="booking-container">
          <Navbar />
          <div className="booking-form-section">
            <div className="payment-form">
              <div className="booking-header">
            <h1>Complete Your Booking</h1>
            <p>Enter the amount and proceed with secure payment.</p>
          </div>
              <div className="grid-container">
              <div className="left-grid">
              <div className="form-group">
                
                <label htmlFor="amount" className="form-label">
                  Amount (₹)
                </label>
                <div className="input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="amount-input"
                    disabled={isProcessing}
                  />
                </div>
                  
              </div>

              {/* Pass amount and isProcessing as props */}
              <RazorpayButton
                amount={amount}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
              </div>
              <div className="animation-section">
               
              
                 <DotLottieReact
                  src={cardSwipe}
                  loop
                  autoplay
                  className="card-animation"
                />
                </div>
              </div>
              <div className="security-info">
                <div className="security-badge">
                  <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Secure Payment</span>
                </div>
              </div>

            
            </div>
          </div>
      </div>
    </>
  );
}
