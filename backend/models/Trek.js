const mongoose = require("mongoose");

const trekSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, required: true },

    travelCost: { type: Number, default: 0 },
    foodCost: { type: Number, default: 0 },
    hotelCost: { type: Number, default: 0 },

    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Hard"],
    },

    locationTags: { type: String },
    travelTips: { type: String },

    days: { type: Number, min: 1, default: 1 },
    nights: { type: Number, min: 0, default: 0 },
    province: { type: String, default: "" },
    district: { type: String, default: "" },
    provinceCode: { type: String }, // e.g., "P1"

    routePoints: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    ],

    photos: {
      type: [String], // store image paths
      validate: [arrayLimit, "{PATH} exceeds the limit of 5 photos"],
    },
  },
  { timestamps: true },
);

// Validator for max 5 photos
function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model("Trek", trekSchema);
