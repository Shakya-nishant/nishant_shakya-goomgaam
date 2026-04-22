import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../css/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [topLiked, setTopLiked] = useState([]);
  const [recentTreks, setRecentTreks] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosStatus, setSosStatus] = useState(null);

  useEffect(() => {
    const fetchTreks = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/treks/all");
        const treks = res.data;
        const sorted = [...treks]
          .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
          .slice(0, 3);
        setTopLiked(sorted);
        const recent = [...treks]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 9);
        setRecentTreks(recent);
      } catch (err) {
        console.error("Failed to fetch treks", err);
      }
    };
    fetchTreks();
  }, []);

  const handleSOS = () => {
    if (!window.confirm("🚨 Send SOS alert to your emergency contact?")) return;
    setSosLoading(true);
    setSosStatus(null);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setSosLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            "http://localhost:5000/api/sos",
            { location: locationUrl },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setSosStatus("success");
          setTimeout(() => setSosStatus(null), 4000);
        } catch (err) {
          console.error("SOS failed:", err);
          setSosStatus("error");
          setTimeout(() => setSosStatus(null), 4000);
        } finally {
          setSosLoading(false);
        }
      },
      (err) => {
        console.error("Location error:", err);
        alert("Failed to get your location. Please enable location access.");
        setSosLoading(false);
      },
    );
  };

  const getProfilePic = (user) => {
    if (!user?.profilePic) return null;
    return user.profilePic.startsWith("http")
      ? user.profilePic
      : `http://localhost:5000${user.profilePic}`;
  };

  const getTrekImage = (photos) => {
    if (!photos?.length)
      return "https://via.placeholder.com/400x220?text=No+Image";
    return photos[0].startsWith("http")
      ? photos[0]
      : `http://localhost:5000${photos[0]}`;
  };

  const visibleRecent = showAll ? recentTreks : recentTreks.slice(0, 3);

  const TrekCard = ({ trek }) => {
    const totalCost =
      (trek.travelCost || 0) + (trek.foodCost || 0) + (trek.hotelCost || 0);
    const profilePic = getProfilePic(trek.user);
    return (
      <div
        className="home-trek-card"
        onClick={() => navigate(`/fullpost/${trek._id}`)}
      >
        <div className="home-card-user">
          <div className="home-card-pfp-wrapper">
            {profilePic ? (
              <img
                src={profilePic}
                alt={trek.user?.name}
                className="home-card-pfp"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/36";
                }}
              />
            ) : (
              <div className="home-card-pfp-fallback">
                {trek.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <span className="home-card-username">
            {trek.user?.name || "Unknown"}
          </span>
        </div>
        <div className="home-card-image">
          <img
            src={getTrekImage(trek.photos)}
            alt={trek.title}
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/400x220?text=No+Image";
            }}
          />
        </div>
        <div className="home-card-info">
          <h3 className="home-card-title">{trek.title}</h3>
          <p className="home-card-meta">
            📍{" "}
            {trek.province ||
              trek.district ||
              trek.locationTags ||
              "Unknown Location"}
          </p>
          <p className="home-card-meta">💰 Rs {totalCost.toLocaleString()}</p>
          <p className="home-card-date">
            🗓️ {new Date(trek.createdAt).toLocaleDateString("en-CA")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <Navbar />

      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Discover Your Next Adventure</h1>
          <p>
            Join thousands of trekkers sharing incredible journeys, hidden
            trails, and unforgettable experiences in nature's playground.
          </p>
          <div className="home-hero-buttons">
            <button
              className="home-btn-primary"
              onClick={() => navigate("/explore-trek")}
            >
              Explore Treks
            </button>
            <button
              className="home-btn-secondary"
              onClick={() => navigate("/share-trek")}
            >
              Share Your Trek
            </button>
          </div>
        </div>
      </section>

      <div className="home-sos-strip">
        <div className="home-sos-strip-inner">
          <div className="home-sos-strip-text">
            <span className="home-sos-strip-title">Emergency SOS</span>
            <span className="home-sos-strip-desc">
              In distress? Send your live location to your emergency contact
              instantly.
            </span>
          </div>
          <div className="sos-wrapper">
            <button
              className={`sos-btn ${sosLoading ? "sos-loading" : ""} ${sosStatus === "success" ? "sos-success" : ""} ${sosStatus === "error" ? "sos-error" : ""}`}
              onClick={handleSOS}
              disabled={sosLoading}
              title="Send SOS to emergency contact"
            >
              {sosLoading ? (
                <span className="sos-spinner" />
              ) : sosStatus === "success" ? (
                "✓"
              ) : sosStatus === "error" ? (
                "✗"
              ) : (
                "SOS"
              )}
            </button>
            <span className="sos-label">
              {sosStatus === "success"
                ? "Alert Sent!"
                : sosStatus === "error"
                  ? "Failed"
                  : "Emergency"}
            </span>
          </div>
        </div>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">Popular Treks</h2>
        <p className="home-section-subtitle">
          Discover the most loved trekking destinations chosen by our community
        </p>
        <div className="home-card-grid">
          {topLiked.length === 0 ? (
            <p className="home-no-data">No treks found</p>
          ) : (
            topLiked.map((trek) => <TrekCard key={trek._id} trek={trek} />)
          )}
        </div>
      </section>

      <section className="home-section home-section-alt">
        <h2 className="home-section-title">Recent Trek Stories</h2>
        <p className="home-section-subtitle">
          Get inspired by amazing adventures shared by our community
        </p>
        <div className="home-card-grid">
          {visibleRecent.length === 0 ? (
            <p className="home-no-data">No treks found</p>
          ) : (
            visibleRecent.map((trek) => <TrekCard key={trek._id} trek={trek} />)
          )}
        </div>
        {recentTreks.length > 3 && (
          <div className="home-view-all-wrapper">
            <button
              className="home-btn-primary"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Show Less" : "View All Stories"}
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Home;
