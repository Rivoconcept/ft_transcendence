import { apiService } from "./index"; // your existing service
import type { KodGameState } from "../models/kod.model";

const BASE = "/kod";

/**
 * All HTTP calls for King of Diamonds.
 * Uses the existing apiService (axios instance with token interceptors).
 */
class KodApiService {

	/**
	 * POST /api/kod/:matchId/init
	 * Host initialises scores (10 pts each) and creates round 1.
	 */
	async initGame(matchId: string): Promise<void> {
		await apiService.post<void>(`${BASE}/${matchId}/init`);
	}

	/**
	 * POST /api/kod/:matchId/submit
	 * Player submits their secret number for the current round.
	 */
	async submitChoice(matchId: string, value: number): Promise<void> {
		await apiService.post<void>(`${BASE}/${matchId}/submit`, { value });
	}

	/**
	 * GET /api/kod/:matchId/state
	 * Fetch full game state — used on mount / reconnect.
	 */
	async getState(matchId: string): Promise<KodGameState> {
		const res = await apiService.get<{ success: boolean; data: KodGameState }>(
			`${BASE}/${matchId}/state`,
		);
		return res.data;
	}
}

export const kodApiService = new KodApiService();
