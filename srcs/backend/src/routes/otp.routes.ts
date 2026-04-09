import { Router, type IRouter } from "express";
import { generateOtpByEmail, validateOtpByEmail } from "../controllers/otp.controller.js";

const router: IRouter = Router();

// Public routes (no authentication required)
router.post("/public/generate", generateOtpByEmail);
router.post("/public/validate", validateOtpByEmail);

export default router;
