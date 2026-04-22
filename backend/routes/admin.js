const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Trek = require("../models/Trek");
const Report = require("../models/Report");
const sendSOSMail = require("../Config/mailer");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

router.get("/analytics/users", protect, async (req, res) => {
  const { period = "monthly" } = req.query;
  try {
    let groupStage;
    let sortStage;
    let limit = 12;

    if (period === "weekly") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      };
      sortStage = { $sort: { _id: 1 } };
    } else if (period === "monthly") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      };
      sortStage = { $sort: { _id: 1 } };
    } else if (period === "yearly") {
      groupStage = {
        $group: {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 },
        },
      };
      sortStage = { $sort: { _id: 1 } };
    }

    const usersTrend = await User.aggregate([
      { $match: { createdAt: { $exists: true } } },
      groupStage,
      sortStage,
      { $limit: limit },
    ]);

    const formatted = usersTrend.map((item) => ({
      label: item._id,
      count: item.count,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Users analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/groups", protect, async (req, res) => {
  const { type = "All" } = req.query;
  try {
    let filter = { isGroup: true };
    if (type !== "All") {
      filter.type = type;
    }
    const groups = await Chat.find(filter)
      .populate("admin", "name profilePic")
      .populate("participants", "name")
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    console.error("Groups analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/posts", protect, async (req, res) => {
  const { period = "weekly" } = req.query;
  try {
    const totalPosts = await Trek.countDocuments();
    let groupStage;

    if (period === "weekly") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      };
    } else if (period === "monthly") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      };
    } else {
      groupStage = {
        $group: {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 },
        },
      };
    }

    const trendData = await Trek.aggregate([groupStage, { $sort: { _id: 1 } }]);
    const formattedTrend = trendData.map((item) => ({
      label: item._id,
      count: item.count,
    }));

    const topLiked = await Trek.aggregate([
      { $addFields: { likesCount: { $size: "$likes" } } },
      { $sort: { likesCount: -1 } },
      { $limit: 5 },
    ]);
    await Trek.populate(topLiked, { path: "user", select: "name profilePic" });

    const topCommented = await Trek.aggregate([
      { $addFields: { commentsCount: { $size: "$comments" } } },
      { $sort: { commentsCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          province: 1,
          district: 1,
          createdAt: 1,
          comments: 1,
          likes: 1,
          photos: 1,
          user: 1,
        },
      },
    ]);
    await Trek.populate(topCommented, {
      path: "user",
      select: "name profilePic",
    });

    res.json({ totalPosts, trend: formattedTrend, topLiked, topCommented });
  } catch (error) {
    console.error("Posts analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/reports", protect, async (req, res) => {
  const { type = "All" } = req.query;
  try {
    let filter = {};
    if (type !== "All") filter.type = type;

    const reports = await Report.find(filter)
      .populate({
        path: "trekId",
        model: "Trek",
        populate: { path: "user", select: "name profilePic" },
        select: "title province district createdAt photos user",
      })
      .sort({ createdAt: -1 });

    const countMap = {};
    reports.forEach((r) => {
      const id = r.trekId?._id?.toString();
      if (id) countMap[id] = (countMap[id] || 0) + 1;
    });

    const seen = new Set();
    const deduplicated = reports
      .filter((r) => {
        const id = r.trekId?._id?.toString();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((r) => ({
        ...r.toObject(),
        reportCount: countMap[r.trekId?._id?.toString()] || 1,
      }));

    res.json(deduplicated);
  } catch (error) {
    console.error("Reports analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/delete-trek/:trekId", protect, async (req, res) => {
  console.log("DELETE TREK ROUTE HIT, trekId:", req.params.trekId);
  const { trekId } = req.params;
  const { reportId } = req.body || {};

  try {
    if (!mongoose.Types.ObjectId.isValid(trekId)) {
      return res.status(404).json({ message: "Trek not found" });
    }

    const trek = await Trek.findById(trekId).lean();
    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    await Trek.findByIdAndDelete(trekId);

    try {
      if (reportId && mongoose.Types.ObjectId.isValid(reportId)) {
        await Report.findByIdAndUpdate(reportId, { $set: { handled: true } });
      }
      await Report.updateMany(
        { trekId: new mongoose.Types.ObjectId(trekId) },
        { $set: { handled: true } },
      );
    } catch (cleanupErr) {
      console.warn("Report cleanup warning:", cleanupErr.message);
    }

    return res.status(200).json({ message: "Trek deleted successfully" });
  } catch (error) {
    console.error("Delete trek error:", error.message);
    console.error(error.stack);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
});

router.post("/warning/:trekId", protect, async (req, res) => {
  const { trekId } = req.params;
  const { reportId } = req.body;

  try {
    const trek = await Trek.findById(trekId).populate("user", "name email");
    if (!trek) {
      return res.status(404).json({ message: "Trek not found" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #d9534f;">⚠️ Warning: Your Trek Post</h2>
        <p>Dear ${trek.user.name},</p>
        <p>Your trek post titled <strong>"${trek.title}"</strong> has received one or more reports from the community.</p>
        <p><strong>Reason:</strong> Reported content may violate community guidelines.</p>
        <p>Please review and update your post if necessary. Repeated violations may lead to removal of the post.</p>
        <p>Thank you for helping keep GoomGaam a safe and trustworthy platform.</p>
        <p>Regards,<br><strong>GoomGaam Admin Team</strong></p>
      </div>
    `;

    await sendSOSMail({
      to: trek.user.email,
      subject: "⚠️ Warning Regarding Your Trek Post",
      html,
    });

    await Notification.create({
      recipient: trek.user._id,
      type: "warning",
      trekId: trek._id,
      trekTitle: trek.title,
      message: `Your post "${trek.title}" received a warning from admin due to community reports`,
    });

    const io = req.app.get("io");
    io.to(trek.user._id.toString()).emit("newNotification");

    if (reportId) {
      await Report.findByIdAndUpdate(reportId, { handled: true });
    }

    res.json({ message: "Warning email sent successfully" });
  } catch (error) {
    console.error("Send warning error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
