// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/services/match.service.ts
import { AppDataSource } from "../database/data-source.js";
import { KodRound, KodWinner } from "../database/entities/KodRound.js";
import { kodGameManager, type KodPlayer, type KodRoundResult } from "./KodGameManager.js";
import { Match } from "../database/entities/match.js";
import { Participation } from "../database/entities/participation.js";
import { socketService } from "../websocket.js";

interface CreateMatchDTO {
  is_private?: boolean;
  set?: number;
  game_id?: number;
}

interface MatchItem {
  id: string;
  set: number;
  current_set: number;
  authorId: number;
  gameId: number | null;
  is_open: boolean;
  is_private: boolean;
  match_over: boolean;
  created_at: Date;
  participantIds: number[];
}

class MatchService {
  private matchRepository = AppDataSource.getRepository(Match);
  private participationRepository = AppDataSource.getRepository(Participation);
  private kodRoundRepository = AppDataSource.getRepository(KodRound);
  private kodRepository = AppDataSource.getRepository(KodWinner);

  private async generateUniqueId(): Promise<string> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const id = Match.generateId();
      const existing = await this.matchRepository.findOne({ where: { id } });
      if (!existing) {
        return id;
      }
    }
    throw new Error("Failed to generate unique match ID");
  }

  async createMatch(userId: number, data?: CreateMatchDTO): Promise<MatchItem> {
    const uniqueId = await this.generateUniqueId();

    const match = this.matchRepository.create({
      id: uniqueId,
      author_id: userId,
      is_open: true,
      is_private: data?.is_private ?? false,
      match_over: false,
      set: data?.set ?? 1,
      current_set: 1,
      game_id: data?.game_id ?? null,
    });

    await this.matchRepository.save(match);

    // Ajouter le créateur comme participant
    const participation = this.participationRepository.create({
      user_id: userId,
      match_id: match.id,
      score: 0,
    });

    await this.participationRepository.save(participation);

    // Faire rejoindre le créateur à la room du match
    socketService.joinMatchRoom(userId, match.id);

    // Notifier via la room du match
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${match.id}`).emit("match:created", {
        matchId: match.id,
        authorId: userId,
      });
    }

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds: [userId],
    };
  }

  async discoverMatches(gameId?: number): Promise<MatchItem[]> {
    // Seulement les matchs publics, ouverts et non terminés
    const whereClause: Record<string, unknown> = {
      is_open: true,
      is_private: false,
      match_over: false,
    };

    if (gameId !== undefined) {
      whereClause.game_id = gameId;
    }

    const matches = await this.matchRepository.find({
      where: whereClause,
      order: { created_at: "DESC" },
    });

    const matchIds = matches.map((m) => m.id);

    if (matchIds.length === 0) {
      return [];
    }

    // Récupérer les participants
    const participations = await this.participationRepository.find({
      where: matchIds.map((id) => ({ match_id: id })),
    });

    const participantsByMatch = new Map<string, number[]>();
    participations.forEach((p) => {
      const existing = participantsByMatch.get(p.match_id) ?? [];
      existing.push(p.user_id);
      participantsByMatch.set(p.match_id, existing);
    });

    return matches.map((match) => ({
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds: participantsByMatch.get(match.id) ?? [],
    }));
  }

  async joinMatch(userId: number, matchId: string): Promise<MatchItem> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.match_over) {
      throw new Error("Match is already over");
    }

    if (!match.is_open) {
      throw new Error("Match is not open for joining");
    }

    // Vérifier si l'utilisateur est déjà participant
    const existingParticipation = await this.participationRepository.findOne({
      where: { user_id: userId, match_id: matchId },
    });

    if (existingParticipation) {
      throw new Error("You are already in this match");
    }

    // Ajouter le participant
    const participation = this.participationRepository.create({
      user_id: userId,
      match_id: matchId,
      score: 0,
    });

    // Récupérer tous les participants
    await this.participationRepository.save(participation);
    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });
    const participantIds = participations.map((p) => p.user_id);

    // Faire rejoindre l'utilisateur à la room du match
    // socketService.joinMatchRoom(userId, matchId);

    // Notifier tous les participants
    /** this is already handle in websocket */
    // const io = socketService.getIO();
    // if (io) {
    //   io.to(`match.${matchId}`).emit("match:player-joined", {
    //     matchId,
    //     userId,
    //     participantIds,
    //   });
    // }

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds,
    };
  }

  async startMatch(userId: number, matchId: string): Promise<MatchItem> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.author_id !== userId) {
      throw new Error("Only the match creator can start the match");
    }

    if (match.match_over) {
      throw new Error("Match is already over");
    }

    if (!match.is_open) {
      throw new Error("Match has already started");
    }

    // Vérifier qu'il y a au moins 2 participants
    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });

    if (participations.length < 2) {
      throw new Error("Need at least 2 players to start the match");
    }

    // Fermer le match aux nouveaux joueurs
    match.is_open = false;
    await this.matchRepository.save(match);

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants que le match commence
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:started", {
        matchId,
        participantIds,
      });
    }

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds,
    };
  }

  async nextSet(userId: number, matchId: string): Promise<MatchItem> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.author_id !== userId) {
      throw new Error("Only the match creator can update the set");
    }

    if (match.match_over) {
      throw new Error("Match is already over");
    }

    // Incrémenter le current_set
    match.current_set += 1;

    // Si current_set dépasse set, terminer le match
    if (match.current_set > match.set) {
      match.match_over = true;
      match.is_open = false;
    }

    await this.matchRepository.save(match);

    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      if (match.match_over) {
        io.to(`match.${matchId}`).emit("match:ended", {
          matchId,
          current_set: match.current_set,
          participantIds,
        });

        // Faire quitter la room à tous les participants
        participantIds.forEach((id) => {
          socketService.leaveMatchRoom(id, matchId);
        });
      } else {
        io.to(`match.${matchId}`).emit("match:set-updated", {
          matchId,
          current_set: match.current_set,
          set: match.set,
        });
      }
    }

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds,
    };
  }

  async getMatchById(matchId: string): Promise<MatchItem | null> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      return null;
    }

    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds: participations.map((p) => p.user_id),
    };
  }

  async setVisibility(userId: number, matchId: string, is_private: boolean): Promise<MatchItem> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.author_id !== userId) {
      throw new Error("Only the match creator can change visibility");
    }

    if (match.match_over) {
      throw new Error("Cannot change visibility of a finished match");
    }

    match.is_private = is_private;
    await this.matchRepository.save(match);

    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:visibility-changed", {
        matchId,
        is_private,
      });
    }

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds,
    };
  }

  async endMatch(userId: number, matchId: string): Promise<MatchItem> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.author_id !== userId) {
      throw new Error("Only the match creator can end the match");
    }

    if (match.match_over) {
      throw new Error("Match is already over");
    }

    match.match_over = true;
    match.is_open = false;
    await this.matchRepository.save(match);

    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:ended", {
        matchId,
        participantIds,
      });
    }

    // Faire quitter la room à tous les participants
    participantIds.forEach((id) => {
      socketService.leaveMatchRoom(id, matchId);
    });

    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_open: match.is_open,
      is_private: match.is_private,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds,
    };
  }

  async updateScore(
    userId: number,
    matchId: string,
    action: "increment" | "decrement",
    amount: number = 1
  ): Promise<{ oldScore: number; newScore: number; participantId: number }> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    if (match.match_over) {
      throw new Error("Match is already over");
    }

    // Vérifier que l'utilisateur fait partie du match
    const participation = await this.participationRepository.findOne({
      where: { user_id: userId, match_id: matchId },
    });

    if (!participation) {
      throw new Error("You are not a participant in this match");
    }

    const oldScore = participation.score;

    if (action === "increment") {
      participation.score += amount;
    } else {
      participation.score = Math.max(0, participation.score - amount);
    }

    await this.participationRepository.save(participation);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:score-updated", {
        matchId,
        oldScore,
        userId,
        newScore: participation.score,
        action,
        amount,
      });
    }

    return {
      oldScore,
      newScore: participation.score,
      participantId: userId,
    };
  }

  //----------------- Kod game specific logic -----------------

  async initKodGame(userId: number, matchId: string): Promise<KodPlayer[]> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.author_id !== userId) throw new Error("Only the match creator can start the game");
    if (match.match_over) throw new Error("Match is already over");

    const participations = await this.participationRepository.find({
      where: { match_id: matchId },
    });
    if (participations.length < 2) throw new Error("Need at least 2 players");

    // Reset DB scores to STARTING_POINTS
    for (const p of participations) p.score = 10;
    await this.participationRepository.save(participations);

    match.is_open = false;
    match.current_set = 1;
    await this.matchRepository.save(match);

    // Delegate pure logic to the manager
    const players = kodGameManager.initGame(matchId, participations.map(p => p.user_id));

    // const io = socketService.getIO();
    // if (io) {
    //   io.to(`match.${matchId}`).emit("kod:initialized", { matchId, players });
    // }

    return players;
  }

  async submitKodChoice(
    userId: number,
    matchId: string,
    playerName: string,
    value: number,
  ): Promise<{ allSubmitted: boolean; result: KodRoundResult | null }> {
    // Validate against DB (match exists, not over)
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.match_over) throw new Error("Match is already over");

    const participation = await this.participationRepository.findOne({
      where: { user_id: userId, match_id: matchId },
    });
    if (!participation) throw new Error("You are not a participant in this match");

    // Enrich name in manager (player may have changed their display name)
    kodGameManager.setPlayerName(matchId, userId, playerName);

    const { allSubmitted, result } = kodGameManager.submitChoice(matchId, userId, playerName, value);

    const io = socketService.getIO();

    if (!allSubmitted) {
      // Notify others that this player submitted (without revealing the value)
      if (io) {
        io.to(`match.${matchId}`).emit("kod:choice-submitted", { matchId, userId });
      }
      return { allSubmitted: false, result: null };
    }

    // All submitted — persist the round and update scores in DB
    await this._persistKodRound(matchId, result!);

    if (result!.gameOver) {
      // Persist winner summary
      await this.kodRepository.save(
        this.kodRepository.create({
          match_id: matchId,
          winner_user_id: result!.gameWinnerId!,
          winner_name: result!.gameWinnerName!,
          remaining_points: result!.players.find(p => p.userId === result!.gameWinnerId)?.points ?? 0,
          total_rounds: result!.roundNumber,
        }),
      );

      // Mark match as over
      match.match_over = true;
      await this.matchRepository.save(match);

      if (io) {
        io.to(`match.${matchId}`).emit("kod:round-result", { matchId, result });
        io.to(`match.${matchId}`).emit("kod:game-over", {
          matchId,
          winnerId: result!.gameWinnerId,
          winnerName: result!.gameWinnerName,
        });
        result!.players.forEach(p => socketService.leaveMatchRoom(p.userId, matchId));
      }

      kodGameManager.cleanup(matchId);
    } else {
      if (io) {
        io.to(`match.${matchId}`).emit("kod:round-result", { matchId, result });
      }
    }

    return { allSubmitted: true, result };
  }

  private async _persistKodRound(matchId: string, result: KodRoundResult): Promise<void> {
    // Save the round record
    await this.kodRoundRepository.save(
      this.kodRoundRepository.create({
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
      await this.participationRepository.update(
        { user_id: player.userId, match_id: matchId },
        { score: player.points },
      );
    }
  }

  // Expose round history (add a route GET /:id/rounds)
  async getKodRounds(matchId: string): Promise<KodRound[]> {
    return this.kodRoundRepository.find({
      where: { match_id: matchId },
      order: { round_number: "ASC" },
    });
  }

  //------------------------------------------------------------

}

export const matchService = new MatchService();
