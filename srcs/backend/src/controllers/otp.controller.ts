import { Request, Response } from "express";
import { otpService } from "../services/otp.service.js";

// Public: generate OTP by email
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

// Public: validate OTP by email
export async function validateOtpByEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, code, confirm } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      res.status(400).json({ error: "A 6-digit code is required" });
      return;
    }

    const result = await otpService.validateByEmail(email, code, confirm === true);
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
