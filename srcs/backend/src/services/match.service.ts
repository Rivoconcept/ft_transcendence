// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/services/match.service.ts
import { AppDataSource } from "../database/data-source.js";
import { Match } from "../database/entities/match.js";
import { Participation } from "../database/entities/participation.js";
import { socketService } from "../websocket.js";
import { User } from "../database/entities/user.js";

interface CreateMatchDTO {
  is_private?: boolean;
  is_limited?: boolean;
  participations_limit?: number;
  set?: number;
  game_id?: number;
}

interface Participant {
  id: number;
  name: string;
}

interface MatchItem {
  id: string;
  set: number;
  current_set: number;
  authorId: number;
  gameId: number | null;
  is_open: boolean;
  is_private: boolean;
  is_limited: boolean;
  participations_limit: number | null;
  has_begun: boolean;
  match_over: boolean;
  created_at: Date;
  participantIds: number[];
  participants: Participant[];
}

interface DiscoverMatchItem {
  id: string;
  authorId: number;
  is_private: boolean;
}

class MatchService {
  private matchRepository = AppDataSource.getRepository(Match);
  private participationRepository = AppDataSource.getRepository(Participation);
  private userRepository = AppDataSource.getRepository(User);

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

  private async resolveParticipants(participations: Participation[]): Promise<Participant[]> {
    if (participations.length === 0) return [];
    const userIds = participations.map((p) => p.user_id);
    const users = await this.userRepository.findByIds(userIds);
    const nameById = new Map(users.map((u) => [u.id, u.username]));
    return participations.map((p) => ({
      id: p.user_id,
      name: nameById.get(p.user_id) ?? "Unknown",
    }));
  }

  private buildMatchItem(match: Match, participations: Participation[], participants: Participant[]): MatchItem {
    return {
      id: match.id,
      set: match.set,
      current_set: match.current_set,
      authorId: match.author_id,
      gameId: match.game_id,
      is_limited: match.is_limited,
      participations_limit: match.participations_limit,
      is_open: match.is_open,
      is_private: match.is_private,
      has_begun: match.has_begun,
      match_over: match.match_over,
      created_at: match.created_at,
      participantIds: participations.map((p) => p.user_id),
      participants,
    };
  }

  private async findJoinableMatch(gameId: number): Promise<Match | null> {
    const openMatches = await this.matchRepository.find({
      where: {
        is_open: true,
        is_private: false,
        match_over: false,
        has_begun: false,
        game_id: gameId,
      },
      order: { created_at: "ASC" },
    });
    for (const match of openMatches) {
      if (match.is_limited && match.participations_limit) {
        const currentParticipants = await this.participationRepository.count({ where: { match_id: match.id } });
        if (currentParticipants >= match.participations_limit) {
          continue;
        }
      }
      return match;
    }
    return null;
  }

  async createMatch(userId: number, data?: CreateMatchDTO): Promise<MatchItem> {
    const uniqueId = await this.generateUniqueId();

    const match = this.matchRepository.create({
      id: uniqueId,
      author_id: userId,
      is_open: true,
      is_private: data?.is_private ?? false,
      game_id: data?.game_id ?? null,
      is_limited: data?.is_limited ?? false,
      has_begun: false,
      match_over: false,
      set: data?.set ?? 10,
      current_set: 1,
      participations_limit: data?.participations_limit ?? 0,
    });

    await this.matchRepository.save(match);

    const participation = this.participationRepository.create({
      user_id: userId,
      match_id: match.id,
      score: 0,
    });
    await this.participationRepository.save(participation);
    const participations = await this.participationRepository.find({ where: { match_id: match.id } });

    socketService.joinMatchRoom(userId, match.id);
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${match.id}`).emit("match:created", {
        matchId: match.id,
        authorId: userId,
      });
    }
    const participants = await this.resolveParticipants(participations);
    return this.buildMatchItem(match, participations, participants);
  }

  async deleteMatch(userId: number, matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match)
      throw new Error("Match not found");
    if (match.author_id !== userId)
      throw new Error("Only the match creator can delete the match");
    if (match.has_begun)
      throw new Error("Cannot delete a match that has already begun");
    await this.matchRepository.delete({ id: matchId });
  }

  async leaveMatch(userId: number, matchId: string): Promise<void> {
    await this.participationRepository.delete({
      user_id: userId,
      match_id: matchId,
    });
  }

  async discoverMatches(gameId?: number): Promise<DiscoverMatchItem[]> {
    const whereClause: Record<string, unknown> = {
      is_open: true,
      is_private: false,
      match_over: false,
      has_begun: false,
    };

    if (gameId !== undefined)
      whereClause.game_id = gameId;

    const matches = await this.matchRepository.find({
      where: whereClause,
      order: { created_at: "DESC" },
      select: ["id", "author_id", "is_private"],
    });

    return matches.map((m) => ({
      id: m.id,
      authorId: m.author_id,
      is_private: m.is_private,
    }));
  }

  async matchmake(userId: number, data: CreateMatchDTO): Promise<MatchItem> {
    if (data.game_id === undefined || data.game_id === null) {
      throw new Error("Game ID is required");
    }

    const joinableMatch = await this.findJoinableMatch(data.game_id);
    if (joinableMatch) {
      return this.joinMatch(userId, joinableMatch.id, data.game_id);
    }

    return this.createMatch(userId, {
      game_id: data.game_id,
      set: data.set ?? 1,
      is_private: false,
      is_limited: false,
      participations_limit: 100,
    });
  }

  async joinMatch(userId: number, matchId: string, gameID: number): Promise<MatchItem> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    const existingParticipation = await this.participationRepository.findOne({
      where: { user_id: userId, match_id: matchId },
    });

    // if (existingParticipation)
    //   throw new Error("You are already in this match");

    if (!match)
      throw new Error("Match not found");

    if (match.match_over)
      throw new Error("Match is already over");

    if (match.has_begun && !existingParticipation)
      throw new Error("Match has already begun");

    if (!match.is_open)
      throw new Error("Match is not open for joining");

    if (match.game_id !== gameID)
      throw new Error("Match code does not match the selected game");

    if (match.is_limited && match.participations_limit) {
      const currentParticipants = await this.participationRepository.count({ where: { match_id: matchId } });
      if (currentParticipants >= match.participations_limit)
        throw new Error("Match is full");
    }

    // Delete any existing participation (in case of reconnection/multiple joins)
    await this.participationRepository.delete({
      user_id: userId,
      match_id: matchId,
    });

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
    const participants = await this.resolveParticipants(participations);
    return this.buildMatchItem(match, participations, participants);
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
    match.has_begun = true;
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

    const participants = await this.resolveParticipants(participations);
    return this.buildMatchItem(match, participations, participants);
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

    const participants = await this.resolveParticipants(participations);
    return this.buildMatchItem(match, participations, participants);
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
    const participants = await this.resolveParticipants(participations);
    return this.buildMatchItem(match, participations, participants);
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
    const participants = await this.resolveParticipants(participations);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:visibility-changed", {
        matchId,
        is_private,
      });
    }
    return this.buildMatchItem(match, participations, participants);
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
    const participants = await this.resolveParticipants(participations);
    const io = socketService.getIO();
    if (io) {
      io.to(`match.${matchId}`).emit("match:ended", {
        matchId,
        participantIds,
      });
    }
    participantIds.forEach((id) => { socketService.leaveMatchRoom(id, matchId) });
    return this.buildMatchItem(match, participations, participants);
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

  async hasStarted(matchId: string): Promise<boolean> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match)
      throw new Error("Match not found");
    return match.has_begun;
  }

}

export const matchService = new MatchService();
