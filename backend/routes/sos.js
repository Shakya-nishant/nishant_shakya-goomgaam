const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SOS = require("../models/SOS");
const sendSOSMail = require("../Config/mailer");

router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }
    const sos = await SOS.create({
      user: user._id,
      emergencyEmail: user.emergencyEmail,
      location,
    });
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #d9534f; text-align: center;">🚨 Emergency SOS Alert</h2>
          <p>Dear Concerned Contact,</p>
          <p>
            This is to formally inform you that an emergency SOS alert has been triggered. 
            Immediate attention and appropriate action are strongly advised.
          </p>
          <hr style="margin: 20px 0;">
          <p><strong>User Name:</strong> ${user.name}</p>
          <p><strong>Phone Number:</strong> ${user.phone || "N/A"}</p>
          <p>
            <strong>Location:</strong> 
            <a href="${location}" style="color: #0275d8;">View on Map</a>
          </p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${location}" 
               style="background-color: #d9534f; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               View Live Location
            </a>
          </div>
          <p>
            Please respond immediately and ensure the safety of the individual.
          </p>
          <p style="margin-top: 30px;">
            Regards,<br>
            <strong>Your Safety Monitoring System</strong>
          </p>
        </div>
      </div>
    `;
    res.status(200).json({
      message: "SOS triggered successfully",
    });
    sendSOSMail({
      to: user.emergencyEmail,
      subject: "🚨 Emergency SOS Alert",
      html,
    })
      .then(async (result) => {
        sos.emailSent = result;
        await sos.save();
        console.log("✅ Email sent in background");
      })
      .catch((err) => {
        console.error("❌ Email failed:", err.message);
      });
  } catch (error) {
    console.error("❌ SOS error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
