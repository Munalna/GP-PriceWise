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

export const deleteProduct = async (req, res) => {
  try {
    await ProductModel.deleteProductById(req.params.id, req.userId);
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
};