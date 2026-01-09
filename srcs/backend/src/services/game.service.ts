import { AppDataSource } from "../database/data-source.js";
import { Game } from "../database/entities/game.js";
import { Participation } from "../database/entities/participation.js";
import { socketService } from "../websocket.js";

interface CreateGameDTO {
  is_private?: boolean;
  set?: number;
}

interface GameItem {
  id: string;
  set: number;
  current_set: number;
  authorId: number;
  is_open: boolean;
  is_private: boolean;
  game_over: boolean;
  created_at: Date;
  participantIds: number[];
}

class GameService {
  private gameRepository = AppDataSource.getRepository(Game);
  private participationRepository = AppDataSource.getRepository(Participation);

  async createGame(userId: number, data?: CreateGameDTO): Promise<GameItem> {
    const game = this.gameRepository.create({
      author_id: userId,
      is_open: true,
      is_private: data?.is_private ?? false,
      game_over: false,
      set: data?.set ?? 1,
      current_set: 1,
    });

    await this.gameRepository.save(game);

    // Ajouter le créateur comme participant
    const participation = this.participationRepository.create({
      user_id: userId,
      game_id: game.id,
      score: 0,
    });

    await this.participationRepository.save(participation);

    // Faire rejoindre le créateur à la room du jeu
    socketService.joinGameRoom(userId, game.id);

    // Notifier via la room du jeu
    const io = socketService.getIO();
    if (io) {
      io.to(`game.${game.id}`).emit("game:created", {
        gameId: game.id,
        authorId: userId,
      });
    }

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds: [userId],
    };
  }

  async discoverGames(): Promise<GameItem[]> {
    // Seulement les parties publiques, ouvertes et non terminées
    const games = await this.gameRepository.find({
      where: { is_open: true, is_private: false, game_over: false },
      order: { created_at: "DESC" },
    });

    const gameIds = games.map((g) => g.id);

    if (gameIds.length === 0) {
      return [];
    }

    // Récupérer les participants
    const participations = await this.participationRepository.find({
      where: gameIds.map((id) => ({ game_id: id })),
    });

    const participantsByGame = new Map<string, number[]>();
    participations.forEach((p) => {
      const existing = participantsByGame.get(p.game_id) ?? [];
      existing.push(p.user_id);
      participantsByGame.set(p.game_id, existing);
    });

    return games.map((game) => ({
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds: participantsByGame.get(game.id) ?? [],
    }));
  }

  async joinGame(userId: number, gameId: string): Promise<GameItem> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.game_over) {
      throw new Error("Game is already over");
    }

    if (!game.is_open) {
      throw new Error("Game is not open for joining");
    }

    // Vérifier si l'utilisateur est déjà participant
    const existingParticipation = await this.participationRepository.findOne({
      where: { user_id: userId, game_id: gameId },
    });

    if (existingParticipation) {
      throw new Error("You are already in this game");
    }

    // Ajouter le participant
    const participation = this.participationRepository.create({
      user_id: userId,
      game_id: gameId,
      score: 0,
    });

    await this.participationRepository.save(participation);

    // Faire rejoindre l'utilisateur à la room du jeu
    socketService.joinGameRoom(userId, gameId);

    // Récupérer tous les participants
    const participations = await this.participationRepository.find({
      where: { game_id: gameId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`game.${gameId}`).emit("game:player-joined", {
        gameId,
        userId,
        participantIds,
      });
    }

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds,
    };
  }

  async startGame(userId: number, gameId: string): Promise<GameItem> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.author_id !== userId) {
      throw new Error("Only the game creator can start the game");
    }

    if (game.game_over) {
      throw new Error("Game is already over");
    }

    if (!game.is_open) {
      throw new Error("Game has already started");
    }

    // Vérifier qu'il y a au moins 2 participants
    const participations = await this.participationRepository.find({
      where: { game_id: gameId },
    });

    if (participations.length < 2) {
      throw new Error("Need at least 2 players to start the game");
    }

    // Fermer la partie aux nouveaux joueurs
    game.is_open = false;
    await this.gameRepository.save(game);

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants que la partie commence
    const io = socketService.getIO();
    if (io) {
      io.to(`game.${gameId}`).emit("game:started", {
        gameId,
        participantIds,
      });
    }

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds,
    };
  }

  async nextSet(userId: number, gameId: string): Promise<GameItem> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.author_id !== userId) {
      throw new Error("Only the game creator can update the set");
    }

    if (game.game_over) {
      throw new Error("Game is already over");
    }

    // Incrémenter le current_set
    game.current_set += 1;

    // Si current_set dépasse set, terminer la partie
    if (game.current_set > game.set) {
      game.game_over = true;
      game.is_open = false;
    }

    await this.gameRepository.save(game);

    const participations = await this.participationRepository.find({
      where: { game_id: gameId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      if (game.game_over) {
        io.to(`game.${gameId}`).emit("game:ended", {
          gameId,
          current_set: game.current_set,
          participantIds,
        });

        // Faire quitter la room à tous les participants
        participantIds.forEach((id) => {
          socketService.leaveGameRoom(id, gameId);
        });
      } else {
        io.to(`game.${gameId}`).emit("game:set-updated", {
          gameId,
          current_set: game.current_set,
          set: game.set,
        });
      }
    }

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds,
    };
  }

  async getGameById(gameId: string): Promise<GameItem | null> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      return null;
    }

    const participations = await this.participationRepository.find({
      where: { game_id: gameId },
    });

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds: participations.map((p) => p.user_id),
    };
  }

  async setVisibility(userId: number, gameId: string, is_private: boolean): Promise<GameItem> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.author_id !== userId) {
      throw new Error("Only the game creator can change visibility");
    }

    if (game.game_over) {
      throw new Error("Cannot change visibility of a finished game");
    }

    game.is_private = is_private;
    await this.gameRepository.save(game);

    const participations = await this.participationRepository.find({
      where: { game_id: gameId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`game.${gameId}`).emit("game:visibility-changed", {
        gameId,
        is_private,
      });
    }

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds,
    };
  }

  async endGame(userId: number, gameId: string): Promise<GameItem> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.author_id !== userId) {
      throw new Error("Only the game creator can end the game");
    }

    if (game.game_over) {
      throw new Error("Game is already over");
    }

    game.game_over = true;
    game.is_open = false;
    await this.gameRepository.save(game);

    const participations = await this.participationRepository.find({
      where: { game_id: gameId },
    });

    const participantIds = participations.map((p) => p.user_id);

    // Notifier tous les participants
    const io = socketService.getIO();
    if (io) {
      io.to(`game.${gameId}`).emit("game:ended", {
        gameId,
        participantIds,
      });
    }

    // Faire quitter la room à tous les participants
    participantIds.forEach((id) => {
      socketService.leaveGameRoom(id, gameId);
    });

    return {
      id: game.id,
      set: game.set,
      current_set: game.current_set,
      authorId: game.author_id,
      is_open: game.is_open,
      is_private: game.is_private,
      game_over: game.game_over,
      created_at: game.created_at,
      participantIds,
    };
  }
}

export const gameService = new GameService();
