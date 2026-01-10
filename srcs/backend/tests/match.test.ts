import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/database/data-source.js";
import { User } from "../src/database/entities/user.js";
import { Match } from "../src/database/entities/match.js";
import { Participation } from "../src/database/entities/participation.js";

describe("Match API", () => {
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  const testUser1 = {
    username: "matchuser1",
    realname: "Match User 1",
    password: "password123",
  };

  const testUser2 = {
    username: "matchuser2",
    realname: "Match User 2",
    password: "password123",
  };

  const testUser3 = {
    username: "matchuser3",
    realname: "Match User 3",
    password: "password123",
  };

  beforeAll(async () => {
    // Nettoyer et créer les utilisateurs de test
    const userRepo = AppDataSource.getRepository(User);
    const matchRepo = AppDataSource.getRepository(Match);
    const participationRepo = AppDataSource.getRepository(Participation);

    // Nettoyer dans le bon ordre (contraintes FK)
    await participationRepo.createQueryBuilder().delete().execute();
    await matchRepo.createQueryBuilder().delete().execute();
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
    // Nettoyer les matchs avant chaque test (respecter l'ordre des FK)
    const participationRepo = AppDataSource.getRepository(Participation);
    const matchRepo = AppDataSource.getRepository(Match);

    await participationRepo.createQueryBuilder().delete().execute();
    await matchRepo.createQueryBuilder().delete().execute();
  });

  describe("POST /api/matches", () => {
    it("should create a public match with default settings", async () => {
      const res = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.id.length).toBe(4);
      expect(res.body.authorId).toBe(user1Id);
      expect(res.body.is_open).toBe(true);
      expect(res.body.is_private).toBe(false);
      expect(res.body.match_over).toBe(false);
      expect(res.body.set).toBe(1);
      expect(res.body.current_set).toBe(1);
      expect(res.body.participantIds).toContain(user1Id);
    });

    it("should create a private match", async () => {
      const res = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(201);
      expect(res.body.is_private).toBe(true);
    });

    it("should create a match with custom set count", async () => {
      const res = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 3 });

      expect(res.status).toBe(201);
      expect(res.body.set).toBe(3);
      expect(res.body.current_set).toBe(1);
    });

    it("should create a private match with custom set", async () => {
      const res = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true, set: 5 });

      expect(res.status).toBe(201);
      expect(res.body.is_private).toBe(true);
      expect(res.body.set).toBe(5);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/api/matches")
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/matches/discover", () => {
    it("should return empty list when no public matches", async () => {
      const res = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return only public open matches", async () => {
      // Créer un match public
      const publicMatch = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      // Créer un match privé
      await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ is_private: true });

      const res = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(publicMatch.body.id);
      expect(res.body[0].is_private).toBe(false);
    });

    it("should not return closed matches", async () => {
      // Créer et démarrer un match (ferme le match aux nouveaux joueurs)
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchRes.body.id}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer le match (ferme is_open)
      await request(app)
        .post(`/api/matches/${matchRes.body.id}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it("should not return finished matches", async () => {
      // Créer un match
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchRes.body.id}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer le match
      await request(app)
        .post(`/api/matches/${matchRes.body.id}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/matches/discover");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/matches/:id", () => {
    it("should return match by id", async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const res = await request(app)
        .get(`/api/matches/${matchRes.body.id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(matchRes.body.id);
      expect(res.body.authorId).toBe(user1Id);
      expect(res.body.participantIds).toContain(user1Id);
    });

    it("should return private match by id", async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      // Autre utilisateur peut voir le match privé avec son ID
      const res = await request(app)
        .get(`/api/matches/${matchRes.body.id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(matchRes.body.id);
      expect(res.body.is_private).toBe(true);
    });

    it("should return 404 for non-existent match", async () => {
      const res = await request(app)
        .get("/api/matches/XXXX")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail with invalid match ID format", async () => {
      const res = await request(app)
        .get("/api/matches/XX")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid match ID");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .get("/api/matches/ABCD");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/matches/:id/join", () => {
    let matchId: string;

    beforeEach(async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      matchId = matchRes.body.id;
    });

    it("should join an open match", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.participantIds).toContain(user1Id);
      expect(res.body.participantIds).toContain(user2Id);
      expect(res.body.participantIds.length).toBe(2);
    });

    it("should fail to join same match twice", async () => {
      // Rejoindre une première fois
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Essayer de rejoindre à nouveau
      const res = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("You are already in this match");
    });

    it("should fail for creator to join their own match", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("You are already in this match");
    });

    it("should fail to join a closed match", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer le match (ferme is_open)
      await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      // User3 essaie de rejoindre
      const res = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match is not open for joining");
    });

    it("should fail to join a finished match", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer le match
      await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      // User3 essaie de rejoindre
      const res = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match is already over");
    });

    it("should fail to join non-existent match", async () => {
      const res = await request(app)
        .post("/api/matches/XXXX/join")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/join`);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/matches/:id/start", () => {
    let matchId: string;

    beforeEach(async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      matchId = matchRes.body.id;
    });

    it("should start a match with 2+ players", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_open).toBe(false);
      expect(res.body.match_over).toBe(false);
    });

    it("should fail to start with less than 2 players", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Need at least 2 players to start the match");
    });

    it("should fail if not the creator", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the match creator can start the match");
    });

    it("should fail to start an already started match", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer une première fois
      await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Essayer de démarrer à nouveau
      const res = await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match has already started");
    });

    it("should fail to start a finished match", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer le match
      await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match is already over");
    });

    it("should fail for non-existent match", async () => {
      const res = await request(app)
        .post("/api/matches/XXXX/start")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/start`);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/matches/:id/next-set", () => {
    let matchId: string;

    beforeEach(async () => {
      // Créer un match avec 3 sets
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 3 });
      matchId = matchRes.body.id;

      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer le match
      await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);
    });

    it("should increment current_set", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.current_set).toBe(2);
      expect(res.body.set).toBe(3);
      expect(res.body.match_over).toBe(false);
    });

    it("should auto end match when current_set exceeds set", async () => {
      // Passer au set 2
      await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Passer au set 3
      await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Passer au set 4 (dépasse set=3)
      const res = await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.current_set).toBe(4);
      expect(res.body.match_over).toBe(true);
      expect(res.body.is_open).toBe(false);
    });

    it("should fail if not the creator", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the match creator can update the set");
    });

    it("should fail on a finished match", async () => {
      // Terminer le match
      await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match is already over");
    });

    it("should fail for non-existent match", async () => {
      const res = await request(app)
        .post("/api/matches/XXXX/next-set")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/next-set`);

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/matches/:id/visibility", () => {
    let matchId: string;

    beforeEach(async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });
      matchId = matchRes.body.id;
    });

    it("should change visibility from public to private", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(200);
      expect(res.body.is_private).toBe(true);
    });

    it("should change visibility from private to public", async () => {
      // D'abord passer en privé
      await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      // Puis repasser en public
      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      expect(res.status).toBe(200);
      expect(res.body.is_private).toBe(false);
    });

    it("should fail if not the creator", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the match creator can change visibility");
    });

    it("should fail on a finished match", async () => {
      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Terminer le match
      await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot change visibility of a finished match");
    });

    it("should fail without is_private boolean", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("is_private must be a boolean");
    });

    it("should fail with invalid is_private value", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: "yes" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("is_private must be a boolean");
    });

    it("should fail for non-existent match", async () => {
      const res = await request(app)
        .patch("/api/matches/XXXX/visibility")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .send({ is_private: true });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/matches/:id/end", () => {
    let matchId: string;

    beforeEach(async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      matchId = matchRes.body.id;
    });

    it("should end a match", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.match_over).toBe(true);
      expect(res.body.is_open).toBe(false);
    });

    it("should fail if not the creator", async () => {
      // User2 rejoint d'abord
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      const res = await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Only the match creator can end the match");
    });

    it("should fail to end an already ended match", async () => {
      // Terminer une première fois
      await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Essayer de terminer à nouveau
      const res = await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match is already over");
    });

    it("should fail for non-existent match", async () => {
      const res = await request(app)
        .post("/api/matches/XXXX/end")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post(`/api/matches/${matchId}/end`);

      expect(res.status).toBe(401);
    });
  });

  describe("Match flow scenarios", () => {
    it("should handle complete match lifecycle", async () => {
      // 1. Créer un match avec 2 sets
      const createRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 2 });

      expect(createRes.status).toBe(201);
      const matchId = createRes.body.id;

      // 2. Le match apparaît dans discover
      let discoverRes = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(1);

      // 3. User2 rejoint
      const joinRes = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(joinRes.body.participantIds.length).toBe(2);

      // 4. User3 rejoint aussi
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      // 5. Démarrer le match
      const startRes = await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(startRes.body.is_open).toBe(false);

      // 6. Le match n'apparaît plus dans discover
      discoverRes = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(0);

      // 7. Jouer le premier set
      const set1Res = await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(set1Res.body.current_set).toBe(2);
      expect(set1Res.body.match_over).toBe(false);

      // 8. Jouer le deuxième set (dépasse set=2)
      const set2Res = await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(set2Res.body.current_set).toBe(3);
      expect(set2Res.body.match_over).toBe(true);

      // 9. Le match est terminé
      const finalRes = await request(app)
        .get(`/api/matches/${matchId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(finalRes.body.match_over).toBe(true);
    });

    it("should handle private match discovery", async () => {
      // Créer un match privé
      const createRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      const matchId = createRes.body.id;

      // Le match n'apparaît pas dans discover
      const discoverRes = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(0);

      // Mais on peut y accéder via l'ID
      const getRes = await request(app)
        .get(`/api/matches/${matchId}`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(matchId);

      // Et on peut rejoindre via l'ID
      const joinRes = await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(joinRes.status).toBe(200);
    });

    it("should handle visibility changes", async () => {
      // Créer un match public
      const createRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      const matchId = createRes.body.id;

      // Visible dans discover
      let discoverRes = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(1);

      // Passer en privé
      await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: true });

      // Plus visible dans discover
      discoverRes = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(0);

      // Repasser en public
      await request(app)
        .patch(`/api/matches/${matchId}/visibility`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ is_private: false });

      // À nouveau visible dans discover
      discoverRes = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);
      expect(discoverRes.body.length).toBe(1);
    });

    it("should handle early match termination", async () => {
      // Créer un match avec 5 sets
      const createRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ set: 5 });

      const matchId = createRes.body.id;

      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Démarrer
      await request(app)
        .post(`/api/matches/${matchId}/start`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Jouer un set
      await request(app)
        .post(`/api/matches/${matchId}/next-set`)
        .set("Authorization", `Bearer ${user1Token}`);

      // Terminer prématurément (current_set = 2, set = 5)
      const endRes = await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(endRes.status).toBe(200);
      expect(endRes.body.current_set).toBe(2);
      expect(endRes.body.set).toBe(5);
      expect(endRes.body.match_over).toBe(true);
    });
  });

  describe("PATCH /api/matches/:id/score", () => {
    let matchId: string;

    beforeEach(async () => {
      // Créer un match
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      matchId = matchRes.body.id;

      // User2 rejoint
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);
    });

    it("should increment score by 1 (default)", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment" });

      expect(res.status).toBe(200);
      expect(res.body.oldScore).toBe(0);
      expect(res.body.newScore).toBe(1);
      expect(res.body.participantId).toBe(user1Id);
    });

    it("should increment score by custom amount", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment", amount: 5 });

      expect(res.status).toBe(200);
      expect(res.body.oldScore).toBe(0);
      expect(res.body.newScore).toBe(5);
    });

    it("should decrement score by 1 (default)", async () => {
      // D'abord incrémenter
      await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment", amount: 3 });

      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "decrement" });

      expect(res.status).toBe(200);
      expect(res.body.oldScore).toBe(3);
      expect(res.body.newScore).toBe(2);
    });

    it("should decrement score by custom amount", async () => {
      // D'abord incrémenter
      await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment", amount: 10 });

      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "decrement", amount: 3 });

      expect(res.status).toBe(200);
      expect(res.body.oldScore).toBe(10);
      expect(res.body.newScore).toBe(7);
    });

    it("should not go below 0 when decrementing", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "decrement", amount: 5 });

      expect(res.status).toBe(200);
      expect(res.body.oldScore).toBe(0);
      expect(res.body.newScore).toBe(0);
    });

    it("should allow each participant to update their own score", async () => {
      // User1 met à jour son score
      const res1 = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment", amount: 2 });

      expect(res1.body.newScore).toBe(2);
      expect(res1.body.participantId).toBe(user1Id);

      // User2 met à jour son score
      const res2 = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ action: "increment", amount: 3 });

      expect(res2.body.newScore).toBe(3);
      expect(res2.body.participantId).toBe(user2Id);
    });

    it("should fail if not a participant", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user3Token}`)
        .send({ action: "increment" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("You are not a participant in this match");
    });

    it("should fail on a finished match", async () => {
      // Terminer le match
      await request(app)
        .post(`/api/matches/${matchId}/end`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Match is already over");
    });

    it("should fail with invalid action", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Action must be 'increment' or 'decrement'");
    });

    it("should fail with invalid amount", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment", amount: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Amount must be a positive number");
    });

    it("should fail with zero amount", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment", amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Amount must be a positive number");
    });

    it("should fail for non-existent match", async () => {
      const res = await request(app)
        .patch("/api/matches/XXXX/score")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ action: "increment" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Match not found");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .patch(`/api/matches/${matchId}/score`)
        .send({ action: "increment" });

      expect(res.status).toBe(401);
    });
  });

  describe("Edge cases", () => {
    it("should generate unique 4-character match IDs", async () => {
      const ids: string[] = [];

      // Créer plusieurs matchs
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/matches")
          .set("Authorization", `Bearer ${user1Token}`)
          .send({});

        expect(res.body.id.length).toBe(4);
        expect(ids).not.toContain(res.body.id);
        ids.push(res.body.id);
      }
    });

    it("should handle multiple players joining", async () => {
      const matchRes = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const matchId = matchRes.body.id;

      // User2 et User3 rejoignent
      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user2Token}`);

      await request(app)
        .post(`/api/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${user3Token}`);

      const res = await request(app)
        .get(`/api/matches/${matchId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.body.participantIds.length).toBe(3);
      expect(res.body.participantIds).toContain(user1Id);
      expect(res.body.participantIds).toContain(user2Id);
      expect(res.body.participantIds).toContain(user3Id);
    });

    it("should order discovered matches by creation date DESC", async () => {
      // Créer 3 matchs publics
      const match1 = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const match2 = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const match3 = await request(app)
        .post("/api/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});

      const res = await request(app)
        .get("/api/matches/discover")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.body.length).toBe(3);
      // Plus récent en premier
      expect(res.body[0].id).toBe(match3.body.id);
      expect(res.body[1].id).toBe(match2.body.id);
      expect(res.body[2].id).toBe(match1.body.id);
    });
  });
});
