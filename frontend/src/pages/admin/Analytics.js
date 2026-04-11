import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../users/Navbar";
import Footer from "../users/Footer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../css/Analytics.css";
import { FaHeart, FaComment } from "react-icons/fa";

const Analytics = () => {
  const [usersData, setUsersData] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsTrend, setPostsTrend] = useState([]);
  const [topLiked, setTopLiked] = useState([]);
  const [topCommented, setTopCommented] = useState([]);
  const [reports, setReports] = useState([]);

  const [userPeriod, setUserPeriod] = useState("monthly");
  const [groupFilter, setGroupFilter] = useState("All");
  const [postPeriod, setPostPeriod] = useState("weekly");
  const [reportType, setReportType] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const token = localStorage.getItem("token");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, groupsRes, postsRes, reportsRes] = await Promise.all([
        axios.get(
          `http://localhost:5000/api/admin/analytics/users?period=${userPeriod}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        axios.get(
          `http://localhost:5000/api/admin/analytics/groups?type=${groupFilter}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        axios.get(
          `http://localhost:5000/api/admin/analytics/posts?period=${postPeriod}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        axios.get(
          `http://localhost:5000/api/admin/analytics/reports?type=${reportType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      setUsersData(usersRes.data || []);
      setGroupChats(groupsRes.data || []);
      setTotalPosts(postsRes.data?.totalPosts || 0);
      setPostsTrend(postsRes.data?.trend || []);
      setTopLiked(postsRes.data?.topLiked || []);
      setTopCommented(postsRes.data?.topCommented || []);
      setReports(reportsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics. Please login as admin.");
    } finally {
      setLoading(false);
    }
  };

  const sendWarning = async (trekId, reportId) => {
    if (!window.confirm("Send warning to trek owner?")) return;
    try {
      await axios.post(
        `http://localhost:5000/api/admin/warning/${trekId}`,
        { reportId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Warning sent successfully!");
      fetchAnalytics(); // Refresh data after warning
    } catch (err) {
      alert("Failed to send warning");
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [userPeriod, groupFilter, postPeriod, reportType, activeTab]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "users":
        return "Users Growth";
      case "group":
        return "Group Chats";
      case "posts":
        return "Total Posts";
      case "top":
        return "Top Liked & Commented Treks";
      case "reports":
        return "Reports";
      default:
        return "Analytics";
    }
  };

  const getHeaderSubtitle = () => {
    if (activeTab === "posts") return `Total: ${totalPosts} posts`;
    if (activeTab === "top")
      return "Most engaged trek posts • Top 5 in each category";
    if (activeTab === "users") return "User registration trend over time";
    if (activeTab === "group") return "All active group conversations";
    if (activeTab === "reports") return "Community reported content";
    return "Overview and statistics";
  };

  const getProfilePicUrl = (user) => {
    if (!user) return "https://via.placeholder.com/40";

    const pic = user.profilePic || user.profilePicture; // profilePic first
    if (!pic) return "https://via.placeholder.com/40";

    return pic.startsWith("http") ? pic : `http://localhost:5000${pic}`;
  };
  // Helper function for trek image
  const getTrekImageUrl = (photos) => {
    if (!photos || photos.length === 0) {
      return "https://via.placeholder.com/400x300?text=Trek";
    }
    const photo = photos[0];
    return photo.startsWith("http") ? photo : `http://localhost:5000${photo}`;
  };

  // Top 5 with proper sorting
  const top5Liked = [...topLiked]
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 5);

  const top5Commented = [...topCommented]
    .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
    .slice(0, 5);

    const handleDeletePost = async (trekId, reportId) => {
  if (!window.confirm("Are you sure you want to delete this trek post?")) return;
  try {
    await axios.delete(
      `http://localhost:5000/api/admin/delete-trek/${trekId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { reportId },
      }
    );
    alert("Trek deleted successfully!");
    fetchAnalytics();
  } catch (err) {
    alert("Failed to delete trek");
    console.error(err);
  }
};

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-xl text-gray-600">
            Loading Analytics Dashboard...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-xl mb-4">{error}</p>
            <button onClick={fetchAnalytics} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="analytics-dashboard">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Analytics Dashboard</h2>
          </div>
          <ul className="sidebar-menu">
            <li
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              Users
            </li>
            <li
              className={activeTab === "group" ? "active" : ""}
              onClick={() => setActiveTab("group")}
            >
              Group Chat
            </li>
            <li
              className={activeTab === "posts" ? "active" : ""}
              onClick={() => setActiveTab("posts")}
            >
              Total Post
            </li>
            <li
              className={activeTab === "top" ? "active" : ""}
              onClick={() => setActiveTab("top")}
            >
              Top Like & Comments
            </li>
            <li
              className={activeTab === "reports" ? "active" : ""}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Content Header */}
          <div className="content-header">
            <div className="header-left">
              <h2 className="content-title">{getHeaderTitle()}</h2>
              <p className="content-subtitle">{getHeaderSubtitle()}</p>
            </div>

            {activeTab === "top" && (
              <div className="top-header-stats">
                <div className="stat-box">
                  <span className="stat-number">{top5Liked.length}</span>
                  <span className="stat-label">Top Liked</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{top5Commented.length}</span>
                  <span className="stat-label">Top Commented</span>
                </div>
              </div>
            )}

            <div className="content-filter">
              {(activeTab === "users" || activeTab === "posts") && (
                <select
                  className="filter-select"
                  value={activeTab === "users" ? userPeriod : postPeriod}
                  onChange={(e) => {
                    if (activeTab === "users") setUserPeriod(e.target.value);
                    else setPostPeriod(e.target.value);
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}

              {activeTab === "group" && (
                <select
                  className="filter-select"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="planning">Planning</option>
                  <option value="normal">Normal</option>
                </select>
              )}

              {activeTab === "reports" && (
                <select
                  className="filter-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Fake Costing">Fake Costing</option>
                  <option value="Inaccurate Location">
                    Inaccurate Location
                  </option>
                  <option value="AI / fake image">AI / Fake Image</option>
                  <option value="Fake Information">Fake Information</option>
                  <option value="Safety Hazard">Safety Hazard</option>
                </select>
              )}
            </div>
          </div>

          {/* Data Area */}
          <div className="data-area">
            {/* Users Growth */}
            {activeTab === "users" && (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Total Posts */}
            {activeTab === "posts" && (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={postsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={4}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Group Chats */}
            {activeTab === "group" && (
              <div className="groups-grid">
                {groupChats.length === 0 ? (
                  <p className="no-data">No groups found</p>
                ) : (
                  groupChats.map((g) => {
                    const createdDate = new Date(g.createdAt);
                    const formattedDate = `${createdDate.getFullYear()}/${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
                    return (
                      <div className="group-card" key={g._id}>
                        <div className="group-pfp-container">
                          <img
                            src={
                              g.photo
                                ? `http://localhost:5000${g.photo}`
                                : "https://via.placeholder.com/120?text=Group"
                            }
                            alt={g.name}
                            className="group-card-pfp"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/120?text=Group";
                            }}
                          />
                        </div>
                        <div className="group-card-content">
                          <h3 className="group-card-name">
                            {g.name || "Unnamed Group"}
                          </h3>
                          <div className="group-card-info">
                            <p>
                              <strong>Admin:</strong> {g.admin?.name || "N/A"}
                            </p>
                            <p>
                              <strong>Members:</strong>{" "}
                              {g.participants?.length || 0}
                            </p>
                            <p>
                              <strong>Created:</strong> {formattedDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "top" && (
              <div className="top-liked-comment-container">
                {/* Most Liked */}
                <div className="top-column">
                  <h3 className="section-title">
                    ❤️ Most Liked Treks{" "}
                    <span className="count-badge">Top 5</span>
                  </h3>
                  <div className="trek-scrollable">
                    {top5Liked.length > 0 ? (
                      top5Liked.map((trek, i) => (
                        <div className="trek-card" key={i}>
                          {/* User Row */}

                          <div className="trek-user">
                            <div className="user-pfp-wrapper">
                              <img
                                src={getProfilePicUrl(trek.user)}
                                alt={trek.user?.name}
                                className="user-pfp"
                                onError={(e) =>
                                  (e.target.src =
                                    "https://via.placeholder.com/32")
                                }
                              />
                            </div>
                            <p className="user-name">
                              {trek.user?.name || "Unknown"}
                            </p>
                          </div>

                          {/* Trek Image 16:10 */}
                          <div className="trek-image">
                            <img
                              src={getTrekImageUrl(trek.photos)}
                              alt={trek.title}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/800x500?text=Trek";
                              }}
                            />
                          </div>

                          {/* Trek Title */}
                          <h4 className="trek-title">{trek.title}</h4>

                          {/* Trek Location */}
                          <p className="trek-location">
                            📍{" "}
                            {trek.province ||
                              trek.location ||
                              trek.district ||
                              "Unknown Location"}
                          </p>

                          {/* Shared Date */}
                          <p className="trek-date">
                            Shared on:{" "}
                            {new Date(trek.createdAt).toLocaleDateString(
                              "en-CA",
                            )}
                          </p>

                          {/* Stats */}
                          <div className="trek-stats">
                            <span>
                              <FaHeart className="icon" />{" "}
                              {trek.likes?.length || 0}
                            </span>
                            <span>
                              <FaComment className="icon" />{" "}
                              {trek.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-data">No liked treks found</p>
                    )}
                  </div>
                </div>

                {/* Most Commented */}
                <div className="top-column">
                  <h3 className="section-title">
                    💬 Most Commented Treks{" "}
                    <span className="count-badge">Top 5</span>
                  </h3>
                  <div className="trek-scrollable">
                    {top5Commented.length > 0 ? (
                      top5Commented.map((trek, i) => (
                        <div className="trek-card" key={i}>
                          {/* User Row */}
                          {/* User Row */}
                          <div className="trek-user">
                            <div className="user-pfp-wrapper">
                              <img
                                src={getProfilePicUrl(trek.user)}
                                alt={trek.user?.name}
                                className="user-pfp"
                                onError={(e) =>
                                  (e.target.src =
                                    "https://via.placeholder.com/32")
                                }
                              />
                            </div>
                            <p className="user-name">
                              {trek.user?.name || "Unknown"}
                            </p>
                          </div>

                          {/* Trek Image 16:10 */}
                          <div className="trek-image">
                            <img
                              src={getTrekImageUrl(trek.photos)}
                              alt={trek.title}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/800x500?text=Trek";
                              }}
                            />
                          </div>

                          {/* Trek Title */}
                          <h4 className="trek-title">{trek.title}</h4>

                          {/* Trek Location */}
                          <p className="trek-location">
                            📍{" "}
                            {trek.province ||
                              trek.location ||
                              trek.district ||
                              "Unknown Location"}
                          </p>

                          {/* Shared Date */}
                          <p className="trek-date">
                            Shared on:{" "}
                            {new Date(trek.createdAt).toLocaleDateString(
                              "en-CA",
                            )}
                          </p>

                          {/* Stats */}
                          <div className="trek-stats">
                            <span>
                              <FaHeart className="icon" />{" "}
                              {trek.likes?.length || 0}
                            </span>
                            <span>
                              <FaComment className="icon" />{" "}
                              {trek.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-data">No commented treks found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

           {activeTab === "reports" && (
  <div className="list-container">
    {reports.length === 0 ? (
      <p className="no-data">No reports found</p>
    ) : (
      reports.map((r) => (
        <div className="report-card-new" key={r._id}>
          {/* LEFT - Trek Image */}
          <div className="report-left">
            <img
              src={
                r.trekId?.photos?.[0]
                  ? `http://localhost:5000${r.trekId.photos[0]}`
                  : "https://via.placeholder.com/200x140?text=No+Image"
              }
              alt="trek"
              className="report-trek-img"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/200x140?text=No+Image";
              }}
            />
          </div>

          {/* MIDDLE - Trek & User Info */}
          <div className="report-middle">
            {/* User Row */}
            <div className="report-user-row">
              <div className="report-user-pfp-wrapper">
                <img
                  src={
                    r.trekId?.user?.profilePic
                      ? `http://localhost:5000${r.trekId.user.profilePic}`
                      : "https://via.placeholder.com/36"
                  }
                  alt={r.trekId?.user?.name}
                  className="report-user-pfp"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/36";
                  }}
                />
              </div>
              <span className="report-user-name">
                {r.trekId?.user?.name || "Unknown User"}
              </span>
            </div>

            <h4 className="report-trek-title">
              {r.trekId?.title || "Untitled Trek"}
            </h4>

            <p className="report-meta">
              📍 {r.trekId?.province || "Unknown Location"}
            </p>

            <p className="report-meta">
              🗓️ Shared:{" "}
              {r.trekId?.createdAt
                ? new Date(r.trekId.createdAt).toLocaleDateString("en-CA")
                : "N/A"}
            </p>

            <div className="report-reason-badge">
              ⚠️ {r.type}
            </div>

            <div className="report-count-badge">
              🚩 {r.reportCount || 1} Report{r.reportCount > 1 ? "s" : ""}
            </div>
          </div>

          {/* RIGHT - Actions */}
          <div className="report-right">
            <button
              className="action-btn warn-action-btn"
              onClick={() => sendWarning(r.trekId?._id || r.trekId, r._id)}
            >
              ⚠️ Send Warning
            </button>
            <button
              className="action-btn delete-action-btn"
              onClick={() => handleDeletePost(r.trekId?._id || r.trekId, r._id)}
            >
              🗑️ Delete Post
            </button>
          </div>
        </div>
      ))
    )}
  </div>
)}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Analytics;
