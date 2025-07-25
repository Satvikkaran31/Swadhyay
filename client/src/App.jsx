import React, { useRef, Suspense, lazy } from "react";  
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-load pages
const Home = lazy(() => import("./pages/Home"));
const Booking = lazy(() => import("./pages/Booking"));
const Success = lazy(() => import("./pages/Success"));
const Articles = lazy(() => import("./pages/Articles"));
const Courses = lazy(() => import("./pages/Courses"));
const WhoAmI = lazy(() => import("./pages/WhoAmI"));
const Inquiry = lazy(() => import("./pages/Inquiry"));

export default function App() {
  const aboutRef = useRef(null);

  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/success" element={<Success />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/whoami" element={<WhoAmI />} />
          <Route path="/contact-us" element={<Inquiry />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
