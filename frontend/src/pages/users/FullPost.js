import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FaHeart,
  FaRegComment,
  FaBookmark,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaMountain,
  FaClock,
  FaUtensils,
  FaCar,
  FaHotel,
  FaLightbulb,
  FaCalendarAlt,
  FaMapSigns,
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "../css/FullPost.css";

/* ── Routing sub-component ── */
const Routing = ({ points }) => {
  const map = useMap();
  const routingRef = useRef(null);

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
      router: L.Routing.osrmv1({ profile: "foot" }),
      lineOptions: { styles: [{ color: "#0ea5e9", weight: 4 }] },
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

/* ── Main Component ── */
const FullPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trek, setTrek] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const fetchTrek = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(userRes.data._id);
        const trekRes = await axios.get(
          `http://localhost:5000/api/treks/${id}`,
        );
        setTrek(trekRes.data);
      } catch (err) {
        console.error("Failed to load trek", err);
      }
    };
    fetchTrek();
  }, [id]);

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/treks/like/${trek._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const res = await axios.get(`http://localhost:5000/api/treks/${id}`);
      setTrek(res.data);
    } catch {
      alert("Failed to like trek");
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/treks/save/${trek._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const res = await axios.get(`http://localhost:5000/api/treks/${id}`);
      setTrek(res.data);
    } catch {
      alert("Failed to save trek");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/treks/comment/${trek._id}`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const res = await axios.get(`http://localhost:5000/api/treks/${id}`);
      setTrek(res.data);
      setNewComment("");
    } catch {
      alert("Failed to post comment");
    }
  };

  if (!trek)
    return (
      <div className="fp-loading">
        <div className="fp-spinner" />
        <p>Loading trek...</p>
      </div>
    );

  const isLiked = trek.likes?.some(
    (u) => (typeof u === "string" ? u : u._id) === userId,
  );
  const isSaved = trek.saves?.includes(userId);

  return (
    <>
      <Navbar />

      <div className="fp-page">
        {/* ── Back Button ── */}
        <button className="fp-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        <div className="fp-card">
          {/* ── Author Row ── */}
          <div className="fp-author">
            <img
              src={
                trek.user?.profilePic
                  ? `http://localhost:5000${trek.user.profilePic}`
                  : "https://via.placeholder.com/50"
              }
              alt="pfp"
              className="fp-author-avatar"
            />
            <div className="fp-author-info">
              <span className="fp-author-name">{trek.user?.name}</span>
              <span className="fp-author-date">
                <FaCalendarAlt style={{ fontSize: "11px" }} />
                {new Date(trek.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* ── Photo Gallery ── */}
          <div className="fp-gallery">
            {trek.photos?.length > 0 ? (
              <>
                <div className="fp-main-photo">
                  <img
                    src={`http://localhost:5000${trek.photos[activePhoto]}`}
                    alt="trek main"
                  />
                </div>
                {trek.photos.length > 1 && (
                  <div className="fp-thumbnails">
                    {trek.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={`http://localhost:5000${photo}`}
                        alt={`thumb-${i}`}
                        className={`fp-thumb ${activePhoto === i ? "active" : ""}`}
                        onClick={() => setActivePhoto(i)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="fp-no-photo">No Photos Available</div>
            )}
          </div>

          {/* ── Title & Description ── */}
          <div className="fp-body">
            <h1 className="fp-title">{trek.title}</h1>
            <p className="fp-description">{trek.description}</p>

            {/* ── Info Cards ── */}
            <div className="fp-info-grid">
              <div className="fp-info-card">
                <FaMountain className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Difficulty</span>
                  <span
                    className={`fp-difficulty-badge diff-${trek.difficulty?.toLowerCase()}`}
                  >
                    {trek.difficulty}
                  </span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaMapMarkerAlt className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Location</span>
                  <span className="fp-info-value">{trek.locationTags}</span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaClock className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Duration</span>
                  <span className="fp-info-value">
                    {trek.days}D / {trek.nights}N
                  </span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaMapSigns className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Province</span>
                  <span className="fp-info-value">{trek.province}</span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaMapMarkerAlt className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">District</span>
                  <span className="fp-info-value">{trek.district}</span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaUtensils className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Food Cost</span>
                  <span className="fp-info-value">Rs {trek.foodCost}</span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaCar className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Travel Cost</span>
                  <span className="fp-info-value">Rs {trek.travelCost}</span>
                </div>
              </div>

              <div className="fp-info-card">
                <FaHotel className="fp-info-icon" />
                <div>
                  <span className="fp-info-label">Hotel Cost</span>
                  <span className="fp-info-value">Rs {trek.hotelCost}</span>
                </div>
              </div>

              {trek.tips && (
                <div className="fp-info-card fp-info-card--full">
                  <FaLightbulb className="fp-info-icon fp-info-icon--yellow" />
                  <div>
                    <span className="fp-info-label">Tips</span>
                    <span className="fp-info-value">{trek.tips}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Action Bar ── */}
            <div className="fp-action-bar">
              <div className="fp-actions-left">
                <button
                  className={`fp-action-btn ${isLiked ? "liked" : ""}`}
                  onClick={handleLike}
                >
                  <FaHeart />
                  <span>{trek.likes?.length || 0}</span>
                </button>

                <button
                  className="fp-action-btn"
                  onClick={() => setShowComments(true)}
                >
                  <FaRegComment />
                  <span>{trek.comments?.length || 0}</span>
                </button>

                <button
                  className={`fp-action-btn ${isSaved ? "saved" : ""}`}
                  onClick={handleSave}
                >
                  <FaBookmark />
                </button>
              </div>

              {trek.routePoints?.length >= 2 && (
                <button className="fp-map-btn" onClick={() => setShowMap(true)}>
                  <FaMapMarkerAlt /> View Route
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Map Modal ── */}
      {showMap && trek.routePoints?.length > 0 && (
        <div className="fp-modal-overlay" onClick={() => setShowMap(false)}>
          <div className="fp-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fp-modal-header">
              <h3>
                <FaMapMarkerAlt /> {trek.title} — Route
              </h3>
              <button
                className="fp-modal-close"
                onClick={() => setShowMap(false)}
              >
                ×
              </button>
            </div>
            <div className="fp-map-body">
              <MapContainer
                center={[trek.routePoints[0].lat, trek.routePoints[0].lng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Routing points={trek.routePoints} />
                <Marker
                  position={[trek.routePoints[0].lat, trek.routePoints[0].lng]}
                >
                  <Popup>🟢 Start</Popup>
                </Marker>
                <Marker
                  position={[
                    trek.routePoints[trek.routePoints.length - 1].lat,
                    trek.routePoints[trek.routePoints.length - 1].lng,
                  ]}
                >
                  <Popup>🔴 End</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Comments Modal ── */}
      {showComments && (
        <div
          className="fp-modal-overlay"
          onClick={() => setShowComments(false)}
        >
          <div
            className="fp-comments-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fp-modal-header">
              <h3>
                <FaRegComment /> Comments ({trek.comments?.length || 0})
              </h3>
              <button
                className="fp-modal-close"
                onClick={() => setShowComments(false)}
              >
                ×
              </button>
            </div>

            <div className="fp-comment-list">
              {trek.comments?.length === 0 ? (
                <div className="fp-no-comments">
                  <FaRegComment
                    style={{ fontSize: "36px", color: "#cbd5e1" }}
                  />
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                trek.comments.map((c) => (
                  <div key={c._id} className="fp-comment-item">
                    <img
                      src={
                        c.user?.profilePic
                          ? `http://localhost:5000${c.user.profilePic}`
                          : "https://via.placeholder.com/40"
                      }
                      alt={c.user?.name}
                      className="fp-comment-avatar"
                    />
                    <div className="fp-comment-body">
                      <div className="fp-comment-meta">
                        <span className="fp-comment-name">{c.user?.name}</span>
                        <span className="fp-comment-time">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="fp-comment-text">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="fp-comment-input">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button onClick={handleAddComment} disabled={!newComment.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default FullPost;
