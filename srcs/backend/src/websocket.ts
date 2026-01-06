import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";

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

    this.io.on("connection", (socket: Socket) => {
      console.log("Client connected:", socket.id);

      socket.on("message", (data: any) => {
        console.log("Received:", data);
      });

      socket.emit("welcome", "Hello client!");

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    return this.io;
  }

  getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.IO not initialized. Call init() first.");
    }
    return this.io;
  }
}

export const socketService = SocketService.getInstance();
