import { Response } from "express";
import { cardGameService } from "../services/card-game.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function createCardGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { mode, final_score, is_win, match_id } = req.body;

    const card = await cardGameService.createCardGame(req.user!.userId, {
      mode,
      final_score,
      is_win,
      match_id,
    });

    res.status(201).json(card);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create card game";
    res.status(400).json({ error: message });
  }
}

export async function getUserCardGames(req: AuthRequest, res: Response): Promise<void> {
  try {
    const cards = await cardGameService.getByUser(req.user!.userId);
    res.json(cards);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get card games";
    res.status(500).json({ error: message });
  }
}
