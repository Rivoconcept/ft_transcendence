import "reflect-metadata";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: "/run/secrets/GameHub/backend/backend.env" });

const httpsOptions = {
  cert: fs.readFileSync('/run/secrets/GameHub/certs/backend/backend.crt'),
  key: fs.readFileSync('/run/secrets/GameHub/certs/backend/backend.key')
};

const { createServer } = await import("https");
const { AppDataSource } = await import("./database/data-source.js");
const { socketService } = await import("./websocket.js");
const { default: app } = await import("./app.js");
const { Game } = await import("./database/entities/game.js");
const { cleanupService } = await import("./services/cleanup.service.js");

const httpsServer = createServer(httpsOptions, app);
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
    // socketService.init(httpsServer);
    // httpsServer.listen(PORT, () => {
    socketService.init(httpsServer);
    httpsServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });

    // Cleanup cron: every 30 minutes, remove unconfirmed users older than 1 day
    const THIRTY_MINUTES = 30 * 60 * 1000;
    setInterval(() => {
      cleanupService.removeUnconfirmedUsers().catch((err) => {
        console.error("[Cleanup cron] Error:", err.message);
      });
    }, THIRTY_MINUTES);
    console.log("Cleanup cron scheduled (every 30 minutes)");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Raw error:", JSON.stringify(error, null, 2));
    }
    process.exit(1);
  });