import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../css/Profile.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBolt,
  FaEdit,
  FaSignOutAlt,
  FaComments,
  FaBookmark,
  FaHeart,
  FaRegComment,
  FaEllipsisV,
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

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
  const [showMyTreks, setShowMyTreks] = useState(false);
  const [myTreks, setMyTreks] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showLikes, setShowLikes] = useState(false);
  const [likesData, setLikesData] = useState([]);

  const [showComments, setShowComments] = useState(false);
  const [selectedTrek, setSelectedTrek] = useState(null);

  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedMapTrek, setSelectedMapTrek] = useState(null);
  const [showSavedTreks, setShowSavedTreks] = useState(false);
  const [savedTreks, setSavedTreks] = useState([]);
  const [showLikedTreks, setShowLikedTreks] = useState(false);
  const [likedTreks, setLikedTreks] = useState([]);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [activeReportTrekId, setActiveReportTrekId] = useState(null);

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
        setUserId(resUser.data._id);

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

        // Fetch user's treks
        const resTreks = await axios.get(
          `http://localhost:5000/api/treks/user/${resUser.data._id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMyTreks(resTreks.data);
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
    setShowSavedTreks(false);
    setShowLikedTreks(false);
    setShowMyTreks(false);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const filtered = leaderboard.filter((u) =>
      u.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredLeaderboard(filtered.slice(0, 10)); // always top 10
  };

  const handleMyTreksClick = () => {
    setShowMyTreks(!showMyTreks);
    setShowSavedTreks(false);
    setShowLikedTreks(false);
    setShowDashboardCard(false);
  };

  const handleLike = async (trekId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/treks/like/${trekId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Refresh all sections that might be open
      if (showMyTreks) {
        const res = await axios.get(
          `http://localhost:5000/api/treks/user/${userId}`,
        );
        setMyTreks(res.data);
      }

      if (showSavedTreks) {
        fetchSavedTreks();
      }

      if (showLikedTreks) {
        fetchLikedTreks();
      }
    } catch (err) {
      console.error("Error liking trek:", err);
      alert("Failed to like trek");
    }
  };

  const openComments = (trek) => {
    setSelectedTrek(trek);
    setShowComments(true);
  };

  const openLikes = (trek) => {
    setLikesData(trek.likes || []);
    setShowLikes(true);
  };

  const handleAddComment = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.post(
      `http://localhost:5000/api/treks/comment/${selectedTrek._id}`,
      { text: newComment },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setSelectedTrek({ ...selectedTrek, comments: res.data });
    setNewComment("");

    // refresh treks
    const updated = await axios.get(
      `http://localhost:5000/api/treks/user/${userId}`,
    );
    setMyTreks(updated.data);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/treks/comment/${selectedTrek._id}/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update the comment in the popup
      setSelectedTrek({
        ...selectedTrek,
        comments: selectedTrek.comments.filter((c) => c._id !== commentId),
      });

      // IMPORTANT: Refresh the main trek list to update comment count
      if (showMyTreks) {
        const res = await axios.get(
          `http://localhost:5000/api/treks/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMyTreks(res.data);
      }

      // Optional: Also refresh Saved and Liked if they are open
      if (showSavedTreks) {
        fetchSavedTreks();
      }
      if (showLikedTreks) {
        fetchLikedTreks();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handleReport = async (trekId, type) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/reports/${trekId}`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Report submitted successfully!");
      setActiveReportTrekId(null); // close menu after report
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    }
  };

  const handleEditComment = async (commentId) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/treks/comment/${selectedTrek._id}/${commentId}`,
      { text: editedText },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setSelectedTrek({
      ...selectedTrek,
      comments: selectedTrek.comments.map((c) =>
        c._id === commentId ? { ...c, text: editedText } : c,
      ),
    });

    setEditingCommentId(null);
  };

  const Routing = ({ points }) => {
    const map = useMap();
    const routingControlRef = useRef(null); // ← Add this

    useEffect(() => {
      if (!map || !points || points.length < 2) return;

      const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

      // Create the control
      const routingControl = L.Routing.control({
        waypoints,
        lineOptions: { styles: [{ color: "blue", weight: 4 }] },
        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false, // hide the sidebar instructions
      }).addTo(map);

      routingControlRef.current = routingControl; // save reference

      return () => {
        if (routingControlRef.current) {
          try {
            routingControlRef.current.getPlan()?.setWaypoints([]); // clear routes safely
            routingControlRef.current.remove(); // remove control properly
          } catch (err) {
            console.warn("Routing cleanup error:", err);
          }
          routingControlRef.current = null;
        }
      };
    }, [points, map]); // ← map + points as dependencies

    return null;
  };

  const MapResizer = () => {
    const map = useMap();

    useEffect(() => {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      return () => clearTimeout(timer);
    }, [map]);

    return null;
  };

  // Fetch saved treks
  const fetchSavedTreks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/treks/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (user) {
        const userSaved = res.data.filter((trek) =>
          trek.saves?.includes(user._id),
        );
        setSavedTreks(userSaved);
      }
    } catch (err) {
      console.error("Error fetching saved treks:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSavedTreks();
      fetchLikedTreks();
    }
  }, [user]);

  const handleSavedTreksClick = () => {
    setShowSavedTreks(!showSavedTreks);
    setShowMyTreks(false);
    setShowDashboardCard(false);
    setShowLikedTreks(false);

    if (!showSavedTreks) {
      fetchSavedTreks(); // ← Important: Fetch when opening
    }
  };

  // Add this inside your Profile component, along with handleLike
  const handleSave = async (trekId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/treks/save/${trekId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Refresh saved treks if section is open
      if (showSavedTreks) {
        fetchSavedTreks();
      }

      // Optional: refresh liked treks too in case it affects UI
      if (showLikedTreks) {
        fetchLikedTreks();
      }
    } catch (err) {
      console.error("Error saving trek:", err);
    }
  };

  const fetchLikedTreks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/treks/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (user) {
        const liked = res.data.filter((trek) =>
          trek.likes.some((u) => u._id === user._id),
        );
        setLikedTreks(liked);
      }
    } catch (err) {
      console.error("Error fetching liked treks:", err);
    }
  };

  const handleLikedTreksClick = () => {
    setShowLikedTreks(!showLikedTreks);
    setShowMyTreks(false);
    setShowSavedTreks(false);
    setShowDashboardCard(false);

    if (!showLikedTreks) {
      fetchLikedTreks();
    }
  };

  const handleDeleteTrek = async (trekId) => {
    if (!window.confirm("Delete this trek?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/treks/${trekId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove trek from state
      setMyTreks((prev) => prev.filter((t) => t._id !== trekId));

      // Fetch updated reward stats
      const resStats = await axios.get("http://localhost:5000/api/reward/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(resStats.data); // Update reward points immediately
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
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
            <li onClick={handleMyTreksClick}>
              <FaEdit className="icon" /> My Treks
            </li>
            <li onClick={handleSavedTreksClick}>
              <FaBookmark className="icon" /> Saved Treks
            </li>
            <li onClick={handleLikedTreksClick}>
              <FaHeart className="icon" /> Liked Treks
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
              <div className="dashboard-card-header">
                <h3>Top Trekers</h3>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="user-search"
                />
              </div>

              <div className="leaderboard-grid">
                {filteredLeaderboard.length === 0 ? (
                  <p className="no-results">No users found.</p>
                ) : (
                  filteredLeaderboard.map((u) => (
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
                      <div className="leaderboard-info">
                        <span className="leaderboard-name">{u.name}</span>
                        <span className="leaderboard-points">
                          {u.points} pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {showMyTreks && (
            <div className="saved-treks-container">
              <h2 className="saved-treks-header">My Treks</h2>

              {myTreks.length === 0 ? (
                <p>No treks shared yet.</p>
              ) : (
                myTreks.map((trek) => (
                  <div
                    className="saved-trek-card"
                    key={trek._id}
                    onClick={() => navigate(`/fullpost/${trek._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* User Info Row */}
                    <div className="trek-user-info">
                      <img
                        src={
                          user.profilePic
                            ? `http://localhost:5000${user.profilePic}`
                            : "https://via.placeholder.com/50"
                        }
                        alt={user.name}
                        className="user-pfp"
                      />
                      <span className="username">{user.name}</span>
                      <div
                        className="menu-wrapper"
                        style={{ position: "relative" }}
                      >
                        <FaEllipsisV
                          className="menu-icon"
                          onClick={(e) => {
                            e.stopPropagation(); // prevents parent clicks from triggering
                            setActiveReportTrekId((prev) =>
                              prev === trek._id ? null : trek._id,
                            );
                          }}
                          style={{ cursor: "pointer" }}
                        />

                        {activeReportTrekId === trek._id && (
                          <div className="report-card">
                            <p style={{ textAlign: "center" }}>
                              <b>Report Trek</b>
                            </p>
                            <ul>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Fake Costing");
                                }}
                              >
                                Fake Costing
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Inaccurate Location");
                                }}
                              >
                                Inaccurate Location
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "AI / fake image");
                                }}
                              >
                                AI / fake image
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Fake Information");
                                }}
                              >
                                Fake Information
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Safety Hazard");
                                }}
                              >
                                Safety Hazard
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Main Trek Content Box */}
                    <div className="trek-content-box">
                      <div className="trek-content">
                        {/* Left: Image (16:9) */}
                        <div className="trek-image">
                          {trek.photos?.length > 0 ? (
                            <img
                              src={`http://localhost:5000${trek.photos[0]}`}
                              alt="trek"
                            />
                          ) : (
                            <div className="no-image">No Image Available</div>
                          )}
                        </div>

                        {/* Right: Details */}
                        <div className="trek-details">
                          <h4 className="trek-title">{trek.title}</h4>
                          <p className="trek-description">{trek.description}</p>

                          <div className="trek-info-grid">
                            <span>
                              <strong>Difficulty:</strong> {trek.difficulty}
                            </span>
                            <span>
                              <strong>Location:</strong> {trek.locationTags}
                            </span>
                            <span>
                              <strong>Duration:</strong> {trek.days}D /{" "}
                              {trek.nights}N
                            </span>
                            <span>
                              <strong>Province:</strong> {trek.province}
                            </span>
                            <span>
                              <strong>Shared on:</strong>{" "}
                              {new Date(trek.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="card-actions">
                            <div className="action-item like-action">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation(); // ← ADD THIS
                                  handleLike(trek._id);
                                }}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <FaHeart
                                  style={{
                                    color: trek.likes?.some(
                                      (u) => u._id === userId,
                                    )
                                      ? "red"
                                      : "gray",
                                    fontSize: "20px",
                                  }}
                                />
                              </div>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation(); // ← ADD THIS
                                  openLikes(trek);
                                }}
                                style={{ cursor: "pointer", fontWeight: "500" }}
                              >
                                {trek.likes?.length || 0}
                              </span>
                            </div>

                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // ← ADD THIS
                                openComments(trek);
                              }}
                              className="action-item"
                            >
                              <FaRegComment style={{ fontSize: "20px" }} />
                              <span>{trek.comments?.length || 0}</span>
                            </div>

                            {/* No Save button for own treks */}
                          </div>

                          {/* Action Buttons - Edit, Delete, View Map */}
                          <div className="my-trek-buttons">
                            <button
                              className="view-map-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent parent div click
                                if (
                                  !trek.routePoints ||
                                  trek.routePoints.length < 2
                                ) {
                                  alert(
                                    "This trek doesn't have valid route points.",
                                  );
                                  return;
                                }
                                setSelectedMapTrek(trek);
                                setShowMap(true);
                              }}
                            >
                              View Map
                            </button>

                            <button
                              className="edit-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent parent div click
                                navigate(`/share-trek/${trek._id}`);
                              }}
                            >
                              Edit Trek
                            </button>

                            <button
                              className="delete-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent parent div click
                                handleDeleteTrek(trek._id);
                              }}
                            >
                              Delete Trek
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {showSavedTreks && (
            <div className="saved-treks-container">
              <h2 className="saved-treks-header">Saved Treks</h2>
              {savedTreks.length === 0 ? (
                <p>No saved treks yet.</p>
              ) : (
                savedTreks.map((trek) => (
                  <div
                    className="saved-trek-card"
                    key={trek._id}
                    onClick={() => navigate(`/fullpost/${trek._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* User Info Row */}
                    <div className="trek-user-info">
                      <img
                        src={
                          trek.user.profilePic
                            ? `http://localhost:5000${trek.user.profilePic}`
                            : "https://via.placeholder.com/50"
                        }
                        alt={trek.user.name}
                        className="user-pfp"
                      />
                      <span className="username">{trek.user.name}</span>
                      <div
                        className="menu-wrapper"
                        style={{ position: "relative" }}
                      >
                        <FaEllipsisV
                          className="menu-icon"
                          onClick={(e) => {
                            e.stopPropagation(); // prevents parent clicks from triggering
                            setActiveReportTrekId((prev) =>
                              prev === trek._id ? null : trek._id,
                            );
                          }}
                          style={{ cursor: "pointer" }}
                        />

                        {activeReportTrekId === trek._id && (
                          <div className="report-card">
                            <p style={{ textAlign: "center" }}>
                              <b>Report Trek</b>
                            </p>
                            <ul>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Fake Costing");
                                }}
                              >
                                Fake Costing
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Inaccurate Location");
                                }}
                              >
                                Inaccurate Location
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "AI / fake image");
                                }}
                              >
                                AI / fake image
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Fake Information");
                                }}
                              >
                                Fake Information
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Safety Hazard");
                                }}
                              >
                                Safety Hazard
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Main Trek Content Box */}
                    <div className="trek-content-box">
                      <div className="trek-content">
                        {/* Left: Image */}
                        <div className="trek-image">
                          {trek.photos?.length > 0 ? (
                            <img
                              src={`http://localhost:5000${trek.photos[0]}`}
                              alt="trek"
                            />
                          ) : (
                            <div className="no-image">No Image Available</div>
                          )}
                        </div>

                        {/* Right: Details */}
                        <div className="trek-details">
                          <h4 className="trek-title">{trek.title}</h4>
                          <p className="trek-description">{trek.description}</p>

                          <div className="trek-info-grid">
                            <span>
                              <strong>Difficulty:</strong> {trek.difficulty}
                            </span>
                            <span>
                              <strong>Location:</strong> {trek.locationTags}
                            </span>
                            <span>
                              <strong>Duration:</strong> {trek.days}D /{" "}
                              {trek.nights}N
                            </span>
                            <span>
                              <strong>Province:</strong> {trek.province}
                            </span>
                            <span>
                              <strong>Shared on:</strong>{" "}
                              {new Date(trek.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Actions - Like Counter is now clickable */}
                          <div className="card-actions">
                            <div className="action-item like-action">
                              {/* Heart Icon - Still only for liking */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation(); // ← ADD THIS
                                  handleLike(trek._id);
                                }}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <FaHeart
                                  style={{
                                    color: trek.likes?.some(
                                      (u) => u._id === userId,
                                    )
                                      ? "red"
                                      : "gray",
                                    fontSize: "20px",
                                  }}
                                />
                              </div>

                              {/* Like Count - Click to show who liked */}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation(); // ← ADD THIS
                                  openLikes(trek);
                                }}
                                style={{
                                  cursor: "pointer",
                                  fontWeight: "500",
                                  minWidth: "24px",
                                }}
                              >
                                {trek.likes?.length || 0}
                              </span>
                            </div>

                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // ← ADD THIS
                                openComments(trek);
                              }}
                              className="action-item"
                            >
                              <FaRegComment style={{ fontSize: "20px" }} />
                              <span>{trek.comments?.length || 0}</span>
                            </div>

                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // ← ADD THIS
                                handleSave(trek._id);
                              }}
                              className="action-item"
                            >
                              <FaBookmark
                                style={{
                                  color: trek.saves?.includes(userId)
                                    ? "gold"
                                    : "gray",
                                  fontSize: "20px",
                                }}
                              />
                            </div>
                          </div>

                          {/* View Map Button */}
                          <button
                            className="view-map-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent parent div click
                              if (
                                !trek.routePoints ||
                                trek.routePoints.length < 2
                              ) {
                                alert(
                                  "This trek doesn't have valid route points.",
                                );
                                return;
                              }
                              setSelectedMapTrek(trek);
                              setShowMap(true);
                            }}
                          >
                            View Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {showLikedTreks && (
            <div className="saved-treks-container">
              {" "}
              {/* Same container as Saved Treks */}
              <h2 className="saved-treks-header">Liked Treks</h2>
              {likedTreks.length === 0 ? (
                <p>No liked treks yet.</p>
              ) : (
                likedTreks.map((trek) => (
                  <div
                    className="saved-trek-card"
                    key={trek._id}
                    onClick={() => navigate(`/fullpost/${trek._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {" "}
                    {/* Same card class */}
                    {/* User Info Row */}
                    <div className="trek-user-info">
                      <img
                        src={
                          trek.user.profilePic
                            ? `http://localhost:5000${trek.user.profilePic}`
                            : "https://via.placeholder.com/50"
                        }
                        alt={trek.user.name}
                        className="user-pfp"
                      />
                      <span className="username">{trek.user.name}</span>
                      <div
                        className="menu-wrapper"
                        style={{ position: "relative" }}
                      >
                        <FaEllipsisV
                          className="menu-icon"
                          onClick={(e) => {
                            e.stopPropagation(); // prevents parent clicks from triggering
                            setActiveReportTrekId((prev) =>
                              prev === trek._id ? null : trek._id,
                            );
                          }}
                          style={{ cursor: "pointer" }}
                        />

                        {activeReportTrekId === trek._id && (
                          <div className="report-card">
                            <p style={{ textAlign: "center" }}>
                              <b>Report Trek</b>
                            </p>
                            <ul>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Fake Costing");
                                }}
                              >
                                Fake Costing
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Inaccurate Location");
                                }}
                              >
                                Inaccurate Location
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "AI / fake image");
                                }}
                              >
                                AI / fake image
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Fake Information");
                                }}
                              >
                                Fake Information
                              </li>
                              <li
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReport(trek._id, "Safety Hazard");
                                }}
                              >
                                Safety Hazard
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Main Content Box */}
                    <div className="trek-content-box">
                      <div className="trek-content">
                        {/* Left: Image (16:9) */}
                        <div className="trek-image">
                          {trek.photos?.length > 0 ? (
                            <img
                              src={`http://localhost:5000${trek.photos[0]}`}
                              alt="trek"
                            />
                          ) : (
                            <div className="no-image">No Image Available</div>
                          )}
                        </div>

                        {/* Right: Details */}
                        <div className="trek-details">
                          <h4 className="trek-title">{trek.title}</h4>
                          <p className="trek-description">{trek.description}</p>

                          <div className="trek-info-grid">
                            <span>
                              <strong>Difficulty:</strong> {trek.difficulty}
                            </span>
                            <span>
                              <strong>Location:</strong> {trek.locationTags}
                            </span>
                            <span>
                              <strong>Duration:</strong> {trek.days}D /{" "}
                              {trek.nights}N
                            </span>
                            <span>
                              <strong>Province:</strong> {trek.province}
                            </span>
                            <span>
                              <strong>Shared on:</strong>{" "}
                              {new Date(trek.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="card-actions">
                            <div className="action-item like-action">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation(); // ← ADD THIS
                                  handleLike(trek._id);
                                }}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <FaHeart
                                  style={{
                                    color: trek.likes?.some(
                                      (u) => u._id === userId,
                                    )
                                      ? "red"
                                      : "gray",
                                    fontSize: "20px",
                                  }}
                                />
                              </div>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation(); // ← ADD THIS
                                  openLikes(trek);
                                }}
                                style={{ cursor: "pointer", fontWeight: "500" }}
                              >
                                {trek.likes?.length || 0}
                              </span>
                            </div>

                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // ← ADD THIS
                                openComments(trek);
                              }}
                              className="action-item"
                            >
                              <FaRegComment style={{ fontSize: "20px" }} />
                              <span>{trek.comments?.length || 0}</span>
                            </div>

                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // ← ADD THIS
                                handleSave(trek._id);
                              }}
                              className="action-item"
                            >
                              <FaBookmark
                                style={{
                                  color: trek.saves?.includes(userId)
                                    ? "gold"
                                    : "gray",
                                  fontSize: "20px",
                                }}
                              />
                            </div>
                          </div>

                          {/* View Map Button */}
                          <button
                            className="view-map-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent parent div click
                              if (
                                !trek.routePoints ||
                                trek.routePoints.length < 2
                              ) {
                                alert(
                                  "This trek doesn't have valid route points.",
                                );
                                return;
                              }
                              setSelectedMapTrek(trek);
                              setShowMap(true);
                            }}
                          >
                            View Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* POPUPS */}

          {showLikes && (
            <div className="popup-overlay" onClick={() => setShowLikes(false)}>
              <div className="popup-card" onClick={(e) => e.stopPropagation()}>
                <h3>Liked by ({likesData.length})</h3>
                <div className="likes-list">
                  {likesData.length === 0 ? (
                    <p>No one has liked this trek yet.</p>
                  ) : (
                    likesData.map((liker) => (
                      <div key={liker._id} className="like-user">
                        <img
                          src={
                            liker?.profilePic
                              ? `http://localhost:5000${liker.profilePic}`
                              : "https://via.placeholder.com/40"
                          }
                          alt={liker?.name}
                        />
                        <span>{liker?.name || "Unknown User"}</span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  className="close-popup-btn"
                  onClick={() => setShowLikes(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showComments && selectedTrek && (
            <div
              className="popup-overlay"
              onClick={() => setShowComments(false)}
            >
              <div className="popup-card" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                  <h3>Comments ({selectedTrek.comments?.length || 0})</h3>
                  {/* <button className="close-popup-btn" onClick={() => setShowComments(false)}>
          ✕
        </button> */}
                </div>

                <div className="comment-list">
                  {selectedTrek.comments?.length === 0 ? (
                    <p className="no-comments">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    selectedTrek.comments.map((c) => (
                      <div key={c._id} className="comment-item">
                        <div className="comment-header">
                          <img
                            src={
                              c.user?.profilePic
                                ? `http://localhost:5000${c.user.profilePic}`
                                : "https://via.placeholder.com/40"
                            }
                            alt={c.user?.name}
                            className="comment-pfp"
                          />
                          <div className="comment-info">
                            <span className="comment-name">
                              {c.user?.name || "Unknown User"}
                            </span>
                            <span className="comment-time">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {c.user?._id === userId && (
                            <div className="comment-menu">
                              <button
                                onClick={() => {
                                  setEditingCommentId(c._id);
                                  setEditedText(c.text);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c._id)}
                                disabled={deletingCommentId === c._id}
                              >
                                {deletingCommentId === c._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === c._id ? (
                          <div className="edit-comment-box">
                            <input
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              autoFocus
                            />
                            <button onClick={() => handleEditComment(c._id)}>
                              Save
                            </button>
                            <button onClick={() => setEditingCommentId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="comment-text">{c.text}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="comment-input">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMap && selectedMapTrek && (
            <div className="map-modal">
              <div className="map-content">
                {/* HEADER */}
                <div className="map-header">
                  <h3>{selectedMapTrek.district || selectedMapTrek.title}</h3>
                  <button
                    className="close-btn"
                    onClick={() => setShowMap(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="map-divider"></div>

                {/* INNER MAP BOX */}
                <div className="map-inner-box">
                  <MapContainer
                    center={[
                      selectedMapTrek.routePoints[0].lat,
                      selectedMapTrek.routePoints[0].lng,
                    ]}
                    zoom={13}
                    className="map-view"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <Routing points={selectedMapTrek.routePoints} />

                    {/* Start Marker */}
                    <Marker
                      position={[
                        selectedMapTrek.routePoints[0].lat,
                        selectedMapTrek.routePoints[0].lng,
                      ]}
                    >
                      <Popup>Start</Popup>
                    </Marker>

                    {/* End Marker */}
                    <Marker
                      position={[
                        selectedMapTrek.routePoints[
                          selectedMapTrek.routePoints.length - 1
                        ].lat,
                        selectedMapTrek.routePoints[
                          selectedMapTrek.routePoints.length - 1
                        ].lng,
                      ]}
                    >
                      <Popup>End</Popup>
                    </Marker>

                    <MapResizer />
                  </MapContainer>
                </div>
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
