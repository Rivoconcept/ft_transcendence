import { Response } from "express";
import { matchService } from "../services/match.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function createMatch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { is_private, set, game_id } = req.body;

    const match = await matchService.createMatch(req.user!.userId, {
      is_private: is_private ?? false,
      set: set ?? 1,
      game_id: game_id ?? undefined,
    });

    res.status(201).json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create match";
    res.status(400).json({ error: message });
  }
}

export async function discoverMatches(req: AuthRequest, res: Response): Promise<void> {
  try {
    const gameId = req.query.game_id ? Number(req.query.game_id) : undefined;
    const matches = await matchService.discoverMatches(gameId);
    res.json(matches);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to discover matches";
    res.status(500).json({ error: message });
  }
}

export async function getMatchById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    const match = await matchService.getMatchById(id);

    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    res.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get match";
    res.status(500).json({ error: message });
  }
}

export async function joinMatch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    const match = await matchService.joinMatch(req.user!.userId, id);
    res.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join match";
    if (message === "Match not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Match is already over" || message === "Match is not open for joining" || message === "You are already in this match") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function startMatch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    const match = await matchService.startMatch(req.user!.userId, id);
    res.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start match";
    if (message === "Match not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the match creator can start the match") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Match is already over" || message === "Match has already started" || message === "Need at least 2 players to start the match") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function nextSet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    const match = await matchService.nextSet(req.user!.userId, id);
    res.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update set";
    if (message === "Match not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the match creator can update the set") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Match is already over") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function setVisibility(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_private } = req.body;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    if (typeof is_private !== "boolean") {
      res.status(400).json({ error: "is_private must be a boolean" });
      return;
    }

    const match = await matchService.setVisibility(req.user!.userId, id, is_private);
    res.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change visibility";
    if (message === "Match not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the match creator can change visibility") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Cannot change visibility of a finished match") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function endMatch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    const match = await matchService.endMatch(req.user!.userId, id);
    res.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end match";
    if (message === "Match not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the match creator can end the match") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Match is already over") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function updateScore(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { action, amount } = req.body;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid match ID" });
      return;
    }

    if (action !== "increment" && action !== "decrement") {
      res.status(400).json({ error: "Action must be 'increment' or 'decrement'" });
      return;
    }

    const parsedAmount = amount !== undefined ? Number(amount) : 1;
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      res.status(400).json({ error: "Amount must be a positive number" });
      return;
    }

    const result = await matchService.updateScore(req.user!.userId, id, action, parsedAmount);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update score";
    if (message === "Match not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "You are not a participant in this match") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Match is already over") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}
