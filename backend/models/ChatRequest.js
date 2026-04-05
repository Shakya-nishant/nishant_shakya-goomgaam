const mongoose = require("mongoose");

const chatRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  type: { type: String, enum: ["private", "group"], default: "private" },

  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatRequest", chatRequestSchema);