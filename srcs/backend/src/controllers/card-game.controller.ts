// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/controllers/card-game.controller.ts
import { Response, Request } from "express";
import { CardGameMode } from "../database/enum/cardGameModeEnum.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { cardGameService } from "../services/card-game.service.js";

export async function createCardGame(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { mode, final_score, is_win, match_id, player_name } = req.body;

    // Vérifier que le mode est valide
    if (mode && !Object.values(CardGameMode).includes(mode)) {
      res.status(400).json({ error: "Invalid card game mode" });
      return;
    }

    // Vérifier que match_id est fourni
    if (!match_id) {
      res.status(400).json({ error: "match_id is required" });
      return;
    }

    // Vérifier que player_name est fourni
    if (!player_name || player_name.trim() === "") {
      res.status(400).json({ error: "player_name is required" });
      return;
    }

    // Appel du service pour créer la partie
    const card = await cardGameService.createCardGame(req.user!.userId, {
      mode: mode as CardGameMode | undefined,
      final_score,
      is_win,
      match_id,
      player_name,
    });

    res.status(201).json(card);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create card game";
    res.status(400).json({ error: message });
  }
}

// Récupérer toutes les parties d'un utilisateur
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


// card-game.controller.ts

export const getMatchResults = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const results = await cardGameService.getMatchResults(matchId);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching match results:", error);
    res.status(500).json({ error: "Failed to fetch match results" });
  }
};


export async function getLastSingleResult(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const result = await cardGameService.getLastSingleResult(req.user!.userId);

    if (!result) {
      res.status(404).json({ error: "No game result found" });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching last result:", error);
    res.status(500).json({ error: "Failed to fetch last result" });
  }
}

