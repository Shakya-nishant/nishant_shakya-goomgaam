const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["like", "comment", "chat_request", "warning"],
    required: true,
  },
  trekId: { type: mongoose.Schema.Types.ObjectId, ref: "Trek" },
  trekTitle: { type: String },
  message: { type: String },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);