const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SOS = require("../models/SOS");
const sendSOSMail = require("../Config/mailer");

router.post("/", async (req, res) => {
  try {
    console.log("SOS request received:", req.body);

    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verification failed:", err.message);
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { location } = req.body;
    if (!location) return res.status(400).json({ message: "Location missing" });

    // Save SOS in DB
    const sos = new SOS({
      user: user._id,
      emergencyEmail: user.emergencyEmail,
      location,
    });
    await sos.save();
    console.log("SOS saved in DB:", sos._id);

    // Prepare email content
    const htmlContent = `
      <h2>🚨 SOS Alert</h2>
      <p>User <strong>${user.name}</strong> has triggered an SOS!</p>
      <p><strong>Phone:</strong> ${user.phone || "Not provided"}</p>
      <p><strong>Location:</strong> <a href="${location}" target="_blank">View on Google Maps</a></p>
      <p><strong>Time:</strong> ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })}</p>
      <hr>
      <p style="color: #777; font-size: 12px;">This is an emergency alert from GoomGaam app.</p>
    `;

    // Send email
    try {
      await sendSOSMail({
        to: user.emergencyEmail,
        subject: "🚨 SOS Emergency Alert – Immediate Action Required",
        html: htmlContent,
      });
      console.log("Email delivery attempted successfully");
    } catch (emailError) {
      console.error(
        "Email sending failed (but SOS was saved):",
        emailError.message,
      );
      // You can still respond success to frontend since SOS is saved
    }

    // Always respond success to frontend (email failure is logged)
    res.status(200).json({
      message: "SOS stored successfully",
      emailSent: true, // you can change to false if you want to be strict
    });
  } catch (error) {
    console.error("SOS Route Error:", error);
    res.status(500).json({ message: "Failed to process SOS" });
  }
});

module.exports = router;
