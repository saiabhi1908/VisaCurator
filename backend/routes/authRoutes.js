const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../utils/mailer");
require("dotenv").config();

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── REGISTER: Step 1 — Send OTP ─────────────────────────────────────────────
router.post("/register/send-otp", async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if email already exists
  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store pending registration in otp_store table
    db.query(
      `INSERT INTO otp_store (email, otp, purpose, extra_data, expires_at)
       VALUES (?, ?, 'verify', ?, ?)
       ON DUPLICATE KEY UPDATE otp=VALUES(otp), extra_data=VALUES(extra_data), expires_at=VALUES(expires_at)`,
      [email, otp, JSON.stringify({ full_name, hashedPassword }), expiresAt],
      async (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        try {
          await sendOTPEmail(email, otp, "verify");
          res.json({ message: "OTP sent to your email" });
        } catch (e) {
          console.error("Email error:", e);
          res.status(500).json({ message: "Failed to send OTP email" });
        }
      }
    );
  });
});

// ─── REGISTER: Step 2 — Verify OTP ───────────────────────────────────────────
router.post("/register/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  db.query(
    "SELECT * FROM otp_store WHERE email = ? AND purpose = 'verify'",
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(400).json({ message: "No OTP found. Please register again." });

      const record = results[0];

      if (new Date() > new Date(record.expires_at)) {
        return res.status(400).json({ message: "OTP expired. Please register again." });
      }
      if (record.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      const extraData = typeof record.extra_data === 'string' 
  ? JSON.parse(record.extra_data) 
  : record.extra_data;
const { full_name, hashedPassword } = extraData;
      // Create the user
      db.query(
        "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
        [full_name, email, hashedPassword],
        (err, result) => {
          if (err) return res.status(500).json({ message: "Database error" });

          // Clean up OTP
          db.query("DELETE FROM otp_store WHERE email = ? AND purpose = 'verify'", [email]);

          const token = jwt.sign(
            { id: result.insertId, email, full_name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          res.json({
            token,
            user: { id: result.insertId, full_name, email, created_date: new Date() },
          });
        }
      );
    }
  );
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, created_date: user.created_date },
    });
  });
});

// ─── FORGOT PASSWORD: Step 1 — Send OTP ──────────────────────────────────────
router.post("/forgot-password/send-otp", (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  db.query("SELECT id FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) {
      return res.status(400).json({ message: "No account found with this email" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    db.query(
      `INSERT INTO otp_store (email, otp, purpose, expires_at)
       VALUES (?, ?, 'reset', ?)
       ON DUPLICATE KEY UPDATE otp=VALUES(otp), expires_at=VALUES(expires_at)`,
      [email, otp, expiresAt],
      async (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        try {
          await sendOTPEmail(email, otp, "reset");
          res.json({ message: "OTP sent to your email" });
        } catch (e) {
          console.error("Email error:", e);
          res.status(500).json({ message: "Failed to send OTP email" });
        }
      }
    );
  });
});

// ─── FORGOT PASSWORD: Step 2 — Verify OTP ────────────────────────────────────
router.post("/forgot-password/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  db.query(
    "SELECT * FROM otp_store WHERE email = ? AND purpose = 'reset'",
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(400).json({ message: "No OTP found" });

      const record = results[0];
      if (new Date() > new Date(record.expires_at)) {
        return res.status(400).json({ message: "OTP expired" });
      }
      if (record.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      res.json({ message: "OTP verified", verified: true });
    }
  );
});

// ─── FORGOT PASSWORD: Step 3 — Reset Password ────────────────────────────────
router.post("/forgot-password/reset", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  db.query(
    "SELECT * FROM otp_store WHERE email = ? AND purpose = 'reset'",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(400).json({ message: "No OTP found" });

      const record = results[0];
      if (new Date() > new Date(record.expires_at)) {
        return res.status(400).json({ message: "OTP expired" });
      }
      if (record.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [hashedPassword, email],
        (err) => {
          if (err) return res.status(500).json({ message: "Database error" });

          // Clean up OTP
          db.query("DELETE FROM otp_store WHERE email = ? AND purpose = 'reset'", [email]);

          res.json({ message: "Password reset successfully" });
        }
      );
    }
  );
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
router.get("/me", require("../middleware/auth"), (req, res) => {
  db.query(
    "SELECT id, full_name, email, created_date FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});

module.exports = router;