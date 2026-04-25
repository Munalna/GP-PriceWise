import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getUserPricingRules,
  addPricingRule,
  editPricingRule,
  removePricingRule,
} from "../controllers/pricingRuleController.js";

const router = express.Router();

/*
GET /api/pricing-rules
Get all pricing rules for logged-in user
*/
router.get("/", protect, getUserPricingRules);

/*
POST /api/pricing-rules
Create new pricing rule
*/
router.post("/", protect, addPricingRule);

/*
PATCH /api/pricing-rules/:id
Update pricing rule
*/
router.patch("/:id", protect, editPricingRule);

/*
DELETE /api/pricing-rules/:id
Delete pricing rule
*/
router.delete("/:id", protect, removePricingRule);

export default router;