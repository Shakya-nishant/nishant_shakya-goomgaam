import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  MdOutlinePerson,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineContactMail,
  MdLockOutline,
  MdOutlineImage,
} from "react-icons/md";
import "../css/SLF.css";
import logo from "../../assets/GoomGaam Logo 2.png";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password do not match");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("emergencyEmail", form.emergencyEmail);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (res.data.user?.profilePic) {
        localStorage.setItem("profilePic", res.data.user.profilePic);
      }
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <img src={logo} alt="GoomGaam Logo" className="logo" />
        <h2>Create Account</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSignup}>
          <label className="input-label">Profile Picture</label>
          <label className="pfp-upload-block" htmlFor="pfp-input">
            <div className="pfp-preview">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" />
              ) : (
                <MdOutlineImage />
              )}
            </div>
            <div className="pfp-upload-text">
              <strong>{profilePic ? profilePic.name : "Choose a photo"}</strong>
              <span>
                {profilePic ? "Tap to change" : "JPG, PNG · optional"}
              </span>
            </div>
            <input
              id="pfp-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>

          <div className="input-icon-wrap">
            <span className="input-icon">
              <MdOutlinePerson />
            </span>
            <input
              name="name"
              placeholder="Full name"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-icon-wrap">
            <span className="input-icon">
              <MdOutlineEmail />
            </span>
            <input
              name="email"
              placeholder="Email address"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-icon-wrap">
            <span className="input-icon">
              <MdOutlinePhone />
            </span>
            <input
              name="phone"
              placeholder="Phone number"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-icon-wrap">
            <span className="input-icon">
              <MdOutlineContactMail />
            </span>
            <input
              name="emergencyEmail"
              placeholder="Emergency email"
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-divider">credentials</div>

          <div className="password-box">
            <div className="input-icon-wrap">
              <span className="input-icon">
                <MdLockOutline />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password (min. 8 chars)"
                onChange={handleChange}
                style={{ paddingRight: "42px" }}
                required
              />
            </div>
            <span
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="password-box">
            <div className="input-icon-wrap">
              <span className="input-icon">
                <MdLockOutline />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                onChange={handleChange}
                style={{ paddingRight: "42px" }}
                required
              />
            </div>
            <span
              className="eye-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit">Create Account</button>
        </form>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
