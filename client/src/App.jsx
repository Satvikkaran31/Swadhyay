import React,{useRef} from "react";  
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Success from "./pages/Success";
import Articles from "./pages/Articles";
import Courses from "./pages/Courses";
import WhoAmI from "./pages/WhoAmI";
export default function App() {
  const aboutRef = useRef(null);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/success" element={<Success />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/whoami" element={<WhoAmI />}></Route>
      </Routes>
      
    </Router>
  );
}
