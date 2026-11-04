import rateLimit from "express-rate-limit";

const createLimiter = (limit) =>
  rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please wait a minute and try again.",
    },
  });

export const feedbackLimiter = createLimiter(10);
export const transcribeLimiter = createLimiter(10);
