const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

// GET all notifications for current user
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name profilePic")
      .populate("trekId", "title photos")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET unread count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// MARK all as read
router.put("/mark-read", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// MARK single as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE single notification
router.delete("/:id", protect, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;