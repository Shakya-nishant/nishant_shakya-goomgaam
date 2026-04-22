const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String },
    photo: { type: String },
    description: { type: String },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["normal", "planning"], default: "normal" },
    planningDate: { type: Date },
    planningLocation: { type: String },
    expiresAt: { type: Date },
    planningEditCount: { type: Number, default: 0 },
    lastPlanningEditAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
