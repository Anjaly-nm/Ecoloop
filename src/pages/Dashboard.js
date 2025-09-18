import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css"; // Import updated CSS
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");

  // ✅ Fetch current user info for dynamic username
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/user/me`,
          { headers: { token } }
        );
        setUsername(res.data.user?.name || "User");
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err);
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Animated Background */}
      <ul className="background-animation">
        <li></li><li></li><li></li><li></li><li></li>
        <li></li><li></li><li></li><li></li><li></li>
      </ul>

      {/* Main Card */}
      <div className="dashboard-card">
        {/* User Info */}
        <div className="user-info">
          <span className="username">👋 Welcome, {username}</span>
        </div>

        <h1 className="dashboard-title">🌍 Welcome to ECOLOOP</h1>
        <p className="dashboard-subtitle">You are logged in successfully!</p>

        <div className="dashboard-buttons">
          <button className="btn shop-btn" onClick={() => navigate("/shop")}>
            🛒 Shop
          </button>

          <button className="btn submit-btn" onClick={() => navigate("/wastes")}>
            ♻️ Submit your waste
          </button>

          <button className="btn profile-btn" onClick={() => navigate("/profile")}>
            👤 View Profile
          </button>

          <button className="btn logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
