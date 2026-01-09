import { Response } from "express";
import { gameService } from "../services/game.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function createGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { is_private, set } = req.body;

    const game = await gameService.createGame(req.user!.userId, {
      is_private: is_private ?? false,
      set: set ?? 1,
    });

    res.status(201).json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create game";
    res.status(400).json({ error: message });
  }
}

export async function discoverGames(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const games = await gameService.discoverGames();
    res.json(games);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to discover games";
    res.status(500).json({ error: message });
  }
}

export async function getGameById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid game ID" });
      return;
    }

    const game = await gameService.getGameById(id);

    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    res.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get game";
    res.status(500).json({ error: message });
  }
}

export async function joinGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid game ID" });
      return;
    }

    const game = await gameService.joinGame(req.user!.userId, id);
    res.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join game";
    if (message === "Game not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Game is already over" || message === "Game is not open for joining" || message === "You are already in this game") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function startGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid game ID" });
      return;
    }

    const game = await gameService.startGame(req.user!.userId, id);
    res.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start game";
    if (message === "Game not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the game creator can start the game") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Game is already over" || message === "Game has already started" || message === "Need at least 2 players to start the game") {
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
      res.status(400).json({ error: "Invalid game ID" });
      return;
    }

    const game = await gameService.nextSet(req.user!.userId, id);
    res.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update set";
    if (message === "Game not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the game creator can update the set") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Game is already over") {
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
      res.status(400).json({ error: "Invalid game ID" });
      return;
    }

    if (typeof is_private !== "boolean") {
      res.status(400).json({ error: "is_private must be a boolean" });
      return;
    }

    const game = await gameService.setVisibility(req.user!.userId, id, is_private);
    res.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change visibility";
    if (message === "Game not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the game creator can change visibility") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Cannot change visibility of a finished game") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function endGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.length !== 4) {
      res.status(400).json({ error: "Invalid game ID" });
      return;
    }

    const game = await gameService.endGame(req.user!.userId, id);
    res.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to end game";
    if (message === "Game not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the game creator can end the game") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Game is already over") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}
