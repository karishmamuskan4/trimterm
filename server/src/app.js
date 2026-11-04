import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import transcribeRoutes from "./routes/transcribeRoutes.js";
import {
  feedbackLimiter,
  transcribeLimiter,
} from "./middleware/rateLimiter.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.clientOrigin }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "trimterm" });
});

app.use(
  "/api/feedback",
  feedbackLimiter,
  express.json({ limit: "10kb" }),
  feedbackRoutes,
);

app.use(
  "/api/transcribe",
  transcribeLimiter,
  express.json({ limit: "3mb" }),
  transcribeRoutes,
);

app.use(notFound);
app.use(errorHandler);

export default app;
