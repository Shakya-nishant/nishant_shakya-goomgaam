import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaBell, FaHeart, FaComment, FaComments,
  FaExclamationTriangle, FaTrash
} from "react-icons/fa";
import "../css/Notification.css";

const Notification = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      try {
        await axios.put(
          "http://localhost:5000/api/notifications/mark-read",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Navigate based on notification type
  const handleNotifClick = (n) => {
    setOpen(false);
    if (n.type === "chat_request") {
      navigate("/chat");
    } else if (n.trekId?._id) {
      navigate(`/fullpost/${n.trekId._id}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "like":         return <FaHeart className="notif-type-icon like" />;
      case "comment":      return <FaComment className="notif-type-icon comment" />;
      case "chat_request": return <FaComments className="notif-type-icon chat" />;
      case "warning":      return <FaExclamationTriangle className="notif-type-icon warning" />;
      default:             return <FaBell className="notif-type-icon" />;
    }
  };

  const getProfilePic = (sender) => {
    if (!sender?.profilePic) return null;
    return sender.profilePic.startsWith("http")
      ? sender.profilePic
      : `http://localhost:5000${sender.profilePic}`;
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24)  return `${hrs}h ago`;
    return `${days}d ago`;
  };

  // Build the notification message with bold trek title
  const renderMessage = (n) => {
    const trekTitle = n.trekTitle || n.trekId?.title;

    switch (n.type) {
      case "like":
        return (
          <>
            <span className="notif-sender">{n.sender?.name}</span>
            {" liked your post "}
            {trekTitle && (
              <span
                className="notif-trek-title-link"
                onClick={() => handleNotifClick(n)}
              >
                {trekTitle}
              </span>
            )}
          </>
        );
      case "comment":
        return (
          <>
            <span className="notif-sender">{n.sender?.name}</span>
            {" commented on your post "}
            {trekTitle && (
              <span
                className="notif-trek-title-link"
                onClick={() => handleNotifClick(n)}
              >
                {trekTitle}
              </span>
            )}
          </>
        );
      case "chat_request":
        return (
          <>
            <span className="notif-sender">{n.sender?.name}</span>
            {" sent you a chat request"}
          </>
        );
      case "warning":
        return (
          <>
            {"⚠️ Your post "}
            {trekTitle && (
              <span
                className="notif-trek-title-link"
                onClick={() => handleNotifClick(n)}
              >
                {trekTitle}
              </span>
            )}
            {" received a warning from admin due to community reports"}
          </>
        );
      default:
        return <span>{n.message}</span>;
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && <div className="notif-overlay" onClick={() => setOpen(false)} />}

      {/* Bell + Panel wrapper */}
      <div className="notif-bell-wrapper" ref={panelRef}>

        {/* Bell Button */}
        <button className="notif-bell-btn" onClick={handleOpen}>
          <FaBell />
          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Panel */}
        {open && (
          <div className="notif-panel">

            {/* Header */}
            <div className="notif-header">
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                <span className="notif-count">{notifications.length}</span>
              )}
            </div>

            {/* List */}
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <FaBell className="empty-icon" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    className={`notif-item ${!n.isRead ? "unread" : ""} ${n.type}`}
                    key={n._id}
                  >
                    {/* Left — Avatar */}
                    <div className="notif-avatar">
                      {n.type === "warning" ? (
                        <div className="avatar-warning">⚠️</div>
                      ) : getProfilePic(n.sender) ? (
                        <img
                          src={getProfilePic(n.sender)}
                          alt={n.sender?.name}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/40";
                          }}
                        />
                      ) : (
                        <div className="avatar-fallback">
                          {n.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="notif-type-badge">{getIcon(n.type)}</div>
                    </div>

                    {/* Middle — Content */}
                    <div className="notif-content">
                      <p className="notif-text">{renderMessage(n)}</p>
                      <span className="notif-time">{formatTime(n.createdAt)}</span>
                    </div>

                    {/* Right — Unread dot + Delete */}
                    <div className="notif-actions">
                      {!n.isRead && <div className="unread-dot" />}
                      <button
                        className="notif-delete-btn"
                        onClick={(e) => handleDelete(n._id, e)}
                        title="Remove"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Notification;