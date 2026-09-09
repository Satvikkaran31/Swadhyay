import React, { Component, Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from "react-router-dom";

// The offline preview build is opened straight from a file:// index.html, where
// the History API can't push real paths — so it uses hash routing. The normal
// build keeps clean BrowserRouter URLs.
const Router = import.meta.env.VITE_DEMO ? HashRouter : BrowserRouter;
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop";
import WhatsAppFloat from "./components/WhatsAppFloat";
import LinkedInModal from "./components/LinkedInModal";
import Home from "./pages/Home";
import ArticleDetail from './pages/ArticleDetail';
import { useUser } from "./context/UserProvider";
import { track } from "./utils/analytics";

// Lazy-load pages
const Booking     = lazy(() => import("./pages/Booking"));
const Success     = lazy(() => import("./pages/Success"));
const Articles    = lazy(() => import("./pages/Articles"));
const Courses     = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Learn       = lazy(() => import("./pages/Learn"));
const MyLearning  = lazy(() => import("./pages/MyLearning"));
const MySessions  = lazy(() => import("./pages/MySessions"));
const Certificate = lazy(() => import("./pages/Certificate"));
const WhoAmI      = lazy(() => import("./pages/WhoAmI"));
const Inquiry     = lazy(() => import("./pages/Inquiry"));
const Admin        = lazy(() => import("./pages/Admin"));
const SeriesDetail = lazy(() => import("./pages/SeriesDetail"));
const SampleCourse = lazy(() => import("./pages/SampleCourse"));
const SampleSeries = lazy(() => import("./pages/SampleSeries"));
const Pricing      = lazy(() => import("./pages/Pricing"));
const SeriesListing = lazy(() => import("./pages/SeriesListing"));
const NotFound  = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// SEO hook for React 19
function useSEO({ title, description, path, keywords, noindex = false }) {
  useEffect(() => {
    document.title = title;

    const updateMeta = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (property) meta.setAttribute('property', name);
        else meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateLink('canonical', `https://swadhyay.co${path}`);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', `https://swadhyay.co${path}`, true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:image', 'https://swadhyay.co/og-cover.webp', true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', 'https://swadhyay.co/og-cover.webp');

    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta && (robotsMeta as HTMLMetaElement).content === 'noindex, nofollow') robotsMeta.remove();
    }
  }, [title, description, path, keywords, noindex]);
}

function SEORoute({ component: Component, title, description, path, keywords, noindex = false }) {
  useSEO({ title, description, path, keywords, noindex });
  return <Component />;
}

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', fontSize: '18px', color: 'var(--fg-muted)' }}>
      Loading…
    </div>
  );
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { crashed: boolean }> {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(err, info) { console.error('[ErrorBoundary]', err, info); }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--fg-mid)' }}>
          <p style={{ fontSize: 18 }}>Something went wrong. Please <a href="/" style={{ color: 'var(--teal)' }}>return home</a>.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fires a page_view on every client-side navigation. Anonymous visitors are
// recognised by a localStorage visitor_id; logged-in users resolve server-side.
function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    track("page_view", { path: location.pathname });
  }, [location.pathname]);
  return null;
}

function LinkedInGate() {
  const { user, loading, setUser } = useUser();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { setShow(false); return; }
    if (user.linkedin_url != null) { setShow(false); return; }
    if (sessionStorage.getItem("li_modal_done")) { setShow(false); return; }
    setShow(true);
  }, [user, loading]);

  if (!show) return null;

  return (
    <LinkedInModal
      onDone={(linkedin_url) => {
        sessionStorage.setItem("li_modal_done", "1");
        setShow(false);
        if (user) setUser({ ...user, linkedin_url });
      }}
    />
  );
}

export default function App() {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Swadhyay",
      "url": "https://swadhyay.co",
      "description": "Learning platform for self-study and educational content",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://swadhyay.co/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, []);

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <AnalyticsTracker />
      <LinkedInGate />
      <ScrollToTop />
      <WhatsAppFloat />
      <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={
            <SEORoute component={Home}
              title="Swadhyay - Learning Platform for Self-Study & Education"
              description="Discover courses, resources, and educational content to enhance your knowledge and skills."
              path="/" keywords="swadhyay, learning, education, self-study, courses, knowledge, skills" />
          } />

          <Route path="/courses" element={
            <SEORoute component={Courses}
              title="Courses - Swadhyay Learning Platform"
              description="Browse our comprehensive collection of courses designed for self-study and skill development."
              path="/courses" keywords="courses, online courses, education, learning, self-study" />
          } />

          {/* CourseDetail and Learn have no Navbar — they render their own layout */}
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/courses/:slug/learn" element={<Learn />} />
          <Route path="/courses/:slug/certificate" element={<Certificate />} />

          {/* SeriesDetail handles its own SEO via the series title from the API response */}
          <Route path="/series/:slug" element={<SeriesDetail />} />

          <Route path="/my-sessions" element={
            <SEORoute component={MySessions}
              title="My Sessions - Swadhyay"
              description="View and manage your coaching sessions with Neha."
              path="/my-sessions" keywords="my sessions, coaching, bookings" noindex />
          } />

          <Route path="/my-learning" element={
            <SEORoute component={MyLearning}
              title="My Learning - Swadhyay"
              description="View your enrolled courses and continue learning."
              path="/my-learning" keywords="my courses, enrolled, learning progress" noindex />
          } />

          <Route path="/articles" element={
            <SEORoute component={Articles}
              title="Articles & Blog - Swadhyay"
              description="Read insightful articles about learning, education, and personal development."
              path="/articles" keywords="articles, blog, education, learning tips" />
          } />
          <Route path="/article/:slug" element={<ArticleDetail />} />

          <Route path="/booking" element={
            <SEORoute component={Booking}
              title="Book a Session - Swadhyay"
              description="Schedule your personalized learning session with our experts."
              path="/booking" keywords="booking, schedule, learning session, consultation" />
          } />

          <Route path="/whoami" element={
            <SEORoute component={WhoAmI}
              title="About — Swadhyay"
              description="Meet Neha, your ICF PCC-certified coach, and learn the meaning behind Swadhyay."
              path="/whoami" keywords="about, neha, coach, ICF, swadhyay" />
          } />

          <Route path="/contact-us" element={
            <SEORoute component={Inquiry}
              title="Contact Us - Swadhyay"
              description="Get in touch with the Swadhyay team."
              path="/contact-us" keywords="contact, inquiry, feedback, support" />
          } />

          <Route path="/booking/success" element={
            <SEORoute component={Success}
              title="Booking Successful - Swadhyay"
              description="Your booking has been confirmed."
              path="/booking/success" keywords="" noindex />
          } />

          {/* Admin — no SEO */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />

          {/* Series listing */}
          <Route path="/series" element={
            <SEORoute component={SeriesListing}
              title="Course Series — Swadhyay"
              description="Explore three curated series — Youth, Leadership &amp; Board, and Board Retreat."
              path="/series" keywords="series, course series, youth, leadership, coaching" />
          } />

          {/* Pricing */}
          <Route path="/pricing" element={
            <SEORoute component={Pricing}
              title="Pricing — Swadhyay"
              description="Simple, honest pricing for one-on-one coaching, EFT sessions and self-paced courses."
              path="/pricing" keywords="pricing, coaching fees, sessions, courses" />
          } />

          {/* Design previews — static sample pages with hardcoded data */}
          <Route path="/preview/course" element={<SampleCourse />} />
          <Route path="/preview/series" element={<SampleSeries />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Router>
  );
}
