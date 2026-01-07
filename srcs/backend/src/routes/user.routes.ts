import { Router, type IRouter } from "express";
import { getProfile, getMyProfile, updateProfile } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateProfile);
router.get("/:id", authMiddleware, getProfile);

export default router;
