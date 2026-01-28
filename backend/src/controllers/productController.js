import * as productModel from '../models/productModel.js';

// @desc    Get all products
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const products = await productModel.getAllProducts();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
export const getProduct = async (req, res, next) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const product = await productModel.createProduct(req.body);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const product = await productModel.updateProduct(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productModel.deleteProduct(req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};