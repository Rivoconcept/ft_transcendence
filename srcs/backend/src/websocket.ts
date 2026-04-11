// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/websocket.ts
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { authService } from "./services/auth.service.js";
import { userService } from "./services/user.service.js";
import { AppDataSource } from "./database/data-source.js";
import { ChatMember } from "./database/entities/chat-member.js";
import { matchService } from "./services/match.service.js";
import { kodService } from "./services/Kod.service.js";
import { kodGameManager } from "./game/KodGameManager.js";
import { MatchTimer } from "./database/entities/match-timer.js";
import { Match } from "./database/entities/match.js";

export interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
  playerName?: string;
  matchId?: string;
  isReady?: boolean;
}


class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;
  private matchResults: Map<string, { playerName: string; finalScore: number }[]> = new Map();
  private matchTimers: Map<string, number> = new Map();
  private matchTimerRepository = AppDataSource.getRepository(MatchTimer);
  private matchRepository = AppDataSource.getRepository(Match);

  private constructor() { }


  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  init(httpServer: HttpServer): Server {
    const allowedOrigins = [
      "http://localhost",
      "http://localhost:80",
      "http://localhost:443",
      "http://localhost:5173",
      "https://localhost",
      "https://localhost:443",
    ];

    this.io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
    });

    this.io.on("connection", async (socket: AuthenticatedSocket) => {
      //----------------- Auth specific logic -----------------

      socket.on("auth", async (token: string) => {
        try {
          const payload = authService.verifyToken(token);
          socket.userId = payload.userId;
          socket.username = payload.username;

          socket.join(`user.${payload.userId}`);

          await this.joinUserChatRooms(socket, payload.userId);

          await userService.setOnlineStatus(payload.userId, true);

          socket.emit("auth:success", { userId: payload.userId, username: payload.username });
        } catch {
          socket.emit("auth:error", { error: "Invalid token" });
        }
      });

      socket.on("disconnect", async (reason) => {
        const matchId = socket.matchId;
        const userId = socket.userId;

        if (matchId) {
          this.io?.to(`match.${matchId}`).emit("match:player-left", {
            userId,
          });
        }

        if (!userId) {
          return;
        }

        try {
          await userService.setOnlineStatus(userId, false);

          const currentMatch = await matchService.getMatchById(matchId || "");

          if (
            currentMatch &&
            currentMatch.gameId === 1 &&
            !currentMatch.match_over &&
            matchId
          ) {
            const room = `match.${matchId}`;

            const roomSockets = await this.io?.in(room).fetchSockets();

            const participants: { id: number; name: string; ready: boolean }[] = [];
            const seen = new Set<number>();

            roomSockets?.forEach((s: any) => {
              if (s.userId && !seen.has(s.userId)) {
                participants.push({
                  id: s.userId,
                  name: s.playerName || s.username,
                  ready: false,
                });
                seen.add(s.userId);
              }
            });

            this.io?.to(room).emit("match:player-left", {
              userId,
              playerName: socket.playerName || socket.username,
              participants,
            });

            await kodService.eliminatePlayer(userId, matchId);
          }

        } catch {
        }
      });

      //----------------- Chat specific logic -----------------
      socket.on("chat:join", (channelId: string) => {
        if (!socket.userId) {
          socket.emit("error", { error: "Not authenticated" });
          return;
        }
        socket.join(`chat.${channelId}`);
      });

      socket.on("chat:leave", (channelId: string) => {
        socket.leave(`chat.${channelId}`);
      });

      //----------------- match specific logic -----------------
      socket.on("joinMatchRoom", async ({ matchId, playerName }: { matchId: string; playerName: string }) => {
        if (!socket.userId) {
          return;
        }

        if (socket.matchId) {
          socket.leave(`match.${socket.matchId}`);
        }

        socket.matchId = matchId;

        const room = `match.${matchId}`;

        socket.playerName = playerName || socket.username;
        socket.join(room);

        const sockets = await this.io?.in(room).fetchSockets();
        const participants: { id: number; name: string; ready: boolean }[] = [];
        const seen = new Set<number>();
        sockets?.forEach((s: any) => {
          if (s.userId && !seen.has(s.userId)) {
            participants.push({
              id: s.userId,
              name: s.playerName || s.username,
              ready: false,
            });
            seen.add(s.userId);
          }
        });

        const creatorId = participants[0]?.id ?? socket.userId;
        this.io?.to(room).emit("match:player-joined", {
          participants,
          creatorId,
        });
      });

      socket.on("cancelMatch", async ({ matchId }: { matchId: string }) => {
        if (!socket.userId) return socket.emit("error", { error: "Not authenticated" });

        try {
          await matchService.deleteMatch(socket.userId, matchId);
          this.io?.to(`match.${matchId}`).emit("match:cancelled", {});
          this.io?.in(`match.${matchId}`).socketsLeave(`match.${matchId}`);
        } catch (err: any) {
          socket.emit("error", { error: err.message });
        }
      });

      socket.on("leaveMatchRoom", async ({ matchId }: { matchId: string }) => {
        if (!socket.userId) return;

        const room = `match.${matchId}`;
        socket.leave(room);

        try {
          // Remove user participation from the DB only if they're no longer in the match room
          const roomSockets = await this.io?.in(room).fetchSockets();
          const stillInRoom = roomSockets?.some((s: any) => s.userId === socket.userId);

          if (!stillInRoom) {
            await matchService.leaveMatch(socket.userId, matchId);
            // Rebuild participant list from remaining sockets
            const participants: { id: number; name: string; ready: boolean }[] = [];
            const seen = new Set<number>();
            roomSockets?.forEach((s: any) => {
              if (s.userId && !seen.has(s.userId)) {
                participants.push({ id: s.userId, name: s.playerName || s.username, ready: false });
                seen.add(s.userId);
              }
            });

            // Notify remaining players
            this.io?.to(room).emit("match:player-left", {
              userId: socket.userId,
              playerName: socket.playerName || socket.username,
              participants,
            });
          }
        } catch {
        }
      });

      socket.on("startMatch", async (data: { matchId: string; gameSlug: string }) => {
        if (!socket.userId) return socket.emit("error", { error: "Not authenticated" });

        try {
          await matchService.startMatch(socket.userId, data.matchId);

          await this.matchTimerRepository.save({
            match_id: data.matchId,
            start_time: Date.now(),
          });

        } catch (err: any) {
          return socket.emit("error", { error: err.message });
        }

        const room = `match.${data.matchId}`;

        const timer = await this.matchTimerRepository.findOne({
          where: { match_id: data.matchId },
        });

        this.io?.to(room).emit("match:started", {
          matchId: data.matchId,
          startTime: timer?.start_time ?? Date.now(),

        });
      });

      socket.on("match:get-timer", async ({ matchId }) => {
        const timer = await this.matchTimerRepository.findOne({
          where: { match_id: matchId },
        });

        if (!timer) return;

        socket.emit("match:timer-sync", {
          startTime: timer.start_time,
        });
      });

      socket.on("publish_result", (data: { matchId: string; finalScore: number; playerName: string }) => {
        if (!socket.userId) return;

        const room = `match.${data.matchId}`;

        if (!this.matchResults.has(data.matchId)) {
          this.matchResults.set(data.matchId, []);
        }

        const results = this.matchResults.get(data.matchId)!;

        const existingIndex = results.findIndex(r => r.playerName === data.playerName);
        if (existingIndex >= 0) {
          results[existingIndex].finalScore = data.finalScore;
        } else {
          results.push({ playerName: data.playerName, finalScore: data.finalScore });
        }

        this.io?.in(room).fetchSockets().then(sockets => {
          if (results.length === sockets.length) {
            const isSinglePlayer = results.length === 1;

            const maxScore = Math.max(...results.map(r => r.finalScore));

            const hasPositiveScore = maxScore > 0;

            const finalResults = results.map(r => ({
              playerName: r.playerName,
              finalScore: r.finalScore,
              isWin: isSinglePlayer
                ? r.finalScore > 0
                : hasPositiveScore && r.finalScore === maxScore
            }));

            this.io?.to(room).emit("match:result", finalResults);


            this.matchResults.delete(data.matchId);


          }
        });
      });


      socket.on("match:player-score", ({ matchId, score }) => {
        if (!socket.userId) return;

        const room = `match.${matchId}`;

        this.io?.to(room).emit("match:score-updated", {
          playerId: socket.userId,
          score,
        });
      });

      //----------------- Kod game specific logic -----------------

      socket.on("kod:init", async ({ matchId }: { matchId: string }) => {
        if (!socket.userId) return socket.emit("error", { error: "Not authenticated" });

        const isEliminated = kodGameManager.isPlayerEliminated(matchId, socket.userId);
        if (isEliminated) {
          socket.emit("error", { error: "You have been eliminated" });
          return;
        }

        try {
          // Build participants with real names from connected sockets
          const sockets = await this.io?.in(`match.${matchId}`).fetchSockets();
          const seen = new Set<number>();
          const participants: { userId: number; playerName: string }[] = [];
          sockets?.forEach((s: any) => {
            if (s.userId && !seen.has(s.userId)) {
              participants.push({
                userId: s.userId,
                playerName: s.playerName || s.username || `Player ${s.userId}`,
              });
              seen.add(s.userId);
            }
          });

          const isInitialized = await kodService.isInitialized(matchId);
          if (isInitialized) {
            socket.emit("kod:initialized", {
              matchId: matchId,
              players: isInitialized
            });
            return;
          }

          let kodPlayers = await kodService.initKodGame(socket.userId, matchId, participants);
          this.io?.to(`match.${matchId}`).emit("kod:initialized", {
            matchId: matchId,
            players: kodPlayers
          });

        } catch (err: any) {
          socket.emit("error", { error: err.message });
        }
      });

      socket.on("kod:submit", async ({ matchId, value }: { matchId: string; value: number }) => {
        if (!socket.userId) return socket.emit("error", { error: "Not authenticated" });
        try {
          // await matchService.submitKodChoice(
          await kodService.submitKodChoice(
            socket.userId,
            matchId,
            socket.playerName || socket.username || `Player ${socket.userId}`,
            value,
          );
        } catch (err: any) {
          socket.emit("error", { error: err.message });
        }
      });

      socket.on("kod:leave", async ({ matchId }: { matchId: string }) => {
        if (!socket.userId) return;

        const room = `match.${matchId}`;
        socket.leave(room);
        if (socket.matchId)
          await kodService.eliminatePlayer(socket.userId, socket.matchId);


        // Rebuild participant list from remaining sockets
        const participants: { id: number; name: string; ready: boolean }[] = [];
        const seen = new Set<number>();
        const roomSockets = await this.io?.in(room).fetchSockets();
        roomSockets?.forEach((s: any) => {
          if (s.userId && !seen.has(s.userId)) {
            participants.push({ id: s.userId, name: s.playerName || s.username, ready: false });
            seen.add(s.userId);
          }
        });


        // Notify remaining players
        this.io?.to(room).emit("match:player-left", {
          userId: socket.userId,
          playerName: socket.playerName || socket.username,
          participants,
        });
      });

      socket.on("logout", async ({ matchId }) => {
        const room = `match.${matchId}`;

        if (socket.userId && matchId) {
          socket.to(room).emit("match:player-left", {
            userId: socket.userId,
            playerName: socket.playerName || socket.username,
          });
        }

        await socket.leave(room);
        socket.disconnect(true);
      });

    });



    return this.io;
  }

  private async joinUserChatRooms(socket: AuthenticatedSocket, userId: number): Promise<void> {
    try {
      const chatMemberRepository = AppDataSource.getRepository(ChatMember);
      const memberships = await chatMemberRepository.find({
        where: { user_id: userId },
        relations: ["chat"],
      });

      for (const membership of memberships)
        socket.join(`chat.${membership.chat.channel_id}`);
    } catch {
    }
  }

  getIO(): Server | null {
    return this.io;
  }

  isInitialized(): boolean {
    return this.io !== null;
  }

  joinChatRoom(userId: number, channelId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsJoin(`chat.${channelId}`);
  }

  leaveChatRoom(userId: number, channelId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsLeave(`chat.${channelId}`);
  }

  joinMatchRoom(userId: number, matchId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsJoin(`match.${matchId}`);
  }

  leaveMatchRoom(userId: number, matchId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsLeave(`match.${matchId}`);
  }
}

export const socketService = SocketService.getInstance();
