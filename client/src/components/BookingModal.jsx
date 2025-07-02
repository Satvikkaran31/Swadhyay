import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import "../styles/BookingModal.css";
import TeamsBookingModal from "./TeamsBookingModal";
import setShowModal from "../pages/Home"
export default function BookingModal({ onClose }) {
  const { user } = useContext(UserContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    sessionType: "one-on-one", // default
    meetingType: "google", // default
  });
  const [loading, setLoading] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
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
      const res = await axios.get(`http://localhost:5000/api/availability?date=${selectedDate}`);
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
    const res = await axios.post("http://localhost:5000/api/book", form, {
      withCredentials: true
    });
    alert("Session booked! Meeting link sent to your email.");
    onClose();
  } catch (err) {
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
          min={new Date().toISOString().split("T")[0]} // prevent past
          required
        />

        <select name="time" value={form.time} onChange={handleChange} required>
          <option value="">Select a time</option>
          {availableSlots.map((slot) => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>


          <select name="sessionType" value={form.sessionType}  placeholder="Session Type" onChange={handleChange}>
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
          <button className="Teams" onClick={() =>{ setShowTeamsModal(true);}} ><svg xmlns="http://www.w3.org/2000/svg" height="45" width="50" viewBox="-334.32495 -518.3335 2897.4829 3110.001"><path d="M1554.637 777.5h575.713c54.391 0 98.483 44.092 98.483 98.483v524.398c0 199.901-162.051 361.952-361.952 361.952h-1.711c-199.901.028-361.975-162-362.004-361.901V828.971c.001-28.427 23.045-51.471 51.471-51.471z" fill="#5059C9"/><circle r="233.25" cy="440.583" cx="1943.75" fill="#5059C9"/><circle r="336.917" cy="336.917" cx="1218.083" fill="#7B83EB"/><path d="M1667.323 777.5H717.01c-53.743 1.33-96.257 45.931-95.01 99.676v598.105c-7.505 322.519 247.657 590.16 570.167 598.053 322.51-7.893 577.671-275.534 570.167-598.053V877.176c1.245-53.745-41.268-98.346-95.011-99.676z" fill="#7B83EB"/><path d="M1244 777.5v838.145c-.258 38.435-23.549 72.964-59.09 87.598a91.856 91.856 0 01-35.765 7.257H667.613c-6.738-17.105-12.958-34.21-18.142-51.833a631.287 631.287 0 01-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52z" opacity=".1"/><path d="M1192.167 777.5v889.978a91.802 91.802 0 01-7.257 35.765c-14.634 35.541-49.163 58.833-87.598 59.09H691.975c-8.812-17.105-17.105-34.21-24.362-51.833-7.257-17.623-12.958-34.21-18.142-51.833a631.282 631.282 0 01-27.472-183.49V877.02c-1.246-53.659 41.198-98.19 94.855-99.52z" opacity=".2"/><path d="M1192.167 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855h-447.84A631.282 631.282 0 01622 1475.177V877.02c-1.246-53.659 41.198-98.19 94.855-99.52z" opacity=".2"/><path d="M1140.333 777.5v786.312c-.395 52.223-42.632 94.46-94.855 94.855H649.472A631.282 631.282 0 01622 1475.177V877.02c-1.246-53.659 41.198-98.19 94.855-99.52z" opacity=".2"/><path d="M1244 509.522v163.275c-8.812.518-17.105 1.037-25.917 1.037-8.812 0-17.105-.518-25.917-1.037a284.472 284.472 0 01-51.833-8.293c-104.963-24.857-191.679-98.469-233.25-198.003a288.02 288.02 0 01-16.587-51.833h258.648c52.305.198 94.657 42.549 94.856 94.854z" opacity=".1"/><path d="M1192.167 561.355v111.442a284.472 284.472 0 01-51.833-8.293c-104.963-24.857-191.679-98.469-233.25-198.003h190.228c52.304.198 94.656 42.55 94.855 94.854z" opacity=".2"/><path d="M1192.167 561.355v111.442a284.472 284.472 0 01-51.833-8.293c-104.963-24.857-191.679-98.469-233.25-198.003h190.228c52.304.198 94.656 42.55 94.855 94.854z" opacity=".2"/><path d="M1140.333 561.355v103.148c-104.963-24.857-191.679-98.469-233.25-198.003h138.395c52.305.199 94.656 42.551 94.855 94.855z" opacity=".2"/><linearGradient gradientTransform="matrix(1 0 0 -1 0 2075.333)" y2="394.261" x2="942.234" y1="1683.073" x1="198.099" gradientUnits="userSpaceOnUse" id="a"><stop offset="0" stopColor="#5a62c3"/><stop offset=".5" stopColor="#4d55bd"/><stop offset="1" stopColor="#3940ab"/></linearGradient><path d="M95.01 466.5h950.312c52.473 0 95.01 42.538 95.01 95.01v950.312c0 52.473-42.538 95.01-95.01 95.01H95.01c-52.473 0-95.01-42.538-95.01-95.01V561.51c0-52.472 42.538-95.01 95.01-95.01z" fill="url(#a)"/><path d="M820.211 828.193h-189.97v517.297h-121.03V828.193H320.123V727.844h500.088z" fill="#FFF"/></svg>
  Book Teams
</button>
     {showTeamsModal && <TeamsBookingModal onClose={() => setShowTeamsModal(false)} />}
          {loading && <div className="loader"></div>}
        </form>
      </div>
    </div>
  );
}
