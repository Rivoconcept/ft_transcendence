import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { socketService } from "./websocket.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

socketService.init(httpServer);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
