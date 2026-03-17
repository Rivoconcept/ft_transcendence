// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/websocket.ts
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { authService } from "./services/auth.service.js";
import { userService } from "./services/user.service.js";
import { AppDataSource } from "./database/data-source.js";
import { ChatMember } from "./database/entities/chat-member.js";

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

      // Rejoindre une room de chat spécifique
      socket.on("chat:join", (channelId: string) => {
        if (!socket.userId) {
          socket.emit("error", { error: "Not authenticated" });
          return;
        }
        socket.join(`chat.${channelId}`);
        console.log(`User ${socket.username} joined chat room chat.${channelId}`);
      });

      // Quitter une room de chat
      socket.on("chat:leave", (channelId: string) => {
        socket.leave(`chat.${channelId}`);
        console.log(`User ${socket.username} left chat room chat.${channelId}`);
      });

      socket.on("disconnect", async (reason) => {
        console.log(`Socket ${socket.id} disconnect reason: ${reason}`);
        if (socket.userId) {
          try {
            await userService.setOnlineStatus(socket.userId, false);
            console.log(`User ${socket.username} set offline successfully`);
          } catch (error) {
            console.error(`Failed to set user ${socket.username} offline:`, error);
          }
        } else {
          console.log("Unauthenticated client disconnected:", socket.id);
        }
      });

      socket.on("joinMatchRoom",
        async ({ matchId, playerName }: { matchId: string; playerName: string }) => {
          if (!socket.userId) {
            console.log("joinMatchRoom refused: unauthenticated socket");
            return;
          }

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
          socket.on("kod:submit", async (data: { matchId: string; value: number }) => {
            if (!socket.userId) {
              socket.emit("error", { error: "Not authenticated" });
              return;
            }
            try {
              const { kodService } = await import("./services/Kod.service.js");
              await kodService.submitChoice(socket.userId, data.matchId, data.value);
            } catch (err: any) {
              socket.emit("error", { error: err.message });
            }
          });
        }
      );

      socket.on("startMatch", async (data: { matchId: string }) => {
        if (!socket.userId) {
          socket.emit("error", { error: "Not authenticated" });
          return;
        }

        const room = `match.${data.matchId}`;

        // récupérer les sockets dans la room
        const sockets = await this.io?.in(room).fetchSockets();

        if (!sockets || sockets.length === 0) return;

        // récupérer les joueurs uniques
        const users = new Map<number, string>();

        sockets.forEach((s: any) => {
          if (!users.has(s.userId)) {
            users.set(s.userId, s.username);
          }
        });

        const participants = Array.from(users.keys());

        // vérifier qu'il y a au moins 2 joueurs
        if (participants.length < 2) {
          socket.emit("error", { error: "Not enough players" });
          return;
        }

        console.log(`Match ${data.matchId} started with players:`, participants);

        // envoyer l'événement à tous les joueurs
        this.io?.to(room).emit("match:started", {
          matchId: data.matchId,
          players: participants,
        });

      });


      // ------------------ PUBLISH RESULT ------------------
      socket.on("publish_result", (data: { matchId: string; finalScore: number; playerName: string }) => {
        if (!socket.userId) return;

        const room = `match.${data.matchId}`;

        if (!this.matchResults.has(data.matchId)) this.matchResults.set(data.matchId, []);
        const results = this.matchResults.get(data.matchId)!;

        // Ajouter ou remplacer le résultat du joueur
        const existingIndex = results.findIndex(r => r.playerName === data.playerName);
        if (existingIndex >= 0) results[existingIndex] = { playerName: data.playerName, finalScore: data.finalScore };
        else results.push({ playerName: data.playerName, finalScore: data.finalScore });

        // Vérifier si tous les joueurs ont publié
        this.io?.in(room).fetchSockets().then(sockets => {
          if (results.length === sockets.length) {
            // Calculer le(s) gagnant(s)
            let maxScore = Math.max(...results.map(r => r.finalScore));
            const finalResults = results.map(r => ({ ...r, isWin: r.finalScore === maxScore }));

            // Émettre le résultat final à tous
            this.io?.to(room).emit("match:result", finalResults);

            // Nettoyer la mémoire
            this.matchResults.delete(data.matchId);
          }
        });
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

      for (const membership of memberships) {
        socket.join(`chat.${membership.chat.channel_id}`);
      }

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
