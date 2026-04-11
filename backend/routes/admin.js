const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");   // We'll add adminOnly later if needed
const User = require("../models/User");
const Chat = require("../models/Chat");
const Trek = require("../models/Trek");
const Report = require("../models/Report");
const sendSOSMail = require("../Config/mailer");   // Reuse your existing mailer
const Notification = require("../models/Notification");

// ====================== USERS GROWTH ======================
router.get("/analytics/users", protect, async (req, res) => {
  const { period = "monthly" } = req.query;

  try {
    let groupStage;
    let sortStage;
    let limit = 12; // reasonable limit

    const now = new Date();

    if (period === "weekly") {
      // Last 7 days (daily count)
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      };
      sortStage = { $sort: { "_id": 1 } };
    } 
    else if (period === "monthly") {
      // Last 12 months
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      };
      sortStage = { $sort: { "_id": 1 } };
    } 
    else if (period === "yearly") {
      // Group by year (last few years)
      groupStage = {
        $group: {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 }
        }
      };
      sortStage = { $sort: { "_id": 1 } };
    }

    const usersTrend = await User.aggregate([
      { $match: { createdAt: { $exists: true } } },
      groupStage,
      sortStage,
      { $limit: limit }
    ]);

    // Format for Recharts (label + count)
    const formatted = usersTrend.map(item => ({
      label: item._id,
      count: item.count
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Users analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== GROUP CHATS ======================
router.get("/analytics/groups", protect, async (req, res) => {
  const { type = "All" } = req.query;

  try {
    let filter = { isGroup: true };

    if (type !== "All") {
      filter.type = type;   // "normal" or "planning"
    }

    const groups = await Chat.find(filter)
      .populate("admin", "name profilePic")
      .populate("participants", "name")   // optional
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error("Groups analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== TOTAL POSTS & TREND ======================
router.get("/analytics/posts", protect, async (req, res) => {
  const { period = "weekly" } = req.query;
  try {
    const totalPosts = await Trek.countDocuments();

    let groupStage;
    if (period === "weekly") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      };
    } else if (period === "monthly") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      };
    } else {
      groupStage = {
        $group: {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 }
        }
      };
    }

    const trendData = await Trek.aggregate([
      groupStage,
      { $sort: { "_id": 1 } }
    ]);

    const formattedTrend = trendData.map(item => ({
      label: item._id,
      count: item.count
    }));

    // Top Liked
    const topLiked = await Trek.aggregate([
      { $addFields: { likesCount: { $size: "$likes" } } },
      { $sort: { likesCount: -1 } },
      { $limit: 5 }
    ]);
    await Trek.populate(topLiked, { path: "user", select: "name profilePic" });

    // Top Commented
    const topCommented = await Trek.aggregate([
      { $addFields: { commentsCount: { $size: "$comments" } } },
      { $sort: { commentsCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1, province: 1, district: 1,
          createdAt: 1, comments: 1, likes: 1,
          photos: 1, user: 1
        }
      }
    ]);
    await Trek.populate(topCommented, { path: "user", select: "name profilePic" });

    res.json({ totalPosts, trend: formattedTrend, topLiked, topCommented });

  } catch (error) {
    console.error("Posts analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== REPORTS ======================
// ====================== REPORTS (FIXED POPULATE) ======================
router.get("/analytics/reports", protect, async (req, res) => {
  const { type = "All" } = req.query;
  try {
    let filter = {};
    if (type !== "All") filter.type = type;

    const reports = await Report.find(filter)
      .populate({
        path: "trekId",
        model: "Trek",
        populate: { path: "user", select: "name profilePic" }, // ← added profilePic
        select: "title province district createdAt photos user"
      })
      .sort({ createdAt: -1 });

    // Group reports by trekId to get report count per post
    const countMap = {};
    reports.forEach((r) => {
      const id = r.trekId?._id?.toString();
      if (id) countMap[id] = (countMap[id] || 0) + 1;
    });

    // Deduplicate by trekId (show one card per trek)
    const seen = new Set();
    const deduplicated = reports.filter((r) => {
      const id = r.trekId?._id?.toString();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).map((r) => ({
      ...r.toObject(),
      reportCount: countMap[r.trekId?._id?.toString()] || 1,
    }));

    res.json(deduplicated);
  } catch (error) {
    console.error("Reports analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== DELETE TREK (ADMIN) ======================
router.delete("/delete-trek/:trekId", protect, async (req, res) => {
  const { trekId } = req.params;
  const { reportId } = req.body;
  try {
    const trek = await Trek.findById(trekId);
    if (!trek) return res.status(404).json({ message: "Trek not found" });

    await trek.deleteOne();

    // Mark related reports as handled
    if (reportId) {
      await Report.findByIdAndUpdate(reportId, { handled: true });
    }
    // Optionally mark all reports for this trek as handled
    await Report.updateMany({ trekId }, { handled: true });

    res.json({ message: "Trek deleted successfully" });
  } catch (error) {
    console.error("Delete trek error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== SEND WARNING ======================
router.post("/warning/:trekId", protect, async (req, res) => {
  const { trekId } = req.params;
  const { reportId } = req.body;   // optional

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

    // Send email using your existing mailer
    await sendSOSMail({
      to: trek.user.email,
      subject: "⚠️ Warning Regarding Your Trek Post",
      html,
    });

    // After sendSOSMail call:
await Notification.create({
  recipient: trek.user._id,
  type: "warning",
  trekId: trek._id,
  trekTitle: trek.title,
  message: `Your post "${trek.title}" received a warning from admin due to community reports`,
});

const io = req.app.get("io");
io.to(trek.user._id.toString()).emit("newNotification");

    // Optional: Mark report as handled (you can add a field later)
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