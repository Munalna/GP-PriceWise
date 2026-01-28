import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// Product routes
router.get('/', getProducts);           // GET all products
router.get('/:id', getProduct);         // GET single product
router.post('/', createProduct);        // CREATE product
router.put('/:id', updateProduct);      // UPDATE product
router.delete('/:id', deleteProduct);   // DELETE product

export default router;