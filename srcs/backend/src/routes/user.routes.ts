import { Router, type IRouter } from "express";
import { getUserProfile, getProfile, getMyProfile, updateProfile, changePassword, resetPassword } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/password", authMiddleware, changePassword);
router.post("/reset-password", resetPassword);
router.get("/:id/profile", authMiddleware, getUserProfile);
router.get("/:id", authMiddleware, getProfile);

export default router;
