import { AppDataSource } from "../database/data-source.js";
import { Chat, ChatType } from "../database/entities/chat.js";
import { ChatMember } from "../database/entities/chat-member.js";
import { Message, MessageType } from "../database/entities/message.js";
import { User } from "../database/entities/user.js";
import { Reaction } from "../database/entities/reaction.js";
import { UserReaction } from "../database/entities/user-reaction.js";
import { socketService } from "../websocket.js";
import { randomBytes } from "crypto";

interface CreateDirectChatDTO {
  userId: number;
}

interface CreateGroupChatDTO {
  name: string;
  memberIds: number[];
}

interface SendMessageDTO {
  chatId: number;
  content: string;
  type?: "text" | "image";
}

// Réponses minimalistes - uniquement les IDs
interface ChatListItem {
  id: number;
  name: string | null;
  type: ChatType;
  channel_id: string;
  created_at: Date;
  lastMessageId: number | null;
  memberIds: number[];
}

interface MessageItem {
  id: number;
  content: string;
  type: string;
  created_at: Date;
  updated_at: Date;
  authorId: number;
  chatId: number;
  reactions: { reactionId: number; userIds: number[] }[];
}

interface PaginatedMessages {
  messages: MessageItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class ChatService {
  private chatRepository = AppDataSource.getRepository(Chat);
  private chatMemberRepository = AppDataSource.getRepository(ChatMember);
  private messageRepository = AppDataSource.getRepository(Message);
  private userRepository = AppDataSource.getRepository(User);
  private userReactionRepository = AppDataSource.getRepository(UserReaction);

  private generateChannelId(): string {
    return randomBytes(8).toString("hex");
  }

  async createDirectChat(currentUserId: number, data: CreateDirectChatDTO): Promise<Chat> {
    const { userId } = data;

    if (currentUserId === userId) {
      throw new Error("Cannot create a chat with yourself");
    }

    const otherUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!otherUser) {
      throw new Error("User not found");
    }

    // Vérifier si un chat direct existe déjà entre ces deux utilisateurs
    const existingChat = await this.findExistingDirectChat(currentUserId, userId);
    if (existingChat) {
      return existingChat;
    }

    const chat = this.chatRepository.create({
      channel_id: this.generateChannelId(),
      type: ChatType.DIRECT,
    });

    await this.chatRepository.save(chat);

    // Ajouter les deux membres
    const member1 = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: currentUserId,
    });
    const member2 = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: userId,
    });

    await this.chatMemberRepository.save([member1, member2]);

    // Faire rejoindre les deux utilisateurs à la room du chat
    socketService.joinChatRoom(currentUserId, chat.channel_id);
    socketService.joinChatRoom(userId, chat.channel_id);

    // Notifier via la room du chat
    const io = socketService.getIO();
    if (io) {
      io.to(`chat.${chat.channel_id}`).emit("chat:created", {
        chatId: chat.id,
        channelId: chat.channel_id,
        type: chat.type,
      });
    }

    return chat;
  }

  async createGroupChat(currentUserId: number, data: CreateGroupChatDTO): Promise<Chat> {
    const { name, memberIds } = data;

    if (!name || name.trim() === "") {
      throw new Error("Group name is required");
    }

    if (!memberIds || memberIds.length === 0) {
      throw new Error("At least one member is required");
    }

    // Vérifier que tous les utilisateurs existent
    const users = await this.userRepository.findByIds([...memberIds, currentUserId]);
    const allMemberIds = [...new Set([currentUserId, ...memberIds])];

    if (users.length !== allMemberIds.length) {
      throw new Error("One or more users not found");
    }

    const chat = this.chatRepository.create({
      channel_id: this.generateChannelId(),
      type: ChatType.GROUP,
      name: name.trim(),
    });

    await this.chatRepository.save(chat);

    // Ajouter tous les membres
    const members = allMemberIds.map((userId) =>
      this.chatMemberRepository.create({
        chat_id: chat.id,
        user_id: userId,
      })
    );

    await this.chatMemberRepository.save(members);

    // Faire rejoindre tous les membres à la room du chat
    allMemberIds.forEach((userId) => {
      socketService.joinChatRoom(userId, chat.channel_id);
    });

    // Notifier via la room du chat
    const io = socketService.getIO();
    if (io) {
      io.to(`chat.${chat.channel_id}`).emit("chat:created", {
        chatId: chat.id,
        channelId: chat.channel_id,
        type: chat.type,
        name: chat.name,
      });
    }

    return chat;
  }

  async leaveGroupChat(userId: number, chatId: number): Promise<void> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.type !== ChatType.GROUP) {
      throw new Error("Cannot leave a direct chat");
    }

    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    // Supprimer le membre du chat
    await this.chatMemberRepository.remove(membership);

    // Faire quitter la room socket
    socketService.leaveChatRoom(userId, chat.channel_id);

    // Notifier les autres membres
    const io = socketService.getIO();
    if (io) {
      io.to(`chat.${chat.channel_id}`).emit("chat:member-left", {
        chatId: chat.id,
        channelId: chat.channel_id,
        userId,
      });
    }
  }

  private async findExistingDirectChat(userId1: number, userId2: number): Promise<Chat | null> {
    const result = await this.chatRepository
      .createQueryBuilder("chat")
      .innerJoin("chat.members", "m1", "m1.user_id = :userId1", { userId1 })
      .innerJoin("chat.members", "m2", "m2.user_id = :userId2", { userId2 })
      .where("chat.type = :type", { type: ChatType.DIRECT })
      .getOne();

    return result;
  }

  async getUserChats(userId: number): Promise<ChatListItem[]> {
    // Récupérer tous les chats de l'utilisateur
    const chatMembers = await this.chatMemberRepository.find({
      where: { user_id: userId },
      relations: ["chat"],
    });

    const chatIds = chatMembers.map((cm) => cm.chat_id);

    if (chatIds.length === 0) {
      return [];
    }

    // Récupérer les chats
    const chats = await this.chatRepository
      .createQueryBuilder("chat")
      .where("chat.id IN (:...chatIds)", { chatIds })
      .getMany();

    // Récupérer tous les membres de tous les chats
    const allMembers = await this.chatMemberRepository.find({
      where: chatIds.map((id) => ({ chat_id: id })),
    });

    const membersByChatId = new Map<number, number[]>();
    allMembers.forEach((m) => {
      const existing = membersByChatId.get(m.chat_id) ?? [];
      existing.push(m.user_id);
      membersByChatId.set(m.chat_id, existing);
    });

    // Récupérer le dernier message ID de chaque chat (par date de création)
    const lastMessages = await Promise.all(
      chatIds.map(async (chatId) => {
        const message = await this.messageRepository.findOne({
          where: { chat_id: chatId },
          order: { created_at: "DESC" },
          select: ["id", "created_at"],
        });
        return { chatId, messageId: message?.id ?? null, createdAt: message?.created_at };
      })
    );

    const lastMessageMap = new Map(lastMessages.map((lm) => [lm.chatId, lm]));

    // Formater les résultats - uniquement les IDs
    const chatList: ChatListItem[] = chats.map((chat) => {
      const lastMsg = lastMessageMap.get(chat.id);
      return {
        id: chat.id,
        name: chat.name,
        type: chat.type,
        channel_id: chat.channel_id,
        created_at: chat.created_at,
        lastMessageId: lastMsg?.messageId ?? null,
        memberIds: membersByChatId.get(chat.id) ?? [],
      };
    });

    // Trier par date de création du dernier message (plus récent en premier)
    chatList.sort((a, b) => {
      const dateA = lastMessageMap.get(a.id)?.createdAt ?? a.created_at;
      const dateB = lastMessageMap.get(b.id)?.createdAt ?? b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return chatList;
  }

  async getChatMessages(
    userId: number,
    chatId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    // Vérifier que l'utilisateur est membre du chat
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    const offset = (page - 1) * limit;

    // Récupérer le total de messages
    const total = await this.messageRepository.count({
      where: { chat_id: chatId },
    });

    // Récupérer les messages avec pagination - sans relations
    const messages = await this.messageRepository.find({
      where: { chat_id: chatId },
      order: { created_at: "DESC" },
      skip: offset,
      take: limit,
    });

    // Récupérer les réactions pour chaque message
    const messageIds = messages.map((m) => m.id);
    const reactions =
      messageIds.length > 0
        ? await this.userReactionRepository
            .createQueryBuilder("ur")
            .leftJoinAndSelect("ur.reaction", "reaction")
            .where("ur.message_id IN (:...messageIds)", { messageIds })
            .getMany()
        : [];

    // Grouper les réactions par message
    const reactionsByMessage = new Map<number, typeof reactions>();
    reactions.forEach((r) => {
      const existing = reactionsByMessage.get(r.message_id) ?? [];
      existing.push(r);
      reactionsByMessage.set(r.message_id, existing);
    });

    // Formater les messages - uniquement les IDs
    const formattedMessages: MessageItem[] = messages.map((message) => {
      const messageReactions = reactionsByMessage.get(message.id) ?? [];

      // Grouper les réactions par reactionId
      const reactionGroups = new Map<number, number[]>();

      messageReactions.forEach((r) => {
        const existing = reactionGroups.get(r.reaction_id) ?? [];
        existing.push(r.user_id);
        reactionGroups.set(r.reaction_id, existing);
      });

      return {
        id: message.id,
        content: message.content,
        type: message.type,
        created_at: message.created_at,
        updated_at: message.updated_at,
        authorId: message.author_id,
        chatId: message.chat_id,
        reactions: Array.from(reactionGroups.entries()).map(([reactionId, userIds]) => ({
          reactionId,
          userIds,
        })),
      };
    });

    return {
      messages: formattedMessages.reverse(), // Ordre chronologique
      total,
      page,
      limit,
      hasMore: offset + messages.length < total,
    };
  }

  async sendMessage(userId: number, data: SendMessageDTO): Promise<MessageItem> {
    const { chatId, content, type = "text" } = data;

    if (!content || content.trim() === "") {
      throw new Error("Message content is required");
    }

    // Vérifier que l'utilisateur est membre du chat
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new Error("Chat not found");
    }

    const message = this.messageRepository.create({
      chat_id: chatId,
      author_id: userId,
      content: content.trim(),
      type: type === "image" ? MessageType.IMAGE : MessageType.TEXT,
    });

    await this.messageRepository.save(message);

    const messageItem: MessageItem = {
      id: message.id,
      content: message.content,
      type: message.type,
      created_at: message.created_at,
      updated_at: message.updated_at,
      authorId: message.author_id,
      chatId: message.chat_id,
      reactions: [],
    };

    // Notifier tous les membres via la room du chat
    const io = socketService.getIO();
    if (io) {
      io.to(`chat.${chat.channel_id}`).emit("message:new", {
        chatId,
        channelId: chat.channel_id,
        message: messageItem,
      });
    }

    return messageItem;
  }

  async getChatById(userId: number, chatId: number): Promise<ChatListItem | null> {
    // Vérifier que l'utilisateur est membre du chat
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership) {
      return null;
    }

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      return null;
    }

    // Récupérer les membres
    const members = await this.chatMemberRepository.find({
      where: { chat_id: chatId },
    });

    const lastMessage = await this.messageRepository.findOne({
      where: { chat_id: chatId },
      order: { created_at: "DESC" },
      select: ["id"],
    });

    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      channel_id: chat.channel_id,
      created_at: chat.created_at,
      lastMessageId: lastMessage?.id ?? null,
      memberIds: members.map((m) => m.user_id),
    };
  }

  async getMessageById(userId: number, messageId: number): Promise<MessageItem | null> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      return null;
    }

    // Vérifier que l'utilisateur est membre du chat
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: message.chat_id },
    });

    if (!membership) {
      return null;
    }

    // Récupérer les réactions
    const userReactions = await this.userReactionRepository.find({
      where: { message_id: messageId },
    });

    const reactionGroups = new Map<number, number[]>();
    userReactions.forEach((r) => {
      const existing = reactionGroups.get(r.reaction_id) ?? [];
      existing.push(r.user_id);
      reactionGroups.set(r.reaction_id, existing);
    });

    return {
      id: message.id,
      content: message.content,
      type: message.type,
      created_at: message.created_at,
      updated_at: message.updated_at,
      authorId: message.author_id,
      chatId: message.chat_id,
      reactions: Array.from(reactionGroups.entries()).map(([reactionId, userIds]) => ({
        reactionId,
        userIds,
      })),
    };
  }

  async toggleReaction(userId: number, messageId: number, reactionId: number): Promise<{ added: boolean }> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Vérifier que l'utilisateur est membre du chat
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: message.chat_id },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    // Vérifier que la réaction existe
    const reactionRepo = AppDataSource.getRepository("Reaction");
    const reaction = await reactionRepo.findOne({ where: { id: reactionId } });

    if (!reaction) {
      throw new Error("Reaction not found");
    }

    // Vérifier si la réaction existe déjà
    const existingReaction = await this.userReactionRepository.findOne({
      where: { user_id: userId, message_id: messageId, reaction_id: reactionId },
    });

    const chat = await this.chatRepository.findOne({ where: { id: message.chat_id } });

    if (existingReaction) {
      // Supprimer la réaction (toggle off)
      await this.userReactionRepository.remove(existingReaction);

      // Notifier via WebSocket
      const io = socketService.getIO();
      if (io && chat) {
        io.to(`chat.${chat.channel_id}`).emit("reaction:removed", {
          messageId,
          reactionId,
          userId,
        });
      }

      return { added: false };
    } else {
      // Ajouter la réaction (toggle on)
      const newReaction = this.userReactionRepository.create({
        user_id: userId,
        message_id: messageId,
        reaction_id: reactionId,
      });
      await this.userReactionRepository.save(newReaction);

      // Notifier via WebSocket
      const io = socketService.getIO();
      if (io && chat) {
        io.to(`chat.${chat.channel_id}`).emit("reaction:added", {
          messageId,
          reactionId,
          userId,
        });
      }

      return { added: true };
    }
  }

  async getReactions(): Promise<{ id: number; code: string }[]> {
    const reactionRepo = AppDataSource.getRepository(Reaction);
    const reactions = await reactionRepo.find();
    return reactions.map((r) => ({ id: r.id, code: r.code }));
  }
}

export const chatService = new ChatService();
