import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

console.log("API key loaded:", Boolean(process.env.GEMINI_API_KEY));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "trimterm" });
});

const SYSTEM_PROMPT = `You are a technical interview coach. A student answered an interview question out loud and this is the transcript. Rewrite it as a tight answer an interviewer wants to hear: 1-2 sentences, correct terminology, no filler.

Respond with ONLY a JSON object, no markdown, no extra text, in exactly this shape:
{
  "tightAnswer": "the concise 1-2 sentence answer",
  "termsHit": ["key terms the student already used correctly"],
  "termsMissed": ["key terms the student should have used"],
  "factualIssues": ["anything the student said that is wrong or mixed up; empty array if none"],
  "score": 7
}
"score" is an integer from 1 to 10 for how clear, correct and concise the original answer was.`;

app.post("/api/feedback", async (req, res) => {
  const { question, transcript } = req.body;

  if (!question || !transcript) {
    return res
      .status(400)
      .json({ error: "question and transcript are required" });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Question: ${question}\n\nStudent's answer: ${transcript}`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("LLM error:", data);
      return res.status(500).json({ error: "LLM request failed" });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error("Feedback route error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
