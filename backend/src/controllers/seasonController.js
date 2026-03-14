import {
  getSeasonsByUser,
  createSeason,
  updateSeason,
  deleteSeason,
} from "../models/seasonModel.js";

export async function getUserSeasons(req, res, next) {
  try {
    const userId = req.user.id;
    const seasons = await getSeasonsByUser(userId);
    res.json(seasons);
  } catch (e) {
    next(e);
  }
}

export async function addSeason(req, res, next) {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const name = req.body.name ?? req.body.season_name;
    const startDate = req.body.startDate ?? req.body.start_date;
    const endDate = req.body.endDate ?? req.body.end_date;

    console.log("PARSED VALUES:", { name, startDate, endDate });

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        message: "name, startDate, endDate are required",
        receivedBody: req.body,
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        message: "endDate must be after startDate",
      });
    }

    const userId = req.user.id;
    const created = await createSeason(userId, { name, startDate, endDate });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function editSeason(req, res, next) {
  try {
    const { id } = req.params;

    const name = req.body.name ?? req.body.season_name;
    const startDate = req.body.startDate ?? req.body.start_date;
    const endDate = req.body.endDate ?? req.body.end_date;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        message: "endDate must be after startDate",
      });
    }

    const userId = req.user.id;
    const updated = await updateSeason(userId, id, { name, startDate, endDate });

    if (!updated) {
      return res.status(404).json({ message: "Season not found" });
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function removeSeason(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deleteSeason(userId, id);

    if (!deleted) {
      return res.status(404).json({ message: "Season not found" });
    }

    res.json({ ok: true, message: "Season deleted successfully" });
  } catch (e) {
    next(e);
  }
}