import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/GoomGaam Logo.png";
import "./Auth.css";

const Navbar = () => {
  const role = localStorage.getItem("role");
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const loadProfilePic = () => {
      const pic = localStorage.getItem("profilePic");
      setProfilePic(pic);
    };

    loadProfilePic();

    // Listen for profilePic changes (login / update profile)
    window.addEventListener("storage", loadProfilePic);

    return () => {
      window.removeEventListener("storage", loadProfilePic);
    };
  }, []);

  const fallbackText = role === "admin" ? "AD" : "U";

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

        {/* PROFILE ICON */}
        <Link to="/profile" className="profile-link">
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
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
