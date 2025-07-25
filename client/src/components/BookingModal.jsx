import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserProvider";
import axios from "axios";
import "../styles/BookingModal.css";
import TeamsBookingModal from "./TeamsBookingModal";

export default function BookingModal({ onClose }) {
 const { user } = useContext(UserContext);

 const [form, setForm] = useState({
  name: "",
  email: "",
    occupation: "", // New field
    organization: "", // New field
  date: "",
  time: "",
  sessionType: "one-on-one",
  meetingType: "google",
 });

 const [loading, setLoading] = useState(false);
 const [showTeamsModal, setShowTeamsModal] = useState(false);
 const [availableSlots, setAvailableSlots] = useState([]);
 const [slotsError, setSlotsError] = useState(null);

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
  setForm({ ...form, date: selectedDate, time: "" }); // Reset time when date changes
  setSlotsError(null);
  setAvailableSlots([]);

  try {
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
   const res = await axios.get(
  `${API_BASE_URL}/api/availability?date=${selectedDate}`,
   { withCredentials: true }
   );
   setAvailableSlots(res.data.slots || []);
  } catch (err) {
   console.error("Failed to load slots:", err);
   setSlotsError("Could not load available slots.");
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
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
   await axios.post(
    `${API_BASE_URL}/api/calendar/book`,
    form,
    { withCredentials: true }
   );
   alert("Session booked! A meeting link has been sent to your email.");
   onClose();
  } catch (err) {
   alert("Booking failed. Please try again.");
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="modal-overlay" onClick={onClose}>
   <div className="modal-container" onClick={(e) => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}>
     ✖
    </button>
    <h2>Schedule a Session</h2>
    <form onSubmit={handleSubmit}>
          {/* --- Grouped fields into rows for better layout --- */}
          <div className="form-row">
            <input
              type="text"
              name="name"
              value={form.name}
              placeholder="Your Name"
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              placeholder="Email"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <select
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select your occupation</option>
              <option value="Working Professional">Working Professional</option>
              <option value="Student">Student</option>
              <option value="Women Professional">Women Professional</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              name="organization"
              value={form.organization}
              placeholder="Company / Institution"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleDateChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <select name="time" value={form.time} onChange={handleChange} required>
              <option value="" disabled>Select a time</option>
              {Array.isArray(availableSlots) && availableSlots.length === 0 && form.date && (
                <option disabled>— No slots available —</option>
              )}
              {Array.isArray(availableSlots) &&
                availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
            </select>
          </div>

     <select
      name="sessionType"
      value={form.sessionType}
      onChange={handleChange}
     >
      <option value="one-on-one">One-on-One Coaching</option>
      <option value="eft">EFT Coaching</option>
      <option value="group-coaching">Group Coaching</option>
     </select>

     <label>Meeting Platform:</label>
     <select
      name="meetingType"
      value={form.meetingType}
      onChange={handleChange}
     >
      <option value="google">Google Meet</option>
     </select>

     <button className="gmeet" type="submit" disabled={loading} >
      {loading ? "Processing..." : "Schedule on Gmeet"}
     </button>
     <span>OR</span>
     <button
      className="Teams"
      type="button"
      onClick={() => setShowTeamsModal(true)}
     >
       Schedule on Teams
     </button>

     {showTeamsModal && (
      <TeamsBookingModal onClose={() => setShowTeamsModal(false)} />
     )}
     {loading && <div className="loader"></div>}
     {slotsError && <p className="error">{slotsError}</p>}
    </form>
   </div>
  </div>
 );
}
