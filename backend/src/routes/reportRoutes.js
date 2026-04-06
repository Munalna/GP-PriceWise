import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getDailyReport,
  exportDailyReportPdf,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/daily", protect, getDailyReport);
router.get("/export", protect, exportDailyReportPdf);

export default router;