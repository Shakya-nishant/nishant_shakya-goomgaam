const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createUser = async (overrides = {}) => {
  const defaults = {
    name: "Test User",
    email: "test@example.com",
    phone: "9800000000",
    emergencyEmail: "emergency@example.com",
    password: await bcrypt.hash("password123", 10),
    role: "user",
  };
  return await User.create({ ...defaults, ...overrides });
};

const getToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,   // ← uses your real .env secret, same as the app
    { expiresIn: "1d" }
  );

module.exports = { request, app, createUser, getToken };