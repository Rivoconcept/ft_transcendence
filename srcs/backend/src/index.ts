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
  }
}

AppDataSource.initialize()
  .then(async () => {
    await seedGames();
    // socketService.init(httpsServer);
    // httpsServer.listen(PORT, () => {
    socketService.init(httpsServer);
    httpsServer.listen(PORT, () => {
    });

    // Cleanup cron: every 30 minutes, remove unconfirmed users older than 1 day
    const THIRTY_MINUTES = 30 * 60 * 1000;
    setInterval(() => {
      cleanupService.removeUnconfirmedUsers().catch(() => {});
    }, THIRTY_MINUTES);
  })
  .catch(() => {
    process.exit(1);
  });