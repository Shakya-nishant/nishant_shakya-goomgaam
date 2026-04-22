import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdOutlineEmail, MdLockOutline } from "react-icons/md";
import "../css/SLF.css";
import logo from "../../assets/GoomGaam Logo 2.png";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Step 1: Verify Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/auth/verify-email", { email });
      setEmailVerified(true);
      setMessage("Email verified! Enter your new password below.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        newPassword,
      });
      setMessage("Password updated successfully! You can now login.");
      setEmailVerified(false);
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <img src={logo} alt="GoomGaam Logo" className="logo" />
        <h2>Forgot Password</h2>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        {!emailVerified ? (
          <form onSubmit={handleVerifyEmail}>
            <div className="input-icon-wrap">
              <span className="input-icon"><MdOutlineEmail /></span>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit">Verify Email</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            {/* New Password */}
            <div className="password-box">
              <div className="input-icon-wrap">
                <span className="input-icon"><MdLockOutline /></span>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: "42px" }}
                  required
                />
              </div>
              <span className="eye-btn" onClick={() => setShowNew(!showNew)}>
                {showNew ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>

            {/* Confirm Password */}
            <div className="password-box">
              <div className="input-icon-wrap">
                <span className="input-icon"><MdLockOutline /></span>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: "42px" }}
                  required
                />
              </div>
              <span className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>

            <button type="submit">Reset Password</button>
          </form>
        )}

        <p>
          Remembered your password? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgetPassword;