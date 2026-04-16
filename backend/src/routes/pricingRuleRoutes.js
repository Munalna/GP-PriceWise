import express from "express";
import {
  getUserPricingRules,
  addPricingRule,
  editPricingRule,
  removePricingRule,
} from "../controllers/pricingRuleController.js";

const router = express.Router();

// Middleware to check for user-id in headers
router.use((req, res, next) => {
  const userId = req.headers["user-id"];

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized: No user ID provided in headers",
    });
  }

  req.userId = userId;
  next();
});

// Routes
router.get("/", getUserPricingRules);
router.post("/", addPricingRule);
router.put("/:id", editPricingRule);
router.delete("/:id", removePricingRule);

export default router;