import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getUserSeasons,
  addSeason,
  editSeason,
  removeSeason,
  assignSeasonRules,
} from "../controllers/seasonController.js";

const router = express.Router();

/*
GET /api/seasons
Get all seasons for logged-in user
*/
router.get("/", protect, getUserSeasons);

/*
POST /api/seasons
Create new season
*/
router.post("/", protect, addSeason);


router.put("/:id/rules", protect, assignSeasonRules);
/*
PATCH /api/seasons/:id
Update season
*/
router.patch("/:id", protect, editSeason);

/*
DELETE /api/seasons/:id
Delete season
*/
router.delete("/:id", protect, removeSeason);

export default router;