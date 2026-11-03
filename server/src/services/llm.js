import { env } from "../config/env.js";
import { COACH_PROMPT } from "../prompts/coachPrompt.js";

const TIMEOUT_MS = 20000;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`;

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseFeedback(text) {
  const clean = text.replace(/```json|```/g, "").trim();

  let data;
  try {
    data = JSON.parse(clean);
  } catch {
    throw httpError("AI returned an invalid response", 502);
  }

  const toList = (value) => (Array.isArray(value) ? value.map(String) : []);

  return {
    tightAnswer: String(data.tightAnswer ?? ""),
    termsHit: toList(data.termsHit),
    termsMissed: toList(data.termsMissed).slice(0, 4),
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

  return parseFeedback(text);
}
