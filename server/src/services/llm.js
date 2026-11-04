import { env } from "../config/env.js";
import { COACH_PROMPT } from "../prompts/coachPrompt.js";
import { TRANSCRIBE_PROMPT } from "../prompts/transcribePrompt.js";

const TIMEOUT_MS = 20000;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`;

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseFeedback(text, transcript) {
  const clean = text.replace(/```json|```/g, "").trim();

  let data;
  try {
    data = JSON.parse(clean);
  } catch {
    throw httpError("AI returned an invalid response", 502);
  }

  const toList = (value) => (Array.isArray(value) ? value.map(String) : []);
  const unique = (list) => [
    ...new Set(list.map((t) => t.trim()).filter(Boolean)),
  ];
  const has = (haystack, term) =>
    haystack.toLowerCase().includes(term.toLowerCase());

  const tightAnswer = String(data.tightAnswer ?? "").trim();

  return {
    tightAnswer,
    termsHit: unique(toList(data.termsHit)).filter(
      (t) => has(tightAnswer, t) && has(transcript, t),
    ),
    termsMissed: unique(toList(data.termsMissed))
      .filter((t) => has(tightAnswer, t) && !has(transcript, t))
      .slice(0, 4),
    factualIssues: toList(data.factualIssues),
    score: Math.min(10, Math.max(1, Math.round(Number(data.score)) || 1)),
  };
}

const RETRYABLE = new Set([429, 500, 503, 504]);
const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(body) {
  let retryable = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;

    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err.name === "TimeoutError") {
        throw httpError("AI took too long to respond", 504);
      }
      throw httpError("Could not reach the AI service", 502);
    }

    if (response.ok) {
      return response.json();
    }

    console.error(
      `Gemini error (attempt ${attempt}/${MAX_ATTEMPTS}):`,
      response.status,
      await response.text(),
    );

    retryable = RETRYABLE.has(response.status);
    if (!retryable || attempt === MAX_ATTEMPTS) break;

    await sleep(1000 * 2 ** (attempt - 1));
  }

  throw retryable
    ? httpError("AI service is busy, please try again in a moment", 503)
    : httpError("AI service request failed", 502);
}

export async function getFeedback({ question, transcript }) {
  const data = await callGemini({
    systemInstruction: { parts: [{ text: COACH_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: `Question: ${question}\n\nStudent's answer: ${transcript}` },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";

  if (!text) {
    throw httpError("AI returned an empty response", 502);
  }

  return parseFeedback(text, transcript);
}

export async function transcribeAudio({ question, audioBase64 }) {
  const data = await callGemini({
    systemInstruction: { parts: [{ text: TRANSCRIBE_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: `Interview question the student is answering: ${question}` },
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";

  let transcript = "";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    transcript = String(parsed.transcript ?? "").trim();
  } catch {
    throw httpError("AI returned an invalid response", 502);
  }

  if (!transcript) {
    throw httpError("No speech detected. Try again, a bit louder.", 422);
  }

  return transcript;
}
