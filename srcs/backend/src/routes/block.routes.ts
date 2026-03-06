import { Router, type IRouter } from "express";
import { blockUser, unblockUser, getBlockedUsers, checkBlocked } from "../controllers/block.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

// Liste des utilisateurs bloqués
router.get("/", authMiddleware, getBlockedUsers);

// Vérifier si un utilisateur est bloqué
router.get("/:userId", authMiddleware, checkBlocked);

// Bloquer un utilisateur
router.post("/:userId", authMiddleware, blockUser);

// Débloquer un utilisateur
router.delete("/:userId", authMiddleware, unblockUser);

export default router;
