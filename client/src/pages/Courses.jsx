import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import wip_image from "../assets/wip.png";
import "../styles/Courses.css";

export default function Courses() {
    return(
        
        <div className="main">
            <Navbar />
            <div className="wip-container">
      <div className="wip-content">
        <h1 className="wip-text">Work in Progress!</h1>
        <p className="wip-subtext">This page is currently under construction. Please check back soon!</p>
        <img 
          src={wip_image}
          alt="A stylized illustration of a construction site" 
          className="wip-image"
        />
        
      </div>
    </div>
        <Footer />
        </div>
    );
}