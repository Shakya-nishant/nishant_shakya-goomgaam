import React, { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./ExploreTrek.css";

const treksData = [
  {
    id: 1,
    title: "Everest Base Camp",
    description:
      "A thrilling trek to the base of the world's highest mountain.",
    level: "Hard",
    cost: "$1200",
    photo: "https://source.unsplash.com/150x150/?mountain",
    user: "John Doe",
  },
  {
    id: 2,
    title: "Annapurna Circuit",
    description: "Experience diverse landscapes and traditional villages.",
    level: "Medium",
    cost: "$900",
    photo: "https://source.unsplash.com/150x150/?hiking",
    user: "Jane Smith",
  },
  {
    id: 3,
    title: "Langtang Valley",
    description: "A serene trek through lush valleys and snowy peaks.",
    level: "Easy",
    cost: "$700",
    photo: "https://source.unsplash.com/150x150/?valley",
    user: "Mike Johnson",
  },
];

const ExploreTrek = () => {
  const [placeSearch, setPlaceSearch] = useState("");
  const [costSearch, setCostSearch] = useState("");
  const [levelSearch, setLevelSearch] = useState("");

  const filteredTreks = treksData.filter((trek) => {
    return (
      trek.title.toLowerCase().includes(placeSearch.toLowerCase()) &&
      trek.cost.toLowerCase().includes(costSearch.toLowerCase()) &&
      trek.level.toLowerCase().includes(levelSearch.toLowerCase())
    );
  });

  return (
    <>
      <Navbar />

      <div className="explore-trek-container">
        <h2>Explore Treks</h2>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by place"
            value={placeSearch}
            onChange={(e) => setPlaceSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by cost"
            value={costSearch}
            onChange={(e) => setCostSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by level"
            value={levelSearch}
            onChange={(e) => setLevelSearch(e.target.value)}
          />
        </div>

        <div className="trek-list">
          {filteredTreks.map((trek) => (
            <div className="trek-card" key={trek.id}>
              <div className="trek-photo">
                <img src={trek.photo} alt={trek.title} />
              </div>
              <div className="trek-details">
                <div className="trek-header">
                  <h3>{trek.title}</h3>
                  <span className="trek-user">{trek.user}</span>
                </div>
                <p className="trek-description">{trek.description}</p>
                <div className="trek-info">
                  <span>Level: {trek.level}</span>
                  <span>Cost: {trek.cost}</span>
                </div>
                <div className="trek-actions">
                  <button>👍 Like</button>
                  <button>💾 Save</button>
                  <button>💬 Comment</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ExploreTrek;
