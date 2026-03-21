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
  const filteredTreks = treks.filter((trek) => {
    const totalCost =
      (trek.travelCost || 0) + (trek.foodCost || 0) + (trek.hotelCost || 0);
    const placeMatch =
      !place.trim() ||
      trek.locationTags?.toLowerCase().includes(place.toLowerCase());
    const costMatch = !cost.trim() || totalCost <= Number(cost);
    const levelMatch = !level || trek.difficulty === level;
    return placeMatch && costMatch && levelMatch;
  });

  // Current weather (using 2.5/current endpoint)
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
                  >
                    <div className="profile-circle">
                      {profilePic ? (
                        <img
                          src={`http://localhost:5000${profilePic}`}
                          alt="Profile"
                          className="profile-img"
                        />
                      ) : (
                        <span className="profile-initial">{fallbackText}</span>
                      )}
                    </div>
                    <span>{trek.user?.name}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {weather && (
                      <div
                        className="weather-trigger"
                        onClick={() => openForecast(trek)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          background: "rgba(0,0,0,0.06)",
                          transition: "background 0.2s",
                        }}
                        title="Click to see 7-day forecast"
                      >
                        <img
                          src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                          alt="weather icon"
                          style={{ width: "36px", height: "36px" }}
                        />
                        <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                          {Math.round(weather.main.temp)}°C
                        </span>
                      </div>
                    )}

                    <FaEllipsisV
                      style={{ color: "#6b7280", cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* Image & Content */}
                <div className="image-slider">
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

                <div className="card-content">
                  <h3>{trek.title}</h3>
                  <p>{trek.description}</p>
                  <div className="meta">
                    <span>Difficulty: {trek.difficulty}</span>
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

                <div className="card-actions">
                  <div>
                    <FaHeart /> 0
                  </div>
                  <div>
                    <FaRegComment /> 0
                  </div>
                  <FaBookmark />
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
              <h2>7-Day Weather Forecast</h2>
              <button className="close-btn" onClick={closeForecast}>
                ×
              </button>
            </div>

            {selectedForecast && selectedForecast.length > 0 ? (
              <div className="forecast-grid">
                {selectedForecast.map((day, index) => (
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

      <Footer />
    </>
  );
};

export default ExploreTrek;
