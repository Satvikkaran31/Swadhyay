import express from "express";
import crypto from "crypto";
import razorpay from "../utils/razorpay.js";
import pool from "../utils/db.js";

const router = express.Router();

// All routes in this file are protected by ensureAuthenticated in index.js

router.post("/create-order", async (req, res) => {
  const { amount, currency, receipt, course_id } = req.body;

  let resolvedAmount;

  if (course_id) {
    // For course payments, always use the server-stored price — never trust the client amount
    try {
      const { rows } = await pool.query("SELECT price FROM courses WHERE id = $1", [course_id]);
      if (!rows.length) return res.status(404).json({ error: "Course not found" });
      resolvedAmount = rows[0].price;
      if (resolvedAmount <= 0) return res.status(400).json({ error: "This course is free — no payment needed" });
    } catch {
      return res.status(500).json({ error: "Failed to verify course price" });
    }
  } else {
    // Session booking: user enters quoted amount — validate it's a positive integer
    resolvedAmount = parseInt(amount);
    if (!resolvedAmount || resolvedAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }
  }

  try {
    const order = await razorpay.orders.create({
      amount: resolvedAmount,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    });
    res.json(order);
  } catch {
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

/**
 * Verify Razorpay payment signature.
 * If course_id is provided, atomically creates an enrollment record.
 * This is the single source of truth for post-payment actions — the client
 * should never attempt enrollment separately after a payment.
 */
router.post("/verify", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    course_id,
  } = req.body;

  // 1. Verify HMAC signature
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, error: "Invalid payment signature" });
  }

  // 2. If this payment is for a course, create enrollment atomically
  if (course_id) {
    const userId = req.session.user.id;
    try {
      await pool.query(
        `INSERT INTO enrollments (user_id, course_id, payment_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_id) DO NOTHING`,
        [userId, course_id, razorpay_payment_id]
      );
    } catch (err) {
      // Payment is verified — money moved. Log for manual recovery, don't return failure.
      console.error(
        `ENROLLMENT_FAILED user=${userId} course=${course_id} payment=${razorpay_payment_id}`,
        err.message
      );
      return res.status(500).json({
        success: true,
        enrolled: false,
        error: "enrollment_failed",
        message: "Payment succeeded but we could not enroll you automatically. Our team will resolve this within 24 hours.",
      });
    }

    return res.status(200).json({ success: true, enrolled: true });
  }

  return res.status(200).json({ success: true, enrolled: false });
});

export default router;
