const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const documentScanRoutes = require("./routes/documentScanRoutes");
const visaMatesRoutes = require("./routes/visaMatesRoutes");

const app = express();

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ⚠️ IMPORTANT: Stripe webhook BEFORE express.json()
app.use("/api/stripe", stripeRoutes);

// Body parser
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/visamates", visaMatesRoutes);
app.use("/api/documents", documentScanRoutes);

// ==========================
// AI INVOKE (Structured JSON)
// ==========================
app.post("/api/ai/invoke", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful visa expert. Always respond with valid JSON only, no markdown, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return res.status(500).json({ message: "AI service error", error: data });
    }

    const text = data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { raw: text };
    }

    res.json(parsed);
  } catch (err) {
    console.error("AI invoke error:", err);
    res.status(500).json({ message: "Failed to call AI" });
  }
});

// ==========================
// CHATBOT ROUTE
// ==========================
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are VisaBot, a friendly and intelligent visa assistant for VisaCurator. 
You help users with visa questions, requirements, processes, fees, timelines, and document checklists for any country in the world.
You support multiple languages — always reply in the same language the user writes in.
Be concise, helpful, and accurate. Use emojis occasionally to be friendly.
If you don't know something specific, suggest the user check the official embassy website.`,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Chat error:", data);
      return res.status(500).json({ message: "AI error", error: data });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: "Failed to get response" });
  }
});

// ==========================
// SERVER START
// ==========================
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});