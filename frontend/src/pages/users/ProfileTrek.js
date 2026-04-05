import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../css/ProfileTrek.css";
import { FaHeart, FaRegComment, FaBookmark, FaEllipsisV } from "react-icons/fa";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

/* ===== SAFE ROUTING (NO CRASH) ===== */
const Routing = ({ points }) => {
  const map = useMap();
  const routingRef = React.useRef(null);

  useEffect(() => {
    if (!map) return;
    if (!points || points.length < 2) return;

    const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

    // 🔴 remove previous route safely
    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch {}
      routingRef.current = null;
    }

    // 🟢 create new route
    const instance = L.Routing.control({
      waypoints,
      lineOptions: { styles: [{ color: "blue", weight: 4 }] },
      createMarker: () => null,
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      show: false,
    });

    instance.addTo(map);
    routingRef.current = instance;

    // 🟢 SAFE CLEANUP (prevents removeLayer crash)
    return () => {
      if (!routingRef.current) return;

      try {
        routingRef.current.getPlan().setWaypoints([]); // ⭐ key fix
        map.removeControl(routingRef.current);
      } catch {}

      routingRef.current = null;
    };
  }, [points, map]);

  return null;
};

const ProfileTrek = () => {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [treks, setTreks] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [reward, setReward] = useState(null);
  const [selectedTrek, setSelectedTrek] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showLikes, setShowLikes] = useState(false);
  const [likesData, setLikesData] = useState([]);

  const [showComments, setShowComments] = useState(false);
  const [selectedCommentTrek, setSelectedCommentTrek] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState("");

  useEffect(() => {
    fetchUserTreks();
    fetchReward();
  }, []);

  const fetchUserTreks = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/treks/user/${userId}`,
      );
      setTreks(res.data);
      if (res.data.length > 0) setUser(res.data[0].user);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReward = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/reward/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReward(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // WEATHER
  const fetchWeather = async (lat, lon) => {
    try {
      const res = await axios.get(
        "https://api.openweathermap.org/data/2.5/weather",
        {
          params: {
            lat,
            lon,
            appid: "54ae666267f52c91603e09dde04400e6",
            units: "metric",
          },
        },
      );
      return res.data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadWeather = async () => {
      const result = {};

      for (let trek of treks) {
        const end = trek.routePoints?.[trek.routePoints.length - 1];
        if (!end) continue;

        const data = await fetchWeather(end.lat, end.lng);
        if (data) result[trek._id] = data;
      }

      setWeatherData(result);
    };

    if (treks.length) loadWeather();
  }, [treks]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data._id);
    };

    fetchUser();
  }, []);

  const refreshTreks = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/treks/user/${userId}`,
      );
      setTreks(res.data);
    } catch (err) {
      console.error("Refresh failed", err);
    }
  };

  const handleLike = async (trekId) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/treks/like/${trekId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    refreshTreks();
  };

  const handleSave = async (trekId) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/treks/save/${trekId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    refreshTreks();
  };

  const openLikes = (trek) => {
    setLikesData(trek.likes || []);
    setShowLikes(true);
  };

  const openComments = (trek) => {
    setSelectedCommentTrek(trek);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const token = localStorage.getItem("token");

    const res = await axios.post(
      `http://localhost:5000/api/treks/comment/${selectedCommentTrek._id}`,
      { text: newComment },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setSelectedCommentTrek({ ...selectedCommentTrek, comments: res.data });
    setNewComment("");
    refreshTreks();
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/treks/comment/${selectedCommentTrek._id}/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setSelectedCommentTrek({
      ...selectedCommentTrek,
      comments: selectedCommentTrek.comments.filter((c) => c._id !== commentId),
    });

    refreshTreks();
  };

  const handleEditComment = async (commentId) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/treks/comment/${selectedCommentTrek._id}/${commentId}`,
      { text: editedText },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setSelectedCommentTrek({
      ...selectedCommentTrek,
      comments: selectedCommentTrek.comments.map((c) =>
        c._id === commentId ? { ...c, text: editedText } : c,
      ),
    });

    setEditingCommentId(null);
    refreshTreks();
  };

  return (
    <>
      <Navbar />

      <div className="profile-page">
        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="profile-left">
            <div className="avatar">
              {user?.profilePic ? (
                <img src={`http://localhost:5000${user.profilePic}`} alt="" />
              ) : (
                <div className="avatar-placeholder">U</div>
              )}
            </div>

            <div>
              <h2>{user?.name}</h2>
              <p>Reward Point: {reward?.rewardPoints || 0}</p>
              <p>🏆 Leader Board: {reward?.leaderboardRank || "-"}</p>
              <p>Total post: {treks.length}</p>
            </div>
          </div>
        </div>

        {/* TREKS */}
        <div className="trek-section">
          <h3>Trek Shared</h3>

          <div className="trek-grid">
            {treks.map((trek) => {
              const totalCost =
                (trek.travelCost || 0) +
                (trek.foodCost || 0) +
                (trek.hotelCost || 0);

              const weather = weatherData[trek._id];

              return (
                <div className="trek-card" key={trek._id}>
                  {/* HEADER */}
                  <div className="card-header">
                    <span>{new Date(trek.createdAt).toLocaleDateString()}</span>

                    <div className="header-right">
                      {weather && (
                        <div className="weather">
                          <img
                            src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                            alt=""
                          />
                          <span>{Math.round(weather.main.temp)}°C</span>
                        </div>
                      )}
                      <FaEllipsisV />
                    </div>
                  </div>

                  {/* IMAGE */}
                  <div className="image-box">
                    {trek.photos?.length > 0 ? (
                      <img
                        src={`http://localhost:5000${trek.photos[0]}`}
                        alt=""
                      />
                    ) : (
                      <div className="placeholder">No Image</div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="card-content">
                    <h4>{trek.title}</h4>
                    <p>{trek.description}</p>

                    <div className="meta">
                      <p>Total Cost: {totalCost}</p>
                      <p>Difficulty: {trek.difficulty}</p>
                      <p>
                        {trek.days}/{trek.nights} Days/Nights
                      </p>
                      <p>
                        {trek.provinceCode}: {trek.district}
                      </p>
                    </div>

                    <button
                      className="map-btn"
                      onClick={() => setSelectedTrek(trek)}
                    >
                      View Map
                    </button>
                  </div>

                  {/* ACTIONS */}
                  <div className="actions">
                    {/* LIKE */}
                    <div className="action-item">
                      <FaHeart
                        onClick={() => handleLike(trek._id)}
                        style={{
                          color: trek.likes?.some(
                            (u) => u._id === currentUserId,
                          )
                            ? "red"
                            : "gray",
                          cursor: "pointer",
                        }}
                      />
                      <span onClick={() => openLikes(trek)}>
                        {trek.likes?.length || 0}
                      </span>
                    </div>

                    {/* COMMENT */}
                    <div
                      className="action-item"
                      onClick={() => openComments(trek)}
                    >
                      <FaRegComment />
                      <span>{trek.comments?.length || 0}</span>
                    </div>

                    {/* SAVE */}
                    <FaBookmark
                      onClick={() => handleSave(trek._id)}
                      style={{
                        color: trek.saves?.includes(currentUserId)
                          ? "gold"
                          : "gray",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== MAP MODAL ===== */}
      {selectedTrek && (
        <div className="map-modal">
          <div className="map-content">
            <button className="close-btn" onClick={() => setSelectedTrek(null)}>
              ×
            </button>

            <h3>{selectedTrek.title} Route</h3>

            <MapContainer
              center={[
                selectedTrek.routePoints[0].lat,
                selectedTrek.routePoints[0].lng,
              ]}
              zoom={13}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <Routing points={selectedTrek.routePoints} />

              <Marker
                position={[
                  selectedTrek.routePoints[0].lat,
                  selectedTrek.routePoints[0].lng,
                ]}
              >
                <Popup>Start</Popup>
              </Marker>

              <Marker
                position={[
                  selectedTrek.routePoints[selectedTrek.routePoints.length - 1]
                    .lat,
                  selectedTrek.routePoints[selectedTrek.routePoints.length - 1]
                    .lng,
                ]}
              >
                <Popup>End</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {showComments && selectedCommentTrek && (
        <div className="popup-overlay" onClick={() => setShowComments(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Comments</h3>

            <div className="comment-list">
              {selectedCommentTrek.comments.map((c) => (
                <div key={c._id} className="comment-item">
                  <div className="comment-header">
                    <img
                      src={`http://localhost:5000${c.user.profilePic}`}
                      alt=""
                    />
                    <span>{c.user.name}</span>

                    {c.user._id === currentUserId && (
                      <div className="menu">
                        <button
                          onClick={() => {
                            setEditingCommentId(c._id);
                            setEditedText(c.text);
                          }}
                        >
                          Edit
                        </button>

                        <button onClick={() => handleDeleteComment(c._id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === c._id ? (
                    <>
                      <input
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                      />
                      <button onClick={() => handleEditComment(c._id)}>
                        Save
                      </button>
                    </>
                  ) : (
                    <p>{c.text}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="comment-input">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
              />
              <button onClick={handleAddComment}>Send</button>
            </div>
          </div>
        </div>
      )}

      {showLikes && (
        <div className="popup-overlay" onClick={() => setShowLikes(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Liked by</h3>

            <div className="likes-list">
              {likesData.map((user) => (
                <div key={user._id} className="like-user">
                  <img src={`http://localhost:5000${user.profilePic}`} alt="" />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ProfileTrek;
