import express from "express";
import crypto from "crypto";
import pool from "../utils/db.js";

const router = express.Router();

router.post("/razorpay", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Not configured — acknowledge so Razorpay doesn't keep retrying
    console.warn("RAZORPAY_WEBHOOK_SECRET not set — webhook events ignored");
    return res.status(200).json({ received: true });
  }

  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  if (!signature) return res.status(400).json({ error: "Missing signature" });

  // req.body is a raw Buffer (express.raw middleware applied in index.ts)
  const expectedHex = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body as Buffer)
    .digest("hex");

  const valid =
    signature.length === expectedHex.length &&
    crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedHex, "utf8")
    );

  if (!valid) return res.status(400).json({ error: "Invalid signature" });

  let payload: any;
  try {
    payload = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const event: string = payload?.event ?? "";

  try {
    if (event === "payment.failed") {
      const entity = payload?.payload?.payment?.entity;
      const orderId: string | undefined = entity?.order_id;
      if (orderId) {
        await pool.query(
          "UPDATE payment_orders SET status = 'failed' WHERE order_id = $1 AND status = 'created'",
          [orderId]
        );
      }
    } else if (event === "refund.created") {
      const entity = payload?.payload?.refund?.entity;
      const razorpayPaymentId: string | undefined = entity?.payment_id;
      if (razorpayPaymentId) {
        // Revoke enrollment so the user loses access
        await pool.query(
          "DELETE FROM enrollments WHERE payment_id = $1",
          [razorpayPaymentId]
        );
        // Mark the corresponding order as refunded
        await pool.query(
          "UPDATE payment_orders SET status = 'refunded' WHERE razorpay_payment_id = $1",
          [razorpayPaymentId]
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err?.message ?? err);
    res.status(500).end(); // 5xx causes Razorpay to retry
  }
});

export default router;
