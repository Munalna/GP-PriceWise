import * as ProductModel from '../models/productModel.js';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCategoryId(categoryId) {
  if (categoryId === undefined) {
    return undefined;
  }

  if (categoryId === null || categoryId === "") {
    return null;
  }

  const normalized = String(categoryId).trim();
  return uuidRegex.test(normalized) ? normalized : null;
}

function logControllerError(context, error, metadata = {}) {
  console.error(`[ProductController ${context}]`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    metadata,
  });
}

export const getProducts = async (req, res) => {
  try {
    const data = await ProductModel.getAllProducts(req.userId);
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getVarComponents = async (req, res) => {
  try {
    const data = await ProductModel.getVariableComponentsList(req.userId);
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await ProductModel.createCategory(name, req.userId);
    res.status(201).json(category);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required." });
    }

    const category = await ProductModel.updateCategoryById(
      req.params.id,
      name.trim(),
      req.userId
    );

    res.json(category);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await ProductModel.deleteCategoryById(req.params.id, req.userId);
    res.status(204).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const product = await ProductModel.createProduct(req.body, req.userId);
    res.status(201).json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id || req.body.product_id || req.body.id;
    const categoryId = normalizeCategoryId(req.body.category_id);

    if (!productId || !uuidRegex.test(String(productId))) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    if (req.body.category_id && !categoryId) {
      return res.status(400).json({
        error: "Invalid category_id. Send the category UUID, not the category name.",
      });
    }

    const updatePayload = {
      ...req.body,
      category_id: categoryId,
    };

    console.log("[ProductController updateProduct.payload]", {
      productId,
      userId: req.userId,
      categoryId,
      hasCategoryId: Boolean(categoryId),
      isNewBeforeUpdate: req.body.is_new,
    });

    const updatedData = await ProductModel.updateProductById(
      productId,
      updatePayload,
      req.userId
    );
    res.json(updatedData);
  } catch (error) {
    logControllerError("updateProduct", error, {
      productId: req.params.id || req.body.product_id || req.body.id,
      userId: req.userId,
      body: req.body,
    });
    res.status(error.statusCode || 500).json({
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
};

export const assignPricingRules = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { rules } = req.body;

    const result = await ProductModel.assignPricingRulesToTarget(
      req.userId,
      targetType,
      targetId,
      rules
    );

    res.json({
      success: true,
      message: "Pricing rules assigned successfully.",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    await ProductModel.deleteProductById(req.params.id, req.userId);
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
};
