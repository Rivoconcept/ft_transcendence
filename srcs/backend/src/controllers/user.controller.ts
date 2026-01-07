import { Response } from "express";
import { userService } from "../services/user.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

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

    const { realname, avatar } = req.body;

    const user = await userService.updateProfile(req.user.userId, { realname, avatar });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    res.status(500).json({ error: message });
  }
}
