const { request, app, createUser, getToken } = require("./helpers");
const Trek = require("../models/Trek");

jest.mock("../Config/mailer", () => jest.fn().mockResolvedValue(true));

let admin, token;

beforeEach(async () => {
  admin = await createUser({ email: "admin@test.com", role: "admin" });
  token = getToken(admin);
  const mockEmit = jest.fn();
  app.set("io", {
    to: jest.fn().mockReturnValue({ emit: mockEmit }),
    emit: mockEmit,
  });
});

describe("GET /api/admin/analytics/users", () => {
  it("returns user growth data", async () => {
    const res = await request(app)
      .get("/api/admin/analytics/users?period=monthly")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("DELETE /api/admin/delete-trek/:trekId", () => {
  it("deletes a trek as admin", async () => {
    const user = await createUser({ email: "u@u.com" });
    const trek = await Trek.create({
      user: user._id,
      title: "Bad Post",
      description: "flagged",
      province: "Koshi Province",
      district: "Taplejung",
    });

    const res = await request(app)
      .delete(`/api/admin/delete-trek/${trek._id}`)
      .set("Authorization", `Bearer ${token}`);

if (res.status !== 200) console.error("DELETE body:", JSON.stringify(res.body), res.status);
console.error("FULL RESPONSE:", JSON.stringify({ status: res.status, body: res.body, text: res.text }));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Trek deleted successfully");

    const deletedTrek = await Trek.findById(trek._id);
    expect(deletedTrek).toBeNull();
  });

  it("returns 404 for non-existent trek", async () => {
    const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const res = await request(app)
      .delete(`/api/admin/delete-trek/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 404) console.error("404 test body:", JSON.stringify(res.body));

    expect(res.status).toBe(404);
  });
});

describe("POST /api/admin/warning/:trekId", () => {
  it("sends warning email and creates notification", async () => {
    const user = await createUser({ email: "warned@test.com" });
    const trek = await Trek.create({
      user: user._id,
      title: "Flagged Trek",
      description: "reported",
      province: "Koshi Province",
      district: "Taplejung",
    });

    const res = await request(app)
      .post(`/api/admin/warning/${trek._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    if (res.status !== 200) console.error("WARNING body:", JSON.stringify(res.body));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Warning email sent successfully");
  });
});