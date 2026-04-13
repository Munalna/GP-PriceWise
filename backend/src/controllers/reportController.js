import { getLatestSalesDataByUser, logExportReport } from "../models/reportModel.js";
import { buildDailyReportPdf } from "../services/pdfService.js";

function normalizeReportRows(rawData) {
  if (!Array.isArray(rawData)) return [];

  return rawData.map((item) => ({
    product_name: item?.name ?? "",
    cost: item?.cost ?? 0,
    competitor_price: item?.competitor_price ?? 0,
    recommended_price: item?.recommended_price ?? 0,
  }));
}

export async function getDailyReport(req, res, next) {
  try {
    const userId = req.user.id;

    const salesRecord = await getLatestSalesDataByUser(userId);

    if (!salesRecord) {
      return res.json([]);
    }

    const reportRows = normalizeReportRows(salesRecord.data);
    res.json(reportRows);
  } catch (error) {
    next(error);
  }
}

export async function exportDailyReportPdf(req, res, next) {
  try {
    const userId = req.user.id;

    const salesRecord = await getLatestSalesDataByUser(userId);

    if (!salesRecord) {
      return res.status(404).json({
        message: "No sales data found for report export",
      });
    }

    const reportRows = normalizeReportRows(salesRecord.data);

    await logExportReport(userId, "pdf");

    buildDailyReportPdf(reportRows, res);
  } catch (error) {
    next(error);
  }
}