
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import seasonRoutes from "./routes/seasonRoutes.js";
// إذا سويتِ notification routes بعدين، فكّي التعليق:
// import notificationRoutes from "./routes/notificationRoutes.js";

// Jobs
import { startSeasonScheduler } from "./jobs/seasonScheduler.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

import dotenv from 'dotenv';
import app from './server.js';


dotenv.config();
console.log("SUPABASE_URL =", process.env.SUPABASE_URL)
const PORT = process.env.PORT || 3000;


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

// إذا أضفتِ notification routes بعدين، فكّي التعليق:
// app.use("/api/notifications", notificationRoutes);

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
