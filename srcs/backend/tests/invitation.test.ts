import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/database/data-source.js";
import { User } from "../src/database/entities/user.js";
import { Invitation } from "../src/database/entities/invitation.js";

describe("Invitation API", () => {
  const user1 = {
    username: "inviteuser1",
    realname: "Invite User 1",
    password: "password123",
  };

  const user2 = {
    username: "inviteuser2",
    realname: "Invite User 2",
    password: "password123",
  };

  let token1: string;
  let token2: string;
  let userId1: number;
  let userId2: number;

  beforeEach(async () => {
    const userRepo = AppDataSource.getRepository(User);
    const invitationRepo = AppDataSource.getRepository(Invitation);

    // Clear all invitations (use createQueryBuilder for empty delete)
    await invitationRepo.createQueryBuilder().delete().execute();
    await userRepo.delete({ username: user1.username });
    await userRepo.delete({ username: user2.username });

    const res1 = await request(app).post("/api/auth/register").send(user1);
    token1 = res1.body.tokens.accessToken;
    userId1 = res1.body.user.id;

    const res2 = await request(app).post("/api/auth/register").send(user2);
    token2 = res2.body.tokens.accessToken;
    userId2 = res2.body.user.id;
  });

  describe("POST /api/invitations", () => {
    it("should send an invitation", async () => {
      const res = await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });

      expect(res.status).toBe(201);
      expect(res.body.sender_id).toBe(userId1);
      expect(res.body.receiver_id).toBe(userId2);
      expect(res.body.status).toBe("pending");
    });

    it("should fail to send invitation to self", async () => {
      const res = await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user1.username });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot send invitation to yourself");
    });

    it("should fail to send duplicate invitation", async () => {
      await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });

      const res = await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invitation already pending");
    });

    it("should fail with non-existent user", async () => {
      const res = await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: "nonexistent" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("User not found");
    });
  });

  describe("GET /api/invitations/pending", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });
    });

    it("should get pending invitations", async () => {
      const res = await request(app)
        .get("/api/invitations/pending")
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].sender_id).toBe(userId1);
    });
  });

  describe("GET /api/invitations/sent", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });
    });

    it("should get sent invitations", async () => {
      const res = await request(app)
        .get("/api/invitations/sent")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].receiver_id).toBe(userId2);
    });
  });

  describe("POST /api/invitations/:id/accept", () => {
    let invitationId: number;

    beforeEach(async () => {
      const invRes = await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });

      invitationId = invRes.body.id;
    });

    it("should accept an invitation", async () => {
      const res = await request(app)
        .post(`/api/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("accepted");
    });

    it("should fail to accept non-existent invitation", async () => {
      const res = await request(app)
        .post("/api/invitations/99999/accept")
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invitation not found");
    });

    it("should fail if not the receiver", async () => {
      const res = await request(app)
        .post(`/api/invitations/${invitationId}/accept`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invitation not found");
    });
  });

  describe("POST /api/invitations/:id/decline", () => {
    let invitationId: number;

    beforeEach(async () => {
      const invRes = await request(app)
        .post("/api/invitations")
        .set("Authorization", `Bearer ${token1}`)
        .send({ username: user2.username });

      invitationId = invRes.body.id;
    });

    it("should decline an invitation", async () => {
      const res = await request(app)
        .post(`/api/invitations/${invitationId}/decline`)
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Invitation declined");
    });
  });
});
