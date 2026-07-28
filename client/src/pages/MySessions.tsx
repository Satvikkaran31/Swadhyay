import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useUser } from '../context/UserProvider';
import '../styles/MySessions.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Session {
  id: number;
  session_type: string;
  meeting_type?: string;
  session_start: string;
  meet_link?: string;
  cancelled_at?: string;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function sessionStatus(s: Session): 'upcoming' | 'past' | 'cancelled' {
  if (s.cancelled_at) return 'cancelled';
  return new Date(s.session_start) > new Date() ? 'upcoming' : 'past';
}

export default function MySessions() {
  const { user, loading: authLoading } = useUser();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/booking');
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/calendar/my-sessions`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const cancelSession = async (id: number) => {
    setCancelling(id);
    try {
      const res = await fetch(`${API}/api/calendar/bookings/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setSessions(prev => prev.map(s =>
          s.id === id ? { ...s, cancelled_at: new Date().toISOString() } : s
        ));
      }
    } finally {
      setCancelling(null);
      setConfirmId(null);
    }
  };

  const upcoming = sessions.filter(s => sessionStatus(s) === 'upcoming');
  const past = sessions.filter(s => sessionStatus(s) === 'past');
  const cancelled = sessions.filter(s => sessionStatus(s) === 'cancelled');

  if (authLoading || loading) {
    return (
      <div className="main">
        <Navbar />
        <div className="my-sessions-status">Loading your sessions…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="main">
      <Navbar />
      <div className="my-sessions-hero">
        <h1>My Sessions</h1>
        <p>Your coaching sessions with Neha</p>
      </div>
      <div className="my-sessions-page">
        {sessions.length === 0 ? (
          <div className="my-sessions-status">
            <p>You haven't booked any sessions yet.</p>
            <Link to="/booking" className="my-sessions-book-btn">Book a Session</Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <p className="my-sessions-group-title">Upcoming</p>
                <div className="my-sessions-list">
                  {upcoming.map(s => (
                    <div key={s.id} className="my-session-card">
                      <div className="my-session-card-left">
                        <div className="session-type">{s.session_type}</div>
                        <div className="session-time">{formatDateTime(s.session_start)}</div>
                        <div className="session-badges">
                          <span className="session-badge upcoming">Upcoming</span>
                          {s.meeting_type && <span className="session-badge past">{s.meeting_type}</span>}
                        </div>
                      </div>
                      <div className="my-session-card-actions">
                        {s.meet_link && (
                          <a href={s.meet_link} target="_blank" rel="noopener noreferrer" className="session-meet-btn">
                            Join Meet
                          </a>
                        )}
                        {confirmId === s.id ? (
                          <>
                            <button
                              className="session-cancel-btn"
                              onClick={() => cancelSession(s.id)}
                              disabled={cancelling === s.id}
                            >
                              {cancelling === s.id ? 'Cancelling…' : 'Confirm cancel'}
                            </button>
                            <button
                              className="session-cancel-btn"
                              style={{ borderColor: '#d1d5db', color: '#6b7280' }}
                              onClick={() => setConfirmId(null)}
                            >
                              Keep
                            </button>
                          </>
                        ) : (
                          <button className="session-cancel-btn" onClick={() => setConfirmId(s.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <p className="my-sessions-group-title">Past</p>
                <div className="my-sessions-list">
                  {past.map(s => (
                    <div key={s.id} className="my-session-card">
                      <div className="my-session-card-left">
                        <div className="session-type">{s.session_type}</div>
                        <div className="session-time">{formatDateTime(s.session_start)}</div>
                        <div className="session-badges">
                          <span className="session-badge past">Completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cancelled.length > 0 && (
              <>
                <p className="my-sessions-group-title">Cancelled</p>
                <div className="my-sessions-list">
                  {cancelled.map(s => (
                    <div key={s.id} className="my-session-card cancelled">
                      <div className="my-session-card-left">
                        <div className="session-type">{s.session_type}</div>
                        <div className="session-time">{formatDateTime(s.session_start)}</div>
                        <div className="session-badges">
                          <span className="session-badge cancelled-badge">Cancelled</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
