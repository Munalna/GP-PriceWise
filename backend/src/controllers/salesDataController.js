import { insertSalesData } from "../models/salesDataModel.js";

export async function importSalesData(req, res, next) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        message: "Sales data file is required",
      });
    }

    const rawText = req.file.buffer.toString("utf-8");
    const parsed = JSON.parse(rawText);

    if (!parsed || typeof parsed !== "object") {
      return res.status(400).json({
        message: "Invalid JSON format",
      });
    }

    const payload = {
      data: Array.isArray(parsed.data) ? parsed.data : [],
      visual_summary:
        parsed.visual_summary && typeof parsed.visual_summary === "object"
          ? parsed.visual_summary
          : {},
    };

    const saved = await insertSalesData(userId, payload);

    res.status(201).json({
      message: "Sales data imported successfully",
      record: saved,
    });
  } catch (error) {
    next(error);
  }
}