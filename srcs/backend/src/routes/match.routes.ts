// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/routes/match.routes.ts
import { Router, type IRouter } from "express";
import {
  createMatch,
  discoverMatches,
  matchmake,
  getMatchById,
  joinMatch,
  startMatch,
  nextSet,
  setVisibility,
  endMatch,
  updateScore,
  deleteMatch,
} from "../controllers/match.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.post("/", authMiddleware, createMatch);

router.post("/matchmake", authMiddleware, matchmake);

router.get("/discover", authMiddleware, discoverMatches);

router.get("/:id", authMiddleware, getMatchById);

router.post("/:id/join", authMiddleware, joinMatch);

router.post("/:id/start", authMiddleware, startMatch);

router.post("/:id/next-set", authMiddleware, nextSet);

router.patch("/:id/visibility", authMiddleware, setVisibility);

router.post("/:id/end", authMiddleware, endMatch);

router.delete("/:id", authMiddleware, deleteMatch);

router.patch("/:id/score", authMiddleware, updateScore);

export default router;
