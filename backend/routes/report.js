const express = require("express");
const router = express.Router();
const Trek = require("../models/Trek");
const Report = require("../models/Report"); 
const { protect } = require("../middleware/authMiddleware");

router.post("/:trekId", protect, async (req, res) => {
  const { trekId } = req.params;
  const { type } = req.body;
  const userId = req.user._id;
  try {
    const trek = await Trek.findById(trekId);
    if (!trek) return res.status(404).json({ message: "Trek not found" });
    const report = new Report({ trekId, userId, type });
    await report.save();
    res.status(200).json({ message: "Report submitted successfully", report });
  } catch (err) {
    console.error("Report error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;