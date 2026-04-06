import { Router, type IRouter } from "express";
import { generateOtp, validateOtp } from "../controllers/otp.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.post("/generate", authMiddleware, generateOtp);
router.post("/validate", authMiddleware, validateOtp);

export default router;
