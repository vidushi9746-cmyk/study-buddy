import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import { PDFParse } from "pdf-parse";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemma-4-26b-a4b-it";

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please choose a PDF file." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported." });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();

    if (!result.text?.trim()) {
      return res.status(400).json({
        error: "I couldn't extract readable text from this PDF."
      });
    }

    res.json({
      filename: req.file.originalname,
      pages: result.total,
      text: result.text.trim()
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Could not read this PDF. Try another text-based PDF."
    });
  }
});

app.post("/api/study", async (req, res) => {
  try {
    const { notes, question, mode = "simple" } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: "Please enter a question." });
    }

    const modeInstructions = {
      simple: "Explain in very simple language. Use short paragraphs and one intuitive example.",
      analogy: "Explain using a clear real-world analogy first, then connect the analogy back to the technical concept.",
      exam: "Give a concise exam-ready answer with a definition, key points, and an example. Make it suitable for a university student.",
      quiz: `Create exactly 5 multiple-choice questions from the notes.

Return ONLY valid JSON in this exact format:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Short explanation"
  }
]

Rules:
- answer is the number of the correct option: 0, 1, 2, or 3
- Use only information supported by the notes
- Make the questions useful for a university exam
- Keep the questions concise
- Do not include markdown
- Do not include anything outside the JSON array`
    };

    const prompt = `You are Study Buddy, a personal study assistant.
The student prefers clear, concise explanations with examples.

IMPORTANT:
- Use the student's notes as the primary source.
- If the notes do not contain enough information, say that clearly instead of pretending the notes said it.
- Do not overwhelm the student.
- The student is studying for university exams.


STUDENT NOTES:
${notes?.trim() || "(No notes provided. Answer from general knowledge, but say that the notes were not provided.)"}

REQUEST:
${question}

RESPONSE STYLE:
${modeInstructions[mode] || modeInstructions.simple}
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    res.json({ answer: response.text || "I couldn't generate an answer." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "AI request failed. Check that GEMINI_API_KEY is set correctly."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Study Buddy running at http://localhost:${PORT}`);
});