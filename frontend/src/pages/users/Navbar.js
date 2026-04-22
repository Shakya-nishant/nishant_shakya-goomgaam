import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/GoomGaam Logo.png";
import "../css/Auth.css";
import { FaComments } from "react-icons/fa";
import Notification from "./Notification";
import socket from "../../api/socket";
import axios from "axios";

const Navbar = () => {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const [profilePic, setProfilePic] = useState(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [hasChatRequest, setHasChatRequest] = useState(false);

  useEffect(() => {
    const loadProfilePic = () => {
      const pic = localStorage.getItem("profilePic");
      setProfilePic(pic);
    };
    loadProfilePic();
    window.addEventListener("storage", loadProfilePic);
    return () => window.removeEventListener("storage", loadProfilePic);
  }, []);

  const fetchChatDots = async () => {
    if (!token) return;
    try {
      const [unreadRes, requestRes] = await Promise.all([
        axios.get("http://localhost:5000/api/chat/unread", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/chat/requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setHasUnreadChat(unreadRes.data.length > 0);
      setHasChatRequest(requestRes.data.length > 0);
    } catch (err) {
      console.error("Failed to fetch chat dots", err);
    }
  };

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.id;
      if (!socket.connected) socket.connect();
      socket.emit("join", userId);
    } catch (e) {
      console.error("Token decode error", e);
    }

    fetchChatDots();
    const interval = setInterval(fetchChatDots, 30000);

    const onNewMessage = () => setHasUnreadChat(true);
    const onChatRequest = () => {
      setHasChatRequest(true);
      fetchChatDots();
    };
    const onReqUpdate = () => fetchChatDots();
    const onMsgRead = () => fetchChatDots();

    socket.on("newMessage", onNewMessage);
    socket.on("newChatRequest", onChatRequest);
    socket.on("requestUpdated", onReqUpdate);
    socket.on("messagesRead", onMsgRead);

    return () => {
      clearInterval(interval);
      socket.off("newMessage", onNewMessage);
      socket.off("newChatRequest", onChatRequest);
      socket.off("requestUpdated", onReqUpdate);
      socket.off("messagesRead", onMsgRead);
    };
  }, [token]);

  const showChatDot = hasUnreadChat || hasChatRequest;
  const fallbackText = role === "admin" ? "AD" : "U";

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="GoomGaam" className="nav-logo" />
        <span className="brand-name">GoomGaam</span>
        {role === "admin" && <span className="admin-tag">ADMIN MODE</span>}
      </div>

      <div className="nav-right">
        <Link to="/home">Home</Link>
        <Link to="/explore-trek">Explore Trek</Link>
        <Link to="/share-trek">Share Trek</Link>

        {role === "admin" && (
          <>
            <Link to="/admin/analytics" className="admin-link">
              Analytics
            </Link>
            <Link to="/users" className="admin-link">
              Users
            </Link>
          </>
        )}

        <Link
          to="/chat"
          className="nav-icon"
          title="Chat"
          onClick={() => {
            setHasUnreadChat(false);
            setHasChatRequest(false);
          }}
          style={{ position: "relative" }}
        >
          <FaComments />
          {showChatDot && <span className="chat-red-dot" />}
        </Link>

        <Notification />

        <Link to="/profile" className="profile-link" title="Profile">
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
