import { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { userOnlineTimeService } from '../services/user-online-time.service.js';

/**
 * GET /user-online-time
 * Fetch all online time records for the authenticated user
 */
export async function getUserOnlineTime(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const records = await userOnlineTimeService.getUserOnlineTime(userId);
    res.json(records);
  } catch {
    res.status(500).json({ message: 'Failed to fetch online time' });
  }
}

/**
 * POST /user-online-time
 * Record or update daily online time
 * Body: { date: string (YYYY-MM-DD), minutes: number }
 */
export async function recordOnlineTime(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { date, minutes } = req.body;

    if (!date || typeof minutes !== 'number' || minutes < 0) {
      res.status(400).json({ message: 'Invalid request: date and minutes required' });
      return;
    }

    const result = await userOnlineTimeService.recordDailyOnlineTime(userId, date, minutes);
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Failed to record online time' });
  }
}

/**
 * POST /user-online-time/add
 * Increment online time for a date (used for session tracking)
 * Body: { date: string (YYYY-MM-DD), minutes: number }
 */
export async function addToOnlineTime(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { date, minutes } = req.body;

    if (!date || typeof minutes !== 'number' || minutes < 0) {
      res.status(400).json({ message: 'Invalid request: date and minutes required' });
      return;
    }

    const result = await userOnlineTimeService.addToOnlineTime(userId, date, minutes);
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Failed to add online time' });
  }
}

/**
 * GET /user-online-time/total
 * Get total playtime in minutes
 */
export async function getTotalPlaytime(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const totalMinutes = await userOnlineTimeService.getTotalPlaytime(userId);
    res.json({ totalMinutes });
  } catch {
    res.status(500).json({ message: 'Failed to fetch total playtime' });
  }
}
