const mongoose = require("mongoose");

const sosSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emergencyEmail: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  message: { type: String, default: "SOS triggered!" },
  sentAt: { type: Date, default: Date.now },
  emailSent: { type: Boolean, default: false },
});

module.exports = mongoose.model("SOS", sosSchema);
