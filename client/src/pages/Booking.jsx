import React, { useState } from "react";
import axios from "axios";
import RazorpayButton from "../components/RazorpayButton";
import Navbar from "../components/Navbar";
export default function Booking() {

  return (
    <>
    <Navbar />
    <div style={{
      display:"flex",
      alignItems: "center",
      justifyContent: "center",
      transparency:"20%",
      overflow:"none"
    }}>
    <RazorpayButton />
    </div>
    </>
  );
}
