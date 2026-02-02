const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ================= SIGNUP ================= */
router.post("/signup", upload.single("profilePic"), async (req, res) => {
  const {
    name,
    email,
    phone,
    emergencyWhatsapp,
    password,
    confirmPassword,
    role,
  } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      emergencyWhatsapp,
      password: hashedPassword,
      role: role || "user",
      profilePic: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await user.save();

    res.status(201).json({
      message: "Signup successful",
      user: {
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      profilePic: user.profilePic,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET LOGGED IN USER PROFILE ================= */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

/* ================= VERIFY EMAIL FOR PASSWORD RESET ================= */
router.post("/verify-email", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    res.json({ message: "Email verified" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
