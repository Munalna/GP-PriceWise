import express from "express";

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