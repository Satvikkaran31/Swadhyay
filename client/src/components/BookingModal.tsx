import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserProvider";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/BookingModal.css";

const SESSION_TYPES = [
  { value: "one-on-one", label: "1:1 Coaching", icon: "🌱" },
  { value: "eft", label: "EFT Coaching", icon: "🌿" },
  { value: "group-coaching", label: "Group Coaching", icon: "👥" },
];

function buildGCalUrl(date, time, sessionType, meetLink) {
  try {
    // Build start in IST, shift to UTC for the URL
    const startLocal = new Date(`${date}T${time}:00+05:30`);
    const endLocal = new Date(startLocal.getTime() + 60 * 60 * 1000);
    const fmt = (d) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const title = encodeURIComponent(`${sessionType} with Neha`);
    const details = encodeURIComponent(meetLink ? `Meet link: ${meetLink}` : "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startLocal)}/${fmt(endLocal)}&details=${details}`;
  } catch {
    return "https://calendar.google.com";
  }
}

export default function BookingModal({ onClose, initialSessionType = "one-on-one" }) {
  const { user } = useContext(UserContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    occupation: "",
    organization: "",
    date: "",
    time: "",
    sessionType: initialSessionType,
    meetingType: "google",
  });

  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);

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
    setForm({ ...form, date: selectedDate, time: "" });
    setSlotsError(null);
    setAvailableSlots([]);
    setSlotsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await axios.get(`${API_BASE_URL}/api/availability?date=${selectedDate}`);
      setAvailableSlots(res.data.slots || []);
    } catch (err) {
      console.error("Failed to load slots:", err);
      setSlotsError("Could not load available slots.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await axios.post(
        `${API_BASE_URL}/api/calendar/book`,
        form,
        { withCredentials: true }
      );

      const meetLink = res.data.meetLink;
      const gcalUrl = buildGCalUrl(form.date, form.time, form.sessionType, meetLink);
      setSuccessDetails({
        date: form.date,
        time: form.time,
        sessionType: form.sessionType,
        meetLink,
        gcalUrl,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Booking failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const bookingLink = import.meta.env.VITE_BOOKING_LINK;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Schedule a session"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {success && successDetails ? (
          <div className="booking-success">
            <div className="booking-success-icon-wrap">✅</div>
            <h3>Session booked!</h3>
            <p>
              <strong>{successDetails.sessionType}</strong> on{" "}
              <strong>{successDetails.date}</strong> at{" "}
              <strong>{successDetails.time}</strong>
            </p>
            <p>A confirmation email with the meeting link has been sent to you.</p>
            <div className="booking-success-actions">
              <a
                href={successDetails.gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gcal-link"
              >
                📅 Add to Google Calendar
              </a>
              <button className="success-close-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="modal-heading">Schedule a Session</h2>
            <form onSubmit={handleSubmit}>

              {/* Name + Email */}
              <div className="form-row">
                <div className="modal-field">
                  <label className="modal-label">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    placeholder="Full name"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    placeholder="you@example.com"
                    onChange={handleChange}
                    required
                    readOnly={!!user}
                    title={user ? "Your session is booked under your account email" : undefined}
                  />
                </div>
              </div>

              {/* Occupation + Organisation */}
              <div className="form-row">
                <div className="modal-field">
                  <label className="modal-label">Occupation</label>
                  <select
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select occupation</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Student">Student</option>
                    <option value="Women Professional">Women Professional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Company / Institution</label>
                  <input
                    type="text"
                    name="organization"
                    value={form.organization}
                    placeholder="Where you work or study"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Session type cards */}
              <div>
                <p className="modal-section-label">Session type</p>
                <div className="modal-session-type-cards">
                  {SESSION_TYPES.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      className={`session-card${form.sessionType === st.value ? " selected" : ""}`}
                      onClick={() => setForm({ ...form, sessionType: st.value })}
                      aria-pressed={form.sessionType === st.value}
                    >
                      <span className="session-card-icon">{st.icon}</span>
                      <span className="session-card-label">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="modal-field">
                <label className="modal-label">Preferred Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Time slots as pills */}
              <div>
                <p className="modal-section-label">Available time slots</p>
                {slotsLoading ? (
                  <div className="slots-loading">
                    <span className="slots-loading-spinner" />
                    Loading slots…
                  </div>
                ) : slotsError ? (
                  <p className="error">{slotsError}</p>
                ) : !form.date ? (
                  <p className="slots-empty">Pick a date to see available slots.</p>
                ) : availableSlots.length === 0 ? (
                  <p className="slots-empty">No slots available on this day.</p>
                ) : (
                  <div className="modal-slots-grid">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-pill${form.time === slot ? " selected" : ""}`}
                        onClick={() => setForm({ ...form, time: slot })}
                        aria-pressed={form.time === slot}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
                {/* Hidden required input to enforce slot selection */}
                <input
                  type="hidden"
                  name="time"
                  value={form.time}
                  required
                />
              </div>

              <button className="gmeet" type="submit" disabled={loading || !form.time}>
                {loading ? "Processing…" : "Schedule on Google Meet"}
              </button>

              {bookingLink && (
                <>
                  <div className="modal-divider">OR</div>
                  <button
                    className="Teams"
                    type="button"
                    onClick={() => window.open(bookingLink, "_blank", "noopener,noreferrer")}
                  >
                    📅 Schedule on Microsoft Teams
                  </button>
                </>
              )}

              {loading && <div className="loader" />}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
