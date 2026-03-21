import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Profile.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBolt,
  FaCloudSun,
  FaEdit,
  FaSignOutAlt,
  FaComments,
  FaBookmark,
} from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    rewardPoints: 0,
    totalPosts: 0,
    totalPhotos: 0,
    leaderboardRank: 0,
  });
  const [showDashboardCard, setShowDashboardCard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  const [sendingSOS, setSendingSOS] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const token = localStorage.getItem("token");

        // User info
        const resUser = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(resUser.data);

        // Reward stats
        const resStats = await axios.get(
          "http://localhost:5000/api/reward/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStats(resStats.data);

        // Leaderboard
        const resLeaderboard = await axios.get(
          "http://localhost:5000/api/reward/leaderboard",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setLeaderboard(resLeaderboard.data);
        setFilteredLeaderboard(resLeaderboard.data.slice(0, 10)); // top 10
      } catch (error) {
        console.error("Failed to load profile or stats", error);
      }
    };

    fetchProfileAndStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("profilePic");
    navigate("/login");
  };

  const handleDashboardClick = () => {
    setShowDashboardCard(!showDashboardCard);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const filtered = leaderboard.filter((u) =>
      u.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredLeaderboard(filtered.slice(0, 10)); // always top 10
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
            <h2>{stats.rewardPoints}</h2>
          </div>

          <ul className="menu">
            <li className="active" onClick={handleDashboardClick}>
              <FaUser className="icon" /> Dashboard
            </li>
            <li>
              <FaEdit className="icon" /> My Treks
            </li>
            <li>
              <FaBookmark className="icon" /> Saved Treks
            </li>
            <li>
              <FaComments className="icon" /> Community
            </li>
          </ul>

          <button
            className="btn sos"
            disabled={sendingSOS} // disables button while sending
            onClick={async () => {
              if (!navigator.geolocation) {
                alert("Geolocation not supported");
                return;
              }

              setSendingSOS(true); // start sending

              navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

                try {
                  const token = localStorage.getItem("token");
                  const res = await axios.post(
                    "http://localhost:5000/api/sos",
                    { location: locationLink },
                    { headers: { Authorization: `Bearer ${token}` } },
                  );
                  alert(res.data.message); // show success message
                } catch (err) {
                  console.error(err);
                  alert("Failed to send SOS. Check console for error.");
                } finally {
                  setSendingSOS(false); // finished sending
                }
              });
            }}
          >
            <FaBolt className="icon" /> {sendingSOS ? "Sending..." : "SOS"}
          </button>

          <button
            className="btn edit"
            onClick={() => navigate("/edit-profile")}
          >
            <FaEdit className="icon" /> Edit Profile
          </button>

          <button className="btn logout" onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> Logout
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
              <strong>Emergency Email:</strong> {user.emergencyEmail}
            </p>
            <p>
              <strong>Joined On:</strong>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="stats">
            <div className="stat-card">
              <p>Total Posts</p>
              <h2>{stats.totalPosts}</h2>
            </div>

            <div className="stat-card">
              <p>Photos Shared</p>
              <h2>{stats.totalPhotos}</h2>
            </div>

            <div className="stat-card">
              <p>Leaderboard Rank</p>
              <h2>#{stats.leaderboardRank}</h2>
            </div>
          </div>

          {/* Dashboard card */}
          {showDashboardCard && (
            <div className="dashboard-card">
              <h3>Top Users</h3>
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={handleSearch}
                className="user-search"
              />
              <div className="leaderboard-grid">
                {filteredLeaderboard.map((u) => (
                  <div
                    key={u.userId}
                    className="leaderboard-item"
                    onClick={() => navigate(`/profile/${u.userId}`)}
                  >
                    <img
                      src={
                        u.profilePic
                          ? `http://localhost:5000${u.profilePic}`
                          : "https://via.placeholder.com/50"
                      }
                      alt={u.name}
                      className="leaderboard-avatar"
                    />
                    <span className="leaderboard-name">{u.name}</span>
                    <span className="leaderboard-points">{u.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
};

export default Profile;
