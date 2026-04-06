import { Router, type IRouter } from "express";
import { getProfile, getMyProfile, updateProfile, changePassword, resetPassword } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/password", authMiddleware, changePassword);
router.post("/reset-password", resetPassword);
router.get("/:id", authMiddleware, getProfile);

export default router;
