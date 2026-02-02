import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./Auth.css";

const Home = () => {
  return (
    <div className="home-container">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Your Next Adventure</h1>
          <p>
            Join thousands of trekkers sharing incredible journeys, hidden
            trails, and unforgettable experiences in nature's playground.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">Explore Treks</button>
            <button className="btn-secondary">Share Your Trek</button>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="search-section">
        <div className="search-box">
          <input type="text" placeholder="Search destination" />
          <select>
            <option>Any budget</option>
          </select>
          <select>
            <option>All levels</option>
          </select>
          <button className="btn-primary">Search</button>
        </div>
      </section>

      {/* Popular Treks */}
      <section className="section">
        <h2>Popular Treks</h2>
        <p className="section-subtitle">
          Discover the most loved trekking destinations chosen by our community
        </p>

        <div className="card-grid">
          <div className="trek-card">
            <img
              src="https://images.unsplash.com/photo-1549880338-65ddcdfd017b"
              alt=""
            />
            <h3>Everest Base Camp</h3>
            <p>Nepal • 14 days • $1,200</p>
            <span className="tag green">Challenging</span>
            <span className="rating">⭐ 4.8 (234)</span>
          </div>

          <div className="trek-card">
            <img
              src="https://images.unsplash.com/photo-1508264165352-258a6c4f06cb"
              alt=""
            />
            <h3>Inca Trail</h3>
            <p>Peru • 4 days • $800</p>
            <span className="tag yellow">Moderate</span>
            <span className="rating">⭐ 4.9 (187)</span>
          </div>

          <div className="trek-card">
            <img
              src="https://images.unsplash.com/photo-1547970810-dc1eac37d174"
              alt=""
            />
            <h3>Mount Kilimanjaro</h3>
            <p>Tanzania • 7 days • $1,500</p>
            <span className="tag red">Expert</span>
            <span className="rating">⭐ 4.7 (156)</span>
          </div>
        </div>
      </section>

      {/* Recent Stories */}
      <section className="section">
        <h2>Recent Trek Stories</h2>
        <p className="section-subtitle">
          Get inspired by amazing adventures shared by our community
        </p>

        <div className="card-grid">
          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
              alt=""
            />
            <p>Just completed an amazing sunrise trek in the Alps!</p>
            <span>❤️ 24 💬 8</span>
          </div>

          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e"
              alt=""
            />
            <p>Crystal clear reflections at Lake Serenity.</p>
            <span>❤️ 42 💬 15</span>
          </div>

          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1519681393784-d120267933ba"
              alt=""
            />
            <p>Night camping at 3000m altitude.</p>
            <span>❤️ 36 💬 12</span>
          </div>
        </div>

        <button className="btn-primary center-btn">View All Stories</button>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
