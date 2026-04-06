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

    const currentUserId = req.user!.userId;
    const chat = await chatService.createDirectChat(currentUserId, { userId });

    // Return formatted ChatListItem instead of raw entity
    const chatListItem = {
      id: chat.id,
      name: chat.name ?? null,
      type: chat.type,
      channel_id: chat.channel_id,
      created_at: chat.created_at,
      lastMessageId: null,
      lastMessageContent: null,
      lastMessageType: null,
      lastMessageDate: null,
      memberIds: [currentUserId, userId],
      moderatorIds: [],
      unreadCount: 0,
    };

    res.status(201).json(chatListItem);
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

    const { content, type, socketId } = req.body;

    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    // Validate image messages (content format: base64dataUrl or base64dataUrl\ncaption)
    if (type === "image") {
      const newlineIndex = content.indexOf("\n");
      const imageData = newlineIndex === -1 ? content : content.substring(0, newlineIndex);

      const dataUrlRegex = /^data:image\/(jpeg|png|gif|webp);base64,/;
      if (!dataUrlRegex.test(imageData)) {
        res.status(400).json({ error: "Invalid image format. Supported: JPEG, PNG, GIF, WebP" });
        return;
      }
      const base64Data = imageData.split(",")[1];
      if (!base64Data) {
        res.status(400).json({ error: "Invalid image data" });
        return;
      }
      const sizeInBytes = Math.ceil(base64Data.length * 3 / 4);
      if (sizeInBytes > 2 * 1024 * 1024) {
        res.status(400).json({ error: "Image must not exceed 2 MB" });
        return;
      }
    }

    const message = await chatService.sendMessage(req.user!.userId, {
      chatId,
      content,
      type,
      socketId,
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

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");
    const { messageId } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    if (!messageId || typeof messageId !== "number") {
      res.status(400).json({ error: "Message ID is required" });
      return;
    }

    const result = await chatService.markAsRead(req.user!.userId, chatId, messageId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark as read";
    if (message === "You are not a member of this chat") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Message not found in this chat") {
      res.status(404).json({ error: message });
      return;
    }
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
    if (message === "Cannot leave a direct chat" || message === "You must assign another moderator before leaving") {
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

export async function toggleModerator(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");
    const { targetUserId } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    if (!targetUserId || typeof targetUserId !== "number") {
      res.status(400).json({ error: "Target user ID is required" });
      return;
    }

    const result = await chatService.toggleModerator(req.user!.userId, chatId, targetUserId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle moderator";
    if (message === "Only moderators can change moderator status" || message === "Cannot remove the last moderator") {
      res.status(400).json({ error: message });
      return;
    }
    if (message === "Target user is not a member of this chat") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function deleteMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const messageId = parseInt(req.params.messageId ?? "");

    if (isNaN(messageId)) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    await chatService.deleteMessage(req.user!.userId, messageId);
    res.json({ message: "Message deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete message";
    if (message === "Only the author or a moderator can delete this message") {
      res.status(403).json({ error: message });
      return;
    }
    if (message === "Message not found") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function kickMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const chatId = parseInt(req.params.id ?? "");
    const { targetUserId } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: "Invalid chat ID" });
      return;
    }

    if (!targetUserId || typeof targetUserId !== "number") {
      res.status(400).json({ error: "Target user ID is required" });
      return;
    }

    await chatService.kickMember(req.user!.userId, chatId, targetUserId);
    res.json({ message: "Member kicked successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to kick member";
    if (message === "Only moderators can kick members" || message === "Cannot kick yourself") {
      res.status(400).json({ error: message });
      return;
    }
    if (message === "User is not a member of this chat" || message === "Group chat not found") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}

export async function joinGroupChat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { channelId } = req.params;

    if (!channelId) {
      res.status(400).json({ error: "Channel ID is required" });
      return;
    }

    const chat = await chatService.joinGroupChat(req.user!.userId, channelId);
    res.json(chat);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join group";
    if (message === "Can only join group chats") {
      res.status(400).json({ error: message });
      return;
    }
    if (message === "Chat not found") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: message });
  }
}
