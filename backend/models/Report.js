const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  trekId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trek",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "Fake Costing",
      "Inaccurate Location",
      "AI / fake image",
      "Fake Information",
      "Safety Hazard",
    ],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  handled: { type: Boolean, default: false },
});
module.exports = mongoose.model("Report", reportSchema);
