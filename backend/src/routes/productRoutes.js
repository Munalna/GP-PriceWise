import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getProducts,
  addProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  assignPricingRules,
  updateProduct,
  deleteProduct,
  getVarComponents,
} from "../controllers/productController.js";

const router = express.Router();

router.use(protect, (req, res, next) => {
  req.userId = req.user.id;
  next();
});

router.get("/", getProducts);
router.get("/var-components", getVarComponents);

router.post("/", addProduct);
router.post("/categories", addCategory);

router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.put("/:targetType/:targetId/rules", assignPricingRules);

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
