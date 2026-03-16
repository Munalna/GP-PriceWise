import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js'; 

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);     
app.use('/api/products', productRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});