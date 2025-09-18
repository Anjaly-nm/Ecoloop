import React, { useState, useEffect } from "react";
import "../styles/waste.css";
import { FaUserCircle, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Wastes = () => {
  const [username, setUsername] = useState("User");
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({
    category: "",
    scheduled_date: "",
  });
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("");

  const navigate = useNavigate();

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
        setUserId(res.data.user?._id);
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err);
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (activeTab === "view" && token && userId) {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/api/user/mysubmissions/${userId}`,
          { headers: { token } }
        )
        .then((res) => {
          setSubmissions(res.data || []);
        })
        .catch((err) => {
          console.error("Error fetching submissions:", err.response?.data || err);
          if (err.response?.status === 401) {
            alert("Session expired. Please login again.");
            localStorage.removeItem("token");
            navigate("/login");
          }
        });
    }
  }, [activeTab, userId, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/add`,
        { ...formData, user_id: userId },
        { headers: { token } }
      );
      alert("✅ Waste submitted successfully!");
      setFormData({ category: "", scheduled_date: "" });
      setActiveTab("view");
    } catch (err) {
      console.error("Error submitting waste:", err.response?.data || err);
      alert("❌ Failed to submit waste. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this submission?");
    if (!confirm) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/user/delete/${id}`, {
        headers: { token },
      });
      setSubmissions(submissions.filter((s) => s._id !== id));
      alert("✅ Submission deleted successfully!");
    } catch (err) {
      console.error("Error deleting submission:", err.response?.data || err);
      alert("❌ Failed to delete submission.");
    }
  };

  return (
    <div className="waste-page">
      <header className="waste-header">
        <div className="profile">
          <FaUserCircle className="profile-icon" />
          <span className="username">{username}</span>
        </div>
        <button className="home-btn" onClick={() => navigate("/dashboard")}>
          <FaHome size={20} /> Home
        </button>
      </header>

      <div className="dashboard-buttons">
        <div className="dash-card" onClick={() => setActiveTab("submit")}>
          ♻ Submit Waste
        </div>
        <div className="dash-card" onClick={() => setActiveTab("view")}>
          📄 View Submitted Wastes
        </div>
        <div className="dash-card" onClick={() => setActiveTab("schedule")}>
          📅 Scheduled Dates
        </div>
        <div className="dash-card" onClick={() => setActiveTab("ecopoints")}>
          🌱 View EcoPoints
        </div>
      </div>

      {activeTab === "submit" && (
        <div className="form-container">
          <form className="waste-form" onSubmit={handleSubmit}>
            <h2>♻ Submit your waste</h2>
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Category --</option>
              <option value="Plastic">Plastic</option>
              <option value="E-waste">E-waste</option>
              <option value="Organic">Organic</option>
              <option value="Metal">Metal</option>
            </select>

            <label>Pickup Date</label>
            <input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              required
            />

            <button type="submit" className="submit-btn">
              Submit Waste
            </button>
          </form>
        </div>
      )}

      {activeTab === "view" && (
        <div className="submissions-container">
          <h2>📄 Your Submissions</h2>
          {submissions.length > 0 ? (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>SL No.</th>
                  <th>Category</th>
                  <th>Pickup Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, index) => (
                  <tr key={s._id}>
                    <td>{index + 1}</td>
                    <td>{s.category}</td>
                    <td>{new Date(s.scheduled_date).toLocaleDateString()}</td>
                    <td className={`status ${s.status}`}>{s.status}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(s._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No submissions yet.</p>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="placeholder">Scheduled Dates Content</div>
      )}
      {activeTab === "ecopoints" && (
        <div className="placeholder">EcoPoints Content</div>
      )}
    </div>
  );
};

export default Wastes;
