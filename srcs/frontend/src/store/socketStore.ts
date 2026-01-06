import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketStore {
  private static instance: SocketStore;
  private socket: Socket | null = null;

  private constructor() {}

  static getInstance(): SocketStore {
    if (!SocketStore.instance) {
      SocketStore.instance = new SocketStore();
    }
    return SocketStore.instance;
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Socket.IO connecté:", this.socket?.id);
    });

    this.socket.on("welcome", (data: string) => {
      console.log("Message reçu:", data);
    });

    this.socket.on("connect_error", (err: Error) => {
      console.error("Socket.IO error:", err.message);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("Socket.IO déconnecté:", reason);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketStore = SocketStore.getInstance();
