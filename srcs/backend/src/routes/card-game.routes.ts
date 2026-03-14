// /home/hrv/Pictures/ft_transcendence/srcs/backend/src/routes/card-game.routes.ts

import { Router, type IRouter } from "express";
import { createCardGame, getMatchResults, getUserCardGames } from "../controllers/card-game.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

// Create a card game record
router.post("/", authMiddleware, createCardGame);

// Get card games for the authenticated user
router.get("/", authMiddleware, getUserCardGames);

router.get("/match/:matchId", getMatchResults);

export default router;

