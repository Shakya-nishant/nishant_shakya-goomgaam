import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdOutlineEmail, MdLockOutline } from "react-icons/md";
import "../css/SLF.css";
import logo from "../../assets/GoomGaam Logo 2.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      if (res.data.profilePic) {
        localStorage.setItem("profilePic", res.data.profilePic);
      } else {
        localStorage.removeItem("profilePic");
      }
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <img src={logo} alt="GoomGaam Logo" className="logo" />
        <h2>Welcome Back</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleLogin}>
    
          <div className="input-icon-wrap">
            <span className="input-icon"><MdOutlineEmail /></span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

        
          <div className="password-box">
            <div className="input-icon-wrap">
              <span className="input-icon"><MdLockOutline /></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "42px" }}
                required
              />
            </div>
            <span
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          <button type="submit">Login</button>
        </form>

        <p className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;