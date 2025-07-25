import React, { useRef, Suspense, lazy, useEffect } from "react";  
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";

// Lazy-load pages
const Booking = lazy(() => import("./pages/Booking"));
const Success = lazy(() => import("./pages/Success"));
const Articles = lazy(() => import("./pages/Articles"));
const Courses = lazy(() => import("./pages/Courses"));
const WhoAmI = lazy(() => import("./pages/WhoAmI"));
const Inquiry = lazy(() => import("./pages/Inquiry"));

// SEO hook for React 19
function useSEO({ title, description, path, keywords, noindex = false }) {
  useEffect(() => {
    // Update title
    document.title = title;
    
    // Update or create meta tags
    const updateMeta = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Update link tags
    const updateLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };
    
    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateLink('canonical', `https://swadhyay.co${path}`);
    
    // Open Graph tags
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', `https://swadhyay.co${path}`, true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:image', 'https://swadhyay.co/src/assets/hero-page-5.png', true);
    
    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', 'https://swadhyay.co/src/assets/hero-page-5.png');
    
    // Robots meta for private pages
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      // Remove noindex if it exists
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta && robotsMeta.content === 'noindex, nofollow') {
        robotsMeta.remove();
      }
    }
  }, [title, description, path, keywords, noindex]);
}

// SEO-enhanced route wrapper component
function SEORoute({ component: Component, title, description, path, keywords, noindex = false }) {
  useSEO({ title, description, path, keywords, noindex });
  return <Component />;
}

// Loading component with SEO fallback
function LoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  const aboutRef = useRef(null);

  // Add global structured data on app mount
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

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, []);

  return (
    <Router>
      <ScrollToTop />
        
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route 
              path="/" 
              element={
                <SEORoute
                  component={Home}
                  title="Swadhyay - Learning Platform for Self-Study & Education"
                  description="Discover courses, resources, and educational content to enhance your knowledge and skills. Start your learning journey with Swadhyay today."
                  path="/"
                  keywords="swadhyay, learning, education, self-study, courses, knowledge, skills, online learning"
                />
              } 
            />
            
            <Route 
              path="/courses" 
              element={
                <SEORoute
                  component={Courses}
                  title="Courses - Swadhyay Learning Platform"
                  description="Browse our comprehensive collection of courses designed for self-study and skill development. Find the perfect course for your learning goals."
                  path="/courses"
                  keywords="courses, online courses, education, learning, self-study, skill development"
                />
              } 
            />
            
            <Route 
              path="/articles" 
              element={
                <SEORoute
                  component={Articles}
                  title="Articles & Blog - Swadhyay"
                  description="Read insightful articles and blog posts about learning, education, and personal development. Stay updated with the latest educational content."
                  path="/articles"
                  keywords="articles, blog, education, learning tips, study guides, knowledge sharing"
                />
              } 
            />
            
            <Route 
              path="/booking" 
              element={
                <SEORoute
                  component={Booking}
                  title="Book a Session - Swadhyay"
                  description="Schedule your personalized learning session with our experts. Book now to start your educational journey."
                  path="/booking"
                  keywords="booking, schedule, learning session, consultation, education"
                />
              } 
            />
            
            <Route 
              path="/whoami" 
              element={
                <SEORoute
                  component={WhoAmI}
                  title="About Us - Who Am I | Swadhyay"
                  description="Learn about Swadhyay's mission, vision, and the team behind the learning platform. Discover our story and commitment to education."
                  path="/whoami"
                  keywords="about us, swadhyay team, mission, vision, education platform, learning"
                />
              } 
            />
            
            <Route 
              path="/contact-us" 
              element={
                <SEORoute
                  component={Inquiry}
                  title="Contact Us - Swadhyay"
                  description="Get in touch with the Swadhyay team. Send us your inquiries, feedback, or questions about our learning platform."
                  path="/contact-us"
                  keywords="contact, inquiry, feedback, questions, support, swadhyay"
                />
              } 
            />
            
            {/* Private page - no SEO indexing */}
            <Route 
              path="/booking/success" 
              element={
                <SEORoute
                  component={Success}
                  title="Booking Successful - Swadhyay"
                  description="Your booking has been confirmed successfully."
                  path="/booking/success"
                  keywords=""
                  noindex={true}
                />
              } 
            />
          </Routes>
        </Suspense>
      </Router>
 
  );
}