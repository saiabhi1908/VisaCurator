const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const authMiddleware = require("../middleware/auth");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// ==============================
// MULTER SETUP
// ==============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG and PDF files are allowed"));
  },
});


// ==============================
// OCR FUNCTION (Node → Python)
// ==============================
function runOCR(buffer, ext) {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`);
    fs.writeFileSync(tempPath, buffer);

    exec(`python ocr.py "${tempPath}"`, (error, stdout, stderr) => {
      fs.unlinkSync(tempPath);

      if (error) {
        console.error("OCR Error:", error);
        return reject(error);
      }

      if (stderr) {
        console.warn("OCR stderr:", stderr);
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result.text);
      } catch (err) {
        console.error("OCR JSON parse error. Raw stdout:", stdout);
        reject(err);
      }
    });
  });
}


// ==============================
// AI DOCUMENT ANALYSIS
// ==============================
async function analyzeDocumentWithAI(textArray, country, visa_type, purpose) {
  // Limit to first 50 lines to avoid token overflow
  const extractedText = textArray.slice(0, 50).join("\n");

  const prompt = `
You are a visa document expert with deep knowledge of visa requirements for every country in the world.
Analyze the following extracted document text and return a JSON response.

Country applying for: ${country}
Visa Type: ${visa_type}
Purpose: ${purpose || "not specified"}

Extracted Document Text:
"""
${extractedText}
"""

Important rules:
- Use your knowledge of international visa requirements to validate if this document is appropriate for the given country and visa type
- Cross-check the document against the country's actual visa requirements
- If the document belongs to another country's visa system (e.g. a US-specific DS-160 form uploaded for a Canada visa, or an I-20 uploaded for a UK visa), mark status as "warning" and explain in warnings
- If the document is expired, incomplete, or irrelevant for the given country and visa type, reflect that in status and warnings
- Be strict and accurate about country-specific document requirements worldwide
- A passport is always relevant for any country
- Bank statements, flight itineraries, hotel bookings, travel insurance are generally relevant for most tourist visas

Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "document_type": "one of: passport, invitation_letter, bank_statement, flight_itinerary, hotel_booking, travel_insurance, employment_letter, visa_application, i20, ds160, financial_document, support_letter, resume, unknown",
  "document_summary": "brief one-line summary of what this document is",
  "status": "one of: valid, warning, invalid",
  "parsed_data": {
    "key fields extracted from the document like name, date, number, issuer etc"
  },
  "warnings": ["list of any issues, including if document is wrong for this country or visa type"],
  "recommendations": ["list of suggestions to strengthen this document for the visa application"],
  "is_relevant_for_visa": true or false
}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "You are a visa document verification expert with knowledge of visa requirements for every country in the world. Always respond with valid JSON only, no markdown, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("AI analysis failed: " + JSON.stringify(data));
  }

  const text = data.choices[0].message.content;
  console.log("AI raw response:", text);

  // Try to extract valid JSON even if response is cut off
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      document_type: "unknown",
      document_summary: "Could not analyze document",
      status: "warning",
      parsed_data: {},
      warnings: ["AI could not parse this document"],
      recommendations: ["Try uploading a clearer version"],
      is_relevant_for_visa: false,
    };
  }
}


// ==============================
// OVERALL ASSESSMENT WITH AI
// ==============================
async function getOverallAssessment(documents, country, visa_type, purpose) {
  const docSummaries = documents.map((d, i) => ({
    index: i + 1,
    type: d.document_type,
    summary: d.document_summary,
    status: d.status,
    warnings: d.warnings,
    is_relevant_for_visa: d.is_relevant_for_visa,
  }));

  const prompt = `
You are a visa application expert with deep knowledge of visa requirements for every country in the world.
Based on the following scanned documents, give an overall assessment of the visa application.

Country applying for: ${country}
Visa Type: ${visa_type}
Purpose: ${purpose || "not specified"}

Documents Scanned:
${JSON.stringify(docSummaries, null, 2)}

Important rules:
- Use your knowledge of actual visa requirements for ${country} ${visa_type} visa
- Identify what documents are typically required for this specific country and visa type
- Flag documents that are irrelevant or wrong for this country
- Missing documents should be based on real requirements for ${country} ${visa_type} visa

Return ONLY a valid JSON object with this structure:
{
  "overall_status": "one of: strong, good, needs_attention, incomplete, invalid",
  "overall_summary": "2-3 sentence summary of the application strength",
  "missing_documents": ["list of important documents missing for ${country} ${visa_type} visa specifically"],
  "strong_points": ["list of things that look good"],
  "weak_points": ["list of things that need improvement"],
  "next_steps": ["list of recommended next steps for the applicant"]
}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "You are a visa application expert with knowledge of visa requirements for every country in the world. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Overall assessment failed: " + JSON.stringify(data));
  }

  const text = data.choices[0].message.content;
  console.log("Overall assessment raw response:", text);

  // Try to extract valid JSON even if response is cut off
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      overall_status: "needs_attention",
      overall_summary: "Could not complete overall assessment.",
      missing_documents: [],
      strong_points: [],
      weak_points: [],
      next_steps: ["Please re-upload your documents"],
    };
  }
}


// ==============================
// SCAN DOCUMENTS ROUTE
// ==============================
router.post(
  "/scan",
  authMiddleware,
  upload.array("documents", 10),
  async (req, res) => {
    const { country, visa_type, purpose } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (!country || !visa_type) {
      return res.status(400).json({
        message: "Country and visa type are required",
      });
    }

    try {
      const results = [];

      for (const file of req.files) {
        let extractedText = [];

        try {
          const ext = file.mimetype === "application/pdf" ? "pdf" : "jpg";
          extractedText = await runOCR(file.buffer, ext);
          console.log("✅ Extracted Text for", file.originalname, ":", extractedText);
        } catch (err) {
          console.error("OCR failed for file:", file.originalname, err);
          extractedText = ["OCR failed"];
        }

        // AI Analysis
        let aiAnalysis = {};
        try {
          aiAnalysis = await analyzeDocumentWithAI(
            extractedText,
            country,
            visa_type,
            purpose
          );
        } catch (err) {
          console.error("AI analysis failed:", err);
          aiAnalysis = {
            document_type: "unknown",
            document_summary: "Analysis failed",
            status: "warning",
            parsed_data: {},
            warnings: ["AI analysis could not be completed"],
            recommendations: [],
            is_relevant_for_visa: false,
          };
        }

        results.push({
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          extracted_text: extractedText,
          document_type: aiAnalysis.document_type,
          document_summary: aiAnalysis.document_summary,
          status: aiAnalysis.status,
          parsed_data: aiAnalysis.parsed_data,
          warnings: aiAnalysis.warnings,
          recommendations: aiAnalysis.recommendations,
          is_relevant_for_visa: aiAnalysis.is_relevant_for_visa,
        });
      }

      // Overall assessment
      let overallAssessment = {};
      try {
        overallAssessment = await getOverallAssessment(
          results,
          country,
          visa_type,
          purpose
        );
      } catch (err) {
        console.error("Overall assessment failed:", err);
        overallAssessment = {
          overall_status: "needs_attention",
          overall_summary: "Could not complete overall assessment.",
          missing_documents: [],
          strong_points: [],
          weak_points: [],
          next_steps: [],
        };
      }

      res.json({
        country,
        visa_type,
        purpose: purpose || null,
        total_documents: results.length,
        ...overallAssessment,
        documents: results,
      });

    } catch (err) {
      console.error("Scan error:", err);
      res.status(500).json({ message: "Failed to scan documents" });
    }
  }
);

module.exports = router;