import { getLatestVisualSummaryByUser } from "../models/analyticsModel.js";

export async function getAnalytics(req, res, next) {
  try {
    const userId = req.user.id;

    const salesRecord = await getLatestVisualSummaryByUser(userId);

    if (!salesRecord || !salesRecord.visual_summary) {
      return res.json({
        top_products: [],
        low_products: [],
        profit: 0,
      });
    }

    const summary = salesRecord.visual_summary;

    res.json({
      top_products: Array.isArray(summary.top_products) ? summary.top_products : [],
      low_products: Array.isArray(summary.low_products) ? summary.low_products : [],
      profit: summary.profit ?? 0,
    });
  } catch (error) {
    next(error);
  }
}