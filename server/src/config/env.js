import "dotenv/config";

const required = ["GEMINI_API_KEY", "GEMINI_MODEL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
