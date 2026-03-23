import "reflect-metadata";
import { createServer } from "http";
import { AppDataSource } from "./database/data-source.js";
import { socketService } from "./websocket.js";
import app from "./app.js";

const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

async function start() {
  if (process.env.MODE === "cybersec-prod" 
      || process.env.MODE === "cybersec-dev" ) {
    const { loadSecrets } = await import("./vault.js");
    await loadSecrets();
  }

  await AppDataSource.initialize();
  console.log("Database connected");

  socketService.init(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});