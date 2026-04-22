import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../users/Navbar";
import Footer from "../users/Footer";
import {
  FaEye,
  FaTrash,
  FaEdit,
  FaEnvelope,
  FaPhone,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaUserTag,
} from "react-icons/fa";
import "../css/UserDetail.css";
const UserDetail = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const navigate = useNavigate();
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    let filtered = users;
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/auth/delete-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter((user) => user._id !== id));
      } catch (error) {
        console.error("Error deleting user", error);
      }
    }
  };
  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const { _id, name, email, phone, emergencyEmail, role } = selectedUser;
      const res = await axios.put(
        `http://localhost:5000/api/auth/update-user/${_id}`,
        { name, email, phone, emergencyEmail, role },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updatedUser = res.data.user;
      setUsers((prev) =>
        prev.map((u) => (u._id === _id ? { ...u, ...updatedUser } : u)),
      );
      setSuccessMsg("User details updated successfully!");
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
      }, 1500);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    }
  };
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase()
      : names[0][0].toUpperCase();
  };
  if (loading) return <div className="loading">Loading users...</div>;
  return (
    <>
      <Navbar />
      <div className="user-detail-container">
        <h2>Registered Users</h2>
        <div className="filter-container">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="user-cards">
          {filteredUsers.map((user) => (
            <div className="user-card" key={user._id}>
              <div className="card-top">
                <div className="profile-pic">
                  {user.profilePic ? (
                    <img
                      src={`http://localhost:5000${user.profilePic}`}
                      alt={user.name}
                    />
                  ) : (
                    <div className="profile-initials">
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
                <h3 className="card-name">{user.name}</h3>
              </div>
              <div className="user-info-list">
                <p>
                  <FaEnvelope className="info-icon" />
                  <span>{user.email}</span>
                </p>
                <p>
                  <FaPhone className="info-icon" />
                  <span>{user.phone || "N/A"}</span>
                </p>
                <p>
                  <FaExclamationTriangle className="info-icon sos-icon" />
                  <span>{user.emergencyEmail || "N/A"}</span>
                </p>
                <p>
                  <FaCalendarAlt className="info-icon" />
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </p>
                <p>
                  <FaUserTag className="info-icon" />
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </p>
              </div>
              <div className="user-actions">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/profile/${user._id}`)}
                >
                  <FaEye /> View
                </button>
                <button className="btn-edit" onClick={() => handleEdit(user)}>
                  <FaEdit /> Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(user._id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom: "16px", textAlign: "center" }}>
              Edit User
            </h3>
            <div className="modal-profile-pic">
              {selectedUser.profilePic ? (
                <img
                  src={`http://localhost:5000${selectedUser.profilePic}`}
                  alt={selectedUser.name}
                />
              ) : (
                <div className="profile-initials">
                  {getInitials(selectedUser.name)}
                </div>
              )}
            </div>
            <form className="modal-form" onSubmit={handleSave}>
              {successMsg && <div className="success-msg">{successMsg}</div>}
              <label>
                Name:
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Contact:
                <input
                  type="text"
                  value={selectedUser.phone || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, phone: e.target.value })
                  }
                />
              </label>
              <label>
                SOS Email:
                <input
                  type="email"
                  value={selectedUser.emergencyEmail || ""}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      emergencyEmail: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Role:
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="modal-buttons">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default UserDetail;
