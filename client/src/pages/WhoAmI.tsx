import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import profileimage from '../assets/profilepicture.webp';
import FadeInSection from '../components/FadeInSection';
import '../styles/WhoAmI.css';

const CREDENTIALS = [
  { label: 'PCC', desc: 'Professional Certified Coach — ICF' },
  { label: 'Team Coach', desc: 'ICF Team Coach Credential — TPRG' },
  { label: 'EFT Master', desc: 'Master Practitioner, Emotional Freedom Technique' },
  { label: 'EMCC', desc: 'Global Member, European Mentoring & Coaching Council' },
  { label: 'IIM-A', desc: 'Advanced SHRM Programme, IIM Ahmedabad' },
];

const HIGHLIGHTS = [
  { number: '25+', label: 'Years in people engagement' },
  { number: '700+', label: 'Hours of coaching' },
  { number: '150+', label: 'CXOs & CEOs recruited' },
  { number: '30+', label: 'Country-level leaders coached' },
];

export default function WhoAmI() {
  return (
    <div className="main">
      <Navbar />

      {/* Hero */}
      <section className="whoami-hero">
        <FadeInSection>
          <div className="whoami-hero-inner">
            <div className="whoami-hero-text">
              <span className="whoami-eyebrow">About Neha</span>
              <h1>Coaching for Self-Mastery<br />and Elevated Leadership</h1>
              <p className="whoami-hero-lead">
                With over 25 years spanning executive search, coaching, and leadership development,
                Neha Sharma helps leaders unlock their fullest potential — from the inside out.
              </p>
            </div>
            <div className="whoami-hero-image">
              <img src={profileimage} alt="Neha Sharma" />
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Stats */}
      <section className="whoami-stats">
        {HIGHLIGHTS.map(h => (
          <div key={h.label} className="whoami-stat">
            <span className="whoami-stat-number">{h.number}</span>
            <span className="whoami-stat-label">{h.label}</span>
          </div>
        ))}
      </section>

      {/* Bio sections */}
      <section className="whoami-sections">
        <FadeInSection>
          <div className="whoami-section">
            <h2>Career Journey</h2>
            <p>
              Neha's career spans over 25 years across human resources, executive search, consulting,
              private equity, investment banking, and sustainable development. She was instrumental in
              evolving the Impact Practice from the ground up, recruiting and coaching over 30 country-level
              and 75 CXO-level professionals.
            </p>
            <p>
              She has led strategic talent initiatives across financial services, professional services,
              and advisory sectors, and curated a unique Board Workshop in collaboration with industry
              stalwarts to prepare first-time Board members and aspirants.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="whoami-section">
            <h2>Executive Coaching</h2>
            <p>
              Deeply passionate about leadership development, executive coaching, and ethical
              decision-making, Neha is a PCC-certified professional coach with over 700 hours of coaching
              experience. She has worked with senior leaders across sectors to support behavioural shifts,
              leadership effectiveness, and strategic impact.
            </p>
            <p>
              She is also a practitioner of Emotional Freedom Technique (EFT), which she uses to help
              clients release emotional blocks, reduce stress, and accelerate breakthroughs that
              conventional coaching alone may not reach.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="whoami-section">
            <h2>Mentorship & Teaching</h2>
            <p>
              Neha has served as guest faculty in Organizational Development at a leading business school
              in Delhi, and actively mentors emerging leaders through Jagriti Yatra — an initiative
              focused on social entrepreneurship. She has served as a Global Ethical Coach volunteer,
              bringing values-led coaching to a broader audience.
            </p>
          </div>
        </FadeInSection>

        {/* Credentials */}
        <FadeInSection>
          <div className="whoami-section">
            <h2>Credentials</h2>
            <div className="whoami-credentials">
              {CREDENTIALS.map(c => (
                <div key={c.label} className="whoami-credential-card">
                  <span className="whoami-cred-label">{c.label}</span>
                  <span className="whoami-cred-desc">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Philosophy */}
        <FadeInSection>
          <div className="whoami-quote-block">
            <blockquote>
              "Who looks outside, dreams. Who looks inside, awakens."
            </blockquote>
            <cite>— Carl Jung</cite>
            <p className="whoami-quote-body">
              "Swadhyay" — a Sanskrit word for self-study — is the philosophy at the heart of this work.
              I am passionate about working with leaders, professionals, women, and anyone ready to go
              through an inner process and discover their own selves. In other words, anyone who is
              ready for Swadhyay.
            </p>
          </div>
        </FadeInSection>
      </section>

      <Footer />
    </div>
  );
}
