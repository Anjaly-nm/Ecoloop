import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/user/me`,
          { headers: { token } }
        );
        setProfile(res.data.user);
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err);
        alert("❌ Failed to load profile. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!profile) return <p className="loading">Loading profile...</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>👤 My Profile</h2>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <span>{profile.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-details">
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
          <p><strong>Address:</strong> {profile.address}</p>
          <p><strong>Joined:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate("/dashboard")}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
};

export default Profile;
