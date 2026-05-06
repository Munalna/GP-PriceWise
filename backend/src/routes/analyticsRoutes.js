import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getAnalytics,
  analyzeSingleProduct,
  getPricingRiskSummary,
  getAIPriceRecommendation,
  checkMarketProduct,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/", protect, getAnalytics);

router.get("/pricing-risk", protect, getPricingRiskSummary);

router.get("/products/:productId/risk", protect, analyzeSingleProduct);

router.post("/products/:productId/ai-recommendation", protect, getAIPriceRecommendation);

router.get("/market-check", protect, checkMarketProduct);

export default router;