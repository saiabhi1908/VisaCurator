const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth");

// ─── SAVE TRAVEL PROFILE ──────────────────────────────────────────────────────
router.post("/profile", authMiddleware, (req, res) => {
  const { destination_country, visa_type, travel_date, interests, bio } = req.body;

  db.query(
    `INSERT INTO travel_profiles 
      (user_id, destination_country, visa_type, travel_date, interests, bio)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       destination_country=VALUES(destination_country),
       visa_type=VALUES(visa_type),
       travel_date=VALUES(travel_date),
       interests=VALUES(interests),
       bio=VALUES(bio)`,
    [
      req.user.id,
      destination_country,
      visa_type,
      travel_date || null,
      JSON.stringify(interests || []),
      bio || null,
    ],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Profile saved" });
    }
  );
});

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────
router.get("/profile/me", authMiddleware, (req, res) => {
  db.query(
    "SELECT * FROM travel_profiles WHERE user_id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results[0] || null);
    }
  );
});

// ─── GET MATCHES ──────────────────────────────────────────────────────────────
router.get("/matches", authMiddleware, (req, res) => {
  db.query(
    `SELECT 
       tp.*, 
       u.full_name,
       (
         SELECT COUNT(*) FROM connections c
         WHERE (c.sender_id = ? AND c.receiver_id = u.id)
            OR (c.sender_id = u.id AND c.receiver_id = ?)
       ) as connection_exists,
       (
         SELECT status FROM connections c
         WHERE (c.sender_id = ? AND c.receiver_id = u.id)
            OR (c.sender_id = u.id AND c.receiver_id = ?)
         LIMIT 1
       ) as connection_status
     FROM travel_profiles tp
     JOIN users u ON tp.user_id = u.id
     WHERE tp.user_id != ?
       AND tp.is_visible = TRUE
       AND tp.destination_country = (
         SELECT destination_country FROM travel_profiles WHERE user_id = ?
       )
       AND tp.visa_type = (
         SELECT visa_type FROM travel_profiles WHERE user_id = ?
       )
     ORDER BY (
       CASE WHEN tp.destination_country = (
         SELECT destination_country FROM travel_profiles WHERE user_id = ?
       ) THEN 3 ELSE 0 END +
       CASE WHEN tp.visa_type = (
         SELECT visa_type FROM travel_profiles WHERE user_id = ?
       ) THEN 2 ELSE 0 END
     ) DESC
     LIMIT 20`,
    [
      req.user.id, req.user.id,
      req.user.id, req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
    ],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ─── SEND CONNECTION REQUEST ──────────────────────────────────────────────────
router.post("/connect", authMiddleware, (req, res) => {
  const { receiver_id } = req.body;

  db.query(
    "INSERT IGNORE INTO connections (sender_id, receiver_id) VALUES (?, ?)",
    [req.user.id, receiver_id],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Connection request sent" });
    }
  );
});

// ─── RESPOND TO CONNECTION ────────────────────────────────────────────────────
router.put("/connect/:id", authMiddleware, (req, res) => {
  const { status } = req.body;

  db.query(
    "UPDATE connections SET status = ? WHERE id = ? AND receiver_id = ?",
    [status, req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: `Connection ${status}` });
    }
  );
});

// ─── GET MY CONNECTIONS (accepted) ───────────────────────────────────────────
router.get("/connections", authMiddleware, (req, res) => {
  db.query(
    `SELECT 
       c.*,
       CASE WHEN c.sender_id = ? THEN c.receiver_id ELSE c.sender_id END as other_user_id,
       u.full_name as other_name,
       (SELECT content FROM messages m 
        WHERE m.connection_id = c.id 
        ORDER BY m.created_date DESC LIMIT 1) as last_message,
       (SELECT created_date FROM messages m 
        WHERE m.connection_id = c.id 
        ORDER BY m.created_date DESC LIMIT 1) as last_message_time,
       (SELECT COUNT(*) FROM messages m 
        WHERE m.connection_id = c.id 
        AND m.sender_id != ? 
        AND m.is_read = FALSE) as unread_count
     FROM connections c
     JOIN users u ON u.id = CASE 
       WHEN c.sender_id = ? THEN c.receiver_id 
       ELSE c.sender_id END
     WHERE (c.sender_id = ? OR c.receiver_id = ?) 
       AND c.status = 'accepted'
     ORDER BY last_message_time DESC`,
    [
      req.user.id, req.user.id,
      req.user.id, req.user.id, req.user.id,
    ],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ─── GET PENDING REQUESTS ─────────────────────────────────────────────────────
router.get("/requests", authMiddleware, (req, res) => {
  db.query(
    `SELECT c.*, u.full_name as sender_name, 
     tp.destination_country, tp.visa_type, tp.bio
     FROM connections c
     JOIN users u ON c.sender_id = u.id
     LEFT JOIN travel_profiles tp ON tp.user_id = c.sender_id
     WHERE c.receiver_id = ? AND c.status = 'pending'
     ORDER BY c.created_date DESC`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(results);
    }
  );
});

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────
router.get("/messages/:connectionId", authMiddleware, (req, res) => {
  db.query(
    `SELECT * FROM connections 
     WHERE id = ? AND (sender_id = ? OR receiver_id = ?) AND status = 'accepted'`,
    [req.params.connectionId, req.user.id, req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) {
        return res.status(403).json({ message: "Not authorized" });
      }

      db.query(
        `UPDATE messages SET is_read = TRUE 
         WHERE connection_id = ? AND sender_id != ?`,
        [req.params.connectionId, req.user.id]
      );

      db.query(
        `SELECT m.*, u.full_name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.connection_id = ?
         ORDER BY m.created_date ASC`,
        [req.params.connectionId],
        (err, messages) => {
          if (err) return res.status(500).json({ message: "Database error" });
          res.json(messages);
        }
      );
    }
  );
});

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
router.post("/messages/:connectionId", authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  db.query(
    `SELECT * FROM connections 
     WHERE id = ? AND (sender_id = ? OR receiver_id = ?) AND status = 'accepted'`,
    [req.params.connectionId, req.user.id, req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) {
        return res.status(403).json({ message: "Not authorized" });
      }

      db.query(
        `INSERT INTO messages (connection_id, sender_id, content) 
         VALUES (?, ?, ?)`,
        [req.params.connectionId, req.user.id, content],
        (err, result) => {
          if (err) return res.status(500).json({ message: "Database error" });
          res.json({
            id: result.insertId,
            connection_id: parseInt(req.params.connectionId),
            sender_id: req.user.id,
            content,
            is_read: false,
            created_date: new Date(),
          });
        }
      );
    }
  );
});

// ─── POLL NEW MESSAGES ────────────────────────────────────────────────────────
router.get("/messages/:connectionId/poll", authMiddleware, (req, res) => {
  const { after } = req.query;

  db.query(
    `SELECT * FROM connections 
     WHERE id = ? AND (sender_id = ? OR receiver_id = ?) AND status = 'accepted'`,
    [req.params.connectionId, req.user.id, req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(403).json({ message: "Not authorized" });

      db.query(
        `SELECT m.*, u.full_name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.connection_id = ? AND m.created_date > ?
         ORDER BY m.created_date ASC`,
        [req.params.connectionId, after || new Date(0)],
        (err, messages) => {
          if (err) return res.status(500).json({ message: "Database error" });

          if (messages.length > 0) {
            db.query(
              `UPDATE messages SET is_read = TRUE 
               WHERE connection_id = ? AND sender_id != ?`,
              [req.params.connectionId, req.user.id]
            );
          }

          res.json(messages);
        }
      );
    }
  );
});

module.exports = router;