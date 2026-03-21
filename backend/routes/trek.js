const express = require("express");
const router = express.Router();
const Trek = require("../models/Trek");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../Config/upload");

// Map province to code
const provinceMapping = {
  "Koshi Province": "P1",
  "Madhesh Province": "P2",
  "Bagmati Province": "P3",
  "Gandaki Province": "P4",
  "Lumbini Province": "P5",
  "Karnali Province": "P6",
  "Sudurpashchim Province": "P7",
};

// ================= SHARE TREK =================
router.post("/share", protect, upload.array("photos", 5), async (req, res) => {
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
      routePoints,
      days,
      nights,
      province,
      district,
    } = req.body;

    // Parse route points if provided
    const parsedRoute = routePoints
      ? JSON.parse(routePoints).map((p) => ({
          lat: p[0],
          lng: p[1],
        }))
      : [];

    // Map uploaded photos
    const photoPaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    // Determine province code automatically
    const provinceCode = provinceMapping[province] || "";

    const trek = await Trek.create({
      user: req.user._id,
      title,
      description,
      travelCost: Number(travelCost) || 0,
      foodCost: Number(foodCost) || 0,
      hotelCost: Number(hotelCost) || 0,
      difficulty,
      locationTags,
      travelTips,
      routePoints: parsedRoute,
      photos: photoPaths,
      days: Number(days) || 1, // convert to number, default 1
      nights: Number(nights) || 0, // convert to number, default 0
      province: province || "",
      district: district || "",
      provinceCode,
    });

    res.status(201).json({
      message: "Trek shared successfully",
      trek,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET ALL TREKS =================
router.get("/all", async (req, res) => {
  try {
    const treks = await Trek.find()
      .populate("user", "name profilePic email phone")
      .sort({ createdAt: -1 });

    res.json(treks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET TREKS BY USER =================
router.get("/user/:userId", async (req, res) => {
  try {
    const treks = await Trek.find({ user: req.params.userId })
      .populate("user", "name email phone profilePic")
      .sort({ createdAt: -1 });

    res.json(treks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET SINGLE TREK =================
router.get("/:id", async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id).populate(
      "user",
      "name profilePic",
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
