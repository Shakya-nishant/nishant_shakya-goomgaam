const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const ChatRequest = require("../models/ChatRequest");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const Notification = require("../models/Notification");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/", protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name profilePic email")
      .populate("admin", "name profilePic")
      .sort({ updatedAt: -1 });
    const chatsWithData = await Promise.all(
      chats.map(async (chat) => {
        const lastMsg = await Message.findOne({ chat: chat._id })
          .sort({ createdAt: -1 })
          .select("text createdAt sender");
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          readBy: { $nin: [req.user._id] },
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
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } },
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

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

router.post("/request", protect, async (req, res) => {
  try {
    const { to, chat, type = "private" } = req.body;

    if (to === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const existingRequest = await ChatRequest.findOne({
      $or: [
        { from: req.user._id, to: to },
        { from: to, to: req.user._id },
      ],
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          existingRequest.type === "group"
            ? "A group invite is already pending for this user"
            : "A chat request is already pending for this user",
      });
    }

    if (type === "group" && chat) {
      const group = await Chat.findById(chat);
      if (group && group.participants.some((id) => id.toString() === to)) {
        return res.status(400).json({ message: "User is already a member of this group" });
      }
    }

    const newRequest = await new ChatRequest({
      from: req.user._id,
      to,
      chat: chat || null,
      type,
    }).save();

    // ── get io FIRST before using it ──
    const io = req.app.get("io");

    await Notification.create({
      recipient: to,
      sender: req.user._id,
      type: "chat_request",
      message:
        type === "group"
          ? `sent you a group chat invite`
          : `sent you a chat request`,
    });

    // emit to recipient's personal room
    io.to(to.toString()).emit("newNotification");
    io.to(to.toString()).emit("newChatRequest");

    res.status(201).json({
      message: type === "group" ? "Group invite sent" : "Chat request sent",
      request: newRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/requests", protect, async (req, res) => {
  try {
    const requests = await ChatRequest.find({
      to: req.user._id,
      status: "pending",
    })
      .populate("from", "name profilePic")
      .populate("chat", "name photo");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/request/:requestId", protect, async (req, res) => {
  try {
    const request = await ChatRequest.findById(req.params.requestId);
    if (!request || request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status } = req.body;

    if (status === "accepted") {
      if (request.type === "group" && request.chat) {
        await Chat.findByIdAndUpdate(request.chat, {
          $addToSet: { participants: request.to },
        });
      } else {
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

      request.status = "accepted";
      await request.save();

    } else if (status === "rejected") {
      // ── Delete the request from DB entirely on rejection ──
      await ChatRequest.findByIdAndDelete(request._id);
    }

    const io = req.app.get("io");
    io.to(request.from.toString()).emit("requestUpdated");
    io.to(request.to.toString()).emit("requestUpdated");

    res.json({ message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/group", protect, upload.single("photo"), async (req, res) => {
  try {
    const {
      name,
      description,
      type = "normal",
      planningDate,
      planningLocation,
      members,
    } = req.body;
    if (!name)
      return res.status(400).json({ message: "Group name is required" });
    const memberIds = members ? JSON.parse(members) : [];
    if (!memberIds.includes(req.user._id.toString())) {
      memberIds.push(req.user._id);
    }
    const newGroup = new Chat({
      isGroup: true,
      name,
      description: description || "",
      type,
      admin: req.user._id,
      participants: memberIds,
      photo: req.file ? `/uploads/${req.file.filename}` : undefined,
    });
    if (type === "planning") {
      if (planningDate) {
        newGroup.planningDate = new Date(planningDate);
        newGroup.expiresAt = new Date(planningDate);
      }
      if (planningLocation) newGroup.planningLocation = planningLocation;
      newGroup.planningEditCount = 0;
    }
    await newGroup.save();
    const populated = await Chat.findById(newGroup._id)
      .populate("participants", "name profilePic")
      .populate("admin", "name profilePic");
    const io = req.app.get("io");
    memberIds.forEach((id) => {
      if (id.toString() !== req.user._id.toString()) {
        io.to(id.toString()).emit("newChatRequest");
      }
    });
    res.status(201).json({ message: "Group created", chat: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put(
  "/group/:chatId",
  protect,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { name, description, planningDate, planningLocation } = req.body;
      const chat = await Chat.findById(req.params.chatId);
      if (!chat || !chat.isGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (chat.admin.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Only admin can edit the group" });
      }
      if (name) chat.name = name;
      if (description !== undefined) chat.description = description;
      if (req.file) {
        chat.photo = `/uploads/${req.file.filename}`;
      }
      if (chat.type === "planning") {
        let isPlanningUpdated = false;
        if (planningDate) {
          chat.planningDate = new Date(planningDate);
          chat.expiresAt = new Date(planningDate);
          isPlanningUpdated = true;
        }
        if (planningLocation !== undefined) {
          chat.planningLocation = planningLocation;
          isPlanningUpdated = true;
        }
        if (isPlanningUpdated) {
          if ((chat.planningEditCount || 0) >= 5) {
            // changed to 5
            return res.status(400).json({
              message: "Maximum 5 edits reached for planning details.",
            });
          }
          chat.planningEditCount = (chat.planningEditCount || 0) + 1;
        }
      }
      await chat.save();
      const updatedChat = await Chat.findById(chat._id)
        .populate("participants", "name profilePic email")
        .populate("admin", "name profilePic");
      res.json({
        message: "Group updated successfully",
        chat: updatedChat,
        planningEditCount: chat.planningEditCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
);

router.get("/unread", protect, async (req, res) => {
  try {
    const now = new Date();
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name profilePic email")
      .populate("admin", "name profilePic")
      .sort({ updatedAt: -1 });
    const activeChats = chats.filter((chat) => {
      if (chat.type === "planning" && chat.expiresAt) {
        return chat.expiresAt > now;
      }
      return true;
    });
    const unreadList = await Promise.all(
      activeChats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          readBy: { $nin: [req.user._id] }, // ✅ FIXED
        });
        if (unreadCount > 0) {
          const lastMsg = await Message.findOne({ chat: chat._id })
            .sort({ createdAt: -1 })
            .populate("sender", "name profilePic")
            .select("text createdAt sender");
          return {
            ...chat.toObject(),
            unreadCount,
            lastMessage: lastMsg || null,
          };
        }
        return null;
      }),
    );
    const filteredUnread = unreadList.filter((item) => item !== null);
    res.json(filteredUnread);
  } catch (error) {
    console.error("Error fetching unread chats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/message/:id", protect, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    msg.text = req.body.text;
    msg.updatedAt = new Date();
    await msg.save();
    const populatedMsg = await Message.findById(msg._id).populate(
      "sender",
      "name profilePic",
    );
    res.json(populatedMsg);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/message/:id", protect, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    msg.text = "This message was unsent";
    msg.isDeleted = true;
    await msg.save();
    const io = req.app.get("io");
    io.to(msg.chat.toString()).emit("messageDeleted", {
      messageId: msg._id,
    });

    res.json({ message: "Message unsent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:chatId/participants", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate("participants", "name profilePic email")
      .populate("admin", "name profilePic");
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(chat.participants);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:chatId/message", protect, async (req, res) => {
  try {
    const { text } = req.body;
    const chatId = req.params.chatId;
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      text,
      readBy: [req.user._id],
    });
    await message.save();
    await Chat.findByIdAndUpdate(chatId, {
      updatedAt: new Date(),
    });
    const populatedMsg = await Message.findById(message._id).populate(
      "sender",
      "name profilePic",
    );
    const io = req.app.get("io");
    chat.participants.forEach((userId) => {
      if (userId.toString() !== req.user._id.toString()) {
        io.to(userId.toString()).emit("newMessage", populatedMsg);
      }
    });
    res.status(201).json(populatedMsg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:chatId/read", protect, async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user._id;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        readBy: { $nin: [userId] },
      },
      {
        $addToSet: { readBy: userId },
      },
    );
    const io = req.app.get("io");
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== userId.toString()) {
        io.to(participantId.toString()).emit("messagesRead", {
          chatId: chatId,
        });
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

router.get("/request/status/:targetUserId", protect, async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const existing = await ChatRequest.findOne({
      $or: [
        { from: req.user._id, to: targetUserId },
        { from: targetUserId, to: req.user._id },
      ],
    });
    res.json({ requestExists: !!existing });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:chatId/members/:userId", protect, async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (chat.admin.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only group admin can remove members" });
    }
    if (userId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Admin cannot remove themselves" });
    }
    chat.participants = chat.participants.filter(
      (id) => id.toString() !== userId,
    );
    await chat.save();
    await ChatRequest.deleteMany({
      from: req.user._id,
      to: userId,
      chat: chatId,
      type: "group",
      status: "pending",
    });
    const io = req.app.get("io");
    io.to(userId).emit("removedFromGroup", { chatId });
    res.json({
      message: "Member removed successfully",
      participants: chat.participants,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/group/:chatId", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (chat.admin.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only group admin can delete the group" });
    }
    await Message.deleteMany({ chat: chat._id });
    await chat.deleteOne();
    const io = req.app.get("io");
    chat.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit("groupDeleted", {
        chatId: chat._id,
        groupName: chat.name,
      });
    });
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/chat-status/:userId", protect, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const existingChat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, targetUserId] },
    });
    const existingRequest = await ChatRequest.findOne({
      $or: [
        { from: req.user._id, to: targetUserId },
        { from: targetUserId, to: req.user._id },
      ],
      status: "pending",
    });
    res.json({
      hasChat: !!existingChat,
      hasPendingRequest: !!existingRequest,
      requestType: existingRequest ? existingRequest.type : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
