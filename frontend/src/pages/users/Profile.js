import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data);
      } catch (error) {
        console.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("profilePic");
    navigate("/login");
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <>
      <Navbar />

      <div className="dashboard">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="profile-box">
            <img
              src={
                user.profilePic
                  ? `http://localhost:5000${user.profilePic}`
                  : "https://via.placeholder.com/100"
              }
              alt="User"
              className="profile-avatar"
            />
            <h3>{user.name}</h3>
            <p>{user.role === "admin" ? "Admin" : "Trek Explorer"}</p>
          </div>

          <div className="reward-card">
            <span>Reward Points</span>
            <h2>2,450</h2>
          </div>

          <ul className="menu">
            <li className="active">Dashboard</li>
            <li>My Treks</li>
            <li>Saved Treks</li>
            <li>Community</li>
          </ul>

          <button className="btn sos">🚨 SOS</button>
          <button className="btn weather">⛅ Weather Alert</button>

          <button
            className="btn edit"
            onClick={() => navigate("/edit-profile")}
          >
            ✏️ Edit Profile
          </button>

          {/* ✅ LOGOUT BUTTON */}
          <button className="btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        {/* CONTENT */}
        <main className="content">
          <div className="profile-details">
            <h3>Profile Information</h3>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Phone:</strong> {user.phone}
            </p>
            <p>
              <strong>Emergency WhatsApp:</strong> {user.emergencyWhatsapp}
            </p>
            <p>
              <strong>Joined On:</strong>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="stats">
            <div className="stat-card">
              <p>Total Treks</p>
              <h2>24</h2>
            </div>

            <div className="stat-card">
              <p>Distance Covered</p>
              <h2>
                186 <span>km</span>
              </h2>
            </div>

            <div className="stat-card">
              <p>Photos Shared</p>
              <h2>142</h2>
            </div>

            <div className="stat-card">
              <p>Leaderboard Rank</p>
              <h2>#7</h2>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
};

export default Profile;
