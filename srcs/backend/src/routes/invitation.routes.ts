import { Router, type IRouter } from "express";
import {
  sendInvitation,
  acceptInvitation,
  declineInvitation,
  getPendingInvitations,
  getSentInvitations,
} from "../controllers/invitation.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.post("/", authMiddleware, sendInvitation);
router.get("/pending", authMiddleware, getPendingInvitations);
router.get("/sent", authMiddleware, getSentInvitations);
router.post("/:id/accept", authMiddleware, acceptInvitation);
router.post("/:id/decline", authMiddleware, declineInvitation);

export default router;
