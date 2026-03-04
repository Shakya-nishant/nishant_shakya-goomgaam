import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../css/ExploreTrek.css";
import axios from "axios";
import {
  FaSearch,
  FaEllipsisV,
  FaHeart,
  FaRegComment,
  FaBookmark,
} from "react-icons/fa";

const ExploreTrek = () => {
  const [treks, setTreks] = useState([]);
  const [place, setPlace] = useState("");
  const [cost, setCost] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    fetchTreks();
  }, []);

  const fetchTreks = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/treks/all"
      );
      setTreks(res.data);
    } catch (error) {
      console.error("Error fetching treks:", error);
    }
  };

  const filteredTreks = treks.filter((trek) => {
    const totalCost =
      (trek.travelCost || 0) +
      (trek.foodCost || 0) +
      (trek.hotelCost || 0);

    const placeMatch =
      place.trim() === "" ||
      trek.locationTags
        ?.toLowerCase()
        .includes(place.toLowerCase());

    const costMatch =
      cost.trim() === "" ||
      totalCost <= Number(cost);

    const levelMatch =
      level === "" ||
      trek.difficulty === level;

    return placeMatch && costMatch && levelMatch;
  });

  return (
    <>
      <Navbar />

      <div className="explore-wrapper">
        <h1>Explore Trek</h1>

        {/* ================= FILTER SECTION ================= */}
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
              placeholder="Search by max cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div className="search-box select-box">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">Level</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* ================= TREK GRID ================= */}
        <div className="trek-grid">
          {filteredTreks.length === 0 ? (
            <p style={{ textAlign: "center" }}>No Treks Found</p>
          ) : (
            filteredTreks.map((trek) => {
              const totalCost =
                (trek.travelCost || 0) +
                (trek.foodCost || 0) +
                (trek.hotelCost || 0);

              const profilePic = trek.user?.profilePic;
              const fallbackText =
                trek.user?.name?.charAt(0)?.toUpperCase() || "U";

              return (
                <div className="trek-card" key={trek._id}>
                  
                  {/* HEADER */}
                  <div className="card-header">
                    <div className="user-info">

                      {/* ✅ PROFILE CIRCLE */}
                      <div className="profile-circle">
                        {profilePic ? (
                          <img
                            src={`http://localhost:5000${profilePic}`}
                            alt="Profile"
                            className="profile-img"
                          />
                        ) : (
                          <span className="profile-initial">
                            {fallbackText}
                          </span>
                        )}
                      </div>

                      <span>{trek.user?.name || "Unknown User"}</span>
                    </div>

                    <FaEllipsisV />
                  </div>

                  {/* TREK IMAGE */}
                  <div className="image-slider">
                    {trek.photos && trek.photos.length > 0 ? (
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

                  {/* CONTENT */}
                  <div className="card-content">
                    <h3>{trek.title}</h3>
                    <p>{trek.description}</p>

                    <div className="meta">
                      <span>Difficulty: {trek.difficulty}</span>
                      <span>Total Cost: ₹{totalCost}</span>
                      <span>Location: {trek.locationTags}</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
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
            })
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ExploreTrek;