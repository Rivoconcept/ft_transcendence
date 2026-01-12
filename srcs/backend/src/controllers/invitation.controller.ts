import { Response } from "express";
import { invitationService } from "../services/invitation.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function sendInvitation(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: "Username is required" });
      return;
    }

    const invitation = await invitationService.sendInvitation(req.user.userId, username);
    res.status(201).json(invitation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send invitation";
    res.status(400).json({ error: message });
  }
}

export async function acceptInvitation(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invitationId = parseInt(req.params.id ?? "");

    if (isNaN(invitationId)) {
      res.status(400).json({ error: "Invalid invitation ID" });
      return;
    }

    const invitation = await invitationService.acceptInvitation(invitationId, req.user.userId);
    res.json(invitation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invitation";
    res.status(400).json({ error: message });
  }
}

export async function declineInvitation(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invitationId = parseInt(req.params.id ?? "");

    if (isNaN(invitationId)) {
      res.status(400).json({ error: "Invalid invitation ID" });
      return;
    }

    await invitationService.declineInvitation(invitationId, req.user.userId);
    res.json({ message: "Invitation declined" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to decline invitation";
    res.status(400).json({ error: message });
  }
}

export async function getPendingInvitations(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invitations = await invitationService.getPendingInvitations(req.user.userId);
    res.json(invitations);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get invitations";
    res.status(500).json({ error: message });
  }
}

export async function getSentInvitations(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invitations = await invitationService.getSentInvitations(req.user.userId);
    res.json(invitations);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get invitations";
    res.status(500).json({ error: message });
  }
}
