import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/database/data-source.js";
import { User } from "../src/database/entities/user.js";

describe("Auth API", () => {
  const testUser = {
    username: "testuser",
    realname: "Test User",
    password: "password123",
  };

  let accessToken: string;
  let refreshToken: string;

  beforeEach(async () => {
    // Nettoyer les utilisateurs de test
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete({ username: testUser.username });
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
    });

    it("should fail with missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "test" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Missing required fields");
    });

    it("should fail with duplicate username", async () => {
      await request(app).post("/api/auth/register").send(testUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Username already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.tokens).toBeDefined();

      accessToken = res.body.tokens.accessToken;
      refreshToken = res.body.tokens.refreshToken;
    });

    it("should fail with invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("should fail with non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistent",
          password: "password",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /api/auth/refresh", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      refreshToken = loginRes.body.tokens.refreshToken;
    });

    it("should refresh tokens with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("should fail with invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
    });
  });
});
