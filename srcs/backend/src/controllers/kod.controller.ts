import { Response } from 'express';
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { kodService } from '../services/Kod.service.js';

export async function getKodGames(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId: number = req.user!.userId;
    const games = await kodService.getKodGames(userId);
    res.json(games);
  } catch {
    res.status(500).json({ message: 'Failed to fetch KOD game history' });
  }
}

/**
 * GET /kod-games/match/:match_id
 * Returns all participants of a given KOD match (used by the frontend
 * to resolve opponent names, mirroring card-games/match/:match_id).
 */
export async function getKodMatchParticipants(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { match_id } = req.params;

    if (!match_id || match_id.length !== 4) {
      res.status(400).json({ message: 'Invalid match_id' });
      return;
    }

    const participants = await kodService.getKodMatchParticipants(match_id);
    res.json(participants);
  } catch {
    res.status(500).json({ message: 'Failed to fetch match participants' });
  }
}
