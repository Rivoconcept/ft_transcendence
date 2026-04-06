import { Router, type IRouter } from "express";
import { generateOtp, validateOtp, generateOtpByEmail, validateOtpByEmail } from "../controllers/otp.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

// Authenticated routes (account confirmation)
router.post("/generate", authMiddleware, generateOtp);
router.post("/validate", authMiddleware, validateOtp);

// Public routes (password recovery)
router.post("/public/generate", generateOtpByEmail);
router.post("/public/validate", validateOtpByEmail);

export default router;
