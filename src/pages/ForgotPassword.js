import React, { useState } from "react";
import axios from "axios";
import "../styles/login.css"; // reuse styles

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/forgot-password`,
        { email }
      );
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Error sending reset link");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@gmail.com"
          />

          <button type="submit">Send Reset Link</button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
