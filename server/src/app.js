import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { feedbackLimiter } from "./middleware/rateLimiter.js";

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "trimterm" });
});

app.use("/api/feedback", feedbackLimiter, feedbackRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
