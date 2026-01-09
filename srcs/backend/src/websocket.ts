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
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
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

      socket.on("disconnect", async () => {
        if (socket.userId) {
          await userService.setOnlineStatus(socket.userId, false);
          console.log(`User ${socket.username} disconnected`);
        } else {
          console.log("Client disconnected:", socket.id);
        }
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

  // Faire rejoindre un utilisateur à une room de jeu
  joinGameRoom(userId: number, gameId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsJoin(`game.${gameId}`);
  }

  // Faire quitter un utilisateur d'une room de jeu
  leaveGameRoom(userId: number, gameId: string): void {
    if (!this.io) return;
    const room = `user.${userId}`;
    this.io.in(room).socketsLeave(`game.${gameId}`);
  }
}

export const socketService = SocketService.getInstance();
