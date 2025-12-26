const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");

dotenv.config();
const app = express();

// DB connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
