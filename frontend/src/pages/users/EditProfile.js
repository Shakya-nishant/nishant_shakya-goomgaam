import React, { useEffect, useState } from "react";
import axios from "axios";
import "./EditProfile.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyWhatsapp: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);
  const navigate = useNavigate();

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFormData((prev) => ({
          ...prev,
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          emergencyWhatsapp: res.data.emergencyWhatsapp || "",
        }));

        if (res.data.profilePic) {
          setPreviewPic(`http://localhost:5000${res.data.profilePic}`);
        }
      } catch (error) {
        alert("Failed to load profile");
      }
    };

    loadProfile();
  }, []);

  /* ================= INPUT CHANGE ================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= PROFILE PIC ================= */
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewPic(URL.createObjectURL(file));
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (formData.password || formData.confirmPassword) {
      if (!formData.oldPassword) {
        alert("Old password is required");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

    if (profilePic) data.append("profilePic", profilePic);

    try {
      const res = await axios.put(
        "http://localhost:5000/api/auth/update-profile",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      alert(res.data.message || "Profile updated successfully");
      navigate("/profile");
    } catch (error) {
      alert(error.response?.data?.message || "Error updating profile");
    }
  };

  return (
    <>
      <Navbar />

      <div className="edit-profile-container">
        <h2>Edit Profile</h2>

        <form onSubmit={handleSubmit}>
          {/* PROFILE PICTURE */}
          <div className="profile-pic-wrapper">
            <img
              src={previewPic || "https://via.placeholder.com/120"}
              alt="Profile"
              className="profile-avatar"
            />
            <label className="camera-icon">
              <FaCamera />
              <input type="file" onChange={handleProfilePicChange} />
            </label>
          </div>

          {/* USER INFO */}
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />

          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            required
          />

          <input
            name="emergencyWhatsapp"
            value={formData.emergencyWhatsapp}
            onChange={handleChange}
            placeholder="Emergency Number"
            required
          />

          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />

          {/* PASSWORD */}
          <h4>Change Password</h4>

          <input
            type="password"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            placeholder="Old Password"
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="New Password"
          />

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
          />

          <button type="submit">Update Profile</button>
        </form>
      </div>

      <Footer />
    </>
  );
};

export default EditProfile;
