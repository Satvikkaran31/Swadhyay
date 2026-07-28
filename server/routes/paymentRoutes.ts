import express from "express";
import crypto from "crypto";
import validator from "validator";
import razorpay from "../utils/razorpay.js";
import pool from "../utils/db.js";
import mailer from "../utils/mailer.js";

const e = (s: string) => validator.escape(String(s));

const router = express.Router();

// All routes in this file are protected by ensureAuthenticated in index.js

router.post("/create-order", async (req, res) => {
  const { amount, currency, receipt, course_id } = req.body;
  const userId = req.session.user!.id;

  let resolvedAmount: number;

  if (course_id) {
    // Course payment: always use the server-stored price in paise — never trust the client amount
    try {
      const { rows } = await pool.query("SELECT price FROM courses WHERE id = $1", [course_id]);
      if (!rows.length) return res.status(404).json({ error: "Course not found" });
      resolvedAmount = rows[0].price; // already in paise
      if (resolvedAmount <= 0) return res.status(400).json({ error: "This course is free — no payment needed" });
    } catch {
      return res.status(500).json({ error: "Failed to verify course price" });
    }
  } else {
    // Session booking: user enters amount in rupees — convert to paise for Razorpay
    const rupees = parseInt(amount);
    if (!rupees || rupees <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }
    resolvedAmount = rupees * 100;
  }

  try {
    const order = await razorpay.orders.create({
      amount: resolvedAmount,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    // Record the order server-side so verify cannot be replayed with a different course_id
    await pool.query(
      `INSERT INTO payment_orders (order_id, user_id, course_id, amount, currency)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.id, userId, course_id || null, resolvedAmount, currency || "INR"]
    );

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
  } = req.body;

  // 1. Verify HMAC signature (timing-safe comparison prevents timing attacks)
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const sigBuf = Buffer.from(razorpay_signature ?? "", "hex");
  const signatureValid =
    expectedBuf.length === sigBuf.length &&
    crypto.timingSafeEqual(expectedBuf, sigBuf);

  if (!signatureValid) {
    return res.status(400).json({ success: false, error: "Invalid payment signature" });
  }

  // 2. Look up the order and atomically mark it completed + enroll in one transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row and fetch amount + course_id atomically
    const { rows: orderRows } = await client.query(
      "SELECT course_id, status, amount FROM payment_orders WHERE order_id = $1 AND user_id = $2 FOR UPDATE",
      [razorpay_order_id, req.session.user!.id]
    );
    if (!orderRows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: "Unknown order" });
    }
    if (orderRows[0].status === "completed") {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: "Order already processed" });
    }

    const course_id = orderRows[0].course_id;
    const amountPaise = orderRows[0].amount;

    await client.query(
      "UPDATE payment_orders SET status = 'completed', razorpay_payment_id = $2 WHERE order_id = $1",
      [razorpay_order_id, razorpay_payment_id]
    );

    if (course_id) {
      await client.query(
        `INSERT INTO enrollments (user_id, course_id, payment_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_id) DO NOTHING`,
        [req.session.user!.id, course_id, razorpay_payment_id]
      );
    }

    await client.query('COMMIT');

    // Send receipt email after commit (non-blocking — payment is already confirmed)
    if (course_id) {
      const { email, name } = req.session.user!;
      const amountRs = (amountPaise / 100).toLocaleString('en-IN');
      pool.query('SELECT title, slug FROM courses WHERE id = $1', [course_id])
        .then(courseRow => {
          if (!courseRow.rows[0]) return;
          const { title, slug } = courseRow.rows[0];
          const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
          const learnUrl = `${process.env.CLIENT_URL || 'https://swadhyay.co'}/courses/${e(slug)}/learn`;
          return mailer.sendMail({
            from: process.env.MAIL_USER as string,
            to: email,
            subject: `Payment receipt – ${e(title)}`,
            html: `
              <h2>Payment Confirmed</h2>
              <p>Hi ${e(name)},</p>
              <p>Thank you for your payment. Here is your receipt:</p>
              <table style="border-collapse:collapse;width:100%;max-width:480px">
                <tr><td style="padding:8px 0;color:#666">Course</td><td style="padding:8px 0;font-weight:600">${e(title)}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Amount paid</td><td style="padding:8px 0;font-weight:600">₹${e(amountRs)}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Date</td><td style="padding:8px 0">${e(date)}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Payment ID</td><td style="padding:8px 0;font-size:0.85em;color:#888">${e(razorpay_payment_id)}</td></tr>
              </table>
              <p style="margin-top:1.5rem">
                <a href="${learnUrl}"
                   style="background:#1A2B3C;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
                  Start Learning
                </a>
              </p>
              <p style="color:#888;font-size:0.85em">Keep this email as your proof of purchase.</p>
            `,
          });
        })
        .catch(err => console.error('Receipt email error:', err.message));
    }

    return res.status(200).json({ success: true, enrolled: Boolean(course_id) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('VERIFY_FAILED order=%s payment=%s', razorpay_order_id, razorpay_payment_id, err);
    return res.status(500).json({ success: false, error: "Payment recorded but enrollment failed. Our team will resolve this within 24 hours." });
  } finally {
    client.release();
  }
});

export default router;
