// /home/rivoinfo/Videos/ft_transcendence/srcs/backend/src/websocket.ts
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { authService } from "./services/auth.service.js";
import { userService } from "./services/user.service.js";
import { AppDataSource } from "./database/data-source.js";
import { ChatMember } from "./database/entities/chat-member.js";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

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

      socket.on("joinMatchRoom", async (matchId: string) => {
        if (!socket.userId) {
          console.log("joinMatchRoom refused: unauthenticated socket");
          return;
        }

        const room = `match.${matchId}`;

        // rejoindre uniquement cette socket
        socket.join(room);

        console.log(`${socket.username} joined ${room}`);

        // récupérer les sockets dans la room
        const sockets = await this.io?.in(room).fetchSockets();

        const participants: { id: number; name: string; ready: boolean }[] = [];
        const seen = new Set<number>();

        sockets?.forEach((s: any) => {
          if (s.userId && !seen.has(s.userId)) {
            participants.push({
              id: s.userId,
              name: s.username,
              ready: false,
            });
            seen.add(s.userId);
          }
        });

        console.log("Participants lobby:", participants);

        const creatorId = participants[0]?.id ?? socket.userId;

        this.io?.to(room).emit("match:player-joined", {
          participants,
          creatorId,
        });
      });

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
