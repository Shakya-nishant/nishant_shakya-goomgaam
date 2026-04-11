const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  trekId: { type: String, required: true },
  userId: { type: String, required: true },
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
});

module.exports = mongoose.model("Report", reportSchema);