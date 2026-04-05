const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth");

// All routes here require login
router.use(authMiddleware);

// GET all applications for logged-in user
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM visa_applications WHERE user_id = ? ORDER BY created_date DESC",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// CREATE a new application
router.post("/", (req, res) => {
  const {
    country, visa_type, purpose, status,
    risk_score, risk_details, user_profile,
    documents_checklist, current_step, notes
  } = req.body;

  db.query(
    `INSERT INTO visa_applications 
      (user_id, country, visa_type, purpose, status, risk_score, risk_details, user_profile, documents_checklist, current_step, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      country,
      visa_type,
      purpose,
      status || "draft",
      risk_score || null,
      risk_details ? JSON.stringify(risk_details) : null,
      user_profile ? JSON.stringify(user_profile) : null,
      documents_checklist ? JSON.stringify(documents_checklist) : null,
      current_step || 1,
      notes || null,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ id: result.insertId, message: "Application created" });
    }
  );
});

// UPDATE an application — now also saves user_profile and documents_checklist for resume support
router.put("/:id", (req, res) => {
  const {
    status, risk_score, risk_details,
    user_profile, documents_checklist,
    current_step, notes
  } = req.body;

  db.query(
    `UPDATE visa_applications 
     SET status=?, risk_score=?, risk_details=?, user_profile=?, documents_checklist=?, current_step=?, notes=?
     WHERE id=? AND user_id=?`,
    [
      status,
      risk_score || null,
      risk_details ? JSON.stringify(risk_details) : null,
      user_profile ? JSON.stringify(user_profile) : null,
      documents_checklist ? JSON.stringify(documents_checklist) : null,
      current_step || 1,
      notes || null,
      req.params.id,
      req.user.id,
    ],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Application updated" });
    }
  );
});

// DELETE an application
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM visa_applications WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Application deleted" });
    }
  );
});

module.exports = router;
