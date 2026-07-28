import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserProvider";
import { useRazorpay } from "../hooks/useRazorpay";
import toast from "react-hot-toast";
import "../styles/RazorpayButton.css";

export default function RazorpayButton({ amount, isProcessing, setIsProcessing }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { initiatePayment } = useRazorpay();

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    setIsProcessing(true);

    await initiatePayment({
      amount: parseInt(amount),
      description: "Session Booking",
      user,
      onSuccess: () => {
        navigate("/booking/success");
      },
      onFailure: (message) => {
        if (message) toast.error(message);
      },
      onDismiss: () => {
        // User closed the modal — no action needed
      },
    });

    setIsProcessing(false);
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
          <span>Payment</span>
          <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </>
      )}
    </button>
  );
}
