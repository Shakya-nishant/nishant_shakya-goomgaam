const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

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

router.post("/signup", upload.single("profilePic"), async (req, res) => {
  const { name, email, phone, emergencyEmail, password, confirmPassword } =
    req.body;

  try {
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      emergencyEmail,
      password: hashedPassword,
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

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

/* ================= UPDATE PROFILE ================= */
router.put("/update-profile", upload.single("profilePic"), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      name,
      email,
      phone,
      emergencyEmail,
      oldPassword,
      password,
      confirmPassword,
    } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (emergencyEmail) user.emergencyEmail = emergencyEmail;

    if (password || confirmPassword) {
      if (!oldPassword)
        return res.status(400).json({ message: "Old password is required" });

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Old password is incorrect" });

      if (password !== confirmPassword)
        return res.status(400).json({
          message: "New password and confirm password do not match",
        });

      user.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
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

/* ================= VERIFY EMAIL ================= */
router.post("/verify-email", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email not found" });

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
    if (!user) return res.status(400).json({ message: "Email not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ADMIN ================= */

router.get("/all-users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

router.delete("/delete-user/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

router.put("/update-role/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  user.role = req.body.role;
  await user.save();
  res.json({ message: "Role updated" });
});

router.put("/update-user/:id", async (req, res) => {
  try {
    const { name, email, phone, emergencyEmail, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (emergencyEmail !== undefined) user.emergencyEmail = emergencyEmail;
    if (role !== undefined) user.role = role;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
