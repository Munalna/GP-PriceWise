import {
  getLatestSalesDataByUser,
  getCategoriesWithProductsByUser,
  getFixedCostsByUser,
  getActiveSeasonByUser,
  logExportReport,
} from "../models/reportModel.js";
import { buildDailyReportPdf } from "../services/pdfService.js";

function buildImportedMap(importedRows) {
  const map = {};
  if (!Array.isArray(importedRows)) return map;
  importedRows.forEach((row) => {
    const key = row.name?.trim().toLowerCase();
    if (key) map[key] = row;
  });
  return map;
}

function buildFlatRows(categories, importedMap) {
  const rows = [];

  categories.forEach((cat) => {
    (cat.products || []).forEach((prod) => {
      const key = prod.name?.trim().toLowerCase();
      const imp = importedMap[key] || {};

      const cost        =  Number(prod.variable_cost ?? prod.b_cost ?? prod.c_price ?? imp.cost ?? 0);
      const compPrice   = Number(prod.avg_competitor_price ?? prod.comp_price     ?? imp.competitor_price ?? 0);
      const recommended = Number(prod.recommended_price  ?? imp.recommended_price ?? 0);

      rows.push({
        product_name:      prod.name ?? imp.name ?? key,
        cost,
        competitor_price:  compPrice,
        recommended_price: Number(prod.recommended_price ?? imp.recommended_price ?? 0),
      });
    });
  });

  return rows;
}

export async function getDailyReport(req, res, next) {
  try {
    const userId = req.user.id;

    const [salesRecord, categories] = await Promise.all([
      getLatestSalesDataByUser(userId),
      getCategoriesWithProductsByUser(userId),
    ]);

    const importedMap = buildImportedMap(salesRecord?.data);
    const rows = buildFlatRows(categories, importedMap);

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function exportDailyReportPdf(req, res, next) {
  try {
    const userId = req.user.id;

    const [salesRecord, categories, fixedCosts, activeSeason] =
      await Promise.all([
        getLatestSalesDataByUser(userId),
        getCategoriesWithProductsByUser(userId),
        getFixedCostsByUser(userId),
        getActiveSeasonByUser(userId),
      ]);

    const importedMap = buildImportedMap(salesRecord?.data);

    await logExportReport(userId, "pdf");

    buildDailyReportPdf(
      { categories, fixedCosts, activeSeason, importedMap },
      res
    );
  } catch (error) {
    next(error);
  }
}