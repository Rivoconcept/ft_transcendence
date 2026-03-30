import express, { Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import matchRoutes from "./routes/match.routes.js";
import cardGameRoutes from "./routes/card-game.routes.js";
import blockRoutes from "./routes/block.routes.js";
import kodRoutes from "./routes/kod.routes.js";
import userOnlineTimeRoutes from "./routes/user-online-time.routes.js";

const app: Express = express();

// Configuration CORS
const allowedOrigins = [
  "http://localhost",
  "http://localhost:80",
  "http://localhost:443",
  "http://localhost:5173",
  "https://localhost",
  "https://localhost:443",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (comme les appels API directs)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


// // allow * cors from 10.11.x.x network
// function isInNetworkRange(origin: string | undefined): boolean {
//   const regex = /^https?:\/\/10\.11\.\d+\.\d+/;
//   return regex.test(origin || '');
// }

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin)
//         return callback(null, true);
//       if (isInNetworkRange(origin))
//         return callback(null, true);
//       return callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );

app.use(express.json({ limit: '2mb' }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/card-games", cardGameRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/kod", kodRoutes);
app.use("/api/user-online-time", userOnlineTimeRoutes);

export default app;
