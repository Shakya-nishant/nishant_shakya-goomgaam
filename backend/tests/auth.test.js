const { request, app, createUser, getToken } = require("./helpers");

jest.mock("../Config/mailer");

describe("POST /api/auth/signup", () => {
  it("creates a new user successfully", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "John",
      email: "john@example.com",
      phone: "9800000001",
      emergencyEmail: "em@example.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("john@example.com");
  });

  it("rejects mismatched passwords", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "John", email: "a@b.com", phone: "123",
      emergencyEmail: "e@e.com", password: "abc", confirmPassword: "xyz",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Passwords do not match");
  });

  it("rejects duplicate email", async () => {
    await createUser({ email: "dup@example.com" });
    const res = await request(app).post("/api/auth/signup").send({
      name: "Jane", email: "dup@example.com", phone: "999",
      emergencyEmail: "e@e.com", password: "pass", confirmPassword: "pass",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns token on valid credentials", async () => {
    await createUser({ email: "login@test.com" });
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com", password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("rejects wrong password", async () => {
    await createUser({ email: "bad@test.com" });
    const res = await request(app).post("/api/auth/login").send({
      email: "bad@test.com", password: "wrongpass",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns user profile with valid token", async () => {
    const user = await createUser();
    const token = getToken(user);
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });

  it("rejects missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/verify-email", () => {
  it("verifies a known email", async () => {
    await createUser({ email: "v@v.com" });
    const res = await request(app).post("/api/auth/verify-email").send({ email: "v@v.com" });
    expect(res.status).toBe(200);
  });

  it("rejects unknown email", async () => {
    const res = await request(app).post("/api/auth/verify-email").send({ email: "nope@x.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("resets password for known email", async () => {
    await createUser({ email: "r@r.com" });
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "r@r.com", newPassword: "newpass999",
    });
    expect(res.status).toBe(200);
  });
});