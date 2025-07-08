import React, { useState,useContext } from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/RazorpayButton.css"
import { UserContext } from "../context/UserProvider";
export default function RazorpayButton() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const loadRazorpay = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load");
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      // Step 1: Create Order on Backend
      console.log("User from context:", user);
      const { data: order } = await axios.post("http://localhost:5000/api/payment/create-order",
      {
        amount: parseInt(amount),
        currency: "INR",
        receipt: "receipt#" + Math.floor(Math.random() * 1000000),
      },
      {
          withCredentials: true, // make sure user is logged in
      } 
    );

      // Step 2: Launch Razorpay Checkout
      const options = {
        key: "rzp_test_xNknJHs70nXy23", // Replace with your test key
        amount: order.amount,
        currency: order.currency,
        name: "Swadhyaya",
        description: "Session Booking",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await axios.post("http://localhost:5000/api/payment/verify",
          {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          },
          {
            withCredentials: true,
          }
          );

          if (verifyRes.data.success) {
            navigate("/booking/success");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
        },
        theme: {
          color: "#2a9d8f",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment initiation failed");
    }
  };

  return (
    <>
    <div className="payment-section">
    <input
        type="number"
        placeholder="Enter amount (INR)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ padding: "0.5rem", marginRight: "1rem" }}
      />
    <div className="container">
      <button className="pay" onClick={handlePayment}>Pay Now</button>
    </div>
    </div>
    </>
  );
}
