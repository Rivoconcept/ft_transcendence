import { AppDataSource } from "../database/data-source.js";
import { Match } from "../database/entities/match.js";
import { Participation } from "../database/entities/participation.js";
import { socketService } from "../websocket.js";
import { KodRound, KodChoice } from "../database/entities/KodRound.js";

const KOD_GAME_ID = 2; // "Roi de Carreaux" row in the Game table
const STARTING_POINTS = 10;
const TARGET_MULTIPLIER = 0.8;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KodPlayerState {
  userId: number;
  username: string;
  points: number;       // remaining points (= Participation.score)
  isActive: boolean;    // score > 0
  hasSubmitted: boolean;
}

export interface KodRoundResult {
  roundNumber: number;
  average: number;
  target: number;
  winnerId: number;
  choices: { userId: number; value: number }[];
  players: KodPlayerState[];
  gameOver: boolean;
  gameWinnerId: number | null;
}

// ─── Repositories (lazy — avoids initialisation-order issues) ────────────────
const matchRepo = () => AppDataSource.getRepository(Match);
const participRepo = () => AppDataSource.getRepository(Participation);
const roundRepo = () => AppDataSource.getRepository(KodRound);
const choiceRepo = () => AppDataSource.getRepository(KodChoice);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getActivePlayers(matchId: string): Promise<Participation[]> {
  const all = await participRepo().find({ where: { match_id: matchId } });
  return all.filter((p) => p.score > 0);
}

async function getCurrentRound(matchId: string, roundNumber: number): Promise<KodRound | null> {
  return roundRepo().findOne({
    where: { match_id: matchId, round_number: roundNumber },
    relations: ["choices"],
  });
}

// ─── Service ─────────────────────────────────────────────────────────────────

class KodService {

  /**
   * Called when the host clicks "Start" in the lobby.
   * - Validates the match belongs to Roi de Carreaux
   * - Sets every participant's score to STARTING_POINTS
   * - Creates the first KodRound
   * - Emits `kod:game-started` to the match room
   */
  async initGame(userId: number, matchId: string): Promise<void> {
    const match = await matchRepo().findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match introuvable");
    if (match.game_id !== KOD_GAME_ID) throw new Error("Ce match n'est pas un Roi de Carreaux");
    if (match.author_id !== userId) throw new Error("Seul le créateur peut démarrer la partie");
    if (match.match_over) throw new Error("La partie est déjà terminée");
    if (!match.is_open) throw new Error("La partie a déjà commencé");

    const participations = await participRepo().find({ where: { match_id: matchId } });
    if (participations.length < 2) throw new Error("Il faut au moins 2 joueurs");

    // Initialise every player to STARTING_POINTS
    for (const p of participations) {
      p.score = STARTING_POINTS;
    }
    await participRepo().save(participations);

    // Close the match to new joiners
    match.is_open = false;
    match.current_set = 1;
    await matchRepo().save(match);

    // Create round 1
    const round = roundRepo().create({ match_id: matchId, round_number: 1 });
    await roundRepo().save(round);

    // Notify the room
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("kod:game-started", {
        matchId,
        roundNumber: 1,
        players: participations.map((p) => ({
          userId: p.user_id,
          points: p.score,
          isActive: true,
          hasSubmitted: false,
        })),
      });
    }
  }

  /**
   * A player submits their secret number for the current round.
   * Emits `kod:choice-ack` to the submitter only.
   * Emits `kod:player-submitted` (count only, no value) to the whole room.
   * Auto-resolves the round when all active players have submitted.
   */
  async submitChoice(userId: number, matchId: string, value: number): Promise<void> {
    if (value < 0 || value > 100) throw new Error("Le nombre doit être entre 0 et 100");

    const match = await matchRepo().findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match introuvable");
    if (match.match_over) throw new Error("La partie est terminée");
    if (match.is_open) throw new Error("La partie n'a pas encore commencé");

    const participation = await participRepo().findOne({
      where: { user_id: userId, match_id: matchId },
    });
    if (!participation) throw new Error("Vous ne participez pas à ce match");
    if (participation.score <= 0) throw new Error("Vous êtes éliminé");

    const round = await getCurrentRound(matchId, match.current_set);
    if (!round) throw new Error("Manche introuvable");
    if (round.is_complete) throw new Error("La manche est déjà terminée");

    const alreadySubmitted = round.choices.find((c) => c.user_id === userId);
    if (alreadySubmitted) throw new Error("Vous avez déjà soumis un nombre");

    // Persist the choice
    const choice = choiceRepo().create({ user_id: userId, round_id: round.id, value });
    await choiceRepo().save(choice);
    round.choices.push(choice);

    const io = socketService.getIO();

    // ACK only to submitter (value stays secret)
    if (io) {
      io.to(`user.${userId}`).emit("kod:choice-ack", { value });
    }

    // Count progress for the whole room
    const activePlayers = await getActivePlayers(matchId);
    const submittedCount = round.choices.length;
    const totalActive = activePlayers.length;

    if (io) {
      io.to(`match.${matchId}`).emit("kod:player-submitted", {
        submittedCount,
        totalActive,
      });
    }

    // Auto-resolve when everyone submitted
    if (submittedCount >= totalActive) {
      await this.resolveRound(matchId, round, activePlayers);
    }
  }

  /**
   * Internal: compute round result, update scores, advance or end the match.
   */
  private async resolveRound(
    matchId: string,
    round: KodRound,
    activePlayers: Participation[],
  ): Promise<void> {
    const values = round.choices.map((c) => c.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const target = average * TARGET_MULTIPLIER;

    // Find winner: closest to target (ties go to lowest value)
    let winnerId = round.choices[0]!.user_id;
    let minDiff = Infinity;
    for (const choice of round.choices) {
      const diff = Math.abs(choice.value - target);
      if (diff < minDiff) { minDiff = diff; winnerId = choice.user_id; }
    }

    // Losers lose 1 point; eliminated if score reaches 0
    for (const p of activePlayers) {
      if (p.user_id !== winnerId) {
        p.score = Math.max(0, p.score - 1);
      }
    }
    await participRepo().save(activePlayers);

    // Finalise round
    round.average = average;
    round.target = target;
    round.winner_id = winnerId;
    round.is_complete = true;
    await roundRepo().save(round);

    // Check game-over condition
    const stillActive = activePlayers.filter((p) => p.score > 0);
    const gameOver = stillActive.length <= 1;
    const gameWinnerId = gameOver ? (stillActive[0]?.user_id ?? winnerId) : null;

    // Build player state snapshot
    const allParticipants = await participRepo().find({ where: { match_id: matchId } });
    const players: KodPlayerState[] = allParticipants.map((p) => ({
      userId: p.user_id,
      username: "",              // enriched on the client via their own user store
      points: p.score,
      isActive: p.score > 0,
      hasSubmitted: false,
    }));

    const io = socketService.getIO();

    // Broadcast round result simultaneously to everyone
    const result: KodRoundResult = {
      roundNumber: round.round_number,
      average,
      target,
      winnerId,
      choices: round.choices.map((c) => ({ userId: c.user_id, value: c.value })),
      players,
      gameOver,
      gameWinnerId,
    };
    if (io) io.to(`match.${matchId}`).emit("kod:round-result", result);

    if (gameOver) {
      await this._endGame(matchId, gameWinnerId, allParticipants);
    } else {
      await this._nextRound(matchId);
    }
  }

  /** Advance Match to the next round / set */
  private async _nextRound(matchId: string): Promise<void> {
    const match = await matchRepo().findOne({ where: { id: matchId } });
    if (!match) return;

    match.current_set += 1;
    // Expand max sets dynamically if needed (rounds are unlimited in KoD)
    if (match.current_set > match.set) match.set = match.current_set;
    await matchRepo().save(match);

    const round = roundRepo().create({
      match_id: matchId,
      round_number: match.current_set,
    });
    await roundRepo().save(round);

    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("kod:next-round", {
        roundNumber: match.current_set,
      });
    }
  }

  /** Finalize the match, emit game-over, clean up rooms */
  private async _endGame(
    matchId: string,
    gameWinnerId: number | null,
    allParticipants: Participation[],
  ): Promise<void> {
    const match = await matchRepo().findOne({ where: { id: matchId } });
    if (!match) return;

    match.match_over = true;
    match.is_open = false;
    await matchRepo().save(match);

    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("kod:game-over", {
        matchId,
        gameWinnerId,
        players: allParticipants.map((p) => ({
          userId: p.user_id,
          points: p.score,
        })),
      });
    }

    // Remove all participants from the match room
    allParticipants.forEach((p) => socketService.leaveMatchRoom(p.user_id, matchId));
  }

  /** REST helper — return current game state for a match */
  async getState(matchId: string): Promise<{
    match: Match;
    players: Participation[];
    currentRound: KodRound | null;
  }> {
    const match = await matchRepo().findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match introuvable");

    const players = await participRepo().find({ where: { match_id: matchId } });
    const currentRound = await getCurrentRound(matchId, match.current_set);

    return { match, players, currentRound };
  }
}

export const kodService = new KodService();
