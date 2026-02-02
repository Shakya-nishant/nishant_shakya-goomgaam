import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/GoomGaam Logo.png";
import "./Auth.css";

const Navbar = () => {
  const role = localStorage.getItem("role");
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const pic = localStorage.getItem("profilePic");
    if (pic) setProfilePic(pic);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="GoomGaam" className="nav-logo" />
        <span className="brand-name">GoomGaam</span>
        {role === "admin" && <span className="admin-tag">ADMIN</span>}
      </div>

      <div className="nav-right">
        {role === "user" && (
          <>
            <Link to="/home">Home</Link>
            <Link to="/explore-trek">Explore Trek</Link>
            <Link to="/share-trek">Share Trek</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/home">Home</Link>
            <Link to="/explore-trek">Explore Trek</Link>
            <Link to="/share-trek">Share Trek</Link>
            <Link to="/analytics">Analytics</Link>
            <Link to="/users">Users</Link>
          </>
        )}

        {/* ✅ CLICKABLE PROFILE ICON */}
        <Link to="/profile" className="profile-link">
          <div className="profile-circle">
            {profilePic ? (
              <img
                src={`http://localhost:5000${profilePic}`}
                alt="Profile"
                className="profile-img"
              />
            ) : role === "admin" ? (
              "A"
            ) : (
              "U"
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
