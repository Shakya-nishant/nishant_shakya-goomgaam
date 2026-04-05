// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Routes
const rewardRoutes = require("./routes/reward");
const authRoutes = require("./routes/auth");
const trekRoutes = require("./routes/trek");
const sosRoutes = require("./routes/sos");
const chatRoutes = require("./routes/chat"); // Make sure this file exists
const Message = require("./models/Message");

// Load environment variables
dotenv.config();

const app = express();

// ================= DATABASE =================
connectDB();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/treks", trekRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/reward", rewardRoutes);
app.use("/api/chat", chatRoutes);

// ================= CREATE HTTP SERVER + SOCKET.IO =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Change to "http://localhost:3000" in production
    methods: ["GET", "POST"],
  },
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const Message = require("./models/Message");

      const newMessage = new Message({
        chat: data.chatId,
        sender: data.senderId,
        text: data.text,
        isRead: [data.senderId],
      });

      await newMessage.save();

      const populatedMessage = await newMessage.populate(
        "sender",
        "name profilePic",
      );

      io.to(data.chatId).emit("receiveMessage", populatedMessage);
    } catch (error) {
      console.error("Error in sendMessage:", error.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("messageEdited", async (msg) => {
    try {
      const fullMsg = await Message.findById(msg._id).populate(
        "sender",
        "name profilePic",
      );

      io.to(msg.chat).emit("messageEdited", fullMsg);
    } catch (err) {
      console.error("Edit socket error:", err.message);
    }
  });

  socket.on("messageDeleted", async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId).populate(
        "sender",
        "name profilePic",
      );

      io.to(msg.chat).emit("messageDeleted", {
        messageId: msg._id,
      });
    } catch (err) {
      console.error("Delete socket error:", err.message);
    }
  });

  socket.on("markAsRead", async ({ chatId, userId }) => {
    try {
      const Message = require("./models/Message");
      await Message.updateMany(
        { chat: chatId, sender: { $ne: userId }, isRead: { $ne: userId } },
        { $addToSet: { isRead: userId } },
      );
      io.to(chatId).emit("messagesRead", { chatId, userId });
    } catch (error) {
      console.error("Error in markAsRead:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ================= EXPIRED PLANNING GROUPS CLEANUP =================
const Chat = require("./models/Chat");

const checkExpiredGroups = async () => {
  try {
    const now = new Date();
    const result = await Chat.updateMany(
      {
        isGroup: true,
        type: "planning",
        expiresAt: { $lt: now },
        isActive: { $ne: false },
      },
      { isActive: false },
    );

    if (result.modifiedCount > 0) {
      console.log(`Disabled ${result.modifiedCount} expired planning group(s)`);
    }
  } catch (err) {
    console.error("Error checking expired groups:", err.message);
  }
};

// Run immediately once on startup, then every 5 minutes (better than every 1 min)
checkExpiredGroups();
setInterval(checkExpiredGroups, 5 * 60 * 1000); // 5 minutes

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
