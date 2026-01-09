import { Response } from "express";
import { chatService } from "../services/chat.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function createDirectChat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== "number") {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const chat = await chatService.createDirectChat(req.user!.userId, { userId });
    res.status(201).json(chat);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create chat";
    res.status(400).json({ error: message });
  }
}

export async function createGroupChat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, memberIds } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Group name is required" });
      return;
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      res.status(400).json({ error: "At least one member is required" });
      return;
    }

    const chat = await chatService.createGroupChat(req.user!.userId, { name, memberIds });
    res.status(201).json(chat);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create group chat";
    res.status(400).json({ error: message });
  }
}

export async function getUserChats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chats = await chatService.getUserChats(req.user!.userId);
    res.json(chats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get chats";
    res.status(500).json({ error: message });
  }
}

export async function getChatById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    const chat = await chatService.getChatById(req.user!.userId, chatId);

    if (!chat) {
      res.status(404).json({ error: "Chat not found" });
      return;
    }

    res.json(chat);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get chat";
    res.status(500).json({ error: message });
  }
}

export async function getChatMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);

    const messages = await chatService.getChatMessages(req.user!.userId, chatId, page, limit);
    res.json(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get messages";
    if (message === "You are not a member of this chat") {
      res.status(403).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    const { content, type } = req.body;

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const message = await chatService.sendMessage(req.user!.userId, {
      chatId,
      content,
      type,
    });

    res.status(201).json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    if (message === "You are not a member of this chat") {
      res.status(403).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function getMessageById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const messageId = parseInt(req.params.messageId ?? "");

    if (isNaN(messageId)) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    const message = await chatService.getMessageById(req.user!.userId, messageId);

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get message";
    res.status(500).json({ error: message });
  }
}

export async function toggleReaction(req: AuthRequest, res: Response): Promise<void> {
  try {
    const messageId = parseInt(req.params.messageId ?? "");
    const { reactionId } = req.body;

    if (isNaN(messageId)) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    if (!reactionId || typeof reactionId !== "number") {
      res.status(400).json({ error: "Reaction ID is required" });
      return;
    }

    const result = await chatService.toggleReaction(req.user!.userId, messageId, reactionId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle reaction";
    if (message === "Message not found" || message === "Reaction not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "You are not a member of this chat") {
      res.status(403).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function getReactions(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const reactions = await chatService.getReactions();
    res.json(reactions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get reactions";
    res.status(500).json({ error: message });
  }
}

export async function leaveGroupChat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    await chatService.leaveGroupChat(req.user!.userId, chatId);
    res.json({ message: "Successfully left the group" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to leave group";
    if (message === "Cannot leave a direct chat") {
      res.status(400).json({ error: message });
      return;
    }
    if (message === "You are not a member of this chat") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Chat not found") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}
