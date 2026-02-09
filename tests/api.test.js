const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../models/Client");
const redis = require("../services/redisClient");

describe("GateKeeper API", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
    await redis.quit();
  });

  describe("GET /", () => {
    it("returns health status", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: "ok" });
      expect(res.body.message).toContain("GateKeeper");
    });
  });

  describe("POST /register", () => {
    it("requires clientName and email", async () => {
      const res = await request(app).post("/register").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("clientName and email");
    });

    it("registers a client and returns clientId and apiKey", async () => {
      const res = await request(app)
        .post("/register")
        .send({ clientName: "Test App", email: "test@example.com" });
      expect(res.status).toBe(200);
      expect(res.body.clientId).toBeDefined();
      expect(res.body.apiKey).toBeDefined();
      expect(res.body.message).toBeDefined();
    });

    it("rejects duplicate email", async () => {
      await request(app)
        .post("/register")
        .send({ clientName: "Other", email: "dup@example.com" });
      const res = await request(app)
        .post("/register")
        .send({ clientName: "Other2", email: "dup@example.com" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already registered");
    });
  });

  describe("POST /check-limit (protected)", () => {
    let apiKey;

    beforeAll(async () => {
      const res = await request(app)
        .post("/register")
        .send({ clientName: "Limit Test", email: "limit@example.com" });
      apiKey = res.body.apiKey;
    });

    it("returns 401 without Authorization", async () => {
      const res = await request(app).post("/check-limit").send({ clientId: "any" });
      expect(res.status).toBe(401);
    });

    it("returns 200 with valid API key and returns limit info", async () => {
      const res = await request(app)
        .post("/check-limit")
        .set("Authorization", apiKey)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        allowed: true,
        limit: expect.any(Number),
        window: expect.any(Number),
      });
      expect(res.body.remaining).toBeDefined();
    });
  });

  describe("POST /set-limit (protected)", () => {
    let apiKey;
    let clientId;

    beforeAll(async () => {
      const res = await request(app)
        .post("/register")
        .send({ clientName: "Set Limit Test", email: "setlimit@example.com" });
      apiKey = res.body.apiKey;
      clientId = res.body.clientId;
    });

    it("returns 401 without Authorization", async () => {
      const res = await request(app)
        .post("/set-limit")
        .send({ clientId, limit: 20, window: 120 });
      expect(res.status).toBe(401);
    });

    it("returns 400 when clientId, limit or window missing", async () => {
      const res = await request(app)
        .post("/set-limit")
        .set("Authorization", apiKey)
        .send({ clientId });
      expect(res.status).toBe(400);
    });

    it("returns 200 and updates limit with valid API key", async () => {
      const res = await request(app)
        .post("/set-limit")
        .set("Authorization", apiKey)
        .send({ clientId, limit: 20, window: 120 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        message: "Limit updated",
        limit: 20,
        window: 120,
      });
    });
  });
});
