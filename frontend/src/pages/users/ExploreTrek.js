import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../css/ExploreTrek.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaEllipsisV,
  FaHeart,
  FaRegComment,
  FaBookmark,
} from "react-icons/fa";

const ExploreTrek = () => {
  const navigate = useNavigate();
  const [treks, setTreks] = useState([]);
  const [place, setPlace] = useState("");
  const [cost, setCost] = useState("");
  const [level, setLevel] = useState("");
  const [weatherData, setWeatherData] = useState({}); // current weather: trekId → object
  const [forecastData, setForecastData] = useState({}); // trekId → daily[] array
  const [activeForecastTrekId, setActiveForecastTrekId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showLikes, setShowLikes] = useState(false);
  const [likesData, setLikesData] = useState([]);

  const [showComments, setShowComments] = useState(false);
  const [selectedTrek, setSelectedTrek] = useState(null);

  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState("");

  const fetchTreks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/treks/all");
      setTreks(res.data);
    } catch (error) {
      console.error("Error fetching treks:", error);
    }
  };

  useEffect(() => {
    fetchTreks();
  }, []);

  // Filter treks
  const filteredTreks = treks
    .filter((trek) => {
      const totalCost =
        (trek.travelCost || 0) + (trek.foodCost || 0) + (trek.hotelCost || 0);

      const placeMatch =
        !place.trim() ||
        trek.locationTags?.toLowerCase().includes(place.toLowerCase());

      const costMatch = !cost.trim() || totalCost <= Number(cost);
      const levelMatch = !level || trek.difficulty === level;

      return placeMatch && costMatch && levelMatch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // newest first
    .slice(0, 15); // ⭐ show only 15

  const fetchWeather = async (lat, lon) => {
    try {
      const apiKey = "54ae666267f52c91603e09dde04400e6";
      const res = await axios.get(
        "https://api.openweathermap.org/data/2.5/weather",
        {
          params: { lat, lon, appid: apiKey, units: "metric" },
        },
      );
      return res.data;
    } catch (err) {
      console.error("Weather fetch error:", err.message);
      return null;
    }
  };

  // 7-day forecast using One Call 3.0
  const fetchForecast = async (lat, lon, trekId) => {
    if (forecastData[trekId]) return;

    try {
      const apiKey = "54ae666267f52c91603e09dde04400e6";

      const res = await axios.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        {
          params: {
            lat,
            lon,
            appid: apiKey,
            units: "metric",
          },
        },
      );
      const list = res.data.list;

      // 🔥 Convert 3-hour data → daily data
      const dailyMap = {};
      list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0]; // "2026-03-21"
        if (!dailyMap[date]) {
          dailyMap[date] = {
            temps: [],
            weather: item.weather[0],
            dt: item.dt,
          };
        }

        dailyMap[date].temps.push(item.main.temp);
      });

      // 🔥 Create final daily array (max 7 days)
      const daily = Object.keys(dailyMap)
        .slice(0, 7)
        .map((date) => {
          const temps = dailyMap[date].temps;

          return {
            dt: dailyMap[date].dt,
            temp: {
              min: Math.min(...temps),
              max: Math.max(...temps),
            },
            weather: [dailyMap[date].weather],
          };
        });

      setForecastData((prev) => ({
        ...prev,
        [trekId]: daily,
      }));

      console.log(`Forecast loaded: ${daily.length} days`);
    } catch (err) {
      console.error(
        "Forecast fetch failed:",
        err.response?.data || err.message,
      );
    }
  };

  // Load current weather for all visible treks
  useEffect(() => {
    if (!treks.length) return;

    const fetchAllTreksWeather = async () => {
      const weatherPromises = treks
        .filter((trek) => trek.routePoints?.length > 0)
        .map(async (trek) => {
          const endPoint = trek.routePoints[trek.routePoints.length - 1];
          if (!endPoint?.lat || !endPoint?.lng) return null;
          const weather = await fetchWeather(endPoint.lat, endPoint.lng);
          return weather ? { id: trek._id, weather } : null;
        });

      const results = (await Promise.all(weatherPromises)).filter(Boolean);
      const updated = {};
      results.forEach((res) => {
        updated[res.id] = res.weather;
      });
      setWeatherData((prev) => ({ ...prev, ...updated }));
    };

    fetchAllTreksWeather();
  }, [treks]);

  const formatDate = (timestamp) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const openForecast = (trek) => {
    const endPoint = trek.routePoints?.[trek.routePoints.length - 1];
    if (!endPoint?.lat || !endPoint?.lng) return;

    // Trigger forecast fetch if missing
    if (!forecastData[trek._id]) {
      fetchForecast(endPoint.lat, endPoint.lng, trek._id);
    }

    setActiveForecastTrekId(trek._id);
  };

  const closeForecast = () => {
    setActiveForecastTrekId(null);
  };

  const selectedForecast = activeForecastTrekId
    ? forecastData[activeForecastTrekId]
    : null;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserId(res.data._id);
    };

    fetchUser();
  }, []);

  const handleLike = async (trekId) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/treks/like/${trekId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    fetchTreks(); // refresh
  };

  const handleSave = async (trekId) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/treks/save/${trekId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    fetchTreks();
  };

  const openLikes = (trek) => {
    setLikesData(trek.likes);
    setShowLikes(true);
  };

  const openComments = (trek) => {
    setSelectedTrek(trek);
    setShowComments(true);
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
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/treks/comment/${selectedTrek._id}/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setSelectedTrek({
      ...selectedTrek,
      comments: selectedTrek.comments.filter((c) => c._id !== commentId),
    });
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

  return (
    <>
      <Navbar />
      <div className="explore-wrapper">
        <h1>Explore Trek</h1>

        <div className="filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div className="search-box">
            <FaSearch />
            <input
              type="number"
              placeholder="Max cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div className="search-box select-box">
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Level</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="trek-grid">
          {filteredTreks.map((trek) => {
            const totalCost =
              (trek.travelCost || 0) +
              (trek.foodCost || 0) +
              (trek.hotelCost || 0);
            const profilePic = trek.user?.profilePic;
            const fallbackText =
              trek.user?.name?.charAt(0)?.toUpperCase() || "U";
            const weather = weatherData[trek._id];

            return (
              <div className="trek-card" key={trek._id}>
                {/* Card Header */}
                <div className="card-header">
                  <div
                    className="user-info"
                    onClick={() => navigate(`/profile/${trek.user._id}`)}
                    style={{ gap: "12px", alignItems: "center" }}
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
                        <span style={{ fontSize: "15px" }}>{fallbackText}</span>
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
                        title="Click to see 7-day forecast"
                      >
                        <img
                          src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                          alt="weather icon"
                        />
                        <span>{Math.round(weather.main.temp)}°C</span>
                      </div>
                    )}
                    <FaEllipsisV className="menu-icon" />
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
                    <div className="image-placeholder">No Image Available</div>
                  )}
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <h3>{trek.title}</h3>
                  <p>{trek.description}</p>

                  <div className="meta">
                    <span>Total Cost: ₹{totalCost}</span>
                    <span>Location: {trek.locationTags}</span>
                    <span>
                      Duration: {trek.days} Day{trek.days > 1 ? "s" : ""} /{" "}
                      {trek.nights} Night{trek.nights > 1 ? "s" : ""}
                    </span>
                    <span>
                      Province: {trek.province} | District: {trek.district}
                    </span>
                    <span>
                      Shared on: {new Date(trek.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
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
                        color: trek.likes?.some((u) => u._id === userId)
                          ? "red"
                          : "gray",
                        fontSize: "18px",
                      }}
                    />
                    <span>{trek.likes?.length || 0}</span>
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
                        color: trek.saves?.includes(userId) ? "gold" : "gray",
                        fontSize: "18px",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Lightbox / Modal ──────────────────────────────────────── */}
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

      {showComments && selectedTrek && (
        <div className="popup-overlay" onClick={() => setShowComments(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Comments</h3>

            <div className="comment-list">
              {selectedTrek.comments.map((c) => (
                <div key={c._id} className="comment-item">
                  <div className="comment-header">
                    <img
                      src={`http://localhost:5000${c.user.profilePic}`}
                      alt=""
                    />
                    <span>{c.user.name}</span>

                    {/* MENU */}
                    {c.user._id === userId && (
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
                    <input
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                    />
                  ) : (
                    <p>{c.text}</p>
                  )}
                </div>
              ))}
            </div>

            {/* INPUT */}
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

export default ExploreTrek;
