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

// Créer un match
router.post("/", authMiddleware, createMatch);

// Matchmaking automatique
router.post("/matchmake", authMiddleware, matchmake);

// Découvrir les matchs publics ouverts
router.get("/discover", authMiddleware, discoverMatches);

// Récupérer un match par ID (4 caractères)
router.get("/:id", authMiddleware, getMatchById);

// Rejoindre un match
router.post("/:id/join", authMiddleware, joinMatch);

// Lancer un match (créateur uniquement)
router.post("/:id/start", authMiddleware, startMatch);

// Passer au set suivant (créateur uniquement)
router.post("/:id/next-set", authMiddleware, nextSet);

// Changer la visibilité (créateur uniquement)
router.patch("/:id/visibility", authMiddleware, setVisibility);

// Terminer un match (créateur uniquement)
router.post("/:id/end", authMiddleware, endMatch);

// Supprimer un match (créateur uniquement)
router.delete("/:id", authMiddleware, deleteMatch);

// Mettre à jour le score (participant uniquement)
router.patch("/:id/score", authMiddleware, updateScore);

export default router;
