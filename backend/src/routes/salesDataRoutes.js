import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import { importSalesData } from "../controllers/salesDataController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", protect, upload.single("file"), importSalesData);

export default router;