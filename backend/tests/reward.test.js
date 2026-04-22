const { request, app, createUser, getToken } = require("./helpers");
const Trek = require("../models/Trek");

jest.setTimeout(15000); // leaderboard loops all users — give it time

let user, token;

beforeEach(async () => {
  user = await createUser();
  token = getToken(user);
});

describe("GET /api/reward/me", () => {
  it("returns reward points for current user", async () => {
    await Trek.create({
      user: user._id,
      title: "My Trek",
      description: "test",
      difficulty: "Hard",
      photos: ["/uploads/a.jpg"],
      province: "Koshi Province",  // ← added for consistency
      district: "Taplejung",
    });
    const res = await request(app)
      .get("/api/reward/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("rewardPoints");
    expect(res.body.rewardPoints).toBeGreaterThan(0);
  });

  it("returns zero points for user with no treks", async () => {
    const res = await request(app)
      .get("/api/reward/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rewardPoints).toBe(0);
    expect(res.body.totalPosts).toBe(0);
  });
});

describe("GET /api/reward/leaderboard", () => {
  it("returns a sorted leaderboard", async () => {
    const res = await request(app)
      .get("/api/reward/leaderboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("ranks higher-point users first", async () => {
    await Trek.create({
      user: user._id,
      title: "Hard Trek",
      description: "difficult",
      difficulty: "Hard",
      province: "Koshi Province",
      district: "Taplejung",
    });
    const res = await request(app)
      .get("/api/reward/leaderboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    // Verify sorted descending
    const points = res.body.map((u) => u.points);
    const sorted = [...points].sort((a, b) => b - a);
    expect(points).toEqual(sorted);
  });
});