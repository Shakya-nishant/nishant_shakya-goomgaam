import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
import {
  FaHeart,
  FaComment,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaTrashAlt,
  FaFlag,
} from "react-icons/fa";

const Analytics = () => {
  const navigate = useNavigate();
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
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get(
          `http://localhost:5000/api/admin/analytics/groups?type=${groupFilter}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get(
          `http://localhost:5000/api/admin/analytics/posts?period=${postPeriod}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.get(
          `http://localhost:5000/api/admin/analytics/reports?type=${reportType}`,
          { headers: { Authorization: `Bearer ${token}` } },
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
      fetchAnalytics();
    } catch (err) {
      alert("Failed to send warning");
      console.error(err);
    }
  };

  const handleDeletePost = async (trekId, reportId) => {
    if (!window.confirm("Are you sure you want to delete this trek post?"))
      return;
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/delete-trek/${trekId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reportId },
        },
      );
      alert("Trek deleted successfully!");
      fetchAnalytics();
    } catch (err) {
      alert("Failed to delete trek");
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
    const pic = user.profilePic || user.profilePicture;
    if (!pic) return "https://via.placeholder.com/40";
    return pic.startsWith("http") ? pic : `http://localhost:5000${pic}`;
  };

  const getTrekImageUrl = (photos) => {
    if (!photos || photos.length === 0)
      return "https://via.placeholder.com/400x225?text=Trek";
    const photo = photos[0];
    return photo.startsWith("http") ? photo : `http://localhost:5000${photo}`;
  };

  const top5Liked = [...topLiked]
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 5);
  const top5Commented = [...topCommented]
    .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
    .slice(0, 5);

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
    <div className="analytics-page-wrapper">
      <Navbar />
      <div className="analytics-dashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Analytics Dashboard</h2>
          </div>
          <ul className="sidebar-menu">
            {[
              { key: "users", label: "Users" },
              { key: "group", label: "Group Chat" },
              { key: "posts", label: "Total Post" },
              { key: "top", label: "Top Like & Comments" },
              { key: "reports", label: "Reports" },
            ].map(({ key, label }) => (
              <li
                key={key}
                className={activeTab === key ? "active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="main-content">
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

          <div className="data-area">
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
                <div className="top-column">
                  <h3 className="section-title">
                    <FaHeart className="section-title-icon liked-icon" />
                    Most Liked Treks
                    <span className="count-badge">Top 5</span>
                  </h3>
                  <div className="trek-scrollable">
                    {top5Liked.length > 0 ? (
                      top5Liked.map((trek, i) => (
                        <TrekCard
                          key={i}
                          trek={trek}
                          getProfilePicUrl={getProfilePicUrl}
                          getTrekImageUrl={getTrekImageUrl}
                          navigate={navigate}
                        />
                      ))
                    ) : (
                      <p className="no-data">No liked treks found</p>
                    )}
                  </div>
                </div>

                <div className="top-column">
                  <h3 className="section-title">
                    <FaComment className="section-title-icon commented-icon" />
                    Most Commented Treks
                    <span className="count-badge">Top 5</span>
                  </h3>
                  <div className="trek-scrollable">
                    {top5Commented.length > 0 ? (
                      top5Commented.map((trek, i) => (
                        <TrekCard
                          key={i}
                          trek={trek}
                          getProfilePicUrl={getProfilePicUrl}
                          getTrekImageUrl={getTrekImageUrl}
                          navigate={navigate}
                        />
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
                    <ReportCard
                      key={r._id}
                      report={r}
                      navigate={navigate}
                      onWarn={() =>
                        sendWarning(r.trekId?._id || r.trekId, r._id)
                      }
                      onDelete={() =>
                        handleDeletePost(r.trekId?._id || r.trekId, r._id)
                      }
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const TrekCard = ({ trek, getProfilePicUrl, getTrekImageUrl, navigate }) => {
  const handleUserClick = (e) => {
    e.stopPropagation();
    if (trek.user?._id) navigate(`/profile/${trek.user._id}`);
  };

  const handleCardClick = () => {
    if (trek._id) navigate(`/fullpost/${trek._id}`);
  };

  return (
    <div
      className="trek-card"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="trek-user" onClick={handleUserClick} title="View profile">
        <div className="user-pfp-wrapper">
          <img
            src={getProfilePicUrl(trek.user)}
            alt={trek.user?.name}
            className="user-pfp"
            onError={(e) => (e.target.src = "https://via.placeholder.com/40")}
          />
        </div>
        <p className="user-name">{trek.user?.name || "Unknown"}</p>
      </div>

      <div className="trek-image">
        <img
          src={getTrekImageUrl(trek.photos)}
          alt={trek.title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/800x450?text=Trek";
          }}
        />
      </div>

      <h4 className="trek-title">{trek.title}</h4>

      <p className="trek-location">
        <FaMapMarkerAlt className="trek-meta-icon" />
        {trek.province || trek.location || trek.district || "Unknown Location"}
      </p>

      <p className="trek-date">
        <FaCalendarAlt className="trek-meta-icon" />
        {new Date(trek.createdAt).toLocaleDateString("en-CA")}
      </p>

      <div className="trek-stats">
        <span>
          <FaHeart className="icon likes-icon" />
          {trek.likes?.length || 0}
        </span>
        <span>
          <FaComment className="icon comments-icon" />
          {trek.comments?.length || 0}
        </span>
      </div>
    </div>
  );
};

const ReportCard = ({ report: r, navigate, onWarn, onDelete }) => {
  const trekImageUrl = r.trekId?.photos?.[0]
    ? r.trekId.photos[0].startsWith("http")
      ? r.trekId.photos[0]
      : `http://localhost:5000${r.trekId.photos[0]}`
    : "https://via.placeholder.com/320x180?text=No+Image";

  const userPicUrl = r.trekId?.user?.profilePic
    ? r.trekId.user.profilePic.startsWith("http")
      ? r.trekId.user.profilePic
      : `http://localhost:5000${r.trekId.user.profilePic}`
    : "https://via.placeholder.com/40";

  const handleCardClick = () => {
    const trekId = r.trekId?._id || r.trekId;
    if (trekId) navigate(`/fullpost/${trekId}`);
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    const userId = r.trekId?.user?._id;
    if (userId) navigate(`/profile/${userId}`);
  };

  return (
    <div
      className="report-card-new"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="report-left">
        <img
          src={trekImageUrl}
          alt="trek"
          className="report-trek-img"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/320x180?text=No+Image";
          }}
        />
      </div>

      <div className="report-middle">
        <div
          className="report-user-row"
          onClick={handleUserClick}
          title="View profile"
          style={{ cursor: "pointer" }}
        >
          <div className="report-user-pfp-wrapper">
            <img
              src={userPicUrl}
              alt={r.trekId?.user?.name}
              className="report-user-pfp"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/40";
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
          <FaMapMarkerAlt className="report-meta-icon" />
          {r.trekId?.province || "Unknown Location"}
        </p>
        <p className="report-meta">
          <FaCalendarAlt className="report-meta-icon" />
          Shared:{" "}
          {r.trekId?.createdAt
            ? new Date(r.trekId.createdAt).toLocaleDateString("en-CA")
            : "N/A"}
        </p>

        <div className="report-badges-row">
          <div className="report-count-badge">
            <FaFlag className="badge-icon" />
            {r.reportCount || 1} Report{r.reportCount > 1 ? "s" : ""}
          </div>
          <div className="report-reason-badge">
            <FaExclamationTriangle className="badge-icon" />
            {r.type}
          </div>
        </div>
      </div>

      <div className="report-right" onClick={(e) => e.stopPropagation()}>
        <button className="action-btn warn-action-btn" onClick={onWarn}>
          <FaExclamationTriangle className="btn-icon" />
          Send Warning
        </button>
        <button className="action-btn delete-action-btn" onClick={onDelete}>
          <FaTrashAlt className="btn-icon" />
          Delete Post
        </button>
      </div>
    </div>
  );
};

export default Analytics;
