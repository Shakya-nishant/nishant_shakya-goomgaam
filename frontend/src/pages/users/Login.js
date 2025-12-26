import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import logo from "../../assets/GoomGaam Logo.png";

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
        password
      });

      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="GoomGaam Logo" className="logo" />

      <h2>Login</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <span
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
            title="Show / Hide Password"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button type="submit">Login</button>
      </form>

      <p>
        Don’t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
