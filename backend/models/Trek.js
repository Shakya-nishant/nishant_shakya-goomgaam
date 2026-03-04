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

    climateWarning: { type: Boolean, default: false },
    weatherDescription: { type: String },

    routePoints: [
      {
        lat: Number,
        lng: Number,
      },
    ],

    photos: [String], // store image path
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trek", trekSchema);