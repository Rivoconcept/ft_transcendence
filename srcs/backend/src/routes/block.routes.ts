import { Router, type IRouter } from "express";
import { blockUser, unblockUser, getBlockedUsers, checkBlocked, checkBlockedBidirectional } from "../controllers/block.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.get("/", authMiddleware, getBlockedUsers);

// Check bidirectional block between two users
router.get("/:userId/mutual", authMiddleware, checkBlockedBidirectional);

router.get("/:userId", authMiddleware, checkBlocked);

router.post("/:userId", authMiddleware, blockUser);

router.delete("/:userId", authMiddleware, unblockUser);

export default router;
