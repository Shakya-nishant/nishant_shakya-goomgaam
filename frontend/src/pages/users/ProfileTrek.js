import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

import "../css/ProfileTrek.css";

import {
  FaUserCircle,
  FaHeart,
  FaRegComment,
  FaBookmark,
} from "react-icons/fa";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

/* ===== ROUTING COMPONENT ===== */
const Routing = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length < 2) return;

    const waypoints = points.map((p) => L.latLng(p.lat, p.lng));

    const routingControl = L.Routing.control({
      waypoints: waypoints,
      lineOptions: { styles: [{ color: "blue", weight: 5 }] },
      createMarker: () => null,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [points, map]);

  return null;
};

const ProfileTrek = () => {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [treks, setTreks] = useState([]);
  const [selectedTrek, setSelectedTrek] = useState(null);

  useEffect(() => {
    fetchUserTreks();
  }, []);

  const fetchUserTreks = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/treks/user/${userId}`
      );
      setTreks(res.data);

      if (res.data.length > 0) {
        setUser(res.data[0].user);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openMap = (trek) => setSelectedTrek(trek);
  const closeMap = () => setSelectedTrek(null);

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-card">
          {user?.profilePic ? (
            <img
              src={`http://localhost:5000${user.profilePic}`}
              alt="profile"
              className="profile-image"
            />
          ) : (
            <FaUserCircle className="profile-icon" />
          )}

          <div className="profile-info">
            <p><b>Name:</b> {user?.name}</p>
            <p><b>Email:</b> {user?.email}</p>
            <p><b>Phone:</b> {user?.phone}</p>
            <p><b>Emergency Email:</b> {user?.emergencyEmail}</p>
            <p><b>Total Posts:</b> {treks.length}</p>
          </div>
        </div>

        <div className="trek-section">
          <h3 className="section-title">Treks Shared</h3>

          {treks.length === 0 ? (
            <p>No treks shared by this user.</p>
          ) : (
            treks.map((trek) => {
              const totalCost =
                (trek.travelCost || 0) +
                (trek.foodCost || 0) +
                (trek.hotelCost || 0);

              return (
                <div className="trek-card" key={trek._id}>
                  <div className="trek-image">
                    {trek.photos?.length > 0 ? (
                      <img
                        src={`http://localhost:5000${trek.photos[0]}`}
                        alt="trek"
                        className="trek-photo"
                      />
                    ) : (
                      <FaRegComment className="image-placeholder-icon" />
                    )}
                  </div>

                  <div className="trek-details">
                    <h4>{trek.title}</h4>
                    <p className="description">{trek.description}</p>
                    <p className="difficulty">Difficulty: {trek.difficulty}</p>
                    <p className="cost">Total Cost: ₹{totalCost}</p>
                    <p className="date">
                      Shared on: {new Date(trek.createdAt).toLocaleDateString()}
                    </p>

                    <button
                      className="view-map-btn"
                      onClick={() => openMap(trek)}
                    >
                      View Map
                    </button>
                  </div>

                  <div className="trek-actions">
                    <div><FaHeart /> 0</div>
                    <div><FaRegComment /> 0</div>
                    <FaBookmark />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />

      {/* ===== MAP MODAL ===== */}
      {selectedTrek && (
        <div className="map-modal">
          <div className="map-modal-content">
            <button className="close-btn" onClick={closeMap}>X</button>

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

              {/* ROUTE */}
              <Routing points={selectedTrek.routePoints} />

              {/* START MARKER */}
              <Marker
                position={[
                  selectedTrek.routePoints[0].lat,
                  selectedTrek.routePoints[0].lng,
                ]}
              >
                <Popup>Start</Popup>
              </Marker>

              {/* END MARKER */}
              <Marker
                position={[
                  selectedTrek.routePoints[selectedTrek.routePoints.length - 1].lat,
                  selectedTrek.routePoints[selectedTrek.routePoints.length - 1].lng,
                ]}
              >
                <Popup>End</Popup>
              </Marker>

            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTrek;