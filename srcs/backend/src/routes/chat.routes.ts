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
  deleteMessage,
  kickMember,
  joinGroupChat,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: IRouter = Router();

router.get("/reactions", authMiddleware, getReactions);

router.post("/direct", authMiddleware, createDirectChat);

router.post("/group", authMiddleware, createGroupChat);

router.get("/", authMiddleware, getUserChats);

router.get("/:id", authMiddleware, getChatById);

router.get("/:id/messages", authMiddleware, getChatMessages);

router.post("/:id/messages", authMiddleware, sendMessage);

router.get("/messages/:messageId", authMiddleware, getMessageById);

router.post("/messages/:messageId/reactions", authMiddleware, toggleReaction);

router.delete("/messages/:messageId", authMiddleware, deleteMessage);

router.post("/:id/read", authMiddleware, markAsRead);

// Toggle moderator status
router.post("/:id/moderator", authMiddleware, toggleModerator);

// Kick a member from group chat
router.post("/:id/kick", authMiddleware, kickMember);

router.post("/:id/leave", authMiddleware, leaveGroupChat);

router.post("/join/:channelId", authMiddleware, joinGroupChat);

export default router;
