import { AppDataSource } from "../database/data-source.js";
import { Chat, ChatType } from "../database/entities/chat.js";
import { ChatMember } from "../database/entities/chat-member.js";
import { Message, MessageType } from "../database/entities/message.js";
import { User } from "../database/entities/user.js";
import { Reaction } from "../database/entities/reaction.js";
import { UserReaction } from "../database/entities/user-reaction.js";
import { BlockedUser } from "../database/entities/blocked-user.js";
import { MessageRead } from "../database/entities/message-read.js";
import { ChatModerator } from "../database/entities/chat-moderator.js";
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
  socketId?: string;
}

interface ChatListItem {
  id: number;
  name: string | null;
  type: ChatType;
  channel_id: string;
  created_at: Date;
  lastMessageId: number | null;
  lastMessageContent: string | null;
  lastMessageType: string | null;
  lastMessageDate: string | null;
  memberIds: number[];
  moderatorIds: number[];
  unreadCount: number;
}

interface MessageItem {
  id: number;
  content: string;
  type: string;
  created_at: Date;
  updated_at: Date;
  authorId: number;
  chatId: number;
  deleted: boolean;
  reactions: { reactionId: number; userIds: number[] }[];
  readBy: number[];
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
  private blockedUserRepository = AppDataSource.getRepository(BlockedUser);
  private messageReadRepository = AppDataSource.getRepository(MessageRead);
  private chatModeratorRepository = AppDataSource.getRepository(ChatModerator);

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

    const existingChat = await this.findExistingDirectChat(currentUserId, userId);
    if (existingChat) {
      return existingChat;
    }

    const chat = this.chatRepository.create({
      channel_id: this.generateChannelId(),
      type: ChatType.DIRECT,
    });

    await this.chatRepository.save(chat);

    const member1 = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: currentUserId,
    });
    const member2 = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: userId,
    });

    await this.chatMemberRepository.save([member1, member2]);

    socketService.joinChatRoom(currentUserId, chat.channel_id);
    socketService.joinChatRoom(userId, chat.channel_id);

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

    const members = allMemberIds.map((userId) =>
      this.chatMemberRepository.create({
        chat_id: chat.id,
        user_id: userId,
      })
    );

    await this.chatMemberRepository.save(members);

    const moderator = this.chatModeratorRepository.create({
      chat_id: chat.id,
      user_id: currentUserId,
    });
    await this.chatModeratorRepository.save(moderator);

    allMemberIds.forEach((userId) => {
      socketService.joinChatRoom(userId, chat.channel_id);
    });

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

    const allMembers = await this.chatMemberRepository.find({
      where: { chat_id: chatId },
    });

    const isModerator = await this.chatModeratorRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    const allModerators = await this.chatModeratorRepository.find({
      where: { chat_id: chatId },
    });

    if (allMembers.length === 1) {
      const messageIds = await this.messageRepository.find({
        where: { chat_id: chatId },
        select: ["id"],
      });
      if (messageIds.length > 0) {
        const ids = messageIds.map(m => m.id);
        await this.messageReadRepository
          .createQueryBuilder()
          .delete()
          .where("message_id IN (:...ids)", { ids })
          .execute();
      }
      await this.messageRepository.delete({ chat_id: chatId });
      await this.chatModeratorRepository.remove(allModerators);
      await this.chatMemberRepository.remove(membership);
      await this.chatRepository.remove(chat);
      socketService.leaveChatRoom(userId, chat.channel_id);
      return;
    }

    if (isModerator && allModerators.length === 1) {
      throw new Error("You must assign another moderator before leaving");
    }

    if (isModerator) {
      await this.chatModeratorRepository.remove(isModerator);
    }

    await this.chatMemberRepository.remove(membership);

    socketService.leaveChatRoom(userId, chat.channel_id);

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
    const chatMembers = await this.chatMemberRepository.find({
      where: { user_id: userId },
      relations: ["chat"],
    });

    const chatIds = chatMembers.map((cm) => cm.chat_id);

    if (chatIds.length === 0) {
      return [];
    }

    const chats = await this.chatRepository
      .createQueryBuilder("chat")
      .where("chat.id IN (:...chatIds)", { chatIds })
      .getMany();

    const allMembers = await this.chatMemberRepository.find({
      where: chatIds.map((id) => ({ chat_id: id })),
    });

    const membersByChatId = new Map<number, number[]>();
    allMembers.forEach((m) => {
      const existing = membersByChatId.get(m.chat_id) ?? [];
      existing.push(m.user_id);
      membersByChatId.set(m.chat_id, existing);
    });

    const allModerators = await this.chatModeratorRepository.find({
      where: chatIds.map((id) => ({ chat_id: id })),
    });

    const moderatorsByChatId = new Map<number, number[]>();
    allModerators.forEach((m) => {
      const existing = moderatorsByChatId.get(m.chat_id) ?? [];
      existing.push(m.user_id);
      moderatorsByChatId.set(m.chat_id, existing);
    });

    const lastMessages = await Promise.all(
      chatIds.map(async (chatId) => {
        const message = await this.messageRepository.findOne({
          where: { chat_id: chatId },
          order: { created_at: "DESC" },
          select: ["id", "content", "type", "created_at"],
        });
        return {
          chatId,
          messageId: message?.id ?? null,
          content: message?.content ?? null,
          type: message?.type ?? null,
          createdAt: message?.created_at,
        };
      })
    );

    const lastMessageMap = new Map(lastMessages.map((lm) => [lm.chatId, lm]));

    const unreadCounts = await Promise.all(
      chatIds.map(async (chatId) => {
        const count = await this.messageRepository
          .createQueryBuilder("m")
          .leftJoin(
            MessageRead,
            "mr",
            "mr.message_id = m.id AND mr.user_id = :userId",
            { userId }
          )
          .where("m.chat_id = :chatId", { chatId })
          .andWhere("mr.id IS NULL")
          .getCount();
        return { chatId, count };
      })
    );
    const unreadMap = new Map(unreadCounts.map((u) => [u.chatId, u.count]));

    const chatList: ChatListItem[] = chats.map((chat) => {
      const lastMsg = lastMessageMap.get(chat.id);
      return {
        id: chat.id,
        name: chat.name,
        type: chat.type,
        channel_id: chat.channel_id,
        created_at: chat.created_at,
        lastMessageId: lastMsg?.messageId ?? null,
        lastMessageContent: lastMsg?.content ?? null,
        lastMessageType: lastMsg?.type ?? null,
        lastMessageDate: lastMsg?.createdAt?.toISOString() ?? null,
        memberIds: membersByChatId.get(chat.id) ?? [],
        moderatorIds: moderatorsByChatId.get(chat.id) ?? [],
        unreadCount: unreadMap.get(chat.id) ?? 0,
      };
    });

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
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    const offset = (page - 1) * limit;

    const total = await this.messageRepository.count({
      where: { chat_id: chatId },
    });

    const messages = await this.messageRepository.find({
      where: { chat_id: chatId },
      order: { created_at: "DESC" },
      skip: offset,
      take: limit,
    });

    const messageIds = messages.map((m) => m.id);
    const reactions =
      messageIds.length > 0
        ? await this.userReactionRepository
            .createQueryBuilder("ur")
            .leftJoinAndSelect("ur.reaction", "reaction")
            .where("ur.message_id IN (:...messageIds)", { messageIds })
            .getMany()
        : [];

    const reactionsByMessage = new Map<number, typeof reactions>();
    reactions.forEach((r) => {
      const existing = reactionsByMessage.get(r.message_id) ?? [];
      existing.push(r);
      reactionsByMessage.set(r.message_id, existing);
    });

    const reads =
      messageIds.length > 0
        ? await this.messageReadRepository
            .createQueryBuilder("mr")
            .where("mr.message_id IN (:...messageIds)", { messageIds })
            .getMany()
        : [];

    const readsByMessage = new Map<number, number[]>();
    reads.forEach((r) => {
      const existing = readsByMessage.get(r.message_id) ?? [];
      existing.push(r.user_id);
      readsByMessage.set(r.message_id, existing);
    });

    const formattedMessages: MessageItem[] = messages.map((message) => {
      const messageReactions = reactionsByMessage.get(message.id) ?? [];

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
        deleted: message.deleted,
        readBy: readsByMessage.get(message.id) ?? [],
      };
    });

    return {
      messages: formattedMessages.reverse(),
      total,
      page,
      limit,
      hasMore: offset + messages.length < total,
    };
  }

  async sendMessage(userId: number, data: SendMessageDTO): Promise<MessageItem> {
    const { chatId, content, type = "text", socketId } = data;

    if (!content || content.trim() === "") {
      throw new Error("Message content is required");
    }

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
    if (chat.type === ChatType.DIRECT) {
      const members = await this.chatMemberRepository.find({
        where: { chat_id: chatId },
      });
      const otherMember = members.find(m => m.user_id !== userId);
      if (otherMember) {
        const block = await this.blockedUserRepository.findOne({
          where: [
            { blocker_id: userId, blocked_id: otherMember.user_id },
            { blocker_id: otherMember.user_id, blocked_id: userId },
          ],
        });
        if (block) {
          throw new Error("Cannot send message: user is blocked");
        }
      }
    }

    const message = this.messageRepository.create({
      chat_id: chatId,
      author_id: userId,
      content: content.trim(),
      type: type === "image" ? MessageType.IMAGE : MessageType.TEXT,
    });

    await this.messageRepository.save(message);

    const authorRead = this.messageReadRepository.create({
      user_id: userId,
      message_id: message.id,
    });
    await this.messageReadRepository.save(authorRead);

    const messageItem: MessageItem = {
      id: message.id,
      content: message.content,
      type: message.type,
      created_at: message.created_at,
      updated_at: message.updated_at,
      authorId: message.author_id,
      chatId: message.chat_id,
      deleted: false,
      reactions: [],
      readBy: [userId],
    };

    const io = socketService.getIO();
    if (io) {
      const broadcast = io.to(`chat.${chat.channel_id}`);
      if (socketId) {
        broadcast.except(socketId).emit("message:new", {
          chatId,
          channelId: chat.channel_id,
          message: messageItem,
        });
      } else {
        broadcast.emit("message:new", {
          chatId,
          channelId: chat.channel_id,
          message: messageItem,
        });
      }
    }

    return messageItem;
  }

  async getChatById(userId: number, chatId: number): Promise<ChatListItem | null> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      return null;
    }

    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership && chat.type === ChatType.DIRECT) {
      return null;
    }

    const members = await this.chatMemberRepository.find({
      where: { chat_id: chatId },
    });

    const lastMessage = await this.messageRepository.findOne({
      where: { chat_id: chatId },
      order: { created_at: "DESC" },
      select: ["id", "content", "type", "created_at"],
    });

    const unreadCount = await this.messageRepository
      .createQueryBuilder("m")
      .leftJoin(
        MessageRead,
        "mr",
        "mr.message_id = m.id AND mr.user_id = :userId",
        { userId }
      )
      .where("m.chat_id = :chatId", { chatId })
      .andWhere("mr.id IS NULL")
      .getCount();

    const moderators = await this.chatModeratorRepository.find({
      where: { chat_id: chatId },
    });

    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      channel_id: chat.channel_id,
      created_at: chat.created_at,
      lastMessageId: lastMessage?.id ?? null,
      lastMessageContent: lastMessage?.content ?? null,
      lastMessageType: lastMessage?.type ?? null,
      lastMessageDate: lastMessage?.created_at?.toISOString() ?? null,
      memberIds: members.map((m) => m.user_id),
      moderatorIds: moderators.map((m) => m.user_id),
      unreadCount,
    };
  }

  async getMessageById(userId: number, messageId: number): Promise<MessageItem | null> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      return null;
    }

    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: message.chat_id },
    });

    if (!membership) {
      return null;
    }

    const userReactions = await this.userReactionRepository.find({
      where: { message_id: messageId },
    });

    const reactionGroups = new Map<number, number[]>();
    userReactions.forEach((r) => {
      const existing = reactionGroups.get(r.reaction_id) ?? [];
      existing.push(r.user_id);
      reactionGroups.set(r.reaction_id, existing);
    });

    const messageReads = await this.messageReadRepository.find({
      where: { message_id: messageId },
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
      deleted: message.deleted,
      readBy: messageReads.map((r) => r.user_id),
    };
  }

  async toggleReaction(userId: number, messageId: number, reactionId: number): Promise<{ added: boolean }> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: message.chat_id },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    const reactionRepo = AppDataSource.getRepository("Reaction");
    const reaction = await reactionRepo.findOne({ where: { id: reactionId } });

    if (!reaction) {
      throw new Error("Reaction not found");
    }

    const existingReaction = await this.userReactionRepository.findOne({
      where: { user_id: userId, message_id: messageId, reaction_id: reactionId },
    });

    const chat = await this.chatRepository.findOne({ where: { id: message.chat_id } });

    if (existingReaction) {
      await this.userReactionRepository.remove(existingReaction);

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
      const newReaction = this.userReactionRepository.create({
        user_id: userId,
        message_id: messageId,
        reaction_id: reactionId,
      });
      await this.userReactionRepository.save(newReaction);

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

  async markAsRead(userId: number, chatId: number, messageId: number): Promise<{ readMessageId: number; userId: number }> {
    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });

    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    const message = await this.messageRepository.findOne({
      where: { id: messageId, chat_id: chatId },
    });

    if (!message) {
      throw new Error("Message not found in this chat");
    }

    const unreadMessages = await this.messageRepository
      .createQueryBuilder("m")
      .leftJoin(
        MessageRead,
        "mr",
        "mr.message_id = m.id AND mr.user_id = :userId",
        { userId }
      )
      .where("m.chat_id = :chatId", { chatId })
      .andWhere("m.id <= :messageId", { messageId })
      .andWhere("mr.id IS NULL")
      .getMany();

    if (unreadMessages.length > 0) {
      const reads = unreadMessages.map((m) =>
        this.messageReadRepository.create({
          user_id: userId,
          message_id: m.id,
        })
      );
      await this.messageReadRepository.save(reads);
    }

    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    const io = socketService.getIO();
    if (io && chat) {
      io.to(`chat.${chat.channel_id}`).emit("message:read", {
        chatId,
        messageId,
        userId,
      });
    }

    return { readMessageId: messageId, userId };
  }

  async toggleModerator(userId: number, chatId: number, targetUserId: number): Promise<{ isModerator: boolean }> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat || chat.type !== ChatType.GROUP) {
      throw new Error("Group chat not found");
    }

    const callerMod = await this.chatModeratorRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });
    if (!callerMod) {
      throw new Error("Only moderators can change moderator status");
    }

    const targetMember = await this.chatMemberRepository.findOne({
      where: { user_id: targetUserId, chat_id: chatId },
    });
    if (!targetMember) {
      throw new Error("Target user is not a member of this chat");
    }

    const existingMod = await this.chatModeratorRepository.findOne({
      where: { user_id: targetUserId, chat_id: chatId },
    });

    if (existingMod) {
      const allMods = await this.chatModeratorRepository.find({ where: { chat_id: chatId } });
      if (allMods.length <= 1) {
        throw new Error("Cannot remove the last moderator");
      }
      await this.chatModeratorRepository.remove(existingMod);

      const io = socketService.getIO();
      if (io) {
        io.to(`chat.${chat.channel_id}`).emit("chat:moderator-changed", {
          chatId, userId: targetUserId, isModerator: false,
        });
      }

      return { isModerator: false };
    } else {
      const newMod = this.chatModeratorRepository.create({
        user_id: targetUserId,
        chat_id: chatId,
      });
      await this.chatModeratorRepository.save(newMod);

      const io = socketService.getIO();
      if (io) {
        io.to(`chat.${chat.channel_id}`).emit("chat:moderator-changed", {
          chatId, userId: targetUserId, isModerator: true,
        });
      }

      return { isModerator: true };
    }
  }

  async joinGroupChat(userId: number, channelId: string): Promise<ChatListItem> {
    const chat = await this.chatRepository.findOne({ where: { channel_id: channelId } });
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.type !== ChatType.GROUP) {
      throw new Error("Can only join group chats");
    }

    const existing = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: chat.id },
    });
    if (existing) {
      return this.getChatById(userId, chat.id) as Promise<ChatListItem>;
    }

    const member = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: userId,
    });
    await this.chatMemberRepository.save(member);

    socketService.joinChatRoom(userId, chat.channel_id);

    const io = socketService.getIO();
    if (io) {
      io.to(`chat.${chat.channel_id}`).emit("chat:member-joined", {
        chatId: chat.id,
        channelId: chat.channel_id,
        userId,
      });
    }

    return this.getChatById(userId, chat.id) as Promise<ChatListItem>;
  }

  async deleteMessage(userId: number, messageId: number): Promise<void> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new Error("Message not found");
    }

    const membership = await this.chatMemberRepository.findOne({
      where: { user_id: userId, chat_id: message.chat_id },
    });
    if (!membership) {
      throw new Error("You are not a member of this chat");
    }

    const isModerator = await this.chatModeratorRepository.findOne({
      where: { user_id: userId, chat_id: message.chat_id },
    });

    if (message.author_id !== userId && !isModerator) {
      throw new Error("Only the author or a moderator can delete this message");
    }

    message.content = "";
    message.deleted = true;
    await this.messageRepository.save(message);

    const chat = await this.chatRepository.findOne({ where: { id: message.chat_id } });
    const io = socketService.getIO();
    if (io && chat) {
      io.to(`chat.${chat.channel_id}`).emit("message:deleted", {
        chatId: message.chat_id,
        messageId: message.id,
      });
    }
  }

  async kickMember(userId: number, chatId: number, targetUserId: number): Promise<void> {
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (!chat || chat.type !== ChatType.GROUP) {
      throw new Error("Group chat not found");
    }

    const callerMod = await this.chatModeratorRepository.findOne({
      where: { user_id: userId, chat_id: chatId },
    });
    if (!callerMod) {
      throw new Error("Only moderators can kick members");
    }

    if (userId === targetUserId) {
      throw new Error("Cannot kick yourself");
    }

    const targetMembership = await this.chatMemberRepository.findOne({
      where: { user_id: targetUserId, chat_id: chatId },
    });
    if (!targetMembership) {
      throw new Error("User is not a member of this chat");
    }

    const targetMod = await this.chatModeratorRepository.findOne({
      where: { user_id: targetUserId, chat_id: chatId },
    });
    if (targetMod) {
      await this.chatModeratorRepository.remove(targetMod);
    }

    await this.chatMemberRepository.remove(targetMembership);

    socketService.leaveChatRoom(targetUserId, chat.channel_id);

    const io = socketService.getIO();
    if (io) {
      io.to(`chat.${chat.channel_id}`).emit("chat:member-kicked", {
        chatId: chat.id,
        channelId: chat.channel_id,
        userId: targetUserId,
        kickedBy: userId,
      });
      io.to(`user.${targetUserId}`).emit("chat:member-kicked", {
        chatId: chat.id,
        channelId: chat.channel_id,
        userId: targetUserId,
        kickedBy: userId,
      });
    }
  }

  async getReactions(): Promise<{ id: number; code: string }[]> {
    const reactionRepo = AppDataSource.getRepository(Reaction);
    const reactions = await reactionRepo.find();
    return reactions.map((r) => ({ id: r.id, code: r.code }));
  }
}

export const chatService = new ChatService();
