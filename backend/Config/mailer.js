const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SOS_EMAIL,
    pass: process.env.SOS_EMAIL_PASS, // ← MUST be a 16-char App Password
  },
  // Very helpful for debugging – you will see detailed logs in terminal
  debug: true,
  logger: true,
});

// Test connection when server starts (you should see success or clear error)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP Connection FAILED:", error);
  } else {
    console.log("✅ Gmail SMTP Connected Successfully");
  }
});

// Function to send SOS email
const sendSOSMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"SOS Alert – GoomGaam" <${process.env.SOS_EMAIL}>`, // better looking sender name
    to,
    subject,
    html,
    // Optional: replyTo if you want replies to go somewhere else
    // replyTo: "support@yourdomain.com",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ SOS email sent successfully → Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Failed to send SOS email:");
    console.error(err);
    // Log the most useful parts
    if (err.response) {
      console.error("SMTP Response:", err.response);
    }
    throw err; // let the route catch it
  }
};

module.exports = sendSOSMail;