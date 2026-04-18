process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongo;

beforeAll(async () => {
  // Disconnect from real DB first (connected when server.js was imported)
  await mongoose.disconnect();

  // Start in-memory DB
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});