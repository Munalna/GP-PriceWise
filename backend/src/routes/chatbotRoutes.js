import express from "express";
import protect from "../middleware/authMiddleware.js";
import { sendChatMessage } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/", protect, sendChatMessage);

export default router;
