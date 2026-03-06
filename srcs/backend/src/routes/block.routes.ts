import { Router, type IRouter } from "express";
import { blockUser, unblockUser, getBlockedUsers, checkBlocked, checkBlockedBidirectional } from "../controllers/block.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

// Liste des utilisateurs bloqués
router.get("/", authMiddleware, getBlockedUsers);

// Check bidirectional block between two users
router.get("/:userId/mutual", authMiddleware, checkBlockedBidirectional);

// Vérifier si un utilisateur est bloqué
router.get("/:userId", authMiddleware, checkBlocked);

// Bloquer un utilisateur
router.post("/:userId", authMiddleware, blockUser);

// Débloquer un utilisateur
router.delete("/:userId", authMiddleware, unblockUser);

export default router;
