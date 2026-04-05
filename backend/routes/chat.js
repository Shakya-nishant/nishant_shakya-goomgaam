const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // ← Fixed path
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const ChatRequest = require("../models/ChatRequest");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");

// Multer config for group photo
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ====================== GET ALL CHATS ======================
router.get("/", protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name profilePic email")
      .populate("admin", "name")
      .sort({ updatedAt: -1 });

    const chatsWithData = await Promise.all(
      chats.map(async (chat) => {
        const lastMsg = await Message.findOne({ chat: chat._id })
          .sort({ createdAt: -1 })
          .select("text createdAt sender");

        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          isRead: { $ne: req.user._id },
        });

        return { ...chat.toObject(), lastMessage: lastMsg, unreadCount };
      }),
    );
    const now = new Date();

    const activeChats = chats.filter((chat) => {
      if (chat.type === "planning" && chat.expiresAt) {
        return chat.expiresAt > now;
      }
      return true;
    });

    res.json(chatsWithData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ====================== GET MESSAGES ======================
router.get("/:chatId/messages", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const messages = await Message.find({ chat: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "name profilePic");
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user._id },
        isRead: { $ne: req.user._id },
      },
      { $addToSet: { isRead: req.user._id } },
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== SEARCH USERS ======================
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    }).select("name profilePic email");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== SEND REQUEST ======================
router.post("/request", protect, async (req, res) => {
  try {
    const { to } = req.body;
    if (to === req.user._id.toString())
      return res.status(400).json({ message: "Cannot send to yourself" });

    const existing = await ChatRequest.findOne({
      $or: [
        { from: req.user._id, to },
        { from: to, to: req.user._id },
      ],
    });
    if (existing)
      return res.status(400).json({ message: "Request already exists" });

    await new ChatRequest({ from: req.user._id, to }).save();
    res.status(201).json({ message: "Request sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== GET REQUESTS ======================
router.get("/requests", protect, async (req, res) => {
  try {
    const requests = await ChatRequest.find({
      to: req.user._id,
      status: "pending",
    })
      .populate("from", "name profilePic")
      .populate("chat", "name photo"); // ✅ ADD THIS

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== ACCEPT/REJECT REQUEST ======================
router.put("/request/:requestId", protect, async (req, res) => {
  try {
    const request = await ChatRequest.findById(req.params.requestId);
    if (!request || request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = req.body.status;
    await request.save();

    if (req.body.status === "accepted") {
      // ✅ GROUP REQUEST
      if (request.type === "group" && request.chat) {
        await Chat.findByIdAndUpdate(request.chat, {
          $addToSet: { participants: request.to },
        });
      }

      // ✅ PRIVATE CHAT (keep your old logic)
      else {
        const existingChat = await Chat.findOne({
          isGroup: false,
          participants: { $all: [request.from, request.to] },
        });

        if (!existingChat) {
          await new Chat({
            isGroup: false,
            participants: [request.from, request.to],
          }).save();
        }
      }
    }
    res.json({ message: `Request ${req.body.status}` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ====================== CREATE GROUP ======================
router.post("/group", protect, upload.single("photo"), async (req, res) => {
  try {
    const { name, description, type, planningDate, members } = req.body;

    const memberIds = members ? JSON.parse(members) : [];

    // ✅ Only admin initially
    const group = new Chat({
      isGroup: true,
      name,
      description: description || "",
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      type: type || "normal",
      planningDate: type === "planning" ? new Date(planningDate) : null,
      expiresAt: type === "planning" ? new Date(planningDate) : null,
      participants: [req.user._id], // ✅ ONLY ADMIN
      admin: req.user._id,
      isActive: true,
    });

    await group.save();

    // ✅ Send request to each selected user
    for (const userId of memberIds) {
      await new ChatRequest({
        from: req.user._id,
        to: userId,
        chat: group._id, // 🔥 VERY IMPORTANT
        type: "group",
      }).save();
    }

    res.status(201).json({ message: "Group created & requests sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ====================== UNREAD CHATS ======================
router.get("/unread", protect, async (req, res) => {
  try {
    const now = new Date();

    // 1️⃣ Fetch chats where user is a participant
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name profilePic email")
      .populate("admin", "name");

    // 2️⃣ Filter out expired planning groups
    const activeChats = chats.filter((chat) => {
      if (chat.type === "planning" && chat.expiresAt) {
        return chat.expiresAt > now;
      }
      return true; // normal group or planning group without expiry
    });

    // 3️⃣ Map each chat to unread info
    const unreadList = await Promise.all(
      activeChats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          isRead: { $ne: req.user._id },
        });

        if (unreadCount > 0) {
          const lastMsg = await Message.findOne({ chat: chat._id })
            .sort({ createdAt: -1 })
            .populate("sender", "name profilePic") // include sender info
            .select("text createdAt sender");

          return {
            ...chat.toObject(),
            unreadCount,
            lastMessage: lastMsg,
          };
        } else {
          return null; // no unread messages, ignore
        }
      }),
    );

    // 4️⃣ Filter out nulls (chats with 0 unread)
    const filteredUnread = unreadList.filter((c) => c !== null);

    // 5️⃣ Send JSON response
    res.json(filteredUnread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/message/:id", protect, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);

    if (!msg) return res.status(404).json({ message: "Message not found" });

    // Only sender can edit
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    msg.text = req.body.text;
    msg.updatedAt = new Date();

    await msg.save();

    // 🔥 IMPORTANT: populate sender before sending
    const populatedMsg = await Message.findById(msg._id).populate(
      "sender",
      "name profilePic",
    );

    res.json(populatedMsg);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Replace your current delete route with this cleaner version:
router.delete("/message/:id", protect, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Mark as deleted instead of just changing text
    msg.text = "This message was unsent";
    msg.isDeleted = true;
    await msg.save();

    // Emit to all users in the chat
    const io = req.app.get("io"); // Make sure you passed io to app
    io.to(msg.chat.toString()).emit("messageDeleted", {
      messageId: msg._id,
    });

    res.json({ message: "Message unsent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
