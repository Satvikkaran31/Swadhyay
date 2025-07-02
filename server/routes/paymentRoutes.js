import express from "express";
import razorpay from "../utils/razorpay.js";
import crypto from "crypto";

const router = express.Router();

router.post("/create-order", async (req, res) => {
  const { amount, currency, receipt } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const hmac = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (hmac === razorpay_signature) {
    return res.status(200).json({ success: true, message: "Payment verified" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

export default router;
