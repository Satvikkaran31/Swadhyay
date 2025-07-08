import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import "../styles/BookingModal.css";
import TeamsBookingModal from "./TeamsBookingModal";

export default function BookingModal({ onClose }) {
  const { user } = useContext(UserContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    sessionType: "one-on-one",
    meetingType: "google",
  });
  const [loading, setLoading] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Detect backend base URL
  const apiBase = import.meta.env.PROD
    ? "https://swadhyay-pa3f.onrender.com"
    : "http://localhost:5000";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [user]);

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setForm({ ...form, date: selectedDate });

    try {
      const res = await axios.get(`${apiBase}/api/availability?date=${selectedDate}`, {
        withCredentials: true,
      });
      setAvailableSlots(res.data.slots);
    } catch (err) {
      console.error("Failed to load slots:", err);
      setAvailableSlots([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.meetingType === "teams") {
      const base = import.meta.env.VITE_BOOKING_LINK;
      window.open(`${base}?`, "_blank");
      onClose();
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${apiBase}/api/book`, form, {
        withCredentials: true,
      });
      alert("Session booked! Meeting link sent to your email.");
      onClose();
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✖</button>
        <h2>Book a Session</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" value={form.name} placeholder="Your Name" onChange={handleChange} required />
          <input type="email" name="email" value={form.email} placeholder="Email" onChange={handleChange} required />

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleDateChange}
            min={new Date().toISOString().split("T")[0]}
            required
          />

          <select name="time" value={form.time} onChange={handleChange} required>
            <option value="">Select a time</option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>

          <select name="sessionType" value={form.sessionType} onChange={handleChange}>
            <option value="one-on-one">One-on-One Coaching</option>
            <option value="eft">EFT Coaching</option>
          </select>

          <label>Meeting Platform:</label>
          <select name="meetingType" value={form.meetingType} onChange={handleChange}>
            <option value="google">Google Meet</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Book Now"}
          </button>

          <span>OR</span>
          <button
            className="Teams"
            type="button"
            onClick={() => setShowTeamsModal(true)}
          >
            Book Teams
          </button>

          {showTeamsModal && (
            <TeamsBookingModal onClose={() => setShowTeamsModal(false)} />
          )}

          {loading && <div className="loader"></div>}
        </form>
      </div>
    </div>
  );
}
