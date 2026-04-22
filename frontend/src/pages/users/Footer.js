import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Auth.css";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-left">
        <h3>GoomGaam</h3>
        <p>
          Connecting adventurers worldwide through shared trekking experiences.
        </p>
      </div>
      <div className="footer-right">
        <div>
          <h4>Explore</h4>
          <p onClick={() => navigate("/explore-trek")}>Explore Treks</p>
          <p onClick={() => navigate("/home")}>Popular Treks</p>
        </div>
        <div>
          <h4>Community</h4>
          <p onClick={() => navigate("/share-trek")}>Share Trek</p>
          <p onClick={() => navigate("/profile")}>My Profile</p>
          <p onClick={() => navigate("/chat")}>Chat</p>
        </div>
        <div>
          <h4>Account</h4>
          <p onClick={() => navigate("/edit-profile")}>Edit Profile</p>
          <p onClick={() => navigate("/login")}>Login</p>
          <p onClick={() => navigate("/signup")}>Sign Up</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
