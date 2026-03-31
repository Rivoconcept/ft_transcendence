import "reflect-metadata";
import { loadSecrets } from "./vault.js";

await loadSecrets();

const { createServer } = await import("http");
const { AppDataSource } = await import("./database/data-source.js");
const { socketService } = await import("./websocket.js");
const { default: app } = await import("./app.js");

import { Game } from "./database/entities/game.js";

const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

async function seedGames() {
  const gameRepo = AppDataSource.getRepository(Game);
  const count = await gameRepo.count();
  if (count === 0) {
    const games = gameRepo.create([
      { name: "King of Diamond" },
      { name: "Card Game" },
    ]);
    await gameRepo.save(games);
    console.log("Game seed data inserted");
  }
}

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected");
    await seedGames();
    socketService.init(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
