import { Request, Response } from "express";
import { otpService } from "../services/otp.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

// Authenticated: generate OTP for current user
export async function generateOtp(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await otpService.generate(req.user!.userId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate OTP";
    if (message === "User not found") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

// Authenticated: validate OTP for current user (account confirmation)
export async function validateOtp(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string" || code.length !== 6) {
      res.status(400).json({ error: "A 6-digit code is required" });
      return;
    }

    const result = await otpService.validate(req.user!.userId, code);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate OTP";
    if (message === "User not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "OTP code has expired" || message === "Invalid OTP code" || message === "No OTP code generated") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

// Public: generate OTP by email (for password recovery)
export async function generateOtpByEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const result = await otpService.generateByEmail(email);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate OTP";
    if (message === "No account found with this email") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

// Public: validate OTP by email (for password recovery)
export async function validateOtpByEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      res.status(400).json({ error: "A 6-digit code is required" });
      return;
    }

    const result = await otpService.validateByEmail(email, code);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate OTP";
    if (message === "No account found with this email" || message === "OTP code has expired" || message === "Invalid OTP code" || message === "No OTP code generated") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}
