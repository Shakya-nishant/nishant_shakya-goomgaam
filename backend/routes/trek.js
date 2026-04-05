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
  .populate("likes", "name profilePic") // ✅ ADD THIS
  .populate("comments.user", "name profilePic") // ✅ ADD THIS
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
      .populate("likes", "name profilePic") // ✅ ADD THIS
      .populate("comments.user", "name profilePic") // ✅ ADD THIS
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

// ================= UPDATE TREK =================
router.put("/update/:id", protect, upload.array("photos", 1), async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);
    if (!trek) return res.status(404).json({ message: "Trek not found" });
    if (trek.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    const {
      title, description, travelCost, foodCost, hotelCost,
      difficulty, locationTags, travelTips,
      routePoints, days, nights, province, district
    } = req.body;

    // Handle existing photos
let updatedPhotos = trek.photos;

// If frontend sends existingPhotos → keep them
if (req.body.existingPhotos) {
  updatedPhotos = Array.isArray(req.body.existingPhotos)
    ? req.body.existingPhotos
    : [req.body.existingPhotos];
}

// If new file uploaded → replace or add
if (req.files && req.files.length > 0) {
  updatedPhotos = req.files.map(file => `/uploads/${file.filename}`);
}

trek.photos = updatedPhotos;

    // === Text fields ===
    if (title) trek.title = title;
    if (description) trek.description = description;
    if (travelCost !== undefined) trek.travelCost = Number(travelCost) || 0;
    if (foodCost !== undefined) trek.foodCost = Number(foodCost) || 0;
    if (hotelCost !== undefined) trek.hotelCost = Number(hotelCost) || 0;
    if (difficulty) trek.difficulty = difficulty;
    if (locationTags !== undefined) trek.locationTags = locationTags;
    if (travelTips !== undefined) trek.travelTips = travelTips;

    if (routePoints) {
  try {
    const parsed = JSON.parse(routePoints);

    trek.routePoints = parsed.map(p =>
      Array.isArray(p)
        ? { lat: p[0], lng: p[1] }
        : { lat: p.lat, lng: p.lng }
    );

  } catch (err) {
    console.error("Route points parse error:", err);
  }
}

    // === Days / Nights ===
    if (days !== undefined) trek.days = Number(days) || trek.days;
    if (nights !== undefined) trek.nights = Number(nights) || trek.nights;

    // === Province & District ===
    if (province !== undefined) {
      trek.province = province;
      trek.provinceCode = provinceMapping[province] || trek.provinceCode;
    }
    if (district !== undefined) trek.district = district;

    await trek.save();

    res.json({ 
      message: "Trek updated successfully", 
      trek 
    });
  } catch (error) {
    console.error("Update trek error:", error);   // ← Check your server console!
    res.status(500).json({ 
      message: "Server error updating trek", 
      error: error.message 
    });
  }
});

router.put("/like/:id", protect, async (req, res) => {
  const trek = await Trek.findById(req.params.id);

  if (!trek) return res.status(404).json({ message: "Not found" });

  const alreadyLiked = trek.likes.includes(req.user._id);

  if (alreadyLiked) {
    trek.likes = trek.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    trek.likes.push(req.user._id);
  }

  await trek.save();
  res.json({ likes: trek.likes.length });
});

router.post("/comment/:id", protect, async (req, res) => {
  const trek = await Trek.findById(req.params.id);

  trek.comments.push({
    user: req.user._id,
    text: req.body.text,
  });

  await trek.save();

  const populated = await trek.populate("comments.user", "name profilePic");

  res.json(populated.comments);
});

router.put("/comment/:trekId/:commentId", protect, async (req, res) => {
  const trek = await Trek.findById(req.params.trekId);

  const comment = trek.comments.id(req.params.commentId);

  if (comment.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: "Not allowed" });
  }

  comment.text = req.body.text;
  await trek.save();

  res.json({ message: "Comment updated" });
});

router.delete("/comment/:trekId/:commentId", protect, async (req, res) => {
  const trek = await Trek.findById(req.params.trekId);

  const comment = trek.comments.id(req.params.commentId);

  if (comment.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: "Not allowed" });
  }

  comment.deleteOne();
  await trek.save();

  res.json({ message: "Deleted" });
});

router.put("/save/:id", protect, async (req, res) => {
  const trek = await Trek.findById(req.params.id);

  const alreadySaved = trek.saves.includes(req.user._id);

  if (alreadySaved) {
    trek.saves = trek.saves.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    trek.saves.push(req.user._id);
  }

  await trek.save();
  res.json({ saves: trek.saves.length });
});

module.exports = router;
