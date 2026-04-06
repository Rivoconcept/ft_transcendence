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
import otpRoutes from "./routes/otp.routes.js";

const app: Express = express();

app.use(
  cors({
    origin: (_, callback) => {
      return callback(null, true);
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
app.use("/api/kod-games", kodRoutes);
app.use("/api/user-online-time", userOnlineTimeRoutes);
app.use("/api/otp", otpRoutes);

export default app;
