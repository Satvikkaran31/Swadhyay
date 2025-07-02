import React,{useRef} from "react";  
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Success from "./pages/Success";

export default function App() {
  const aboutRef = useRef(null);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home aboutRef={aboutRef} />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/success" element={<Success />} />
      </Routes>
      
    </Router>
  );
}
