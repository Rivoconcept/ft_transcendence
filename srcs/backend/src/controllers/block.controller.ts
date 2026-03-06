import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import * as blockService from "../services/block.service.js";

export async function blockUser(req: AuthRequest, res: Response): Promise<void> {
  const blockerId = req.user!.userId;
  const blockedId = Number(req.params.userId);

  if (isNaN(blockedId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (blockerId === blockedId) {
    res.status(400).json({ error: "Cannot block yourself" });
    return;
  }

  try {
    await blockService.blockUser(blockerId, blockedId);
    res.json({ message: "User blocked" });
  } catch (err: any) {
    if (err.message === "User already blocked") {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to block user" });
  }
}

export async function unblockUser(req: AuthRequest, res: Response): Promise<void> {
  const blockerId = req.user!.userId;
  const blockedId = Number(req.params.userId);

  if (isNaN(blockedId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  try {
    await blockService.unblockUser(blockerId, blockedId);
    res.json({ message: "User unblocked" });
  } catch (err: any) {
    if (err.message === "User is not blocked") {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Failed to unblock user" });
  }
}

export async function getBlockedUsers(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.userId;

  try {
    const blockedIds = await blockService.getBlockedUsers(userId);
    res.json({ blockedIds });
  } catch {
    res.status(500).json({ error: "Failed to get blocked users" });
  }
}

export async function checkBlocked(req: AuthRequest, res: Response): Promise<void> {
  const blockerId = req.user!.userId;
  const blockedId = Number(req.params.userId);

  if (isNaN(blockedId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  try {
    const blocked = await blockService.isBlocked(blockerId, blockedId);
    res.json({ blocked });
  } catch {
    res.status(500).json({ error: "Failed to check block status" });
  }
}
