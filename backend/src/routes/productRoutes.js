import express from 'express';
import { 
  getProducts, addProduct, addCategory, 
  updateProduct, deleteProduct, getVarComponents 
} from '../controllers/productController.js';

const router = express.Router();

// Middleware to check for user-id in headers
router.use((req, res, next) => {
  const userId = req.headers['user-id']; 
  if (!userId) {
    
    return res.status(401).json({ error: "Unauthorized: No user ID provided in headers" });
  }
  req.userId = userId; 
  next();
});

// Routes
router.get('/', getProducts);
router.get('/var-components', getVarComponents);
router.post('/', addProduct);
router.post('/categories', addCategory);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;