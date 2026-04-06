import { Router, type IRouter } from "express";
import {
  createDirectChat,
  createGroupChat,
  getUserChats,
  getChatById,
  getChatMessages,
  sendMessage,
  getMessageById,
  toggleReaction,
  getReactions,
  markAsRead,
  leaveGroupChat,
  toggleModerator,
  joinGroupChat,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

// Liste des réactions disponibles
router.get("/reactions", authMiddleware, getReactions);

// Créer un chat direct
router.post("/direct", authMiddleware, createDirectChat);

// Créer un chat de groupe
router.post("/group", authMiddleware, createGroupChat);

// Liste des chats de l'utilisateur (triés par dernier message créé)
router.get("/", authMiddleware, getUserChats);

// Récupérer un chat par ID
router.get("/:id", authMiddleware, getChatById);

// Récupérer les messages d'un chat (pagination: ?page=1&limit=50)
router.get("/:id/messages", authMiddleware, getChatMessages);

// Envoyer un message dans un chat
router.post("/:id/messages", authMiddleware, sendMessage);

// Récupérer un message par ID
router.get("/messages/:messageId", authMiddleware, getMessageById);

// Toggle une réaction sur un message
router.post("/messages/:messageId/reactions", authMiddleware, toggleReaction);

// Marquer des messages comme lus
router.post("/:id/read", authMiddleware, markAsRead);

// Toggle moderator status
router.post("/:id/moderator", authMiddleware, toggleModerator);

// Quitter un chat de groupe
router.post("/:id/leave", authMiddleware, leaveGroupChat);

// Rejoindre un groupe via channel_id
router.post("/join/:channelId", authMiddleware, joinGroupChat);

export default router;
