const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");
const path = require("path");
const rewardRoutes = require("./routes/reward");

dotenv.config();

const app = express();

// ================= DATABASE =================
connectDB();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FOLDER =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
const authRoutes = require("./routes/auth");
const trekRoutes = require("./routes/trek");

// Other imports
const sosRoutes = require("./routes/sos");
app.use("/api/sos", sosRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/treks", trekRoutes);
app.use("/api/reward", rewardRoutes);
// ================= SERVER =================
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});