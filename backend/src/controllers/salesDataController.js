import * as XLSX from "xlsx";
import { upsertSalesData } from "../models/salesDataModel.js";

export async function importSalesData(req, res, next) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Sales data file is required." });
    }

    // Validate by extension instead of MIME type 
    const originalName = req.file.originalname?.toLowerCase() || "";
    if (!originalName.endsWith(".xlsx") && !originalName.endsWith(".xls")) {
      return res.status(400).json({ message: "Only Excel files (.xlsx, .xls) are allowed." });
    }

    // Parse Excel from buffer
    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    } catch {
      return res.status(400).json({ message: "Invalid Excel file." });
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ message: "Excel file has no sheets." });
    }

    const sheet = workbook.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json(sheet);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return res.status(400).json({ message: "Excel sheet is empty." });
    }

    const required = ["name", "cost", "competitor_price", "recommended_price"];
    const missing = required.filter((col) => !(col in parsed[0]));

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missing.join(", ")}`,
      });
    }

    const saved = await upsertSalesData(userId, parsed);

    res.status(201).json({
      message: "Sales data imported successfully.",
      record: saved,
    });
  } catch (error) {
    next(error);
  }
}