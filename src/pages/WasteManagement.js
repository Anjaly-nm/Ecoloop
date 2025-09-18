import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/wasteman.css";

const WasteManagement = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCollectors, setSelectedCollectors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [scheduleView, setScheduleView] = useState("approved"); // approved or assigned

  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { token } };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === "users" || activeTab === "collectors") {
          const res = await axios.get(
            "http://localhost:4321/api/user/viewusers",
            getAuthHeaders()
          );
          const allUsers = res.data;
          setUsers(allUsers.filter((u) => u.role === "User"));
          setCollectors(allUsers.filter((u) => u.role === "Collector"));
        }

        if (activeTab === "submissions" || activeTab === "schedules") {
          const res = await axios.get(
            "http://localhost:4321/api/user/viewsubmissions",
            getAuthHeaders()
          );
          setSubmissions(res.data.submissions || []);
        }

        if (activeTab === "categories") {
          const res = await axios.get(
            "http://localhost:4321/api/category/all",
            getAuthHeaders()
          );
          setCategories(res.data || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
      }
    };

    fetchData();
  }, [activeTab]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(
        `http://localhost:4321/api/user/updatestatus/${id}`,
        { status: newStatus },
        getAuthHeaders()
      );
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, status: res.data.submission.status } : s
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const goHome = () => navigate("/Adminpage");

  return (
    <div className="waste-layout">
      <header className="waste-header">
        <h2 className="logo">🌿 Waste Management</h2>
        <button className="home-btn" onClick={goHome}>
          ⬅ Go Home
        </button>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "users" ? "tab active" : "tab"}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={activeTab === "collectors" ? "tab active" : "tab"}
          onClick={() => setActiveTab("collectors")}
        >
          🚛 Collectors
        </button>
        <button
          className={activeTab === "submissions" ? "tab active" : "tab"}
          onClick={() => setActiveTab("submissions")}
        >
          📦 Submissions
        </button>
        <button
          className={activeTab === "categories" ? "tab active" : "tab"}
          onClick={() => setActiveTab("categories")}
        >
          📂 Categories
        </button>
        <button
          className={activeTab === "schedules" ? "tab active" : "tab"}
          onClick={() => setActiveTab("schedules")}
        >
          📅 Schedules
        </button>
      </div>

      <div className="tab-content">
        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h3>👥 Registered Users</h3>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>SL No.</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user, idx) => (
                    <tr key={user._id}>
                      <td>{idx + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No registered users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Collectors Tab */}
        {activeTab === "collectors" && (
          <div>
            <h3>🚛 Collectors</h3>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>SL No.</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {collectors.length > 0 ? (
                  collectors.map((col, idx) => (
                    <tr key={col._id}>
                      <td>{idx + 1}</td>
                      <td>{col.name}</td>
                      <td>{col.email}</td>
                      <td>{col.phone}</td>
                      <td>{col.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No collectors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div>
            <h3>📦 All Waste Submissions</h3>
            {submissions.length > 0 ? (
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>SL No.</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, idx) => (
                    <tr key={s._id}>
                      <td>{idx + 1}</td>
                      <td>{s.user_id?.name || "Unknown"}</td>
                      <td>{s.category || "-"}</td>
                      <td>
                        {new Date(s.scheduled_date).toLocaleDateString()}
                      </td>
                      <td
                        style={{
                          color:
                            s.status === "approved"
                              ? "green"
                              : s.status === "rejected"
                              ? "red"
                              : "orange",
                        }}
                      >
                        {s.status}
                      </td>
                      <td>
                        {s.status !== "approved" && (
                          <button
                            className="approve-btn"
                            onClick={() => updateStatus(s._id, "approved")}
                          >
                            ✅ Approve
                          </button>
                        )}
                        {s.status !== "rejected" && (
                          <button
                            className="reject-btn"
                            onClick={() => updateStatus(s._id, "rejected")}
                          >
                            ❌ Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No submissions found</p>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <h3>📂 Waste Categories</h3>
            {categories.length > 0 ? (
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>SL No.</th>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr key={cat._id}>
                      <td>{idx + 1}</td>
                      <td>{cat.name}</td>
                      <td>{cat.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No categories found</p>
            )}
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === "schedules" && (
          <div>
            <h3>📅 Collection Schedules</h3>

            {/* Toggle Buttons */}
            <div className="schedule-toggle">
              <button
                className={scheduleView === "approved" ? "active" : ""}
                onClick={() => setScheduleView("approved")}
              >
                Approved Schedules
              </button>
              <button
                className={scheduleView === "assigned" ? "active" : ""}
                onClick={() => setScheduleView("assigned")}
              >
                Assigned Schedules
              </button>
            </div>

            {/* Category Filter */}
            <div className="schedule-controls">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Plastic">Plastic</option>
                <option value="E-waste">E-waste</option>
                <option value="Organic">Organic</option>
              </select>
            </div>

            {/* Approved Schedules with single assign button per category */}
            {scheduleView === "approved" &&
              ["Plastic", "E-waste", "Organic"].map((cat) => {
                const catSubmissions = submissions.filter(
                  (s) =>
                    s.status === "approved" &&
                    !s.collector_id &&
                    (!selectedCategory || s.category === selectedCategory) &&
                    s.category === cat
                );

                if (catSubmissions.length === 0) return null;

                return (
                  <div key={cat} className="category-assign-container">
                    <h4>
                      {cat} ({catSubmissions.length})
                    </h4>

                    <div className="assign-container">
                      <select
                        value={selectedCollectors[cat] || ""}
                        onChange={(e) =>
                          setSelectedCollectors((prev) => ({
                            ...prev,
                            [cat]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select Collector</option>
                        {collectors.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="assign-btn"
                        onClick={async () => {
                          const collectorId = selectedCollectors[cat];
                          if (!collectorId)
                            return alert("Please select a collector");

                          try {
                            await Promise.all(
                              catSubmissions.map((s) =>
                                axios.put(
                                  `http://localhost:4321/api/user/assigncollector/${s._id}`,
                                  { collectorId },
                                  getAuthHeaders()
                                )
                              )
                            );
                            setSubmissions((prev) =>
                              prev.map((s) =>
                                catSubmissions.find((cs) => cs._id === s._id)
                                  ? { ...s, collector_id: collectorId }
                                  : s
                              )
                            );
                            alert(
                              `✅ Collector assigned to ${catSubmissions.length} submissions`
                            );
                          } catch (err) {
                            console.error(err);
                            alert("❌ Failed to assign collector");
                          }
                        }}
                      >
                        Assign Collector
                      </button>
                    </div>

                    <div className="schedule-cards">
                      {catSubmissions.map((s) => (
                        <div key={s._id} className="schedule-card">
                          <p>
                            <strong>User:</strong> {s.user_id?.name || "Unknown"}
                          </p>
                          <p>
                            <strong>Scheduled Date:</strong>{" "}
                            {new Date(s.scheduled_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Assigned Schedules */}
            {scheduleView === "assigned" && (
              <div className="assigned-schedules">
                {submissions.filter((s) => s.collector_id).length > 0 ? (
                  submissions
                    .filter((s) => s.collector_id)
                    .map((s) => (
                      <div key={s._id} className="assigned-card">
                        <div className="card-header">
                          <span className="category-tag">{s.category}</span>
                        </div>
                        <div className="card-body">
                          <p>
                            <strong>👤 User:</strong>{" "}
                            {s.user_id?.name || "Unknown"}
                          </p>
                          <p>
                            <strong>📅 Date:</strong>{" "}
                            {new Date(
                              s.scheduled_date
                            ).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>🚛 Collector:</strong>{" "}
                            {typeof s.collector_id === "object"
                              ? s.collector_id.name
                              : collectors.find(
                                  (c) => c._id === s.collector_id
                                )?.name || "-"}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="no-schedules">No assigned schedules</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteManagement;
