import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/database/data-source.js";
import { User } from "../src/database/entities/user.js";
import { Chat } from "../src/database/entities/chat.js";
import { ChatMember } from "../src/database/entities/chat-member.js";
import { Message } from "../src/database/entities/message.js";
import { Reaction } from "../src/database/entities/reaction.js";
import { UserReaction } from "../src/database/entities/user-reaction.js";

describe("Chat API", () => {
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  const testUser1 = {
    username: "chatuser1",
    realname: "Chat User 1",
    password: "password123",
  };

  const testUser2 = {
    username: "chatuser2",
    realname: "Chat User 2",
    password: "password123",
  };

  const testUser3 = {
    username: "chatuser3",
    realname: "Chat User 3",
    password: "password123",
  };

  beforeAll(async () => {
    // Nettoyer et créer les utilisateurs de test
    const userRepo = AppDataSource.getRepository(User);
    const chatRepo = AppDataSource.getRepository(Chat);
    const chatMemberRepo = AppDataSource.getRepository(ChatMember);
    const messageRepo = AppDataSource.getRepository(Message);
    const userReactionRepo = AppDataSource.getRepository(UserReaction);

    // Nettoyer dans le bon ordre (contraintes FK)
    await userReactionRepo.createQueryBuilder().delete().execute();
    await messageRepo.createQueryBuilder().delete().execute();
    await chatMemberRepo.createQueryBuilder().delete().execute();
    await chatRepo.createQueryBuilder().delete().execute();
    await userRepo.delete({ username: testUser1.username });
    await userRepo.delete({ username: testUser2.username });
    await userRepo.delete({ username: testUser3.username });

    // Créer les utilisateurs
    const res1 = await request(app).post("/api/auth/register").send(testUser1);
    user1Token = res1.body.tokens.accessToken;
    user1Id = res1.body.user.id;

    const res2 = await request(app).post("/api/auth/register").send(testUser2);
    user2Token = res2.body.tokens.accessToken;
    user2Id = res2.body.user.id;

    const res3 = await request(app).post("/api/auth/register").send(testUser3);
    user3Token = res3.body.tokens.accessToken;
    user3Id = res3.body.user.id;
  });

  beforeEach(async () => {
    // Nettoyer les chats avant chaque test (respecter l'ordre des FK)
    const userReactionRepo = AppDataSource.getRepository(UserReaction);
    const messageRepo = AppDataSource.getRepository(Message);
    const chatMemberRepo = AppDataSource.getRepository(ChatMember);
    const chatRepo = AppDataSource.getRepository(Chat);

    await userReactionRepo.createQueryBuilder().delete().execute();
    await messageRepo.createQueryBuilder().delete().execute();
    await chatMemberRepo.createQueryBuilder().delete().execute();
    await chatRepo.createQueryBuilder().delete().execute();
  });

  describe("POST /api/chats/direct", () => {
    it("should create a direct chat between two users", async () => {
      const res = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.type).toBe("direct");
      expect(res.body.channel_id).toBeDefined();
    });

    it("should return existing chat if already exists", async () => {
      // Créer le premier chat
      const res1 = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      // Essayer de créer le même chat
      const res2 = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      expect(res2.status).toBe(201);
      expect(res2.body.id).toBe(res1.body.id);
    });

    it("should fail to create chat with yourself", async () => {
      const res = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user1Id });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot create a chat with yourself");
    });

    it("should fail to create chat with non-existent user", async () => {
      const res = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: 99999 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("User not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/api/chats/direct")
        .send({ userId: user2Id });

      expect(res.status).toBe(401);
    });

    it("should fail with missing userId", async () => {
      const res = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("User ID is required");
    });
  });

  describe("POST /api/chats/group", () => {
    it("should create a group chat", async () => {
      const res = await request(app)
        .post("/api/chats/group")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Test Group",
          memberIds: [user2Id, user3Id],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.type).toBe("group");
      expect(res.body.name).toBe("Test Group");
    });

    it("should fail without group name", async () => {
      const res = await request(app)
        .post("/api/chats/group")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          memberIds: [user2Id],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Group name is required");
    });

    it("should fail without members", async () => {
      const res = await request(app)
        .post("/api/chats/group")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Test Group",
          memberIds: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("At least one member is required");
    });

    it("should fail with non-existent member", async () => {
      const res = await request(app)
        .post("/api/chats/group")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Test Group",
          memberIds: [user2Id, 99999],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("One or more users not found");
    });
  });

  describe("GET /api/chats", () => {
    it("should return empty list when no chats", async () => {
      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return user chats with lastMessageId and memberIds", async () => {
      // Créer un chat
      await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].lastMessageId).toBeNull();
      expect(res.body[0].memberIds).toContain(user1Id);
      expect(res.body[0].memberIds).toContain(user2Id);
    });

    it("should return chats sorted by last message date", async () => {
      // Créer deux chats
      const chat1Res = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      const chat2Res = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user3Id });

      // Envoyer un message dans le premier chat
      await request(app)
        .post(`/api/chats/${chat1Res.body.id}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "Hello in chat 1" });

      const res = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // Le chat avec le message le plus récent devrait être en premier
      expect(res.body[0].id).toBe(chat1Res.body.id);
    });
  });

  describe("GET /api/chats/:id", () => {
    it("should return chat by id", async () => {
      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      const res = await request(app)
        .get(`/api/chats/${chatRes.body.id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(chatRes.body.id);
      expect(res.body.memberIds).toBeDefined();
      expect(res.body.lastMessageId).toBeNull();
    });

    it("should return 404 for non-existent chat", async () => {
      const res = await request(app)
        .get("/api/chats/99999")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 if user is not a member", async () => {
      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      const res = await request(app)
        .get(`/api/chats/${chatRes.body.id}`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/chats/:id/messages", () => {
    let chatId: number;

    beforeEach(async () => {
      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });
      chatId = chatRes.body.id;
    });

    it("should send a message", async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "Hello World" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.content).toBe("Hello World");
      expect(res.body.authorId).toBe(user1Id);
      expect(res.body.chatId).toBe(chatId);
      expect(res.body.reactions).toEqual([]);
    });

    it("should fail with empty content", async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Message content is required");
    });

    it("should fail if not a member", async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3Token}`)
        .send({ content: "Hello" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("You are not a member of this chat");
    });

    it("should send image message", async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "image_url.jpg", type: "image" });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("image");
    });
  });

  describe("GET /api/chats/:id/messages", () => {
    let chatId: number;

    beforeEach(async () => {
      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });
      chatId = chatRes.body.id;
    });

    it("should return empty messages list", async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.messages).toEqual([]);
      expect(res.body.total).toBe(0);
      expect(res.body.hasMore).toBe(false);
    });

    it("should return messages with pagination", async () => {
      // Envoyer plusieurs messages
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/api/chats/${chatId}/messages`)
          .set("Authorization", `Bearer ${user1Token}`)
          .send({ content: `Message ${i}` });
      }

      const res = await request(app)
        .get(`/api/chats/${chatId}/messages?page=1&limit=3`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.messages.length).toBe(3);
      expect(res.body.total).toBe(5);
      expect(res.body.hasMore).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(3);
    });

    it("should return messages in chronological order", async () => {
      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "First" });

      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "Second" });

      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.body.messages[0].content).toBe("First");
      expect(res.body.messages[1].content).toBe("Second");
    });

    it("should fail if not a member", async () => {
      const res = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/chats/messages/:messageId", () => {
    let chatId: number;
    let messageId: number;

    beforeEach(async () => {
      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });
      chatId = chatRes.body.id;

      const msgRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "Test message" });
      messageId = msgRes.body.id;
    });

    it("should return message by id", async () => {
      const res = await request(app)
        .get(`/api/chats/messages/${messageId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(messageId);
      expect(res.body.content).toBe("Test message");
      expect(res.body.authorId).toBe(user1Id);
      expect(res.body.chatId).toBe(chatId);
    });

    it("should return 404 for non-existent message", async () => {
      const res = await request(app)
        .get("/api/chats/messages/99999")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 if user is not a member of the chat", async () => {
      const res = await request(app)
        .get(`/api/chats/messages/${messageId}`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/chats/:id/leave", () => {
    let groupChatId: number;

    beforeEach(async () => {
      const chatRes = await request(app)
        .post("/api/chats/group")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Test Group",
          memberIds: [user2Id, user3Id],
        });
      groupChatId = chatRes.body.id;
    });

    it("should leave a group chat", async () => {
      const res = await request(app)
        .post(`/api/chats/${groupChatId}/leave`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Successfully left the group");

      // Vérifier que l'utilisateur n'est plus membre
      const chatRes = await request(app)
        .get(`/api/chats/${groupChatId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(chatRes.status).toBe(404);
    });

    it("should fail to leave a direct chat", async () => {
      const directChatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });

      const res = await request(app)
        .post(`/api/chats/${directChatRes.body.id}/leave`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot leave a direct chat");
    });

    it("should fail if not a member", async () => {
      // D'abord quitter le groupe
      await request(app)
        .post(`/api/chats/${groupChatId}/leave`)
        .set("Authorization", `Bearer ${user3Token}`);

      // Essayer de quitter à nouveau
      const res = await request(app)
        .post(`/api/chats/${groupChatId}/leave`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("You are not a member of this chat");
    });

    it("should fail for non-existent chat", async () => {
      const res = await request(app)
        .post("/api/chats/99999/leave")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Chat not found");
    });
  });

  describe("Message updated_at tracking", () => {
    let chatId: number;

    beforeEach(async () => {
      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });
      chatId = chatRes.body.id;
    });

    it("should have created_at and updated_at on new message", async () => {
      const res = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "Test message" });

      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
      expect(res.body.created_at).toBe(res.body.updated_at);
    });
  });

  describe("GET /api/chats/reactions", () => {
    it("should return list of available reactions", async () => {
      const res = await request(app)
        .get("/api/chats/reactions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/chats/messages/:messageId/reactions", () => {
    let chatId: number;
    let messageId: number;
    let reactionId: number;

    beforeAll(async () => {
      // Créer une réaction de test si elle n'existe pas
      const reactionRepo = AppDataSource.getRepository(Reaction);
      let reaction = await reactionRepo.findOne({ where: { code: "👍" } });
      if (!reaction) {
        reaction = reactionRepo.create({ code: "👍" });
        await reactionRepo.save(reaction);
      }
      reactionId = reaction.id;
    });

    beforeEach(async () => {
      // Nettoyer les réactions des utilisateurs
      const userReactionRepo = AppDataSource.getRepository(UserReaction);
      await userReactionRepo.createQueryBuilder().delete().execute();

      const chatRes = await request(app)
        .post("/api/chats/direct")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ userId: user2Id });
      chatId = chatRes.body.id;

      const msgRes = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ content: "Test message for reactions" });
      messageId = msgRes.body.id;
    });

    it("should add a reaction (toggle on)", async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId });

      expect(res.status).toBe(200);
      expect(res.body.added).toBe(true);
    });

    it("should remove a reaction (toggle off)", async () => {
      // D'abord ajouter la réaction
      await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId });

      // Puis la retirer (toggle)
      const res = await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId });

      expect(res.status).toBe(200);
      expect(res.body.added).toBe(false);
    });

    it("should show reactions on message", async () => {
      // Ajouter une réaction
      await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId });

      // Récupérer le message
      const res = await request(app)
        .get(`/api/chats/messages/${messageId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.reactions.length).toBe(1);
      expect(res.body.reactions[0].reactionId).toBe(reactionId);
      expect(res.body.reactions[0].userIds).toContain(user1Id);
    });

    it("should allow multiple users to react", async () => {
      // User1 réagit
      await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId });

      // User2 réagit
      await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ reactionId });

      // Récupérer le message
      const res = await request(app)
        .get(`/api/chats/messages/${messageId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.body.reactions[0].userIds).toContain(user1Id);
      expect(res.body.reactions[0].userIds).toContain(user2Id);
      expect(res.body.reactions[0].userIds.length).toBe(2);
    });

    it("should fail if not a member of the chat", async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user3Token}`)
        .send({ reactionId });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("You are not a member of this chat");
    });

    it("should fail with non-existent message", async () => {
      const res = await request(app)
        .post("/api/chats/messages/99999/reactions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Message not found");
    });

    it("should fail with non-existent reaction", async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ reactionId: 99999 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Reaction not found");
    });

    it("should fail without reactionId", async () => {
      const res = await request(app)
        .post(`/api/chats/messages/${messageId}/reactions`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Reaction ID is required");
    });
  });
});
