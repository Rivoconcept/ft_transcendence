import "reflect-metadata";
import { loadSecrets } from "./vault.js";

await loadSecrets();

const { createServer } = await import("http");
const { AppDataSource } = await import("./database/data-source.js");
const { socketService } = await import("./websocket.js");
const { default: app } = await import("./app.js");

const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    socketService.init(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });