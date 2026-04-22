const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// ================= LOAD ENVIRONMENT FIRST =================
dotenv.config();

// ================= INITIALIZE APP =================
const app = express();

// ================= DATABASE =================
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
const authRoutes = require("./routes/auth");
const trekRoutes = require("./routes/trek");
const sosRoutes = require("./routes/sos");
const chatRoutes = require("./routes/chat");
const rewardRoutes = require("./routes/reward");
const reportRoutes = require("./routes/report");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notification");

app.use("/api/auth", authRoutes);
app.use("/api/treks", trekRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reward", rewardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= CREATE HTTP SERVER + SOCKET.IO =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in routes
app.set("io", io);

// ================= SOCKET.IO LOGIC =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ── USER PERSONAL ROOM — changed from "joinUser" to "join" ──
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("User joined personal room:", userId);
  });

  // ── JOIN CHAT ROOM ──
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const Message = require("./models/Message");
      const newMessage = new Message({
        chat: data.chatId,
        sender: data.senderId,
        text: data.text,
        readBy: [data.senderId],
      });
      await newMessage.save();
      const populatedMessage = await newMessage.populate(
        "sender",
        "name profilePic",
      );
      io.to(data.chatId).emit("receiveMessage", populatedMessage);

      // ── Emit newMessage to all chat participants' personal rooms ──
      const Chat = require("./models/Chat");
      const chat = await Chat.findById(data.chatId);
      if (chat) {
        chat.participants.forEach((participantId) => {
          if (participantId.toString() !== data.senderId.toString()) {
            io.to(participantId.toString()).emit(
              "newMessage",
              populatedMessage,
            );
          }
        });
      }
    } catch (error) {
      console.error("Error in sendMessage:", error.message);
      socket.emit("error", { message: "Failed to send message" });
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

if (process.env.NODE_ENV !== "test") {
  checkExpiredGroups();
  setInterval(checkExpiredGroups, 5 * 60 * 1000);
}

// ================= START SERVER =================

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

module.exports = app;
