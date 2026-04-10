import { In } from 'typeorm';
import { User } from '../database/entities/user.js';
import { AppDataSource } from "../database/data-source.js";
import { Match } from "../database/entities/match.js";
import { Participation } from "../database/entities/participation.js";
import { KodRound, KodWinner } from "../database/entities/KodRound.js";

import { socketService } from "../websocket.js";
import { kodGameManager, type KodPlayer, type KodRoundResult } from "../game/KodGameManager.js";

export interface KodGameApiRow {
  id: number;
  match_id: string;
  is_win: boolean;
  player_name: string;
  remaining_points: number;
  total_rounds: number;
  created_at: string;
  mode: 'SINGLE' | 'MULTI';
}

export interface KodMatchParticipant {
  player_name: string;
}

export class KodService {
  private STARTING_POINTS = 10;

  private participationRepo = AppDataSource.getRepository(Participation);
  private kodWinnerRepo = AppDataSource.getRepository(KodWinner);
  private userRepo = AppDataSource.getRepository(User);
  private kodRoundRepo = AppDataSource.getRepository(KodRound);
  private matchRepo = AppDataSource.getRepository(Match);

  //----------------- Kod dashboard data -----------------

  async getKodGames(userId: number): Promise<KodGameApiRow[]> {
    // 1. All matches the user participated in
    const participations = await this.participationRepo.find({
      where: { user_id: userId },
    });

    if (participations.length === 0) return [];

    const matchIds = participations.map((p) => p.match_id);

    // 2. KodWinner rows for those matches
    const winners = await this.kodWinnerRepo.find({
      where: { match_id: In(matchIds) },
      order: { created_at: 'DESC' },
    });

    // 3. Participant counts per match → SINGLE vs MULTI
    const countRows = await this.participationRepo
      .createQueryBuilder('p')
      .select('p.match_id', 'match_id')
      .addSelect('COUNT(*)', 'count')
      .where('p.match_id IN (:...matchIds)', { matchIds })
      .groupBy('p.match_id')
      .getRawMany<{ match_id: string; count: string }>();

    const countMap = new Map(
      countRows.map((r) => [r.match_id, parseInt(r.count, 10)])
    );

    // 4. Current user's username
    const user = await this.userRepo.findOneByOrFail({ id: userId });

    return winners.map((w) => ({
      id: w.id,
      match_id: w.match_id,
      is_win: w.winner_user_id === userId,
      player_name: user.username,
      remaining_points: w.remaining_points,
      total_rounds: w.total_rounds,
      created_at: w.created_at.toISOString(),
      mode: (countMap.get(w.match_id) ?? 1) > 1 ? 'MULTI' : 'SINGLE',
    }));
  }

  async getKodMatchParticipants(match_id: string): Promise<KodMatchParticipant[]> {
    const participations = await this.participationRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u')
      .where('p.match_id = :match_id', { match_id })
      .getMany();

    return participations.map((p) => ({
      player_name: p.user.username,
    }));
  }

  //----------------- Kod game specific logic -----------------

  async initKodGame(
    userId: number,
    matchId: string,
    participants: { userId: number; playerName: string }[]
  ): Promise<KodPlayer[]> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.author_id !== userId) throw new Error("Only the match creator can start the game");
    if (match.match_over) throw new Error("Match is already over");

    const participations = await this.participationRepo.find({ where: { match_id: matchId } });
    if (participations.length < 2) throw new Error("Need at least 2 players");

    for (const p of participations) p.score = this.STARTING_POINTS;
    await this.participationRepo.save(participations);

    match.is_open = false;
    match.current_set = 1;
    await this.matchRepo.save(match);
    const players = kodGameManager.initGame(matchId, participants);
    return players;
  }

  async isInitialized(matchId: string): Promise<KodPlayer[] | null> {
    const state = kodGameManager.getState(matchId);
    if (!state) return null;
    return Array.from(state.players.values());
  }

  async submitKodChoice(
    userId: number,
    matchId: string,
    playerName: string,
    value: number
  ): Promise<{ allSubmitted: boolean; result: KodRoundResult | null }> {
    try {
      // Validate against DB (match exists, not over)
      const match = await this.matchRepo.findOne({ where: { id: matchId } });
      if (!match) throw new Error("Match not found");
      if (match.match_over) throw new Error("Match is already over");

      const participation = await this.participationRepo.findOne({ where: { user_id: userId, match_id: matchId } });
      if (!participation) throw new Error("You are not a participant in this match");

      // Enrich name in manager (player may have changed their display name)
      kodGameManager.setPlayerName(matchId, userId, playerName);

      const { allSubmitted, result } = kodGameManager.submitChoice(matchId, userId, playerName, value);

      const io = socketService.getIO();

      // Notify others that this player submitted (without revealing the value)
      if (!allSubmitted) {
        if (io)
          io.to(`match.${matchId}`).emit("kod:choice-submitted", { matchId, userId });
        return { allSubmitted: false, result: null };
      }

      // All submitted — persist the round and update scores in DB
      await this._persistKodRound(matchId, result!);

      if (result!.gameOver) {
        // Persist winner summary
        await this.kodWinnerRepo.save(
          this.kodWinnerRepo.create({
            match_id: matchId,
            winner_user_id: result!.gameWinnerId!,
            winner_name: result!.gameWinnerName!,
            remaining_points: result!.players.find(p => p.userId === result!.gameWinnerId)?.points ?? 0,
            total_rounds: result!.roundNumber,
          }),
        );

        // Mark match as over and set winner
        match.match_over = true;
        await this.matchRepo.save(match);

        if (io) {
          io.to(`match.${matchId}`).emit("kod:round-result", { matchId, result });
          io.to(`match.${matchId}`).emit("kod:game-over", {
            matchId,
            winnerId: result!.gameWinnerId,
            winnerName: result!.gameWinnerName,
          });
          result!.players.forEach((p) => {
            io.to(`user.${p.userId}`).emit("game-history:updated", {
              userId: p.userId,
              game: "kingOfDiamond",
              matchId,
            });
          });
          result!.players.forEach(p => socketService.leaveMatchRoom(p.userId, matchId));
        }

        kodGameManager.cleanup(matchId);
      } else {
        if (io)
          io.to(`match.${matchId}`).emit("kod:round-result", { matchId, result });
      }

      return { allSubmitted: true, result };
    }
    catch (err) {
      throw err;
    }

  }

  async eliminatePlayer(userId: number, matchId: string): Promise<{ allSubmitted: boolean; result: KodRoundResult | null }> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match || match.match_over) return { allSubmitted: false, result: null };

    const eliminated = kodGameManager.eliminatePlayer(matchId, userId);
    if (!eliminated) return { allSubmitted: false, result: null };

    // Check if eliminating this player completed the round
    const state = kodGameManager.getState(matchId);
    if (!state) return { allSubmitted: false, result: null };

    const activePlayers = Array.from(state.players.values()).filter(p => p.isActive);
    const allSubmitted = activePlayers.every(p => state.choices.has(p.userId));

    if (!allSubmitted) return { allSubmitted: false, result: null };

    // Round is now complete — resolve it normally
    return this.submitKodChoice(userId, matchId, state.players.get(userId)!.playerName, 0);
  }

  private async _persistKodRound(matchId: string, result: KodRoundResult): Promise<void> {
    await this.kodRoundRepo.save(
      this.kodRoundRepo.create({
        match_id: matchId,
        round_number: result.roundNumber,
        average: result.average,
        target: result.target,
        target_rounded: result.targetRounded,
        winner_user_id: result.winnerId,
        winner_name: result.winnerName,
        is_exact_hit: result.isExactHit,
        choices: result.choices.map(c => ({
          userId: c.userId,
          playerName: c.playerName,
          value: c.value,
          pointsLost: c.pointsLost,
        })),
      }),
    );

    // Sync scores back to Participation table
    for (const player of result.players) {
      await this.participationRepo.update(
        { user_id: player.userId, match_id: matchId },
        { score: player.points },
      );
    }
  }

  async getKodRounds(matchId: string): Promise<KodRound[]> {
    return this.kodRoundRepo.find({
      where: { match_id: matchId },
      order: { round_number: "ASC" },
    });
  }
}

export const kodService = new KodService();