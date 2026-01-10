import express, { Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import matchRoutes from "./routes/match.routes.js";

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

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/matches", matchRoutes);

export default app;
