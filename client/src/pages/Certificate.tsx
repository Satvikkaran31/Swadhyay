import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserProvider';
import '../styles/Certificate.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Eligibility {
  eligible: boolean;
  completed: number;
  total: number;
  course_title: string;
  learner_name: string;
}

function today() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Certificate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate(`/courses/${slug}`);
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/courses/${slug}/certificate`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user, slug]);

  if (authLoading || loading) {
    return (
      <div className="certificate-page">
        <div className="certificate-actions">
          <button className="cert-btn secondary" onClick={() => navigate(`/courses/${slug}/learn`)}>← Back</button>
        </div>
        <p style={{ color: '#888' }}>Checking eligibility…</p>
      </div>
    );
  }

  if (!data?.eligible) {
    return (
      <div className="certificate-page">
        <div className="certificate-actions">
          <button className="cert-btn secondary" onClick={() => navigate(`/courses/${slug}/learn`)}>← Back</button>
        </div>
        <div className="certificate-not-eligible">
          <h2>Certificate not available yet</h2>
          <p>
            Complete all lessons to earn your certificate.
            {data && ` You've completed ${data.completed} of ${data.total} lessons.`}
          </p>
          <button className="cert-btn primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate(`/courses/${slug}/learn`)}>
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-page">
      <div className="certificate-actions">
        <button className="cert-btn secondary" onClick={() => navigate(`/courses/${slug}/learn`)}>← Back</button>
        <button className="cert-btn primary" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <div className="certificate" id="certificate">
        <div className="certificate-corner tl" />
        <div className="certificate-corner tr" />
        <div className="certificate-corner bl" />
        <div className="certificate-corner br" />

        <p className="cert-org">Swadhyay Coaching</p>
        <h1 className="cert-heading">Certificate of Completion</h1>
        <p className="cert-presents">This certifies that</p>
        <div className="cert-learner">{data.learner_name}</div>
        <p className="cert-body">has successfully completed the course</p>
        <div className="cert-course">{data.course_title}</div>
        <p className="cert-date">Issued on {today()}</p>

        <div className="cert-sig-row">
          <div className="cert-sig">
            <div className="cert-sig-line" />
            <div className="cert-sig-name">Neha Sharma</div>
            <div className="cert-sig-title">Executive Coach, Swadhyay</div>
          </div>
        </div>
      </div>
    </div>
  );
}
