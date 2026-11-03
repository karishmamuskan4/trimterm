import { getFeedback } from "../services/llm.js";

const MAX_QUESTION_LENGTH = 300;
const MAX_TRANSCRIPT_LENGTH = 1500;

export async function createFeedback(req, res, next) {
  try {
    const question =
      typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const transcript =
      typeof req.body?.transcript === "string"
        ? req.body.transcript.trim()
        : "";

    if (!question || !transcript) {
      return res
        .status(400)
        .json({ error: "question and transcript are required" });
    }

    if (
      question.length > MAX_QUESTION_LENGTH ||
      transcript.length > MAX_TRANSCRIPT_LENGTH
    ) {
      return res.status(400).json({
        error: `question must be under ${MAX_QUESTION_LENGTH} characters and transcript under ${MAX_TRANSCRIPT_LENGTH}`,
      });
    }

    const feedback = await getFeedback({ question, transcript });
    res.json(feedback);
  } catch (err) {
    next(err);
  }
}
