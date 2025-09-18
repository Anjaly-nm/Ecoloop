import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admins.css";

const AdminPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <h2 className="logo">🌿 EcoLoop Admin</h2>
        <div className="admin-profile">
          <span className="admin-name">Admin</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <ul>
            <li>
              <a href="/admin/waste-management">
                🗑 Waste Management
              </a>
            </li>
            <li>
              <a href="/admin/sellers">
                🛒 Sellers
              </a>
            </li>
            <li>
              <a href="/admin/shop">
                🏬 Shop
              </a>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <div className="admin-card">
            <h3>Welcome, EcoLoop Admin 👋</h3>
            <p>
              Use the sidebar to manage waste submissions, users, reports,  
              waste management, sellers, and the shop.  
              Keep EcoLoop running smoothly 🌍✨
            </p>
          </div>

          <div className="admin-cards-grid">
            <div className="admin-card small-card">🗑 Waste Submissions</div>
            <div className="admin-card small-card">🛒 Sellers</div>
            <div className="admin-card small-card">🏬 Shop</div>
            <div className="admin-card small-card">📊 Reports</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
