// src/game/KodGameManager.ts
//
// Pure in-memory game state for Roi de Carreaux.
// No database reads/writes except saving the winner at the end.
// All state lives here and is broadcast via socket.

import { AppDataSource } from "../database/data-source.js";
import { Match } from "../database/entities/match.js";
import { Participation } from "../database/entities/participation.js";
import { KodWinner } from "../database/entities/KodRound.js";


const STARTING_POINTS = 10;
const MULTIPLIER = 0.8;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KodPlayer {
  userId: number;
  playerName: string;
  points: number;
  isActive: boolean;   // points > 0
  hasSubmitted: boolean;  // submitted this round
}

export interface KodChoice {
  userId: number;
  playerName: string;
  value: number;
}

export interface KodRoundResult {
  roundNumber: number;
  average: number;
  target: number;       // average * 0.8 (raw float)
  targetRounded: number;      // Math.round(target)
  winnerId: number;
  winnerName: string;
  isExactHit: boolean;      // winner's value === targetRounded
  choices: (KodChoice & { isWinner: boolean; pointsLost: number })[];
  players: KodPlayer[];  // updated scores after this round
  gameOver: boolean;
  gameWinnerId: number | null;
  gameWinnerName: string | null;
}

// Per-match in-memory state
interface KodMatchState {
  matchId: string;
  roundNumber: number;
  players: Map<number, KodPlayer>;   // userId → player
  choices: Map<number, KodChoice>;   // userId → choice this round
  isStarted: boolean;
  isOver: boolean;
}

// ─── Manager (singleton per process) ─────────────────────────────────────────

class KodGameManager {
  // matchId → state
  private games = new Map<string, KodMatchState>();

  // ── Init ───────────────────────────────────────────────────────────────────

  /**
   * Called when the host emits `kod:init`.
   * Reads participations from DB, builds in-memory state, returns initial player list.
   */
  async initGame(matchId: string, hostUserId: number): Promise<KodPlayer[]> {
    const matchRepo = AppDataSource.getRepository(Match);
    const participRepo = AppDataSource.getRepository(Participation);

    const match = await matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match introuvable");
    if (match.author_id !== hostUserId) throw new Error("Seul le créateur peut démarrer");
    if (match.match_over) throw new Error("Partie déjà terminée");

    const participations = await participRepo.find({ where: { match_id: matchId } });
    if (participations.length < 2) throw new Error("Il faut au moins 2 joueurs");

    // Reset scores in DB
    for (const p of participations) p.score = STARTING_POINTS;
    await participRepo.save(participations);

    // Close match
    match.is_open = false;
    match.current_set = 1;
    await matchRepo.save(match);

    // Build in-memory players — names come from socket playerName field
    // We'll receive names from the socket payload; use userId as fallback
    const players = new Map<number, KodPlayer>();
    for (const p of participations) {
      players.set(p.user_id, {
        userId: p.user_id,
        playerName: `Player ${p.user_id}`, // enriched below from socket data
        points: STARTING_POINTS,
        isActive: true,
        hasSubmitted: false,
      });
      console.log(`[KoD] Added player ${p.user_id} to match ${matchId}`);
    }

    const state: KodMatchState = {
      matchId,
      roundNumber: 1,
      players,
      choices: new Map(),
      isStarted: true,
      isOver: false,
    };

    this.games.set(matchId, state);

    return Array.from(players.values());
  }

  /**
   * Enrich player names from socket room data (called right after initGame).
   */
  setPlayerName(matchId: string, userId: number, playerName: string): void {
    const state = this.games.get(matchId);
    if (!state) return;
    const player = state.players.get(userId);
    if (player) player.playerName = playerName;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  /**
   * Record a player's choice. Returns null if not all active players have
   * submitted yet, or the resolved KodRoundResult once the round is complete.
   */
  async submitChoice(
    matchId: string,
    userId: number,
    playerName: string,
    value: number,
  ): Promise<{ allSubmitted: boolean; result: KodRoundResult | null }> {
    if (value < 0 || value > 100) throw new Error("Valeur entre 0 et 100");

    const state = this.games.get(matchId);
    if (!state) throw new Error("Partie introuvable");
    if (!state.isStarted) throw new Error("La partie n'a pas commencé");
    if (state.isOver) throw new Error("La partie est terminée");

    const player = state.players.get(userId);
    if (!player) throw new Error("Vous ne participez pas à ce match");
    if (!player.isActive) throw new Error("Vous êtes éliminé");
    if (state.choices.has(userId)) throw new Error("Vous avez déjà soumis");

    // Update name in case it changed
    player.playerName = playerName;

    // Record choice
    state.choices.set(userId, { userId, playerName, value });
    player.hasSubmitted = true;

    // Check if all active players submitted
    const activePlayers = Array.from(state.players.values()).filter((p) => p.isActive);
    const allSubmitted = activePlayers.every((p) => state.choices.has(p.userId));

    if (!allSubmitted) {
      return { allSubmitted: false, result: null };
    }

    // Resolve round
    const result = await this._resolveRound(state);
    return { allSubmitted: true, result };
  }

  // ── Resolve ────────────────────────────────────────────────────────────────

  private async _resolveRound(state: KodMatchState): Promise<KodRoundResult> {
    const activePlayers = Array.from(state.players.values()).filter((p) => p.isActive);
    const choices = activePlayers.map((p) => state.choices.get(p.userId)!);

    const values = choices.map((c) => c.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const target = average * MULTIPLIER;
    const targetRounded = Math.round(target);

    // Winner: closest to raw target; tie → lowest value
    let winnerId = choices[0]!.userId;
    let winnerName = choices[0]!.playerName;
    let minDiff = Infinity;

    for (const c of choices) {
      const diff = Math.abs(c.value - target);
      const currentWinnerVal = choices.find((x) => x.userId === winnerId)!.value;
      if (diff < minDiff || (diff === minDiff && c.value < currentWinnerVal)) {
        minDiff = diff;
        winnerId = c.userId;
        winnerName = c.playerName;
      }
    }

    const winnerChoice = choices.find((c) => c.userId === winnerId)!;
    const isExactHit = winnerChoice.value === targetRounded;

    // 2-player edge: choices are {0, 100}
    const isTwoPlayerEdge =
      activePlayers.length === 2 &&
      choices.some((c) => c.value === 0) &&
      choices.some((c) => c.value === 100);

    // Apply deductions
    const choicesWithResult = choices.map((c) => {
      const isWinner = c.userId === winnerId;
      let pointsLost = 0;

      if (!isWinner) {
        if (isTwoPlayerEdge && c.value === 0) {
          pointsLost = 2;
        } else if (isExactHit) {
          pointsLost = 2;
        } else {
          pointsLost = 1;
        }
      }

      const player = state.players.get(c.userId)!;
      player.points = Math.max(0, player.points - pointsLost);
      player.isActive = player.points > 0;
      player.hasSubmitted = false; // reset for next round

      return { ...c, isWinner, pointsLost };
    });

    // Game over?
    const stillActive = Array.from(state.players.values()).filter((p) => p.isActive);
    const gameOver = stillActive.length <= 1;
    const gameWinner = gameOver ? (stillActive[0] ?? state.players.get(winnerId)!) : null;

    if (gameOver) {
      state.isOver = true;
      await this._saveWinner(state, gameWinner!, state.roundNumber);
    } else {
      // Advance round
      state.roundNumber += 1;
      state.choices.clear();
    }

    return {
      roundNumber: state.roundNumber - (gameOver ? 0 : 1), // the round that just finished
      average,
      target,
      targetRounded,
      winnerId,
      winnerName,
      isExactHit,
      choices: choicesWithResult,
      players: Array.from(state.players.values()),
      gameOver,
      gameWinnerId: gameWinner?.userId ?? null,
      gameWinnerName: gameWinner?.playerName ?? null,
    };
  }

  // ── Save winner ────────────────────────────────────────────────────────────

  private async _saveWinner(
    state: KodMatchState,
    winner: KodPlayer,
    totalRounds: number,
  ): Promise<void> {
    try {
      const matchRepo = AppDataSource.getRepository(Match);
      const winnerRepo = AppDataSource.getRepository(KodWinner);

      const match = await matchRepo.findOne({ where: { id: state.matchId } });
      if (match) {
        match.match_over = true;
        await matchRepo.save(match);
      }

      await winnerRepo.save(
        winnerRepo.create({
          match_id: state.matchId,
          winner_user_id: winner.userId,
          winner_name: winner.playerName,
          remaining_points: winner.points,
          total_rounds: totalRounds,
        }),
      );
    } catch (err) {
      console.error("[KoD] Failed to save winner:", err);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getState(matchId: string): KodMatchState | undefined {
    return this.games.get(matchId);
  }

  getPlayers(matchId: string): KodPlayer[] {
    const state = this.games.get(matchId);
    return state ? Array.from(state.players.values()) : [];
  }

  cleanup(matchId: string): void {
    this.games.delete(matchId);
  }
}

export const kodGameManager = new KodGameManager();
