import React from "react";
import "../styles/TeamsBookingModal.css"; 

export default function TeamsBookingModal({ onClose }) {
  const bookingLink = import.meta.env.VITE_BOOKING_LINK;
  return (
    <div className="teams-modal-overlay" onClick={onClose}>
      <div className="teams-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="teams-modal-close" onClick={onClose}>✖</button>
        <h2 className="teams-modal-heading">Book a Session via Microsoft Bookings</h2>
        <div className="iframe-wrapper">
          <iframe
            src = {bookingLink}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            allowFullScreen
            title="Microsoft Bookings"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
