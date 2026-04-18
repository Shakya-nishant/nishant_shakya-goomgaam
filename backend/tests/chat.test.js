const { request, app, createUser, getToken } = require("./helpers");
const Chat = require("../models/Chat");

let userA, userB, tokenA, tokenB;

beforeEach(async () => {
  userA = await createUser({ email: "a@test.com" });
  userB = await createUser({ email: "b@test.com" });
  tokenA = getToken(userA);
  tokenB = getToken(userB);
  app.set("io", { to: () => ({ emit: jest.fn() }) });
});

describe("POST /api/chat/request", () => {
  it("sends a chat request from A to B", async () => {
    const res = await request(app)
      .post("/api/chat/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ to: userB._id.toString(), type: "private" });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Chat request sent");
  });

  it("rejects self-request", async () => {
    const res = await request(app)
      .post("/api/chat/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ to: userA._id.toString() });
    expect(res.status).toBe(400);
  });

  it("blocks duplicate pending requests", async () => {
    await request(app)
      .post("/api/chat/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ to: userB._id.toString() });
    const res = await request(app)
      .post("/api/chat/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ to: userB._id.toString() });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/chat/requests", () => {
  it("returns pending requests for user B", async () => {
    await request(app)
      .post("/api/chat/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ to: userB._id.toString() });
    const res = await request(app)
      .get("/api/chat/requests")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe("POST /api/chat/group", () => {
  it("creates a group chat", async () => {
    const res = await request(app)
      .post("/api/chat/group")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("name", "Trek Crew")
      .field("members", JSON.stringify([userB._id.toString()]));
    expect(res.status).toBe(201);
    expect(res.body.chat.name).toBe("Trek Crew");
  });
});