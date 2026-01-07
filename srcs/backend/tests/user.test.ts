import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/database/data-source.js";
import { User } from "../src/database/entities/user.js";

describe("User API", () => {
  const testUser = {
    username: "usertest",
    realname: "User Test",
    password: "password123",
  };

  let accessToken: string;
  let userId: number;

  beforeEach(async () => {
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete({ username: testUser.username });
    await userRepo.delete({ username: "otheruser" });

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    accessToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;
  });

  describe("GET /api/users/me", () => {
    it("should get current user profile", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(testUser.username);
      expect(res.body.realname).toBe(testUser.realname);
      expect(res.body.password).toBeUndefined();
    });

    it("should fail without token", async () => {
      const res = await request(app).get("/api/users/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("No token provided");
    });

    it("should fail with invalid token", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired token");
    });
  });

  describe("PUT /api/users/me", () => {
    it("should update current user profile", async () => {
      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ realname: "Updated Name", avatar: "new-avatar.png" });

      expect(res.status).toBe(200);
      expect(res.body.realname).toBe("Updated Name");
      expect(res.body.avatar).toBe("new-avatar.png");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user by id", async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(testUser.username);
      expect(res.body.password).toBeUndefined();
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/users/99999")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("should return 400 for invalid user id", async () => {
      const res = await request(app)
        .get("/api/users/invalid")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid user ID");
    });
  });
});
