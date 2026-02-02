import React, { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./ShareTrek.css";

const ShareTrek = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [travelCost, setTravelCost] = useState(0);
  const [foodCost, setFoodCost] = useState(0);
  const [hotelCost, setHotelCost] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [photos, setPhotos] = useState([]);
  const [locationTags, setLocationTags] = useState("");
  const [travelTips, setTravelTips] = useState("");
  const [climateWarning, setClimateWarning] = useState(false);
  const [weatherDescription, setWeatherDescription] = useState("");

  const handlePhotoUpload = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trekData = {
      title,
      description,
      travelCost,
      foodCost,
      hotelCost,
      difficulty,
      photos,
      locationTags,
      travelTips,
      climateWarning,
      weatherDescription,
    };
    console.log("Trek Data:", trekData);
    alert("Trek submitted (mock)!");
  };

  return (
    <>
      <Navbar />
      <div className="share-trek-container">
        <div className="form-section">
          <h2>Share Your Trek</h2>
          <p>
            Help fellow adventurers discover amazing trails by sharing your
            experience
          </p>

          <form onSubmit={handleSubmit}>
            <label>Trek Title</label>
            <input
              type="text"
              placeholder="Enter your trek title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Description</label>
            <textarea
              placeholder="Describe your trekking experience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="costs">
              <input
                type="number"
                placeholder="₹ Travel Cost"
                value={travelCost}
                onChange={(e) => setTravelCost(e.target.value)}
              />
              <input
                type="number"
                placeholder="₹ Food Cost"
                value={foodCost}
                onChange={(e) => setFoodCost(e.target.value)}
              />
              <input
                type="number"
                placeholder="₹ Hotel Cost"
                value={hotelCost}
                onChange={(e) => setHotelCost(e.target.value)}
              />
            </div>

            <div className="difficulty">
              <span>Difficulty Level:</span>
              <label>
                <input
                  type="radio"
                  name="difficulty"
                  value="Easy"
                  checked={difficulty === "Easy"}
                  onChange={(e) => setDifficulty(e.target.value)}
                />{" "}
                Easy
              </label>
              <label>
                <input
                  type="radio"
                  name="difficulty"
                  value="Moderate"
                  checked={difficulty === "Moderate"}
                  onChange={(e) => setDifficulty(e.target.value)}
                />{" "}
                Moderate
              </label>
              <label>
                <input
                  type="radio"
                  name="difficulty"
                  value="Hard"
                  checked={difficulty === "Hard"}
                  onChange={(e) => setDifficulty(e.target.value)}
                />{" "}
                Hard
              </label>
            </div>

            <label>Upload Photos</label>
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg"
              onChange={handlePhotoUpload}
            />

            <label>Location Tags</label>
            <input
              type="text"
              placeholder="Add location tags (e.g. Himalaya, Kashmir)"
              value={locationTags}
              onChange={(e) => setLocationTags(e.target.value)}
            />

            <label>Travel Tips</label>
            <textarea
              placeholder="Share helpful tips for fellow trekkers..."
              value={travelTips}
              onChange={(e) => setTravelTips(e.target.value)}
            />

            <label className="climate-warning">
              <input
                type="checkbox"
                checked={climateWarning}
                onChange={(e) => setClimateWarning(e.target.checked)}
              />{" "}
              Include climate warning
            </label>

            {climateWarning && (
              <textarea
                placeholder="Describe weather conditions or warnings..."
                value={weatherDescription}
                onChange={(e) => setWeatherDescription(e.target.value)}
              />
            )}

            <button type="submit" className="submit-btn">
              Share Your Trek
            </button>
          </form>
        </div>

        <div className="preview-section">
          <h3>Live Preview</h3>
          <div className="preview-card">
            <div className="preview-image">
              {photos[0] ? (
                <img src={URL.createObjectURL(photos[0])} alt="Preview" />
              ) : (
                <div className="image-placeholder">Image Preview</div>
              )}
            </div>
            <h4>{title || "Your Trek Title"}</h4>
            <p>{description || "Your description will appear here..."}</p>
            <div className="preview-info">
              <span>Difficulty: {difficulty || "Not set"}</span>
              <span>
                Total Cost: ₹
                {Number(travelCost) + Number(foodCost) + Number(hotelCost)}
              </span>
            </div>
          </div>

          <h3>Mark Trek Route</h3>
          <div className="map-placeholder">Click to add route markers</div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ShareTrek;
