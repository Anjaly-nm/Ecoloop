import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

// 🔹 Firebase imports
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // 🔹 Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/login`,
        { email, password }
      );

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // ✅ Redirect based on role (case-insensitive)
        const role = response.data.user?.role?.toLowerCase();
        if (role === "admin") {
          navigate("/Adminpage");
        } else if (role === "collector") {
          navigate("/collector"); // Collector page
        } else {
          navigate("/Dashboard"); // default for other users
        }
      } else {
        setErrorMsg("Login failed: Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error.response || error);
      setErrorMsg(error.response?.data?.message || "Login failed");
    }
  };

  // 🔹 Google Login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firebase returns ID token
      const idToken = await user.getIdToken();

      // 👉 Send token to backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/google-login`,
        { idToken }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // ✅ Redirect based on role (case-insensitive)
      const role = response.data.user?.role?.toLowerCase();
      if (role === "admin") {
        navigate("/Adminpage");
      } else if (role === "collector") {
        navigate("/collector"); // Collector page
      } else {
        navigate("/Dashboard"); // default for other users
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMsg("Google login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Get Started</h2>

        {/* Email/Password Login */}
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@gmail.com"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          {errorMsg && <p className="error">{errorMsg}</p>}

          <button type="submit">Login</button>
        </form>

        <div className="divider">or</div>

        {/* Google Login */}
        <button className="google-btn" onClick={handleGoogleLogin}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
          />
          Continue with Google
        </button>

        <p className="register-link">
          Don’t have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
