import * as ProductModel from '../models/productModel.js';

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
    const updatedData = await ProductModel.updateProductById(req.params.id, req.body, req.userId);
    res.json(updatedData);
  } catch (error) { res.status(500).json({ error: error.message }); }
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