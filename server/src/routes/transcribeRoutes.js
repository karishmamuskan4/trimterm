import { Router } from "express";
import { createTranscript } from "../controller/transcribeController.js";

const router = Router();

router.post("/", createTranscript);

export default router;
