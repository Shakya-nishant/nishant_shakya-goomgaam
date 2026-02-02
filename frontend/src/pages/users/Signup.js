import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import logo from "../../assets/GoomGaam Logo.png";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyWhatsapp: "",
    password: "",
    confirmPassword: "",
  });

  const [profilePic, setProfilePic] = useState(null); // new state for profile picture
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Password validations
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password do not match");
      return;
    }

    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("emergencyWhatsapp", form.emergencyWhatsapp);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      formData.append("role", "user"); // default role
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await axios.post(
        "http://localhost:5000/api/auth/signup",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      // Optionally save profilePic URL to localStorage for Navbar
      if (res.data.user?.profilePic) {
        localStorage.setItem("profilePic", res.data.user.profilePic);
      }

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="GoomGaam Logo" className="logo" />

      <h2>Signup</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSignup}>
        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
        />
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          onChange={handleChange}
          required
        />
        <input
          name="emergencyWhatsapp"
          placeholder="Emergency WhatsApp"
          onChange={handleChange}
          required
        />

        {/* File input for profile picture */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePic(e.target.files[0])}
        />

        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <span
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <div className="password-box">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
            required
          />
          <span
            className="eye-btn"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button type="submit">Signup</button>
      </form>

      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}

export default Signup;
