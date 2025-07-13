import React, { useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/RazorpayButton.css";
import { UserContext } from "../context/UserProvider";

export default function RazorpayButton({ amount, isProcessing, setIsProcessing }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

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

    setIsProcessing(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const { data: order } = await axios.post(
        `${API_BASE_URL}/api/payment/create-order`,
        {
          amount: parseInt(amount),
          currency: "INR",
          receipt: "receipt#" + Math.floor(Math.random() * 1000000),
        },
        {
          withCredentials: true,
        }
      );

      const options = {
        key: "rzp_test_xNknJHs70nXy23",
        amount: order.amount,
        currency: order.currency,
        name: "Swadhyaya",
        description: "Session Booking",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await axios.post(
            `${API_BASE_URL}/api/payment/verify`,
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
          name: user?.name || "Customer",
          email: user?.email || "customer@example.com",
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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing || !amount || parseFloat(amount) <= 0}
      className={`payment-button ${isProcessing ? "processing" : ""}`}
    >
      {isProcessing ? (
        <>
          <div className="spinner"></div>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <span>Complete Payment</span>
          <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </>
      )}
    </button>
  );
}
