import express, { Express } from "express";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import chatRoutes from "./routes/chat.routes.js";

const app: Express = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/chats", chatRoutes);

export default app;
