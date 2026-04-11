import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../css/ProfileTrek.css"; // ← You can keep or merge later
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Import icons used in card
import { FaHeart, FaRegComment, FaBookmark, FaEllipsisV } from "react-icons/fa";

// Keep your Routing component (it's fine)
const Routing = ({ points }) => {
  const map = useMap();
  const routingRef = React.useRef(null);

  useEffect(() => {
    if (!map || !points || points.length < 2) return;

    const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch {}
      routingRef.current = null;
    }

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

    return () => {
      if (!routingRef.current) return;
      try {
        routingRef.current.getPlan().setWaypoints([]);
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
  const [forecastData, setForecastData] = useState({}); // for forecast modal
  const [activeForecastTrekId, setActiveForecastTrekId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const isOwnProfile = currentUserId === userId;
  const [viewedUserReward, setViewedUserReward] = useState({
    rewardPoints: 0,
    leaderboardRank: "-",
  });

  // Modals
  const [showLikes, setShowLikes] = useState(false);
  const [likesData, setLikesData] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [selectedTrekForComment, setSelectedTrekForComment] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [activeReportTrekId, setActiveReportTrekId] = useState(null);
  const [selectedMapTrek, setSelectedMapTrek] = useState(null);
  const [chatRequested, setChatRequested] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);

  // Fetch data
  useEffect(() => {
    fetchUserTreks();
    fetchCurrentUser();
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchViewedUserReward();
    }
  }, [userId]);

  useEffect(() => {
    console.log("USER DATA:", user);
  }, [user]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:5000/api/reward/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setUser(res.data.user); // ✅ IMPORTANT
      setViewedUserReward({
        rewardPoints: res.data.rewardPoints,
        leaderboardRank: res.data.leaderboardRank,
      });
    } catch (err) {
      console.error(err);
    }
  };
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

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  const checkExistingRequest = async () => {
    if (!currentUserId || !userId) {
      setChatRequested(false);
      setCheckingRequest(false);
      return;
    }

    setCheckingRequest(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/chat/request/status/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const exists = res.data.requestExists === true;
      setChatRequested(exists);

      console.log(`[DEBUG] Chat request exists for ${userId}: ${exists}`);
    } catch (err) {
      console.error("Chat request status check failed:", err);
      setChatRequested(false); // ← CRITICAL FIX: always default to false on error
    } finally {
      setCheckingRequest(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchViewedUserReward = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:5000/api/reward/user/${userId}`, // <-- use profile userId
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setViewedUserReward(res.data);
    } catch (err) {
      console.error("Failed to fetch reward:", err);
      setViewedUserReward({ rewardPoints: 0, leaderboardRank: "-" });
    }
  };

  // Weather (current)
  useEffect(() => {
    const loadWeather = async () => {
      const result = {};
      for (let trek of treks) {
        const end = trek.routePoints?.[trek.routePoints.length - 1];
        if (!end?.lat || !end?.lng) continue;
        try {
          const res = await axios.get(
            "https://api.openweathermap.org/data/2.5/weather",
            {
              params: {
                lat: end.lat,
                lon: end.lng,
                appid: "54ae666267f52c91603e09dde04400e6",
                units: "metric",
              },
            },
          );
          result[trek._id] = res.data;
        } catch {}
      }
      setWeatherData(result);
    };
    if (treks.length) loadWeather();
  }, [treks]);

  // Forecast fetch (same as ExploreTrek)
  const fetchForecast = async (lat, lon, trekId) => {
    if (forecastData[trekId]) return;
    try {
      const res = await axios.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        {
          params: {
            lat,
            lon,
            appid: "54ae666267f52c91603e09dde04400e6",
            units: "metric",
          },
        },
      );
      const list = res.data.list;
      const dailyMap = {};
      list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { temps: [], weather: item.weather[0], dt: item.dt };
        }
        dailyMap[date].temps.push(item.main.temp);
      });

      const daily = Object.keys(dailyMap)
        .slice(0, 7)
        .map((date) => {
          const temps = dailyMap[date].temps;
          return {
            dt: dailyMap[date].dt,
            temp: { min: Math.min(...temps), max: Math.max(...temps) },
            weather: [dailyMap[date].weather],
          };
        });

      setForecastData((prev) => ({ ...prev, [trekId]: daily }));
    } catch (err) {
      console.error("Forecast error:", err);
    }
  };

  const openForecast = (trek) => {
    const endPoint = trek.routePoints?.[trek.routePoints.length - 1];
    if (!endPoint?.lat || !endPoint?.lng) return;
    if (!forecastData[trek._id]) {
      fetchForecast(endPoint.lat, endPoint.lng, trek._id);
    }
    setActiveForecastTrekId(trek._id);
  };

  const closeForecast = () => setActiveForecastTrekId(null);

  const selectedForecast = activeForecastTrekId
    ? forecastData[activeForecastTrekId]
    : null;

  const formatDate = (timestamp) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
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
      setActiveReportTrekId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    }
  };

  const refreshTreks = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/treks/user/${userId}`,
      );
      setTreks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (trekId) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/api/treks/like/${trekId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    refreshTreks();
  };

  const handleSave = async (trekId) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/api/treks/save/${trekId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    refreshTreks();
  };

  const openLikes = (trek) => {
    setLikesData(trek.likes || []);
    setShowLikes(true);
  };

  const openComments = (trek) => {
    setSelectedTrekForComment(trek);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `http://localhost:5000/api/treks/comment/${selectedTrekForComment._id}`,
      { text: newComment },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setSelectedTrekForComment({
      ...selectedTrekForComment,
      comments: res.data,
    });
    setNewComment("");
    refreshTreks();
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");
    await axios.delete(
      `http://localhost:5000/api/treks/comment/${selectedTrekForComment._id}/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setSelectedTrekForComment({
      ...selectedTrekForComment,
      comments: selectedTrekForComment.comments.filter(
        (c) => c._id !== commentId,
      ),
    });
    refreshTreks();
  };

  const handleEditComment = async (commentId) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5000/api/treks/comment/${selectedTrekForComment._id}/${commentId}`,
      { text: editedText },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setSelectedTrekForComment({
      ...selectedTrekForComment,
      comments: selectedTrekForComment.comments.map((c) =>
        c._id === commentId ? { ...c, text: editedText } : c,
      ),
    });
    setEditingCommentId(null);
    refreshTreks();
  };

  const handleSendChatRequest = async () => {
    if (!userId || isOwnProfile || chatRequested) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/chat/request",
        { to: userId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setChatRequested(true);
      alert("Chat request sent successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send chat request";

      if (
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("request already")
      ) {
        setChatRequested(true);
        alert("Request already sent or received from this user.");
      } else {
        alert(msg);
      }
      console.error(err);
    }
  };

  useEffect(() => {
    checkExistingRequest();
  }, [userId, currentUserId]);

  useEffect(() => {
    setChatRequested(false);
    setCheckingRequest(true);
  }, [userId]);

  useEffect(() => {
    const handleFocus = () => {
      checkExistingRequest();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [currentUserId, userId]);

  const totalCost = (trek) =>
    (trek.travelCost || 0) + (trek.foodCost || 0) + (trek.hotelCost || 0);

  return (
    <>
      <Navbar />
      <div className="profile-page">
        {/* Profile Header */}
        {/* NEW PROFILE CARD */}
        <div className="profile-card">
          {/* LEFT COLUMN */}
          <div className="profile-col card left-col">
            <div className="profile-left">
              <div className="avatar">
                {user?.profilePic ? (
                  <img
                    src={`http://localhost:5000${user.profilePic}`}
                    alt={user?.name}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              <div className="profile-info">
                <h2>{user?.name}</h2>
                <p className="joined-date">
                  Joined:{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>

                {!isOwnProfile && (
                  <button
                    className="chat-request-btn"
                    onClick={handleSendChatRequest}
                    disabled={chatRequested || checkingRequest}
                  >
                    {checkingRequest
                      ? "Checking..."
                      : chatRequested
                        ? "Request Sent"
                        : "Chat Request"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="profile-col card middle-col">
            <h3>Reward Points</h3>
            <div className="big-stat">
              {viewedUserReward?.rewardPoints || 0}
            </div>

            <p className="rank-text">
              Rank: <strong>#{viewedUserReward?.leaderboardRank || "-"}</strong>
            </p>
          </div>

          {/* RIGHT COLUMN */}
          <div className="profile-col card right-col">
            <h3>Total Posts</h3>
            <div className="big-stat">{treks.length}</div>
          </div>
        </div>

        {/* Trek Section */}
        <div className="trek-section">
          <h3>Trek Shared</h3>
          <div className="trek-grid">
            {treks.map((trek) => {
              const weather = weatherData[trek._id];
              const profilePic = trek.user?.profilePic;
              const fallbackText =
                trek.user?.name?.charAt(0)?.toUpperCase() || "U";

              return (
                <div className="trek-card" key={trek._id}>
                  {/* Card Header - Same as ExploreTrek */}
                  <div className="card-header">
                    <div
                      className="user-info"
                      onClick={() =>
                        window.open(`/profile/${trek.user._id}`, "_self")
                      }
                      style={{
                        gap: "12px",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="profile-circle"
                        style={{ width: "40px", height: "40px" }}
                      >
                        {profilePic ? (
                          <img
                            src={`http://localhost:5000${profilePic}`}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "15px" }}>
                            {fallbackText}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "17px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {trek.user?.name}
                      </span>
                    </div>

                    <div className="header-right">
                      {weather && (
                        <div
                          className="weather-trigger"
                          onClick={() => openForecast(trek)}
                          title="Click to see forecast"
                        >
                          <img
                            src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                            alt="weather"
                          />
                          <span>{Math.round(weather.main.temp)}°C</span>
                        </div>
                      )}

                      <div
                        className="menu-wrapper"
                        style={{ position: "relative" }}
                      >
                        <FaEllipsisV
                          className="menu-icon"
                          onClick={() =>
                            setActiveReportTrekId((prev) =>
                              prev === trek._id ? null : trek._id,
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        {activeReportTrekId === trek._id && (
                          <div className="report-card">
                            <p style={{ textAlign: "center" }}>
                              <b>Report Trek</b>
                            </p>
                            <ul>
                              <li
                                onClick={() =>
                                  handleReport(trek._id, "Fake Costing")
                                }
                              >
                                Fake Costing
                              </li>
                              <li
                                onClick={() =>
                                  handleReport(trek._id, "Inaccurate Location")
                                }
                              >
                                Inaccurate Location
                              </li>
                              <li
                                onClick={() =>
                                  handleReport(trek._id, "AI / fake image")
                                }
                              >
                                AI / fake image
                              </li>
                              <li
                                onClick={() =>
                                  handleReport(trek._id, "Fake Information")
                                }
                              >
                                Fake Information
                              </li>
                              <li
                                onClick={() =>
                                  handleReport(trek._id, "Safety Hazard")
                                }
                              >
                                Safety Hazard
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="image-wrapper">
                    {trek.photos?.length > 0 ? (
                      <img
                        src={`http://localhost:5000${trek.photos[0]}`}
                        alt="trek"
                        className="trek-image"
                      />
                    ) : (
                      <div className="image-placeholder">
                        No Image Available
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="card-content">
                    <h3>{trek.title}</h3>
                    <p>{trek.description}</p>
                    <div className="meta">
                      <span>Total Cost: ₹{totalCost(trek)}</span>
                      <span>Location: {trek.locationTags}</span>
                      <span>
                        Duration: {trek.days} Day{trek.days > 1 ? "s" : ""} /{" "}
                        {trek.nights} Night{trek.nights > 1 ? "s" : ""}
                      </span>
                      <span>
                        Province: {trek.province} | District: {trek.district}
                      </span>
                      <span>
                        Shared on:{" "}
                        {new Date(trek.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Same as ExploreTrek */}
                  <div
                    className="card-actions"
                    style={{ display: "flex", gap: "18px" }}
                  >
                    <div
                      onClick={() => handleLike(trek._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaHeart
                        style={{
                          color: trek.likes?.some(
                            (u) => u._id === currentUserId,
                          )
                            ? "red"
                            : "gray",
                          fontSize: "18px",
                        }}
                      />
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          openLikes(trek);
                        }}
                      >
                        {trek.likes?.length || 0}
                      </span>
                    </div>

                    <div
                      onClick={() => openComments(trek)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaRegComment style={{ fontSize: "18px" }} />
                      <span>{trek.comments?.length || 0}</span>
                    </div>

                    <div
                      onClick={() => handleSave(trek._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaBookmark
                        style={{
                          color: trek.saves?.includes(currentUserId)
                            ? "gold"
                            : "gray",
                          fontSize: "18px",
                        }}
                      />
                    </div>

                    <button
                      className="map-btn"
                      onClick={() => setSelectedMapTrek(trek)}
                      style={{ marginLeft: "auto", fontSize: "13px" }}
                    >
                      View Map
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forecast Modal - Same as ExploreTrek */}
      {activeForecastTrekId && (
        <div className="forecast-modal-overlay" onClick={closeForecast}>
          <div className="forecast-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forecast-header">
              <h2>6 Day Weather Forecast</h2>
              <button className="close-btn" onClick={closeForecast}>
                ×
              </button>
            </div>
            {selectedForecast && selectedForecast.length > 0 ? (
              <div className="forecast-grid">
                {selectedForecast.slice(0, 6).map((day, index) => (
                  <div key={index} className="forecast-day">
                    <p className="day-name">{formatDate(day.dt)}</p>
                    <img
                      src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt={day.weather[0].description}
                      className="forecast-icon"
                    />
                    <p className="temp-range">
                      <strong>{Math.round(day.temp.max)}°</strong> /{" "}
                      {Math.round(day.temp.min)}°
                    </p>
                    <p className="description">{day.weather[0].description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="loading">Loading forecast...</div>
            )}
          </div>
        </div>
      )}

      {/* Map Modal */}
      {selectedMapTrek && (
        <div className="map-modal">
          <div className="map-content">
            <button
              className="close-btn"
              onClick={() => setSelectedMapTrek(null)}
            >
              ×
            </button>
            <h3>{selectedMapTrek.title} Route</h3>
            <MapContainer
              center={[
                selectedMapTrek.routePoints[0].lat,
                selectedMapTrek.routePoints[0].lng,
              ]}
              zoom={13}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Routing points={selectedMapTrek.routePoints} />
              <Marker
                position={[
                  selectedMapTrek.routePoints[0].lat,
                  selectedMapTrek.routePoints[0].lng,
                ]}
              >
                <Popup>Start</Popup>
              </Marker>
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
            </MapContainer>
          </div>
        </div>
      )}

      {/* Likes & Comments modals (same as before, just updated variable name) */}
      {showLikes && (
        <div className="popup-overlay" onClick={() => setShowLikes(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Liked by</h3>
            <div className="likes-list">
              {likesData.map((u) => (
                <div key={u._id} className="like-user">
                  <img src={`http://localhost:5000${u.profilePic}`} alt="" />
                  <span>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showComments && selectedTrekForComment && (
        <div className="popup-overlay" onClick={() => setShowComments(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Comments</h3>
            <div className="comment-list">
              {selectedTrekForComment.comments.map((c) => (
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

      <Footer />
    </>
  );
};

export default ProfileTrek;
