import {
  getLatestSalesDataByUser,
  getProductsByUser,
  logExportReport,
} from "../models/reportModel.js";
import { buildDailyReportPdf } from "../services/pdfService.js";

function mergeReportData(dbProducts, importedRows) {
  // Build a lookup map from imported data keyed by lowercase name
  const importedMap = {};
  if (Array.isArray(importedRows)) {
    importedRows.forEach((row) => {
      const key = row.name?.trim().toLowerCase();
      if (key) importedMap[key] = row;
    });
  }

  // Start with DB products as the base
  const dbMap = {};
  dbProducts.forEach((prod) => {
    const key = prod.name?.trim().toLowerCase();
    if (key) dbMap[key] = prod;
  });

  // Merge: DB products enriched with imported recommended_price
  // Then add any imported products not in DB
  const allKeys = new Set([...Object.keys(dbMap), ...Object.keys(importedMap)]);

  return Array.from(allKeys).map((key) => {
    const db = dbMap[key];
    const imp = importedMap[key];

    return {
      product_name: db?.name ?? imp?.name ?? key,
      cost: db?.cost ?? imp?.cost ?? 0,
      competitor_price: db?.competitor_price ?? imp?.competitor_price ?? 0,
      recommended_price: db?.recommended_price ?? imp?.recommended_price ?? 0,
    };
  });
}

export async function getDailyReport(req, res, next) {
  try {
    const userId = req.user.id;

    const [salesRecord, dbProducts] = await Promise.all([
      getLatestSalesDataByUser(userId),
      getProductsByUser(userId),
    ]);

    const importedRows = salesRecord?.data ?? [];
    const merged = mergeReportData(dbProducts, importedRows);

    res.json(merged);
  } catch (error) {
    next(error);
  }
}

export async function exportDailyReportPdf(req, res, next) {
  try {
    const userId = req.user.id;

    const [salesRecord, dbProducts] = await Promise.all([
      getLatestSalesDataByUser(userId),
      getProductsByUser(userId),
    ]);

    const importedRows = salesRecord?.data ?? [];
    const merged = mergeReportData(dbProducts, importedRows);

    await logExportReport(userId, "pdf");

    buildDailyReportPdf(merged, res);
  } catch (error) {
    next(error);
  }
}