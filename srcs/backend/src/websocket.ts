// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/websocket.ts
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { authService } from "./services/auth.service.js";
import { userService } from "./services/user.service.js";
import { AppDataSource } from "./database/data-source.js";
import { ChatMember } from "./database/entities/chat-member.js";
import { matchService } from "./services/match.service.js";
import { kodService } from "./services/Kod.service.js";

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
      console.log("Client connected:", socket.id);

      //----------------- Auth specific logic -----------------

      socket.on("auth", async (token: string) => {
        try {
          const payload = authService.verifyToken(token);
          socket.userId = payload.userId;
          socket.username = payload.username;

          socket.join(`user.${payload.userId}`);

          // Rejoindre toutes les rooms de chat de l'utilisateur
          await this.joinUserChatRooms(socket, payload.userId);

          await userService.setOnlineStatus(payload.userId, true);

          socket.emit("auth:success", { userId: payload.userId, username: payload.username });
          console.log(`User ${payload.username} authenticated and joined room user.${payload.userId}`);
        } catch {
          socket.emit("auth:error", { error: "Invalid token" });
        }
      });

      socket.on("disconnect", async (reason) => {
        console.log(`Socket ${socket.id} disconnect reason: ${reason}`);
        if (socket.userId) {
          try {
            await userService.setOnlineStatus(socket.userId, false);

            // gracefull disconnection
            const currentMatch = await matchService.getMatchById(socket.matchId || "")
            if (currentMatch && currentMatch.gameId === 1 && !currentMatch.match_over && socket.userId && socket.matchId) {
              await kodService.eliminatePlayer(socket.userId, socket.matchId);
            }

            console.log(`User ${socket.username} set offline successfully`);
          } catch (error) {
            console.error(`Failed to set user ${socket.username} offline:`, error);
          }
        } else {
          console.log("Unauthenticated client disconnected:", socket.id);
        }
      });

      //----------------- Chat specific logic -----------------
      socket.on("chat:join", (channelId: string) => {
        if (!socket.userId) {
          socket.emit("error", { error: "Not authenticated" });
          return;
        }
        socket.join(`chat.${channelId}`);
        console.log(`User ${socket.username} joined chat room chat.${channelId}`);
      });

      socket.on("chat:leave", (channelId: string) => {
        socket.leave(`chat.${channelId}`);
        console.log(`User ${socket.username} left chat room chat.${channelId}`);
      });

      //----------------- match specific logic -----------------
      socket.on("joinMatchRoom", async ({ matchId, playerName }: { matchId: string; playerName: string }) => {
        if (!socket.userId) {
          console.log("joinMatchRoom refused: unauthenticated socket");
          return;
        }

        socket.matchId = matchId;

        const room = `match.${matchId}`;

        socket.playerName = playerName || socket.username;
        socket.join(room);

        console.log(`${socket.playerName} joined ${room}`);

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
        } catch (err: any) {
          console.error("Error leaving match:", err);
        }

        console.log(`${socket.playerName || socket.username} left ${room}`);
      });

      socket.on("startMatch", async (data: { matchId: string, gameSlug: string }) => {
        if (!socket.userId) return socket.emit("error", { error: "Not authenticated" });

        console.log("-------------------- game ", data.matchId, " started --------------------");
        // mettre à jour le statut du match et vérifier les conditions de démarrage
        try {
          await matchService.startMatch(socket.userId, data.matchId);
          console.log("matchService inited : ", data.matchId);
        } catch (err: any) {
          socket.emit("error", { error: err.message });
        }

        const room = `match.${data.matchId}`;

        // récupérer les sockets dans la room
        const sockets = await this.io?.in(room).fetchSockets();
        if (!sockets || sockets.length === 0) return;

        // récupérer les joueurs uniques
        const users = new Map<number, string>();
        sockets.forEach((s: any) => {
          if (!users.has(s.userId))
            users.set(s.userId, s.username);
        });

        // Start the match
        const participants = Array.from(users.keys());
        if (participants.length < 2) {
          socket.emit("error", { error: "Not enough players" });
          return;
        }
        console.log(`Match ${data.matchId} started with players:`, participants);
        this.io?.to(room).emit("match:started", {
          matchId: data.matchId,
          players: participants,
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

            const finalResults = results.map(r => ({
              playerName: r.playerName,
              finalScore: r.finalScore,
              isWin: isSinglePlayer
                ? r.finalScore > 0
                : r.finalScore === maxScore
            }));

            this.io?.to(room).emit("match:result", finalResults);


            this.matchResults.delete(data.matchId);


          }
        });
      });

      //----------------- Kod game specific logic -----------------

      socket.on("kod:init", async ({ matchId }: { matchId: string }) => {
        if (!socket.userId) return socket.emit("error", { error: "Not authenticated" });
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
            this.io?.to(`match.${matchId}`).emit("kod:initialized", {
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
          console.log("KOD game inited: ", kodPlayers);

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

        console.log(`${socket.playerName || socket.username} left ${room}`);
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

      console.log(`User joined ${memberships.length} chat rooms`);
    } catch (error) {
      console.error("Error joining chat rooms:", error);
    }
  }

  getIO(): Server | null {
    return this.io;
  }

  isInitialized(): boolean {
    return this.io !== null;
  }

  // Faire rejoindre un utilisateur à une room de chat
  joinChatRoom(userId: number, channelId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsJoin(`chat.${channelId}`);
  }

  // Faire quitter un utilisateur d'une room de chat
  leaveChatRoom(userId: number, channelId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsLeave(`chat.${channelId}`);
  }

  // Faire rejoindre un utilisateur à une room de match
  joinMatchRoom(userId: number, matchId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsJoin(`match.${matchId}`);
  }

  // Faire quitter un utilisateur d'une room de match
  leaveMatchRoom(userId: number, matchId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsLeave(`match.${matchId}`);
  }
}

export const socketService = SocketService.getInstance();
