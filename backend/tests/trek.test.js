const { request, app, createUser, getToken } = require("./helpers");
const Trek = require("../models/Trek");

let user, token;

beforeEach(async () => {
  user = await createUser();
  token = getToken(user);
  app.set("io", { to: () => ({ emit: jest.fn() }) });
});

const createTrek = async (overrides = {}) => {
  return await Trek.create({
    user: user._id,
    title: "Test Trek",
    description: "A test trek description",
    province: "Koshi Province",
    district: "Taplejung",
    difficulty: "Easy",
    ...overrides,
  });
};

describe("POST /api/treks/share", () => {
  it("creates a trek with valid data", async () => {
    const res = await request(app)
      .post("/api/treks/share")           // ← fixed
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Everest Base Camp")
      .field("description", "A great trek!")
      .field("difficulty", "Hard")
      .field("province", "Koshi Province")
      .field("district", "Solukhumbu")
      .field("days", "10")
      .field("nights", "9");
    expect(res.status).toBe(201);
    expect(res.body.trek.title).toBe("Everest Base Camp");
  });

  it("blocks unauthenticated access", async () => {
    const res = await request(app).post("/api/treks/share").send({ title: "X" }); // ← fixed
    expect(res.status).toBe(401);
  });
});

describe("GET /api/treks/all", () => {
  it("returns all treks", async () => {
    await createTrek();
    const res = await request(app).get("/api/treks/all");  // ← fixed
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("PUT /api/treks/like/:id", () => {
  it("toggles like on a trek", async () => {
    const trek = await createTrek();
    const res = await request(app)
      .put(`/api/treks/like/${trek._id}`)  // ← fixed
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("likes");
  });
});

describe("POST /api/treks/comment/:id", () => {
  it("adds a comment", async () => {
    const trek = await createTrek();
    const res = await request(app)
      .post(`/api/treks/comment/${trek._id}`)  // ← fixed
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Amazing post!" });
    expect(res.status).toBe(200);
    expect(res.body[0].text).toBe("Amazing post!");
  });
});

describe("DELETE /api/treks/:id", () => {
  it("allows owner to delete their trek", async () => {
    const trek = await createTrek();
    const res = await request(app)
      .delete(`/api/treks/${trek._id}`)  // ← fixed
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("blocks deletion by non-owner", async () => {
    const otherUser = await createUser({ email: "other@test.com" });
    const trek = await createTrek({ user: otherUser._id });
    const res = await request(app)
      .delete(`/api/treks/${trek._id}`)  // ← fixed
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});