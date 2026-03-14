import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import seasonRoutes from "./routes/seasonRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Core middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/seasons", seasonRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});