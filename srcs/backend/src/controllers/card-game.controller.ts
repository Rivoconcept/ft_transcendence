// /home/hrv/Pictures/ft_transcendence/srcs/backend/src/controllers/card-game.controller.ts

import { Response } from "express";
import { CardGameMode } from "../database/enum/cardGameModeEnum.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { cardGameService } from "../services/card-game.service.js";

export async function createCardGame(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { mode, final_score, is_win, match_id } = req.body;

    if (mode && !Object.values(CardGameMode).includes(mode)) {
      res.status(400).json({ error: "Invalid card game mode" });
      return;
    }

    const card = await cardGameService.createCardGame(req.user!.userId, {
      mode: mode as CardGameMode | undefined,
      final_score,
      is_win,
      match_id,
    });

    res.status(201).json(card);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create card game";
    res.status(400).json({ error: message });
  }
}

// ✅ Réajout de la fonction getUserCardGames
export async function getUserCardGames(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const cards = await cardGameService.getByUser(req.user!.userId);
    res.status(200).json(cards);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get card games";
    res.status(500).json({ error: message });
  }
}