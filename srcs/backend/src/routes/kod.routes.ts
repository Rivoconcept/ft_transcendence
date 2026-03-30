import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getKodGames, getKodMatchParticipants } from "../controllers/kod.controller.js";

const router: IRouter = Router();

/**
 * GET /kod-games
 * Returns the authenticated user's full KOD game history.
 */
router.get('/', authMiddleware, getKodGames);

/**
 * GET /kod-games/match/:match_id
 * Returns all participant names for a given match (opponent resolution).
 * NOTE: this route must be declared before any wildcard routes.
 */
router.get('/match/:match_id', authMiddleware, getKodMatchParticipants);

export default router;