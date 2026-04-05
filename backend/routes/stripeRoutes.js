const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../db");
const authMiddleware = require("../middleware/auth");
require("dotenv").config();

// ─── CREATE CHECKOUT SESSION ──────────────────────────────────────────────────
router.post("/create-checkout", authMiddleware, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/visamates?success=true",
      cancel_url: "http://localhost:5173/visamates?cancelled=true",
      metadata: { user_id: req.user.id.toString() },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// ─── WEBHOOK ──────────────────────────────────────────────────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.user_id;

    db.query(
      `INSERT INTO subscriptions (user_id, stripe_customer_id, status, current_period_end)
       VALUES (?, ?, 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR))
       ON DUPLICATE KEY UPDATE status='active', current_period_end=DATE_ADD(NOW(), INTERVAL 1 YEAR)`,
      [userId, session.customer]
    );

    db.query("UPDATE users SET is_premium = TRUE WHERE id = ?", [userId]);
  }

  res.json({ received: true });
});

// ─── CHECK STATUS ─────────────────────────────────────────────────────────────
router.get("/status", authMiddleware, (req, res) => {
  db.query(
    "SELECT is_premium FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ is_premium: results[0]?.is_premium || false });
    }
  );
});

// ─── ACTIVATE PREMIUM (demo/testing only) ────────────────────────────────────
router.post("/activate-premium", authMiddleware, (req, res) => {
  db.query(
    "UPDATE users SET is_premium = TRUE WHERE id = ?",
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });

      db.query(
        `INSERT INTO subscriptions (user_id, status, current_period_end)
         VALUES (?, 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR))
         ON DUPLICATE KEY UPDATE status='active', current_period_end=DATE_ADD(NOW(), INTERVAL 1 YEAR)`,
        [req.user.id]
      );

      res.json({ message: "Premium activated!" });
    }
  );
});

// ─── CANCEL ───────────────────────────────────────────────────────────────────
router.post("/cancel", authMiddleware, (req, res) => {
  db.query(
    "UPDATE users SET is_premium = FALSE WHERE id = ?",
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      db.query(
        "UPDATE subscriptions SET status='cancelled' WHERE user_id=?",
        [req.user.id]
      );
      res.json({ message: "Cancelled" });
    }
  );
});

module.exports = router;