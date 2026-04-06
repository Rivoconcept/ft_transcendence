// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/controllers/user.controller.ts
import { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { authService } from "../services/auth.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id ?? "");

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const profile = await userService.getUserProfile(userId);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    res.status(500).json({ error: message });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id ?? "");

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const user = await userService.getById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    res.status(500).json({ error: message });
  }
}

export async function getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userService.getById(req.user.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    res.status(500).json({ error: message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { username, email, avatar } = req.body;
    const normalizedUsername = typeof username === "string" ? username.trim() : undefined;

    if (normalizedUsername !== undefined && normalizedUsername.length === 0) {
      res.status(400).json({ error: "Username cannot be empty" });
      return;
    }

    const user = await userService.updateProfile(req.user.userId, {
      username: normalizedUsername,
      email,
      avatar,
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    if (message === "Username already exists") {
      res.status(409).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    await authService.changePassword(req.user.userId, currentPassword, newPassword);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change password";
    if (message === "Invalid current password") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

// Public: reset password (after OTP validation on frontend)
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      res.status(400).json({ error: "User ID and new password are required" });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    await userService.resetPassword(userId, newPassword);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    if (message === "User not found") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}
