import { Router } from "express";
import { createFeedback } from "../controller/feedbackController.js";

const router = Router();

router.post("/", createFeedback);

export default router;
