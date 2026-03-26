import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { initGame, submitChoice, getState } from "../controllers/kod.controller.js";

const router = Router();

/**
 * POST   /api/kod/:matchId/init     — host starts the KoD game
 * POST   /api/kod/:matchId/submit   — player submits a number
 * GET    /api/kod/:matchId/state    — fetch current state (reconnect)
 */
router.post("/:matchId/init", authMiddleware, initGame);
router.post("/:matchId/submit", authMiddleware, submitChoice);
router.get("/:matchId/state", authMiddleware, getState);

export default router;
