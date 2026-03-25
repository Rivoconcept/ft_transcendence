import "reflect-metadata";
import { createServer } from "http";
import { AppDataSource } from "./database/data-source.js";
import { socketService } from "./websocket.js";
import app from "./app.js";
import { Game } from "./database/entities/game.js";

const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

async function seedGames() {
  const gameRepo = AppDataSource.getRepository(Game);

  const count = await gameRepo.count();

  // Avoid inserting duplicates
  if (count === 0) {
    const games = gameRepo.create([
      { name: "Dice Game" },
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

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
