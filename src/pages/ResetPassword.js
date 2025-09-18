import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/forgot.css"; // reuse styling

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/reset-password/${token}`,
        { password }
      );
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000); // redirect after 2s
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleReset}>
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Reset Password</button>
        </form>
        {message && <p style={{ color: "lightgreen" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
