import { transcribeAudio } from "../services/llm.js";

const MAX_QUESTION_LENGTH = 300;
const MAX_AUDIO_CHARS = 2_600_000;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export async function createTranscript(req, res, next) {
  try {
    const question =
      typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const audio = typeof req.body?.audio === "string" ? req.body.audio : "";

    if (!question || !audio) {
      return res.status(400).json({ error: "question and audio are required" });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({ error: "question is too long" });
    }

    if (audio.length > MAX_AUDIO_CHARS) {
      return res.status(413).json({ error: "Recording is too long" });
    }

    const header = Buffer.from(audio.slice(0, 16), "base64").toString("ascii");
    const isWav = header.startsWith("RIFF") && header.slice(8, 12) === "WAVE";

    if (!BASE64_PATTERN.test(audio) || !isWav) {
      return res
        .status(400)
        .json({ error: "audio must be a base64-encoded WAV file" });
    }

    const transcript = await transcribeAudio({ question, audioBase64: audio });
    res.json({ transcript });
  } catch (err) {
    next(err);
  }
}
