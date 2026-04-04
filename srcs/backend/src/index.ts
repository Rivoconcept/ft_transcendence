import "reflect-metadata";
import https from 'https';
import fs from 'fs';
import dotenv from "dotenv"

dotenv.config({ path: '/run/secrets/backend.env' });


const httpsOptions = {
  cert: fs.readFileSync('/run/secrets/backend/fullchain.pem'),
  key: fs.readFileSync('/run/secrets/backend/privkey.pem')
};
const { AppDataSource } = await import("./database/data-source.js");
const { socketService } = await import("./websocket.js");
const { default: app } = await import("./app.js");

const httpsServer = https.createServer(httpsOptions, app);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    socketService.init(httpsServer);
    httpsServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });