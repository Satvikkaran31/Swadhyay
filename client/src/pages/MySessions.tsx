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

  // rv-go entrance animation
  useEffect(() => {
    const t0 = document.timeline?.currentTime ?? 0;
    requestAnimationFrame(() => {
      const t1 = document.timeline?.currentTime ?? 0;
      if (t1 > t0) { document.body.classList.add('rv-go'); return; }
      requestAnimationFrame(() => document.body.classList.add('rv-go'));
    });
    return () => { document.body.classList.remove('rv-go'); };
  }, []);

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

  return (
    <>
      <Navbar />

      <section className="ms-hero sw-page-pad">
        <div className="rv ms-hero-inner">
          <span className="mono-label mono-label--light">your schedule</span>
          <h1 className="ms-hero-h1">My Sessions</h1>
        </div>
      </section>

      <section className="ms-body sw-page-pad">
        <div className="ms-body-inner">
          {authLoading || loading ? (
            <div className="ms-status">
              <div className="ms-spinner" />
              <span>Loading your sessions…</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="ms-status">
              <p>You haven't booked any sessions yet.</p>
              <Link to="/booking" className="ms-book-btn">Book a Session</Link>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <p className="ms-group-title">Upcoming</p>
                  <div className="ms-list">
                    {upcoming.map(s => (
                      <div key={s.id} className="ms-card">
                        <div className="ms-card-left">
                          <div className="ms-session-type">{s.session_type}</div>
                          <div className="ms-session-time">{formatDateTime(s.session_start)}</div>
                          <div className="ms-session-badges">
                            <span className="ms-badge-upcoming">Upcoming</span>
                            {s.meeting_type && (
                              <span className="ms-badge-past">{s.meeting_type}</span>
                            )}
                          </div>
                        </div>
                        <div className="ms-card-actions">
                          {s.meet_link && (
                            <a
                              href={s.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ms-join-btn"
                            >
                              Join Meet
                            </a>
                          )}
                          {confirmId === s.id ? (
                            <>
                              <button
                                className="ms-cancel-confirm-btn"
                                onClick={() => cancelSession(s.id)}
                                disabled={cancelling === s.id}
                              >
                                {cancelling === s.id ? 'Cancelling…' : 'Confirm cancel'}
                              </button>
                              <button
                                className="ms-keep-btn"
                                onClick={() => setConfirmId(null)}
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              className="ms-cancel-btn"
                              onClick={() => setConfirmId(s.id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <p className="ms-group-title">Past</p>
                  <div className="ms-list">
                    {past.map(s => (
                      <div key={s.id} className="ms-card">
                        <div className="ms-card-left">
                          <div className="ms-session-type">{s.session_type}</div>
                          <div className="ms-session-time">{formatDateTime(s.session_start)}</div>
                          <div className="ms-session-badges">
                            <span className="ms-badge-past">Completed</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cancelled.length > 0 && (
                <div>
                  <p className="ms-group-title">Cancelled</p>
                  <div className="ms-list">
                    {cancelled.map(s => (
                      <div key={s.id} className="ms-card cancelled">
                        <div className="ms-card-left">
                          <div className="ms-session-type">{s.session_type}</div>
                          <div className="ms-session-time">{formatDateTime(s.session_start)}</div>
                          <div className="ms-session-badges">
                            <span className="ms-badge-cancelled">Cancelled</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
