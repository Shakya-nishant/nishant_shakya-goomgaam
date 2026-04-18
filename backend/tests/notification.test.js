const { request, app, createUser, getToken } = require("./helpers");
const Notification = require("../models/Notification");

let user, token;

beforeEach(async () => {
  user = await createUser();
  token = getToken(user);
});

describe("GET /api/notifications", () => {
  it("returns notifications for current user", async () => {
    await Notification.create({
      recipient: user._id,
      type: "like",
      message: "someone liked your post",
    });
    const res = await request(app)
      .get("/api/notifications")               // ← fixed (was /api/notification)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe("PUT /api/notifications/mark-read", () => {
  it("marks all notifications as read", async () => {
    await Notification.create({
      recipient: user._id,
      type: "comment",
      message: "msg",
      isRead: false,
    });
    const res = await request(app)
      .put("/api/notifications/mark-read")     // ← fixed
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns correct unread count", async () => {
    await Notification.create([
      { recipient: user._id, type: "like",    message: "a", isRead: false },
      { recipient: user._id, type: "comment", message: "b", isRead: false },
    ]);
    const res = await request(app)
      .get("/api/notifications/unread-count")  // ← fixed
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });
});