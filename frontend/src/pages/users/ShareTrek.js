import React, { useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "../css/ShareTrek.css";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ---------------- ROUTE CONTROL ----------------
const RouteControl = ({ points }) => {
  const map = useMap();
  const routingControlRef = React.useRef(null);

  React.useEffect(() => {
    if (!points || points.length < 2) return;

    if (
      routingControlRef.current &&
      map &&
      map.hasLayer(routingControlRef.current)
    ) {
      map.removeControl(routingControlRef.current);
    }

    routingControlRef.current = L.Routing.control({
      waypoints: points.map((p) => L.latLng(p[0], p[1])),
      lineOptions: { styles: [{ color: "blue", weight: 4 }] },
      routeWhileDragging: false,
      draggableWaypoints: false,
      addWaypoints: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    return () => {
      if (
        routingControlRef.current &&
        map &&
        map.hasLayer(routingControlRef.current)
      ) {
        map.removeControl(routingControlRef.current);
      }
      routingControlRef.current = null;
    };
  }, [points, map]);

  return null;
};

// ---------------- LOCATION MARKER ----------------
const LocationMarker = ({ addPoint }) => {
  useMapEvents({
    click(e) {
      addPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// ---------------- MAIN COMPONENT ----------------
const ShareTrek = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [travelCost, setTravelCost] = useState("");
  const [foodCost, setFoodCost] = useState("");
  const [hotelCost, setHotelCost] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [photos, setPhotos] = useState([]);
  const [locationTags, setLocationTags] = useState("");
  const [travelTips, setTravelTips] = useState("");
  const [days, setDays] = useState("");
  const [nights, setNights] = useState("");
  const [points, setPoints] = useState([]);
  const [showFullMap, setShowFullMap] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const totalCost =
    Number(travelCost || 0) + Number(foodCost || 0) + Number(hotelCost || 0);

  // ---------------- POINT LIMIT FUNCTION ----------------
  const addPoint = (point) => {
    if (points.length >= 2) {
      alert("You have already selected 2 route points (Start and End)!");
      return;
    }
    setPoints([...points, point]);
  };

  const resetStart = () => setPoints(points.slice(1));
  const resetEnd = () => setPoints(points.slice(0, -1));

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("travelCost", travelCost);
    formData.append("foodCost", foodCost);
    formData.append("hotelCost", hotelCost);
    formData.append("difficulty", difficulty);
    formData.append("locationTags", locationTags);
    formData.append("travelTips", travelTips);
    formData.append("days", days ? Number(days) : 0);   // 0 if empty
formData.append("nights", nights ? Number(nights) : 0);
    formData.append("province", province);
    formData.append("district", district);

    if (points.length > 0)
      formData.append("routePoints", JSON.stringify(points));

    photos.forEach((photo) => formData.append("photos", photo));

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/treks/share",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // 🔥 VERY IMPORTANT
          },
        },
      );
      alert(res.data.message);

      setTitle("");
      setDescription("");
      setTravelCost("");
      setFoodCost("");
      setHotelCost("");
      setDifficulty("");
      setPhotos([]);
      setLocationTags("");
      setTravelTips("");
      setDays("");
      setNights("");
      setProvince("");
      setDistrict("");

      setPoints([]);
    } catch (error) {
      console.error(error);
      alert("Error sharing trek");
    }
  };

  // ---------------- MAP COMPONENT ----------------
  const RenderMap = () => (
    <MapContainer
      center={[27.7172, 85.324]}
      zoom={8}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {points.map((p, idx) => (
        <Marker key={idx} position={p}>
          <Popup>
            {idx === 0
              ? "Start Point"
              : idx === points.length - 1
                ? "End Point"
                : `Point ${idx + 1}`}
          </Popup>
        </Marker>
      ))}

      {points.length >= 2 && <RouteControl points={points} />}
      <LocationMarker addPoint={addPoint} />
    </MapContainer>
  );

  const getNightOptions = () => {
    if (!days) return [];
    const d = Number(days);
    return [d - 1, d, d + 1].filter((n) => n > 0);
  };

  const provinceData = {
    "Koshi Province": [
      "Taplejung",
      "Panchthar",
      "Ilam",
      "Jhapa",
      "Morang",
      "Sunsari",
      "Dhankuta",
      "Terhathum",
      "Sankhuwasabha",
      "Bhojpur",
      "Solukhumbu",
      "Khotang",
      "Okhaldhunga",
      "Udayapur",
    ],
    "Madhesh Province": [
      "Saptari",
      "Siraha",
      "Dhanusha",
      "Mahottari",
      "Sarlahi",
      "Rautahat",
      "Bara",
      "Parsa",
    ],
    "Bagmati Province": [
      "Dolakha",
      "Ramechhap",
      "Sindhuli",
      "Kavrepalanchok",
      "Sindhupalchok",
      "Kathmandu",
      "Bhaktapur",
      "Lalitpur",
      "Nuwakot",
      "Rasuwa",
      "Dhading",
      "Makwanpur",
      "Chitwan",
    ],
    "Gandaki Province": [
      "Gorkha",
      "Lamjung",
      "Tanahun",
      "Syangja",
      "Kaski",
      "Manang",
      "Mustang",
      "Myagdi",
      "Parbat",
      "Baglung",
      "Nawalpur (Nawalparasi East)",
    ],
    "Lumbini Province": [
      "Gulmi",
      "Palpa",
      "Arghakhanchi",
      "Rupandehi",
      "Kapilvastu",
      "Parasi (Nawalparasi West)",
      "Pyuthan",
      "Rolpa",
      "Eastern Rukum",
      "Dang",
      "Banke",
      "Bardiya",
    ],
    "Karnali Province": [
      "Mugu",
      "Humla",
      "Jumla",
      "Dolpa",
      "Kalikot",
      "Jajarkot",
      "Dailekh",
      "Surkhet",
      "Salyan",
      "Western Rukum",
    ],
    "Sudurpashchim Province": [
      "Bajura",
      "Bajhang",
      "Achham",
      "Doti",
      "Kailali",
      "Kanchanpur",
      "Dadeldhura",
      "Baitadi",
      "Darchula",
    ],
  };

  const provinceCode = (prov) => {
    const mapping = {
      "Koshi Province": "P1",
      "Madhesh Province": "P2",
      "Bagmati Province": "P3",
      "Gandaki Province": "P4",
      "Lumbini Province": "P5",
      "Karnali Province": "P6",
      "Sudurpashchim Province": "P7",
    };
    return mapping[prov] || prov;
  };

  return (
    <>
      <Navbar />
      <div className="share-wrapper">
        <div className="card form-card">
          <h2>Share Your Trek</h2>
          <p className="subtitle">
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
              rows="4"
              placeholder="Describe your trekking experience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="cost-grid">
              <div>
                <label>Travel Cost</label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={travelCost}
                  onChange={(e) => setTravelCost(e.target.value)}
                />
              </div>
              <div>
                <label>Food Cost</label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={foodCost}
                  onChange={(e) => setFoodCost(e.target.value)}
                />
              </div>
              <div>
                <label>Hotel Cost</label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={hotelCost}
                  onChange={(e) => setHotelCost(e.target.value)}
                />
              </div>
            </div>

            <div className="days-grid">
              <div>
                <label>Total Days</label>
                <input
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => {
                    setDays(e.target.value);
                    setNights(""); // reset nights when days change
                  }}
                />
              </div>

              <div>
                <label>Total Nights</label>
                <select
                  value={nights}
                  onChange={(e) => setNights(e.target.value)}
                  disabled={!days}
                >
                  <option value="">Select Nights</option>
                  {getNightOptions().map((n) => (
                    <option key={n} value={n}>
                      {n} Night{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label>Difficulty Level</label>
            <div className="radio-group">
              {["Easy", "Moderate", "Hard"].map((level) => (
                <label key={level} className="radio-item">
                  <input
                    type="radio"
                    value={level}
                    checked={difficulty === level}
                    onChange={(e) => setDifficulty(e.target.value)}
                  />
                  {level}
                </label>
              ))}
            </div>

            <label>Upload Photos</label>
            <div className="upload-box">
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg"
                onChange={(e) => {
                  const files = Array.from(e.target.files);

                  // Check total count
                  if (files.length + photos.length > 5) {
                    alert("You can upload up to 5 images only");
                    return;
                  }

                  // Check file size (15MB max)
                  const oversized = files.find(
                    (f) => f.size > 15 * 1024 * 1024,
                  );
                  if (oversized) {
                    alert(`"${oversized.name}" exceeds 15MB`);
                    return;
                  }

                  setPhotos([...photos, ...files]);
                }}
              />
              <span>Click to upload or drag and drop</span>
              <small>PNG, JPG up to 15MB, max 5 images</small>
            </div>

            <label>Location Tags</label>
            <input
              type="text"
              placeholder="Add location tags (e.g. Himalaya, Kashmir)"
              value={locationTags}
              onChange={(e) => setLocationTags(e.target.value)}
            />

            <div className="location-grid">
              <div>
                <label>Province</label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setDistrict("");
                  }}
                >
                  <option value="">Select Province</option>
                  {Object.keys(provinceData).map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!province}
                >
                  <option value="">Select District</option>
                  {province &&
                    provinceData[province].map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <label>Travel Tips</label>
            <textarea
              rows="3"
              placeholder="Share helpful tips for fellow trekkers..."
              value={travelTips}
              onChange={(e) => setTravelTips(e.target.value)}
            />

            <button type="submit" className="main-submit">
              Share Your Trek
            </button>
          </form>
        </div>

        <div className="right-column">
          <div className="card preview-card">
            <h3>Live Preview</h3>

            <div className="preview-images">
              {photos.length > 0 ? (
                photos.map((photo, index) => {
                  const url = URL.createObjectURL(photo);
                  return (
                    <div className="img-box" key={index}>
                      <img src={url} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-img"
                        onClick={() => {
                          URL.revokeObjectURL(url);
                          setPhotos(photos.filter((_, i) => i !== index));
                        }}
                      >
                        ✖
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="img-placeholder">No Images Selected</div>
              )}
            </div>

            <h4>{title || "Your Trek Title"}</h4>
            <p className="preview-desc">
              {description || "Your description will appear here..."}
            </p>

            <div className="preview-meta">
              <span>Difficulty: {difficulty || "Not set"}</span>
              <span>Total Cost: ₹ {totalCost}</span>
            </div>

            <div className="preview-extra">
              {days && nights && (
                <p>
                  Duration: {days} Day{days > 1 ? "s" : ""} / {nights} Night
                  {nights > 1 ? "s" : ""}
                </p>
              )}

              {province && district && (
                <p>
                  {provinceCode(province)} : {district}
                </p>
              )}
            </div>
          </div>

          <div className="card route-card">
            <h3>Mark Trek Route</h3>
            <div className="map-box">
              <RenderMap />
            </div>
            <div className="route-info">
              {points.length} point(s) selected (maximum 2)
            </div>
            <div className="route-buttons">
              <button type="button" onClick={resetStart} className="start-btn">
                Reset Start
              </button>
              <button type="button" onClick={resetEnd} className="end-btn">
                Reset End
              </button>
              <button
                type="button"
                onClick={() => setShowFullMap(true)}
                className="full-map-btn"
              >
                Full Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFullMap && (
        <div className="map-modal">
          <div className="map-modal-content">
            <button className="close-btn" onClick={() => setShowFullMap(false)}>
              X
            </button>

            <h3>Full Map View</h3>
            <div className="big-map">
              <RenderMap />
            </div>

            <div className="modal-buttons">
              <button type="button" onClick={resetStart} className="start-btn">
                Reset Start
              </button>
              <button type="button" onClick={resetEnd} className="end-btn">
                Reset End
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default ShareTrek;
