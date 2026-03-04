const express = require("express");
const router = express.Router();
const Trek = require("../models/Trek");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../Config/upload"); // ✅ use central upload config

// ================= SHARE TREK =================
router.post(
  "/share",
  protect,
  upload.array("photos", 5),
  async (req, res) => {
    try {
      const {
        title,
        description,
        travelCost,
        foodCost,
        hotelCost,
        difficulty,
        locationTags,
        travelTips,
        climateWarning,
        weatherDescription,
        routePoints,
      } = req.body;

      const parsedRoute = routePoints
        ? JSON.parse(routePoints).map((p) => ({
            lat: p[0],
            lng: p[1],
          }))
        : [];

      const photoPaths = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];

      const trek = await Trek.create({
        user: req.user._id,
        title,
        description,
        travelCost,
        foodCost,
        hotelCost,
        difficulty,
        locationTags,
        travelTips,
        climateWarning,
        weatherDescription,
        routePoints: parsedRoute,
        photos: photoPaths,
      });

      res.status(201).json({
        message: "Trek shared successfully",
        trek,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================= GET ALL TREKS =================
router.get("/all", async (req, res) => {
  try {
    const treks = await Trek.find()
      .populate("user", "name profilePic") // 🔥 show uploader info
      .sort({ createdAt: -1 });

    res.json(treks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET SINGLE TREK =================
router.get("/:id", async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id).populate(
      "user",
      "name profilePic"
    );

    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    res.json(trek);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE TREK =================
router.delete("/:id", protect, async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);

    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    // Only owner can delete
    if (trek.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await trek.deleteOne();

    res.json({ message: "Trek deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;