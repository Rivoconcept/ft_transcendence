import { Router, type IRouter } from "express";
import {
  sendInvitation,
  acceptInvitation,
  cancelInvitation,
  getPendingInvitations,
  getSentInvitations,
  getFriends,
  getNonFriendIds,
} from "../controllers/invitation.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.post("/", authMiddleware, sendInvitation);
router.get("/pending", authMiddleware, getPendingInvitations);
router.get("/sent", authMiddleware, getSentInvitations);
router.get("/friends", authMiddleware, getFriends);
router.get("/non-friends", authMiddleware, getNonFriendIds);
router.post("/:id/accept", authMiddleware, acceptInvitation);
router.post("/:id/cancel", authMiddleware, cancelInvitation);

export default router;
