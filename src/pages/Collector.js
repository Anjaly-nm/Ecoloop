import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "../styles/collector.css";

const CollectorDashboardModern = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  const USER_API = "http://localhost:4321/api/collector/";       // fetch pickups
  const COLLECTOR_API = "http://localhost:4321/api/collector"; // update status

  // Check logged-in collector
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role.toLowerCase() !== "collector") {
      navigate("/");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  // Fetch pickups
  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(USER_API, { headers: { token } });
        // Ensure category name is available
        const formatted = res.data.map(p => ({
          ...p,
          categoryName: p.category_id?.name || "Unknown"
        }));
        setPickups(formatted);
      } catch (err) {
        console.error("Error fetching pickups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPickups();
  }, []);

  // Update pickup status
  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${COLLECTOR_API}/${id}`, { status }, { headers: { token } });

      // Update frontend state
      setPickups(prev =>
        prev.map(p => (p._id === id ? { ...p, status } : p))
      );
    } catch (err) {
      console.error("Error updating pickup status:", err);
      alert("Failed to update status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const collectedCount = pickups.filter(p => p.status === "collected").length;
  const pendingCount = pickups.filter(p => p.status === "pending").length;

  if (loading) return <p className="loading">Loading dashboard...</p>;

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">EcoLoop</div>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Profile</li>
            <li onClick={handleLogout}><FaSignOutAlt /> Logout</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="greeting">
            <h2>Welcome, {user?.name}</h2>
            <p>Here is your pickup overview</p>
          </div>
          <div className="stats-cards">
            <div className="stat-card total">
              <p>Total Pickups</p>
              <h3>{pickups.length}</h3>
            </div>
            <div className="stat-card collected">
              <p>Collected</p>
              <h3>{collectedCount}</h3>
            </div>
            <div className="stat-card pending">
              <p>Pending</p>
              <h3>{pendingCount}</h3>
            </div>
          </div>
        </header>

        {pickups.length === 0 ? (
          <p className="no-pickups">No pickups assigned yet.</p>
        ) : (
          <table className="pickup-list">
            <thead>
              <tr>
                <th>User</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map(pickup => (
                <tr key={pickup._id}>
                  <td>{pickup.user_id?.name || "N/A"}</td>
                  <td>{pickup.categoryName}</td>
                  <td>{pickup.quantity} kg</td>
                  <td>{new Date(pickup.scheduled_date).toLocaleDateString()}</td>
                  <td className={`status ${pickup.status}`}>{pickup.status}</td>
                  <td>
                    <button className="btn collected" onClick={() => updateStatus(pickup._id, "collected")}>Mark Collected</button>
                    <button className="btn pending" onClick={() => updateStatus(pickup._id, "pending")}>Mark Pending</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default CollectorDashboardModern;
