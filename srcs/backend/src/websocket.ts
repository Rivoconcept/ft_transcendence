import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { authService } from "./services/auth.service.js";
import { userService } from "./services/user.service.js";

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

          await userService.setOnlineStatus(payload.userId, true);

          socket.emit("auth:success", { userId: payload.userId, username: payload.username });
          console.log(`User ${payload.username} authenticated and joined room user.${payload.userId}`);
        } catch {
          socket.emit("auth:error", { error: "Invalid token" });
        }
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

  getIO(): Server | null {
    return this.io;
  }

  isInitialized(): boolean {
    return this.io !== null;
  }
}

export const socketService = SocketService.getInstance();
