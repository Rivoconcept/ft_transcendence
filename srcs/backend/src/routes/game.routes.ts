import { Router, type IRouter } from "express";
import {
  createGame,
  discoverGames,
  getGameById,
  joinGame,
  startGame,
  nextSet,
  setVisibility,
  endGame,
} from "../controllers/game.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

// Créer une partie
router.post("/", authMiddleware, createGame);

// Découvrir les parties publiques ouvertes
router.get("/discover", authMiddleware, discoverGames);

// Récupérer une partie par ID (4 caractères)
router.get("/:id", authMiddleware, getGameById);

// Rejoindre une partie
router.post("/:id/join", authMiddleware, joinGame);

// Lancer une partie (créateur uniquement)
router.post("/:id/start", authMiddleware, startGame);

// Passer au set suivant (créateur uniquement)
router.post("/:id/next-set", authMiddleware, nextSet);

// Changer la visibilité (créateur uniquement)
router.patch("/:id/visibility", authMiddleware, setVisibility);

// Terminer une partie (créateur uniquement)
router.post("/:id/end", authMiddleware, endGame);

export default router;
