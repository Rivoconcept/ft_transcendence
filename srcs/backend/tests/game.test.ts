import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/database/data-source.js";
import { User } from "../src/database/entities/user.js";
import { Game } from "../src/database/entities/game.js";
import { Participation } from "../src/database/entities/participation.js";

describe("Game API", () => {
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  const testUser1 = {
    username: "gameuser1",
    realname: "Game User 1",
    password: "password123",
  };

  const testUser2 = {
    username: "gameuser2",
    realname: "Game User 2",
    password: "password123",
  };

  const testUser3 = {
    username: "gameuser3",
    realname: "Game User 3",
    password: "password123",
  };

  beforeAll(async () => {
    // Nettoyer et créer les utilisateurs de test
    const userRepo = AppDataSource.getRepository(User);
    const gameRepo = AppDataSource.getRepository(Game);
    const participationRepo = AppDataSource.getRepository(Participation);

    // Nettoyer dans le bon ordre (contraintes FK)
    await participationRepo.createQueryBuilder().delete().execute();
    await gameRepo.createQueryBuilder().delete().execute();
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
    // Nettoyer les jeux avant chaque test (respecter l'ordre des FK)
    const participationRepo = AppDataSource.getRepository(Participation);
    const gameRepo = AppDataSource.getRepository(Game);

    await participationRepo.createQueryBuilder().delete().execute();
    await gameRepo.createQueryBuilder().delete().execute();
  });

  describe("POST /api/games", () => {
    it("should create a public game with default settings", async () => {
      const res = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.id.length).toBe(4);
      expect(res.body.authorId).toBe(user1Id);
      expect(res.body.is_open).toBe(true);
      expect(res.body.is_private).toBe(false);
      expect(res.body.game_over).toBe(false);
      expect(res.body.set).toBe(1);
      expect(res.body.current_set).toBe(1);
      expect(res.body.participantIds).toContain(user1Id);
    });

    it("should create a private game", async () => {
      const res = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(201);
      expect(res.body.is_private).toBe(true);
    });

    it("should create a game with custom set count", async () => {
      const res = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 3 });

      expect(res.status).toBe(201);
      expect(res.body.set).toBe(3);
      expect(res.body.current_set).toBe(1);
    });

    it("should create a private game with custom set", async () => {
      const res = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true, set: 5 });

      expect(res.status).toBe(201);
      expect(res.body.is_private).toBe(true);
      expect(res.body.set).toBe(5);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/api/games")
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/games/discover", () => {
    it("should return empty list when no public games", async () => {
      const res = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return only public open games", async () => {
      // Créer une partie publique
      const publicGame = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      // Créer une partie privée
      await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ is_private: true });

      const res = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(publicGame.body.id);
      expect(res.body[0].is_private).toBe(false);
    });

    it("should not return closed games", async () => {
      // Créer et démarrer une partie (ferme la partie aux nouveaux joueurs)
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameRes.body.id}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer la partie (ferme is_open)
      await request(app)
        .post(`/api/games/${gameRes.body.id}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it("should not return finished games", async () => {
      // Créer une partie
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameRes.body.id}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer la partie
      await request(app)
        .post(`/api/games/${gameRes.body.id}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/games/discover");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/games/:id", () => {
    it("should return game by id", async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const res = await request(app)
        .get(`/api/games/${gameRes.body.id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(gameRes.body.id);
      expect(res.body.authorId).toBe(user1Id);
      expect(res.body.participantIds).toContain(user1Id);
    });

    it("should return private game by id", async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      // Autre utilisateur peut voir la partie privée avec son ID
      const res = await request(app)
        .get(`/api/games/${gameRes.body.id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(gameRes.body.id);
      expect(res.body.is_private).toBe(true);
    });

    it("should return 404 for non-existent game", async () => {
      const res = await request(app)
        .get("/api/games/XXXX")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Game not found");
    });

    it("should fail with invalid game ID format", async () => {
      const res = await request(app)
        .get("/api/games/XX")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid game ID");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/games/ABCD");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/games/:id/join", () => {
    let gameId: string;

    beforeEach(async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      gameId = gameRes.body.id;
    });

    it("should join an open game", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.participantIds).toContain(user1Id);
      expect(res.body.participantIds).toContain(user2Id);
      expect(res.body.participantIds.length).toBe(2);
    });

    it("should fail to join same game twice", async () => {
      // Rejoindre une première fois
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Essayer de rejoindre à nouveau
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("You are already in this game");
    });

    it("should fail for creator to join their own game", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("You are already in this game");
    });

    it("should fail to join a closed game", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer la partie (ferme is_open)
      await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      // User3 essaie de rejoindre
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Game is not open for joining");
    });

    it("should fail to join a finished game", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer la partie
      await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      // User3 essaie de rejoindre
      const res = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Game is already over");
    });

    it("should fail to join non-existent game", async () => {
      const res = await request(app)
        .post("/api/games/XXXX/join")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Game not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/join`);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/games/:id/start", () => {
    let gameId: string;

    beforeEach(async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      gameId = gameRes.body.id;
    });

    it("should start a game with 2+ players", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_open).toBe(false);
      expect(res.body.game_over).toBe(false);
    });

    it("should fail to start with less than 2 players", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Need at least 2 players to start the game");
    });

    it("should fail if not the creator", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the game creator can start the game");
    });

    it("should fail to start an already started game", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer une première fois
      await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Essayer de démarrer à nouveau
      const res = await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Game has already started");
    });

    it("should fail to start a finished game", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer la partie
      await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Game is already over");
    });

    it("should fail for non-existent game", async () => {
      const res = await request(app)
        .post("/api/games/XXXX/start")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Game not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/start`);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/games/:id/next-set", () => {
    let gameId: string;

    beforeEach(async () => {
      // Créer une partie avec 3 sets
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 3 });
      gameId = gameRes.body.id;

      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer la partie
      await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);
    });

    it("should increment current_set", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.current_set).toBe(2);
      expect(res.body.set).toBe(3);
      expect(res.body.game_over).toBe(false);
    });

    it("should auto end game when current_set exceeds set", async () => {
      // Passer au set 2
      await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Passer au set 3
      await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Passer au set 4 (dépasse set=3)
      const res = await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.current_set).toBe(4);
      expect(res.body.game_over).toBe(true);
      expect(res.body.is_open).toBe(false);
    });

    it("should fail if not the creator", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the game creator can update the set");
    });

    it("should fail on a finished game", async () => {
      // Terminer la partie
      await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Game is already over");
    });

    it("should fail for non-existent game", async () => {
      const res = await request(app)
        .post("/api/games/XXXX/next-set")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Game not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/next-set`);

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/games/:id/visibility", () => {
    let gameId: string;

    beforeEach(async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });
      gameId = gameRes.body.id;
    });

    it("should change visibility from public to private", async () => {
      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(200);
      expect(res.body.is_private).toBe(true);
    });

    it("should change visibility from private to public", async () => {
      // D'abord passer en privé
      await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      // Puis repasser en public
      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      expect(res.status).toBe(200);
      expect(res.body.is_private).toBe(false);
    });

    it("should fail if not the creator", async () => {
      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the game creator can change visibility");
    });

    it("should fail on a finished game", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer la partie
      await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot change visibility of a finished game");
    });

    it("should fail without is_private boolean", async () => {
      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("is_private must be a boolean");
    });

    it("should fail with invalid is_private value", async () => {
      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: "yes" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("is_private must be a boolean");
    });

    it("should fail for non-existent game", async () => {
      const res = await request(app)
        .patch("/api/games/XXXX/visibility")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Game not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .send({ is_private: true });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/games/:id/end", () => {
    let gameId: string;

    beforeEach(async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      gameId = gameRes.body.id;
    });

    it("should end a game", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.game_over).toBe(true);
      expect(res.body.is_open).toBe(false);
    });

    it("should fail if not the creator", async () => {
      // User2 rejoint d'abord
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the game creator can end the game");
    });

    it("should fail to end an already ended game", async () => {
      // Terminer une première fois
      await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Essayer de terminer à nouveau
      const res = await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Game is already over");
    });

    it("should fail for non-existent game", async () => {
      const res = await request(app)
        .post("/api/games/XXXX/end")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Game not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/games/${gameId}/end`);

      expect(res.status).toBe(401);
    });
  });

  describe("Game flow scenarios", () => {
    it("should handle complete game lifecycle", async () => {
      // 1. Créer une partie avec 2 sets
      const createRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 2 });

      expect(createRes.status).toBe(201);
      const gameId = createRes.body.id;

      // 2. La partie apparaît dans discover
      let discoverRes = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(1);

      // 3. User2 rejoint
      const joinRes = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(joinRes.body.participantIds.length).toBe(2);

      // 4. User3 rejoint aussi
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      // 5. Démarrer la partie
      const startRes = await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(startRes.body.is_open).toBe(false);

      // 6. La partie n'apparaît plus dans discover
      discoverRes = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(0);

      // 7. Jouer le premier set
      const set1Res = await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(set1Res.body.current_set).toBe(2);
      expect(set1Res.body.game_over).toBe(false);

      // 8. Jouer le deuxième set (dépasse set=2)
      const set2Res = await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(set2Res.body.current_set).toBe(3);
      expect(set2Res.body.game_over).toBe(true);

      // 9. La partie est terminée
      const finalRes = await request(app)
        .get(`/api/games/${gameId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(finalRes.body.game_over).toBe(true);
    });

    it("should handle private game discovery", async () => {
      // Créer une partie privée
      const createRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      const gameId = createRes.body.id;

      // La partie n'apparaît pas dans discover
      const discoverRes = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(0);

      // Mais on peut y accéder via l'ID
      const getRes = await request(app)
        .get(`/api/games/${gameId}`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(gameId);

      // Et on peut rejoindre via l'ID
      const joinRes = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(joinRes.status).toBe(200);
    });

    it("should handle visibility changes", async () => {
      // Créer une partie publique
      const createRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      const gameId = createRes.body.id;

      // Visible dans discover
      let discoverRes = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(1);

      // Passer en privé
      await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      // Plus visible dans discover
      discoverRes = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(0);

      // Repasser en public
      await request(app)
        .patch(`/api/games/${gameId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      // À nouveau visible dans discover
      discoverRes = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(1);
    });

    it("should handle early game termination", async () => {
      // Créer une partie avec 5 sets
      const createRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 5 });

      const gameId = createRes.body.id;

      // User2 rejoint
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer
      await request(app)
        .post(`/api/games/${gameId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Jouer un set
      await request(app)
        .post(`/api/games/${gameId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Terminer prématurément (current_set = 2, set = 5)
      const endRes = await request(app)
        .post(`/api/games/${gameId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(endRes.status).toBe(200);
      expect(endRes.body.current_set).toBe(2);
      expect(endRes.body.set).toBe(5);
      expect(endRes.body.game_over).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should generate unique 4-character game IDs", async () => {
      const ids: string[] = [];

      // Créer plusieurs parties
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/games")
          .set("Authorization", `Bearer ${user1Token}`)
          .send({});

        expect(res.body.id.length).toBe(4);
        expect(ids).not.toContain(res.body.id);
        ids.push(res.body.id);
      }
    });

    it("should handle multiple players joining", async () => {
      const gameRes = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const gameId = gameRes.body.id;

      // User2 et User3 rejoignent
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      const res = await request(app)
        .get(`/api/games/${gameId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.body.participantIds.length).toBe(3);
      expect(res.body.participantIds).toContain(user1Id);
      expect(res.body.participantIds).toContain(user2Id);
      expect(res.body.participantIds).toContain(user3Id);
    });

    it("should order discovered games by creation date DESC", async () => {
      // Créer 3 parties publiques
      const game1 = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const game2 = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const game3 = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const res = await request(app)
        .get("/api/games/discover")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.body.length).toBe(3);
      // Plus récent en premier
      expect(res.body[0].id).toBe(game3.body.id);
      expect(res.body[1].id).toBe(game2.body.id);
      expect(res.body[2].id).toBe(game1.body.id);
    });
  });
});
