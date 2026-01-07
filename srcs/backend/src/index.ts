import "reflect-metadata";
import { createServer } from "http";
import { AppDataSource } from "./database/data-source.js";
import { socketService } from "./websocket.js";
import app from "./app.js";

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
