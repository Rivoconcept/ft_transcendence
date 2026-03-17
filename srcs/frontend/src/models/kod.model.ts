// ─── Domain models for King of Diamonds ──────────────────────────────────────

export interface KodPlayerState {
	userId: number;
	username?: string;
	points: number;
	isActive: boolean;
	hasSubmitted: boolean;
}

export interface KodChoiceReveal {
	userId: number;
	value: number;
}

export interface KodRoundResult {
	roundNumber: number;
	average: number;
	target: number;
	winnerId: number;
	choices: KodChoiceReveal[];
	players: KodPlayerState[];
	gameOver: boolean;
	gameWinnerId: number | null;
}

export interface KodGameState {
	match: {
		id: string;
		current_set: number;
		is_open: boolean;
		match_over: boolean;
		author_id: number;
	};
	players: { user_id: number; score: number }[];
	currentRound: {
		id: number;
		round_number: number;
		is_complete: boolean;
		choices: { user_id: number; value: number }[];
	} | null;
}

// ─── UI phase state machine ───────────────────────────────────────────────────

export type KodPhase =
	| "waiting"      // before host triggers init
	| "submitting"   // round open, waiting for all choices
	| "revealing"    // round complete, showing results
	| "over";        // game finished

// ─── Socket event payloads ────────────────────────────────────────────────────

export interface KodGameStartedPayload {
	matchId: string;
	roundNumber: number;
	players: KodPlayerState[];
}

export interface KodPlayerSubmittedPayload {
	submittedCount: number;
	totalActive: number;
}

export interface KodNextRoundPayload {
	roundNumber: number;
}

export interface KodGameOverPayload {
	matchId: string;
	gameWinnerId: number | null;
	players: { userId: number; points: number }[];
}
