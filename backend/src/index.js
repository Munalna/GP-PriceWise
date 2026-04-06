import express from "express";
import cors from "cors";
import dotenv from "dotenv";


// Routes
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import seasonRoutes from "./routes/seasonRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";      // ✅ جديد
import analyticsRoutes from "./routes/analyticsRoutes.js"; // ✅ جديد
import salesDataRoutes from "./routes/salesDataRoutes.js";

// Jobs
import { startSeasonScheduler } from "./jobs/seasonScheduler.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express(); // ✅ هذا المهم
const PORT = process.env.PORT || 3000;

console.log("SUPABASE_URL =", process.env.SUPABASE_URL);

/* -------------------------------------------------- */
/* Core Middleware */
/* -------------------------------------------------- */

app.use(cors());
app.use(express.json());

/* -------------------------------------------------- */
/* Health Check */
/* -------------------------------------------------- */

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
  });
});

/* -------------------------------------------------- */
/* API Routes */
/* -------------------------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales-data", salesDataRoutes);

/* -------------------------------------------------- */
/* 404 Handler */
/* -------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/* -------------------------------------------------- */
/* Global Error Handler */
/* -------------------------------------------------- */

app.use(errorHandler);

/* -------------------------------------------------- */
/* Start Background Jobs */
/* -------------------------------------------------- */

startSeasonScheduler();

/* -------------------------------------------------- */
/* Start Server */
/* -------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});