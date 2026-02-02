import React from "react";
import "./Auth.css";

const Footer = () => {
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
          <p>Popular Treks</p>
          <p>Destinations</p>
        </div>
        <div>
          <h4>Community</h4>
          <p>Share Trek</p>
          <p>Leaderboard</p>
        </div>
        <div>
          <h4>Support</h4>
          <p>Help Center</p>
          <p>Privacy Policy</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
