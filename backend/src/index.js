import "dotenv/config";
import express from "express";
import cors from "cors";
//import dotenv from "dotenv";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import seasonRoutes from "./routes/seasonRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import salesDataRoutes from "./routes/salesDataRoutes.js";
import pricingRuleRoutes from "./routes/pricingRuleRoutes.js";

import { startSeasonScheduler } from "./jobs/seasonScheduler.js";
import { errorHandler } from "./middleware/errorHandler.js";



const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/seasons", seasonRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales-data", salesDataRoutes);
app.use("/api/salesData", salesDataRoutes);
app.use("/api/pricing-rules", pricingRuleRoutes);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // handle preflight requests

app.use(errorHandler);

startSeasonScheduler();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});