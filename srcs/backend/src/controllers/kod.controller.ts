import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js"; // your existing type
import { kodService } from "../services/Kod.service.js";

/**
 * POST /api/kod/:matchId/init
 * Called by the host after the lobby "start" flow.
 * Initialises scores to 10 and creates the first round.
 */
export async function initGame(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const matchId = req.params.matchId;
    await kodService.initGame(userId, matchId);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/kod/:matchId/submit
 * Body: { value: number }
 * A player submits their number for the current round.
 */
export async function submitChoice(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const matchId = req.params.matchId;
    const value = Number(req.body.value);

    if (isNaN(value)) {
      res.status(400).json({ success: false, message: "value must be a number" });
      return;
    }

    await kodService.submitChoice(userId, matchId, value);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/kod/:matchId/state
 * Returns current game state (useful for reconnects).
 */
export async function getState(req: AuthRequest, res: Response): Promise<void> {
  try {
    const matchId = req.params.matchId;
    const state = await kodService.getState(matchId);
    res.json({ success: true, data: state });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}
