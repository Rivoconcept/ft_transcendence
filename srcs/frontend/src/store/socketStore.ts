// src/store/socketStore.ts

import { io, Socket } from "socket.io-client";
import type { createStore } from "jotai";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

type StatusUpdateCallback = (isOnline: boolean) => void;

class SocketStore {
  private static instance: SocketStore;
  private socket: Socket | null = null;
  private jotaiStore: ReturnType<typeof createStore> | null = null;
  private statusUpdateCallback: StatusUpdateCallback | null = null;
  private authenticated = false;

  private constructor() {}

  static getInstance(): SocketStore {
    if (!SocketStore.instance) {
      SocketStore.instance = new SocketStore();
    }
    return SocketStore.instance;
  }

  setStatusUpdateCallback(callback: StatusUpdateCallback): void {
    this.statusUpdateCallback = callback;
  }

  setJotaiStore(store: ReturnType<typeof createStore>): void {
    this.jotaiStore = store;
  }

  getJotaiStore(): ReturnType<typeof createStore> | null {
    return this.jotaiStore;
  }

  connect(): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Socket.IO connecté:", this.socket?.id);
      this.statusUpdateCallback?.(true);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("Socket.IO déconnecté:", reason);
      this.statusUpdateCallback?.(false);
      this.authenticated = false;
    });

    this.socket.on("connect_error", (err: Error) => {
      console.error("Socket.IO error:", err.message);
    });

    return this.socket;
  }

  connectAndAuth(token: string): void {
    const socket = this.connect();

    if (this.authenticated) {
      return;
    }

    socket.emit("auth", token);

    socket.once("auth:success", () => {
      console.log("Socket authentifié");
      this.authenticated = true;
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.authenticated = false;
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketStore = SocketStore.getInstance();