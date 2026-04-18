const mongoose = require("mongoose");

// models/Report.js — change trekId to ObjectId for consistency
const reportSchema = new mongoose.Schema({
  trekId: { 
    type: mongoose.Schema.Types.ObjectId,  // ← was String, caused updateMany mismatch
    ref: "Trek",
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId,  // ← same fix
    ref: "User",
    required: true 
  },
  type: {
    type: String,
    enum: [
      "Fake Costing",
      "Inaccurate Location",
      "AI / fake image",
      "Fake Information",
      "Safety Hazard"
    ],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  handled: { type: Boolean, default: false },
});
module.exports = mongoose.model("Report", reportSchema);