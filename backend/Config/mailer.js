const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SOS_EMAIL,
    pass: process.env.SOS_EMAIL_PASS,
  },
});

// send mail function
const sendSOSMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SOS_EMAIL,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("❌ Email error:", error.message);
    return false;
  }
};

module.exports = sendSOSMail;